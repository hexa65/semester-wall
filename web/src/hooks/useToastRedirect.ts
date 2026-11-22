import { useCallback } from "react";
import { useNavigate } from "react-router";
import type { ToastVariant } from "../types/toast";

// Go to another page and show a message there ("Course saved").
// The message travels in the navigation state; AppLayout reads it and shows the toast.
export function useToastRedirect(): (to: string, message: string, variant?: ToastVariant) => void {
  const navigate = useNavigate();
  return useCallback(
    (to: string, message: string, variant: ToastVariant = "success") => {
      void navigate(to, { state: { toast: { message, variant } } });
    },
    [navigate],
  );
}
