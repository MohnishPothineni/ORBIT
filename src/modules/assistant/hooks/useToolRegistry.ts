import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCrew } from "../../../shared/context/CrewContext";
import { formatUtcDate, formatUtcTime } from "../../../shared/format";
import { canSeeWellbeing, type CrewMember } from "../../../shared/types";
import {
  clearAssistantContext,
  getCrewSummary,
  logVital,
  searchEvidence,
  shareRecordWithAssistant,
  VITAL_META,
  type CrewSummary,
  type VitalDraft,
  type VitalKind,
} from "../services/toolServices";
import { isVoiceShareApproval, TOOL_DEFINITIONS, type ToolName } from "../tools/definitions";
import type { Citation, ToolHandler, ToolOutcome } from "../types";

const DISABLED_KEY = "orbit.assistant.disabledTools";
export const WELLBEING_NEUTRAL = "Support check-in suggested";

export type ShareSection = "latest_vitals" | "wellbeing";
const SHARE_SECTIONS: Record<ShareSection, string> = { latest_vitals: "Latest vitals", wellbeing: "Wellbeing check-in" };

export interface VitalConfirmation {
  kind: "vital";
  callId: string;
  crew: CrewMember;
  draft: VitalDraft;
  /** "Save heart rate 72 bpm for VEGA?" */
  question: string;
}

export interface ShareConfirmation {
  kind: "share";
  callId: string;
  crew: CrewMember;
  sections: ShareSection[];
  /** Exactly what will be shared. */
  content: Record<string, unknown>;
  rows: Array<{ section: string; label: string; value: string }>;
  withheld: string[];
}

export type Confirmation = VitalConfirmation | ShareConfirmation;
export type DecisionVia = "button" | "voice";
interface Decision {
  approve: boolean;
  via: DecisionVia | "cancelled";
}

export interface SharedContextEntry {
  crewId: string;
  callsign: string;
  sections: ShareSection[];
  sharedAt: string;
}

