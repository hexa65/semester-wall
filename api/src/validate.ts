// PURE validators: no database, no Express, no clock. Input goes in, a result object comes out.
// That is why they are easy to test.
import { COURSE_COLORS, DEADLINE_KINDS } from "./types.js";
import type {
  ClassSession,
  CourseColor,
  CreateCourseInput,
  CreateDeadlineInput,
  CreateSessionInput,
  DeadlineFilters,
  DeadlineKind,
  LoginInput,
  RegisterInput,
  Semester,
  UpdateCourseInput,
  UpdateDeadlineInput,
  UpdateSessionInput,
} from "./types.js";

// A result is EITHER { ok: true, value } OR { ok: false, message }. TypeScript forces you to check `ok`.
export type Result<T> = { ok: true; value: T } | { ok: false; message: string };
const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = (message: string): Result<never> => ({ ok: false, message });

// ---------- small checks ----------

export function daysInMonth(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
}

// "2026-10-24" yes. "2026-02-30" no. "24/10/2026" no.
export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(Number(match[1]), month);
}

// "14:30" yes. "24:00" no. "9:30" no.
export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}

export function isCourseColor(value: unknown): value is CourseColor {
  return typeof value === "string" && COURSE_COLORS.some((color) => color === value);
}

export function isDeadlineKind(value: unknown): value is DeadlineKind {
  return typeof value === "string" && DEADLINE_KINDS.some((kind) => kind === value);
}

// Express 5 types `req.params.id` as string | string[], so accept unknown and narrow.
export function parseId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{1,9}$/.test(value)) return null;
  const id = Number(value);
  return id >= 1 ? id : null;
}

// ---------- field checks: each one takes `unknown` and returns a Result ----------

type Check<T> = (value: unknown) => Result<T>;

const checkText =
  (label: string, max: number, allowEmpty = false): Check<string> =>
  (value) => {
    if (typeof value !== "string") return fail(`${label} must be text.`);
    const text = value.trim();
    if (text === "" && !allowEmpty) return fail(`${label} is required.`);
    if (text.length > max) return fail(`${label} must be at most ${max} characters.`);
    return ok(text);
  };

const checkCode: Check<string> = (value) => {
  if (typeof value !== "string") return fail("Course code must be text.");
  const code = value.trim().replace(/\s+/g, " ").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9 -]{1,11}$/.test(code)) {
    return fail("Course code must be 2 to 12 letters, numbers, spaces or dashes, like CS 301.");
  }
  return ok(code);
};

const checkColor: Check<CourseColor> = (value) =>
  isCourseColor(value) ? ok(value) : fail(`Color must be one of: ${COURSE_COLORS.join(", ")}.`);

const checkKind: Check<DeadlineKind> = (value) =>
  isDeadlineKind(value) ? ok(value) : fail(`Kind must be one of: ${DEADLINE_KINDS.join(", ")}.`);

const checkDate =
  (label: string): Check<string> =>
  (value) =>
    isValidDate(value) ? ok(value) : fail(`${label} must be a real date written as YYYY-MM-DD.`);

const checkOptionalTime: Check<string> = (value) =>
  value === "" || isValidTime(value) ? ok(String(value)) : fail('Time must be "HH:MM" in 24-hour format, or empty.');

const checkTime =
  (label: string): Check<string> =>
  (value) =>
    isValidTime(value) ? ok(value) : fail(`${label} must be "HH:MM" in 24-hour format.`);

const checkBoolean: Check<boolean> = (value) =>
  typeof value === "boolean" ? ok(value) : fail("Done must be true or false.");

const checkId =
  (label: string): Check<number> =>
  (value) =>
    typeof value === "number" && Number.isInteger(value) && value >= 1
      ? ok(value)
      : fail(`${label} must be a positive whole number.`);

const checkWeekday: Check<number> = (value) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 7
    ? ok(value)
    : fail("Weekday must be a whole number from 1 (Monday) to 7 (Sunday).");

// ---------- helpers that read one field from the body ----------

function asObject(body: unknown): Result<Record<string, unknown>> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail("The request body must be a JSON object.");
  }
  return ok(Object.fromEntries(Object.entries(body)));
}

function required<T>(body: Record<string, unknown>, key: string, check: Check<T>): Result<T> {
  if (body[key] === undefined) return fail(`"${key}" is required.`);
  return check(body[key]);
}

function optional<T>(body: Record<string, unknown>, key: string, check: Check<T>): Result<T | undefined> {
  if (body[key] === undefined) return ok(undefined);
  return check(body[key]);
}

// ---------- courses ----------

