import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { DeadlineForm } from "../components/deadlines/DeadlineForm";
import { Button, LinkButton } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState, ErrorState } from "../components/ui/States";
import { PageHeading } from "../components/ui/PageHeading";
import { Loading, Skeleton } from "../components/ui/Skeleton";
import { useCourses } from "../hooks/useCourses";
import { useCreateDeadline, useDeadline, useDeleteDeadline, useUpdateDeadline } from "../hooks/useDeadlines";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useToastRedirect } from "../hooks/useToastRedirect";
import { isValidDate } from "../lib/dates";
import { getErrorMessage } from "../lib/errors";
import type { DeadlineDetails, DeadlineFormValues } from "../types/deadline";

// Handles /deadlines/new (can be prefilled with ?date=...&courseId=...) and /deadlines/:id/edit.
export function DeadlineFormPage() {
  const { id: idParam } = useParams();
  const [search] = useSearchParams();
  const isEdit = idParam !== undefined;
  const id = idParam !== undefined && /^\d+$/.test(idParam) ? Number(idParam) : null;
  const badId = isEdit && id === null;

  useDocumentTitle(isEdit ? "Edit deadline" : "Add a deadline");
  const courses = useCourses();
  const deadline = useDeadline(isEdit ? id : null);
  const create = useCreateDeadline();
  const update = useUpdateDeadline();
  const remove = useDeleteDeadline();
  const redirect = useToastRedirect();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const heading = <PageHeading title={isEdit ? "Edit deadline" : "Add a deadline"} />;

  function handleSubmit(details: DeadlineDetails) {
    setServerError(null);
    const onError = (error: Error) => setServerError(getErrorMessage(error));
    if (isEdit && id !== null) {
      update.mutate(
        { id, input: details },
        { onSuccess: () => redirect("/deadlines", "Deadline saved."), onError },
      );
    } else {
      create.mutate(
        { ...details, done: false },
        { onSuccess: () => redirect("/deadlines", "Deadline added."), onError },
      );
    }
  }

  function handleDelete() {
    if (id === null) return;
    remove.mutate(id, {
      onSuccess: () => redirect("/deadlines", "Deadline deleted."),
      onError: (error) => setServerError(getErrorMessage(error)),
    });
  }

  if (badId) {
    return (
      <div>
        {heading}
        <ErrorState message="This address has an id that is not a number." />
      </div>
    );
  }

  if (courses.isPending || (isEdit && deadline.isPending)) {
    return (
      <div>
        {heading}
        <Loading label="Loading the form">
          <Skeleton className="h-96 max-w-xl" />
        </Loading>
      </div>
    );
  }

  if (courses.isError) {
    return (
      <div>
        {heading}
        <ErrorState message={getErrorMessage(courses.error)} onRetry={() => void courses.refetch()} />
      </div>
    );
  }
  if (isEdit && deadline.isError) {
    return (
      <div>
        {heading}
        <ErrorState message={getErrorMessage(deadline.error)} onRetry={() => void deadline.refetch()} />
      </div>
    );
  }

  if (courses.data.length === 0) {
    return (
      <div>
        {heading}
        <EmptyState title="Add a course first" action={<LinkButton to="/courses/new">Add a course</LinkButton>}>
          Every deadline belongs to a course.
        </EmptyState>
      </div>
    );
  }

  // Prefill from the address: ?date=2026-10-14&courseId=2. Anything invalid is ignored.
  const dateParam = search.get("date") ?? "";
  const courseParam = search.get("courseId") ?? "";
  const prefilled: DeadlineFormValues = {
    title: "",
    kind: "Assignment",
    courseId: courses.data.some((c) => String(c.id) === courseParam) ? courseParam : "",
    dueDate: isValidDate(dateParam) ? dateParam : "",
    dueTime: "",
    note: "",
  };
  const initial: DeadlineFormValues =
    isEdit && deadline.data
      ? {
          title: deadline.data.title,
          kind: deadline.data.kind,
          courseId: String(deadline.data.courseId),
          dueDate: deadline.data.dueDate,
          dueTime: deadline.data.dueTime,
          note: deadline.data.note,
        }
      : prefilled;

  return (
    <div>
      {heading}
      <DeadlineForm
        key={isEdit ? `edit-${id}` : `new-${dateParam}-${courseParam}`}
        initialValues={initial}
        courses={courses.data}
        submitLabel={isEdit ? "Save changes" : "Add deadline"}
        busy={create.isPending || update.isPending}
        serverError={serverError}
        onSubmit={handleSubmit}
      />
      {isEdit ? (
        <div className="mt-4">
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete this deadline
          </Button>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirming}
        title="Delete this deadline?"
        confirmLabel="Delete deadline"
        busy={remove.isPending}
        error={serverError}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      >
        <p>{deadline.data ? <strong>{deadline.data.title}</strong> : "This deadline"} will be deleted for good.</p>
      </ConfirmDialog>
    </div>
  );
}
