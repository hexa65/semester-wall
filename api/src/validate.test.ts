// Cases covered, in plain words:
//  Dates: a real date passes; 30 February, wrong separators and non-text fail; 29 February only in a leap year.
//  Times: "14:30" passes; "24:00", "9:30" and "" (for strict times) fail.
//  Ids: only positive whole numbers written as text.
//  Courses: a good course is cleaned (trim, upper-case code); bad code, bad color, empty title fail; update needs one field.
//  Deadlines: good input gets defaults; bad kind, bad date, bad time fail; the query needs from <= to.
//  Sessions: weekday 1 to 7; end after start; overlaps found on the same weekday only; touching classes do not overlap.
//  Semester: end must be after start.
import { describe, expect, it } from "vitest";
import {
  findOverlap,
  isValidDate,
  isValidTime,
  parseId,
  validateCreateCourse,
  validateCreateDeadline,
  validateCreateSession,
  validateDeadlineQuery,
  validateLogin,
  validateRegister,
  validateSemester,
  validateUpdateCourse,
  validateUpdateDeadline,
} from "./validate.js";

describe("dates and times", () => {
  it("accepts real dates", () => {
    expect(isValidDate("2026-10-24")).toBe(true);
    expect(isValidDate("2028-02-29")).toBe(true);
  });
  it("rejects impossible dates and wrong shapes", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2027-02-29")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("24/10/2026")).toBe(false);
    expect(isValidDate(20261024)).toBe(false);
  });
  it("checks 24-hour times", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("9:30")).toBe(false);
    expect(isValidTime("")).toBe(false);
  });
  it("parses ids", () => {
    expect(parseId("12")).toBe(12);
    expect(parseId("0")).toBeNull();
    expect(parseId("-1")).toBeNull();
    expect(parseId("1.5")).toBeNull();
    expect(parseId(["1"])).toBeNull();
  });
});

describe("course validators", () => {
  it("cleans a good course", () => {
    const r = validateCreateCourse({ code: " cs   301 ", title: "  Data Structures ", color: "blue" });
    expect(r).toEqual({ ok: true, value: { code: "CS 301", title: "Data Structures", color: "blue" } });
  });
  it("rejects a bad color, an empty title and a bad code", () => {
    expect(validateCreateCourse({ code: "CS 301", title: "X", color: "pink" }).ok).toBe(false);
    expect(validateCreateCourse({ code: "CS 301", title: "  ", color: "blue" }).ok).toBe(false);
    expect(validateCreateCourse({ code: "!", title: "X", color: "blue" }).ok).toBe(false);
  });
  it("rejects a body that is not an object", () => {
    expect(validateCreateCourse(null).ok).toBe(false);
    expect(validateCreateCourse([]).ok).toBe(false);
  });
  it("update needs at least one valid field", () => {
    expect(validateUpdateCourse({}).ok).toBe(false);
    expect(validateUpdateCourse({ color: "teal" })).toEqual({ ok: true, value: { color: "teal" } });
    expect(validateUpdateCourse({ color: "nope" }).ok).toBe(false);
  });
});

