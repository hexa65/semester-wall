import { useId } from "react";
import { Link } from "react-router";
import { dueLabel } from "../../lib/format";
import type { Course } from "../../types/course";
import type { Deadline } from "../../types/deadline";
import { CourseBadge } from "../courses/CourseBadge";

interface DeadlineRowProps {
  deadline: Deadline;
  course: Course | undefined;
  today: string;
  onToggle: (deadline: Deadline) => void;
  showDate?: boolean;
}

export function DeadlineRow({ deadline, course, today, onToggle, showDate = true }: DeadlineRowProps) {
  const id = useId();
  const overdue = !deadline.done && deadline.dueDate < today;

  return (
    <li
      className={`flex items-start gap-3 border-2 bg-sheet p-3 ${
        overdue ? "border-pin border-l-8" : "border-ink-soft"
      }`}
    >
      {/* The checkbox is the "mark as done" control. Its label names the deadline. */}
      <div className="flex min-h-11 min-w-11 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={deadline.done}
          onChange={() => onToggle(deadline)}
          className="h-6 w-6 cursor-pointer accent-pin"
        />
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className={`block cursor-pointer text-lg font-semibold ${deadline.done ? "line-through" : ""}`}>
          {deadline.title}
          <span className="sr-only">{deadline.done ? ", done" : ", mark as done"}</span>
        </label>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <CourseBadge course={course} />
          <span>{deadline.kind}</span>
          <span className={overdue ? "font-bold text-pin" : "text-ink-soft"}>
            {dueLabel(deadline, today)}
            {showDate ? `, ${deadline.dueDate}` : ""}
            {deadline.dueTime && deadline.dueDate !== today ? ` at ${deadline.dueTime}` : ""}
          </span>
        </p>
        {deadline.note ? <p className="mt-1 text-sm text-ink-soft">{deadline.note}</p> : null}
      </div>
      <Link
        to={`/deadlines/${deadline.id}/edit`}
        className="inline-flex min-h-11 items-center px-2 font-semibold underline decoration-2 underline-offset-4 hover:bg-pin-soft"
      >
        Edit<span className="sr-only"> {deadline.title}</span>
      </Link>
    </li>
  );
}