export function validateCreateCourse(body: unknown): Result<CreateCourseInput> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const code = required(obj.value, "code", checkCode);
  if (!code.ok) return code;
  const title = required(obj.value, "title", checkText("Title", 80));
  if (!title.ok) return title;
  const color = required(obj.value, "color", checkColor);
  if (!color.ok) return color;
  return ok({ code: code.value, title: title.value, color: color.value });
}

export function validateUpdateCourse(body: unknown): Result<UpdateCourseInput> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const out: UpdateCourseInput = {};
  const code = optional(obj.value, "code", checkCode);
  if (!code.ok) return code;
  if (code.value !== undefined) out.code = code.value;
  const title = optional(obj.value, "title", checkText("Title", 80));
  if (!title.ok) return title;
  if (title.value !== undefined) out.title = title.value;
  const color = optional(obj.value, "color", checkColor);
  if (!color.ok) return color;
  if (color.value !== undefined) out.color = color.value;
  if (Object.keys(out).length === 0) return fail("Send at least one field to change.");
  return ok(out);
}

// ---------- deadlines ----------

export function validateCreateDeadline(body: unknown): Result<CreateDeadlineInput> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const courseId = required(obj.value, "courseId", checkId("Course"));
  if (!courseId.ok) return courseId;
  const title = required(obj.value, "title", checkText("Title", 120));
  if (!title.ok) return title;
  const kind = required(obj.value, "kind", checkKind);
  if (!kind.ok) return kind;
  const dueDate = required(obj.value, "dueDate", checkDate("Due date"));
  if (!dueDate.ok) return dueDate;
  const dueTime = optional(obj.value, "dueTime", checkOptionalTime);
  if (!dueTime.ok) return dueTime;
  const done = optional(obj.value, "done", checkBoolean);
  if (!done.ok) return done;
  const note = optional(obj.value, "note", checkText("Note", 500, true));
  if (!note.ok) return note;
  return ok({
    courseId: courseId.value,
    title: title.value,
    kind: kind.value,
    dueDate: dueDate.value,
    dueTime: dueTime.value ?? "",
    done: done.value ?? false,
    note: note.value ?? "",
  });
}

export function validateUpdateDeadline(body: unknown): Result<UpdateDeadlineInput> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const out: UpdateDeadlineInput = {};
  const courseId = optional(obj.value, "courseId", checkId("Course"));
  if (!courseId.ok) return courseId;
  if (courseId.value !== undefined) out.courseId = courseId.value;
  const title = optional(obj.value, "title", checkText("Title", 120));
  if (!title.ok) return title;
  if (title.value !== undefined) out.title = title.value;
  const kind = optional(obj.value, "kind", checkKind);
  if (!kind.ok) return kind;
  if (kind.value !== undefined) out.kind = kind.value;
  const dueDate = optional(obj.value, "dueDate", checkDate("Due date"));
  if (!dueDate.ok) return dueDate;
  if (dueDate.value !== undefined) out.dueDate = dueDate.value;
  const dueTime = optional(obj.value, "dueTime", checkOptionalTime);
  if (!dueTime.ok) return dueTime;
  if (dueTime.value !== undefined) out.dueTime = dueTime.value;
  const done = optional(obj.value, "done", checkBoolean);
  if (!done.ok) return done;
  if (done.value !== undefined) out.done = done.value;
  const note = optional(obj.value, "note", checkText("Note", 500, true));
  if (!note.ok) return note;
  if (note.value !== undefined) out.note = note.value;
  if (Object.keys(out).length === 0) return fail("Send at least one field to change.");
  return ok(out);
}

// The query string of GET /deadlines. Every filter is optional.
export function validateDeadlineQuery(query: unknown): Result<DeadlineFilters> {
  const obj = asObject(query);
  if (!obj.ok) return obj;
  const filters: DeadlineFilters = {};
  const { from, to, courseId, done } = obj.value;

  if (from !== undefined) {
    if (!isValidDate(from)) return fail('"from" must be a real date written as YYYY-MM-DD.');
    filters.from = from;
  }
  if (to !== undefined) {
    if (!isValidDate(to)) return fail('"to" must be a real date written as YYYY-MM-DD.');
    filters.to = to;
  }
  if (filters.from !== undefined && filters.to !== undefined && filters.from > filters.to) {
    return fail('"from" must be on or before "to".');
  }
  if (courseId !== undefined) {
    const id = parseId(courseId);
    if (id === null) return fail('"courseId" must be a positive whole number.');
    filters.courseId = id;
  }
  if (done !== undefined) {
    if (done !== "true" && done !== "false") return fail('"done" must be true or false.');
    filters.done = done === "true";
  }
  return ok(filters);
}

