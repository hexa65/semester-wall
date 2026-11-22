import { useMemo, useState } from "react";
import { SemesterForm } from "../components/timetable/SemesterForm";
import { SessionForm } from "../components/timetable/SessionForm";
import { SessionList } from "../components/timetable/SessionList";
import { Button, LinkButton } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeading } from "../components/ui/PageHeading";
import { Loading, Skeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/States";
import { Toast } from "../components/ui/Toast";
import { useCourses } from "../hooks/useCourses";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  useCreateSession,
  useDeleteSession,
  useSaveSemester,
  useSemester,
  useSessions,
  useUpdateSession,
} from "../hooks/useSchedule";
import { useToast } from "../hooks/useToast";
import { indexById } from "../lib/courses";
import { getErrorMessage } from "../lib/errors";
import { formatTimeRange } from "../lib/format";
import { WEEKDAY_NAMES } from "../lib/constants";
import type { ClassSession, CreateSessionInput, SessionFormValues } from "../types/session";

const NEW_VALUES: SessionFormValues = { courseId: "", weekday: "1", startTime: "09:00", endTime: "10:30", room: "" };

export function TimetablePage() {
  useDocumentTitle("Timetable");
  const courses = useCourses();
  const sessions = useSessions();
  const semester = useSemester();
  const saveSemester = useSaveSemester();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const removeSession = useDeleteSession();
  const { toast, show, close } = useToast();

  // UI state: which form is open, and which class is waiting for a delete confirmation.
  const [editing, setEditing] = useState<ClassSession | "new" | null>(null);
  const [deleting, setDeleting] = useState<ClassSession | null>(null);
  const [semesterError, setSemesterError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const courseMap = useMemo(() => indexById(courses.data ?? []), [courses.data]);

  function handleSemester(value: { startDate: string; endDate: string }) {
    setSemesterError(null);
    saveSemester.mutate(value, {
      onSuccess: () => show("Semester dates saved."),
      onError: (error) => setSemesterError(getErrorMessage(error)),
    });
  }

  function openForm(target: ClassSession | "new") {
    setSessionError(null);
    setEditing(target);
  }

  function handleSession(input: CreateSessionInput) {
    setSessionError(null);
    const onError = (error: Error) => setSessionError(getErrorMessage(error)); // for example "This class overlaps..."
    if (editing !== null && editing !== "new") {
      updateSession.mutate(
        { id: editing.id, input },
        { onSuccess: () => { setEditing(null); show("Class saved."); }, onError },
      );
    } else {
      createSession.mutate(input, { onSuccess: () => { setEditing(null); show("Class added."); }, onError });
    }
  }

  function confirmDelete() {
    if (!deleting) return;
    removeSession.mutate(deleting.id, {
      onSuccess: () => { setDeleting(null); setSessionError(null); show("Class deleted."); },
      onError: (error) => setSessionError(getErrorMessage(error)),
    });
  }

  const heading = <PageHeading title="Timetable" intro="Set the semester dates, then add each weekly class once. The calendar repeats it for you." />;

  if (courses.isPending || sessions.isPending || semester.isPending) {
    return (
      <div>
        {heading}
        <Loading label="Loading the timetable">
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </Loading>
      </div>
    );
  }

  if (courses.isError || sessions.isError || semester.isError) {
    return (
      <div>
        {heading}
        <ErrorState
          message={getErrorMessage(courses.error ?? sessions.error ?? semester.error)}
          onRetry={() => {
            void courses.refetch();
            void sessions.refetch();
            void semester.refetch();
          }}
        />
      </div>
    );
  }

  const editValues: SessionFormValues =
    editing !== null && editing !== "new"
      ? {
          courseId: String(editing.courseId),
          weekday: String(editing.weekday),
          startTime: editing.startTime,
          endTime: editing.endTime,
          room: editing.room,
        }
      : NEW_VALUES;

  return (
    <div>
      {heading}

      <section aria-labelledby="semester-title" className="mb-8">
        <h2 id="semester-title" className="mb-2 text-2xl">
          Semester dates
        </h2>
        <SemesterForm
          key={`${semester.data?.startDate ?? ""}-${semester.data?.endDate ?? ""}`}
          initial={semester.data}
          busy={saveSemester.isPending}
          serverError={semesterError}
          onSubmit={handleSemester}
        />
      </section>

      <section aria-labelledby="classes-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="classes-title" className="text-2xl">
            Weekly classes
          </h2>
          {courses.data.length > 0 && editing === null ? <Button onClick={() => openForm("new")}>Add a class</Button> : null}
        </div>

        {courses.data.length === 0 ? (
          <EmptyState title="Add a course first" action={<LinkButton to="/courses/new">Add a course</LinkButton>}>
            Every class belongs to a course.
          </EmptyState>
        ) : (
          <>
            {editing !== null ? (
              <div className="mb-5 max-w-2xl">
                <SessionForm
                  key={editing === "new" ? "new" : `edit-${editing.id}`}
                  title={editing === "new" ? "Add a weekly class" : "Edit this class"}
                  initialValues={editValues}
                  courses={courses.data}
                  submitLabel={editing === "new" ? "Add class" : "Save changes"}
                  busy={createSession.isPending || updateSession.isPending}
                  serverError={sessionError}
                  onSubmit={handleSession}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : null}

            {sessions.data.length === 0 ? (
              <EmptyState title="No weekly classes yet">
                Add the first one. A class that meets every Monday is added once, not once per week.
              </EmptyState>
            ) : (
              <SessionList sessions={sessions.data} courses={courseMap} onEdit={openForm} onDelete={(s) => { setSessionError(null); setDeleting(s); }} />
            )}
          </>
        )}
      </section>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this class?"
        confirmLabel="Delete class"
        busy={removeSession.isPending}
        error={sessionError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      >
        {deleting ? (
          <p>
            {courseMap.get(deleting.courseId)?.code ?? "This class"} on {WEEKDAY_NAMES[deleting.weekday - 1]},{" "}
            {formatTimeRange(deleting.startTime, deleting.endTime)}, will be removed from every week.
          </p>
        ) : null}
      </ConfirmDialog>
      <Toast toast={toast} onClose={close} />
    </div>
  );
}
