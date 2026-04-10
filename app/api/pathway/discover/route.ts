import { NextRequest, NextResponse } from 'next/server'
import { generatePathway } from '@/configs/ai-models'

interface DiscoveryData {
  likedItems: { text: string; score: number; category: string }[]
  dislikedItems: string[]
  totalSwipes: number
}

interface PathwayRecommendation {
  career: string
  matchScore: number
  reason: string
  keySkills: string[]
  estimatedTime: string
  marketDemand: 'high' | 'medium' | 'growing'
  description: string
}

// Domain to career mapping
const DOMAIN_CAREERS: Record<string, string[]> = {
  'ai': ['Machine Learning Engineer', 'AI Researcher', 'Data Scientist'],
  'ml': ['Machine Learning Engineer', 'Data Scientist', 'MLOps Engineer'],
  'data-science': ['Data Scientist', 'Data Analyst', 'Business Intelligence Analyst'],
  'analytics': ['Data Analyst', 'Business Analyst', 'Product Analyst'],
  'business-intelligence': ['Business Intelligence Analyst', 'Data Engineer', 'Analytics Engineer'],
  'web-development': ['Full Stack Developer', 'Frontend Developer', 'Backend Developer'],
  'frontend': ['Frontend Developer', 'UI Developer', 'React Developer'],
  'fullstack': ['Full Stack Developer', 'Software Engineer', 'Web Developer'],
  'cybersecurity': ['Cybersecurity Analyst', 'Security Engineer', 'Ethical Hacker'],
  'security': ['Security Engineer', 'Cybersecurity Specialist', 'Information Security Analyst'],
  'ethical-hacking': ['Ethical Hacker', 'Penetration Tester', 'Security Consultant'],
  'cloud': ['Cloud Engineer', 'DevOps Engineer', 'Cloud Architect'],
  'devops': ['DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer'],
  'infrastructure': ['Infrastructure Engineer', 'DevOps Engineer', 'Cloud Engineer'],
  'software-engineering': ['Software Engineer', 'Backend Developer', 'Systems Engineer'],
  'algorithms': ['Software Engineer', 'Algorithm Engineer', 'Research Engineer'],
  'problem-solving': ['Software Engineer', 'Technical Lead', 'Solutions Architect'],
  'ui-ux': ['UI/UX Designer', 'Product Designer', 'Interaction Designer'],
  'design': ['UI/UX Designer', 'Product Designer', 'Visual Designer'],
  'mobile-development': ['Mobile Developer', 'iOS Developer', 'Android Developer'],
  'finance-tech': ['Quantitative Analyst', 'FinTech Developer', 'Financial Data Analyst'],
  'quantitative': ['Quantitative Analyst', 'Data Scientist', 'Research Scientist'],
  'product-development': ['Product Manager', 'Product Engineer', 'Technical Product Manager'],
  'qa': ['QA Engineer', 'Test Engineer', 'Quality Assurance Specialist'],
  'freelance': ['Freelance Developer', 'Independent Consultant', 'Contract Developer'],
  'remote': ['Remote Software Engineer', 'Distributed Team Developer'],
  'solo-projects': ['Indie Developer', 'Solo Developer', 'Startup Founder'],
  'team-work': ['Team Lead', 'Senior Software Engineer', 'Technical Lead'],
  'agile': ['Scrum Master', 'Agile Coach', 'Product Owner'],
}

