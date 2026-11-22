// Calendar logic as PURE functions. The grid, the classes of a day and the load of a week are all
// DERIVED: we calculate them from the data and never store them.
import type { CalendarDay, CalendarWeek, LoadLevel, Occurrence } from "../types/calendar";
import type { Deadline } from "../types/deadline";
import type { ClassSession } from "../types/session";
import type { Semester } from "../types/semester";
import { addDays, firstOfMonth, isoWeekday, startOfWeek } from "./dates";

// Always 6 weeks of 7 days, Monday first, with the days of the neighbouring months.
// A fixed size keeps the calendar from jumping in height when you change month.
export function buildMonthGrid(month: string): CalendarWeek[] {
  const gridStart = startOfWeek(firstOfMonth(month));
  const weeks: CalendarWeek[] = [];
  for (let w = 0; w < 6; w++) {
    const days: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d);
      days.push({ date, inMonth: date.slice(0, 7) === month, weekday: d + 1 });
    }
    weeks.push({ days });
  }
  return weeks;
}

// Turn the weekly RULES into the real dates of a range (inclusive).
// A class happens on a date when the date is inside the semester and its weekday matches.
export function expandSessions(
  sessions: ClassSession[],
  semester: Semester | null,
  from: string,
  to: string,
): Occurrence[] {
  if (semester === null || from > to) return [];
  const first = from > semester.startDate ? from : semester.startDate;
  const last = to < semester.endDate ? to : semester.endDate;
  const result: Occurrence[] = [];
  for (let date = first; date <= last; date = addDays(date, 1)) {
    const weekday = isoWeekday(date);
    for (const s of sessions) {
      if (s.weekday === weekday) {
        result.push({
          sessionId: s.id,
          courseId: s.courseId,
          date,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
        });
      }
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

// { "2026-10-14": [deadline, deadline], ... } with each day sorted by time (no time first).
export function groupDeadlinesByDate(deadlines: Deadline[]): Record<string, Deadline[]> {
  const groups: Record<string, Deadline[]> = {};
  for (const d of deadlines) {
    const list = groups[d.dueDate];
    if (list) list.push(d);
    else groups[d.dueDate] = [d];
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => a.dueTime.localeCompare(b.dueTime) || a.id - b.id);
  }
  return groups;
}

export function groupOccurrencesByDate(occurrences: Occurrence[]): Record<string, Occurrence[]> {
  const groups: Record<string, Occurrence[]> = {};
  for (const o of occurrences) {
    const list = groups[o.date];
    if (list) list.push(o);
    else groups[o.date] = [o];
  }
  return groups;
}

// How heavy is a week? The number of OPEN deadlines due on its days.
export function weekLoad(deadlines: Deadline[], weekDates: string[]): number {
  return deadlines.filter((d) => !d.done && weekDates.includes(d.dueDate)).length;
}

// Count -> gauge level. 0 = empty week, 4 = very heavy.
export function loadLevel(count: number): LoadLevel {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export const LOAD_WORDS: Record<LoadLevel, string> = {
  0: "clear",
  1: "light",
  2: "steady",
  3: "heavy",
  4: "very heavy",
};
