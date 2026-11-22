import { useMemo } from "react";
import { DeadlineList } from "../components/deadlines/DeadlineList";
import { CourseBadge } from "../components/courses/CourseBadge";
import { LinkButton } from "../components/ui/Button";
import { PageHeading } from "../components/ui/PageHeading";
import { Loading, Skeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/States";
import { Toast } from "../components/ui/Toast";
import { COURSE_COLOR_CLASSES } from "../lib/constants";
import { useCourses } from "../hooks/useCourses";
import { useDeadlines, useToggleDone } from "../hooks/useDeadlines";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useSemester, useSessions } from "../hooks/useSchedule";
import { useToast } from "../hooks/useToast";
import { indexById } from "../lib/courses";
import { todayString } from "../lib/dates";
import { getErrorMessage } from "../lib/errors";
import { formatLongDate, formatShortDate, formatTimeRange, plural } from "../lib/format";
import { getDueSoon, getDueToday, getNextClass, getOverdue, getTodaysClasses, semesterProgress } from "../lib/schedule";
import type { Deadline } from "../types/deadline";

function nowTime(now: Date): string {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function TodayPage() {
  useDocumentTitle("Today");
  const deadlines = useDeadlines();
  const sessions = useSessions();
  const semester = useSemester();
  const courses = useCourses();
  const toggle = useToggleDone();
  const { toast, show, close } = useToast();

  const now = new Date();
  const today = todayString(now);
  const courseMap = useMemo(() => indexById(courses.data ?? []), [courses.data]);

  function handleToggle(deadline: Deadline) {
    toggle.mutate(
      { id: deadline.id, done: !deadline.done },
      { onError: (error) => show(`Could not update "${deadline.title}". ${getErrorMessage(error)}`, "error") },
    );
  }

  const heading = <PageHeading title={formatLongDate(today)} />;

  if (deadlines.isPending || sessions.isPending || semester.isPending || courses.isPending) {
    return (
      <div>
        {heading}
        <Loading label="Loading today">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </Loading>
      </div>
    );
  }

  if (deadlines.isError || sessions.isError || semester.isError || courses.isError) {
    return (
      <div>
        {heading}
        <ErrorState
          message={getErrorMessage(deadlines.error ?? sessions.error ?? semester.error ?? courses.error)}
          onRetry={() => {
            void deadlines.refetch();
            void sessions.refetch();
            void semester.refetch();
            void courses.refetch();
          }}
        />
      </div>
    );
  }

  const progress = semester.data ? semesterProgress(semester.data, today) : null;
  const classesToday = getTodaysClasses(sessions.data, semester.data, today);
  const next = getNextClass(sessions.data, semester.data, today, nowTime(now));
  const overdue = getOverdue(deadlines.data, today);
  const dueToday = getDueToday(deadlines.data, today);
  const dueSoon = getDueSoon(deadlines.data, today);
  const nothingAtAll = deadlines.data.length === 0 && sessions.data.length === 0;

  if (nothingAtAll) {
    return (
      <div>
        {heading}
        <EmptyState title="Your planner is empty" action={<LinkButton to="/courses/new">Add a course</LinkButton>}>
          Add a course, then its weekly classes and deadlines. Today will fill up with what you need to do.
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      {heading}

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <section aria-labelledby="progress-title" className="border-2 border-ink bg-sheet p-4">
          <h2 id="progress-title" className="text-xl">
            Semester
          </h2>
          {progress === null ? (
            <p className="mt-1">
              The semester dates are not set. <LinkButton to="/timetable" variant="quiet">Set the dates</LinkButton>
            </p>
          ) : progress.state === "during" ? (
            <>
              <p className="mt-1 font-display text-3xl font-bold">
                Week {progress.week} of {progress.totalWeeks}
              </p>
              <div
                role="progressbar"
                aria-label="Semester progress"
                aria-valuemin={0}
                aria-valuemax={progress.totalWeeks}
                aria-valuenow={progress.week}
                className="mt-2 h-3 border-2 border-ink bg-sheet"
              >
                <div className="h-full bg-pin" style={{ width: `${(progress.week / progress.totalWeeks) * 100}%` }} />
              </div>
              <p className="mt-2 text-ink-soft">{plural(progress.daysLeft, "day")} until the semester ends.</p>
            </>
          ) : progress.state === "before" ? (
            <p className="mt-1">The semester starts in {plural(progress.daysLeft, "day")}.</p>
          ) : (
            <p className="mt-1">The semester has ended.</p>
          )}
        </section>

        <section aria-labelledby="next-title" className="border-2 border-ink bg-sheet p-4">
          <h2 id="next-title" className="text-xl">
            Next class
          </h2>
          {next ? (
            <div className="mt-2">
              <div className={`border-l-8 px-3 py-2 ${COURSE_COLOR_CLASSES[courseMap.get(next.courseId)?.color ?? "blue"].fill} ${COURSE_COLOR_CLASSES[courseMap.get(next.courseId)?.color ?? "blue"].edge}`}>
                <p className="font-semibold">
                  {next.date === today ? "Today" : formatShortDate(next.date)}, {formatTimeRange(next.startTime, next.endTime)}
                </p>
                <p>
                  {courseMap.get(next.courseId)?.code ?? "Unknown course"} {courseMap.get(next.courseId)?.title}
                  {next.room ? `, ${next.room}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-1">No more classes in the next two weeks.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="classes-title" className="mb-6">
        <h2 id="classes-title" className="mb-2 text-2xl">
          Classes today <span className="font-sans text-lg font-medium text-ink-soft">({classesToday.length})</span>
        </h2>
        {classesToday.length === 0 ? (
          <p className="border-2 border-dashed border-ink-soft bg-sheet/70 p-3">No classes today.</p>
        ) : (
          <ul className="space-y-2">
            {classesToday.map((o) => {
              const course = courseMap.get(o.courseId);
              const classes = COURSE_COLOR_CLASSES[course?.color ?? "blue"];
              return (
                <li key={o.sessionId} className={`flex flex-wrap items-center gap-3 border-l-8 px-3 py-2 ${classes.fill} ${classes.edge}`}>
                  <span className="font-semibold">{formatTimeRange(o.startTime, o.endTime)}</span>
                  <CourseBadge course={course} className="bg-sheet!" />
                  <span>{course?.title}</span>
                  {o.room ? <span className="text-sm">{o.room}</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <DeadlineList heading="Overdue" deadlines={overdue} courses={courseMap} today={today} onToggle={handleToggle} />
      <DeadlineList
        heading="Due today"
        deadlines={dueToday}
        courses={courseMap}
        today={today}
        onToggle={handleToggle}
        emptyText="Nothing is due today."
        showDate={false}
      />
      <DeadlineList
        heading="Due in the next 7 days"
        deadlines={dueSoon}
        courses={courseMap}
        today={today}
        onToggle={handleToggle}
        emptyText="Nothing is due in the next 7 days."
      />
      <Toast toast={toast} onClose={close} />
    </div>
  );
}
