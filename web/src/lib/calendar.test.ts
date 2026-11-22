// Cases in plain words:
//  buildMonthGrid: always 6 weeks of 7 days, Monday first; October 2026 starts on a Thursday;
//    February 2026 starts on a Sunday (so the first row is mostly January); leap February 2024; December into January.
//  expandSessions: a weekly rule becomes the right dates; nothing before the semester starts or after it ends;
//    a range that only partly overlaps the semester is cut; no semester means no classes; two sessions on one day are sorted.
//  groupDeadlinesByDate: grouped by day, sorted by time with "no time" first.
//  weekLoad and loadLevel: done items do not count; only dates inside the week count; counts map to levels.
import { describe, expect, it } from "vitest";
import type { Deadline } from "../types/deadline";
import type { ClassSession } from "../types/session";
import { buildMonthGrid, expandSessions, groupDeadlinesByDate, loadLevel, weekLoad } from "./calendar";

const dates = (month: string): string[] => buildMonthGrid(month).flatMap((w) => w.days.map((d) => d.date));

describe("buildMonthGrid", () => {
  it("is always 6 weeks of 7 days", () => {
    for (const month of ["2026-10", "2026-02", "2024-02", "2026-12", "2027-01"]) {
      const grid = buildMonthGrid(month);
      expect(grid).toHaveLength(6);
      for (const week of grid) expect(week.days).toHaveLength(7);
    }
  });
  it("starts on Monday: October 2026 starts on a Thursday", () => {
    const grid = buildMonthGrid("2026-10");
    expect(grid[0]?.days[0]?.date).toBe("2026-09-28");
    expect(grid[0]?.days[3]?.date).toBe("2026-10-01");
    expect(grid[0]?.days[0]?.inMonth).toBe(false);
    expect(grid[0]?.days[3]?.inMonth).toBe(true);
    expect(grid[5]?.days[6]?.date).toBe("2026-11-08");
  });
  it("handles a month that starts on a Sunday (February 2026)", () => {
    const grid = buildMonthGrid("2026-02");
    expect(grid[0]?.days[0]?.date).toBe("2026-01-26");
    expect(grid[0]?.days[6]?.date).toBe("2026-02-01");
    expect(grid[0]?.days[6]?.inMonth).toBe(true);
  });
  it("includes the leap day", () => {
    expect(dates("2024-02")).toContain("2024-02-29");
    expect(dates("2026-02")).not.toContain("2026-02-29");
  });
  it("crosses the year boundary", () => {
    const d = dates("2026-12");
    expect(d).toContain("2026-12-31");
    expect(d).toContain("2027-01-01");
  });
  it("marks exactly the days of the month as inMonth", () => {
    const inMonth = buildMonthGrid("2026-10").flatMap((w) => w.days).filter((d) => d.inMonth);
    expect(inMonth).toHaveLength(31);
  });
});

const monday: ClassSession = { id: 1, courseId: 1, weekday: 1, startTime: "09:00", endTime: "10:30", room: "B1" };
const mondayLate: ClassSession = { id: 2, courseId: 2, weekday: 1, startTime: "13:00", endTime: "14:30", room: "A2" };
const sunday: ClassSession = { id: 3, courseId: 3, weekday: 7, startTime: "10:00", endTime: "11:00", room: "" };
const semester = { startDate: "2026-09-01", endDate: "2026-12-15" };

describe("expandSessions", () => {
  it("turns a weekly rule into dates", () => {
    const result = expandSessions([monday], semester, "2026-10-01", "2026-10-31");
    expect(result.map((o) => o.date)).toEqual(["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"]);
  });
  it("gives nothing before the semester starts", () => {
    expect(expandSessions([monday], semester, "2026-08-01", "2026-08-31")).toEqual([]);
  });
  it("gives nothing after the semester ends", () => {
    expect(expandSessions([monday], semester, "2027-01-01", "2027-01-31")).toEqual([]);
  });
  it("cuts a range that partly overlaps the semester", () => {
    const start = expandSessions([monday], semester, "2026-08-24", "2026-09-07");
    expect(start.map((o) => o.date)).toEqual(["2026-09-07"]);
    const end = expandSessions([monday], semester, "2026-12-10", "2026-12-31");
    expect(end.map((o) => o.date)).toEqual(["2026-12-14"]);
  });
  it("includes the first and last day of the semester", () => {
    const s = { startDate: "2026-10-05", endDate: "2026-10-12" }; // both Mondays
    expect(expandSessions([monday], s, "2026-10-01", "2026-10-31")).toHaveLength(2);
  });
  it("gives nothing without a semester or with an empty range", () => {
    expect(expandSessions([monday], null, "2026-10-01", "2026-10-31")).toEqual([]);
    expect(expandSessions([monday], semester, "2026-10-31", "2026-10-01")).toEqual([]);
    expect(expandSessions([], semester, "2026-10-01", "2026-10-31")).toEqual([]);
  });
  it("sorts two classes on the same day by start time", () => {
    const result = expandSessions([mondayLate, monday], semester, "2026-10-05", "2026-10-05");
    expect(result.map((o) => o.sessionId)).toEqual([1, 2]);
  });
  it("puts Sunday (7) on Sundays", () => {
    const result = expandSessions([sunday], semester, "2026-10-19", "2026-10-25");
    expect(result.map((o) => o.date)).toEqual(["2026-10-25"]);
  });
});

const dl = (id: number, dueDate: string, dueTime = "", done = false): Deadline => ({
  id,
  courseId: 1,
  title: `D${id}`,
  kind: "Assignment",
  dueDate,
  dueTime,
  done,
  note: "",
});

describe("groupDeadlinesByDate", () => {
  it("groups by day and sorts by time, no time first", () => {
    const groups = groupDeadlinesByDate([dl(1, "2026-10-14", "15:00"), dl(2, "2026-10-14"), dl(3, "2026-10-15")]);
    expect(Object.keys(groups).sort()).toEqual(["2026-10-14", "2026-10-15"]);
    expect(groups["2026-10-14"]?.map((d) => d.id)).toEqual([2, 1]);
  });
  it("handles an empty list", () => {
    expect(groupDeadlinesByDate([])).toEqual({});
  });
});

describe("weekLoad and loadLevel", () => {
  const week = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"];
  it("counts open deadlines inside the week only", () => {
    const list = [dl(1, "2026-10-12"), dl(2, "2026-10-18"), dl(3, "2026-10-19"), dl(4, "2026-10-11"), dl(5, "2026-10-14", "", true)];
    expect(weekLoad(list, week)).toBe(2);
  });
  it("is zero for an empty list", () => {
    expect(weekLoad([], week)).toBe(0);
  });
  it("maps counts to levels", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 12].map(loadLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });
});
