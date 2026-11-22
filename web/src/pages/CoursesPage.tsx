import { useState } from "react";
import { Link } from "react-router";
import { CourseBadge } from "../components/courses/CourseBadge";
import { Button, LinkButton } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeading } from "../components/ui/PageHeading";
import { Loading, Skeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/States";
import { Toast } from "../components/ui/Toast";
import { useCourses, useDeleteCourse } from "../hooks/useCourses";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../lib/errors";
import { plural } from "../lib/format";
import type { CourseSummary } from "../types/course";

export function CoursesPage() {
  useDocumentTitle("Courses");
  const courses = useCourses();
  const remove = useDeleteCourse();
  const { toast, show, close } = useToast();
  const [pending, setPending] = useState<CourseSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function confirmDelete() {
    if (!pending) return;
    const target = pending;
    remove.mutate(target.id, {
      onSuccess: () => {
        setPending(null);
        setDeleteError(null);
        show(`Deleted ${target.code}.`);
      },
      onError: (error) => setDeleteError(getErrorMessage(error)),
    });
  }

  function cancelDelete() {
    setPending(null);
    setDeleteError(null);
  }

  return (
    <div>
      <PageHeading
        title="Courses"
        intro="Every course has a colour and a code. They appear on the calendar, the timetable and your deadlines."
        actions={<LinkButton to="/courses/new">Add a course</LinkButton>}
      />

      {courses.isPending ? (
        <Loading label="Loading courses">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((n) => (
              <li key={n}>
                <Skeleton className="h-28" />
              </li>
            ))}
          </ul>
        </Loading>
      ) : courses.isError ? (
        <ErrorState message={getErrorMessage(courses.error)} onRetry={() => void courses.refetch()} />
      ) : courses.data.length === 0 ? (
        <EmptyState
          title="No courses yet"
          action={<LinkButton to="/courses/new">Add your first course</LinkButton>}
        >
          Start with a course. Then you can add its weekly classes and its deadlines.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {courses.data.map((course) => (
            <li key={course.id} className="flex flex-col justify-between gap-3 border-2 border-ink bg-sheet p-4">
              <div>
                <CourseBadge course={course} />
                <h2 className="mt-2 text-xl">{course.title}</h2>
                <p className="text-ink-soft">
                  {plural(course.sessionCount, "weekly class", "weekly classes")}, {plural(course.deadlineCount, "deadline")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/courses/${course.id}/edit`}
                  className="inline-flex min-h-11 items-center border-2 border-ink px-4 font-semibold hover:bg-pin-soft"
                >
                  Edit {course.code}
                </Link>
                <Button variant="danger" onClick={() => setPending(course)}>
                  Delete {course.code}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending ? `Delete ${pending.code}?` : "Delete course?"}
        confirmLabel="Delete course"
        busy={remove.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      >
        {pending ? (
          <>
            <p>
              <strong>{pending.title}</strong> will be deleted for good.
            </p>
            <p>
              This also deletes its {plural(pending.deadlineCount, "deadline")} and{" "}
              {plural(pending.sessionCount, "weekly class", "weekly classes")}.
            </p>
          </>
        ) : null}
      </ConfirmDialog>
      <Toast toast={toast} onClose={close} />
    </div>
  );
}
