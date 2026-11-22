import { useCallback, useState } from "react";
import type { ToastState, ToastVariant } from "../types/toast";

interface UseToast {
  toast: ToastState | null;
  show: (message: string, variant?: ToastVariant) => void;
  close: () => void; // stable: its identity never changes, so <Toast> does not restart its timer
}

// A message that lives inside one page (UI state).
export function useToast(): UseToast {
  const [toast, setToast] = useState<ToastState | null>(null);
  const show = useCallback((message: string, variant: ToastVariant = "success") => {
    setToast({ message, variant });
  }, []);
  const close = useCallback(() => setToast(null), []);
  return { toast, show, close };
}
