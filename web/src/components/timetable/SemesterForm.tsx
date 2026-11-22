import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { isValidDate } from "../../lib/dates";
import type { Semester } from "../../types/semester";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface SemesterFormProps {
  initial: Semester | null;
  busy: boolean;
  serverError?: string | null;
  onSubmit: (semester: Semester) => void;
}

export function SemesterForm({ initial, busy, serverError, onSubmit }: SemesterFormProps) {
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: { startDate?: string; endDate?: string } = {};
    if (!isValidDate(startDate)) found.startDate = "Enter the first day of the semester.";
    if (!isValidDate(endDate)) found.endDate = "Enter the last day of the semester.";
    else if (isValidDate(startDate) && endDate <= startDate) found.endDate = "The end date must be after the start date.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({ startDate, endDate });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 border-2 border-ink bg-sheet p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First day of the semester"
          type="date"
          value={startDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
          error={errors.startDate}
        />
        <Input
          label="Last day of the semester"
          type="date"
          value={endDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
          error={errors.endDate}
        />
      </div>
      {serverError ? (
        <p role="alert" className="font-semibold text-pin">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving..." : "Save semester dates"}
      </Button>
    </form>
  );
}
