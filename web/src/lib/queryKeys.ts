import type { DeadlineFilters } from "../types/deadline";

// One place for every query key. Keys that depend on parameters carry them (for example the
// visible date range), so each range is cached on its own and refetches when the range changes.
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  courses: {
    all: ["courses"] as const,
    list: () => ["courses", "list"] as const,
    detail: (id: number) => ["courses", "detail", id] as const,
  },
  deadlines: {
    all: ["deadlines"] as const,
    list: (filters: DeadlineFilters) => ["deadlines", "list", filters] as const,
    detail: (id: number) => ["deadlines", "detail", id] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    list: () => ["sessions", "list"] as const,
  },
  semester: {
    all: ["semester"] as const,
  },
};
