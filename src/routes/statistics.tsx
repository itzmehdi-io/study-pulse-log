import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { BreakdownBars } from "@/components/study/BreakdownBars";
import { Heatmap } from "@/components/study/Heatmap";
import { WeekChart } from "@/components/study/WeekChart";
import { Button } from "@/components/ui/button";
import {
  addDays,
  dateKey,
  formatDayShort,
  formatDuration,
  startOfLocalDay,
  startOfWeek,
} from "@/lib/study/format";
import { byTimer, dailyTotals, goalCompletionRate, sessionsBetween } from "@/lib/study/stats";
import { useStudy } from "@/lib/study/store";
import { cn } from "@/lib/utils";

type RangeKey = "week" | "lastWeek" | "month" | "quarter";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "lastWeek", label: "Last week" },
  { key: "month", label: "This month" },
  { key: "quarter", label: "Last 90 days" },
];

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Study statistics & trends — Focus Studio" },
      {
        name: "description",
        content:
          "Weekly bars, subject distribution, monthly trend line and a study heatmap derived from every session.",
      },
      { property: "og:title", content: "Study statistics — Focus Studio" },
      {
        property: "og:description",
        content: "Understand your study patterns with weekly, monthly and per-subject analytics.",
      },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const { allSessions, timers, settings } = useStudy();
  const [range, setRange] = useState<RangeKey>("week");
  const goalMs = settings.dailyGoalMinutes * 60_000;

  const today = startOfLocalDay(new Date());
  let start = startOfWeek(new Date());
  let days = 7;
  if (range === "lastWeek") {
    start = addDays(startOfWeek(new Date()), -7);
    days = 7;
  } else if (range === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  } else if (range === "quarter") {
    start = addDays(today, -89);
    days = 90;
  }

  const totals = dailyTotals(allSessions, start, days).map((d) => ({
    ...d,
    label: days <= 7 ? d.date.toLocaleDateString(undefined, { weekday: "short" }) : formatDayShort(d.key),
  }));
  const rangeSessions = sessionsBetween(allSessions, start, addDays(start, days - 1));
  const total = totals.reduce((a, d) => a + d.total, 0);
  const best = totals.reduce((a, b) => (b.total > a.total ? b : a), totals[0]!);
  const longest = rangeSessions.reduce((a, s) => Math.max(a, s.duration), 0);
  const activeDays = totals.filter((d) => d.total > 0).length;
  const distribution = byTimer(rangeSessions, timers);

  const heatStart = addDays(today, -83);
  const heatDays = dailyTotals(allSessions, heatStart, 84);

  const hasData = total > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything derived from your recorded sessions.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={range === r.key ? "secondary" : "ghost"}
              className={cn("text-xs", range === r.key && "text-foreground")}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Total studied" value={formatDuration(total)} />
        <Card label="Average per day" value={formatDuration(total / days)} />
        <Card
          label="Best day"
          value={best?.total ? `${formatDayShort(best.key)} · ${formatDuration(best.total)}` : "—"}
        />
        <Card label="Longest session" value={longest ? formatDuration(longest) : "—"} />
        <Card label="Sessions" value={String(rangeSessions.length)} />
        <Card
          label="Goal completion"
          value={`${goalCompletionRate(totals, settings.dailyGoalMinutes)}% of ${activeDays || 0} active days`}
        />
      </div>

      <section className="panel space-y-5 p-6">
        <h2 className="text-base font-semibold tracking-tight">Study per day</h2>
        <WeekChart data={totals.slice(-14)} goalMs={goalMs} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel space-y-5 p-6">
          <h2 className="text-base font-semibold tracking-tight">Subject distribution</h2>
          <BreakdownBars
            rows={distribution}
            emptyLabel="No sessions in this range — pick a wider range or start a timer."
          />
        </section>

        <section className="panel space-y-5 p-6">
          <h2 className="text-base font-semibold tracking-tight">Trend</h2>
          {hasData ? (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={totals} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${Math.round(v / 3_600_000)}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatDuration(value), "Studied"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Your progress starts here. Complete a study session to see trends.
            </div>
          )}
        </section>
      </div>

      <section className="panel space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Last 12 weeks</h2>
          <span className="text-xs text-muted-foreground">
            Since {formatDayShort(dateKey(heatStart))}
          </span>
        </div>
        <Heatmap days={heatDays} goalMs={goalMs} />
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="num mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
