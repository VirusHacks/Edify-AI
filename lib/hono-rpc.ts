import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

// Use relative URL in browser, full URL on server
// This ensures it works in both local development and production
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // In browser, use relative URL
    return "";
  }
  // On server, use environment variable or fallback to localhost for development
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:3000";
};

export const client = hc<AppType>(getBaseUrl());

export const api = client.api;
