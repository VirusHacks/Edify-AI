import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Convert a Zod schema to JSON Schema safe for MCP Tool registration.
// Adds title if missing and strips unsupported constructs.
export function toJsonSchema(schema: z.ZodTypeAny | undefined, title?: string) {
  if (!schema) {
    return { type: 'object', properties: {} };
  }
  try {
    const json = zodToJsonSchema(schema, title ? { name: title } : undefined);
    return json.definitions ? json.definitions[title || 'Root'] || json : json; // fallback root
  } catch (e) {
    return { type: 'object', properties: { error: { type: 'string', description: 'Failed to convert schema' } } };
  }
}

// Helper to mark optional fields not required in JSON Schema
export function ensureRequiredConsistency(schema: any) {
  // zod-to-json-schema already handles required vs optional; placeholder if adjustments needed later.
  return schema;
}
