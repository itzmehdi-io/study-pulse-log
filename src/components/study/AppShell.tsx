import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  Focus,
  LayoutDashboard,
  Pause,
  Play,
  Settings,
  Timer as TimerIco,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/study/format";
import { useStudy } from "@/lib/study/store";
import { cn } from "@/lib/utils";

const NAV = [
  { group: "Focus", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/timers", label: "Timers", icon: TimerIco },
    { to: "/focus", label: "Focus mode", icon: Focus },
  ] },
  { group: "Progress", items: [
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/statistics", label: "Statistics", icon: BarChart3 },
  ] },
  { group: "Manage", items: [{ to: "/settings", label: "Settings", icon: Settings }] },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/timers", label: "Timers", icon: TimerIco },
  { to: "/focus", label: "Focus", icon: Focus },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/statistics", label: "Stats", icon: BarChart3 },
] as const;

function useThemeSync() {
  const { settings, hydrated } = useStudy();
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const apply = (mode: "dark" | "light") => {
      root.classList.toggle("light", mode === "light");
      root.classList.toggle("dark", mode === "dark");
    };
    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => apply(mq.matches ? "light" : "dark");
      handler();
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    apply(settings.theme);
  }, [settings.theme, hydrated]);
}

export function ActiveTimerPill({ compact = false }: { compact?: boolean }) {
  const { activeTimerId, timers, elapsedOf, pauseTimer } = useStudy();
  const timer = timers.find((t) => t.id === activeTimerId);
  if (!timer) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5">
      <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
      {!compact ? (
        <span className="max-w-28 truncate text-xs font-medium text-foreground">{timer.name}</span>
      ) : null}
      <span className="num text-sm text-primary">{formatClock(elapsedOf(timer.id))}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 text-primary hover:bg-primary/15"
        onClick={() => pauseTimer(timer.id)}
        aria-label="Pause active timer"
      >
        <Pause className="size-3.5" />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  useThemeSync();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const { activeTimerId, timers, startTimer } = useStudy();

  if (pathname.startsWith("/focus")) return <>{children}</>;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const resumeCandidate = timers.find((t) => !t.archived);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:flex",
          collapsed ? "w-[74px]" : "w-60",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Focus className="size-4" />
          </span>
          {!collapsed ? (
            <span className="text-sm font-semibold tracking-tight">Focus Studio</span>
          ) : null}
        </div>

        <nav className="flex-1 space-y-6 px-3 py-4">
          {NAV.map((section) => (
            <div key={section.group} className="space-y-1">
              {!collapsed ? (
                <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                  {section.group}
                </p>
              ) : null}
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    isActive(item.to)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn("size-4 shrink-0", isActive(item.to) && "text-primary")}
                  />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setCollapsed((c) => !c)}
          >
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed ? "Collapse" : null}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Focus className="size-4" />
            </span>
            <span className="text-sm font-semibold">Focus Studio</span>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="flex items-center gap-2">
            {activeTimerId ? (
              <ActiveTimerPill />
            ) : resumeCandidate ? (
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={() => startTimer(resumeCandidate.id)}
              >
                <Play className="size-3.5" /> Start {resumeCandidate.name}
              </Button>
            ) : null}
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link to="/focus">Focus mode</Link>
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/95 px-2 py-2 backdrop-blur-xl md:hidden">
          {MOBILE_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px]",
                isActive(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
