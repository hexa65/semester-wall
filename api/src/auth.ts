// Password hashing and signed tokens, using only Node's built-in crypto (no extra packages).
// These are plain functions: the secret and the clock are passed in, so they are easy to test.
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

// A password is never stored. We store "scrypt$salt$hash". The salt is random, so the same
// password gives a different hash for every user. scrypt is slow on purpose, to make guessing expensive.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, saltHex, keyHex, extra] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !keyHex || extra !== undefined) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await derive(password, Buffer.from(saltHex, "hex"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const toBase64Url = (text: string): string => Buffer.from(text, "utf8").toString("base64url");

// A token is "payload.signature". The payload says who the user is and when the token expires.
// The signature proves WE made it: nobody can change the payload without the secret.
export function signToken(userId: number, secret: string, now: number = Date.now(), ttlMs: number = WEEK_MS): string {
  const payload = toBase64Url(JSON.stringify({ sub: userId, exp: now + ttlMs }));
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

// Returns the user id, or null when the token is fake, changed or expired.
export function verifyToken(token: string, secret: string, now: number = Date.now()): number | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = createHmac("sha256", secret).update(payload).digest();
  const given = Buffer.from(signature, "base64url");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  if (!("sub" in data) || typeof data.sub !== "number") return null;
  if (!("exp" in data) || typeof data.exp !== "number" || data.exp <= now) return null;
  return data.sub;
}
