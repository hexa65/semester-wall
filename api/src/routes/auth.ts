import { Router } from "express";
import { hashPassword, signToken, verifyPassword } from "../auth.js";
import { getUserId, requireAuth } from "../authMiddleware.js";
import { getJwtSecret } from "../config.js";
import { pool } from "../db.js";
import { HttpError, isUniqueViolation } from "../errors.js";
import type { AuthResponse, User } from "../types.js";
import { validateLogin, validateRegister } from "../validate.js";

export const authRouter = Router();

type UserRow = User & { passwordHash: string };

// A real hash to compare against when the email is unknown, so "no such user" takes as long as "wrong password".
const DUMMY_HASH =
  "scrypt$00000000000000000000000000000000$" + "00".repeat(64);

authRouter.post("/register", async (req, res) => {
  const input = validateRegister(req.body);
  if (!input.ok) throw new HttpError(400, input.message);
  const hash = await hashPassword(input.value.password);
  try {
    const { rows } = await pool.query<User>(
      `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name`,
      [input.value.email, input.value.name, hash],
    );
    const user = rows[0];
    if (!user) throw new Error("Insert returned no row.");
    const body: AuthResponse = { token: signToken(user.id, getJwtSecret()), user };
    res.status(201).json(body);
  } catch (error) {
    if (isUniqueViolation(error)) throw new HttpError(409, "An account with this email already exists.");
    throw error;
  }
});

authRouter.post("/login", async (req, res) => {
  const input = validateLogin(req.body);
  if (!input.ok) throw new HttpError(400, input.message);
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, name, password_hash AS "passwordHash" FROM users WHERE email = $1`,
    [input.value.email],
  );
  const row = rows[0];
  const valid = await verifyPassword(input.value.password, row ? row.passwordHash : DUMMY_HASH);
  if (!row || !valid) throw new HttpError(401, "Email or password is incorrect.");
  const user: User = { id: row.id, email: row.email, name: row.name };
  const body: AuthResponse = { token: signToken(user.id, getJwtSecret()), user };
  res.json(body);
});

// Who am I? Used by the website when it opens, to check the saved token.
authRouter.get("/me", requireAuth, async (_req, res) => {
  const { rows } = await pool.query<User>(`SELECT id, email, name FROM users WHERE id = $1`, [getUserId(res)]);
  const user = rows[0];
  if (!user) throw new HttpError(401, "This account no longer exists. Please log in again.");
  res.json(user);
});
