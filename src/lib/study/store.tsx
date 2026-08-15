import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { splitByLocalDay } from "./stats";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type AppState,
  type RunState,
  type StudySession,
  type Timer,
  type TimerStatus,
} from "./types";

const STORAGE_KEY = "focus.study.state.v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const EMPTY_STATE: AppState = {
  timers: [],
  sessions: [],
  settings: DEFAULT_SETTINGS,
  runStates: {},
};

function loadState(): AppState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      timers: parsed.timers ?? [],
      sessions: parsed.sessions ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      runStates: parsed.runStates ?? {},
    };
  } catch {
    return EMPTY_STATE;
  }
}

interface StoreValue extends AppState {
  hydrated: boolean;
  now: number;
  /** Committed sessions plus the in-progress segment, split by local day. */
  allSessions: StudySession[];
  activeTimerId: string | null;
  elapsedOf: (timerId: string) => number;
  statusOf: (timerId: string) => TimerStatus;
  lastUsedOf: (timerId: string) => number | null;
  createTimer: (input: Omit<Timer, "id" | "createdAt" | "updatedAt" | "archived">) => Timer;
  updateTimer: (id: string, patch: Partial<Timer>) => void;
  archiveTimer: (id: string, archived: boolean) => void;
  deleteTimer: (id: string, deleteHistory: boolean) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  clearTimerHistory: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  replaceAll: (state: Partial<AppState>) => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — in-memory state still works */
    }
  }, [state, hydrated]);

  const activeTimerId = useMemo(() => {
    const entry = Object.values(state.runStates).find((r) => r.startedAt !== null);
    return entry?.timerId ?? null;
  }, [state.runStates]);

  // Timestamp-based ticking: elapsed is always derived from Date.now(),
  // so tab throttling or sleep can never drift the clock.
  useEffect(() => {
    if (!activeTimerId) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [activeTimerId]);

  const commitRunning = useCallback((prev: AppState, timerId: string, at: number) => {
    const run = prev.runStates[timerId];
    if (!run || run.startedAt === null) return prev;
    const segments = splitByLocalDay(timerId, run.startedAt, at);
    const delta = at - run.startedAt;
    return {
      ...prev,
      sessions: [...prev.sessions, ...segments],
      runStates: {
        ...prev.runStates,
        [timerId]: { timerId, accumulatedMs: run.accumulatedMs + delta, startedAt: null },
      },
    };
  }, []);

  const startTimer = useCallback(
    (id: string) => {
      const at = Date.now();
      setState((prev) => {
        let next = prev;
        for (const run of Object.values(prev.runStates)) {
          if (run.startedAt !== null && run.timerId !== id) {
            next = commitRunning(next, run.timerId, at);
          }
        }
        const existing: RunState =
          next.runStates[id] ?? { timerId: id, accumulatedMs: 0, startedAt: null };
        return {
          ...next,
          runStates: { ...next.runStates, [id]: { ...existing, startedAt: at } },
        };
      });
      setNow(at);
    },
    [commitRunning],
  );

  const pauseTimer = useCallback(
    (id: string) => {
      const at = Date.now();
      setState((prev) => commitRunning(prev, id, at));
      setNow(at);
    },
    [commitRunning],
  );

  const resetTimer = useCallback(
    (id: string) => {
      const at = Date.now();
      setState((prev) => {
        const committed = commitRunning(prev, id, at);
        return {
          ...committed,
          runStates: {
            ...committed.runStates,
            [id]: { timerId: id, accumulatedMs: 0, startedAt: null },
          },
        };
      });
    },
    [commitRunning],
  );

  const createTimer: StoreValue["createTimer"] = useCallback((input) => {
    const timer: Timer = {
      ...input,
      id: uid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
    };
    setState((prev) => ({ ...prev, timers: [...prev.timers, timer] }));
    return timer;
  }, []);

  const updateTimer: StoreValue["updateTimer"] = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      timers: prev.timers.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
    }));
  }, []);

  const archiveTimer: StoreValue["archiveTimer"] = useCallback(
    (id, archived) => {
      const at = Date.now();
      setState((prev) => {
        const committed = commitRunning(prev, id, at);
        return {
          ...committed,
          timers: committed.timers.map((t) =>
            t.id === id ? { ...t, archived, updatedAt: at } : t,
          ),
        };
      });
    },
    [commitRunning],
  );

  const deleteTimer: StoreValue["deleteTimer"] = useCallback((id, deleteHistory) => {
    setState((prev) => {
      const runStates = { ...prev.runStates };
      delete runStates[id];
      return {
        ...prev,
        timers: prev.timers.filter((t) => t.id !== id),
        sessions: deleteHistory ? prev.sessions.filter((s) => s.timerId !== id) : prev.sessions,
        runStates,
      };
    });
  }, []);

  const clearTimerHistory: StoreValue["clearTimerHistory"] = useCallback((id) => {
    setState((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.timerId !== id) }));
  }, []);

  const updateSettings: StoreValue["updateSettings"] = useCallback((patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const replaceAll: StoreValue["replaceAll"] = useCallback((incoming) => {
    setState((prev) => ({
      timers: incoming.timers ?? prev.timers,
      sessions: incoming.sessions ?? prev.sessions,
      settings: { ...prev.settings, ...(incoming.settings ?? {}) },
      runStates: incoming.runStates ?? {},
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState((prev) => ({ ...EMPTY_STATE, settings: { ...prev.settings, onboarded: true } }));
  }, []);

  const allSessions = useMemo(() => {
    const live: StudySession[] = [];
    for (const run of Object.values(state.runStates)) {
      if (run.startedAt !== null && now > run.startedAt) {
        live.push(...splitByLocalDay(run.timerId, run.startedAt, now));
      }
    }
    return [...state.sessions, ...live];
  }, [state.sessions, state.runStates, now]);

  const elapsedOf = useCallback(
    (timerId: string) => {
      const run = stateRef.current.runStates[timerId];
      if (!run) return 0;
      return run.accumulatedMs + (run.startedAt !== null ? Math.max(0, now - run.startedAt) : 0);
    },
    [now],
  );

  const statusOf = useCallback(
    (timerId: string): TimerStatus => {
      const run = state.runStates[timerId];
      if (!run) return "idle";
      if (run.startedAt !== null) return "running";
      return run.accumulatedMs > 0 ? "paused" : "idle";
    },
    [state.runStates],
  );

  const lastUsedOf = useCallback(
    (timerId: string) => {
      let last: number | null = null;
      for (const s of state.sessions) {
        if (s.timerId === timerId && (last === null || s.endedAt > last)) last = s.endedAt;
      }
      return last;
    },
    [state.sessions],
  );

  const value: StoreValue = {
    ...state,
    hydrated,
    now,
    allSessions,
    activeTimerId,
    elapsedOf,
    statusOf,
    lastUsedOf,
    createTimer,
    updateTimer,
    archiveTimer,
    deleteTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    clearTimerHistory,
    updateSettings,
    replaceAll,
    clearAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
