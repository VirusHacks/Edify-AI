/**
 * @file kinde.ts
 * @description Authentication helpers and middleware for Kinde Auth in a Next.js/Hono environment.
 * Includes timeout wrappers to handle JWKS latency and developer stubbing for local environments.
 */

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

type Env = {
  Variables: {
    user: KindeUser<Record<string, any>>;
  };
};

/**
 * Wraps a promise in a timeout to prevent hanging on external requests (like Kinde JWKS).
 * @param promise The promise to await.
 * @param timeoutMs Maximum time to wait in milliseconds.
 * @param fallback Value to return if timeout or error occurs.
 */
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
      console.warn('[Kinde] Operation failed or timed out, using fallback:', error instanceof Error ? error.message : 'Unknown');
      return fallback as T | undefined;
    }
    throw error;
  }
}

/**
 * Hono Middleware to protect API routes using Kinde server-side session.
 * Supports KINDE_DISABLE_STRICT environment variable for local testing with stub users.
 */
export const getAuthUser = createMiddleware<Env>(async (c, next) => {
  const disableStrict = process.env.KINDE_DISABLE_STRICT === '1';
  
  if (disableStrict) {
    // Inject a deterministic stub user for development
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
    
    // Validate authentication status with a 5s timeout
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
    console.warn('[KindeMiddleware] Auth error:', error instanceof Error ? error.message : 'Unknown');
    throw new HTTPException(401, {
      res: c.json({ error: "unauthorized" }),
    });
  }
});

/**
 * Safely retrieves the current user session without throwing exceptions.
 * Useful for server-side logic and components where auth is optional.
 * @returns KindeUser if authenticated/stubbed, undefined otherwise.
 */
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
    console.warn('[Kinde] safeGetUser fallback due to error:', error instanceof Error ? error.message : 'Unknown');
    return undefined;
  }
}
