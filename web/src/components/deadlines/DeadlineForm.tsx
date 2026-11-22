import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { DEADLINE_KINDS, isDeadlineKind } from "../../lib/constants";
import { isValidDate } from "../../lib/dates";
import type { Course } from "../../types/course";
import type { DeadlineDetails, DeadlineFormValues } from "../../types/deadline";
import { Button, LinkButton } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

interface DeadlineFormProps {
  initialValues: DeadlineFormValues;
  courses: Course[];
  submitLabel: string;
  busy: boolean;
  serverError?: string | null;
  onSubmit: (details: DeadlineDetails) => void;
}

type FormErrors = Partial<Record<keyof DeadlineFormValues, string>>;

export function DeadlineForm({ initialValues, courses, submitLabel, busy, serverError, onSubmit }: DeadlineFormProps) {
  const [values, setValues] = useState<DeadlineFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: FormErrors = {};
    const title = values.title.trim();
    const courseId = Number(values.courseId);
    if (title === "") found.title = "Enter a title.";
    else if (title.length > 120) found.title = "Keep the title under 120 characters.";
    if (!isDeadlineKind(values.kind)) found.kind = "Choose what kind of deadline this is.";
    if (!Number.isInteger(courseId) || courseId < 1) found.courseId = "Choose the course this belongs to.";
    if (!isValidDate(values.dueDate)) found.dueDate = "Enter a real date.";
    if (values.dueTime !== "" && !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(values.dueTime)) {
      found.dueTime = "Enter a time like 14:30, or leave it empty.";
    }
    if (values.note.length > 500) found.note = "Keep the note under 500 characters.";
    setErrors(found);
    if (Object.keys(found).length > 0 || !isDeadlineKind(values.kind)) return;
    onSubmit({
      courseId,
      title,
      kind: values.kind,
      dueDate: values.dueDate,
      dueTime: values.dueTime,
      note: values.note.trim(),
    });
  }

  const courseOptions = [
    { value: "", label: "Choose a course" },
    ...courses.map((c) => ({ value: String(c.id), label: `${c.code} ${c.title}` })),
  ];
  const kindOptions = DEADLINE_KINDS.map((k) => ({ value: k, label: k }));

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-4 border-2 border-ink bg-sheet p-4 sm:p-6">
      <Input label="Title" name="title" value={values.title} onChange={handleChange} error={errors.title} autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Course" name="courseId" value={values.courseId} onChange={handleChange} options={courseOptions} error={errors.courseId} />
        <Select label="Kind" name="kind" value={values.kind} onChange={handleChange} options={kindOptions} error={errors.kind} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Due date" name="dueDate" type="date" value={values.dueDate} onChange={handleChange} error={errors.dueDate} />
        <Input
          label="Due time (optional)"
          name="dueTime"
          type="time"
          value={values.dueTime}
          onChange={handleChange}
          error={errors.dueTime}
          hint="Leave empty if there is no set time."
        />
      </div>
      <Textarea label="Note (optional)" name="note" value={values.note} onChange={handleChange} error={errors.note} />
      {serverError ? (
        <p role="alert" className="font-semibold text-pin">
          {serverError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : submitLabel}
        </Button>
        <LinkButton to="/deadlines" variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
