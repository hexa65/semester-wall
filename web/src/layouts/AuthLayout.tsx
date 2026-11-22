import type { ReactNode } from "react";
import { APP_NAME } from "../lib/constants";

interface AuthLayoutProps {
  title: string;
  intro: string;
  children: ReactNode;
}

// The frame of the login and sign-up pages: no menu, because you are not inside yet.
export function AuthLayout({ title, intro, children }: AuthLayoutProps) {
  return (
    <>
      <header className="border-t-8 border-ink border-b-2 bg-sheet">
        <p className="mx-auto max-w-6xl px-4 py-3 font-display text-2xl font-bold">{APP_NAME}</p>
      </header>
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        <p className="mb-5 mt-1 text-ink-soft">{intro}</p>
        {children}
      </main>
    </>
  );
}
