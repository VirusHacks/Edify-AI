import { MCPError } from './errors';

export function ensureUserId(input: any, context: string) {
  const userId = input?.userId || input?.user?.id || input?.user?.userId;
  if (!userId) {
    throw new MCPError(`Unauthorized: missing userId for ${context}`, 'ERR_UNAUTHORIZED');
  }
  return userId;
}