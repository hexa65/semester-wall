import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import {
  createDeadline,
  deleteDeadline,
  getDeadline,
  getDeadlines,
  updateDeadline,
} from "../services/deadlineService";
import type { CreateDeadlineInput, Deadline, DeadlineFilters, UpdateDeadlineInput } from "../types/deadline";

// The filters (for example the visible date range) are part of the query key.
export function useDeadlines(filters: DeadlineFilters = {}): UseQueryResult<Deadline[], Error> {
  return useQuery<Deadline[], Error>({
    queryKey: queryKeys.deadlines.list(filters),
    queryFn: () => getDeadlines(filters),
  });
}

export function useDeadline(id: number | null): UseQueryResult<Deadline, Error> {
  return useQuery<Deadline, Error>({
    queryKey: queryKeys.deadlines.detail(id ?? 0),
    queryFn: () => getDeadline(id ?? 0),
    enabled: id !== null,
  });
}

export function useCreateDeadline(): UseMutationResult<Deadline, Error, CreateDeadlineInput> {
  const queryClient = useQueryClient();
  return useMutation<Deadline, Error, CreateDeadlineInput>({
    mutationFn: createDeadline,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.deadlines.all }),
  });
}

interface UpdateDeadlineVars {
  id: number;
  input: UpdateDeadlineInput;
}

export function useUpdateDeadline(): UseMutationResult<Deadline, Error, UpdateDeadlineVars> {
  const queryClient = useQueryClient();
  return useMutation<Deadline, Error, UpdateDeadlineVars>({
    mutationFn: ({ id, input }) => updateDeadline(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.deadlines.all }),
  });
}

export function useDeleteDeadline(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteDeadline,
    // Only the lists: the deleted deadline's own page is still open and must not refetch it.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deadlines", "list"] }),
  });
}

interface ToggleVars {
  id: number;
  done: boolean;
}

interface ToggleContext {
  snapshots: [QueryKey, Deadline[] | undefined][];
}

// Mark done / not done with an OPTIMISTIC update:
//  onMutate  - runs before the request: save a snapshot, then change the cached lists right away
//  onError   - the request failed: put the snapshot back (rollback)
//  onSettled - always at the end: refetch, so the screen matches the server
export function useToggleDone(): UseMutationResult<Deadline, Error, ToggleVars, ToggleContext> {
  const queryClient = useQueryClient();
  return useMutation<Deadline, Error, ToggleVars, ToggleContext>({
    mutationFn: ({ id, done }) => updateDeadline(id, { done }),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.deadlines.all });
      const listKey = ["deadlines", "list"];
      const snapshots = queryClient.getQueriesData<Deadline[]>({ queryKey: listKey });
      // map() makes a NEW array: we never change the cached one in place.
      queryClient.setQueriesData<Deadline[]>({ queryKey: listKey }, (old) =>
        old?.map((d) => (d.id === id ? { ...d, done } : d)),
      );
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.deadlines.all }),
  });
}
