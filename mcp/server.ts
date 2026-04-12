/**
 * @file mcp/server.ts
 * @description custom implementation of the Model Context Protocol (MCP).
 * Provides a JSON-RPC 2.0 interface over stdio, allowing agentic frameworks (like Gemini/Cursor)
 * to discover and execute tools registered within the Next.js application layer.
 * 
 * DESIGN RATIONALE:
 * This enables "plug-and-play" tool capabilities for external agents without requiring
 * a full framework upgrade to Next.js 16/built-in MCP support.
 */

import { getTool, listToolMetadata } from "../app/api/mcp/registry";
import { MCPError } from "../app/api/mcp/utils/errors";

/**
 * Standard JSON-RPC 2.0 Request Structure
 */
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
}

/**
 * Standard JSON-RPC 2.0 Response Structure
 */
interface JSONRPCResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

/**
 * Serializes and writes a JSON-RPC response to stdout.
 * @param res Response object to send.
 */
function write(res: JSONRPCResponse) {
  process.stdout.write(JSON.stringify(res) + "\n");
}

/**
 * Main command handler for MCP requests.
 * Supported methods:
 * - list_tools: Returns metadata for all registered tools.
 * - call_tool: Executes a specific tool by name with validated inputs.
 * @param req The incoming JSON-RPC request.
 */
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
        
        if (!name) throw new MCPError("Target tool name is required", "ERR_NO_NAME");
        
        const tool = getTool(name);
        if (!tool) throw new MCPError(`Tool not found in registry: ${name}`, "ERR_NO_TOOL");
        
        // Input validation using Zod schemas
        const parsed = tool.inputSchema ? tool.inputSchema.parse(input ?? {}) : input;
        
        // Execute tool handler
        const rawResult = await tool.handler(parsed);
        
        // Output validation for schema parity
        const safeResult = tool.outputSchema ? tool.outputSchema.parse(rawResult) : rawResult;
        
        return write({ jsonrpc: "2.0", id, result: { tool: name, output: safeResult } });
      }
      
      default: {
        return write({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not supported: ${method}` } });
      }
    }
  } catch (err: any) {
    return write({ 
      jsonrpc: "2.0", 
      id, 
      error: { 
        code: err instanceof MCPError ? -32000 : -32603, 
        message: err?.message || "Internal server error", 
        data: { code: err?.code || "INTERNAL_ERROR" } 
      } 
    });
  }
}

// STDIN Listener for JSON-RPC packets
process.stdin.setEncoding("utf8");
let buffer = "";

process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  
  // Process stream line-by-line
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    
    if (!line) continue;
    
    try {
      const parsed: JSONRPCRequest = JSON.parse(line);
      handle(parsed);
    } catch (err) {
      write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid JSON structure", data: { line } } });
    }
  }
});

// Global error handling for the stdio bridge
process.on("uncaughtException", (e) => {
  write({ jsonrpc: "2.0", id: null, error: { code: -32099, message: "Critical runtime error", data: { message: e.message } } });
});
