// Avoid importing server-only database drivers at top-level so this module
// can be safely imported from client code without bundling server libs.
// Initialize the real DB only when running on the server (Node).
import { BaseEnvironment } from "./BaseEnvironment";

let db: any = {};

if (typeof window === "undefined") {
	// We're on the server — require server-only packages synchronously to avoid
	// bundling them into client-side code.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { neon } = require("@neondatabase/serverless");
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { drizzle } = require("drizzle-orm/neon-http");

	const env = new BaseEnvironment();
	// Initialize Neon/drizzle with the provided connection string. If the
	// environment variable is missing, this will throw on the server; that is
	// expected and should be fixed by setting the env var in your deployment.
	const sql = neon(env.DRIZZLE_DATABASE_URL!);
	db = drizzle(sql);
} else {
	// Client-side stub: accessing DB from the browser is not supported. Keep a
	// lightweight stub to avoid runtime errors during module evaluation. If a
	// client component attempts to call DB methods it will receive a clear
	// runtime message instead of bundling server libs.
	db = new Proxy(
		{},
		{
			get() {
				return () => {
					throw new Error("Attempted to access the server database from client-side code. Use an API route instead.");
				};
			},
		}
	);
}

export { db };
