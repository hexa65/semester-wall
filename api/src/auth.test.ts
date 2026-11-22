// Cases in plain words:
//  Passwords: the right password verifies; a wrong one does not; the same password gives two different hashes;
//    a broken stored value never verifies.
//  Tokens: a fresh token gives back the user id; a changed payload, a wrong secret, an expired token and junk all give null.
import { describe, expect, it } from "vitest";
import { hashPassword, signToken, verifyPassword, verifyToken } from "./auth.js";

const SECRET = "a-test-secret-that-is-at-least-32-characters-long";

describe("passwords", () => {
  it("verifies the right password only", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });
  it("uses a different salt every time", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a === b).toBe(false);
  });
  it("never verifies a broken stored value", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "scrypt$zz")).toBe(false);
    expect(await verifyPassword("x", "other$aa$bb")).toBe(false);
  });
});

describe("tokens", () => {
  const now = 1_700_000_000_000;
  it("round-trips the user id", () => {
    expect(verifyToken(signToken(42, SECRET, now), SECRET, now + 1000)).toBe(42);
  });
  it("rejects a wrong secret", () => {
    expect(verifyToken(signToken(42, SECRET, now), "another-secret-another-secret-another", now)).toBeNull();
  });
  it("rejects a changed payload", () => {
    const token = signToken(42, SECRET, now);
    const forged = `${Buffer.from(JSON.stringify({ sub: 1, exp: now + 99999999 })).toString("base64url")}.${token.split(".")[1]}`;
    expect(verifyToken(forged, SECRET, now)).toBeNull();
  });
  it("rejects an expired token", () => {
    const token = signToken(42, SECRET, now, 1000);
    expect(verifyToken(token, SECRET, now + 999)).toBe(42);
    expect(verifyToken(token, SECRET, now + 1000)).toBeNull();
  });
  it("rejects junk", () => {
    expect(verifyToken("", SECRET, now)).toBeNull();
    expect(verifyToken("abc", SECRET, now)).toBeNull();
    expect(verifyToken("a.b.c", SECRET, now)).toBeNull();
  });
});
