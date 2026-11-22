import { Router } from "express";
import { getUserId } from "../authMiddleware.js";
import { pool } from "../db.js";
import { HttpError, requireId } from "../errors.js";
import { assertOwnsCourse } from "../ownership.js";
import { buildUpdate } from "../sql.js";
import type { Deadline } from "../types.js";
import { validateCreateDeadline, validateDeadlineQuery, validateUpdateDeadline } from "../validate.js";

export const deadlinesRouter = Router();

// SQL uses snake_case, JSON uses camelCase: alias each column.
// RETURNING cannot use the table alias "d", so there are two versions of the same list.
const RETURNING = `id, course_id AS "courseId", title, kind, due_date AS "dueDate", due_time AS "dueTime", done, note`;
const SELECTED = `d.id, d.course_id AS "courseId", d.title, d.kind, d.due_date AS "dueDate", d.due_time AS "dueTime", d.done, d.note`;
// A deadline is yours when its course is yours.
const OWNED = `FROM deadlines d JOIN courses c ON c.id = d.course_id`;
const UPDATABLE = {
  courseId: "course_id",
  title: "title",
  kind: "kind",
  dueDate: "due_date",
  dueTime: "due_time",
  done: "done",
  note: "note",
};

// GET /deadlines?from=&to=&courseId=&done=   (all optional)
deadlinesRouter.get("/", async (req, res) => {
  const filters = validateDeadlineQuery(req.query);
  if (!filters.ok) throw new HttpError(400, filters.message);

  // The SQL text below is built only from fixed strings. Values go in `values`.
  const values: unknown[] = [getUserId(res)];
  const conditions: string[] = ["c.user_id = $1"];
  const { from, to, courseId, done } = filters.value;
  if (from !== undefined) {
    values.push(from);
    conditions.push(`d.due_date >= $${values.length}`);
  }
  if (to !== undefined) {
    values.push(to);
    conditions.push(`d.due_date <= $${values.length}`);
  }
  if (courseId !== undefined) {
    values.push(courseId);
    conditions.push(`d.course_id = $${values.length}`);
  }
  if (done !== undefined) {
    values.push(done);
    conditions.push(`d.done = $${values.length}`);
  }

  const { rows } = await pool.query<Deadline>(
    `SELECT ${SELECTED} ${OWNED} WHERE ${conditions.join(" AND ")} ORDER BY d.due_date, d.due_time, d.id`,
    values,
  );
  res.json(rows);
});

deadlinesRouter.get("/:id", async (req, res) => {
  const id = requireId(req.params.id);
  const { rows } = await pool.query<Deadline>(`SELECT ${SELECTED} ${OWNED} WHERE d.id = $1 AND c.user_id = $2`, [
    id,
    getUserId(res),
  ]);
  const deadline = rows[0];
  if (!deadline) throw new HttpError(404, "Deadline not found.");
  res.json(deadline);
});

deadlinesRouter.post("/", async (req, res) => {
  const input = validateCreateDeadline(req.body);
  if (!input.ok) throw new HttpError(400, input.message);
  const d = input.value;
  await assertOwnsCourse(getUserId(res), d.courseId);
  const { rows } = await pool.query<Deadline>(
    `INSERT INTO deadlines (course_id, title, kind, due_date, due_time, done, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${RETURNING}`,
    [d.courseId, d.title, d.kind, d.dueDate, d.dueTime, d.done, d.note],
  );
  res.status(201).json(rows[0]);
});

// Also used to toggle done: PATCH { "done": true }.
deadlinesRouter.patch("/:id", async (req, res) => {
  const id = requireId(req.params.id);
  const userId = getUserId(res);
  const input = validateUpdateDeadline(req.body);
  if (!input.ok) throw new HttpError(400, input.message);
  if (input.value.courseId !== undefined) await assertOwnsCourse(userId, input.value.courseId);
  const update = buildUpdate("deadlines", UPDATABLE, input.value, id, RETURNING, userId, "via-course");
  if (!update) throw new HttpError(400, "Send at least one field to change.");
  const { rows } = await pool.query<Deadline>(update.text, update.values);
  const deadline = rows[0];
  if (!deadline) throw new HttpError(404, "Deadline not found.");
  res.json(deadline);
});

deadlinesRouter.delete("/:id", async (req, res) => {
  const id = requireId(req.params.id);
  const result = await pool.query(
    "DELETE FROM deadlines WHERE id = $1 AND course_id IN (SELECT id FROM courses WHERE user_id = $2)",
    [id, getUserId(res)],
  );
  if (result.rowCount === 0) throw new HttpError(404, "Deadline not found.");
  res.status(204).end();
});
