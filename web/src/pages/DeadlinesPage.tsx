import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { DeadlineList } from "../components/deadlines/DeadlineList";
import { LinkButton } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PageHeading } from "../components/ui/PageHeading";
import { Select } from "../components/ui/Select";
import { Loading, Skeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/States";
import { Toast } from "../components/ui/Toast";
import { useCourses } from "../hooks/useCourses";
import { useDeadlines, useToggleDone } from "../hooks/useDeadlines";
import { useDebounce } from "../hooks/useDebounce";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useToast } from "../hooks/useToast";
import { DEADLINE_KINDS } from "../lib/constants";
import { indexById } from "../lib/courses";
import { todayString } from "../lib/dates";
import { getErrorMessage } from "../lib/errors";
import { groupDeadlines } from "../lib/schedule";
import type { Deadline } from "../types/deadline";

export function DeadlinesPage() {
  useDocumentTitle("Deadlines");
  const deadlines = useDeadlines();
  const courses = useCourses();
  const toggle = useToggleDone();
  const { toast, show, close } = useToast();

  // UI state: the filters. The visible groups are DERIVED from them below.
  const [courseId, setCourseId] = useState("");
  const [kind, setKind] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const today = todayString();
  const courseMap = useMemo(() => indexById(courses.data ?? []), [courses.data]);

  const filtered = useMemo<Deadline[]>(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return (deadlines.data ?? []).filter(
      (d) =>
        (courseId === "" || d.courseId === Number(courseId)) &&
        (kind === "" || d.kind === kind) &&
        (needle === "" || d.title.toLowerCase().includes(needle) || d.note.toLowerCase().includes(needle)),
    );
  }, [deadlines.data, courseId, kind, debouncedSearch]);

  const groups = useMemo(() => groupDeadlines(filtered, today), [filtered, today]);

  function handleToggle(deadline: Deadline) {
    toggle.mutate(
      { id: deadline.id, done: !deadline.done },
      { onError: (error) => show(`Could not update "${deadline.title}". ${getErrorMessage(error)}`, "error") },
    );
  }

  const courseOptions = [
    { value: "", label: "All courses" },
    ...(courses.data ?? []).map((c) => ({ value: String(c.id), label: `${c.code} ${c.title}` })),
  ];
  const kindOptions = [{ value: "", label: "All kinds" }, ...DEADLINE_KINDS.map((k) => ({ value: k, label: k }))];

  const openCount = groups.overdue.length + groups.thisWeek.length + groups.later.length;

  return (
    <div>
      <PageHeading
        title="Deadlines"
        intro="Assignments, tests, exams, projects and readings, grouped by how soon they are due."
        actions={<LinkButton to="/deadlines/new">Add a deadline</LinkButton>}
      />

      <form
        role="search"
        aria-label="Filter deadlines"
        onSubmit={(event) => event.preventDefault()}
        className="mb-6 grid gap-3 border-2 border-ink bg-sheet p-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Input
          label="Search"
          type="search"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Title or note"
        />
        <Select label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)} options={courseOptions} />
        <Select label="Kind" value={kind} onChange={(e) => setKind(e.target.value)} options={kindOptions} />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end font-semibold">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="h-6 w-6 accent-pin"
          />
          Show finished deadlines
        </label>
      </form>

      {deadlines.isPending || courses.isPending ? (
        <Loading label="Loading deadlines">
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-20" />
            ))}
          </div>
        </Loading>
      ) : deadlines.isError || courses.isError ? (
        <ErrorState
          message={getErrorMessage(deadlines.error ?? courses.error)}
          onRetry={() => {
            void deadlines.refetch();
            void courses.refetch();
          }}
        />
      ) : deadlines.data.length === 0 ? (
        <EmptyState
          title="No deadlines yet"
          action={<LinkButton to="/deadlines/new">Add your first deadline</LinkButton>}
        >
          Add an assignment, test or exam and it will show up here and on the calendar.
        </EmptyState>
      ) : openCount === 0 && (!showDone || groups.done.length === 0) ? (
        <EmptyState title="Nothing matches these filters">
          Clear the search or choose "All courses" and "All kinds" to see more.
        </EmptyState>
      ) : (
        <>
          <DeadlineList heading="Overdue" deadlines={groups.overdue} courses={courseMap} today={today} onToggle={handleToggle} />
          <DeadlineList heading="Due this week" deadlines={groups.thisWeek} courses={courseMap} today={today} onToggle={handleToggle} />
          <DeadlineList heading="Later" deadlines={groups.later} courses={courseMap} today={today} onToggle={handleToggle} />
          {showDone ? (
            <DeadlineList heading="Finished" deadlines={groups.done} courses={courseMap} today={today} onToggle={handleToggle} />
          ) : null}
        </>
      )}
      <Toast toast={toast} onClose={close} />
    </div>
  );
}
