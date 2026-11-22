export type CourseColor = "blue" | "green" | "orange" | "purple" | "teal" | "rose";

export interface Course {
  id: number;
  code: string;
  title: string;
  color: CourseColor;
}

export interface CourseSummary extends Course {
  deadlineCount: number;
  sessionCount: number;
}

export type CreateCourseInput = Omit<Course, "id">;
export type UpdateCourseInput = Partial<CreateCourseInput>;

// Form values are always strings (that is what inputs give us).
export interface CourseFormValues {
  code: string;
  title: string;
  color: string;
}
