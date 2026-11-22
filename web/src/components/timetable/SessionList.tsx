import { COURSE_COLOR_CLASSES, WEEKDAY_NAMES } from "../../lib/constants";
import { formatTimeRange } from "../../lib/format";
import type { Course } from "../../types/course";
import type { ClassSession } from "../../types/session";
import { Button } from "../ui/Button";

interface SessionListProps {
  sessions: ClassSession[];
  courses: Map<number, Course>;
  onEdit: (session: ClassSession) => void;
  onDelete: (session: ClassSession) => void;
}

// The weekly rules, grouped by weekday. The groups are derived from the list, never stored.
export function SessionList({ sessions, courses, onEdit, onDelete }: SessionListProps) {
  return (
    <div className="space-y-5">
      {WEEKDAY_NAMES.map((dayName, index) => {
        const weekday = index + 1;
        const daySessions = sessions.filter((s) => s.weekday === weekday).sort((a, b) => a.startTime.localeCompare(b.startTime));
        if (daySessions.length === 0) return null;
        return (
          <section key={dayName} aria-labelledby={`day-${weekday}`}>
            <h3 id={`day-${weekday}`} className="mb-2 text-2xl">
              {dayName}
            </h3>
            <ul className="space-y-2">
              {daySessions.map((s) => {
                const course = courses.get(s.courseId);
                const classes = COURSE_COLOR_CLASSES[course?.color ?? "blue"];
                return (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink-soft bg-sheet p-3">
                    <div className={`min-w-0 flex-1 border-l-8 pl-3 ${classes.edge}`}>
                      <p className="font-semibold">{formatTimeRange(s.startTime, s.endTime)}</p>
                      <p>
                        <span className={`mr-2 inline-block px-2 text-sm font-semibold ${classes.fill}`}>{course?.code ?? "?"}</span>
                        {course?.title ?? "Unknown course"}
                        {s.room ? `, ${s.room}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => onEdit(s)}>
                        Edit<span className="sr-only"> {course?.code} on {dayName}</span>
                      </Button>
                      <Button variant="danger" onClick={() => onDelete(s)}>
                        Delete<span className="sr-only"> {course?.code} on {dayName}</span>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
