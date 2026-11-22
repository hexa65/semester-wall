// Creates (or resets) the DEMO account with sample data. Run it with:  npm run seed
//   email:    demo@example.com
//   password: demo-password-123
// Dates are relative to today, so there are always overdue, today and upcoming items. Run it again to reset.
// Anyone who sees this file knows the demo password: the demo account must only ever hold sample data.
import { hashPassword } from "../auth.js";
import { pool } from "../db.js";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo-password-123";

type CourseSeed = { code: string; title: string; color: string };
type SessionSeed = { code: string; weekday: number; start: string; end: string; room: string };
type DeadlineSeed = { code: string; title: string; kind: string; offset: number; time: string; done: boolean; note: string };

const courses: CourseSeed[] = [
  { code: "CS 301", title: "Data Structures", color: "blue" },
  { code: "CS 305", title: "Databases", color: "purple" },
  { code: "MA 210", title: "Linear Algebra", color: "orange" },
  { code: "EE 220", title: "Digital Logic", color: "green" },
  { code: "GE 101", title: "Technical Writing", color: "rose" },
];

// weekday: 1 = Monday ... 7 = Sunday. No two classes overlap.
const sessions: SessionSeed[] = [
  { code: "CS 301", weekday: 1, start: "09:00", end: "10:30", room: "Hall B204" },
  { code: "CS 301", weekday: 3, start: "09:00", end: "10:30", room: "Hall B204" },
  { code: "CS 305", weekday: 2, start: "11:00", end: "12:30", room: "Lab 3" },
  { code: "CS 305", weekday: 4, start: "11:00", end: "12:30", room: "Lab 3" },
  { code: "MA 210", weekday: 1, start: "13:00", end: "14:30", room: "Room A12" },
  { code: "MA 210", weekday: 3, start: "13:00", end: "14:30", room: "Room A12" },
  { code: "EE 220", weekday: 2, start: "14:00", end: "15:30", room: "Lab 1" },
  { code: "GE 101", weekday: 5, start: "10:00", end: "11:30", room: "Room C7" },
];

// offset = days from today. done only for -9 and -6.
const deadlines: DeadlineSeed[] = [
  { code: "CS 301", title: "Linked lists worksheet", kind: "Assignment", offset: -9, time: "", done: true, note: "" },
  { code: "MA 210", title: "Read chapter 4: vector spaces", kind: "Reading", offset: -6, time: "", done: true, note: "Focus on the span examples" },
  { code: "CS 305", title: "SQL joins problem set", kind: "Assignment", offset: -3, time: "23:59", done: false, note: "Submit through the course portal" },
  { code: "EE 220", title: "Boolean algebra quiz", kind: "Test", offset: -1, time: "", done: false, note: "" },
  { code: "CS 301", title: "Stacks and queues quiz", kind: "Test", offset: 0, time: "14:30", done: false, note: "Bring a calculator" },
  { code: "MA 210", title: "Matrix problem set 3", kind: "Assignment", offset: 1, time: "", done: false, note: "" },
  { code: "GE 101", title: "Draft of the lab report", kind: "Assignment", offset: 2, time: "17:00", done: false, note: "Two pages, plain language" },
  { code: "CS 305", title: "ER diagram for the library", kind: "Project", offset: 4, time: "", done: false, note: "Pair work" },
  { code: "EE 220", title: "Read chapter 7: flip-flops", kind: "Reading", offset: 6, time: "", done: false, note: "" },
  { code: "CS 301", title: "Binary trees assignment", kind: "Assignment", offset: 9, time: "23:59", done: false, note: "" },
  { code: "MA 210", title: "Eigenvalues test", kind: "Test", offset: 13, time: "10:00", done: false, note: "Chapters 5 and 6" },
  { code: "CS 305", title: "Midterm exam", kind: "Exam", offset: 20, time: "09:00", done: false, note: "Room A1, closed book" },
  { code: "EE 220", title: "Counter circuit assignment", kind: "Assignment", offset: 27, time: "", done: false, note: "" },
  { code: "CS 301", title: "Data Structures final exam", kind: "Exam", offset: 41, time: "09:00", done: false, note: "" },
  { code: "MA 210", title: "Linear Algebra final exam", kind: "Exam", offset: 55, time: "13:00", done: false, note: "" },
  { code: "GE 101", title: "Final portfolio", kind: "Project", offset: 70, time: "12:00", done: false, note: "Three documents in one PDF" },
];

async function seed(): Promise<void> {
  // Deleting the user also deletes everything that belongs to them (ON DELETE CASCADE).
  await pool.query("DELETE FROM users WHERE email = $1", [DEMO_EMAIL]);
  const created = await pool.query<{ id: number }>(
    "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id",
    [DEMO_EMAIL, "Demo student", await hashPassword(DEMO_PASSWORD)],
  );
  const userId = created.rows[0]?.id;
  if (userId === undefined) throw new Error("Could not create the demo user.");

  await pool.query("INSERT INTO semester (user_id, start_date, end_date) VALUES ($1, CURRENT_DATE - 35, CURRENT_DATE + 84)", [userId]);

  const courseIds = new Map<string, number>();
  for (const c of courses) {
    const r = await pool.query<{ id: number }>(
      "INSERT INTO courses (user_id, code, title, color) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, c.code, c.title, c.color],
    );
    const id = r.rows[0]?.id;
    if (id === undefined) throw new Error(`Could not create ${c.code}.`);
    courseIds.set(c.code, id);
  }

  for (const s of sessions) {
    await pool.query(
      "INSERT INTO class_sessions (course_id, weekday, start_time, end_time, room) VALUES ($1, $2, $3, $4, $5)",
      [courseIds.get(s.code), s.weekday, s.start, s.end, s.room],
    );
  }

  for (const d of deadlines) {
    await pool.query(
      "INSERT INTO deadlines (course_id, title, kind, due_date, due_time, done, note) VALUES ($1, $2, $3, CURRENT_DATE + $4::int, $5, $6, $7)",
      [courseIds.get(d.code), d.title, d.kind, d.offset, d.time, d.done, d.note],
    );
  }

  const counts = await pool.query(
    `SELECT (SELECT COUNT(*)::int FROM courses WHERE user_id = $1) AS courses,
            (SELECT COUNT(*)::int FROM class_sessions s JOIN courses c ON c.id = s.course_id WHERE c.user_id = $1) AS sessions,
            (SELECT COUNT(*)::int FROM deadlines d JOIN courses c ON c.id = d.course_id WHERE c.user_id = $1) AS deadlines,
            (SELECT COUNT(*)::int FROM deadlines d JOIN courses c ON c.id = d.course_id WHERE c.user_id = $1 AND d.done = false) AS open`,
    [userId],
  );
  console.log("Demo data ready. Expected: courses 5, sessions 8, deadlines 16, open 14.");
  console.log(counts.rows[0]);
  console.log(`Log in with  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}`);
}

seed()
  .catch((error: unknown) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => void pool.end());