function readDisabled(): Set<string> {
  try {
    const raw = window.localStorage.getItem(DISABLED_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function writeDisabled(s: Set<string>) {
  try {
    window.localStorage.setItem(DISABLED_KEY, JSON.stringify(Array.from(s)));
  } catch {
    /* storage unavailable */
  }
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const numOf = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
};

const VITAL_ALIASES: Record<string, VitalKind> = {
  hr: "heart_rate",
  pulse: "heart_rate",
  heart_rate: "heart_rate",
  spo2: "spo2",
  oxygen_saturation: "spo2",
  systolic: "systolic_bp",
  systolic_bp: "systolic_bp",
  diastolic: "diastolic_bp",
  diastolic_bp: "diastolic_bp",
  temp: "temperature",
  temperature: "temperature",
  rr: "respiratory_rate",
  respiratory_rate: "respiratory_rate",
};

const ALLOWED_ROUTES = ["crew", "anatomy", "assistant", "evidence"];
const ANATOMY_ACTIONS = ["select_region", "focus_region", "reset_view", "rotate", "toggle_layer"];

const ok = (resultSummary: string, result: Record<string, unknown> = {}, citations?: Citation[]): ToolOutcome => ({
  status: "succeeded",
  resultSummary,
  result,
  citations,
});
const fail = (error: string): ToolOutcome => ({ status: "failed", error, result: { error } });
const declined = (reason: string): ToolOutcome => ({ status: "declined", error: reason, result: { declined: true, reason } });

function summarize(crew: CrewMember, s: CrewSummary, viewer: CrewMember) {
  const readings = s.readings.map((r) => ({ ...r }));
  const visible = canSeeWellbeing(viewer, crew.id);
  const wellbeing = s.wellbeing ? (visible ? { ...s.wellbeing } : { note: WELLBEING_NEUTRAL }) : null;
  const parts = readings.map((r) => `${r.label} ${r.value} ${r.unit} at ${formatUtcTime(r.recordedAt)}`);
  let text = `${crew.callsign}: ${parts.length ? parts.join(", ") : "no readings yet"}`;
  if (s.wellbeing) {
    text += visible
      ? `; wellbeing check-in ${formatUtcDate(s.wellbeing.checkInAt)}: mood ${s.wellbeing.mood.toLowerCase()}, stress ${s.wellbeing.stress.toLowerCase()}`
      : `; ${WELLBEING_NEUTRAL}`;
  }
  return { readings, wellbeing, text, visible };
}

/**
 * Client-side tool handlers. Each is wrapped with the enable switch and, for
 * write/share tools, a human confirmation gate the model cannot pass itself.
 */
export function useToolRegistry() {
  const { activeCrew, crew, getCrew } = useCrew();
  const location = useLocation();
  const [disabled, setDisabled] = useState<Set<string>>(readDisabled);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [sharedContext, setSharedContext] = useState<SharedContextEntry[]>([]);

  const waiters = useRef(new Map<string, (d: Decision) => void>());
  const live = useRef({ activeCrew, crew, getCrew, location, disabled });
  live.current = { activeCrew, crew, getCrew, location, disabled };

  const resolveCrew = useCallback((args: Record<string, unknown>): CrewMember | null => {
    const { crew: list, getCrew: byId } = live.current;
    const id = str(args.crew_id) ?? str(args.crewId);
    if (id) return byId(id) ?? null;
    const callsign = str(args.callsign)?.toUpperCase();
    if (callsign) return list.find((c) => c.callsign === callsign) ?? null;
    return null;
  }, []);

  const waitFor = useCallback((req: Confirmation, signal: AbortSignal): Promise<Decision> => {
    setConfirmations((list) => [...list.filter((c) => c.callId !== req.callId), req]);
    return new Promise<Decision>((resolve) => {
      const done = (d: Decision) => {
        waiters.current.delete(req.callId);
        setConfirmations((list) => list.filter((c) => c.callId !== req.callId));
        resolve(d);
      };
      waiters.current.set(req.callId, done);
      if (signal.aborted) done({ approve: false, via: "cancelled" });
      else signal.addEventListener("abort", () => done({ approve: false, via: "cancelled" }), { once: true });
    });
  }, []);

  /** Only a person can call this: from a button, or from their own spoken words. */
  const resolveConfirmation = useCallback((callId: string, approve: boolean, via: DecisionVia) => {
    waiters.current.get(callId)?.({ approve, via });
  }, []);

  const handleTool: ToolHandler = useCallback(
    async (call, update, signal) => {
      const name = call.name as ToolName;
      const { activeCrew: viewer, location: loc, disabled: off } = live.current;
      if (!TOOL_DEFINITIONS.some((t) => t.name === name)) return fail(`Unknown tool: ${call.name}`);
      if (off.has(name)) return declined("This tool is turned off on this device.");
      if (!viewer) return fail("No crew member is selected on this device.");
      const args = call.args;

      switch (name) {
        case "get_current_context": {
          update({ status: "running" });
          const params = new URLSearchParams(loc.search);
          const result = {
            route: `${loc.pathname}${loc.search}`,
            viewingAs: { id: viewer.id, callsign: viewer.callsign, role: viewer.role },
            selectedCrew: params.get("crew"),
            selectedAnatomyRegion: params.get("region"),
          };
          return ok(`Route ${result.route} · viewing as ${viewer.callsign}`, result);
        }

        case "get_crew_summary": {
          const subject = resolveCrew(args) ?? viewer;
          update({ status: "running" });
          const s = await getCrewSummary(subject.id, signal);
          const sum = summarize(subject, s, viewer);
          return ok(sum.text, { crewId: subject.id, callsign: subject.callsign, readings: sum.readings, wellbeing: sum.wellbeing });
        }

        case "log_vital": {
          const subject = resolveCrew(args);
          if (!subject) return fail("Say who the reading is for (crew callsign).");
          const rawKind = (str(args.kind) ?? str(args.vital) ?? "").toLowerCase().replace(/[\s-]+/g, "_");
          const kind = VITAL_ALIASES[rawKind];
          if (!kind) return fail(`Unknown reading type: ${rawKind || "none"}.`);
          const meta = VITAL_META[kind];
          const value = numOf(args.value);
          if (value === null) return fail("The reading needs a number.");
          const unit = str(args.unit);
          if (unit && unit.toLowerCase() !== meta.unit.toLowerCase()) return fail(`Expected ${meta.unit}, got ${unit}.`);
          if (value < meta.min || value > meta.max) {
            return fail(`${value} ${meta.unit} is outside what this form accepts (${meta.min}–${meta.max} ${meta.unit}).`);
          }
          const draft: VitalDraft = { crewId: subject.id, kind, value, unit: meta.unit, recordedAt: new Date().toISOString() };
          update({ status: "awaiting_confirmation" });
          const decision = await waitFor(
            { kind: "vital", callId: call.id, crew: subject, draft, question: `Save ${meta.label} ${value} ${meta.unit} for ${subject.callsign}?` },
            signal,
          );
          if (!decision.approve) {
            return declined(decision.via === "cancelled" ? "Cancelled before anyone confirmed. Nothing was saved." : "Discarded by a person. Nothing was saved.");
          }
          update({ status: "running" });
          const saved = await logVital(draft, signal);
          return ok(`Saved ${meta.label} ${value} ${meta.unit} for ${subject.callsign} at ${formatUtcTime(saved.recordedAt)}`, {
            id: saved.id,
            recordedAt: saved.recordedAt,
          });
        }

        case "navigate": {
          const path = str(args.path) ?? str(args.route);
          if (!path || !path.startsWith("/") || path.startsWith("//")) return fail("Navigation needs a path inside this console.");
          const first = path.slice(1).split(/[/?#]/)[0];
          if (!ALLOWED_ROUTES.includes(first)) return fail(`No screen at ${path}.`);
          update({ status: "running" });
          setPendingNavigation(path);
          return ok(`Opening ${path}`, { path });
        }

        case "control_anatomy": {
          const action = str(args.action);
          if (!action || !ANATOMY_ACTIONS.includes(action)) return fail(`Unknown anatomy action: ${action ?? "none"}.`);
          update({ status: "running" });
          const detail = { ...args, action, source: "assistant" };
          window.dispatchEvent(new CustomEvent("orbit:anatomy", { detail }));
          const region = str(args.region);
          return ok(`Sent ${action}${region ? ` · ${region}` : ""} to the Anatomy lab`, { dispatched: true });
        }

        case "search_evidence": {
          const query = str(args.query);
          if (!query) return fail("Search needs a query.");
          const k = Math.min(5, Math.max(1, numOf(args.k) ?? 3));
          update({ status: "running" });
          const chunks = await searchEvidence(query, k, signal);
          const citations: Citation[] = chunks.map((c, i) => ({
            marker: i + 1,
            documentId: c.documentId,
            chunkId: c.chunkId,
            title: c.title,
            excerpt: c.excerpt,
          }));
          return ok(
            chunks.length ? `${chunks.length} cited passage${chunks.length === 1 ? "" : "s"} from the Evidence library` : "No passages matched",
            { passages: citations.map((c) => ({ marker: c.marker, title: c.title, excerpt: c.excerpt })) },
            citations,
          );
        }

        case "share_record_with_assistant": {
          const subject = resolveCrew(args) ?? viewer;
          const requested = Array.isArray(args.sections) ? args.sections.filter((s): s is string => typeof s === "string") : ["latest_vitals"];
          const sections = requested.filter((s): s is ShareSection => s in SHARE_SECTIONS);
          const withheld = requested.filter((s) => !(s in SHARE_SECTIONS)).map((s) => `${s} (not available on this device)`);
          const s = await getCrewSummary(subject.id, signal);
          const visible = canSeeWellbeing(viewer, subject.id);
          const rows: ShareConfirmation["rows"] = [];
          const content: Record<string, unknown> = { crewId: subject.id, callsign: subject.callsign };
          if (sections.includes("latest_vitals")) {
            content.latestVitals = s.readings.map((r) => ({ kind: r.kind, value: r.value, unit: r.unit, recordedAt: r.recordedAt }));
            for (const r of s.readings) {
              rows.push({ section: SHARE_SECTIONS.latest_vitals, label: r.label, value: `${r.value} ${r.unit} · ${formatUtcTime(r.recordedAt)}` });
            }
          }
          const finalSections = sections.filter((sec) => sec !== "wellbeing" || (visible && s.wellbeing));
          if (sections.includes("wellbeing")) {
            if (!visible) withheld.push(`${SHARE_SECTIONS.wellbeing} (visible only to ${subject.callsign}, the crew leader and the medical officer)`);
            else if (!s.wellbeing) withheld.push(`${SHARE_SECTIONS.wellbeing} (no check-in recorded)`);
            else {
              content.wellbeing = { ...s.wellbeing };
              rows.push({ section: SHARE_SECTIONS.wellbeing, label: "Mood", value: s.wellbeing.mood });
              rows.push({ section: SHARE_SECTIONS.wellbeing, label: "Stress", value: s.wellbeing.stress });
              if (s.wellbeing.note) rows.push({ section: SHARE_SECTIONS.wellbeing, label: "Note", value: s.wellbeing.note });
            }
          }
          if (!rows.length) return fail("There is nothing that can be shared for that request.");
          update({ status: "awaiting_confirmation" });
          const decision = await waitFor(
            { kind: "share", callId: call.id, crew: subject, sections: finalSections, content, rows, withheld },
            signal,
          );
          if (!decision.approve) {
            return declined(decision.via === "cancelled" ? "Cancelled before anyone confirmed. Nothing was shared." : "Declined by a person. Nothing was shared.");
          }
          update({ status: "running" });
          const res = await shareRecordWithAssistant({ crewId: subject.id, sections: finalSections, content }, signal);
          setSharedContext((list) => [...list, { crewId: subject.id, callsign: subject.callsign, sections: finalSections, sharedAt: res.sharedAt }]);
          const how = decision.via === "voice" ? "approved by voice" : "approved on screen";
          return ok(`Shared ${finalSections.map((x) => SHARE_SECTIONS[x].toLowerCase()).join(" and ")} for ${subject.callsign} · ${how}`, {
            shared: content,
          });
        }
      }
    },
    [resolveCrew, waitFor],
  );

  const confirmationsRef = useRef(confirmations);
  confirmationsRef.current = confirmations;

  /** Voice approval: only the exact phrase, only from a final user voice transcript. */
  const approveShareByVoice = useCallback(
    (text: string): boolean => {
      if (!isVoiceShareApproval(text)) return false;
      const pending = confirmationsRef.current.find((c) => c.kind === "share");
      if (!pending) return false;
      resolveConfirmation(pending.callId, true, "voice");
      return true;
    },
    [resolveConfirmation],
  );

  const declineAll = useCallback(() => {
    for (const done of Array.from(waiters.current.values())) done({ approve: false, via: "cancelled" });
  }, []);

  const clearShared = useCallback(() => {
    setSharedContext([]);
    void clearAssistantContext().catch(() => {});
  }, []);

  const setToolEnabled = useCallback((name: string, on: boolean) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (on) next.delete(name);
      else next.add(name);
      writeDisabled(next);
      return next;
    });
  }, []);

  const consumeNavigation = useCallback(() => setPendingNavigation(null), []);

  useEffect(() => () => declineAll(), [declineAll]);

  const tools = useMemo(() => TOOL_DEFINITIONS.map((t) => ({ ...t, enabled: !disabled.has(t.name) })), [disabled]);

  return {
    handleTool,
    tools,
    setToolEnabled,
    confirmations,
    resolveConfirmation,
    approveShareByVoice,
    declineAll,
    pendingNavigation,
    consumeNavigation,
    sharedContext,
    clearShared,
  };
}

export type ToolRegistry = ReturnType<typeof useToolRegistry>;