// ---------- class sessions ----------

export function checkSessionTimes(startTime: string, endTime: string): Result<true> {
  // "HH:MM" strings sort the same way as the times themselves.
  return endTime > startTime ? ok(true) : fail("End time must be after start time.");
}

export function validateCreateSession(body: unknown): Result<CreateSessionInput> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const courseId = required(obj.value, "courseId", checkId("Course"));
  if (!courseId.ok) return courseId;
  const weekday = required(obj.value, "weekday", checkWeekday);
  if (!weekday.ok) return weekday;
  const startTime = required(obj.value, "startTime", checkTime("Start time"));
  if (!startTime.ok) return startTime;
  const endTime = required(obj.value, "endTime", checkTime("End time"));
  if (!endTime.ok) return endTime;
  const room = optional(obj.value, "room", checkText("Room", 40, true));
  if (!room.ok) return room;
  const order = checkSessionTimes(startTime.value, endTime.value);
  if (!order.ok) return order;
  return ok({
    courseId: courseId.value,
    weekday: weekday.value,
    startTime: startTime.value,
    endTime: endTime.value,
    room: room.value ?? "",
  });
}

export function validateUpdateSession(body: unknown): Result<UpdateSessionInput> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const out: UpdateSessionInput = {};
  const courseId = optional(obj.value, "courseId", checkId("Course"));
  if (!courseId.ok) return courseId;
  if (courseId.value !== undefined) out.courseId = courseId.value;
  const weekday = optional(obj.value, "weekday", checkWeekday);
  if (!weekday.ok) return weekday;
  if (weekday.value !== undefined) out.weekday = weekday.value;
  const startTime = optional(obj.value, "startTime", checkTime("Start time"));
  if (!startTime.ok) return startTime;
  if (startTime.value !== undefined) out.startTime = startTime.value;
  const endTime = optional(obj.value, "endTime", checkTime("End time"));
  if (!endTime.ok) return endTime;
  if (endTime.value !== undefined) out.endTime = endTime.value;
  const room = optional(obj.value, "room", checkText("Room", 40, true));
  if (!room.ok) return room;
  if (room.value !== undefined) out.room = room.value;
  if (Object.keys(out).length === 0) return fail("Send at least one field to change.");
  return ok(out);
}

// Two classes overlap when each one starts before the other one ends.
// A class that ends at 10:30 and one that starts at 10:30 do NOT overlap.
export function findOverlap(
  candidate: { weekday: number; startTime: string; endTime: string },
  others: ClassSession[],
): ClassSession | undefined {
  return others.find(
    (other) =>
      other.weekday === candidate.weekday &&
      candidate.startTime < other.endTime &&
      other.startTime < candidate.endTime,
  );
}

// ---------- semester ----------

export function validateSemester(body: unknown): Result<Semester> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const startDate = required(obj.value, "startDate", checkDate("Start date"));
  if (!startDate.ok) return startDate;
  const endDate = required(obj.value, "endDate", checkDate("End date"));
  if (!endDate.ok) return endDate;
  if (endDate.value <= startDate.value) return fail("End date must be after start date.");
  return ok({ startDate: startDate.value, endDate: endDate.value });
}

// ---------- accounts ----------

const checkEmail: Check<string> = (value) => {
  if (typeof value !== "string") return fail("Email must be text.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  return ok(email);
};

const checkNewPassword: Check<string> = (value) => {
  if (typeof value !== "string") return fail("Password must be text.");
  if (value.length < 8) return fail("Password must be at least 8 characters.");
  if (value.length > 128) return fail("Password must be at most 128 characters.");
  return ok(value);
};

export function validateRegister(body: unknown): Result<RegisterInput> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const email = required(obj.value, "email", checkEmail);
  if (!email.ok) return email;
  const password = required(obj.value, "password", checkNewPassword);
  if (!password.ok) return password;
  const name = optional(obj.value, "name", checkText("Name", 60, true));
  if (!name.ok) return name;
  return ok({ email: email.value, password: password.value, name: name.value ?? "" });
}

// Login does not check the password's length: a wrong password is just "incorrect", never a hint.
export function validateLogin(body: unknown): Result<LoginInput> {
  const obj = asObject(body);
  if (!obj.ok) return obj;
  const email = required(obj.value, "email", checkEmail);
  if (!email.ok) return email;
  const password = obj.value.password;
  if (typeof password !== "string" || password === "") return fail("Enter your password.");
  return ok({ email: email.value, password });
}
