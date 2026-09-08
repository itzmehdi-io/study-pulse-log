import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/provider";
import { fromJalali, toJalali } from "@/lib/i18n/jalali";
import { formatDuration } from "@/lib/study/format";
import { useStudy } from "@/lib/study/store";
import type { StudySession } from "@/lib/study/types";

function pad(v: number) {
  return String(v).padStart(2, "0");
}

function toTimeInput(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Locale-appropriate date field value: Jalali y/m/d in fa, ISO in en. */
function toDateFields(ts: number, lang: "fa" | "en") {
  const d = new Date(ts);
  if (lang === "fa") {
    const { jy, jm, jd } = toJalali(d);
    return { y: jy, m: jm, d: jd };
  }
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

function fieldsToDate(
  fields: { y: number; m: number; d: number },
  lang: "fa" | "en",
): Date | null {
  try {
    const date =
      lang === "fa"
        ? fromJalali(fields.y, fields.m, fields.d)
        : new Date(fields.y, fields.m - 1, fields.d);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

export function SessionDialog({
  open,
  onOpenChange,
  session,
  defaultDateKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to log a brand-new session. */
  session?: StudySession | null;
  defaultDateKey?: string;
}) {
  const { t, n, lang } = useI18n();
  const { timers, updateSession, addSession } = useStudy();
  const active = timers.filter((x) => !x.archived);

  const [timerId, setTimerId] = useState("");
  const [fields, setFields] = useState(() => toDateFields(Date.now(), lang));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (session) {
      setTimerId(session.timerId);
      setFields(toDateFields(session.startedAt, lang));
      setStart(toTimeInput(session.startedAt));
      setEnd(toTimeInput(session.endedAt));
      return;
    }
    const base = defaultDateKey
      ? new Date(
          Number(defaultDateKey.slice(0, 4)),
          Number(defaultDateKey.slice(5, 7)) - 1,
          Number(defaultDateKey.slice(8, 10)),
        ).getTime()
      : Date.now();
    setTimerId(active[0]?.id ?? "");
    setFields(toDateFields(base, lang));
    setStart("09:00");
    setEnd("10:00");
  }, [open, session, lang, defaultDateKey]);

  const range = useMemo(() => {
    const day = fieldsToDate(fields, lang);
    if (!day) return null;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    if ([sh, sm, eh, em].some((v) => v === undefined || Number.isNaN(v))) return null;
    const startedAt = new Date(day);
    startedAt.setHours(sh!, sm!, 0, 0);
    const endedAt = new Date(day);
    endedAt.setHours(eh!, em!, 0, 0);
    // Times that read "backwards" mean the session ran past midnight.
    if (endedAt.getTime() <= startedAt.getTime()) endedAt.setDate(endedAt.getDate() + 1);
    return { startedAt: startedAt.getTime(), endedAt: endedAt.getTime() };
  }, [fields, start, end, lang]);

  const crossesMidnight =
    !!range && new Date(range.startedAt).getDate() !== new Date(range.endedAt - 1).getDate();

  const submit = () => {
    if (!timerId) {
      setError(t("empty.timers.title"));
      return;
    }
    if (!range || range.endedAt <= range.startedAt) {
      setError(t("session.invalid"));
      return;
    }
    if (session) {
      updateSession(session.id, { ...range, timerId });
      toast.success(t("session.saved"));
    } else {
      addSession({ timerId, ...range });
      toast.success(t("session.added"));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{session ? t("session.edit.title") : t("session.add.title")}</DialogTitle>
          <DialogDescription>{t("session.edit.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>{t("focus.subject")}</Label>
            <Select value={timerId} onValueChange={setTimerId}>
              <SelectTrigger>
                <SelectValue placeholder={t("label.allSubjects")} />
              </SelectTrigger>
              <SelectContent>
                {active.map((timer) => (
                  <SelectItem key={timer.id} value={timer.id}>
                    {timer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("label.date")}</Label>
            <div className="grid grid-cols-3 gap-2" dir="ltr">
              <Input
                aria-label="year"
                inputMode="numeric"
                value={fields.y}
                onChange={(e) => setFields((f) => ({ ...f, y: Number(e.target.value) || 0 }))}
              />
              <Input
                aria-label="month"
                inputMode="numeric"
                value={fields.m}
                onChange={(e) => setFields((f) => ({ ...f, m: Number(e.target.value) || 0 }))}
              />
              <Input
                aria-label="day"
                inputMode="numeric"
                value={fields.d}
                onChange={(e) => setFields((f) => ({ ...f, d: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="session-start">{t("label.startTime")}</Label>
              <Input
                id="session-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-end">{t("label.endTime")}</Label>
              <Input
                id="session-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-elevated/60 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{t("label.duration")}</span>
              <span className="num text-foreground">
                {range ? n(formatDuration(range.endedAt - range.startedAt, { showSeconds: true })) : "—"}
              </span>
            </div>
            {crossesMidnight ? (
              <p className="mt-2 text-warning">{t("session.crossMidnight")}</p>
            ) : null}
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("action.cancel")}
          </Button>
          <Button onClick={submit}>{t("action.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
