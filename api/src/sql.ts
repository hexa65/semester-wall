// Builds "UPDATE ... SET a = $1, b = $2 WHERE id = $3 AND <owner check>".
// SECURITY: column names come ONLY from the fixed `columns` object written in our own code,
// never from the request. The request only supplies VALUES, and values always go in parameters.
// The owner check makes sure a user can only change THEIR OWN rows.

export interface BuiltUpdate {
  text: string;
  values: unknown[];
}

// "own-row": the table has a user_id column (courses). "via-course": the row belongs to a course the user owns.
export type OwnerScope = "own-row" | "via-course";

export function buildUpdate(
  table: "courses" | "deadlines" | "class_sessions",
  columns: Record<string, string>,
  input: object,
  id: number,
  returning: string,
  userId: number,
  scope: OwnerScope,
): BuiltUpdate | null {
  const sets: string[] = [];
  const values: unknown[] = [];
  const entries: [string, unknown][] = Object.entries(input);

  for (const [key, value] of entries) {
    const column = columns[key];
    if (column === undefined || value === undefined) continue; // not on the whitelist: ignore
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }
  if (sets.length === 0) return null;

  values.push(id);
  const idParam = values.length;
  values.push(userId);
  const userParam = values.length;
  const owner =
    scope === "own-row"
      ? `user_id = $${userParam}`
      : `course_id IN (SELECT id FROM courses WHERE user_id = $${userParam})`;

  return {
    text: `UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${idParam} AND ${owner} RETURNING ${returning}`,
    values,
  };
}
