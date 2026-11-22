// Shared look and wiring for Input, Select and Textarea.

export const labelClass = "mb-1 block text-base font-semibold";

export const controlClass =
  "block min-h-11 w-full rounded-sm border-2 border-ink-soft bg-sheet px-3 py-2 text-base text-ink " +
  "placeholder:text-ink-soft aria-[invalid=true]:border-pin aria-[invalid=true]:border-l-8";

export const hintClass = "mt-1 text-sm text-ink-soft";
export const errorClass = "mt-1 text-sm font-semibold text-pin";

// Which ids should the control point to with aria-describedby?
export function describedBy(id: string, hasError: boolean, hasHint: boolean): string | undefined {
  const ids: string[] = [];
  if (hasHint) ids.push(`${id}-hint`);
  if (hasError) ids.push(`${id}-error`);
  return ids.length > 0 ? ids.join(" ") : undefined;
}
