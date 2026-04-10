// Recommendation engine for matching internships, hackathons, and meetups with user profile

import { generateSearchQuery } from "./ai-search-query-generator";

interface UserProfile {
  bio?: string | null;
  interests?: string | null; // JSON string array
  skills?: string | null; // JSON string array
  courses?: string | null; // JSON string array
  preferredLanguages?: string | null; // JSON string array
  learningGoals?: string | null; // JSON string array
  occupation?: string | null;
  location?: string | null;
}

interface Scorable {
  title: string;
  description?: string;
  skills?: string[];
  location?: string;
  type?: string;
  company?: string;
  host?: string;
  organizer?: string;
  [key: string]: any;
}

// Parse JSON strings to arrays
function parseJSONArray(jsonString: string | null | undefined): string[] {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Calculate relevance score based on profile
export function calculateRelevanceScore(item: Scorable, profile: UserProfile): number {
  let score = 0;
  
  // Extract profile arrays
  const interests = parseJSONArray(profile.interests);
  const skills = parseJSONArray(profile.skills);
  const courses = parseJSONArray(profile.courses);
  const learningGoals = parseJSONArray(profile.learningGoals);
  
  // Combine all profile keywords for matching
  const profileKeywords = [
    ...interests,
    ...skills,
    ...courses,
    ...learningGoals,
  ].map(keyword => keyword.toLowerCase());
  
  // Create searchable text from the item
  const itemText = [
    item.title,
    item.description,
    item.company,
    item.host,
    item.organizer,
    item.location,
    ...(item.skills || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  // Calculate keyword matches
  profileKeywords.forEach(keyword => {
    if (itemText.includes(keyword)) {
      score += 10; // Base score for keyword match
      
      // Boost if found in title or skills (more important fields)
      if (item.title?.toLowerCase().includes(keyword)) score += 15;
      if (item.skills?.some(skill => skill.toLowerCase().includes(keyword))) score += 12;
      if (item.description?.toLowerCase().includes(keyword)) score += 5;
    }
  });
  
  // AI-Generated keyword boost (will be added by AI-enhanced matching)
  // This is handled in the getAIRecommendations function
  
  // Location matching bonus
  if (profile.location && item.location) {
    const profileLocation = profile.location.toLowerCase();
    const itemLocation = item.location.toLowerCase();
    
    // Exact match
    if (profileLocation === itemLocation) score += 20;
    // Partial match (e.g., "New York" matches "New York, NY")
    else if (profileLocation.includes(itemLocation.split(',')[0])) score += 10;
    else if (itemLocation.includes(profileLocation.split(',')[0])) score += 10;
  }
  
  // Remote/Online work preference
  if (item.location?.toLowerCase().includes('remote') || 
      item.location?.toLowerCase().includes('online') ||
      item.location?.toLowerCase().includes('work from home')) {
    // Neutral - doesn't add or subtract
  }
  
  // Skills-specific matching for internships
  if (item.skills && skills.length > 0) {
    const matchingSkills = item.skills.filter(skill =>
      skills.some(profileSkill => 
        skill.toLowerCase().includes(profileSkill.toLowerCase()) ||
        profileSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    score += matchingSkills.length * 15; // Higher weight for skill matches
  }
  
  // Career alignment bonus
  if (profile.occupation && item.title) {
    const occupation = profile.occupation.toLowerCase();
    const title = item.title.toLowerCase();
    
    if (title.includes(occupation) || occupation.includes(title.split(' ')[0])) {
      score += 25;
    }
  }
  
  // Bio context matching
  if (profile.bio && item.description) {
    // Extract meaningful words from bio (ignore common words)
    const commonWords = ['the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 
                         'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'and', 'or', 
                         'but', 'if', 'because', 'as', 'while', 'for', 'to', 'from', 'of', 'in', 'on',
                         'at', 'by', 'with', 'about', 'into', 'through', 'during', 'including', 'i',
                         'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'];
    
    const bioWords = profile.bio.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4 && !commonWords.includes(word));
    
    bioWords.forEach(word => {
      if (item.description && item.description.toLowerCase().includes(word)) {
        score += 8;
      }
    });
  }
  
  return score;
}

// Sort items by relevance score
export function sortByRelevance<T extends Scorable>(items: T[], profile: UserProfile): T[] {
  return items
    .map(item => ({
      item,
      score: calculateRelevanceScore(item, profile),
    }))
    .sort((a, b) => b.score - a.score)
    .filter(result => result.score > 0) // Only show items with some relevance
    .map(result => result.item);
}

// Get recommended items (top N most relevant)
export function getRecommendations<T extends Scorable>(
  items: T[],
  profile: UserProfile,
  limit: number = 10
): T[] {
  return sortByRelevance(items, profile).slice(0, limit);
}

// Check if user has profile data for recommendations
export function hasProfileData(profile: UserProfile): boolean {
  return !!(
    profile.interests ||
    profile.skills ||
    profile.courses ||
    profile.learningGoals ||
    profile.occupation ||
    profile.bio
  );
}

// AI-Enhanced recommendation function using Gemini-generated keywords
export async function getAIRecommendations<T extends Scorable>(
  items: T[],
  profile: UserProfile,
  contentType: "internship" | "hackathon" | "meetup",
  limit: number = 10
): Promise<T[]> {
  try {
    // Generate AI-powered search keywords
    const aiKeywords = await generateSearchQuery(profile, contentType);
    
    // If AI provided keywords, enhance scoring with them
    if (aiKeywords.keywords && aiKeywords.keywords.length > 0) {
      const enhancedItems = items.map(item => {
        let score = calculateRelevanceScore(item, profile);
        
        // Add AI keyword boost
        const itemText = [
          item.title,
          item.description,
          item.company,
          item.host,
          item.organizer,
          ...(item.skills || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        
        // Check for AI-generated keyword matches
        aiKeywords.keywords.forEach(keyword => {
          const lowerKeyword = keyword.toLowerCase();
          if (itemText.includes(lowerKeyword)) {
            // Higher weight for AI-generated keywords
            score += 20;
            if (item.title?.toLowerCase().includes(lowerKeyword)) score += 25;
            if (item.skills?.some(skill => skill.toLowerCase().includes(lowerKeyword))) score += 20;
          }
        });
        
        return { item, score };
      });
      
      return enhancedItems
        .sort((a, b) => b.score - a.score)
        .filter(result => result.score > 0)
        .slice(0, limit)
        .map(result => result.item);
    }
    
    // Fallback to regular recommendations if AI fails
    return getRecommendations(items, profile, limit);
  } catch (error) {
    console.error("Error in AI-enhanced recommendations:", error);
    // Fallback to regular recommendations
    return getRecommendations(items, profile, limit);
  }
}

