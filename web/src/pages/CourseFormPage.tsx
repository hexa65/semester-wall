import { useState } from "react";
import { useParams } from "react-router";
import { CourseForm } from "../components/courses/CourseForm";
import { LinkButton } from "../components/ui/Button";
import { PageHeading } from "../components/ui/PageHeading";
import { Loading, Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/States";
import { useCourse, useCreateCourse, useUpdateCourse } from "../hooks/useCourses";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useToastRedirect } from "../hooks/useToastRedirect";
import { getErrorMessage } from "../lib/errors";
import type { CourseFormValues, CreateCourseInput } from "../types/course";

const EMPTY: CourseFormValues = { code: "", title: "", color: "" };

// The same page handles /courses/new and /courses/:id/edit.
export function CourseFormPage() {
  const { id: idParam } = useParams();
  const isEdit = idParam !== undefined;
  // A bad id ("abc") is checked BEFORE the loading state: a switched-off query would stay "pending" forever.
  const id = idParam !== undefined && /^\d+$/.test(idParam) ? Number(idParam) : null;
  const badId = isEdit && id === null;

  useDocumentTitle(isEdit ? "Edit course" : "Add a course");
  const course = useCourse(isEdit ? id : null);
  const create = useCreateCourse();
  const update = useUpdateCourse();
  const redirect = useToastRedirect();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleSubmit(input: CreateCourseInput) {
    setServerError(null);
    // The API answers 409 when the code already exists; its message is shown next to the code field.
    const onError = (error: Error) => setServerError(getErrorMessage(error));
    if (isEdit && id !== null) {
      update.mutate({ id, input }, { onSuccess: () => redirect("/courses", `Saved ${input.code}.`), onError });
    } else {
      create.mutate(input, { onSuccess: () => redirect("/courses", `Added ${input.code}.`), onError });
    }
  }

  const heading = <PageHeading title={isEdit ? "Edit course" : "Add a course"} />;

  if (badId) {
    return (
      <div>
        {heading}
        <ErrorState message="This address has an id that is not a number." />
        <div className="mt-3">
          <LinkButton to="/courses" variant="secondary">
            Back to courses
          </LinkButton>
        </div>
      </div>
    );
  }

  if (isEdit && course.isPending) {
    return (
      <div>
        {heading}
        <Loading label="Loading the course">
          <Skeleton className="h-72 max-w-xl" />
        </Loading>
      </div>
    );
  }

  if (isEdit && course.isError) {
    return (
      <div>
        {heading}
        <ErrorState message={getErrorMessage(course.error)} onRetry={() => void course.refetch()} />
      </div>
    );
  }

  const initial: CourseFormValues =
    isEdit && course.data ? { code: course.data.code, title: course.data.title, color: course.data.color } : EMPTY;

  return (
    <div>
      {heading}
      <CourseForm
        // The key resets the form when a different course is loaded.
        key={isEdit ? `edit-${id}` : "new"}
        initialValues={initial}
        submitLabel={isEdit ? "Save changes" : "Add course"}
        busy={create.isPending || update.isPending}
        serverError={serverError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
