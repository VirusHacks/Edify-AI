import { config } from "dotenv";

config({ path: ".env" });

export type Environment = "development" | "production" | "test";

export class BaseEnvironment {
  defaultEnvironmentValues = {
    HOST_URL: "http://localhost:3000",
    GEMINI_API_KEY: "",
    DRIZZLE_DATABASE_URL: "",
    FIREBASE_API_KEY: "",
    FIREBASE_AUTH_DOMAIN: "",
    FIREBASE_PROJECT_ID: "",
    FIREBASE_STORAGE_BUCKET: "",
    FIREBASE_MESSAGING_SENDER_ID: "",
    FIREBASE_APP_ID: "",
    FIREBASE_MEASUREMENT_ID: "",
    YOUTUBE_API_KEY: "",
  };

  get environment(): Environment {
    return process.env.NODE_ENV as Environment;
  }

  get HOST_URL(): string {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_HOST_URL ||
      this.defaultEnvironmentValues.HOST_URL
    );
  }

  get GOOGLE_GEMENI_API_KEY(): string {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      this.defaultEnvironmentValues.GEMINI_API_KEY
    );
  }

  get DRIZZLE_DATABASE_URL(): string {
    return (
      process.env.DRIZZLE_DATABASE_URL ||
      this.defaultEnvironmentValues.DRIZZLE_DATABASE_URL
    );
  }

  get FIREBASE_API_KEY(): string {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      this.defaultEnvironmentValues.FIREBASE_API_KEY
    );
  }

  get FIREBASE_AUTH_DOMAIN(): string {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      this.defaultEnvironmentValues.FIREBASE_AUTH_DOMAIN
    );
  }

  get FIREBASE_PROJECT_ID(): string {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      this.defaultEnvironmentValues.FIREBASE_PROJECT_ID
    );
  }

  get FIREBASE_STORAGE_BUCKET(): string {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      this.defaultEnvironmentValues.FIREBASE_STORAGE_BUCKET
    );
  }

  get FIREBASE_MESSAGING_SENDER_ID(): string {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      this.defaultEnvironmentValues.FIREBASE_MESSAGING_SENDER_ID
    );
  }

  get FIREBASE_APP_ID(): string {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      this.defaultEnvironmentValues.FIREBASE_APP_ID
    );
  }

  get FIREBASE_MEASUREMENT_ID(): string {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
      this.defaultEnvironmentValues.FIREBASE_MEASUREMENT_ID
    );
  }

  get YOUTUBE_API_KEY(): string {
    return (
      process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
      this.defaultEnvironmentValues.YOUTUBE_API_KEY
    );
  }

  get PERPLEXITY_API_KEY(): string {
    return (
      process.env.PERPLEXITY_API_KEY ||
      process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY ||
      ""
    );
  }
}