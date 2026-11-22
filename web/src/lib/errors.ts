import { isAxiosError } from "axios";

interface ApiErrorBody {
  message: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null && "message" in value && typeof value.message === "string";
}

// Turn anything that was thrown (`unknown`) into a sentence a person can read.
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response && isApiErrorBody(error.response.data)) return error.response.data.message;
    if (error.code === "ECONNABORTED") {
      return "The server took too long to answer. The free host may be waking up, so wait a moment and try again.";
    }
    if (!error.response) {
      return "Cannot reach the server. Check your connection, or that the API is running.";
    }
    if (error.response.status === 403) return "This demo is read-only, so changes are turned off.";
    return `The server answered with an error (${error.response.status}).`;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function getErrorStatus(error: unknown): number | null {
  return isAxiosError(error) && error.response ? error.response.status : null;
}
