/*
  Minimal MCP (Model Context Protocol) like JSON-RPC server over stdio for custom tools.
  This is NOT the official Next.js 16 built-in server; it allows agents to call our service layer
  while we remain on Next.js 14. Upgrade to Next.js 16 later to leverage next-devtools-mcp.
*/
import { getTool, listToolMetadata } from "../app/api/mcp/registry";
import { MCPError } from "../app/api/mcp/utils/errors";

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
}
interface JSONRPCResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

function write(res: JSONRPCResponse) {
  process.stdout.write(JSON.stringify(res) + "\n");
}

async function handle(req: JSONRPCRequest) {
  const { method, id, params } = req;
  try {
    switch (method) {
      case "list_tools": {
        return write({ jsonrpc: "2.0", id, result: listToolMetadata() });
      }
      case "call_tool": {
        const name = params?.name;
        const input = params?.input;
        if (!name) throw new MCPError("Missing tool name", "ERR_NO_NAME");
        const tool = getTool(name);
        if (!tool) throw new MCPError(`Unknown tool: ${name}`, "ERR_NO_TOOL");
        const parsed = tool.inputSchema ? tool.inputSchema.parse(input ?? {}) : input;
        const rawResult = await tool.handler(parsed);
        const safeResult = tool.outputSchema ? tool.outputSchema.parse(rawResult) : rawResult;
        return write({ jsonrpc: "2.0", id, result: { tool: name, output: safeResult } });
      }
      default: {
        return write({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
    }
  } catch (err: any) {
    return write({ jsonrpc: "2.0", id, error: { code: -32000, message: err?.message || String(err), data: { code: err?.code } } });
  }
}

process.stdin.setEncoding("utf8");
let buffer = "";
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const parsed: JSONRPCRequest = JSON.parse(line);
      handle(parsed);
    } catch (err) {
      write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error", data: { line } } });
    }
  }
});

process.on("uncaughtException", (e) => {
  write({ jsonrpc: "2.0", id: null, error: { code: -32099, message: "Uncaught exception", data: { message: e.message } } });
});
