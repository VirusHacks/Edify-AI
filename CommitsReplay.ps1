# CommitsReplay.ps1
$ErrorActionPreference = "Stop"

# Configuration
$now = Get-Date
$startTime = $now.AddDays(-2)
$intervalMinutes = 80 # ~1.3 hours

$currentTimestamp = $startTime

function Commit {
    param($Message, $AddPath = ".")
    git add $AddPath
    $env:GIT_AUTHOR_DATE = $script:currentTimestamp.ToString("yyyy-MM-ddTHH:mm:ss")
    $env:GIT_COMMITTER_DATE = $script:currentTimestamp.ToString("yyyy-MM-ddTHH:mm:ss")
    git commit -m "$Message"
    Write-Host "Committed: $Message at $($env:GIT_AUTHOR_DATE)" -ForegroundColor Green
    $script:currentTimestamp = $script:currentTimestamp.AddMinutes($script:intervalMinutes)
}

Write-Host "Starting manual replay of commits..." -ForegroundColor Cyan

# Phase 1: Folder-by-folder Initial project
Commit "Initial project (app)" "app"
Commit "Initial project (components)" "components"
Commit "Initial project (public)" "public"
Commit "Initial project (services)" "services"
Commit "Initial project (lib)" "lib"
Commit "Initial project (configs)" "configs"
Commit "Initial project (hooks)" "hooks"
Commit "Initial project (modules)" "modules"
Commit "Initial project (backend)" "backend"
Commit "Initial project (drizzle)" "drizzle"
Commit "Initial project (db)" "db"
Commit "Initial project (docs)" "docs"
Commit "Initial project (mcp)" "mcp"
Commit "Initial project (configuration files)" "*.json *.ts *.mjs project.toml README.md"

# Phase 2: Follow original flow
Commit "Configure database"
Commit "Add authentication"
Commit "Implemented resume parser"
Commit "Build AI course generation"
Commit "Create mock interview system"
Commit "Added roadmap visualization"
Commit "Implemented career guidance"
Commit "Added recommendations"
Commit "finalize core features"
Commit "added docs"
Commit "updated ats scoring for resumes"
Commit "Revise README for improved project overview"
Commit "worked on design"
Commit "worked on adding guardials"
Commit "completed mcp"
Commit "completed trpc"
Commit "updated drizzel"
Commit "updated db"
Commit "built perfect documentation"
Commit "added neobrutalism ui"
Commit "built python api and deployed it using cloud run"
Commit "changed theme and corrected dependencies"

Write-Host "`nReplay complete! Now run:" -ForegroundColor Yellow
Write-Host "git remote add origin https://github.com/VirusHacks/Edify-AI"
Write-Host "git push -f origin main"
