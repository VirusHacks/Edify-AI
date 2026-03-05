import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

type Env = {
  Variables: {
    user: KindeUser<Record<string, any>>;
  };
};

// Timeout wrapper for Kinde operations to prevent JWKS hanging
async function withTimeout<T>(promise: Promise<T> | null, timeoutMs: number = 5000, fallback?: T): Promise<T | undefined> {
  if (!promise) {
    return fallback as T | undefined;
  }
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (fallback !== undefined) {
      console.warn('[Kinde] Operation failed, using fallback:', error instanceof Error ? error.message : 'Unknown');
      return fallback as T | undefined;
    }
    throw error;
  }
}

// Graceful auth middleware: in local dev without valid Kinde config, skip remote JWKS validation to avoid AbortError spam.
// Set KINDE_DISABLE_STRICT=1 to bypass hard failures and provide a stub user for development/testing.
export const getAuthUser = createMiddleware<Env>(async (c, next) => {
  const disableStrict = process.env.KINDE_DISABLE_STRICT === '1';
  if (disableStrict) {
    // Provide a deterministic stub user
    c.set("user", {
      id: "stub-user",
      email: "stub@example.com",
      family_name: "Stub",
      given_name: "Dev",
      picture: "",
    } as any);
    return next();
  }
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    // Add timeout to prevent JWKS fetch from hanging
    const isUserAuthenticated = await withTimeout(isAuthenticated(), 5000, false);
    if (!isUserAuthenticated) {
      throw new HTTPException(401, {
        res: c.json({ error: "unauthorized" }),
      });
    }
    const user = await withTimeout(getUser(), 5000);
    c.set("user", user as KindeUser<Record<string, any>>);
    await next();
  } catch (error) {
    // If strict not disabled, surface minimal error
    console.warn('[kinde auth] error', error instanceof Error ? error.message : 'Unknown');
    throw new HTTPException(401, {
      res: c.json({ error: "unauthorized" }),
    });
  }
});

// Helper for server code needing optional user without throwing.
export async function safeGetUser(): Promise<KindeUser<Record<string, any>> | undefined> {
  if (process.env.KINDE_DISABLE_STRICT === '1') {
    return {
      id: 'stub-user',
      email: 'stub@example.com',
      given_name: 'Dev',
      family_name: 'Stub',
      picture: '',
    } as any;
  }
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    const authenticated = await withTimeout(isAuthenticated(), 5000, false);
    if (!authenticated) return undefined;
    const user = await withTimeout(getUser(), 5000, undefined);
    return user ?? undefined;
  } catch (error) {
    console.warn('[Kinde] safeGetUser failed:', error instanceof Error ? error.message : 'Unknown');
    return undefined;
  }
}

// Auth configuration enhanced

// Auth configuration enhanced
