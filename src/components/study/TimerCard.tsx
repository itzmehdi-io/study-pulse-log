import { Link } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  BarChart3,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TimerIcon } from "@/components/study/TimerIcon";
import { TimerDialog } from "@/components/study/TimerDialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dateKey, formatClock, formatDuration } from "@/lib/study/format";
import { useStudy } from "@/lib/study/store";
import { sumDuration } from "@/lib/study/stats";
import type { Timer } from "@/lib/study/types";
import { cn } from "@/lib/utils";

export function TimerCard({ timer }: { timer: Timer }) {
  const store = useStudy();
  const {
    elapsedOf,
    statusOf,
    lastUsedOf,
    allSessions,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    updateTimer,
    archiveTimer,
    deleteTimer,
    activeTimerId,
  } = store;

  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const status = statusOf(timer.id);
  const elapsed = elapsedOf(timer.id);
  const running = status === "running";
  const today = dateKey(new Date());
  const mine = allSessions.filter((s) => s.timerId === timer.id);
  const todayTotal = sumDuration(mine.filter((s) => s.date === today));
  const lifetime = sumDuration(mine);
  const lastUsed = lastUsedOf(timer.id);

  const handleStart = () => {
    if (activeTimerId && activeTimerId !== timer.id) {
      if (settings.autoPauseOthers) {
        setSwitchOpen(true);
      } else {
        toast.error("Another timer is running", {
          description: "Pause it first, or enable automatic switching in Settings.",
        });
      }
      return;
    }
    startTimer(timer.id);
  };

  const handleReset = () => {
    if (settings.confirmReset) setResetOpen(true);
    else resetTimer(timer.id);
  };

  const activeName = store.timers.find((t) => t.id === activeTimerId)?.name ?? "A timer";

  return (
    <>
      <article
        className={cn(
          "panel group relative flex flex-col gap-5 p-5 transition-all duration-300",
          running
            ? "border-primary/40 lamp-glow shadow-lamp"
            : "hover:border-border hover:bg-elevated/60",
          timer.archived && "opacity-70",
        )}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl border border-border/70",
                running && "animate-pulse-ring",
              )}
              style={{
                backgroundColor: `color-mix(in oklab, ${timer.accentColor} 16%, transparent)`,
                color: timer.accentColor,
              }}
            >
              <TimerIcon name={timer.icon} className="size-5" />
            </span>
            <div className="min-w-0">
              <Link
                to="/timers/$timerId"
                params={{ timerId: timer.id }}
                className="truncate text-base font-semibold hover:text-primary"
              >
                {timer.name}
              </Link>
              {timer.description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {timer.description}
                </p>
              ) : null}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Timer options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/timers/$timerId" params={{ timerId: timer.id }}>
                  <BarChart3 className="size-4" /> Timer history
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReset}>
                <RotateCcw className="size-4" /> Reset session
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => archiveTimer(timer.id, !timer.archived)}>
                {timer.archived ? (
                  <>
                    <ArchiveRestore className="size-4" /> Restore
                  </>
                ) : (
                  <>
                    <Archive className="size-4" /> Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => (settings.confirmDelete ? setDeleteOpen(true) : deleteTimer(timer.id, false))}
              >
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div>
          <p
            className={cn(
              "num text-4xl font-semibold tabular-nums transition-colors",
              running ? "text-foreground" : "text-foreground/80",
            )}
          >
            {formatClock(elapsed)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-widest">
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                running ? "text-primary" : status === "paused" ? "text-warning" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  running ? "bg-primary" : status === "paused" ? "bg-warning" : "bg-muted-foreground",
                )}
              />
              {status}
            </span>
            {lastUsed ? (
              <span className="text-muted-foreground/70 normal-case tracking-normal">
                · last used {new Date(lastUsed).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Today <span className="num text-foreground">{formatDuration(todayTotal)}</span>
          </span>
          <span>
            Total <span className="num text-foreground">{formatDuration(lifetime)}</span>
          </span>
        </div>

        <footer className="flex items-center gap-2">
          {running ? (
            <Button variant="secondary" className="flex-1" onClick={() => pauseTimer(timer.id)}>
              <Pause className="size-4" /> Pause
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleStart}>
              <Play className="size-4" /> {status === "paused" ? "Resume" : "Start"}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={elapsed === 0}
            aria-label="Reset session"
          >
            <RotateCcw className="size-4" />
          </Button>
        </footer>
      </article>

      <TimerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        timer={timer}
        onSubmit={(draft) => {
          updateTimer(timer.id, draft);
          toast.success("Timer updated");
        }}
      />

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset “{timer.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This resets the current timer session back to 00:00. Your completed study history is
              kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => resetTimer(timer.id)}
            >
              Reset timer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to “{timer.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeName} is currently running. It will be paused with its elapsed time preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => startTimer(timer.id)}>Switch timer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{timer.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving is usually better — the timer leaves your dashboard but its history stays.
              If you delete, choose what happens to {formatDuration(lifetime)} of recorded sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { archiveTimer(timer.id, true); setDeleteOpen(false); }}>
                Archive instead
              </Button>
              <Button variant="secondary" onClick={() => { deleteTimer(timer.id, false); setDeleteOpen(false); }}>
                Delete, keep history
              </Button>
              <Button
                variant="destructive"
                onClick={() => { deleteTimer(timer.id, true); setDeleteOpen(false); }}
              >
                Delete everything
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
