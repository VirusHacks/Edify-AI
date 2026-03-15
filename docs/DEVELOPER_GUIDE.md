# Developer Guide

This guide expands on the `README.md` developer section and provides step-by-step instructions for common developer tasks: environment setup, local development, testing, building Docker images, and releasing.

## Environment setup

1. Install Node 18 and npm 10 (use nvm or your system package manager).
2. Copy `.env.example` to `.env` and fill in required values (API keys, DB URL). Do not commit `.env`.
3. Install dependencies:

```powershell
npm ci --legacy-peer-deps
```

## Local development

- Start dev server:

```powershell
npm run dev
```

- Common ports: web UI on `http://localhost:3000/`.

## Testing

- Run tests:

```powershell
npm test
```

- Typecheck and lint:

```powershell
npm run type-check
npm run lint
```

## Docker & local container testing

- Build:

```powershell
docker build -t next-app .
```

- Run with env file:

```powershell
docker run --rm -p 3000:3000 --env-file .env --shm-size=1g --name next-app next-app
```

## CI & release notes

- The pipeline should run lint, type-check, tests, then build and push images. See `devops/PIPELINE.md` for an example GitLab CI snippet.
- Use commit message conventions and tag releases with commit SHAs for reproducibility.

## Adding background workers (Inngest)

- Worker templates should live in `/workers` or `/inngest` and be idempotent.
- Enqueue only references (IDs) in events to keep the event payload small.

## Local debugging tips

- Use `docker logs -f <container>` to stream logs.
- To access a shell inside the image for debugging:

```powershell
docker run --rm -it --entrypoint sh next-app
```

## Helpful scripts to add

- Add convenience scripts in `package.json` or a `Makefile` for common tasks:
  - `scripts: { dev, build, start, test, lint, type-check }`

## Contact & support

- For infra or CI issues, check `devops/PIPELINE.md` and reach out on the team's Slack or support channel.
