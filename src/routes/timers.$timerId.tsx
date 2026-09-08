import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { TimerCard } from "@/components/study/TimerCard";
import { TimerIcon } from "@/components/study/TimerIcon";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { addDays, dateKey, keyToDate, startOfLocalDay, startOfWeek } from "@/lib/study/format";
import { dailyTotals, sumDuration } from "@/lib/study/stats";
import { useStudy } from "@/lib/study/store";
import { WeekChart } from "@/components/study/WeekChart";

export const Route = createFileRoute("/timers/$timerId")({
  head: () => ({
    meta: [
      { title: "Timer history — Focus Studio" },
      {
        name: "description",
        content: "Per-subject study history: totals for today, this week, this month and every day.",
      },
      { property: "og:title", content: "Timer history — Focus Studio" },
      {
        property: "og:description",
        content: "See how consistently you study each subject over time.",
      },
    ],
  }),
  component: TimerDetail,
});

function TimerDetail() {
  const { timerId } = Route.useParams();
  const { timers, allSessions, settings } = useStudy();
  const { t, n, formatDur, formatDate, weekdayShort, weekStartsOn } = useI18n();
  const timer = timers.find((t) => t.id === timerId);

  if (!timer) {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold">{t("td.notFound")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("td.notFoundBody")}
        </p>
        <Button asChild className="mt-5">
          <Link to="/timers">{t("td.back")}</Link>
        </Button>
      </div>
    );
  }

  const mine = allSessions.filter((s) => s.timerId === timer.id);
  const today = dateKey(new Date());
  const weekStart = startOfWeek(new Date(), weekStartsOn);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const totals = {
    lifetime: sumDuration(mine),
    today: sumDuration(mine.filter((s) => s.date === today)),
    week: sumDuration(mine.filter((s) => s.date >= dateKey(weekStart))),
    month: sumDuration(mine.filter((s) => s.date >= dateKey(monthStart))),
  };

  const longest = mine.reduce((a, s) => Math.max(a, s.duration), 0);
  const average = mine.length ? totals.lifetime / mine.length : 0;

  const week = dailyTotals(mine, weekStart, 7).map((d) => ({
    ...d,
    label: weekdayShort(d.date),
  }));

  const dayMap = new Map<string, number>();
  for (const s of mine) dayMap.set(s.date, (dayMap.get(s.date) ?? 0) + s.duration);
  const history = [...dayMap.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 30);
  const recentStart = addDays(startOfLocalDay(new Date()), -29);
  void recentStart;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <Link
        to="/timers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t("td.back")}
      </Link>

      <header className="flex items-start gap-4">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-2xl"
          style={{
            backgroundColor: `color-mix(in oklab, ${timer.accentColor} 16%, transparent)`,
            color: timer.accentColor,
          }}
        >
          <TimerIcon name={timer.icon} className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{timer.name}</h1>
          {timer.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{timer.description}</p>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label={t("label.total")} value={formatDur(totals.lifetime)} />
          <Metric label={t("action.today")} value={formatDur(totals.today)} />
          <Metric label={t("label.thisWeek")} value={formatDur(totals.week)} />
          <Metric label={t("stats.thisMonth")} value={formatDur(totals.month)} />
          <Metric label={t("label.sessions")} value={n(mine.length)} />
          <Metric label={t("td.avgSession")} value={average ? formatDur(average) : "—"} />
          <Metric label={t("label.longestSession")} value={longest ? formatDur(longest) : "—"} />
          <Metric label={t("td.created")} value={formatDate(new Date(timer.createdAt), "short")} />
        </div>
        <TimerCard timer={timer} />
      </div>

      <section className="panel space-y-5 p-6">
        <h2 className="text-base font-semibold tracking-tight">{t("label.thisWeek")}</h2>
        <WeekChart data={week} goalMs={settings.dailyGoalMinutes * 60_000} />
      </section>

      <section className="panel p-6">
        <h2 className="text-base font-semibold tracking-tight">{t("td.history")}</h2>
        {history.length ? (
          <ul className="mt-4 divide-y divide-border">
            {history.map(([key, total]) => (
              <li key={key} className="flex items-center justify-between py-3 text-sm">
                <span>{formatDate(keyToDate(key), "long")}</span>
                <span className="num text-muted-foreground">{formatDur(total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("td.historyEmpty")}
          </p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="num mt-1.5 text-xl font-semibold">{value}</p>
    </div>
  );
}
