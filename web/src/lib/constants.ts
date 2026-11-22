import type { CourseColor } from "../types/course";
import type { DeadlineKind } from "../types/deadline";

export const APP_NAME = "Semester Wall";

// The week starts on Monday. Weekdays are numbered 1 (Monday) to 7 (Sunday).
export const WEEK_START = 1;

export const COURSE_COLORS: readonly CourseColor[] = ["blue", "green", "orange", "purple", "teal", "rose"];

export const DEADLINE_KINDS: readonly DeadlineKind[] = ["Assignment", "Test", "Exam", "Project", "Reading"];

export const WEEKDAY_NAMES: readonly string[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const WEEKDAY_SHORT: readonly string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Tailwind only sees class names written out in full, so we use a lookup object, never string pieces.
export interface ColorClasses {
  fill: string; // background of the tab
  edge: string; // darker left border of the tab
}

export const COURSE_COLOR_CLASSES: Record<CourseColor, ColorClasses> = {
  blue: { fill: "bg-course-blue", edge: "border-edge-blue" },
  green: { fill: "bg-course-green", edge: "border-edge-green" },
  orange: { fill: "bg-course-orange", edge: "border-edge-orange" },
  purple: { fill: "bg-course-purple", edge: "border-edge-purple" },
  teal: { fill: "bg-course-teal", edge: "border-edge-teal" },
  rose: { fill: "bg-course-rose", edge: "border-edge-rose" },
};

export function isCourseColor(value: string): value is CourseColor {
  return COURSE_COLORS.some((color) => color === value);
}

export function isDeadlineKind(value: string): value is DeadlineKind {
  return DEADLINE_KINDS.some((kind) => kind === value);
}
