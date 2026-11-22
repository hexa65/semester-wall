export type DeadlineKind = "Assignment" | "Test" | "Exam" | "Project" | "Reading";

export interface Deadline {
  id: number;
  courseId: number;
  title: string;
  kind: DeadlineKind;
  dueDate: string; // "2026-10-24"
  dueTime: string; // "" or "14:30"
  done: boolean;
  note: string; // may be ""
}

export type CreateDeadlineInput = Omit<Deadline, "id">;
export type UpdateDeadlineInput = Partial<CreateDeadlineInput>;

// All filters are optional. Dates are "YYYY-MM-DD".
export interface DeadlineFilters {
  from?: string;
  to?: string;
  courseId?: number;
  done?: boolean;
}

export interface DeadlineFormValues {
  title: string;
  kind: string;
  courseId: string;
  dueDate: string;
  dueTime: string;
  note: string;
}

// What the deadline form produces: everything except `done`, which has its own checkbox in the lists.
export type DeadlineDetails = Omit<CreateDeadlineInput, "done">;
