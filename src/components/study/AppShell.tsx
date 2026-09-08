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
import { useI18n } from "@/lib/i18n/provider";
import { formatClock } from "@/lib/study/format";
import { useStudy } from "@/lib/study/store";
import { cn } from "@/lib/utils";

const NAV = [
  { group: "nav.focusGroup", items: [
    { to: "/", label: "nav.dashboard", icon: LayoutDashboard },
    { to: "/timers", label: "nav.timers", icon: TimerIco },
    { to: "/focus", label: "nav.focus", icon: Focus },
  ] },
  { group: "nav.progressGroup", items: [
    { to: "/calendar", label: "nav.calendar", icon: CalendarDays },
    { to: "/statistics", label: "nav.statistics", icon: BarChart3 },
  ] },
  { group: "nav.manageGroup", items: [{ to: "/settings", label: "nav.settings", icon: Settings }] },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "nav.home", icon: LayoutDashboard },
  { to: "/timers", label: "nav.timers", icon: TimerIco },
  { to: "/focus", label: "nav.focus", icon: Focus },
  { to: "/calendar", label: "nav.calendar", icon: CalendarDays },
  { to: "/statistics", label: "nav.stats", icon: BarChart3 },
] as const;

function useThemeSync() {
  const { settings, hydrated } = useStudy();
  useEffect(() => {
    if (!hydrated) return undefined;
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
    return undefined;
  }, [settings.theme, hydrated]);
}

export function ActiveTimerPill({ compact = false }: { compact?: boolean }) {
  const { activeTimerId, timers, elapsedOf, pauseTimer } = useStudy();
  const { t } = useI18n();
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
        aria-label={t("action.pause")}
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
  const { t, lang, setLang, formatDate } = useI18n();

  if (pathname.startsWith("/focus")) return <>{children}</>;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const resumeCandidate = timers.find((t) => !t.archived);

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Ambient cinematic backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient animate-drift absolute inset-[-20%]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,transparent,var(--color-background)_78%)]" />
      </div>

      <aside
        className={cn(
          "sticky top-0 z-20 hidden h-screen shrink-0 flex-col border-e border-sidebar-border bg-sidebar/70 backdrop-blur-2xl transition-[width] duration-300 md:flex",
          collapsed ? "w-[74px]" : "w-60",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <Focus className="size-4" />
          </span>
          {!collapsed ? (
            <span className="text-sm font-semibold tracking-tight">{t("app.name")}</span>
          ) : null}
        </div>

        <nav className="flex-1 space-y-6 px-3 py-4">
          {NAV.map((section) => (
            <div key={section.group} className="space-y-1">
              {!collapsed ? (
                <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                  {t(section.group)}
                </p>
              ) : null}
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  title={t(item.label)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all duration-300",
                    isActive(item.to)
                      ? "bg-sidebar-accent/80 text-sidebar-accent-foreground shadow-[inset_0_1px_0_0_var(--glass-border)]"
                      : "text-muted-foreground hover:bg-sidebar-accent/45 hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-primary transition-all duration-300",
                      isActive(item.to)
                        ? "opacity-100 shadow-[0_0_12px_2px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]"
                        : "opacity-0",
                    )}
                  />
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-300 group-hover:scale-110",
                      isActive(item.to) && "text-primary",
                    )}
                  />
                  {!collapsed ? <span className="truncate">{t(item.label)}</span> : null}
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
            <ChevronLeft
              className={cn(
                "size-4 transition-transform duration-300",
                (collapsed ? lang !== "fa" : lang === "fa") && "rotate-180",
              )}
            />
            {!collapsed ? t("nav.collapse") : null}
          </Button>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-glass-border bg-background/70 px-4 backdrop-blur-2xl md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Focus className="size-4" />
            </span>
            <span className="text-sm font-semibold">{t("app.name")}</span>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            {formatDate(new Date(), "long")}
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
                <Play className="size-3.5" /> {t("action.start")} · {resumeCandidate.name}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/70 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setLang(lang === "fa" ? "en" : "fa")}
              aria-label={t("label.language")}
            >
              {lang === "fa" ? "EN" : "فا"}
            </Button>
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link to="/focus">{t("nav.focus")}</Link>
            </Button>
          </div>
        </header>

        <main key={pathname} className="page-enter min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-glass-border bg-background/80 px-2 py-2 backdrop-blur-2xl md:hidden">
          {MOBILE_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] transition-colors duration-300",
                isActive(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              {isActive(item.to) ? (
                <span
                  aria-hidden
                  className="absolute -top-2 h-[3px] w-8 rounded-full bg-primary shadow-[0_0_12px_2px_color-mix(in_oklab,var(--color-primary)_55%,transparent)]"
                />
              ) : null}
              <item.icon className={cn("size-[18px] transition-transform duration-300", isActive(item.to) && "scale-110")} />
              {t(item.label)}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

