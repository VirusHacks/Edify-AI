import React, { FC } from "react";
import SkeletonLoader from "@/components/skeleton-loader";
import { INITIAL_THEME_COLOR } from "@/lib/helper";
import { ResumeDataType } from "@/types/resume.type";

interface PropsType {
  resumeInfo: ResumeDataType | undefined;
  isLoading: boolean;
}

// Helper function to categorize skills
function categorizeSkills(skills: any[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    'Programming': [],
    'Backend & APIs': [],
    'System Design': [],
    'CS Fundamentals': [],
    'DevOps & Cloud': [],
    'Databases': [],
    'Mathematics & Management': [],
    'Other': [],
  };

  const skillNames = skills.map(s => s?.name || '').filter(Boolean);

  // Programming languages
  const programmingKeywords = ['java', 'python', 'c++', 'c#', 'javascript', 'typescript', 'sql', 'perl', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'php', 'r', 'scala'];
  // Backend & APIs
  const backendKeywords = ['node.js', 'express', 'rest', 'graphql', 'prisma', 'api', 'fastapi', 'django', 'flask', 'spring', 'asp.net'];
  // System Design
  const systemDesignKeywords = ['architecture', 'microservices', 'event-driven', 'load balancing', 'caching', 'api gateway', 'distributed', 'scalable', 'multi-tier'];
  // CS Fundamentals
  const csKeywords = ['data structures', 'algorithms', 'complexity', 'object-oriented', 'operating systems', 'networks', 'database management', 'compilers', 'computer architecture'];
  // DevOps & Cloud
  const devopsKeywords = ['docker', 'kubernetes', 'ci/cd', 'aws', 'azure', 'gcp', 'jenkins', 'github actions', 'terraform', 'ansible', 'kafka', 'redis'];
  // Databases
  const dbKeywords = ['postgresql', 'mysql', 'mongodb', 'redis', 'cassandra', 'elasticsearch', 'database', 'query', 'optimization'];
  // Mathematics & Management
  const mathKeywords = ['linear programming', 'optimization', 'statistical', 'agile', 'scrum', 'project management', 'leadership', 'analytics'];

  skillNames.forEach(skillName => {
    const lowerSkill = skillName.toLowerCase();
    let categorized = false;

    if (programmingKeywords.some(kw => lowerSkill.includes(kw))) {
      categories['Programming'].push(skillName);
      categorized = true;
    } else if (backendKeywords.some(kw => lowerSkill.includes(kw))) {
      categories['Backend & APIs'].push(skillName);
      categorized = true;
    } else if (systemDesignKeywords.some(kw => lowerSkill.includes(kw))) {
      categories['System Design'].push(skillName);
      categorized = true;
    } else if (csKeywords.some(kw => lowerSkill.includes(kw))) {
      categories['CS Fundamentals'].push(skillName);
      categorized = true;
    } else if (devopsKeywords.some(kw => lowerSkill.includes(kw))) {
      categories['DevOps & Cloud'].push(skillName);
      categorized = true;
    } else if (dbKeywords.some(kw => lowerSkill.includes(kw))) {
      categories['Databases'].push(skillName);
      categorized = true;
    } else if (mathKeywords.some(kw => lowerSkill.includes(kw))) {
      categories['Mathematics & Management'].push(skillName);
      categorized = true;
    }

    if (!categorized) {
      categories['Other'].push(skillName);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

const SkillPreview: FC<PropsType> = ({ resumeInfo, isLoading }) => {
  const themeColor = resumeInfo?.themeColor || INITIAL_THEME_COLOR;

  if (isLoading) {
    return <SkeletonLoader />;
  }
  if (!resumeInfo?.skills || resumeInfo.skills.length === 0) {
    return null;
  }

  // Categorize all skills (ignore ratings for display)
  const categorizedSkills = categorizeSkills(resumeInfo.skills);

  return (
    <div className="w-full mb-6">
      <h2
        className="text-lg font-bold mb-4 text-gray-900 uppercase tracking-wide"
                  style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          borderBottom: "2px solid #1a1a1a",
          paddingBottom: "4px",
        }}
      >
        Technical Skills
      </h2>

      <div className="space-y-3">
        {Object.entries(categorizedSkills).map(([category, skills]) => (
          <div key={category}>
            <div className="flex items-start gap-2 mb-1">
              <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                {category}:
              </span>
              <div className="flex flex-wrap gap-1 text-sm text-gray-700" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                {skills.map((skill, index) => (
                  <span key={index}>
                    {skill}
                    {index < skills.length - 1 && " | "}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillPreview;
