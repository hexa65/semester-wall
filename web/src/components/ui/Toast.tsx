import { useEffect } from "react";
import type { ToastState } from "../../types/toast";

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void; // must be stable (useCallback), or the timer restarts on every render
  durationMs?: number;
}

export function Toast({ toast, onClose, durationMs = 5000 }: ToastProps) {
  useEffect(() => {
    if (toast === null) return;
    const id = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(id);
  }, [toast, onClose, durationMs]);

  if (toast === null) return null;
  const isError = toast.variant === "error";

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md">
      <div
        role={isError ? "alert" : "status"}
        className={`flex items-start gap-3 border-2 border-l-8 bg-sheet p-3 shadow-[4px_4px_0_0_var(--color-ink)] ${
          isError ? "border-pin" : "border-ink"
        }`}
      >
        <p className="flex-1 text-base font-semibold">
          <span className="sr-only">{isError ? "Error: " : "Done: "}</span>
          {toast.message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 min-w-11 cursor-pointer rounded-sm font-semibold underline underline-offset-4 hover:bg-pin-soft"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
