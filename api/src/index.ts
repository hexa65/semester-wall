import "dotenv/config";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { limitAuthAttempts, requireAuth } from "./authMiddleware.js";
import { getJwtSecret } from "./config.js";
import { pool } from "./db.js";
import { errorHandler, notFoundHandler } from "./errors.js";
import { authRouter } from "./routes/auth.js";
import { coursesRouter } from "./routes/courses.js";
import { deadlinesRouter } from "./routes/deadlines.js";
import { semesterRouter } from "./routes/semester.js";
import { sessionsRouter } from "./routes/sessions.js";

getJwtSecret(); // fail at start-up, not at the first login, if the secret is missing

const app = express();
const port = Number(process.env.PORT ?? 4000);
const readOnly = process.env.READ_ONLY === "true";
const origins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin !== "");

// Render sits behind a proxy: this makes req.ip the visitor's address (used by the login brake).
app.set("trust proxy", 1);
app.use(cors({ origin: origins }));
app.use(express.json());

// Public demo mode: anyone can look, nobody can change anything. Logging in is still allowed (the demo account).
app.use((req: Request, res: Response, next: NextFunction) => {
  const isLogin = req.method === "POST" && req.path === "/auth/login";
  if (readOnly && req.method !== "GET" && req.method !== "OPTIONS" && !isLogin) {
    res.status(403).json({ message: "This demo is read-only. Changes are turned off." });
    return;
  }
  next();
});

app.get("/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok", readOnly });
});

app.use("/auth", limitAuthAttempts, authRouter);
// Everything below needs a valid login token.
app.use("/courses", requireAuth, coursesRouter);
app.use("/deadlines", requireAuth, deadlinesRouter);
app.use("/sessions", requireAuth, sessionsRouter);
app.use("/semester", requireAuth, semesterRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Study Planner API on port ${port}${readOnly ? " (read-only)" : ""}`);
});
