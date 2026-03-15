# DevOps Strategy: The "Shift-Left" & Agentic Approach

This document details the strategic decisions behind our DevOps pipeline, designed to win the GitLab Startup Accelerator Challenge.

## Core Philosophy

1.  **Shift-Left Security**: Security is not an afterthought. We integrate SAST, Dependency Scanning, and Secret Detection into every Merge Request. No code reaches production without passing these gates.
2.  **Agentic AI Workflows**: We move beyond static automation. Our CI pipeline uses Generative AI (Gemini) to "understand" code changes and perform intelligent tasks like generating release notes and suggesting fixes.
3.  **Immutable Infrastructure**: We use Docker containers for consistent environments from development to production.

## Pipeline Stages

| Stage | Purpose | Tools |
| :--- | :--- | :--- |
| **Lint** | Ensure code quality and style consistency. | ESLint, Prettier, TSC |
| **Test** | Verify functionality. | Playwright, Jest |
| **Build** | Compile the application. | Next.js Build |
| **Containerize** | Package app into a Docker image. | Docker, GitLab Registry |
| **Security** | Scan for vulnerabilities. | GitLab SAST, Trivy, Semgrep |
| **Deploy** | Release to production environment. | Google Cloud Run |
| **Release** | Tag version and generate notes. | GitLab Release CLI, Gemini API |

## Key Decisions

### Why Google Cloud Run?
- **Scalability**: Scales to zero when not in use, perfect for startups.
- **Simplicity**: Abstracts away Kubernetes complexity while maintaining container benefits.
- **Security**: Managed environment with built-in security features.

### Why Inngest?
- **Reliability**: Ensures background jobs (like long-running AI generation) are never lost, even if the server restarts.
- **Developer Experience**: Serverless-native event-driven architecture.

### Why Gemini for CI?
- **Context Window**: Large context window allows analyzing full commit history or large files for release notes.
- **Integration**: Easy to integrate via Node.js SDK in CI scripts.
