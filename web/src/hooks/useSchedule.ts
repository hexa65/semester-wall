import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { getSemester, saveSemester } from "../services/semesterService";
import {
  createSession,
  deleteSession,
  getSessions,
  updateSession,
} from "../services/sessionService";
import type { ClassSession, CreateSessionInput, UpdateSessionInput } from "../types/session";
import type { Semester } from "../types/semester";

export function useSessions(): UseQueryResult<ClassSession[], Error> {
  return useQuery<ClassSession[], Error>({ queryKey: queryKeys.sessions.list(), queryFn: getSessions });
}

export function useSemester(): UseQueryResult<Semester | null, Error> {
  return useQuery<Semester | null, Error>({ queryKey: queryKeys.semester.all, queryFn: getSemester });
}

export function useSaveSemester(): UseMutationResult<Semester, Error, Semester> {
  const queryClient = useQueryClient();
  return useMutation<Semester, Error, Semester>({
    mutationFn: saveSemester,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.semester.all }),
  });
}

export function useCreateSession(): UseMutationResult<ClassSession, Error, CreateSessionInput> {
  const queryClient = useQueryClient();
  return useMutation<ClassSession, Error, CreateSessionInput>({
    mutationFn: createSession,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

interface UpdateSessionVars {
  id: number;
  input: UpdateSessionInput;
}

export function useUpdateSession(): UseMutationResult<ClassSession, Error, UpdateSessionVars> {
  const queryClient = useQueryClient();
  return useMutation<ClassSession, Error, UpdateSessionVars>({
    mutationFn: ({ id, input }) => updateSession(id, input),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useDeleteSession(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteSession,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
