import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./auth.js";
import { getJwtSecret } from "./config.js";
import { HttpError } from "./errors.js";

// Runs before every data route. It reads "Authorization: Bearer <token>" and remembers WHO is asking.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const userId = token === "" ? null : verifyToken(token, getJwtSecret());
  if (userId === null) {
    next(new HttpError(401, "Please log in to continue."));
    return;
  }
  res.locals.userId = userId;
  next();
}

// Routes call this to get the id of the logged-in user.
export function getUserId(res: Response): number {
  const id: unknown = res.locals.userId;
  if (typeof id !== "number") throw new HttpError(401, "Please log in to continue.");
  return id;
}

// A tiny in-memory brake against password guessing: 20 tries per 15 minutes per address.
const attempts = new Map<string, { count: number; resetAt: number }>();
export function limitAuthAttempts(req: Request, _res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = req.ip ?? "unknown";
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    next();
    return;
  }
  entry.count += 1;
  if (entry.count > 20) {
    next(new HttpError(429, "Too many attempts. Wait a few minutes and try again."));
    return;
  }
  next();
}
