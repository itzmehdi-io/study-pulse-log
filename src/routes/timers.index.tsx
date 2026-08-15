import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TimerCard } from "@/components/study/TimerCard";
import { TimerDialog } from "@/components/study/TimerDialog";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/lib/study/store";
import { useGlobalShortcuts } from "@/lib/study/useShortcuts";

export const Route = createFileRoute("/timers/")({
  head: () => ({
    meta: [
      { title: "Timers — Focus Studio" },
      {
        name: "description",
        content:
          "Manage every study timer: create, edit, archive and review accumulated time per subject.",
      },
      { property: "og:title", content: "Study timers — Focus Studio" },
      {
        property: "og:description",
        content: "Create, edit and archive study timers for each subject you track.",
      },
    ],
  }),
  component: TimersPage,
});

function TimersPage() {
  useGlobalShortcuts();
  const { timers, createTimer } = useStudy();
  const [createOpen, setCreateOpen] = useState(false);

  const active = timers.filter((t) => !t.archived);
  const archived = timers.filter((t) => t.archived);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One timer per subject or task. Click a name to open its full history.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Add timer
        </Button>
      </header>

      {active.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((timer) => (
            <TimerCard key={timer.id} timer={timer} />
          ))}
        </div>
      ) : (
        <div className="panel px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No timers yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first timer and begin building your study history.
          </p>
          <Button className="mt-5" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Create timer
          </Button>
        </div>
      )}

      {archived.length ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Archived
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {archived.map((timer) => (
              <TimerCard key={timer.id} timer={timer} />
            ))}
          </div>
        </section>
      ) : null}

      <TimerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(draft) => {
          createTimer(draft);
          toast.success(`“${draft.name}” is ready`);
        }}
      />
    </div>
  );
}
