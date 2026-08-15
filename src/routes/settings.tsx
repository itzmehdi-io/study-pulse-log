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
import { formatDuration } from "@/lib/study/format";
import { sumDuration } from "@/lib/study/stats";
import { useStudy } from "@/lib/study/store";
import type { ThemeMode } from "@/lib/study/types";
import { cn } from "@/lib/utils";

const GOALS = [60, 120, 240, 360, 480];
const THEMES: { key: ThemeMode; label: string }[] = [
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
  { key: "system", label: "System" },
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
          const name = timers.find((t) => t.id === s.timerId)?.name ?? "Deleted timer";
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
    toast.success(`Exported ${sessions.length} sessions as ${format.toUpperCase()}`);
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.timers) || !Array.isArray(parsed.sessions)) {
        throw new Error("bad shape");
      }
      replaceAll(parsed);
      toast.success("Study data imported");
    } catch {
      toast.error("That file doesn't look like a Focus Studio export");
    }
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser doesn't support notifications");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      updateSettings({ notifications: true });
      toast.success("Notifications enabled");
    } else {
      updateSettings({ notifications: false });
      toast.error("Permission denied");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your data lives in this browser and never leaves it unless you export it.
        </p>
      </header>

      <Section title="Study">
        <Row label="Daily goal" description="Shown as the goal ring on your dashboard.">
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
                {g / 60}h
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
            <span className="text-xs text-muted-foreground">minutes</span>
          </div>
        </Row>
        <Row
          label="Streak minimum"
          description="Minimum study time for a day to count toward your streak."
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
            <span className="text-xs text-muted-foreground">minutes / day</span>
          </div>
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme" description="Dark is the native mode for late-night sessions.">
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => updateSettings({ theme: t.key })}
                className={cn(
                  "rounded-lg border border-border px-3 py-1.5 text-sm transition-colors",
                  settings.theme === t.key
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Timer">
        <Toggle
          label="Confirm before reset"
          description="Ask before clearing the current session."
          checked={settings.confirmReset}
          onChange={(v) => updateSettings({ confirmReset: v })}
        />
        <Toggle
          label="Confirm before deleting"
          description="Ask before removing a timer."
          checked={settings.confirmDelete}
          onChange={(v) => updateSettings({ confirmDelete: v })}
        />
        <Toggle
          label="Pause others automatically"
          description="Starting a timer offers to pause the running one instead of blocking it."
          checked={settings.autoPauseOthers}
          onChange={(v) => updateSettings({ autoPauseOthers: v })}
        />
        <Toggle
          label="Browser notifications"
          description="Optional goal notifications. Off until you grant permission."
          checked={settings.notifications}
          onChange={(v) => (v ? requestNotifications() : updateSettings({ notifications: false }))}
        />
      </Section>

      <Section title="Keyboard shortcuts">
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>
            <Kbd>Space</Kbd> pause / resume
          </li>
          <li>
            <Kbd>N</Kbd> new timer
          </li>
          <li>
            <Kbd>R</Kbd> reset active timer
          </li>
          <li>
            <Kbd>Esc</Kbd> close dialogs
          </li>
        </ul>
      </Section>

      <Section title="Data">
        <Row
          label="Export"
          description={`${sessions.length} sessions · ${formatDuration(sumDuration(sessions))} recorded.`}
        >
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportData("json")}>
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData("csv")}>
              Export CSV
            </Button>
          </div>
        </Row>
        <Row label="Import" description="Restore from a previous JSON export.">
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
              Import JSON
            </Button>
          </>
        </Row>
        <Row label="Clear all data" description="Removes every timer and session permanently.">
          <Button variant="destructive" size="sm" onClick={() => setClearOpen(true)}>
            Clear all data
          </Button>
        </Row>
      </Section>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all study data?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes {timers.length} timers and {sessions.length} recorded sessions. Export
              first if you want a copy — this cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                clearAll();
                toast.success("All data cleared");
              }}
            >
              Delete everything
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
