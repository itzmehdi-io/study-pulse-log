import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { BreakdownBars } from "@/components/study/BreakdownBars";
import { Heatmap } from "@/components/study/Heatmap";
import { TodayDrawer } from "@/components/study/TodayDrawer";
import { WeekChart } from "@/components/study/WeekChart";
import { Button } from "@/components/ui/button";
import {
  addDays,
  dateKey,
  formatDayLong,
  formatDuration,
  formatTimeOfDay,
  goalLabel,
  startOfWeek,
} from "@/lib/study/format";
import { byTimer, dailyTotals, goalCompletionRate, sessionsOnDay, sumDuration } from "@/lib/study/stats";
import { useStudy } from "@/lib/study/store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Study calendar & history — Focus Studio" },
      {
        name: "description",
        content:
          "Browse a study heatmap by month, open any day for its sessions, and review weekly totals.",
      },
      { property: "og:title", content: "Study calendar — Focus Studio" },
      {
        property: "og:description",
        content: "A month-by-month heatmap of your study time with detailed daily views.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { allSessions, timers, settings } = useStudy();
  const [monthOffset, setMonthOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string>(dateKey(new Date()));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const goalMs = settings.dailyGoalMinutes * 60_000;
  const base = new Date();
  const monthStart = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthDays = dailyTotals(allSessions, monthStart, daysInMonth);
  const monthTotal = monthDays.reduce((a, d) => a + d.total, 0);

  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const week = dailyTotals(allSessions, weekStart, 7).map((d) => ({
    ...d,
    label: d.date.toLocaleDateString(undefined, { weekday: "short" }),
  }));
  const weekTotal = week.reduce((a, d) => a + d.total, 0);
  const bestDay = week.reduce((a, b) => (b.total > a.total ? b : a), week[0]!);

  const daySessions = useMemo(() => sessionsOnDay(allSessions, selected), [allSessions, selected]);
  const dayTotal = sumDuration(daySessions);
  const dayBreakdown = byTimer(daySessions, timers);
  const first = daySessions[0];
  const last = daySessions[daySessions.length - 1];
  const longest = daySessions.reduce((a, s) => Math.max(a, s.duration), 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every day you studied, at a glance. Click a day for its full session list.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="panel space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </h2>
              <p className="num mt-0.5 text-xs text-muted-foreground">
                {formatDuration(monthTotal)} total
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setMonthOffset((m) => m - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={monthOffset >= 0}
                onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <Heatmap days={monthDays} goalMs={goalMs} selected={selected} onSelect={setSelected} />
        </section>

        <section className="panel space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">{formatDayLong(selected)}</h2>
              <p className="num mt-1 text-3xl font-semibold">{formatDuration(dayTotal)}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
              Session timeline
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Mini label="Sessions" value={String(daySessions.length)} />
            <Mini label="Longest" value={longest ? formatDuration(longest) : "—"} />
            <Mini label="First" value={first ? formatTimeOfDay(first.startedAt) : "—"} />
            <Mini label="Last" value={last ? formatTimeOfDay(last.endedAt) : "—"} />
          </div>

          <div>
            <p className="mb-3 text-xs text-muted-foreground">
              Goal {goalLabel(settings.dailyGoalMinutes)} ·{" "}
              {goalMs ? Math.round((dayTotal / goalMs) * 100) : 0}% complete
            </p>
            <BreakdownBars rows={dayBreakdown} emptyLabel="No sessions recorded on this day." />
          </div>
        </section>
      </div>

      <section className="panel space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              {weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : "Week of " + weekStart.toLocaleDateString()}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Total <span className="num text-foreground">{formatDuration(weekTotal)}</span> ·
              Average{" "}
              <span className="num text-foreground">{formatDuration(weekTotal / 7)}</span>/day ·
              Best day{" "}
              <span className="text-foreground">
                {bestDay.total ? `${bestDay.label} (${formatDuration(bestDay.total)})` : "—"}
              </span>{" "}
              · Goal met {goalCompletionRate(week, settings.dailyGoalMinutes)}% of days
            </p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={weekOffset >= 0}
              onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <WeekChart data={week} goalMs={goalMs} />
      </section>

      <TodayDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        sessions={daySessions}
        timers={timers}
        title={formatDayLong(selected)}
        subtitle="Chronological sessions for this day."
      />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="num mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
