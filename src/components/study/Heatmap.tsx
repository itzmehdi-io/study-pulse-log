import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { dateKey, keyToDate } from "@/lib/study/format";

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
  const { t, formatDur, formatDate, weekdayShort, weekStartsOn } = useI18n();
  const todayKey = dateKey(new Date());
  const leadingBlanks = days.length
    ? (days[0]!.date.getDay() - weekStartsOn + 7) % 7
    : 0;
  const headers = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + weekStartsOn + i); // Jan 7 2024 is a Sunday
    return weekdayShort(d);
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {headers.map((d, i) => (
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
            title={`${formatDate(keyToDate(day.key), "short")} — ${day.total ? formatDur(day.total) : t("heat.noStudy")}`}
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
        <span>{t("heat.less")}</span>
        {["bg-muted/60", "bg-primary/25", "bg-primary/45", "bg-primary/70", "bg-primary"].map(
          (c) => (
            <span key={c} className={cn("size-3 rounded-sm", c)} />
          ),
        )}
        <span>{t("heat.more")}</span>
      </div>
    </div>
  );
}
