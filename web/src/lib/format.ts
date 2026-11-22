// Turning dates and numbers into words. Pure functions: the date parts are local, never UTC.
import type { Deadline } from "../types/deadline";
import { WEEKDAY_NAMES } from "./constants";
import { daysBetween, isoWeekday, parseDate } from "./dates";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? "";
}

// "October 2026"
export function formatMonth(monthKey: string): string {
  const parts = parseDate(`${monthKey}-01`);
  return parts ? `${monthName(parts.month)} ${parts.year}` : monthKey;
}

// "Wednesday 14 October 2026"
export function formatLongDate(date: string): string {
  const parts = parseDate(date);
  if (!parts) return date;
  const weekday = WEEKDAY_NAMES[isoWeekday(date) - 1] ?? "";
  return `${weekday} ${parts.day} ${monthName(parts.month)} ${parts.year}`;
}

// "14 October"
export function formatDayMonth(date: string): string {
  const parts = parseDate(date);
  return parts ? `${parts.day} ${monthName(parts.month)}` : date;
}

// "Wed 14 Oct"
export function formatShortDate(date: string): string {
  const parts = parseDate(date);
  if (!parts) return date;
  const weekday = (WEEKDAY_NAMES[isoWeekday(date) - 1] ?? "").slice(0, 3);
  return `${weekday} ${parts.day} ${monthName(parts.month).slice(0, 3)}`;
}

// "09:00 to 10:30"
export const formatTimeRange = (start: string, end: string): string => `${start} to ${end}`;

export function plural(count: number, one: string, many: string = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

// "Due today", "Due tomorrow", "Due in 4 days", "3 days overdue".
export function dueLabel(deadline: Deadline, today: string): string {
  const diff = daysBetween(today, deadline.dueDate);
  if (deadline.done) return "Done";
  if (diff === 0) return deadline.dueTime ? `Due today at ${deadline.dueTime}` : "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff > 1) return `Due in ${diff} days`;
  return diff === -1 ? "1 day overdue" : `${-diff} days overdue`;
}
