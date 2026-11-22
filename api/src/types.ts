// The API keeps its own copy of the shared types (the web has another one in web/src/types).
// This duplication is on purpose: the two folders are separate projects.
// We use `type` (not `interface`) for row shapes so they work with pg's query<T>().

export const COURSE_COLORS = ["blue", "green", "orange", "purple", "teal", "rose"] as const;
export type CourseColor = (typeof COURSE_COLORS)[number];

export const DEADLINE_KINDS = ["Assignment", "Test", "Exam", "Project", "Reading"] as const;
export type DeadlineKind = (typeof DEADLINE_KINDS)[number];

export type Course = { id: number; code: string; title: string; color: CourseColor };
export type CourseSummary = Course & { deadlineCount: number; sessionCount: number };
export type CreateCourseInput = Omit<Course, "id">;
export type UpdateCourseInput = Partial<CreateCourseInput>;

export type Deadline = {
  id: number;
  courseId: number;
  title: string;
  kind: DeadlineKind;
  dueDate: string; // "2026-10-24"
  dueTime: string; // "" or "14:30"
  done: boolean;
  note: string;
};
export type CreateDeadlineInput = Omit<Deadline, "id">;
export type UpdateDeadlineInput = Partial<CreateDeadlineInput>;
export type DeadlineFilters = { from?: string; to?: string; courseId?: number; done?: boolean };

export type ClassSession = {
  id: number;
  courseId: number;
  weekday: number; // 1 = Monday ... 7 = Sunday
  startTime: string;
  endTime: string;
  room: string;
};
export type CreateSessionInput = Omit<ClassSession, "id">;
export type UpdateSessionInput = Partial<CreateSessionInput>;

export type Semester = { startDate: string; endDate: string };

export type User = { id: number; email: string; name: string };
export type AuthResponse = { token: string; user: User };
export type RegisterInput = { email: string; password: string; name: string };
export type LoginInput = { email: string; password: string };
