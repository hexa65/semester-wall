import { COURSE_COLOR_CLASSES } from "../../lib/constants";
import type { Course } from "../../types/course";

interface CourseBadgeProps {
  course: Pick<Course, "code" | "color"> | undefined;
  className?: string;
}

// A coloured index tab. The code is always written out, so colour is never the only signal.
export function CourseBadge({ course, className = "" }: CourseBadgeProps) {
  if (!course) {
    return (
      <span className={`inline-block border-l-4 border-ink-soft bg-rule px-2 py-0.5 text-sm font-semibold ${className}`}>
        Unknown course
      </span>
    );
  }
  const classes = COURSE_COLOR_CLASSES[course.color];
  return (
    <span
      className={`inline-block border-l-4 px-2 py-0.5 text-sm font-semibold text-ink ${classes.fill} ${classes.edge} ${className}`}
    >
      {course.code}
    </span>
  );
}
