// The lists on the Today page, as PURE functions. "today" is always passed in, so tests never depend on the clock.
import type { Occurrence } from "../types/calendar";
import type { Deadline } from "../types/deadline";
import type { ClassSession } from "../types/session";
import type { Semester } from "../types/semester";
import { expandSessions } from "./calendar";
import { addDays, daysBetween } from "./dates";

const byDueDate = (a: Deadline, b: Deadline): number =>
  a.dueDate.localeCompare(b.dueDate) || a.dueTime.localeCompare(b.dueTime) || a.id - b.id;

// All of these return NEW arrays (sorted copies). They never change the array they receive,
// because that array may be TanStack Query's cache.

// Open items whose date has passed. Done items never count as overdue.
export function getOverdue(deadlines: Deadline[], today: string): Deadline[] {
  return deadlines.filter((d) => !d.done && d.dueDate < today).sort(byDueDate);
}

export function getDueToday(deadlines: Deadline[], today: string): Deadline[] {
  return deadlines.filter((d) => !d.done && d.dueDate === today).sort(byDueDate);
}

// The next 7 days: tomorrow up to today + 7.
export function getDueSoon(deadlines: Deadline[], today: string): Deadline[] {
  const last = addDays(today, 7);
  return deadlines.filter((d) => !d.done && d.dueDate > today && d.dueDate <= last).sort(byDueDate);
}

export interface DeadlineGroups {
  overdue: Deadline[];
  thisWeek: Deadline[]; // today up to today + 6
  later: Deadline[];
  done: Deadline[];
}

// The groups of the Deadlines page.
export function groupDeadlines(deadlines: Deadline[], today: string): DeadlineGroups {
  const weekEnd = addDays(today, 6);
  const open = deadlines.filter((d) => !d.done);
  return {
    overdue: open.filter((d) => d.dueDate < today).sort(byDueDate),
    thisWeek: open.filter((d) => d.dueDate >= today && d.dueDate <= weekEnd).sort(byDueDate),
    later: open.filter((d) => d.dueDate > weekEnd).sort(byDueDate),
    done: deadlines.filter((d) => d.done).sort(byDueDate),
  };
}

export function getTodaysClasses(
  sessions: ClassSession[],
  semester: Semester | null,
  today: string,
): Occurrence[] {
  return expandSessions(sessions, semester, today, today);
}

// The next class that has not ended yet: later today, or the first one in the next 14 days.
// `nowTime` is "HH:MM". Both are passed in.
export function getNextClass(
  sessions: ClassSession[],
  semester: Semester | null,
  today: string,
  nowTime: string,
): Occurrence | null {
  const upcoming = expandSessions(sessions, semester, today, addDays(today, 14));
  return upcoming.find((o) => o.date > today || o.endTime > nowTime) ?? null;
}

export type ProgressState = "before" | "during" | "after";

export interface SemesterProgress {
  state: ProgressState;
  week: number; // 1-based, 0 when not during
  totalWeeks: number;
  daysLeft: number; // days until the semester ends (or starts, when "before")
}

// "Week 6 of 18". Weeks are counted from the semester start date.
export function semesterProgress(semester: Semester, today: string): SemesterProgress {
  const totalDays = daysBetween(semester.startDate, semester.endDate) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  if (today < semester.startDate) {
    return { state: "before", week: 0, totalWeeks, daysLeft: daysBetween(today, semester.startDate) };
  }
  if (today > semester.endDate) {
    return { state: "after", week: 0, totalWeeks, daysLeft: 0 };
  }
  const week = Math.floor(daysBetween(semester.startDate, today) / 7) + 1;
  return { state: "during", week, totalWeeks, daysLeft: daysBetween(today, semester.endDate) };
}
