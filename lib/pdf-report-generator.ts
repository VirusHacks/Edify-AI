import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ResumeAnalysisResult } from './resume-analysis-prompt';

export async function generateResumeReportPDF(
  analysisResult: ResumeAnalysisResult,
  metadata: {
    analysisId: string;
    jobTitle?: string;
    companyName?: string;
    generatedAt: string;
  }
): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // US Letter size
  const { width, height } = page.getSize();

  // Fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let yPosition = height - 50; // Start from top

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    x: number,
    y: number,
    size: number,
    font: any,
    color = rgb(0, 0, 0),
    maxWidth?: number
  ): number => {
    page.drawText(text, {
      x,
      y,
      size,
      font,
      color,
      maxWidth: maxWidth || width - x - 50,
    });
    return y - size - 5;
  };

  // Helper function to add section header
  const addSectionHeader = (title: string, y: number): number => {
    page.drawText(title, {
      x: 50,
      y,
      size: 18,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.5),
    });
    // Draw underline
    page.drawLine({
      start: { x: 50, y: y - 5 },
      end: { x: width - 50, y: y - 5 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    return y - 25;
  };

  // Add title
  yPosition = addText(
    'Resume Optimization Report',
    50,
    yPosition,
    24,
    helveticaBold,
    rgb(0.2, 0.2, 0.5)
  );
  yPosition -= 10;

  // Add metadata
  if (metadata.jobTitle) {
    yPosition = addText(
      `Job Title: ${metadata.jobTitle}`,
      50,
      yPosition,
      10,
      helvetica
    );
  }
  if (metadata.companyName) {
    yPosition = addText(
      `Company: ${metadata.companyName}`,
      50,
      yPosition,
      10,
      helvetica
    );
  }
  yPosition = addText(
    `Generated: ${metadata.generatedAt}`,
    50,
    yPosition,
    10,
    helveticaOblique,
    rgb(0.5, 0.5, 0.5)
  );
  yPosition -= 20;

  // Add overall score
  const scoreColor =
    analysisResult.overallScore >= 75
      ? rgb(0, 0.7, 0)
      : analysisResult.overallScore >= 50
      ? rgb(1, 0.6, 0)
      : rgb(1, 0, 0);

  yPosition = addSectionHeader('Overall Assessment', yPosition);
  yPosition = addText(
    `Overall Resume Score: ${analysisResult.overallScore}/100`,
    50,
    yPosition,
    14,
    helveticaBold,
    scoreColor
  );
  yPosition = addText(
    `ATS Match Percentage: ${analysisResult.atsMatchPercentage}%`,
    50,
    yPosition,
    14,
    helveticaBold,
    scoreColor
  );
  yPosition -= 15;

  // Add strengths
  if (analysisResult.strengths && analysisResult.strengths.length > 0) {
    yPosition = addSectionHeader('Key Strengths', yPosition);
    analysisResult.strengths.forEach((strength) => {
      yPosition = addText(`✓ ${strength}`, 50, yPosition, 10, helvetica);
    });
    yPosition -= 10;
  }

  // Add weaknesses
  if (analysisResult.weaknesses && analysisResult.weaknesses.length > 0) {
    yPosition = addSectionHeader('Areas for Improvement', yPosition);
    analysisResult.weaknesses.forEach((weakness) => {
      yPosition = addText(`• ${weakness}`, 50, yPosition, 10, helvetica);
    });
    yPosition -= 10;
  }

  // Add section recommendations
  if (
    analysisResult.sectionRecommendations &&
    analysisResult.sectionRecommendations.length > 0
  ) {
    yPosition = addSectionHeader('Section-wise Recommendations', yPosition);
    analysisResult.sectionRecommendations.forEach((rec) => {
      // Check if we need a new page
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([612, 792]);
        page = newPage;
        yPosition = height - 50;
      }

      yPosition = addText(
        `${rec.section} [${rec.priority.toUpperCase()}]`,
        50,
        yPosition,
        12,
        helveticaBold
      );
      yPosition = addText(`Issue: ${rec.issue}`, 50, yPosition, 10, helvetica);
      yPosition = addText(
        `Suggestion: ${rec.suggestion}`,
        50,
        yPosition,
        10,
        helvetica
      );
      yPosition -= 10;
    });
  }

  // Add keyword suggestions
  if (analysisResult.missingKeywords && analysisResult.missingKeywords.length > 0) {
    if (yPosition < 150) {
      const newPage = pdfDoc.addPage([612, 792]);
      page = newPage;
      yPosition = height - 50;
    }

    yPosition = addSectionHeader('Missing Keywords', yPosition);
    const keywordsText = analysisResult.missingKeywords.join(', ');
    yPosition = addText(keywordsText, 50, yPosition, 10, helvetica);
    yPosition -= 15;
  }

  if (analysisResult.suggestedKeywords && analysisResult.suggestedKeywords.length > 0) {
    if (yPosition < 150) {
      const newPage = pdfDoc.addPage([612, 792]);
      page = newPage;
      yPosition = height - 50;
    }

    yPosition = addSectionHeader('Suggested Keywords to Add', yPosition);
    const keywordsText = analysisResult.suggestedKeywords.join(', ');
    yPosition = addText(keywordsText, 50, yPosition, 10, helvetica);
    yPosition -= 15;
  }

  // Add AI-generated summary
  if (analysisResult.aiGeneratedSummary) {
    if (yPosition < 200) {
      const newPage = pdfDoc.addPage([612, 792]);
      page = newPage;
      yPosition = height - 50;
    }

    yPosition = addSectionHeader('AI-Generated Summary', yPosition);
    yPosition = addText(
      analysisResult.aiGeneratedSummary,
      50,
      yPosition,
      10,
      helvetica
    );
    yPosition -= 15;
  }

  // Add rewritten summary if available
  if (analysisResult.rewrittenSummary) {
    if (yPosition < 200) {
      const newPage = pdfDoc.addPage([612, 792]);
      page = newPage;
      yPosition = height - 50;
    }

    yPosition = addSectionHeader('Improved Summary', yPosition);
    yPosition = addText(
      analysisResult.rewrittenSummary,
      50,
      yPosition,
      10,
      helvetica
    );
    yPosition -= 15;
  }

  // Add next steps
  if (analysisResult.nextSteps && analysisResult.nextSteps.length > 0) {
    if (yPosition < 150) {
      const newPage = pdfDoc.addPage([612, 792]);
      page = newPage;
      yPosition = height - 50;
    }

    yPosition = addSectionHeader('Next Steps to Improve Your Resume', yPosition);
    analysisResult.nextSteps.forEach((step, index) => {
      yPosition = addText(
        `${index + 1}. ${step}`,
        50,
        yPosition,
        10,
        helvetica
      );
    });
  }

  // Return PDF bytes
  return await pdfDoc.save();
}


// Report generation optimized

// Report generation optimized

// Report generation optimized
