# Speed & Performance

This document captures practical guidance and design decisions to keep the application fast, resilient, and maintainable. It focuses on background processing with Inngest, effective caching strategies, tRPC performance patterns, database connection handling, CI checks (types & lint), and code quality (cohesion & coupling).

## Background processing — using Inngest for async work

- Use Inngest to offload long-running or expensive tasks from request handlers (e.g., scraping, PDF generation, large AI calls). Keep the HTTP request lifecycle short: enqueue work and return a 202/200 quickly.
- Design worker functions to be idempotent: operations should be safe to retry.
- Use retries with exponential backoff and a dead-letter pattern for failures that repeatedly fail.
- Separate concerns: the web process handles HTTP/trpc and small sync tasks; Inngest workers handle CPU- or IO-bound background jobs.
- For heavy scraping jobs (Playwright/Puppeteer): run those in a separate worker container with adequate CPU/memory and, if needed, a compatible Chromium binary. Avoid running headless browsers in the web runtime to prevent high memory usage and cold-start problems.

Example Inngest pattern

1. API receives request and validates data
2. API enqueues an Inngest event with minimal payload (IDs and pointers to persisted input)
3. Worker consumes event, loads input from DB or object store, performs processing, writes result back, and emits status events

This pattern reduces payload size in the event bus and isolates worker responsibilities.

## Caching: multi-layered approach

- CDN / Edge cache: cache public static assets (JS, CSS, images) and JSON responses that are not user-specific.
- CDN + Stale-While-Revalidate: for non-critical data we can return cached data immediately and refresh in the background.
- Server-side cache (Redis / in-memory LRU): cache DB query results, expensive AI model responses, or computed aggregates. Use TTLs and cache-busting strategies.
- Client-side cache (React Query / TanStack Query): cache API responses on the client, use revalidation strategies and optimistic updates.
- tRPC-level caching: use tRPC's caching middleware or integrate with React Query's queryKeys & invalidation to minimize duplicate requests.

Cache key design

- Be explicit in cache keys: include resource identifiers, query parameters, and relevant feature flags.
- Use short TTLs for highly dynamic data and longer TTLs for rarely changing resources.

## tRPC performance patterns

- Batch small calls where possible: bundle related client-side queries to reduce round-trips.
- Use selective field selection on server resolvers to avoid over-fetching. Keep payloads small.
- Offload heavy computations to background jobs (Inngest) and return references in tRPC responses.
- Leverage React Query: use stale-while-revalidate, smart cache invalidation, and query deduping.
- Serialize complex inputs efficiently (use transformers like superjson when needed) but avoid unnecessary serialization overhead for small messages.

## Database & connection pooling

- Use a proper connection pool for serverless environments (e.g., PgBouncer or connection pooling provided by the database vendor). Excessive per-request connections cause latency and resource exhaustion.
- For long-lived connections (WebSockets or streaming), route them through a dedicated process if possible.
- Use queries with indexes and avoid N+1 patterns. Use drizzle-orm features to batch/compose queries.

Recommendations for neon/pg-style serverless DBs

- Avoid opening new DB clients per request; reuse pooled clients or use serverless-friendly connection options.
- Keep transactions concise and short.

## Instrumentation & profiling

- Add request timing: log slow endpoints > 500ms and collect histograms.
- Use distributed tracing (OpenTelemetry) for tracing requests through API → workers → external services.
- Add sampling for traces to control cost and noise.
- Profile CPU/memory in workers performing heavy scraping or AI workloads and size containers appropriately in Cloud Run or Kubernetes.

## Build-time & runtime optimizations for Next.js

- Use Next.js `standalone` output (already used in the `Dockerfile`) to reduce image size.
- Enable image optimization and caching for frequently served images; use Next's image CDN where appropriate.
- Tree-shake large client-only libs and lazy-load heavy components.
- Keep client bundles small by code-splitting and avoiding shipping large libraries to the client.

## CI checks: types, lint, tests (gates)

- Enforce type checking and linting in CI so code merged to `main` is type-safe and stylistically consistent:

```powershell
npm run type-check
npm run lint
npm test -- --run
```

- Fail fast: run `type-check` and `lint` before running slower integration tests in CI.
- Add coverage reports and require a minimum coverage threshold if desired.

## Cohesion & coupling — code quality guidance

- High cohesion: modules should focus on a single responsibility (e.g., `inngest` workers handle background tasks; `trpc` handlers orchestrate inputs and enqueue jobs).
- Low coupling: avoid direct imports of heavy worker code into API handlers. Use simple interfaces or message/event contracts between layers.
- Keep side effects contained: I/O (DB, network) should live in small adapter modules so they can be mocked and replaced for testing.
- Prefer dependency injection for external services so you can swap implementations in tests or between deployments.

Example module layout (recommended)

- /api — thin controllers that validate input, authorize, and enqueue work
- /workers — Inngest/worker functions that perform heavy work and persist results
- /lib — pure helpers and utilities (pure functions are easier to test)
- /services — DB, external APIs clients (wrapped and mocked in tests)

## Practical checks to keep code high-quality

- Run `npm run type-check` and `npm run lint` locally before PRs.
- Add Husky (pre-commit) hooks for formatting and optional pre-push checks to run tests.
- Keep functions small and pure where possible — reduces state coupling and makes unit tests straightforward.

## Performance budgets and regression prevention

- Add performance budgets (bundle size, API latency) and fail the build when exceeded.
- Use Lighthouse or WebPageTest for frontend performance baselining.
- Add regression alerts for error rate, latency, and CPU/memory spikes.

## Summary

This project is designed to separate responsibilities: the web process is thin and fast, background workers (Inngest) handle heavy workloads, caching reduces repeated work, and tRPC + React Query manage efficient client-server interactions. Enforce types and linting in CI to maintain a clean codebase with high cohesion and low coupling. If you'd like, I can:

- Add a `docs/SPEED_AND_PERFORMANCE.md` (this file) into the repo (done),
- Wire up CI jobs that gate merges on type-check and lint, and publish coverage artifacts, or
- Add a sample Inngest worker template and tRPC caching helpers.
