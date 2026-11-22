export interface CalendarDay {
  date: string; // "2026-10-14"
  inMonth: boolean; // false for the greyed days of the neighbouring months
  weekday: number; // 1 = Monday ... 7 = Sunday
}

export interface CalendarWeek {
  days: CalendarDay[]; // always 7, Monday first
}

// One class on one date: the weekly rule, expanded.
export interface Occurrence {
  sessionId: number;
  courseId: number;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
}

export type LoadLevel = 0 | 1 | 2 | 3 | 4;
