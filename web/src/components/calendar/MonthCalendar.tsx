import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { groupDeadlinesByDate, groupOccurrencesByDate, weekLoad } from "../../lib/calendar";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "../../lib/constants";
import { addDays, startOfWeek } from "../../lib/dates";
import { formatLongDate, formatMonth } from "../../lib/format";
import type { CalendarWeek, Occurrence } from "../../types/calendar";
import type { Course } from "../../types/course";
import type { Deadline } from "../../types/deadline";
import { DayCell } from "./DayCell";
import { WeekLoadBar } from "./WeekLoadBar";

interface MonthCalendarProps {
  month: string;
  weeks: CalendarWeek[];
  deadlines: Deadline[];
  occurrences: Occurrence[];
  courses: Map<number, Course>;
  today: string;
  selectedDay: string;
  onSelectDay: (date: string) => void;
}

// A real table: column headers for the weekdays and a row header (the week) for each row.
// Only the selected day is in the tab order; arrow keys move between days (a "roving tabindex").
export function MonthCalendar({
  month,
  weeks,
  deadlines,
  occurrences,
  courses,
  today,
  selectedDay,
  onSelectDay,
}: MonthCalendarProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const moveFocus = useRef(false);

  // Derived state: calculated from the data on every render, never stored.
  const deadlinesByDate = groupDeadlinesByDate(deadlines);
  const occurrencesByDate = groupOccurrencesByDate(occurrences);

  // After the selected day changes through the keyboard, move the real focus to its button.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    tableRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${selectedDay}"]`)?.focus();
  }, [selectedDay, month]);

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (!(event.target instanceof HTMLButtonElement) || !event.target.dataset.date) return;
    const current = event.target.dataset.date;
    let next: string | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = addDays(current, -1);
        break;
      case "ArrowRight":
        next = addDays(current, 1);
        break;
      case "ArrowUp":
        next = addDays(current, -7);
        break;
      case "ArrowDown":
        next = addDays(current, 7);
        break;
      case "Home":
        next = startOfWeek(current);
        break;
      case "End":
        next = addDays(startOfWeek(current), 6);
        break;
      default:
        return;
    }
    event.preventDefault();
    moveFocus.current = true;
    onSelectDay(next);
  }

  return (
    // The table scrolls nowhere: on a phone the 7 columns are 44px wide.
    <table
      ref={tableRef}
      onKeyDown={handleKeyDown}
      className="w-full table-fixed border-collapse border-2 border-ink bg-sheet"
    >
      <caption className="sr-only">
        {formatMonth(month)}. Use the arrow keys to move between days. Home and End go to the start and end of the week.
      </caption>
      <thead>
        <tr>
          <th scope="col" className="w-7 border border-rule bg-ink p-0 text-paper sm:w-12">
            <span className="sr-only">Week load</span>
          </th>
          {WEEKDAY_SHORT.map((short, i) => (
            <th key={short} scope="col" abbr={WEEKDAY_NAMES[i]} className="border border-rule bg-ink py-1 text-xs font-semibold text-paper sm:text-sm">
              {short}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => {
          const dates = week.days.map((d) => d.date);
          const first = dates[0] ?? "";
          return (
            <tr key={first}>
              <th scope="row" className="border border-rule bg-paper p-0 align-middle font-normal">
                <span className="sr-only">Week starting {formatLongDate(first)}</span>
                <WeekLoadBar count={weekLoad(deadlines, dates)} />
              </th>
              {week.days.map((day) => (
                <DayCell
                  key={day.date}
                  day={day}
                  today={today}
                  selected={day.date === selectedDay}
                  occurrences={occurrencesByDate[day.date] ?? []}
                  deadlines={deadlinesByDate[day.date] ?? []}
                  courses={courses}
                  onSelect={onSelectDay}
                />
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
