// Cases in plain words (today is always passed in; here it is 2026-10-14, a Wednesday):
//  getOverdue: open and before today; done items never count; sorted; the input array is not changed.
//  getDueToday / getDueSoon: today only; tomorrow up to today + 7 (the 8th day is "later").
//  groupDeadlines: overdue, this week (today to today + 6), later, done.
//  getTodaysClasses / getNextClass: classes today; the next one not yet ended; rolls to another day; none outside the semester.
//  semesterProgress: before, first day, mid-semester, last day, after; counts partial weeks.
import { describe, expect, it } from "vitest";
import type { Deadline } from "../types/deadline";
import type { ClassSession } from "../types/session";
import {
  getDueSoon,
  getDueToday,
  getNextClass,
  getOverdue,
  getTodaysClasses,
  groupDeadlines,
  semesterProgress,
} from "./schedule";

const TODAY = "2026-10-14";
const dl = (id: number, dueDate: string, done = false, dueTime = ""): Deadline => ({
  id,
  courseId: 1,
  title: `D${id}`,
  kind: "Test",
  dueDate,
  dueTime,
  done,
  note: "",
});

// Offsets from today, like the seed data: -9, -6 done; -3, -1 overdue; 0 today; +1 +2 +4 +6 soon; +9 and more later.
const seedLike: Deadline[] = [
  dl(1, "2026-10-05", true),
  dl(2, "2026-10-08", true),
  dl(3, "2026-10-11"),
  dl(4, "2026-10-13"),
  dl(5, "2026-10-14"),
  dl(6, "2026-10-15"),
  dl(7, "2026-10-16"),
  dl(8, "2026-10-18"),
  dl(9, "2026-10-20"),
  dl(10, "2026-10-23"),
  dl(11, "2026-10-27"),
  dl(12, "2026-11-03"),
  dl(13, "2026-11-10"),
  dl(14, "2026-11-24"),
  dl(15, "2026-12-08"),
  dl(16, "2026-12-23"),
];

describe("deadline lists", () => {
  it("matches the seed numbers: 2 overdue, 1 today, 4 soon", () => {
    expect(getOverdue(seedLike, TODAY).map((d) => d.id)).toEqual([3, 4]);
    expect(getDueToday(seedLike, TODAY).map((d) => d.id)).toEqual([5]);
    expect(getDueSoon(seedLike, TODAY).map((d) => d.id)).toEqual([6, 7, 8, 9]);
  });
  it("never counts done items as overdue", () => {
    const list = [dl(1, "2026-10-01", true), dl(2, "2026-10-02", false)];
    expect(getOverdue(list, TODAY).map((d) => d.id)).toEqual([2]);
  });
  it("treats +7 as soon and +8 as later", () => {
    expect(getDueSoon([dl(1, "2026-10-21"), dl(2, "2026-10-22")], TODAY).map((d) => d.id)).toEqual([1]);
  });
  it("does not change the array it receives", () => {
    const input = [dl(2, "2026-10-12"), dl(1, "2026-10-10")];
    getOverdue(input, TODAY);
    expect(input.map((d) => d.id)).toEqual([2, 1]);
  });
  it("handles empty lists", () => {
    expect(getOverdue([], TODAY)).toEqual([]);
    expect(getDueSoon([], TODAY)).toEqual([]);
  });
  it("sorts by date then time", () => {
    const list = [dl(1, "2026-10-14", false, "15:00"), dl(2, "2026-10-14", false, "09:00")];
    expect(getDueToday(list, TODAY).map((d) => d.id)).toEqual([2, 1]);
  });
  it("groups for the deadlines page", () => {
    const g = groupDeadlines(seedLike, TODAY);
    expect(g.overdue).toHaveLength(2);
    expect(g.thisWeek.map((d) => d.id)).toEqual([5, 6, 7, 8, 9]); // today up to today + 6
    expect(g.later).toHaveLength(7); // +9 and later
    expect(g.done).toHaveLength(2);
  });
});

const sessions: ClassSession[] = [
  { id: 1, courseId: 1, weekday: 3, startTime: "09:00", endTime: "10:30", room: "B1" }, // Wednesday
  { id: 2, courseId: 2, weekday: 3, startTime: "13:00", endTime: "14:30", room: "A2" }, // Wednesday
  { id: 3, courseId: 3, weekday: 4, startTime: "11:00", endTime: "12:30", room: "" }, // Thursday
];
const semester = { startDate: "2026-09-09", endDate: "2026-12-07" };

describe("classes", () => {
  it("lists today's classes", () => {
    expect(getTodaysClasses(sessions, semester, TODAY).map((o) => o.sessionId)).toEqual([1, 2]);
  });
  it("finds the next class that has not ended", () => {
    expect(getNextClass(sessions, semester, TODAY, "08:00")?.sessionId).toBe(1);
    expect(getNextClass(sessions, semester, TODAY, "09:30")?.sessionId).toBe(1); // still running
    expect(getNextClass(sessions, semester, TODAY, "11:00")?.sessionId).toBe(2);
  });
  it("rolls over to the next day", () => {
    const next = getNextClass(sessions, semester, TODAY, "16:00");
    expect(next?.sessionId).toBe(3);
    expect(next?.date).toBe("2026-10-15");
  });
  it("gives nothing outside the semester", () => {
    expect(getTodaysClasses(sessions, semester, "2026-08-12")).toEqual([]);
    expect(getNextClass(sessions, semester, "2027-01-13", "08:00")).toBeNull();
    expect(getNextClass(sessions, null, TODAY, "08:00")).toBeNull();
  });
});

describe("semesterProgress", () => {
  const s = { startDate: "2026-09-09", endDate: "2026-12-07" }; // 90 days = 13 weeks (rounded up)
  it("is before the semester", () => {
    const p = semesterProgress(s, "2026-09-01");
    expect(p.state).toBe("before");
    expect(p.daysLeft).toBe(8);
  });
  it("is week 1 on the first day", () => {
    expect(semesterProgress(s, "2026-09-09")).toEqual({ state: "during", week: 1, totalWeeks: 13, daysLeft: 89 });
  });
  it("counts weeks in the middle", () => {
    expect(semesterProgress(s, "2026-10-14").week).toBe(6);
  });
  it("is the last week on the last day", () => {
    const p = semesterProgress(s, "2026-12-07");
    expect(p.state).toBe("during");
    expect(p.week).toBe(13);
    expect(p.daysLeft).toBe(0);
  });
  it("is after the semester", () => {
    expect(semesterProgress(s, "2026-12-08").state).toBe("after");
  });
  it("matches the seed semester: 120 days is 18 weeks", () => {
    const seed = { startDate: "2026-09-09", endDate: "2027-01-06" };
    expect(semesterProgress(seed, "2026-10-14").totalWeeks).toBe(18);
  });
});