describe("deadline validators", () => {
  const good = { courseId: 1, title: "Essay", kind: "Assignment", dueDate: "2026-10-24" };
  it("fills the defaults", () => {
    expect(validateCreateDeadline(good)).toEqual({
      ok: true,
      value: { courseId: 1, title: "Essay", kind: "Assignment", dueDate: "2026-10-24", dueTime: "", done: false, note: "" },
    });
  });
  it("rejects a bad kind, date or time", () => {
    expect(validateCreateDeadline({ ...good, kind: "Party" }).ok).toBe(false);
    expect(validateCreateDeadline({ ...good, dueDate: "2026-02-30" }).ok).toBe(false);
    expect(validateCreateDeadline({ ...good, dueTime: "25:00" }).ok).toBe(false);
    expect(validateCreateDeadline({ ...good, courseId: "1" }).ok).toBe(false);
  });
  it("update can toggle done alone", () => {
    expect(validateUpdateDeadline({ done: true })).toEqual({ ok: true, value: { done: true } });
    expect(validateUpdateDeadline({ done: "yes" }).ok).toBe(false);
  });
  it("query filters", () => {
    expect(validateDeadlineQuery({})).toEqual({ ok: true, value: {} });
    expect(validateDeadlineQuery({ from: "2026-10-01", to: "2026-10-31", courseId: "2", done: "false" })).toEqual({
      ok: true,
      value: { from: "2026-10-01", to: "2026-10-31", courseId: 2, done: false },
    });
    expect(validateDeadlineQuery({ from: "2026-11-01", to: "2026-10-01" }).ok).toBe(false);
    expect(validateDeadlineQuery({ done: "maybe" }).ok).toBe(false);
    expect(validateDeadlineQuery({ courseId: "abc" }).ok).toBe(false);
  });
});

describe("session validators", () => {
  const good = { courseId: 1, weekday: 1, startTime: "09:00", endTime: "10:30", room: "B204" };
  it("accepts a good session", () => {
    expect(validateCreateSession(good).ok).toBe(true);
  });
  it("checks weekday range and time order", () => {
    expect(validateCreateSession({ ...good, weekday: 0 }).ok).toBe(false);
    expect(validateCreateSession({ ...good, weekday: 8 }).ok).toBe(false);
    expect(validateCreateSession({ ...good, startTime: "11:00" }).ok).toBe(false);
    expect(validateCreateSession({ ...good, endTime: "09:00" }).ok).toBe(false);
  });
  const existing = [{ id: 1, courseId: 1, weekday: 1, startTime: "09:00", endTime: "10:30", room: "" }];
  it("finds overlaps on the same weekday only", () => {
    expect(findOverlap({ weekday: 1, startTime: "10:00", endTime: "11:00" }, existing)?.id).toBe(1);
    expect(findOverlap({ weekday: 2, startTime: "10:00", endTime: "11:00" }, existing)).toBeUndefined();
  });
  it("classes that only touch do not overlap", () => {
    expect(findOverlap({ weekday: 1, startTime: "10:30", endTime: "12:00" }, existing)).toBeUndefined();
    expect(findOverlap({ weekday: 1, startTime: "08:00", endTime: "09:00" }, existing)).toBeUndefined();
  });
});

describe("semester validator", () => {
  it("needs the end after the start", () => {
    expect(validateSemester({ startDate: "2026-09-01", endDate: "2026-12-15" }).ok).toBe(true);
    expect(validateSemester({ startDate: "2026-09-01", endDate: "2026-09-01" }).ok).toBe(false);
    expect(validateSemester({ startDate: "2026-12-15", endDate: "2026-09-01" }).ok).toBe(false);
    expect(validateSemester({ startDate: "2026-09-01" }).ok).toBe(false);
  });
});

describe("account validators", () => {
  it("cleans a good registration", () => {
    expect(validateRegister({ email: "  Ada@Example.COM ", password: "longenough", name: " Ada " })).toEqual({
      ok: true,
      value: { email: "ada@example.com", password: "longenough", name: "Ada" },
    });
  });
  it("rejects a bad email or a short password", () => {
    expect(validateRegister({ email: "nope", password: "longenough" }).ok).toBe(false);
    expect(validateRegister({ email: "a@b.co", password: "short" }).ok).toBe(false);
    expect(validateRegister({ email: "a@b.co" }).ok).toBe(false);
  });
  it("login needs an email and some password", () => {
    expect(validateLogin({ email: "a@b.co", password: "x" }).ok).toBe(true);
    expect(validateLogin({ email: "a@b.co", password: "" }).ok).toBe(false);
    expect(validateLogin({ email: "bad", password: "x" }).ok).toBe(false);
  });
});
