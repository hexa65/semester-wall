import type { Course } from "../../types/course";
import type { Deadline } from "../../types/deadline";
import { DeadlineRow } from "./DeadlineRow";

interface DeadlineListProps {
  heading: string;
  deadlines: Deadline[];
  courses: Map<number, Course>;
  today: string;
  onToggle: (deadline: Deadline) => void;
  emptyText?: string;
  showDate?: boolean;
}

// One titled group of deadlines, for example "Overdue".
export function DeadlineList({ heading, deadlines, courses, today, onToggle, emptyText, showDate }: DeadlineListProps) {
  if (deadlines.length === 0 && !emptyText) return null;
  return (
    <section aria-label={heading} className="mb-6">
      <h2 className="mb-2 text-2xl">
        {heading} <span className="text-lg font-sans font-medium text-ink-soft">({deadlines.length})</span>
      </h2>
      {deadlines.length === 0 ? (
        <p className="border-2 border-dashed border-ink-soft bg-sheet/70 p-3">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {deadlines.map((deadline) => (
            <DeadlineRow
              key={deadline.id}
              deadline={deadline}
              course={courses.get(deadline.courseId)}
              today={today}
              onToggle={onToggle}
              showDate={showDate}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
