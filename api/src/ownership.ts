import { pool } from "./db.js";
import { HttpError } from "./errors.js";

// A user may only attach things to THEIR OWN courses.
export async function assertOwnsCourse(userId: number, courseId: number): Promise<void> {
  const result = await pool.query("SELECT 1 FROM courses WHERE id = $1 AND user_id = $2", [courseId, userId]);
  if (!result.rowCount) throw new HttpError(400, "That course does not exist.");
}
