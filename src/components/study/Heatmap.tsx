import { cn } from "@/lib/utils";
import { dateKey, formatDayShort, formatDuration } from "@/lib/study/format";

export function intensityClass(total: number, goalMs: number) {
  if (total <= 0) return "bg-muted/60";
  const ratio = total / Math.max(goalMs, 1);
  if (ratio < 0.25) return "bg-primary/25";
  if (ratio < 0.5) return "bg-primary/45";
  if (ratio < 0.85) return "bg-primary/70";
  return "bg-primary";
}

export function Heatmap({
  days,
  goalMs,
  selected,
  onSelect,
}: {
  days: { key: string; date: Date; total: number }[];
  goalMs: number;
  selected?: string;
  onSelect?: (key: string) => void;
}) {
  const todayKey = dateKey(new Date());
  const leadingBlanks = days.length ? (days[0]!.date.getDay() + 6) % 7 : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-center">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((day) => (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelect?.(day.key)}
            title={`${formatDayShort(day.key)} — ${day.total ? formatDuration(day.total) : "no study"}`}
            className={cn(
              "group relative aspect-square rounded-md transition-all duration-200 hover:scale-[1.08] hover:ring-2 hover:ring-ring/60",
              intensityClass(day.total, goalMs),
              day.key === todayKey && "ring-1 ring-primary/60",
              selected === day.key && "ring-2 ring-ring",
            )}
          >
            <span className="sr-only">{day.key}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {["bg-muted/60", "bg-primary/25", "bg-primary/45", "bg-primary/70", "bg-primary"].map(
          (c) => (
            <span key={c} className={cn("size-3 rounded-sm", c)} />
          ),
        )}
        <span>More</span>
      </div>
    </div>
  );
}
