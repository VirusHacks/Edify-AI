# Agentic workflows — short and simple

This file explains how AI-driven jobs are organized and how they interact with the app. The goal is: keep web requests fast, move heavy work to workers, and use simple event messages (IDs/pointers).

Core principles

- Keep HTTP/tRPC handlers quick: validate and enqueue events, then return.
- Workers must be idempotent and retryable.
- Run heavy or memory-hungry tasks (scraping, headless browsers) in separate worker containers.
- Cache frequently read data in Redis and use a Vector DB for semantic search.

Common workflows (high level)

- Onboarding / Roadmap
	- API creates a user profile and enqueues an `user.onboarded` event. A worker generates a personalized roadmap using an LLM and stores the result.

- Resume processing
	- Upload → object storage → enqueue `resume.process` with file pointer → worker extracts text, creates embeddings, stores vectors, updates DB.

- Mock interviews
	- Start session → cache metadata in Redis → stream transcripts/audio to workers → worker analyzes and generates feedback via an LLM.

- Job matching
	- Aggregator normalizes job listings, indexes them (Vector DB), and caches matches in Redis for fast queries.

- Scraping
	- Dedicated scraper-worker runs Playwright/Puppeteer with a compatible Chromium binary. Enqueue jobs and scale these workers separately.

Integration points (short)

- AI Gateway: central point to call models (OpenAI, Gemini, local), handle retries, and track costs/latency.
- Event bus: Inngest (or similar) for durable event delivery to workers.
- Storage & caches: Object store for files, Redis for sessions/caches, Vector DB for embeddings.
