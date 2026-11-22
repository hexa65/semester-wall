import { isAxiosError } from "axios";
import type { Semester } from "../types/semester";
import { api } from "./api";

// The API answers 404 when the dates were never set. That is not a failure: it means "no semester yet".
export async function getSemester(): Promise<Semester | null> {
  try {
    const res = await api.get<Semester>("/semester");
    return res.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function saveSemester(input: Semester): Promise<Semester> {
  const res = await api.put<Semester>("/semester", input);
  return res.data;
}
