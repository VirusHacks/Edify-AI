import crypto from "crypto";

const TOKEN_SECRET =
  process.env.EXTENSION_TOKEN_SECRET ||
  process.env.KINDE_CLIENT_SECRET ||
  "default-secret-change-in-production";

export async function verifyExtensionToken(
  token: string,
): Promise<{ userId: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const userId = parts[0];
    const tokenData = Buffer.from(parts[1], "base64url").toString("utf-8");
    const [timestamp, hash] = tokenData.split(":");

    if (!timestamp || !hash) return null;

    const tokenTimestamp = parseInt(timestamp, 10);
    const expiresAt = tokenTimestamp + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Check if token is expired
    if (Date.now() > expiresAt) return null;

    // Verify hash
    const expectedHash = crypto
      .createHash("sha256")
      .update(`${userId}:${timestamp}:${TOKEN_SECRET}`)
      .digest("hex")
      .substring(0, 32);

    if (hash !== expectedHash) return null;

    return { userId };
  } catch (error) {
    console.error("Verify extension token error:", error);
    return null;
  }
}


