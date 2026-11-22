import { Router } from "express";
import { getUserId } from "../authMiddleware.js";
import { pool } from "../db.js";
import { HttpError, requireId } from "../errors.js";
import { assertOwnsCourse } from "../ownership.js";
import { buildUpdate } from "../sql.js";
import type { ClassSession } from "../types.js";
import { checkSessionTimes, findOverlap, validateCreateSession, validateUpdateSession } from "../validate.js";

export const sessionsRouter = Router();

const RETURNING = `id, course_id AS "courseId", weekday, start_time AS "startTime", end_time AS "endTime", room`;
const SELECTED = `s.id, s.course_id AS "courseId", s.weekday, s.start_time AS "startTime", s.end_time AS "endTime", s.room`;
const UPDATABLE = {
  courseId: "course_id",
  weekday: "weekday",
  startTime: "start_time",
  endTime: "end_time",
  room: "room",
};
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Only the logged-in user's classes (through their courses).
async function loadSessions(userId: number): Promise<ClassSession[]> {
  const { rows } = await pool.query<ClassSession>(
    `SELECT ${SELECTED} FROM class_sessions s JOIN courses c ON c.id = s.course_id
      WHERE c.user_id = $1 ORDER BY s.weekday, s.start_time, s.id`,
    [userId],
  );
  return rows;
}

// Refuse a class that overlaps another one on the same weekday (ignoring the class being edited).
function assertNoOverlap(candidate: Omit<ClassSession, "id">, all: ClassSession[], ignoreId: number | null): void {
  const others = all.filter((s) => s.id !== ignoreId);
  const clash = findOverlap(candidate, others);
  if (clash) {
    const day = DAY_NAMES[clash.weekday - 1] ?? "that day";
    throw new HttpError(409, `This class overlaps another one on ${day} (${clash.startTime} to ${clash.endTime}).`);
  }
}

sessionsRouter.get("/", async (_req, res) => {
  res.json(await loadSessions(getUserId(res)));
});

sessionsRouter.post("/", async (req, res) => {
  const userId = getUserId(res);
  const input = validateCreateSession(req.body);
  if (!input.ok) throw new HttpError(400, input.message);
  const s = input.value;
  await assertOwnsCourse(userId, s.courseId);
  assertNoOverlap(s, await loadSessions(userId), null);
  const { rows } = await pool.query<ClassSession>(
    `INSERT INTO class_sessions (course_id, weekday, start_time, end_time, room)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${RETURNING}`,
    [s.courseId, s.weekday, s.startTime, s.endTime, s.room],
  );
  res.status(201).json(rows[0]);
});

sessionsRouter.patch("/:id", async (req, res) => {
  const userId = getUserId(res);
  const id = requireId(req.params.id);
  const input = validateUpdateSession(req.body);
  if (!input.ok) throw new HttpError(400, input.message);

  // The rules about times and overlaps need the WHOLE class, so merge the change onto what is stored.
  const all = await loadSessions(userId);
  const current = all.find((s) => s.id === id);
  if (!current) throw new HttpError(404, "Class not found.");
  const merged = { ...current, ...input.value };
  const order = checkSessionTimes(merged.startTime, merged.endTime);
  if (!order.ok) throw new HttpError(400, order.message);
  if (input.value.courseId !== undefined) await assertOwnsCourse(userId, input.value.courseId);
  assertNoOverlap(merged, all, id);

  const update = buildUpdate("class_sessions", UPDATABLE, input.value, id, RETURNING, userId, "via-course");
  if (!update) throw new HttpError(400, "Send at least one field to change.");
  const { rows } = await pool.query<ClassSession>(update.text, update.values);
  res.json(rows[0]);
});

sessionsRouter.delete("/:id", async (req, res) => {
  const id = requireId(req.params.id);
  const result = await pool.query(
    "DELETE FROM class_sessions WHERE id = $1 AND course_id IN (SELECT id FROM courses WHERE user_id = $2)",
    [id, getUserId(res)],
  );
  if (result.rowCount === 0) throw new HttpError(404, "Class not found.");
  res.status(204).end();
});
