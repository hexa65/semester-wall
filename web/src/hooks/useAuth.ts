import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { clearToken, hasToken, saveToken } from "../lib/authStorage";
import { queryKeys } from "../lib/queryKeys";
import { getMe, login, register } from "../services/authService";
import type { AuthResponse, LoginInput, RegisterInput, User } from "../types/auth";

// Who is logged in? The answer comes from the API, so it is server state like everything else.
export function useMe(): UseQueryResult<User, Error> {
  return useQuery<User, Error>({
    queryKey: queryKeys.auth.me,
    queryFn: getMe,
    enabled: hasToken(),
    retry: false,
    staleTime: Infinity,
  });
}

// After a login or sign-up: keep the token, drop ALL cached data (it may belong to someone else), remember who we are.
function useStartSession() {
  const queryClient = useQueryClient();
  return useCallback(
    (response: AuthResponse) => {
      saveToken(response.token);
      queryClient.removeQueries(); // queries only: the running login mutation must stay alive
      queryClient.setQueryData(queryKeys.auth.me, response.user);
    },
    [queryClient],
  );
}

export function useLogin(): UseMutationResult<AuthResponse, Error, LoginInput> {
  const start = useStartSession();
  return useMutation<AuthResponse, Error, LoginInput>({ mutationFn: login, onSuccess: start });
}

export function useRegister(): UseMutationResult<AuthResponse, Error, RegisterInput> {
  const start = useStartSession();
  return useMutation<AuthResponse, Error, RegisterInput>({ mutationFn: register, onSuccess: start });
}

export function useLogout(): () => void {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(() => {
    clearToken();
    queryClient.clear(); // the next person must never see this person's cached data
    void navigate("/login", { replace: true });
  }, [queryClient, navigate]);
}
