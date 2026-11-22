import type { ReactNode } from "react";
import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

// What went wrong, in plain words, with a way out.
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="border-2 border-l-8 border-pin bg-sheet p-4">
      <h2 className="text-xl">This did not load</h2>
      <p className="mt-1">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

// An empty screen is an invitation to do the next thing.
export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="border-2 border-dashed border-ink-soft bg-sheet/70 p-5">
      <h2 className="text-xl">{title}</h2>
      {children ? <p className="mt-1 max-w-prose">{children}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
