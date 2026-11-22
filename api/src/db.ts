import "dotenv/config";
import pg from "pg";

// Postgres DATE (type id 1082) comes back as a JavaScript Date by default.
// Return the plain text "2026-10-24" instead, so no timezone can shift the day.
pg.types.setTypeParser(1082, (value: string) => value);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Copy .env.example to .env and fill it in.");
}

// One pool for the whole app. A pool keeps a few connections open and shares them.
export const pool = new pg.Pool({ connectionString, max: 5 });

// An idle connection can drop (Neon pauses). Log it instead of crashing the process.
pool.on("error", (error: Error) => {
  console.error("Unexpected database connection error:", error.message);
});
