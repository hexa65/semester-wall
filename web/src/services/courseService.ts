import type { CreateCourseInput, Course, CourseSummary, UpdateCourseInput } from "../types/course";
import { api } from "./api";

export async function getCourses(): Promise<CourseSummary[]> {
  const res = await api.get<CourseSummary[]>("/courses");
  return res.data;
}

export async function getCourse(id: number): Promise<CourseSummary> {
  const res = await api.get<CourseSummary>(`/courses/${id}`);
  return res.data;
}

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const res = await api.post<Course>("/courses", input);
  return res.data;
}

export async function updateCourse(id: number, input: UpdateCourseInput): Promise<Course> {
  const res = await api.patch<Course>(`/courses/${id}`, input);
  return res.data;
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}`);
}
