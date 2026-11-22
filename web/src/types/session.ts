export interface ClassSession {
  id: number;
  courseId: number;
  weekday: number; // 1 = Monday ... 7 = Sunday
  startTime: string; // "09:00"
  endTime: string;
  room: string;
}

export type CreateSessionInput = Omit<ClassSession, "id">;
export type UpdateSessionInput = Partial<CreateSessionInput>;

export interface SessionFormValues {
  courseId: string;
  weekday: string;
  startTime: string;
  endTime: string;
  room: string;
}
