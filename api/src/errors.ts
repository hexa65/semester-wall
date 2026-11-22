import type { NextFunction, Request, Response } from "express";
import { parseId } from "./validate.js";

// An error we throw on purpose, with the HTTP status to send back.
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Narrow `unknown` to "an object with a string `code`" (what pg errors look like).
function hasCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string";
}

export const isUniqueViolation = (error: unknown): boolean => hasCode(error) && error.code === "23505";
export const isForeignKeyViolation = (error: unknown): boolean => hasCode(error) && error.code === "23503";

// Narrow `unknown` to "an object with a numeric `status`" (body-parser errors, for example).
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === "object" && error !== null && "status" in error && typeof error.status === "number";
}

// Turn the raw :id from the URL into a number, or answer 400.
export function requireId(value: unknown): number {
  const id = parseId(value);
  if (id === null) throw new HttpError(400, "The id in the address must be a positive whole number.");
  return id;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: "That address does not exist on this API." });
}

// The last stop: every error ends up here.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (hasStatus(error) && error.status >= 400 && error.status < 500) {
    res.status(400).json({ message: "The request body is not valid JSON." });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
}
