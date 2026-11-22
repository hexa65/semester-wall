import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { controlClass, describedBy, errorClass, hintClass, labelClass } from "./field";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = "", ...rest }: TextareaProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={`${controlClass} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(error), Boolean(hint))}
        {...rest}
      />
      {hint ? (
        <p id={`${id}-hint`} className={hintClass}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
