import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

// Built on the native <dialog>: the browser traps focus, closes it with Escape and dims the page.
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // m-auto: Tailwind's reset removes the default centering of <dialog>.
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onCancel}
      className="m-auto w-[min(92vw,28rem)] border-2 border-ink bg-sheet p-5 text-ink shadow-[6px_6px_0_0_var(--color-ink)] backdrop:bg-ink/50"
    >
      <h2 id={titleId} className="text-2xl">
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-base">{children}</div>
      {error ? (
        <p role="alert" className="mt-3 font-semibold text-pin">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Keep it
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Deleting..." : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
