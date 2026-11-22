import { COURSE_COLOR_CLASSES } from "../../lib/constants";
import { formatLongDate, plural } from "../../lib/format";
import type { CalendarDay, Occurrence } from "../../types/calendar";
import type { Course } from "../../types/course";
import type { Deadline } from "../../types/deadline";

interface DayCellProps {
  day: CalendarDay;
  today: string;
  selected: boolean;
  occurrences: Occurrence[];
  deadlines: Deadline[];
  courses: Map<number, Course>;
  onSelect: (date: string) => void;
}

type Item =
  | { type: "class"; key: string; course: Course | undefined; occurrence: Occurrence }
  | { type: "deadline"; key: string; course: Course | undefined; deadline: Deadline };

const MAX_BLOCKS = 3;
const MAX_PIPS = 5;

// What a screen reader hears for this day: the date, then everything in it.
function describe(day: CalendarDay, isToday: boolean, classes: number, due: number, open: number, selected: boolean): string {
  const parts = [formatLongDate(day.date)];
  if (isToday) parts.push("today");
  if (!day.inMonth) parts.push("outside this month");
  parts.push(plural(classes, "class", "classes"));
  parts.push(due === 0 ? "no deadlines" : `${plural(due, "deadline")} due, ${open} still open`);
  if (selected) parts.push("selected");
  return parts.join(", ");
}

export function DayCell({ day, today, selected, occurrences, deadlines, courses, onSelect }: DayCellProps) {
  const isToday = day.date === today;
  const dayNumber = Number(day.date.slice(8, 10));
  const open = deadlines.filter((d) => !d.done).length;

  const items: Item[] = [
    ...occurrences.map((o): Item => ({
      type: "class",
      key: `c${o.sessionId}`,
      course: courses.get(o.courseId),
      occurrence: o,
    })),
    ...deadlines.map((d): Item => ({ type: "deadline", key: `d${d.id}`, course: courses.get(d.courseId), deadline: d })),
  ];

  return (
    <td className={`h-14 border border-rule p-0 align-top sm:h-28 ${day.inMonth ? "bg-sheet" : "bg-paper"}`}>
      <button
        type="button"
        data-date={day.date}
        tabIndex={selected ? 0 : -1}
        aria-label={describe(day, isToday, occurrences.length, deadlines.length, open, selected)}
        aria-current={isToday ? "date" : undefined}
        onClick={() => onSelect(day.date)}
        className={`flex h-full w-full cursor-pointer flex-col items-stretch gap-1 p-1 text-left hover:bg-pin-soft ${
          selected ? "bg-pin-soft outline-4 -outline-offset-4 outline-ink" : ""
        } ${day.inMonth ? "text-ink" : "text-ink-soft"}`}
      >
        <span className="flex items-center justify-between">
          {/* Today is marked with a filled circle (a shape), not only a colour. */}
          <span
            aria-hidden="true"
            className={`inline-flex h-6 min-w-6 items-center justify-center text-sm font-bold ${
              isToday ? "rounded-full bg-pin px-1 text-white" : ""
            }`}
          >
            {dayNumber}
          </span>
        </span>

        {/* Desktop: named blocks. */}
        <span aria-hidden="true" className="hidden min-w-0 flex-col gap-0.5 sm:flex">
          {items.slice(0, MAX_BLOCKS).map((item) => {
            const classes = item.course ? COURSE_COLOR_CLASSES[item.course.color] : null;
            const code = item.course?.code ?? "?";
            if (item.type === "class") {
              return (
                <span
                  key={item.key}
                  className={`block truncate border-l-4 px-1 text-xs font-semibold text-ink ${classes?.fill ?? "bg-rule"} ${classes?.edge ?? "border-ink-soft"}`}
                >
                  {item.occurrence.startTime} {code}
                </span>
              );
            }
            return (
              <span
                key={item.key}
                className={`block truncate border-2 border-l-4 bg-sheet px-1 text-xs font-semibold text-ink ${classes?.edge ?? "border-ink-soft"} ${
                  item.deadline.done ? "line-through" : ""
                }`}
              >
                Due {code}
              </span>
            );
          })}
          {items.length > MAX_BLOCKS ? (
            <span className="px-1 text-xs font-semibold">+{items.length - MAX_BLOCKS} more</span>
          ) : null}
        </span>

        {/* Phone: small shapes. Square = class (filled). Circle = deadline (outlined). The day panel below names them. */}
        <span aria-hidden="true" className="flex flex-wrap gap-0.5 sm:hidden">
          {items.slice(0, MAX_PIPS).map((item) => {
            const classes = item.course ? COURSE_COLOR_CLASSES[item.course.color] : null;
            return item.type === "class" ? (
              <span key={item.key} className={`h-2 w-2 border-l-2 ${classes?.fill ?? "bg-rule"} ${classes?.edge ?? "border-ink-soft"}`} />
            ) : (
              <span key={item.key} className={`h-2 w-2 rounded-full border-2 bg-sheet ${classes?.edge ?? "border-ink-soft"}`} />
            );
          })}
        </span>
      </button>
    </td>
  );
}
