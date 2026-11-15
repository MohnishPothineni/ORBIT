import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Wind,
  Waves,
  Gauge,
  Thermometer,
  BedDouble,
  GlassWater,
  Brain,
} from "lucide-react";
import { useCrew } from "../../../shared/context/CrewContext";
import { canSeeWellbeing } from "../../../shared/types";
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Textarea,
  useToast,
} from "../../../shared/ui";
import { useCreateReading } from "../hooks/useCrewHealth";
import { METRICS } from "../logic/metrics";
import { levelFor } from "../logic/status";
import { WELLBEING_KINDS, type ReviewBand, type VitalKind } from "../types";
const choices = [
  { kind: "heart_rate", icon: HeartPulse },
  { kind: "spo2", icon: Wind },
  { kind: "resp_rate", icon: Waves },
  { kind: "bp_systolic", icon: Gauge },
  { kind: "skin_temp", icon: Thermometer },
  { kind: "sleep_hours", icon: BedDouble },
  { kind: "hydration_ml", icon: GlassWater },
  { kind: "stress_self", icon: Brain },
  { kind: "fatigue_self", icon: Brain },
] as const;
export function LogReadingDialog({
  id,
  bands,
}: {
  id: string;
  bands: ReviewBand[];
}) {
  const { activeCrew, crew, getCrew } = useCrew();
  const [subject, setSubject] = useState(activeCrew?.id ?? id);
  const [confirmed, setConfirmed] = useState(id === (activeCrew?.id ?? id));
  const [kind, setKind] = useState<VitalKind>("heart_rate");
  const [value, setValue] = useState("");
  const [second, setSecond] = useState("");
  const [quality, setQuality] = useState("");
  const [note, setNote] = useState("");
  const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [partial, setPartial] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const save = useCreateReading();
  const navigate = useNavigate();
  const { toast } = useToast();
  const close = () => navigate(`/crew/${id}`);
  const requestClose = () => {
    if (save.isPending) return;
    if (dirty) setDiscard(true);
    else close();
  };
  const m = METRICS[kind];
  const wellbeing = !!activeCrew && canSeeWellbeing(activeCrew, subject);
  return (
    <>
      <Dialog
        open
        title="Log reading"
        onClose={requestClose}
        initialFocusRef={inputRef}
        description="Add a local crew record. Nothing has been sent to the assistant."
      >
        <form
          className="space-y-4"
          onChange={() => setDirty(true)}
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              !activeCrew ||
              !confirmed ||
              save.isPending ||
              (!wellbeing && WELLBEING_KINDS.includes(kind))
            )
              return;
            const recordedAt = new Date(time + "Z").toISOString(),
              pairId = kind === "bp_systolic" ? crypto.randomUUID() : undefined;
            const input = {
              kind,
              value: Number(value),
              unit: m.unit,
              recordedAt,
              source: "manual" as const,
              enteredBy: activeCrew.id,
              note: note.trim() || undefined,
              pairId,
            };
            try {
              if (!partial) await save.mutate({ id: subject, input });
              if (kind === "bp_systolic") {
                setPartial(true);
                await save.mutate({
                  id: subject,
                  input: {
                    ...input,
                    kind: "bp_diastolic",
                    value: Number(second),
                    unit: "mmHg",
                  },
                });
              }
              if (kind === "sleep_hours" && quality && wellbeing) {
                setPartial(true);
                await save.mutate({
                  id: subject,
                  input: {
                    ...input,
                    kind: "sleep_quality",
                    value: Number(quality),
                    unit: "1–5",
                  },
                });
              }
              const level =
                subject === id
                  ? levelFor(
                      { ...input, id: "new", crewId: subject },
                      bands.find((b) => b.kind === kind),
                    )
                  : "standby";
              toast({
                title: `${m.label} ${value} ${m.unit} saved for ${getCrew(subject)?.callsign}`,
                level:
                  level === "critical" || level === "caution"
                    ? "caution"
                    : "nominal",
                action: {
                  label: "View profile",
                  onClick: () => navigate(`/crew/${subject}`),
                },
              });
              navigate(`/crew/${subject}`);
            } catch {
              /* Show server error and preserve entered values. */
            }
          }}
        >
          <Field
            label="Crew member"
            helper={
              id !== activeCrew?.id
                ? "Select the subject explicitly when logging for another person."
                : undefined
            }
          >
            {(p) => (
              <Select
                {...p}
                value={confirmed ? subject : ""}
                required
                disabled={partial}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setConfirmed(true);
                  setKind("heart_rate");
                }}
              >
                {!confirmed && <option value="">Choose crew member</option>}
                {crew.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.callsign} · {c.fullName}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-3 gap-2" aria-label="Metric">
            {choices
              .filter((c) => wellbeing || !WELLBEING_KINDS.includes(c.kind))
              .map(({ kind: k, icon: Icon }) => (
                <button
                  key={k}
                  type="button"
                  disabled={partial}
                  aria-pressed={kind === k}
                  onClick={() => {
                    setKind(k);
                    setValue("");
                    setSecond("");
                    setDirty(true);
                    inputRef.current?.focus();
                  }}
                  className={`flex min-h-11 items-center gap-2 rounded-md border p-2 text-xs ${kind === k ? "bg-accent-tint border-accent text-ink" : "border-line-strong text-ink-2 hover:bg-raised"}`}
                >
                  <Icon size={16} aria-hidden />
                  {k === "bp_systolic" ? "Blood pressure" : METRICS[k].label}
                </button>
              ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={m.label}
              helper={`Input range ${m.min}–${m.max} ${m.unit}; not a clinical threshold.`}
            >
              {(p) => (
                <Input
                  {...p}
                  ref={inputRef}
                  type="number"
                  min={m.min}
                  max={m.max}
                  step={
                    ["skin_temp", "sleep_hours", "spo2"].includes(kind)
                      ? ".1"
                      : "1"
                  }
                  required
                  value={value}
                  disabled={partial}
                  onChange={(e) => setValue(e.target.value)}
                  unit={m.unit}
                />
              )}
            </Field>
            {kind === "bp_systolic" && (
              <Field label="Diastolic pressure">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={20}
                    max={200}
                    required
                    value={second}
                    onChange={(e) => setSecond(e.target.value)}
                    unit="mmHg"
                  />
                )}
              </Field>
            )}
            {kind === "sleep_hours" && wellbeing && (
              <Field label="Sleep quality (optional)">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={1}
                    max={5}
                    step={1}
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    unit="1–5"
                  />
                )}
              </Field>
            )}
          </div>
          <Field label="Recorded at (UTC)">
            {(p) => (
              <Input
                {...p}
                type="datetime-local"
                required
                max={new Date().toISOString().slice(0, 16)}
                value={time}
                disabled={partial}
                onChange={(e) => setTime(e.target.value)}
              />
            )}
          </Field>
          <Field
            label="Note (optional)"
            helper={`${note.length}/500 characters`}
          >
            {(p) => (
              <Textarea
                {...p}
                maxLength={500}
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </Field>
          {save.error && (
            <p role="alert" className="text-critical text-sm">
              {save.error.message}{" "}
              {partial
                ? "The first value was saved. Retry saves only the remaining value."
                : "Nothing was saved."}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={requestClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={save.isPending}
              disabled={!confirmed}
            >
              {partial ? "Retry remaining value" : "Save reading"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={discard}
        title="Discard this reading?"
        onClose={() => setDiscard(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDiscard(false)}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={close}>
              Discard reading
            </Button>
          </>
        }
      >
        <p>Your unsaved changes will be lost.</p>
      </Dialog>
    </>
  );
}
