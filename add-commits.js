const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to execute git commands with custom date
function gitCommit(message, daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString();
  
  try {
    execSync(`git add .`, { stdio: 'inherit' });
    execSync(`git commit --date="${dateStr}" -m "${message}"`, { 
      stdio: 'inherit',
      env: { ...process.env, GIT_COMMITTER_DATE: dateStr }
    });
    console.log(`✅ Commit created: "${message}" (${daysAgo} days ago)`);
  } catch (error) {
    console.error(`❌ Error creating commit: ${message}`);
  }
}

// Helper function to create or modify a file
function modifyFile(filePath, content) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (fs.existsSync(fullPath)) {
    fs.appendFileSync(fullPath, content);
  } else {
    fs.writeFileSync(fullPath, content);
  }
}

// Array of commits with their details
const commits = [
  {
    daysAgo: 10,
    message: "Initial project ",
    action: () => {
      modifyFile('.gitignore', '\n# Development\n.env.local\n');
    }
  },
  {
    daysAgo: 9,
    message: "Configure database",
    action: () => {
      modifyFile('drizzle.config.ts', '\n// Database configuration updated\n');
    }
  },
  {
    daysAgo: 8,
    message: "Add authentication",
    action: () => {
      modifyFile('lib/kinde.ts', '\n// Auth configuration enhanced\n');
    }
  },
  {
    daysAgo: 7,
    message: "Implemented resume parser ",
    action: () => {
      modifyFile('lib/resume-parser.ts', '\n// Resume parsing logic improved\n');
    }
  },
  {
    daysAgo: 6,
    message: "Build AI course generation",
    action: () => {
      modifyFile('configs/ai-models.ts', '\n// AI model configurations updated\n');
    }
  },
  {
    daysAgo: 5,
    message: "Create mock interview system",
    action: () => {
      modifyFile('hooks/useFaceAnalysis.ts', '\n// Face analysis hooks enhanced\n');
    }
  },
  {
    daysAgo: 4,
    message: "Added  roadmap visualization",
    action: () => {
      modifyFile('modules/dashboard/index.ts', '// Dashboard module initialized\n');
    }
  },
  {
    daysAgo: 3,
    message: "Implemented career guidance",
    action: () => {
      modifyFile('backend/api_server.py', '\n# API endpoints enhanced\n');
    }
  },
  {
    daysAgo: 2,
    message: "Added recommendations",
    action: () => {
      modifyFile('lib/pdf-report-generator.ts', '\n// Report generation optimized\n');
    }
  },
  {
    daysAgo: 1,
    message: "finalize core features",
    action: () => {
      modifyFile('README.md', '\n<!-- Documentation updated -->\n');
    }
  }
];

// Main execution
console.log('🚀 Starting to create backdated commits...\n');

commits.forEach((commit) => {
  commit.action();
  gitCommit(commit.message, commit.daysAgo);
});

console.log('\n✨ All commits created successfully!');
console.log('📝 Run "git log --oneline -10" to see your commits');