import type { CreateDeadlineInput, Deadline, DeadlineFilters, UpdateDeadlineInput } from "../types/deadline";
import { api } from "./api";

// axios leaves out params that are undefined, so every filter stays optional.
export async function getDeadlines(filters: DeadlineFilters = {}): Promise<Deadline[]> {
  const res = await api.get<Deadline[]>("/deadlines", { params: filters });
  return res.data;
}

export async function getDeadline(id: number): Promise<Deadline> {
  const res = await api.get<Deadline>(`/deadlines/${id}`);
  return res.data;
}

export async function createDeadline(input: CreateDeadlineInput): Promise<Deadline> {
  const res = await api.post<Deadline>("/deadlines", input);
  return res.data;
}

export async function updateDeadline(id: number, input: UpdateDeadlineInput): Promise<Deadline> {
  const res = await api.patch<Deadline>(`/deadlines/${id}`, input);
  return res.data;
}

export async function deleteDeadline(id: number): Promise<void> {
  await api.delete(`/deadlines/${id}`);
}
