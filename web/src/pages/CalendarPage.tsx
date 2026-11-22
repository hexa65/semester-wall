import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { DayPanel } from "../components/calendar/DayPanel";
import { MonthCalendar } from "../components/calendar/MonthCalendar";
import { Button } from "../components/ui/Button";
import { PageHeading } from "../components/ui/PageHeading";
import { Loading, Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/States";
import { Toast } from "../components/ui/Toast";
import { useCourses } from "../hooks/useCourses";
import { useDeadlines, useToggleDone } from "../hooks/useDeadlines";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useSemester, useSessions } from "../hooks/useSchedule";
import { useToast } from "../hooks/useToast";
import { buildMonthGrid, expandSessions, groupDeadlinesByDate, groupOccurrencesByDate } from "../lib/calendar";
import { indexById } from "../lib/courses";
import { addMonths, firstOfMonth, isMonthKey, isValidDate, monthOf, todayString } from "../lib/dates";
import { getErrorMessage } from "../lib/errors";
import { formatMonth } from "../lib/format";
import type { Deadline } from "../types/deadline";

export function CalendarPage() {
  // URL state: the month and the selected day live in the address (?month=2026-10&day=2026-10-14),
  // so the page can be bookmarked, shared and used with the back button.
  const [params, setParams] = useSearchParams();
  const today = todayString();
  const monthParam = params.get("month") ?? "";
  const month = isMonthKey(monthParam) ? monthParam : monthOf(today);

  useDocumentTitle(formatMonth(month));

  // Derived state: the grid, and the range of dates it shows (including neighbouring months).
  const weeks = useMemo(() => buildMonthGrid(month), [month]);
  const from = weeks[0]?.days[0]?.date ?? firstOfMonth(month);
  const to = weeks[5]?.days[6]?.date ?? firstOfMonth(month);

  const dayParam = params.get("day") ?? "";
  const inGrid = isValidDate(dayParam) && dayParam >= from && dayParam <= to;
  const selectedDay = inGrid ? dayParam : monthOf(today) === month ? today : firstOfMonth(month);

  // Server state. The visible range is part of the query key, so each month is fetched and cached on its own.
  const deadlines = useDeadlines({ from, to });
  const sessions = useSessions();
  const semester = useSemester();
  const courses = useCourses();
  const toggle = useToggleDone();
  const { toast, show, close } = useToast();

  const courseMap = useMemo(() => indexById(courses.data ?? []), [courses.data]);
  const occurrences = useMemo(
    () => expandSessions(sessions.data ?? [], semester.data ?? null, from, to),
    [sessions.data, semester.data, from, to],
  );

  function selectDay(date: string) {
    setParams({ month: monthOf(date), day: date });
  }

  function goToMonth(target: string) {
    setParams({ month: target, day: monthOf(today) === target ? today : firstOfMonth(target) });
  }

  function handleToggle(deadline: Deadline) {
    toggle.mutate(
      { id: deadline.id, done: !deadline.done },
      { onError: (error) => show(`Could not update "${deadline.title}". ${getErrorMessage(error)}`, "error") },
    );
  }

  const nav = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={() => goToMonth(addMonths(month, -1))}>
        Previous month
      </Button>
      <Button variant="secondary" onClick={() => goToMonth(monthOf(today))}>
        Today
      </Button>
      <Button variant="secondary" onClick={() => goToMonth(addMonths(month, 1))}>
        Next month
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeading title={formatMonth(month)} actions={nav} />

      {deadlines.isPending || sessions.isPending || semester.isPending || courses.isPending ? (
        <Loading label="Loading the calendar">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Skeleton className="h-[26rem] sm:h-[48rem]" />
            <Skeleton className="h-64" />
          </div>
        </Loading>
      ) : deadlines.isError || sessions.isError || semester.isError || courses.isError ? (
        <ErrorState
          message={getErrorMessage(deadlines.error ?? sessions.error ?? semester.error ?? courses.error)}
          onRetry={() => {
            void deadlines.refetch();
            void sessions.refetch();
            void semester.refetch();
            void courses.refetch();
          }}
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <MonthCalendar
              month={month}
              weeks={weeks}
              deadlines={deadlines.data}
              occurrences={occurrences}
              courses={courseMap}
              today={today}
              selectedDay={selectedDay}
              onSelectDay={selectDay}
            />
            <p className="mt-2 text-sm text-ink-soft">
              The bar beside each week shows how many open deadlines fall in it. On a phone, a filled square is a class
              and a ring is a deadline; the panel below lists them.
            </p>
          </div>
          <DayPanel
            date={selectedDay}
            today={today}
            occurrences={groupOccurrencesByDate(occurrences)[selectedDay] ?? []}
            deadlines={groupDeadlinesByDate(deadlines.data)[selectedDay] ?? []}
            courses={courseMap}
            onToggle={handleToggle}
          />
        </div>
      )}
      <Toast toast={toast} onClose={close} />
    </div>
  );
}
