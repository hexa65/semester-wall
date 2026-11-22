import type { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
}

// A grey block. Place it with the SAME size and shape as the real content so the page does not jump.
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`animate-pulse rounded-sm bg-rule/60 ${className}`} />;
}

interface LoadingProps {
  label: string; // read by screen readers, e.g. "Loading deadlines"
  children: ReactNode;
}

export function Loading({ label, children }: LoadingProps) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
