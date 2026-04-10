# MCP Integration (Custom Server for Gen-Ed)

This directory exposes internal service functionality as MCP-compatible tools for AI agents, plus an Agent Chat UI that can call these tools directly from chat.

## Overview
- `registry/index.ts` lists available tools.
- `route.ts` provides an HTTP interface (`/api/mcp`) for invoking tools with `{ tool, input }`.
- `mcp/server.ts` (in root `mcp/`) offers a JSON-RPC 2.0 stdio MCP server exposing the same tools for agent processes.

## Adding a Tool
1. Extract domain logic into a service in `services/` (e.g. `services/courses.ts`).
2. Define input/output Zod schemas (reuse service schemas or create new ones under `schemas/`).
3. Register the tool in `registry/index.ts` with a unique `name` (use `domain.action` naming).
4. (Optional) Write tests targeting HTTP route and JSON-RPC server.

## HTTP Usage
GET `/api/mcp` -> list tool metadata.
POST `/api/mcp` with body:
```json
{ "tool": "course.list", "input": { "page": 0, "limit": 8 } }
```
Response:
```json
{ "success": true, "result": { "data": [...], "page": 0, "limit": 8 } }
```

## JSON-RPC Usage (stdio)
Send (newline-delimited) JSON:
```json
{"jsonrpc":"2.0","id":1,"method":"list_tools"}
{"jsonrpc":"2.0","id":2,"method":"call_tool","params":{"name":"course.list","input":{"page":0,"limit":4}}}
```

## Agent Chat UI (MCP-connected)
- UI: `app/(agent-dashboard)/chat/page.tsx`
- Endpoint: `POST /api/agent` accepts `{ messages, attachments?, testMode? }`
	- messages: array of `{ role, content }`
	- attachments: optional images (for math.solveImage) or audio (for speech.transcribe); base64 uploaded client-side
	- testMode: forces deterministic planning without external AI
- Behavior: The agent plans a single MCP tool call (e.g., course.list, pathway.create, ai.generate) and executes it by calling the internal registry.
- Auth: If authenticated via Kinde, `userId` is injected for tools that require it (course.generate, pathway.create).

Quick example (list courses via heuristic planning):
```json
POST /api/agent
{
	"messages": [{"role":"user","content":"list courses"}],
	"testMode": true
}
```
Response
```json
{
	"success": true,
	"messages": [{"role":"assistant","content":"Found 0 courses"}],
	"toolCall": {"name":"course.list","input":{"page":0,"limit":8}},
	"toolResult": {"data":[],"page":0,"limit":8}
}
```

### Manual MCP Tool Invocation in Chat Page

The chat UI now supports two modes:

1. Planner Mode (default) — You type a natural language request and the `/api/agent` endpoint chooses and invokes one MCP tool.
2. Manual Mode — You explicitly pick a tool, provide JSON input, and invoke `/api/mcp` directly. This bypasses planning and lets you test schemas quickly.

UI elements (in `chat/page.tsx`):
- Toggle button: “Show manual MCP tool panel” reveals the manual section.
- Dropdown listing all tools fetched via `GET /api/mcp`.
- Textarea to enter raw JSON input. Client parses and sends to `POST /api/mcp`.
- Result appears inline as an assistant message (truncated for very large payloads).

Example manual invocation (enter into JSON textarea and select `course.list`):
```json
{"page":0,"limit":4}
```

Server response is wrapped and displayed as:
```
Result (course.list): {"data":[],"page":0,"limit":4}
```

If input fails JSON parse you will see:
```
Manual input JSON parse error: Unexpected token …
```

If the tool throws an MCPError (e.g. missing userId for `course.generate`), the panel displays:
```
Error (course.generate): Unauthorized: missing userId for course.generate
```

### When to Use Each Mode

| Scenario | Recommended Mode |
|----------|------------------|
| Exploratory natural language (“list my courses and then generate a pathway”) | Planner mode (may chain later) |
| Precise schema testing (“Does resume.report.generate accept my pre-built analysis object?”) | Manual mode |
| Debugging validation issues | Manual mode |
| End-user conversational UX | Planner mode |

### Auth Differences

HTTP route `/api/mcp` enforces `userId` for tools like `course.generate` and `pathway.create`.
Manual mode uses the same endpoint, so you must include `{"userId":"xyz"}` inside the JSON input for those tools.
Planner mode injects `userId` automatically when the user session is available (Kinde).

### Tool List Fetch

The chat page issues a GET request to `/api/mcp` on mount:
```ts
const res = await fetch('/api/mcp');
const data = await res.json();
setTools(data.tools);
```
Each tool object has `{ name, description }`. Input/output schemas are enforced server-side via Zod; invalid fields return structured errors.

### Extending Manual Mode

Potential enhancements:
- Auto-generate a small dynamic form from the JSON Schema (already derived from Zod) instead of raw JSON textarea.
- Show last toolCall + toolResult metadata (already done in planner response but could mirror for manual mode).
- Add copy buttons for result payload.
- Streaming progress for long-running tasks (e.g. future scraping or PDF generation).

---

## Future Upgrade Path
When upgrading to Next.js 16, add `next-devtools-mcp` to `.mcp.json` to leverage built-in runtime inspection tools alongside these custom domain tools.

## Auth & Rate Limiting
Currently omitted for simplicity. Wrap `t.handler` calls with your auth context or middleware before production use.
The Agent endpoint injects `userId` when present, for tools that enforce it.

## Error Format
Errors yield `{ success: false, error, code }` over HTTP and JSON-RPC error objects with `data.code` for custom error codes.

## Extensibility Ideas
- Add `course.update`, `course.delete` tools.
- Implement `resume.analyze` bridging to `resume-analysis` route logic.
- Add streaming/WebSocket transport for long-running tasks.
- Introduce tracing (OpenTelemetry) inside handlers.
- Build automatic form renderer from JSON Schema for manual mode.
- Implement multi-tool planning (chain calls) in `/api/agent`.
 - Lazy tool metadata loading now defers the `/api/mcp` call until the manual panel opens, improving initial `/chat` load time.
 - Auth fallback: set `KINDE_DISABLE_STRICT=1` locally to use a stub user and avoid JWKS AbortError spam when Kinde env vars are incomplete.
 - Consider adding a health check endpoint for auth provider readiness.
