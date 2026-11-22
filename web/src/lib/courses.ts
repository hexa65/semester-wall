// A lookup from course id to course, built once per render with useMemo.
// Map.get() returns `undefined` for a missing id, so callers must handle a deleted course.
export function indexById<T extends { id: number }>(items: readonly T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}
