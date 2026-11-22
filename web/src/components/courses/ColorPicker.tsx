import { useId } from "react";
import type { ChangeEvent } from "react";
import { COURSE_COLORS, COURSE_COLOR_CLASSES } from "../../lib/constants";
import type { CourseColor } from "../../types/course";

interface ColorPickerProps {
  value: string;
  onChange: (color: CourseColor) => void;
  error?: string;
}

const COLOR_LABELS: Record<CourseColor, string> = {
  blue: "Blue",
  green: "Green",
  orange: "Orange",
  purple: "Purple",
  teal: "Teal",
  rose: "Rose",
};

// An accessible radio group: arrow keys move between colours, and each option is named in words.
export function ColorPicker({ value, onChange, error }: ColorPickerProps) {
  const name = useId();
  const errorId = `${name}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1 text-base font-semibold">Colour</legend>
      <div className="flex flex-wrap gap-2">
        {COURSE_COLORS.map((color) => {
          const selected = value === color;
          const classes = COURSE_COLOR_CLASSES[color];
          return (
            <label
              key={color}
              className={`relative flex min-h-11 cursor-pointer items-center gap-2 border-2 bg-sheet px-3 py-1 font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                selected ? "border-ink shadow-[3px_3px_0_0_var(--color-ink)]" : "border-ink-soft"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={color}
                checked={selected}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const next = event.target.value;
                  const match = COURSE_COLORS.find((c) => c === next);
                  if (match) onChange(match);
                }}
                className="sr-only"
              />
              <span aria-hidden="true" className={`h-5 w-5 border-l-4 ${classes.fill} ${classes.edge}`} />
              {COLOR_LABELS[color]}
              {selected ? <span aria-hidden="true">&#10003;</span> : null}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="mt-1 text-sm font-semibold text-pin">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
