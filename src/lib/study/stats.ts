import { addDays, dateKey, startOfLocalDay, startOfWeek } from "./format";
import type { StudySession, Timer, TimerType } from "./types";

/** Splits a raw study period into per-local-day sessions (handles midnight crossing). */
export function splitByLocalDay(
  timerId: string,
  startedAt: number,
  endedAt: number,
  meta?: { type?: TimerType; manual?: boolean; idSeed?: string },
): StudySession[] {
  const out: StudySession[] = [];
  let cursor = startedAt;
  let i = 0;
  while (cursor < endedAt) {
    const dayEnd = addDays(startOfLocalDay(cursor), 1).getTime();
    const segmentEnd = Math.min(dayEnd, endedAt);
    const duration = segmentEnd - cursor;
    if (duration > 0) {
      out.push({
        id: `${meta?.idSeed ?? startedAt}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        timerId,
        startedAt: cursor,
        endedAt: segmentEnd,
        duration,
        date: dateKey(cursor),
        ...(meta?.type ? { type: meta.type } : {}),
        ...(meta?.manual ? { manual: true } : {}),
      });
    }
    cursor = segmentEnd;
    i += 1;
  }
  return out;
}


export function sumDuration(sessions: StudySession[]): number {
  return sessions.reduce((acc, s) => acc + s.duration, 0);
}

export function sessionsOnDay(sessions: StudySession[], key: string): StudySession[] {
  return sessions.filter((s) => s.date === key).sort((a, b) => a.startedAt - b.startedAt);
}

export function sessionsBetween(sessions: StudySession[], from: Date, to: Date): StudySession[] {
  const fromKey = dateKey(from);
  const toKey = dateKey(to);
  return sessions.filter((s) => s.date >= fromKey && s.date <= toKey);
}

export function dailyTotals(sessions: StudySession[], from: Date, days: number) {
  const start = startOfLocalDay(from);
  const result: { key: string; date: Date; total: number }[] = [];
  const map = new Map<string, number>();
  for (const s of sessions) map.set(s.date, (map.get(s.date) ?? 0) + s.duration);
  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    const key = dateKey(date);
    result.push({ key, date, total: map.get(key) ?? 0 });
  }
  return result;
}

export function byTimer(sessions: StudySession[], timers: Timer[]) {
  const map = new Map<string, number>();
  for (const s of sessions) map.set(s.timerId, (map.get(s.timerId) ?? 0) + s.duration);
  return [...map.entries()]
    .map(([timerId, total]) => ({
      timerId,
      total,
      timer: timers.find((t) => t.id === timerId),
    }))
    .sort((a, b) => b.total - a.total);
}

export function currentStreak(sessions: StudySession[], minimumMinutes: number): number {
  const threshold = minimumMinutes * 60_000;
  const map = new Map<string, number>();
  for (const s of sessions) map.set(s.date, (map.get(s.date) ?? 0) + s.duration);
  let streak = 0;
  let cursor = startOfLocalDay(new Date());
  // Today only breaks the streak if yesterday also missed.
  if ((map.get(dateKey(cursor)) ?? 0) < threshold) cursor = addDays(cursor, -1);
  while ((map.get(dateKey(cursor)) ?? 0) >= threshold) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function periodStats(sessions: StudySession[], dayCount: number, from: Date) {
  const totals = dailyTotals(sessions, from, dayCount);
  const total = totals.reduce((a, b) => a + b.total, 0);
  const activeDays = totals.filter((d) => d.total > 0).length;
  const best = totals.reduce((a, b) => (b.total > a.total ? b : a), totals[0]!);
  const longest = sessions.reduce((a, s) => Math.max(a, s.duration), 0);
  return {
    totals,
    total,
    activeDays,
    best,
    longest,
    average: dayCount ? total / dayCount : 0,
    sessionCount: sessions.length,
  };
}

export function goalCompletionRate(
  totals: { total: number }[],
  dailyGoalMinutes: number,
): number {
  if (!totals.length) return 0;
  const goal = dailyGoalMinutes * 60_000;
  const met = totals.filter((t) => t.total >= goal).length;
  return Math.round((met / totals.length) * 100);
}

export function thisWeekRange(offsetWeeks = 0) {
  const start = addDays(startOfWeek(new Date()), offsetWeeks * 7);
  return { start, end: addDays(start, 6) };
}
