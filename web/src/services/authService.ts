import type { AuthResponse, LoginInput, RegisterInput, User } from "../types/auth";
import { api } from "./api";

export async function login(input: LoginInput): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", input);
  return res.data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", input);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>("/auth/me");
  return res.data;
}
