import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Flame, Plus, Timer as TimerIco } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BreakdownBars } from "@/components/study/BreakdownBars";
import { GoalRing } from "@/components/study/GoalRing";
import { TimerCard } from "@/components/study/TimerCard";
import { TimerDialog } from "@/components/study/TimerDialog";
import { TodayDrawer } from "@/components/study/TodayDrawer";
import { WeekChart } from "@/components/study/WeekChart";
import { Button } from "@/components/ui/button";
import { addDays, dateKey, formatDuration, goalLabel, startOfWeek } from "@/lib/study/format";
import { byTimer, currentStreak, dailyTotals, sessionsOnDay, sumDuration } from "@/lib/study/stats";
import { useStudy } from "@/lib/study/store";
import { NEW_TIMER_EVENT, useGlobalShortcuts } from "@/lib/study/useShortcuts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Focus Studio study timer" },
      {
        name: "description",
        content:
          "Track study sessions with accurate multi-subject timers, daily goals, streaks and a calm focus mode.",
      },
      { property: "og:title", content: "Focus Studio — study timer & progress tracker" },
      {
        property: "og:description",
        content: "Accurate study timers, daily goals, streaks and beautiful study history.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  useGlobalShortcuts();
  const store = useStudy();
  const { timers, allSessions, settings, createTimer, activeTimerId } = store;
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setCreateOpen(true);
    window.addEventListener(NEW_TIMER_EVENT, handler);
    return () => window.removeEventListener(NEW_TIMER_EVENT, handler);
  }, []);

  const todayKey = dateKey(new Date());
  const yesterdayKey = dateKey(addDays(new Date(), -1));
  const visibleTimers = timers.filter((t) => !t.archived);

  const todaySessions = useMemo(() => sessionsOnDay(allSessions, todayKey), [allSessions, todayKey]);
  const todayTotal = sumDuration(todaySessions);
  const yesterdayTotal = sumDuration(allSessions.filter((s) => s.date === yesterdayKey));
  const diff = todayTotal - yesterdayTotal;
  const goalMs = settings.dailyGoalMinutes * 60_000;
  const progress = goalMs ? todayTotal / goalMs : 0;
  const streak = currentStreak(allSessions, settings.streakMinimumMinutes);
  const breakdown = byTimer(todaySessions, timers);

  const weekStart = startOfWeek(new Date());
  const week = dailyTotals(allSessions, weekStart, 7).map((d) => ({
    ...d,
    label: d.date.toLocaleDateString(undefined, { weekday: "short" }),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="panel lamp-glow relative overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Today
            </p>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="group mt-2 flex items-baseline gap-3 text-left"
            >
              <span className="num text-5xl font-semibold tracking-tight md:text-6xl">
                {formatDuration(todayTotal)}
              </span>
              <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-primary" />
            </button>
            <p className="mt-3 text-sm text-muted-foreground">
              {yesterdayTotal > 0 ? (
                <>
                  <span className={diff >= 0 ? "text-success" : "text-destructive"}>
                    {diff >= 0 ? "+" : "−"}
                    {formatDuration(Math.abs(diff))}
                  </span>{" "}
                  compared to yesterday
                </>
              ) : (
                "Your first sessions today set the baseline."
              )}
            </p>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              <Stat label="Sessions" value={String(todaySessions.length)} />
              <Stat label="Active timers" value={String(visibleTimers.length)} />
              <Stat
                label="Streak"
                value={
                  <span className="flex items-center gap-1.5">
                    <Flame className={streak ? "size-4 text-primary" : "size-4 text-muted-foreground"} />
                    {streak} day{streak === 1 ? "" : "s"}
                  </span>
                }
              />
            </dl>
          </div>

          <GoalRing progress={progress} className="self-center">
            <span className="num text-2xl font-semibold">{Math.round(progress * 100)}%</span>
            <span className="mt-1 text-[11px] text-muted-foreground">
              of {goalLabel(settings.dailyGoalMinutes)}
            </span>
            {progress >= 1 ? (
              <span className="mt-1 text-[10px] uppercase tracking-widest text-success">
                Goal reached
              </span>
            ) : null}
          </GoalRing>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Timers</h2>
            <p className="text-sm text-muted-foreground">
              {activeTimerId ? "One timer runs at a time — switching keeps every second." : "Press N to add a timer, Space to pause."}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Add timer
          </Button>
        </div>

        {visibleTimers.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTimers.map((timer) => (
              <TimerCard key={timer.id} timer={timer} />
            ))}
          </div>
        ) : (
          <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
              <TimerIco className="size-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Start tracking your study</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Create your first timer and begin building your study history.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Create timer
            </Button>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Today's breakdown</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              View sessions
            </button>
          </div>
          <BreakdownBars rows={breakdown} />
        </div>

        <div className="panel space-y-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">This week</h2>
            <Link to="/statistics" className="text-xs text-muted-foreground hover:text-primary">
              Statistics
            </Link>
          </div>
          <WeekChart data={week} goalMs={goalMs} />
        </div>
      </section>

      <TimerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(draft) => {
          createTimer(draft);
          toast.success(`“${draft.name}” is ready`);
        }}
      />
      <TodayDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        sessions={todaySessions}
        timers={timers}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
