import { useEffect } from "react";

import { useStudy } from "./store";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export const NEW_TIMER_EVENT = "focus:new-timer";

/** Global desktop shortcuts: Space pause/resume, R reset, N new timer. */
export function useGlobalShortcuts() {
  const { activeTimerId, timers, statusOf, pauseTimer, startTimer, resetTimer, settings } =
    useStudy();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.code === "Space") {
        const target = activeTimerId ?? timers.find((t) => !t.archived && statusOf(t.id) === "paused")?.id;
        if (!target) return;
        event.preventDefault();
        if (activeTimerId) pauseTimer(activeTimerId);
        else startTimer(target);
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent(NEW_TIMER_EVENT));
        return;
      }

      if (event.key.toLowerCase() === "r" && activeTimerId && !settings.confirmReset) {
        event.preventDefault();
        resetTimer(activeTimerId);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTimerId, timers, statusOf, pauseTimer, startTimer, resetTimer, settings.confirmReset]);
}
