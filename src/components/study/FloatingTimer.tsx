import { useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";
import { useState } from "react";

import { TimerIcon } from "@/components/study/TimerIcon";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { formatClock, formatDuration } from "@/lib/study/format";
import { sessionsOnDay, sumDuration } from "@/lib/study/stats";
import { dateKey } from "@/lib/study/format";
import { useStudy } from "@/lib/study/store";
import { cn } from "@/lib/utils";

/**
 * Persistent mini-player for whichever timer is running or paused with time on
 * the clock. Rendered once at the app root so it survives navigation.
 */
export function FloatingTimer() {
  const { t, n, dir } = useI18n();
  const { timers, runStates, elapsedOf, statusOf, startTimer, pauseTimer, resetTimer, allSessions } =
    useStudy();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [minimized, setMinimized] = useState(false);

  if (pathname.startsWith("/focus")) return null;

  const candidate = Object.values(runStates)
    .filter((r) => r.startedAt !== null || r.accumulatedMs > 0)
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
  const timer = candidate ? timers.find((x) => x.id === candidate.timerId) : undefined;
  if (!timer) return null;

  const status = statusOf(timer.id);
  const running = status === "running";
  const elapsed = elapsedOf(timer.id);
  const todayTotal = sumDuration(
    sessionsOnDay(allSessions, dateKey(new Date())).filter((s) => s.timerId === timer.id),
  );

  const side = dir === "rtl" ? "left-4 md:left-8" : "right-4 md:right-8";

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label={t("action.expand")}
        className={cn(
          "animate-float-in fixed bottom-20 z-50 flex items-center gap-2 rounded-full border border-border-strong bg-surface/95 px-3 py-2 shadow-float backdrop-blur-xl md:bottom-8",
          side,
        )}
      >
        <span
          className={cn("size-2 rounded-full", running ? "animate-breathe" : "opacity-50")}
          style={{ backgroundColor: timer.accentColor }}
        />
        <span className="num text-sm text-foreground">{n(formatClock(elapsed))}</span>
        <ChevronUp className="size-3.5 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "animate-float-in fixed bottom-20 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border-strong bg-surface/95 shadow-float backdrop-blur-xl md:bottom-8",
        side,
      )}
      role="region"
      aria-label={t("app.name")}
    >
      <div
        className="h-0.5 w-full opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent, ${timer.accentColor}, transparent)`,
        }}
      />
      <div className="flex items-center gap-3 p-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{
            backgroundColor: `color-mix(in oklab, ${timer.accentColor} 18%, transparent)`,
            color: timer.accentColor,
          }}
        >
          <TimerIcon name={timer.icon} className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{timer.name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="num text-lg leading-none text-foreground">
              {n(formatClock(elapsed))}
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                running ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {running ? t("label.running") : t("label.paused")}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => resetTimer(timer.id)}
            aria-label={t("action.reset")}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            size="icon"
            className="size-9 rounded-full"
            onClick={() => (running ? pauseTimer(timer.id) : startTimer(timer.id))}
            aria-label={running ? t("action.pause") : t("action.resume")}
          >
            {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setMinimized(true)}
            aria-label={t("action.minimize")}
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>{t("label.today")}</span>
        <span className="num">{n(formatDuration(todayTotal))}</span>
      </div>
    </div>
  );
}
