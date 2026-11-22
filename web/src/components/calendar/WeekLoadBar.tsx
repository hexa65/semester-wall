import { LOAD_WORDS, loadLevel } from "../../lib/calendar";

interface WeekLoadBarProps {
  count: number; // open deadlines due in this week
}

// The week load gauge: four segments that fill from the bottom, plus the number as text.
// Height is not the only signal: the number and the words in the label say the same thing.
export function WeekLoadBar({ count }: WeekLoadBarProps) {
  const level = loadLevel(count);
  return (
    <div
      role="img"
      aria-label={`Week load: ${count} open ${count === 1 ? "deadline" : "deadlines"}, ${LOAD_WORDS[level]}`}
      className="flex h-full min-h-14 flex-col items-center justify-end gap-1 py-1.5"
    >
      {/* `key={level}` restarts the fill animation when the load changes. */}
      <div key={level} className="flex min-h-8 w-2.5 flex-1 flex-col-reverse gap-0.5 sm:w-3.5">
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            style={{ animationDelay: `${segment * 70}ms` }}
            className={`gauge-segment flex-1 border border-ink ${segment <= level ? "bg-pin" : "bg-sheet"}`}
          />
        ))}
      </div>
      <span aria-hidden="true" className="text-xs font-bold tabular-nums">
        {count}
      </span>
    </div>
  );
}
