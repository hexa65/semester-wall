import { Router } from "express";
import { getUserId } from "../authMiddleware.js";
import { pool } from "../db.js";
import { HttpError } from "../errors.js";
import type { Semester } from "../types.js";
import { validateSemester } from "../validate.js";

export const semesterRouter = Router();

const COLUMNS = `start_date AS "startDate", end_date AS "endDate"`;

// Each user has one semester row (user_id is the primary key).
semesterRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query<Semester>(`SELECT ${COLUMNS} FROM semester WHERE user_id = $1`, [getUserId(res)]);
  const semester = rows[0];
  if (!semester) throw new HttpError(404, "The semester dates are not set yet.");
  res.json(semester);
});

// PUT replaces the one row (or creates it the first time).
semesterRouter.put("/", async (req, res) => {
  const input = validateSemester(req.body);
  if (!input.ok) throw new HttpError(400, input.message);
  const { rows } = await pool.query<Semester>(
    `INSERT INTO semester (user_id, start_date, end_date) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date
     RETURNING ${COLUMNS}`,
    [getUserId(res), input.value.startDate, input.value.endDate],
  );
  res.json(rows[0]);
});
