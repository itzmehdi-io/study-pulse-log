import { TimerIcon } from "@/components/study/TimerIcon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/provider";
import { sumDuration } from "@/lib/study/stats";
import type { StudySession, Timer } from "@/lib/study/types";

export function TodayDrawer({
  open,
  onOpenChange,
  sessions,
  timers,
  title,
  subtitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: StudySession[];
  timers: Timer[];
  title?: string;
  subtitle?: string;
}) {
  const { t, n, formatDur, formatTime } = useI18n();
  const total = sumDuration(sessions);
  const ordered = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
  const longest = ordered.reduce((a, s) => Math.max(a, s.duration), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title ?? t("drawer.title")}</SheetTitle>
          <SheetDescription>{subtitle ?? t("drawer.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          <div className="panel p-5">
            <p className="num text-4xl font-semibold">{formatDur(total)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {n(ordered.length)} {t("label.sessions")} · {t("drawer.longest")}{" "}
              {longest ? formatDur(longest) : "—"}
            </p>
          </div>

          {ordered.length ? (
            <ol className="space-y-1">
              {ordered.map((session) => {
                const timer = timers.find((t) => t.id === session.timerId);
                return (
                  <li
                    key={session.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-elevated"
                  >
                    <span className="num w-12 shrink-0 text-xs text-muted-foreground">
                      {formatTime(session.startedAt)}
                    </span>
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${timer?.accentColor ?? "var(--primary)"} 16%, transparent)`,
                        color: timer?.accentColor ?? "var(--primary)",
                      }}
                    >
                      <TimerIcon name={timer?.icon ?? "Timer"} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {timer?.name ?? t("timer.deleted.name")}
                    </span>
                    <span className="num text-sm text-muted-foreground">
                      {formatDur(session.duration)}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("drawer.empty")}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
