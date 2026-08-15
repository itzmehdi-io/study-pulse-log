import { Focus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudy } from "@/lib/study/store";
import { ACCENT_COLORS, TIMER_ICONS } from "@/lib/study/types";
import { cn } from "@/lib/utils";

const GOALS = [60, 120, 240, 360, 480];

export function Onboarding() {
  const { settings, hydrated, timers, updateSettings, createTimer } = useStudy();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(settings.dailyGoalMinutes);
  const [name, setName] = useState("");

  const open = hydrated && !settings.onboarded;
  const finish = () => {
    if (name.trim() && !timers.length) {
      createTimer({
        name: name.trim(),
        description: "",
        icon: TIMER_ICONS[0],
        accentColor: ACCENT_COLORS[0]!.value,
      });
    }
    updateSettings({ dailyGoalMinutes: goal, onboarded: true });
  };

  return (
    <Dialog open={open} onOpenChange={() => updateSettings({ onboarded: true })}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <div className="lamp-glow -m-6 mb-0 rounded-t-xl px-6 pt-8">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Focus className="size-5" />
          </span>
        </div>

        {step === 0 ? (
          <div className="space-y-3 pt-4">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome to Focus Studio</h2>
            <p className="text-sm text-muted-foreground">
              Track study time without getting distracted. Start a timer, study, and let your
              history build itself.
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4 pt-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Set your daily goal</h2>
              <p className="mt-1 text-sm text-muted-foreground">You can change this any time.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={cn(
                    "rounded-lg border border-border px-3 py-2 text-sm transition-colors",
                    goal === g ? "border-primary/60 bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  {g / 60}h
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-goal">Custom (minutes)</Label>
              <Input
                id="custom-goal"
                type="number"
                min={15}
                value={goal}
                onChange={(e) => setGoal(Math.max(15, Number(e.target.value) || 15))}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4 pt-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Create your first timer</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                One timer per subject or task works best.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="first-timer">Timer name</Label>
              <Input
                id="first-timer"
                placeholder="e.g. Mathematics"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={() => updateSettings({ onboarded: true })}>
            Skip
          </Button>
          <div className="flex items-center gap-2">
            <div className="mr-2 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn("size-1.5 rounded-full", i === step ? "bg-primary" : "bg-border")}
                />
              ))}
            </div>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
            ) : (
              <Button onClick={finish}>Start studying</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
