import {
  AudioLines,
  BrainCircuit,
  CircleDot,
  Loader2,
  Mic,
  MicOff,
  OctagonAlert,
  Volume2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { StatusLevel } from "../../../shared/types";
import { cn, ICON_STROKE } from "../../../shared/ui/cn";
import { STATUS_TEXT } from "../../../shared/ui/StatusBadge";
import type { TurnState } from "../types";

interface StateMeta {
  level: StatusLevel;
  icon: LucideIcon;
  label: string;
  spin?: boolean;
}

export function turnStateMeta(state: TurnState, toolName: string | null, errorMessage: string | null): StateMeta {
  switch (state) {
    case "idle": return { level: "standby", icon: CircleDot, label: "Not connected" };
    case "connecting": return { level: "caution", icon: Loader2, label: "Connecting…", spin: true };
    case "listening": return { level: "nominal", icon: Mic, label: "Listening" };
    case "user_speaking": return { level: "nominal", icon: AudioLines, label: "Hearing you" };
    case "thinking": return { level: "caution", icon: BrainCircuit, label: "Thinking" };
    case "tool_running": return { level: "caution", icon: Wrench, label: `Running tool: ${toolName ?? "tool"}` };
    case "bot_speaking": return { level: "nominal", icon: Volume2, label: "Speaking" };
    case "muted": return { level: "standby", icon: MicOff, label: "Microphone off" };
    case "error": return { level: "critical", icon: OctagonAlert, label: errorMessage ? `Error: ${errorMessage}` : "Error" };
  }
}

export interface TurnStateIndicatorProps {
  state: TurnState;
  toolName: string | null;
  errorMessage: string | null;
  className?: string;
}

const ANNOUNCE_DEBOUNCE_MS = 500;

export function TurnStateIndicator({ state, toolName, errorMessage, className }: TurnStateIndicatorProps) {
  const meta = turnStateMeta(state, toolName, errorMessage);
  const Icon = meta.icon;
  const [announced, setAnnounced] = useState(meta.label);

  // Announce only once the state has been stable for 500ms.
  useEffect(() => {
    const t = window.setTimeout(() => setAnnounced(meta.label), ANNOUNCE_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [meta.label]);

  return (
    <div className={cn("flex flex-col gap-2 min-w-0", className)}>
      <span className="font-mono text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Turn state</span>
      <div className={cn("flex items-start gap-2.5", STATUS_TEXT[meta.level])}>
        <Icon
          size={24}
          strokeWidth={ICON_STROKE}
          aria-hidden="true"
          className={cn("mt-0.5 shrink-0", meta.spin && "animate-spin")}
        />
        <span className="text-lg font-semibold leading-7 break-words line-clamp-3">{meta.label}</span>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {`Assistant: ${announced}`}
      </span>
    </div>
  );
}
