import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { isCourseColor } from "../../lib/constants";
import type { CourseColor, CourseFormValues, CreateCourseInput } from "../../types/course";
import { Button, LinkButton } from "../ui/Button";
import { Input } from "../ui/Input";
import { ColorPicker } from "./ColorPicker";

interface CourseFormProps {
  initialValues: CourseFormValues;
  submitLabel: string;
  busy: boolean;
  serverError?: string | null; // for example the duplicate-code message from the API
  onSubmit: (input: CreateCourseInput) => void;
}

interface FormErrors {
  code?: string;
  title?: string;
  color?: string;
}

// Form state: the values live here, as strings, until the person presses the button.
export function CourseForm({ initialValues, submitLabel, busy, serverError, onSubmit }: CourseFormProps) {
  const [values, setValues] = useState<CourseFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    if (name === "code" || name === "title") setValues((v) => ({ ...v, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: FormErrors = {};
    const code = values.code.trim().replace(/\s+/g, " ").toUpperCase();
    const title = values.title.trim();
    if (!/^[A-Z0-9][A-Z0-9 -]{1,11}$/.test(code)) found.code = "Enter a code of 2 to 12 letters or numbers, like CS 301.";
    if (title === "") found.title = "Enter the course title.";
    if (title.length > 80) found.title = "Keep the title under 80 characters.";
    if (!isCourseColor(values.color)) found.color = "Pick a colour for this course.";
    setErrors(found);
    if (Object.keys(found).length > 0 || !isCourseColor(values.color)) return;
    onSubmit({ code, title, color: values.color });
  }

  function handleColor(color: CourseColor) {
    setValues((v) => ({ ...v, color }));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-4 border-2 border-ink bg-sheet p-4 sm:p-6">
      <Input
        label="Course code"
        name="code"
        value={values.code}
        onChange={handleChange}
        error={errors.code ?? serverError ?? undefined}
        hint="Each code can be used once."
        autoComplete="off"
      />
      <Input label="Course title" name="title" value={values.title} onChange={handleChange} error={errors.title} />
      <ColorPicker value={values.color} onChange={handleColor} error={errors.color} />
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : submitLabel}
        </Button>
        <LinkButton to="/courses" variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
