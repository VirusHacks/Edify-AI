import { NextResponse } from "next/server";
import { getTool, listToolMetadata } from "./registry";
import { errorResponse } from "./utils/errors";

export async function GET() {
  // List tool metadata
  return NextResponse.json({ success: true, tools: listToolMetadata() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, input } = body;
    if (!tool) {
      return NextResponse.json({ success: false, error: "Missing 'tool' property" }, { status: 400 });
    }
    const t = getTool(tool);
    if (!t) {
      return NextResponse.json({ success: false, error: `Tool not found: ${tool}` }, { status: 404 });
    }
    // Validate input if schema exists
    const parsed = t.inputSchema ? t.inputSchema.parse(input ?? {}) : input;
    const result = await t.handler(parsed);
    // Optionally validate output
    const safeResult = t.outputSchema ? t.outputSchema.parse(result) : result;
    return NextResponse.json({ success: true, result: safeResult }, { status: 200 });
  } catch (err) {
    return NextResponse.json(errorResponse(err), { status: 500 });
  }
}
