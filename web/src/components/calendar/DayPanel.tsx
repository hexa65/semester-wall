import { COURSE_COLOR_CLASSES } from "../../lib/constants";
import { formatDayMonth, formatLongDate, formatTimeRange } from "../../lib/format";
import type { Occurrence } from "../../types/calendar";
import type { Course } from "../../types/course";
import type { Deadline } from "../../types/deadline";
import { DeadlineRow } from "../deadlines/DeadlineRow";
import { LinkButton } from "../ui/Button";

interface DayPanelProps {
  date: string;
  today: string;
  occurrences: Occurrence[];
  deadlines: Deadline[];
  courses: Map<number, Course>;
  onToggle: (deadline: Deadline) => void;
}

// Everything on the selected day, written out in full. This is also what makes the compact phone grid usable.
export function DayPanel({ date, today, occurrences, deadlines, courses, onToggle }: DayPanelProps) {
  const empty = occurrences.length === 0 && deadlines.length === 0;
  return (
    <section aria-labelledby="day-panel-title" className="border-2 border-ink bg-sheet p-4">
      <h2 id="day-panel-title" className="text-2xl">
        {formatLongDate(date)}
        {date === today ? <span className="ml-2 border-2 border-pin px-1.5 py-0.5 font-sans text-sm font-bold text-pin">Today</span> : null}
      </h2>

      {empty ? <p className="mt-3">Nothing is scheduled on this day.</p> : null}

      {occurrences.length > 0 ? (
        <>
          <h3 className="mt-4 text-lg">Classes</h3>
          <ul className="mt-2 space-y-2">
            {occurrences.map((o) => {
              const course = courses.get(o.courseId);
              const classes = course ? COURSE_COLOR_CLASSES[course.color] : null;
              return (
                <li
                  key={`${o.sessionId}-${o.date}`}
                  className={`border-l-8 px-3 py-2 ${classes?.fill ?? "bg-rule"} ${classes?.edge ?? "border-ink-soft"}`}
                >
                  <p className="font-semibold">
                    {formatTimeRange(o.startTime, o.endTime)}
                  </p>
                  <p>
                    {course ? `${course.code} ${course.title}` : "Unknown course"}
                    {o.room ? `, ${o.room}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {deadlines.length > 0 ? (
        <>
          <h3 className="mt-4 text-lg">Deadlines</h3>
          <ul className="mt-2 space-y-2">
            {deadlines.map((d) => (
              <DeadlineRow key={d.id} deadline={d} course={courses.get(d.courseId)} today={today} onToggle={onToggle} showDate={false} />
            ))}
          </ul>
        </>
      ) : null}

      <div className="mt-4">
        <LinkButton to={`/deadlines/new?date=${date}`} variant="secondary">
          Add a deadline for {formatDayMonth(date)}
        </LinkButton>
      </div>
    </section>
  );
}
