import { ArrowDown, Copy, Download, MessagesSquare, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, IconButton } from "../../../shared/ui/Button";
import { Card, CardHeader } from "../../../shared/ui/Card";
import { ICON_STROKE } from "../../../shared/ui/cn";
import { Dialog } from "../../../shared/ui/Dialog";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Skeleton, SkeletonGroup } from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import { transcript, transcriptToText, type TranscriptState } from "../hooks/transcriptStore";
import type { Confirmation, DecisionVia } from "../hooks/useToolRegistry";
import { Composer } from "./Composer";
import { ConfirmToolCard } from "./ConfirmToolCard";
import { ToolCallRow } from "./ToolCallRow";
import { TranscriptTurnView } from "./TranscriptTurnView";

export interface TranscriptCardProps {
  state: TranscriptState;
  userLabel: string;
  canSend: boolean;
  sendHint: string;
  onSend: (text: string) => void;
  confirmations: Confirmation[];
  onResolve: (callId: string, approve: boolean, via: DecisionVia) => void;
  onReviewShare: (callId: string) => void;
  loading?: boolean;
  className?: string;
}

const STICK_PX = 48;

export function TranscriptCard({
  state,
  userLabel,
  canSend,
  sendHint,
  onSend,
  confirmations,
  onResolve,
  onReviewShare,
  loading = false,
  className,
}: TranscriptCardProps) {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const turnCount = state.items.filter((i) => i.kind === "turn").length;
  const empty = state.items.length === 0;

  // Stick to the bottom unless the user scrolled up.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stick.current) el.scrollTop = el.scrollHeight;
    else setShowJump(true);
  }, [state]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
    stick.current = atBottom;
    if (atBottom) setShowJump(false);
  };

  const jump = () => {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setShowJump(false);
  };

  // Announce each completed assistant reply once (streaming words are not announced).
  const lastFinalAssistant = useMemo(() => {
    for (let i = state.items.length - 1; i >= 0; i--) {
      const it = state.items[i];
      if (it.kind !== "turn") continue;
      const t = state.turns[it.id];
      if (t.speaker === "assistant" && t.final) return t;
    }
    return null;
  }, [state]);
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    if (lastFinalAssistant) setAnnounce(`ORBIT said: ${lastFinalAssistant.text}`);
  }, [lastFinalAssistant]);

  const text = () => transcriptToText(state, { user: userLabel, assistant: "ORBIT" });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      toast({ level: "nominal", title: "Transcript copied", description: "It is on this device's clipboard only." });
    } catch {
      toast({ level: "caution", title: "Could not copy", description: "The browser blocked clipboard access." });
    }
  };

  const exportTxt = () => {
    const blob = new Blob([text()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbit-assistant-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ level: "nominal", title: "Transcript saved to this device", description: "Nothing has been sent." });
  };

  const confirmationFor = (callId: string) => confirmations.find((c) => c.callId === callId);

  return (
    <Card aria-labelledby="transcript-title" className={`relative flex min-h-0 flex-col ${className ?? ""}`}>
      <CardHeader
        title="Transcript"
        titleId="transcript-title"
        actions={
          <>
            <IconButton icon={Copy} label="Copy transcript" size="sm" disabled={empty} onClick={() => void copy()} />
            <IconButton icon={Download} label="Export .txt (saved on this device)" size="sm" disabled={empty} onClick={exportTxt} />
            <IconButton icon={Trash2} label="Clear transcript" size="sm" disabled={empty} onClick={() => setConfirmClear(true)} />
          </>
        }
      />
      <div className="relative flex min-h-[240px] flex-1 flex-col">
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <SkeletonGroup label="Loading transcript" className="flex flex-col gap-3">
            <Skeleton className="h-16 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-10 w-3/4" />
          </SkeletonGroup>
        ) : empty ? (
          <EmptyState
            icon={MessagesSquare}
            title="No conversation yet"
            description="Start a session, then speak or type. Everything stays on this network."
          />
        ) : (
          <ol aria-label="Conversation" className="flex flex-col gap-3">
            {state.items.map((item) => {
              if (item.kind === "turn") {
                return <TranscriptTurnView key={item.id} turn={state.turns[item.id]} userLabel={userLabel} />;
              }
              const call = state.calls[item.id];
              const conf = call.status === "awaiting_confirmation" ? confirmationFor(call.id) : undefined;
              return (
                <ToolCallRow key={item.id} call={call}>
                  {conf && (
                    <ConfirmToolCard
                      confirmation={conf}
                      onApprove={() => onResolve(conf.callId, true, "button")}
                      onDecline={() => onResolve(conf.callId, false, "button")}
                      onReview={() => onReviewShare(conf.callId)}
                    />
                  )}
                </ToolCallRow>
              );
            })}
          </ol>
        )}
      </div>
      {showJump && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <Button size="sm" variant="secondary" icon={ArrowDown} onClick={jump} className="pointer-events-auto rounded-full shadow-overlay">
            Jump to latest
          </Button>
        </div>
      )}
      </div>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      <Composer disabled={!canSend} disabledHint={sendHint} onSend={onSend} />
      <p className="flex items-center gap-1.5 border-t border-line px-5 py-2 text-xs text-ink-3">
        <ShieldCheck size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
        Local assistant · not a medical professional · nothing is sent off this network
      </p>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        role="alertdialog"
        title="Clear the transcript?"
        description={`This removes ${turnCount} turn${turnCount === 1 ? "" : "s"} and their tool rows from this screen. Saved readings are not affected. Nothing has been sent.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                transcript.clear();
                setConfirmClear(false);
                toast({ level: "standby", title: "Transcript cleared" });
              }}
            >
              Clear transcript
            </Button>
          </>
        }
      />
    </Card>
  );
}
