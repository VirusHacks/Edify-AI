export class MCPError extends Error {
  code: string;
  constructor(message: string, code = "ERR_MCP") {
    super(message);
    this.code = code;
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof MCPError) {
    return { success: false, error: err.message, code: err.code };
  }
  if (err instanceof Error) {
    return { success: false, error: err.message, code: "ERR_UNKNOWN" };
  }
  return { success: false, error: String(err), code: "ERR_UNKNOWN" };
}
