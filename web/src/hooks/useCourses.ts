import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { createCourse, deleteCourse, getCourse, getCourses, updateCourse } from "../services/courseService";
import type { Course, CourseSummary, CreateCourseInput, UpdateCourseInput } from "../types/course";

export function useCourses(): UseQueryResult<CourseSummary[], Error> {
  return useQuery<CourseSummary[], Error>({ queryKey: queryKeys.courses.list(), queryFn: getCourses });
}

// `enabled: false` keeps the query in "pending" forever, so pages must check a bad id BEFORE the loading check.
export function useCourse(id: number | null): UseQueryResult<CourseSummary, Error> {
  return useQuery<CourseSummary, Error>({
    queryKey: queryKeys.courses.detail(id ?? 0),
    queryFn: () => getCourse(id ?? 0),
    enabled: id !== null,
  });
}

export function useCreateCourse(): UseMutationResult<Course, Error, CreateCourseInput> {
  const queryClient = useQueryClient();
  return useMutation<Course, Error, CreateCourseInput>({
    mutationFn: createCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
  });
}

interface UpdateCourseVars {
  id: number;
  input: UpdateCourseInput;
}

export function useUpdateCourse(): UseMutationResult<Course, Error, UpdateCourseVars> {
  const queryClient = useQueryClient();
  return useMutation<Course, Error, UpdateCourseVars>({
    mutationFn: ({ id, input }) => updateCourse(id, input),
    // A renamed course also changes how its deadlines and classes are shown.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useDeleteCourse(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteCourse,
    // Refresh the LISTS only. Refetching the deleted course's own query would give a 404 while its page is still open.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.list() }),
        queryClient.invalidateQueries({ queryKey: ["deadlines", "list"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all }),
      ]);
    },
  });
}