export async function POST(req: NextRequest) {
  try {
    const discoveryData: DiscoveryData = await req.json()

    if (!discoveryData.likedItems || discoveryData.likedItems.length === 0) {
      return NextResponse.json(
        { error: 'No interests found. Please swipe through some cards.' },
        { status: 400 }
      )
    }

    // Calculate domain scores
    const domainScores: Record<string, number> = {}
    
    discoveryData.likedItems.forEach(item => {
      // Find matching domains for this item
      Object.keys(DOMAIN_CAREERS).forEach(domain => {
        const domainKeywords = domain.split('-')
        const itemLower = item.text.toLowerCase()
        
        // Check if item text contains domain keywords
        if (domainKeywords.some(keyword => itemLower.includes(keyword))) {
          domainScores[domain] = (domainScores[domain] || 0) + item.score
        }
      })
    })

    // Get top domains
    const topDomains = Object.entries(domainScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain]) => domain)

    // Generate career suggestions based on top domains
    const suggestedCareers = new Set<string>()
    topDomains.forEach(domain => {
      const careers = DOMAIN_CAREERS[domain] || []
      careers.forEach(career => suggestedCareers.add(career))
    })

    // If no matches, use default tech careers
    if (suggestedCareers.size === 0) {
      suggestedCareers.add('Full Stack Developer')
      suggestedCareers.add('Data Scientist')
      suggestedCareers.add('Software Engineer')
    }

    // Generate recommendations using AI
    const likedTexts = discoveryData.likedItems.map(item => item.text).join(', ')
    const dislikedTexts = discoveryData.dislikedItems.join(', ')

    const prompt = `Based on these user interests and preferences, suggest 3-5 tech career pathways:

LIKED INTERESTS (with scores):
${discoveryData.likedItems.map(item => `- ${item.text} (score: ${item.score})`).join('\n')}

DISLIKED INTERESTS:
${dislikedTexts || 'None'}

SUGGESTED CAREERS TO CONSIDER:
${Array.from(suggestedCareers).join(', ')}

For each career pathway, provide:
1. Career title (from suggested list or similar tech career)
2. Match score (0-100) based on how well it matches their interests
3. Reason why it matches (1-2 sentences connecting their interests to this career)
4. Key skills they'll learn (3-5 skills)
5. Estimated time to job-ready (e.g., "3 months", "6 months", "1 year")
6. Market demand level: "high", "medium", or "growing"
7. Brief description (1-2 sentences)

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "career": "Career Title",
      "matchScore": 85,
      "reason": "You showed strong interest in X and Y, which aligns perfectly with this career",
      "keySkills": ["Skill 1", "Skill 2", "Skill 3"],
      "estimatedTime": "6 months",
      "marketDemand": "high",
      "description": "Brief description of this career path"
    }
  ]
}

Make sure recommendations are diverse and cover different tech domains. Prioritize careers that match multiple interests.`

    try {
      const result = await generatePathway.sendMessage(prompt)
      const responseText = result.response.text()
      
      // Parse JSON from response
      let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText
      const parsed = JSON.parse(jsonStr)

      // Validate and format recommendations
      const recommendations: PathwayRecommendation[] = (parsed.recommendations || []).slice(0, 5).map((rec: any) => ({
        career: rec.career || 'Tech Professional',
        matchScore: Math.min(100, Math.max(0, rec.matchScore || 75)),
        reason: rec.reason || 'Based on your interests',
        keySkills: Array.isArray(rec.keySkills) ? rec.keySkills.slice(0, 5) : [],
        estimatedTime: rec.estimatedTime || '6 months',
        marketDemand: ['high', 'medium', 'growing'].includes(rec.marketDemand) ? rec.marketDemand : 'medium',
        description: rec.description || 'A tech career pathway tailored to your interests',
      }))

      // Ensure we have at least 3 recommendations
      if (recommendations.length < 3) {
        // Add fallback recommendations
        const fallbackCareers = ['Full Stack Developer', 'Data Scientist', 'Software Engineer']
        fallbackCareers.slice(0, 3 - recommendations.length).forEach(career => {
          recommendations.push({
            career,
            matchScore: 70,
            reason: 'A popular tech career with great opportunities',
            keySkills: ['Programming', 'Problem Solving', 'Technical Skills'],
            estimatedTime: '6 months',
            marketDemand: 'high',
            description: `A comprehensive pathway to become a ${career}`,
          })
        })
      }

      return NextResponse.json({ recommendations })
    } catch (error) {
      console.error('Error generating AI recommendations:', error)
      
      // Fallback recommendations
      const fallbackRecommendations: PathwayRecommendation[] = [
        {
          career: 'Full Stack Developer',
          matchScore: 75,
          reason: 'Based on your interest in building and creating',
          keySkills: ['JavaScript', 'React', 'Node.js', 'Database Design'],
          estimatedTime: '6 months',
          marketDemand: 'high',
          description: 'Build complete web applications from frontend to backend',
        },
        {
          career: 'Data Scientist',
          matchScore: 70,
          reason: 'Matches your interest in data and analysis',
          keySkills: ['Python', 'Machine Learning', 'Data Analysis', 'Statistics'],
          estimatedTime: '1 year',
          marketDemand: 'high',
          description: 'Extract insights from data using advanced analytics and AI',
        },
        {
          career: 'Software Engineer',
          matchScore: 65,
          reason: 'A versatile tech career with many opportunities',
          keySkills: ['Programming', 'System Design', 'Problem Solving', 'Algorithms'],
          estimatedTime: '6 months',
          marketDemand: 'high',
          description: 'Design and build software systems and applications',
        },
      ]

      return NextResponse.json({ recommendations: fallbackRecommendations })
    }
  } catch (error) {
    console.error('Error processing discovery request:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

