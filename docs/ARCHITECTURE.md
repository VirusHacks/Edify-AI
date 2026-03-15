# Gen‑Ed Platform Architecture (simple)

This file explains the system in plain language without diagrams. It summarizes the main pieces, how data flows, and the operational considerations you should know.

## Main idea

- Web/API servers (Next.js) handle user requests, validate input, and enqueue background work.
- Long-running or heavy tasks are processed by background workers (Inngest consumers) so the web layer stays fast.
- Cache and storage layers (Redis, Vector DB, object storage) provide low-latency reads and durable storage for large files and embeddings.
- An AI Gateway centralizes calls to OpenAI, Google Gemini, or local models and handles selection, rate-limiting, and telemetry.

## Main components (short)

- Next.js app (Cloud Run / containers): UI, API endpoints, and light business logic.
- Redis: session caching, short-term caches, rate limiting.
- Postgres (Neon/Cloud SQL): main relational database for users and core data.
- Object storage (GCS or similar): resumes, PDFs, media files.
- Vector DB (Pinecone/FAISS): semantic search and similarity matching.
- Event bus (Inngest or similar): durable events for background processing.
- Workers: specialized processes that handle resumes, scraping, conversations, PDF generation, and notifications.
- AI Gateway: central model router and rate-limiter.
- CI/CD (GitLab): builds images, runs tests, and deploys to Cloud Run.

## Typical data flows (short)

- Resume processing:
    1. User uploads resume → file saved to object storage.
    2. API enqueues `resume.process` event with a pointer to the file.
    3. Worker loads file, extracts text, creates embeddings, saves vectors to Vector DB, updates DB with status.

- Mock interview analysis:
    1. Session started → session metadata cached in Redis.
    2. Audio/transcripts streamed to workers for speech-to-text and analysis.
    3. Worker creates feedback report using an LLM via the AI Gateway.

