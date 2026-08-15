export type TimerStatus = "idle" | "running" | "paused";

export interface Timer {
  id: string;
  name: string;
  description?: string;
  icon: string;
  accentColor: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
}

export interface StudySession {
  id: string;
  timerId: string;
  startedAt: number;
  endedAt: number;
  duration: number;
  date: string; // local YYYY-MM-DD
}

export type ThemeMode = "dark" | "light" | "system";

export interface AppSettings {
  dailyGoalMinutes: number;
  streakMinimumMinutes: number;
  theme: ThemeMode;
  confirmReset: boolean;
  confirmDelete: boolean;
  autoPauseOthers: boolean;
  notifications: boolean;
  onboarded: boolean;
}

/** Live state of a timer's current (not yet reset) session block. */
export interface RunState {
  timerId: string;
  accumulatedMs: number;
  startedAt: number | null; // non-null => running
}

export interface AppState {
  timers: Timer[];
  sessions: StudySession[];
  settings: AppSettings;
  runStates: Record<string, RunState>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  dailyGoalMinutes: 360,
  streakMinimumMinutes: 30,
  theme: "dark",
  confirmReset: true,
  confirmDelete: true,
  autoPauseOthers: true,
  notifications: false,
  onboarded: false,
};

export const ACCENT_COLORS = [
  { name: "Amber", value: "oklch(0.78 0.145 66)" },
  { name: "Sage", value: "oklch(0.7 0.09 155)" },
  { name: "Steel", value: "oklch(0.7 0.08 235)" },
  { name: "Plum", value: "oklch(0.68 0.1 320)" },
  { name: "Clay", value: "oklch(0.65 0.12 30)" },
  { name: "Sand", value: "oklch(0.8 0.07 90)" },
  { name: "Teal", value: "oklch(0.7 0.09 195)" },
  { name: "Stone", value: "oklch(0.72 0.02 80)" },
];

export const TIMER_ICONS = [
  "Sigma",
  "Atom",
  "FlaskConical",
  "Dna",
  "BookOpen",
  "Code2",
  "Languages",
  "PenLine",
  "Brain",
  "Globe2",
  "Music",
  "Landmark",
] as const;
