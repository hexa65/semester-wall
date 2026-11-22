import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { WEEKDAY_NAMES } from "../../lib/constants";
import type { Course } from "../../types/course";
import type { CreateSessionInput, SessionFormValues } from "../../types/session";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

interface SessionFormProps {
  title: string;
  initialValues: SessionFormValues;
  courses: Course[];
  submitLabel: string;
  busy: boolean;
  serverError?: string | null; // for example the overlap message from the API
  onSubmit: (input: CreateSessionInput) => void;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof SessionFormValues, string>>;
const TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export function SessionForm({ title, initialValues, courses, submitLabel, busy, serverError, onSubmit, onCancel }: SessionFormProps) {
  const [values, setValues] = useState<SessionFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    const courseId = Number(values.courseId);
    const weekday = Number(values.weekday);
    if (!Number.isInteger(courseId) || courseId < 1) found.courseId = "Choose a course.";
    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) found.weekday = "Choose a day.";
    if (!TIME.test(values.startTime)) found.startTime = "Enter a start time.";
    if (!TIME.test(values.endTime)) found.endTime = "Enter an end time.";
    else if (TIME.test(values.startTime) && values.endTime <= values.startTime) {
      found.endTime = "The end time must be after the start time.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({ courseId, weekday, startTime: values.startTime, endTime: values.endTime, room: values.room.trim() });
  }

  const courseOptions = [
    { value: "", label: "Choose a course" },
    ...courses.map((c) => ({ value: String(c.id), label: `${c.code} ${c.title}` })),
  ];
  const dayOptions = WEEKDAY_NAMES.map((name, i) => ({ value: String(i + 1), label: name }));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 border-2 border-ink bg-sheet p-4" aria-label={title}>
      <h3 className="text-xl">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Course" name="courseId" value={values.courseId} onChange={handleChange} options={courseOptions} error={errors.courseId} />
        <Select label="Day of the week" name="weekday" value={values.weekday} onChange={handleChange} options={dayOptions} error={errors.weekday} />
        <Input label="Starts at" name="startTime" type="time" value={values.startTime} onChange={handleChange} error={errors.startTime} />
        <Input label="Ends at" name="endTime" type="time" value={values.endTime} onChange={handleChange} error={errors.endTime} />
      </div>
      <Input label="Room (optional)" name="room" value={values.room} onChange={handleChange} error={errors.room} autoComplete="off" />
      {serverError ? (
        <p role="alert" className="border-2 border-l-8 border-pin p-2 font-semibold text-pin">
          {serverError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
