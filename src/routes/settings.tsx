import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n/provider";
import { sumDuration } from "@/lib/study/stats";
import { useStudy } from "@/lib/study/store";
import type { ThemeMode } from "@/lib/study/types";
import { cn } from "@/lib/utils";

const GOALS = [60, 120, 240, 360, 480];
const THEMES: { key: ThemeMode; labelKey: string }[] = [
  { key: "dark", labelKey: "set.dark" },
  { key: "light", labelKey: "set.light" },
  { key: "system", labelKey: "set.system" },
];

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Focus Studio" },
      {
        name: "description",
        content:
          "Set your daily study goal, streak threshold, timer confirmations, appearance and export your data.",
      },
      { property: "og:title", content: "Settings — Focus Studio" },
      {
        property: "og:description",
        content: "Tune goals, confirmations, appearance and data export for your study tracker.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings, sessions, timers, replaceAll, clearAll } = useStudy();
  const { t, n, lang, setLang, formatDur } = useI18n();
  const [clearOpen, setClearOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = (format: "json" | "csv") => {
    let content: string;
    let type: string;
    if (format === "json") {
      content = JSON.stringify({ timers, sessions, settings }, null, 2);
      type = "application/json";
    } else {
      const rows = [
        "timer,date,started_at,ended_at,duration_minutes",
        ...sessions.map((s) => {
          const name = timers.find((t) => t.id === s.timerId)?.name ?? t("set.deletedTimer");
          return [
            `"${name.replace(/"/g, '""')}"`,
            s.date,
            new Date(s.startedAt).toISOString(),
            new Date(s.endedAt).toISOString(),
            (s.duration / 60000).toFixed(2),
          ].join(",");
        }),
      ];
      content = rows.join("\n");
      type = "text/csv";
    }
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `focus-studio-history.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      t("set.exported").replace("{n}", n(sessions.length)).replace("{f}", format.toUpperCase()),
    );
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.timers) || !Array.isArray(parsed.sessions)) {
        throw new Error("bad shape");
      }
      replaceAll(parsed);
      toast.success(t("set.imported"));
    } catch {
      toast.error(t("set.importError"));
    }
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error(t("set.noNotif"));
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      updateSettings({ notifications: true });
      toast.success(t("set.notifOn"));
    } else {
      updateSettings({ notifications: false });
      toast.error(t("set.notifDenied"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("nav.settings")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("set.subtitle")}
        </p>
      </header>

      <Section title={t("set.study")}>
        <Row label={t("set.dailyGoal")} description={t("set.dailyGoalDesc")}>
          <div className="flex flex-wrap items-center gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => updateSettings({ dailyGoalMinutes: g })}
                className={cn(
                  "rounded-lg border border-border px-3 py-1.5 text-sm transition-colors",
                  settings.dailyGoalMinutes === g
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n(g / 60)}
              </button>
            ))}
            <Input
              type="number"
              min={15}
              className="w-24"
              value={settings.dailyGoalMinutes}
              onChange={(e) =>
                updateSettings({ dailyGoalMinutes: Math.max(15, Number(e.target.value) || 15) })
              }
            />
            <span className="text-xs text-muted-foreground">{t("set.minutes")}</span>
          </div>
        </Row>
        <Row
          label={t("set.streakMin")}
          description={t("set.streakMinDesc")}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={5}
              className="w-24"
              value={settings.streakMinimumMinutes}
              onChange={(e) =>
                updateSettings({ streakMinimumMinutes: Math.max(5, Number(e.target.value) || 5) })
              }
            />
            <span className="text-xs text-muted-foreground">{t("set.perDay")}</span>
          </div>
        </Row>
      </Section>

      <Section title={t("set.appearance")}>
        <Row label={t("label.language")} description="فارسی / English">
          <div className="flex gap-2">
            {(["fa", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-lg border border-border px-3 py-1.5 text-sm transition-colors",
                  lang === l
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l === "fa" ? "فارسی" : "English"}
              </button>
            ))}
          </div>
        </Row>
        <Row label={t("label.theme")} description={t("set.themeDesc")}>
          <div className="flex gap-2">
            {THEMES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => updateSettings({ theme: item.key })}
                className={cn(
                  "rounded-lg border border-border px-3 py-1.5 text-sm transition-colors",
                  settings.theme === item.key
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(item.labelKey as never)}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title={t("set.timer")}>
        <Toggle
          label={t("set.confirmReset")}
          description={t("set.confirmResetDesc")}
          checked={settings.confirmReset}
          onChange={(v) => updateSettings({ confirmReset: v })}
        />
        <Toggle
          label={t("set.confirmDelete")}
          description={t("set.confirmDeleteDesc")}
          checked={settings.confirmDelete}
          onChange={(v) => updateSettings({ confirmDelete: v })}
        />
        <Toggle
          label={t("set.autoPause")}
          description={t("set.autoPauseDesc")}
          checked={settings.autoPauseOthers}
          onChange={(v) => updateSettings({ autoPauseOthers: v })}
        />
        <Toggle
          label={t("set.notifications")}
          description={t("set.notificationsDesc")}
          checked={settings.notifications}
          onChange={(v) => (v ? requestNotifications() : updateSettings({ notifications: false }))}
        />
      </Section>

      <Section title={t("set.shortcuts")}>
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>
            <Kbd>Space</Kbd> {t("set.scSpace")}
          </li>
          <li>
            <Kbd>N</Kbd> {t("set.scN")}
          </li>
          <li>
            <Kbd>R</Kbd> {t("set.scR")}
          </li>
          <li>
            <Kbd>Esc</Kbd> {t("set.scEsc")}
          </li>
        </ul>
      </Section>

      <Section title={t("set.data")}>
        <Row
          label={t("set.export")}
          description={`${n(sessions.length)} ${t("label.sessions")} · ${formatDur(sumDuration(sessions))} ${t("set.recorded")}`}
        >
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportData("json")}>
              {t("set.exportJson")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData("csv")}>
              {t("set.exportCsv")}
            </Button>
          </div>
        </Row>
        <Row label={t("set.import")} description={t("set.importDesc")}>
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importData(file);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {t("set.importJson")}
            </Button>
          </>
        </Row>
        <Row label={t("set.clear")} description={t("set.clearDesc")}>
          <Button variant="destructive" size="sm" onClick={() => setClearOpen(true)}>
            {t("set.clear")}
          </Button>
        </Row>
      </Section>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("set.clearTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("set.clearBody")
                .replace("{t}", n(timers.length))
                .replace("{s}", n(sessions.length))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                clearAll();
                toast.success(t("set.cleared"));
              }}
            >
              {t("set.deleteEverything")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel divide-y divide-border">
      <h2 className="px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Row label={label} description={description}>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Row>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="num rounded border border-border bg-elevated px-1.5 py-0.5 text-xs text-foreground">
      {children}
    </kbd>
  );
}
