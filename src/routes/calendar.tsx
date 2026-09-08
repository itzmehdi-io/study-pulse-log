import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { BreakdownBars } from "@/components/study/BreakdownBars";
import { Heatmap } from "@/components/study/Heatmap";
import { TodayDrawer } from "@/components/study/TodayDrawer";
import { WeekChart } from "@/components/study/WeekChart";
import { Button } from "@/components/ui/button";
import { fromJalali, jalaliMonthLength, toJalali } from "@/lib/i18n/jalali";
import { useI18n } from "@/lib/i18n/provider";
import { addDays, dateKey, keyToDate, startOfWeek } from "@/lib/study/format";
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
  const { t, n, lang, formatTime, formatDur, goalText, formatDate, weekdayShort, weekStartsOn } = useI18n();
  const [monthOffset, setMonthOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string>(dateKey(new Date()));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const goalMs = settings.dailyGoalMinutes * 60_000;
  const base = new Date();
  let monthStart: Date;
  let daysInMonth: number;
  if (lang === "fa") {
    const j = toJalali(base);
    const total = (j.jy * 12 + (j.jm - 1)) + monthOffset;
    const jy = Math.floor(total / 12);
    const jm = (total % 12) + 1;
    monthStart = fromJalali(jy, jm, 1);
    daysInMonth = jalaliMonthLength(jy, jm);
  } else {
    monthStart = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
    daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  }
  const monthDays = dailyTotals(allSessions, monthStart, daysInMonth);
  const monthTotal = monthDays.reduce((a, d) => a + d.total, 0);

  const weekStart = addDays(startOfWeek(new Date(), weekStartsOn), weekOffset * 7);
  const week = dailyTotals(allSessions, weekStart, 7).map((d) => ({
    ...d,
    label: weekdayShort(d.date),
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
        <h1 className="text-2xl font-semibold tracking-tight">{t("nav.calendar")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("cal.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="panel space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {formatDate(monthStart, "monthYear")}
              </h2>
              <p className="num mt-0.5 text-xs text-muted-foreground">
                {formatDur(monthTotal)} {t("cal.monthTotal")}
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
              <h2 className="text-base font-semibold tracking-tight">{formatDate(keyToDate(selected), "long")}</h2>
              <p className="num mt-1 text-3xl font-semibold">{formatDur(dayTotal)}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
              {t("cal.timeline")}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Mini label={t("label.sessions")} value={n(daySessions.length)} />
            <Mini label={t("label.longestSession")} value={longest ? formatDur(longest) : "—"} />
            <Mini label={t("cal.first")} value={first ? formatTime(first.startedAt) : "—"} />
            <Mini label={t("cal.last")} value={last ? formatTime(last.endedAt) : "—"} />
          </div>

          <div>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("cal.goal")} {goalText(settings.dailyGoalMinutes)} ·{" "}
              {n(goalMs ? Math.round((dayTotal / goalMs) * 100) : 0)}% {t("cal.complete")}
            </p>
            <BreakdownBars rows={dayBreakdown} emptyLabel={t("cal.emptyDay")} />
          </div>
        </section>
      </div>

      <section className="panel space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              {weekOffset === 0
                ? t("label.thisWeek")
                : weekOffset === -1
                  ? t("label.lastWeek")
                  : `${t("cal.weekOf")} ${formatDate(weekStart, "short")}`}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("label.total")}{" "}
              <span className="num text-foreground">{formatDur(weekTotal)}</span> ·{" "}
              {t("label.average")}{" "}
              <span className="num text-foreground">{formatDur(weekTotal / 7)}</span>{" "}
              {t("cal.perDay")} · {t("label.bestDay")}{" "}
              <span className="text-foreground">
                {bestDay.total ? `${bestDay.label} (${formatDur(bestDay.total)})` : "—"}
              </span>{" "}
              · {t("cal.goalMet")} {n(goalCompletionRate(week, settings.dailyGoalMinutes))}
              {t("cal.ofDays")}
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
        title={formatDate(keyToDate(selected), "long")}
        subtitle={t("cal.daySubtitle")}
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
