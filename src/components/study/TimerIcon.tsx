import {
  Atom,
  BookOpen,
  Brain,
  Code2,
  Dna,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  Music,
  PenLine,
  Sigma,
  Timer as TimerFallback,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Sigma,
  Atom,
  FlaskConical,
  Dna,
  BookOpen,
  Code2,
  Languages,
  PenLine,
  Brain,
  Globe2,
  Music,
  Landmark,
};

export function TimerIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? TimerFallback;
  return <Icon className={className} />;
}
