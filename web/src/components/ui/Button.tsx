import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

export type ButtonVariant = "primary" | "secondary" | "danger" | "quiet";

const BASE =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-sm px-4 py-2 text-base font-semibold " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-pin text-white hover:bg-ink",
  secondary: "border-2 border-ink bg-sheet text-ink hover:bg-pin-soft",
  danger: "border-2 border-pin bg-sheet text-pin hover:bg-pin-soft",
  quiet: "text-ink underline decoration-2 underline-offset-4 hover:bg-pin-soft",
};

export function buttonClasses(variant: ButtonVariant): string {
  return `${BASE} ${VARIANTS[variant]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", type = "button", className = "", ...rest }: ButtonProps) {
  return <button type={type} className={`${buttonClasses(variant)} ${className}`} {...rest} />;
}

interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

export function LinkButton({ to, variant = "primary", children, className = "" }: LinkButtonProps) {
  return (
    <Link to={to} className={`${buttonClasses(variant)} ${className}`}>
      {children}
    </Link>
  );
}
