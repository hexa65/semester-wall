import type { ReactNode } from "react";

interface PageHeadingProps {
  title: string;
  intro?: string;
  actions?: ReactNode;
}

export function PageHeading({ title, intro, actions }: PageHeadingProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {intro ? <p className="mt-1 max-w-prose text-ink-soft">{intro}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
