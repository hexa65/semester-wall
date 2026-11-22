import type { ClassSession, CreateSessionInput, UpdateSessionInput } from "../types/session";
import { api } from "./api";

export async function getSessions(): Promise<ClassSession[]> {
  const res = await api.get<ClassSession[]>("/sessions");
  return res.data;
}

export async function createSession(input: CreateSessionInput): Promise<ClassSession> {
  const res = await api.post<ClassSession>("/sessions", input);
  return res.data;
}

export async function updateSession(id: number, input: UpdateSessionInput): Promise<ClassSession> {
  const res = await api.patch<ClassSession>(`/sessions/${id}`, input);
  return res.data;
}

export async function deleteSession(id: number): Promise<void> {
  await api.delete(`/sessions/${id}`);
}
