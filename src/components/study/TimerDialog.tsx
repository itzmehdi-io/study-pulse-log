import { useEffect, useState } from "react";

import { TimerIcon } from "@/components/study/TimerIcon";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import {
  ACCENT_COLORS,
  TIMER_ICONS,
  TIMER_TYPES,
  type Timer,
  type TimerType,
} from "@/lib/study/types";

export interface TimerDraft {
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  type: TimerType;
}

export function TimerDialog({
  open,
  onOpenChange,
  timer,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timer?: Timer | null;
  onSubmit: (draft: TimerDraft) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<TimerDraft>({
    name: "",
    description: "",
    icon: TIMER_ICONS[0],
    accentColor: ACCENT_COLORS[0]!.value,
    type: "study",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft({
      name: timer?.name ?? "",
      description: timer?.description ?? "",
      icon: timer?.icon ?? TIMER_ICONS[0],
      accentColor: timer?.accentColor ?? ACCENT_COLORS[0]!.value,
      type: timer?.type ?? "study",
    });
  }, [open, timer]);

  const submit = () => {
    if (!draft.name.trim()) {
      setError("Give your timer a name.");
      return;
    }
    onSubmit({ ...draft, name: draft.name.trim(), description: draft.description.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{timer ? "Edit timer" : "New timer"}</DialogTitle>
          <DialogDescription>
            {timer
              ? "Changes apply to the timer only — your study history stays intact."
              : "Name a subject or task you want to track time against."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="timer-name">Timer name</Label>
            <Input
              id="timer-name"
              autoFocus
              placeholder="e.g. Mathematics"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timer-desc">Description</Label>
            <Textarea
              id="timer-desc"
              rows={2}
              placeholder="e.g. Calculus — derivatives and integrals"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("timer.type")}</Label>
            <div className="flex flex-wrap gap-2">
              {TIMER_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, type }))}
                  className={cn(
                    "rounded-full border border-border bg-elevated px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
                    draft.type === type && "border-primary/60 bg-primary/10 text-primary",
                  )}
                >
                  {t(`type.${type}` as never)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {TIMER_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, icon }))}
                  className={cn(
                    "grid size-10 place-items-center rounded-lg border border-border bg-elevated text-muted-foreground transition-colors hover:text-foreground",
                    draft.icon === icon && "border-primary/60 text-primary",
                  )}
                  aria-label={icon}
                >
                  <TimerIcon name={icon} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Accent</Label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, accentColor: color.value }))}
                  aria-label={color.name}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform hover:scale-105",
                    draft.accentColor === color.value
                      ? "border-foreground/70"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{timer ? "Save changes" : "Create timer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
