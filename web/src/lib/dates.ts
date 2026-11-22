// Date helpers. Dates are plain text "YYYY-MM-DD". We never call new Date("YYYY-MM-DD"),
// because that is read as UTC midnight and can show the day before in some timezones.
// Everything here uses LOCAL date parts.

export interface DateParts {
  year: number;
  month: number; // 1 to 12
  day: number;
}

export function daysInMonth(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
}

// Split "2026-10-24" into numbers. Returns null if the text is not a real date.
export function parseDate(text: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export const isValidDate = (text: string): boolean => parseDate(text) !== null;

const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

export function formatDate(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

// Build a local Date from a "YYYY-MM-DD" text. Throws on bad input: call isValidDate first for user input.
export function toLocalDate(text: string): Date {
  const parts = parseDate(text);
  if (!parts) throw new Error(`Not a valid date: ${text}`);
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function fromLocalDate(date: Date): string {
  return formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

// "Today" from local parts (never toISOString, which is UTC). `now` is a parameter so tests can pass a fixed date.
export function todayString(now: Date = new Date()): string {
  return fromLocalDate(now);
}

// The ONE place that translates JavaScript's getDay() (0 = Sunday) to our weekdays (1 = Monday ... 7 = Sunday).
export function isoWeekday(text: string): number {
  const jsDay = toLocalDate(text).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

// Add (or subtract) days. new Date(y, m, d + n) lets JavaScript handle month and year ends.
export function addDays(text: string, n: number): string {
  const parts = parseDate(text);
  if (!parts) throw new Error(`Not a valid date: ${text}`);
  return fromLocalDate(new Date(parts.year, parts.month - 1, parts.day + n));
}

// Whole days from a to b (negative when b is before a).
export function daysBetween(a: string, b: string): number {
  const x = toLocalDate(a);
  const y = toLocalDate(b);
  // Use UTC for the subtraction only, so daylight-saving changes cannot add or remove an hour.
  return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86_400_000);
}

// The Monday on or before the date.
export function startOfWeek(text: string): string {
  return addDays(text, 1 - isoWeekday(text));
}

// ----- months, written "YYYY-MM" -----

export function isMonthKey(text: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(text);
  return match !== null && Number(match[2]) >= 1 && Number(match[2]) <= 12;
}

export const monthOf = (date: string): string => date.slice(0, 7);

export function addMonths(month: string, n: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error(`Not a valid month: ${month}`);
  const d = new Date(Number(match[1]), Number(match[2]) - 1 + n, 1);
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}`;
}

export function firstOfMonth(month: string): string {
  return `${month}-01`;
}

export function lastOfMonth(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error(`Not a valid month: ${month}`);
  return `${month}-${pad(daysInMonth(Number(match[1]), Number(match[2])))}`;
}
