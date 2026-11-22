import { Router } from "express";
import { getUserId } from "../authMiddleware.js";
import { pool } from "../db.js";
import { HttpError, isUniqueViolation, requireId } from "../errors.js";
import { buildUpdate } from "../sql.js";
import type { Course, CourseSummary } from "../types.js";
import { validateCreateCourse, validateUpdateCourse } from "../validate.js";

export const coursesRouter = Router();

const COLUMNS = "id, code, title, color";
const UPDATABLE = { code: "code", title: "title", color: "color" };
const DUPLICATE = "You already have a course with this code.";

// Every query below filters by the logged-in user's id: nobody sees or changes another person's courses.
const SUMMARY_SELECT = `SELECT c.id, c.code, c.title, c.color,
            (SELECT COUNT(*)::int FROM deadlines d WHERE d.course_id = c.id) AS "deadlineCount",
            (SELECT COUNT(*)::int FROM class_sessions s WHERE s.course_id = c.id) AS "sessionCount"
       FROM courses c`;

// GET /courses: your courses with how many deadlines and classes each has.
coursesRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query<CourseSummary>(`${SUMMARY_SELECT} WHERE c.user_id = $1 ORDER BY c.code`, [
    getUserId(res),
  ]);
  res.json(rows);
});

coursesRouter.get("/:id", async (req, res) => {
  const id = requireId(req.params.id);
  const { rows } = await pool.query<CourseSummary>(`${SUMMARY_SELECT} WHERE c.id = $1 AND c.user_id = $2`, [
    id,
    getUserId(res),
  ]);
  const course = rows[0];
  if (!course) throw new HttpError(404, "Course not found.");
  res.json(course);
});

coursesRouter.post("/", async (req, res) => {
  const input = validateCreateCourse(req.body);
  if (!input.ok) throw new HttpError(400, input.message);
  try {
    const { rows } = await pool.query<Course>(
      `INSERT INTO courses (user_id, code, title, color) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [getUserId(res), input.value.code, input.value.title, input.value.color],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) throw new HttpError(409, DUPLICATE);
    throw error;
  }
});

coursesRouter.patch("/:id", async (req, res) => {
  const id = requireId(req.params.id);
  const input = validateUpdateCourse(req.body);
  if (!input.ok) throw new HttpError(400, input.message);
  const update = buildUpdate("courses", UPDATABLE, input.value, id, COLUMNS, getUserId(res), "own-row");
  if (!update) throw new HttpError(400, "Send at least one field to change.");
  try {
    const { rows } = await pool.query<Course>(update.text, update.values);
    const course = rows[0];
    if (!course) throw new HttpError(404, "Course not found.");
    res.json(course);
  } catch (error) {
    if (isUniqueViolation(error)) throw new HttpError(409, DUPLICATE);
    throw error;
  }
});

// ON DELETE CASCADE in the schema removes the course's deadlines and classes too.
coursesRouter.delete("/:id", async (req, res) => {
  const id = requireId(req.params.id);
  const result = await pool.query("DELETE FROM courses WHERE id = $1 AND user_id = $2", [id, getUserId(res)]);
  if (result.rowCount === 0) throw new HttpError(404, "Course not found.");
  res.status(204).end();
});
