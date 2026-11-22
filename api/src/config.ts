import "dotenv/config";

// The secret that signs login tokens. Whoever knows it can pretend to be any user, so it lives only in the environment.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or too short. Set it to random text of at least 32 characters (see .env.example).");
  }
  return secret;
}
