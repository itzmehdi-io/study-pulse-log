import { TimerIcon } from "@/components/study/TimerIcon";
import { formatDuration } from "@/lib/study/format";
import type { Timer } from "@/lib/study/types";

export function BreakdownBars({
  rows,
  emptyLabel = "No study time logged yet today.",
}: {
  rows: { timerId: string; total: number; timer?: Timer | undefined }[];
  emptyLabel?: string;
}) {
  const max = rows.reduce((a, r) => Math.max(a, r.total), 0);

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const accent = row.timer?.accentColor ?? "var(--primary)";
        const pct = max ? Math.max(3, (row.total / max) * 100) : 0;
        return (
          <li key={row.timerId} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <TimerIcon
                  name={row.timer?.icon ?? "Timer"}
                  className="size-4 shrink-0"
                  // eslint-disable-next-line react/forbid-dom-props
                />
                <span className="truncate font-medium">{row.timer?.name ?? "Deleted timer"}</span>
              </span>
              <span className="num shrink-0 text-muted-foreground">
                {formatDuration(row.total)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: accent }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
