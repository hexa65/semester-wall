// Cases in plain words:
//  parseDate: real dates split into numbers; impossible dates and wrong shapes give null; 29 February only in leap years.
//  isoWeekday: Monday is 1 and Sunday is 7 (JavaScript says 0 for Sunday).
//  addDays: crosses month ends, year ends and the leap day, forward and backward.
//  daysBetween: whole days, negative when going back, correct across a leap day.
//  todayString: uses the LOCAL date parts of the date we pass in.
//  months: next and previous across a year boundary, first and last day, leap February.
import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  daysBetween,
  firstOfMonth,
  isMonthKey,
  isoWeekday,
  isValidDate,
  lastOfMonth,
  parseDate,
  startOfWeek,
  todayString,
} from "./dates";

describe("parseDate", () => {
  it("splits a real date", () => {
    expect(parseDate("2026-10-24")).toEqual({ year: 2026, month: 10, day: 24 });
  });
  it("rejects impossible dates and wrong shapes", () => {
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("2026-00-10")).toBeNull();
    expect(parseDate("2026-1-5")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
  it("accepts 29 February only in a leap year", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("1900-02-29")).toBe(false);
    expect(isValidDate("2000-02-29")).toBe(true);
  });
});

describe("isoWeekday", () => {
  it("gives Monday 1 and Sunday 7", () => {
    expect(isoWeekday("2026-10-19")).toBe(1); // Monday
    expect(isoWeekday("2026-10-24")).toBe(6); // Saturday
    expect(isoWeekday("2026-10-25")).toBe(7); // Sunday
    expect(isoWeekday("2024-02-29")).toBe(4); // Thursday
  });
  it("finds the Monday of a week", () => {
    expect(startOfWeek("2026-10-25")).toBe("2026-10-19");
    expect(startOfWeek("2026-10-19")).toBe("2026-10-19");
    expect(startOfWeek("2026-03-01")).toBe("2026-02-23");
  });
});

describe("addDays and daysBetween", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });
  it("handles the leap day", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
  it("counts days between dates", () => {
    expect(daysBetween("2026-10-01", "2026-10-31")).toBe(30);
    expect(daysBetween("2026-10-31", "2026-10-01")).toBe(-30);
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2);
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2); // daylight-saving weekend in many countries
  });
});

describe("todayString", () => {
  it("uses local date parts", () => {
    expect(todayString(new Date(2026, 9, 24, 23, 59))).toBe("2026-10-24");
    expect(todayString(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
  });
});

describe("months", () => {
  it("moves across a year boundary", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-10", 0)).toBe("2026-10");
  });
  it("finds first and last days", () => {
    expect(firstOfMonth("2026-10")).toBe("2026-10-01");
    expect(lastOfMonth("2026-10")).toBe("2026-10-31");
    expect(lastOfMonth("2024-02")).toBe("2024-02-29");
    expect(lastOfMonth("2026-02")).toBe("2026-02-28");
  });
  it("validates month keys", () => {
    expect(isMonthKey("2026-10")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-1")).toBe(false);
  });
});
