import { createFileRoute, Link } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { TimerIcon } from "@/components/study/TimerIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { dateKey, formatClock } from "@/lib/study/format";
import { sumDuration } from "@/lib/study/stats";
import { useStudy } from "@/lib/study/store";
import { useGlobalShortcuts } from "@/lib/study/useShortcuts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { title: "Focus mode — Focus Studio" },
      {
        name: "description",
        content:
          "A calm, distraction-free study screen: one large timer, your subject, and nothing else.",
      },
      { property: "og:title", content: "Focus mode — Focus Studio" },
      {
        property: "og:description",
        content: "Distraction-free studying with one large, accurate timer.",
      },
    ],
  }),
  component: FocusPage,
});

function FocusPage() {
  useGlobalShortcuts();
  const { t, n, formatDur } = useI18n();
  const { timers, activeTimerId, elapsedOf, statusOf, startTimer, pauseTimer, resetTimer, allSessions, settings } =
    useStudy();
  const [resetOpen, setResetOpen] = useState(false);

  const candidates = timers.filter((t) => !t.archived);
  const timer =
    candidates.find((t) => t.id === activeTimerId) ??
    candidates.find((t) => statusOf(t.id) === "paused") ??
    candidates[0];

  const todayTotal = sumDuration(allSessions.filter((s) => s.date === dateKey(new Date())));

  if (!timer) {
    return (
      <FocusFrame>
        <p className="text-sm text-muted-foreground">{t("focus.noTimers")}</p>
        <Button asChild className="mt-4">
          <Link to="/timers">{t("focus.createTimer")}</Link>
        </Button>
      </FocusFrame>
    );
  }

  const running = statusOf(timer.id) === "running";
  const elapsed = elapsedOf(timer.id);

  return (
    <FocusFrame accent={timer.accentColor} active={running}>
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-9 place-items-center rounded-xl"
            style={{
              backgroundColor: `color-mix(in oklab, ${timer.accentColor} 16%, transparent)`,
              color: timer.accentColor,
            }}
          >
            <TimerIcon name={timer.icon} className="size-4" />
          </span>
          <div className="text-left">
            <p className="text-sm font-medium">{timer.name}</p>
            {timer.description ? (
              <p className="max-w-xs truncate text-xs text-muted-foreground">{timer.description}</p>
            ) : null}
          </div>
        </div>

        <p className="num text-[18vw] font-semibold leading-none tracking-tight sm:text-8xl md:text-[7rem]">
          {n(formatClock(elapsed))}
        </p>

        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {running ? (
            <span className="text-primary">● {t("status.running")}</span>
          ) : (
            t(`status.${statusOf(timer.id)}` as never)
          )}
        </p>

        <div className="flex items-center gap-3">
          {running ? (
            <Button size="lg" variant="secondary" onClick={() => pauseTimer(timer.id)}>
              <Pause className="size-4" /> {t("action.pause")}
            </Button>
          ) : (
            <Button size="lg" onClick={() => startTimer(timer.id)}>
              <Play className="size-4" /> {statusOf(timer.id) === "paused" ? t("action.resume") : t("action.start")}
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            disabled={elapsed === 0}
            onClick={() => (settings.confirmReset ? setResetOpen(true) : resetTimer(timer.id))}
          >
            <RotateCcw className="size-4" /> {t("action.reset")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("action.today")}{" "}
          <span className="num text-foreground">{formatDur(todayTotal)}</span>
        </p>

        {candidates.length > 1 ? (
          <div className="flex max-w-lg flex-wrap justify-center gap-2 pt-4">
            {candidates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => startTimer(t.id)}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
                  t.id === timer.id && "border-primary/50 text-primary",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`${t("action.reset")} «${timer.name}»؟`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("focus.resetBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => resetTimer(timer.id)}
            >
              {t("focus.resetAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FocusFrame>
  );
}

function FocusFrame({
  children,
  accent,
  active,
}: {
  children: React.ReactNode;
  accent?: string;
  active?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: active ? 1 : 0.35,
          background: `radial-gradient(50% 45% at 50% 40%, color-mix(in oklab, ${accent ?? "var(--primary)"} 14%, transparent), transparent 70%)`,
        }}
      />
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="absolute right-4 top-4 text-muted-foreground"
      >
        <Link to="/">
          <X className="size-4" /> {t("focus.exit")}
        </Link>
      </Button>
      <div className="relative">{children}</div>
    </div>
  );
}
