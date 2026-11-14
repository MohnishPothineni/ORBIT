import { Cpu, Database, Lock, Menu, ServerCrash, ShieldAlert, WifiOff, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSystemStatus } from "../../shared/context/SystemStatusContext";
import { formatCount, formatUtcDate, formatUtcDateTime, formatUtcTime } from "../../shared/format";
import type { NetworkMode, StatusLevel, SystemStatus } from "../../shared/types";
import { IconButton } from "../../shared/ui/Button";
import { CrewSelector } from "./CrewSelector";
import { StatusChip } from "./StatusChip";

const NETWORK: Record<NetworkMode, { level: StatusLevel; icon: LucideIcon; text: string }> = {
  https_lan: { level: "nominal", icon: Lock, text: "Local HTTPS" },
  offline_local: { level: "standby", icon: WifiOff, text: "Offline · local only" },
  cert_untrusted: { level: "caution", icon: ShieldAlert, text: "Certificate not trusted" },
  unreachable: { level: "critical", icon: ServerCrash, text: "Local server unreachable" },
};

function UtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span aria-hidden="true" className="font-mono text-xs text-ink-2 tabular-nums whitespace-nowrap">
      {formatUtcTime(now, true)}
    </span>
  );
}

function NetworkChip({ network }: { network: SystemStatus["network"] }) {
  const n = NETWORK[network.mode];
  return (
    <StatusChip
      level={n.level}
      icon={n.icon}
      text={n.text}
      title="Network"
      details={[
        ["State", n.text],
        ["Host", network.host],
        ["LAN IP", network.lanIp ?? "—"],
        ["SSID", network.ssid ?? "—"],
        ["Certificate expires", network.certExpiresAt ? formatUtcDate(network.certExpiresAt) : "—"],
      ]}
    >
      {n.text}
      {network.mode === "https_lan" && <span className="font-mono font-normal text-ink-2">{network.host}</span>}
    </StatusChip>
  );
}

function ModelChip({ ollama }: { ollama: SystemStatus["ollama"] }) {
  const level: StatusLevel = ollama.state === "ready" ? "nominal" : ollama.state === "loading" ? "caution" : "critical";
  const stateText =
    ollama.state === "ready" ? "Ready" : ollama.state === "loading" ? `Loading ${ollama.loadProgress ?? 0}%` : "Model unavailable";
  const text = ollama.state === "unavailable" ? "Model unavailable" : ollama.model;
  return (
    <StatusChip
      level={level}
      icon={Cpu}
      text={ollama.state === "loading" ? `${ollama.model} · ${ollama.loadProgress ?? 0}%` : text}
      title="Local model"
      details={[
        ["Model", ollama.model],
        ["State", stateText],
        ["Runtime", "Ollama · local"],
      ]}
    >
      {ollama.state === "unavailable" ? (
        "Model unavailable"
      ) : (
        <span className="font-mono">
          {ollama.model}
          {ollama.state === "loading" && <span className="tabular-nums">{` ·  ${ollama.loadProgress ?? 0}%`}</span>}
        </span>
      )}
    </StatusChip>
  );
}

function IndexChip({ faiss }: { faiss: SystemStatus["faiss"] }) {
  const level: StatusLevel = faiss.state === "ready" ? "nominal" : faiss.state === "building" ? "caution" : "critical";
  const text =
    faiss.state === "missing"
      ? "Index missing"
      : faiss.state === "building"
        ? `FAISS building ${faiss.buildProgress ?? 0}%`
        : `FAISS ${formatCount(faiss.chunkCount)} chunks`;
  return (
    <StatusChip
      level={level}
      icon={Database}
      text={text}
      title="Evidence index"
      details={[
        ["State", faiss.state === "ready" ? "Ready" : faiss.state === "building" ? `Building ${faiss.buildProgress ?? 0}%` : "Index missing"],
        ["Documents", formatCount(faiss.documentCount)],
        ["Chunks", formatCount(faiss.chunkCount)],
        ["Last indexed", faiss.updatedAt ? formatUtcDateTime(faiss.updatedAt) : "—"],
      ]}
    >
      {faiss.state === "missing" ? (
        "Index missing"
      ) : (
        <>
          FAISS
          <span className="font-mono tabular-nums">
            {faiss.state === "building" ? `${faiss.buildProgress ?? 0}%` : `${formatCount(faiss.chunkCount)} chunks`}
          </span>
        </>
      )}
    </StatusChip>
  );
}

export interface StatusBarProps {
  /** Shown below 768px to open the navigation drawer. */
  onOpenNav?: () => void;
  showNavButton: boolean;
}

export function StatusBar({ onOpenNav, showNavButton }: StatusBarProps) {
  const { status } = useSystemStatus();
  return (
    <header className="col-span-2 h-12 flex items-center gap-2 px-3 bg-sunken border-b border-line min-w-0">
      {showNavButton && <IconButton icon={Menu} label="Open navigation" size="sm" onClick={onOpenNav} />}
      <Link to="/crew" className="flex items-center rounded-sm whitespace-nowrap" aria-label="ORBIT Crew Health — go to Crew status">
        <span className="font-sans text-base font-semibold text-ink">ORBIT</span>
        <span aria-hidden="true" className="h-4 w-px bg-line-strong mx-2" />
        <span className="text-sm text-ink-2">Crew Health</span>
      </Link>
      <div className="flex-1" />
      {status ? (
        <>
          <NetworkChip network={status.network} />
          <ModelChip ollama={status.ollama} />
          <IndexChip faiss={status.faiss} />
        </>
      ) : (
        <div role="status" aria-label="Loading system status" className="flex gap-2">
          <span className="h-8 w-28 rounded-md bg-raised animate-pulse" />
          <span className="h-8 w-24 rounded-md bg-raised animate-pulse" />
          <span className="h-8 w-32 rounded-md bg-raised animate-pulse" />
        </div>
      )}
      <UtcClock />
      <span aria-hidden="true" className="h-6 w-px bg-line mx-1" />
      <CrewSelector />
    </header>
  );
}
