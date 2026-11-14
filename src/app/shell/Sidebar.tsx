import { Info, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useCallback, useState } from "react";
import { NavLink } from "react-router-dom";
import { IconButton } from "../../shared/ui/Button";
import { cn, ICON_STROKE, TYPE } from "../../shared/ui/cn";
import { Dialog } from "../../shared/ui/Dialog";
import { Tooltip } from "../../shared/ui/Tooltip";
import { MODULES } from "./modules";

const SIDEBAR_KEY = "orbit.sidebar";
const VERSION = import.meta.env.VITE_APP_VERSION || "dev";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "collapsed";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    /* storage unavailable */
  }
}

function NavItems({ rail, onNavigate }: { rail: boolean; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {MODULES.map((m) => {
        const Icon = m.icon;
        const link = (
          <NavLink
            to={m.route}
            onClick={onNavigate}
            aria-label={rail ? m.label : undefined}
            className={({ isActive }) =>
              cn(
                "mx-2 h-11 px-3 rounded-md flex items-center gap-3 text-sm font-medium",
                rail && "justify-center px-0 w-11",
                isActive ? "bg-accent-tint text-ink" : "text-ink-2 hover:bg-raised hover:text-ink",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={ICON_STROKE} aria-hidden="true" className={cn("shrink-0", isActive && "text-accent")} />
                {!rail && <span className="truncate">{m.label}</span>}
              </>
            )}
          </NavLink>
        );
        return (
          <li key={m.key}>
            {rail ? (
              <Tooltip content={m.label} side="right">
                {link}
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface SidebarProps {
  /** `full` ≥1280px, `rail` 768–1279px, `drawer` below 768px. */
  mode: "full" | "rail" | "drawer";
  drawerOpen: boolean;
  onDrawerClose: () => void;
}

export function Sidebar({ mode, drawerOpen, onDrawerClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = useCallback(() => {
    setCollapsed((c) => {
      writeCollapsed(!c);
      return !c;
    });
  }, []);

  if (mode === "drawer") {
    return (
      <Dialog open={drawerOpen} onClose={onDrawerClose} title="Modules" placement="left" bodyClassName="p-0 flex flex-col">
        <nav aria-label="Modules" className="flex flex-1 flex-col pt-3">
          <NavItems rail={false} onNavigate={onDrawerClose} />
          <div className="mt-auto p-4 border-t border-line flex flex-col gap-1">
            <p className="text-2xs text-ink-3">Not a diagnostic device</p>
            <p className="font-mono text-2xs text-ink-3">{VERSION}</p>
          </div>
        </nav>
      </Dialog>
    );
  }

  const rail = mode === "rail" || collapsed;
  return (
    <nav aria-label="Modules" className={cn("bg-panel border-r border-line flex flex-col min-h-0 overflow-y-auto", rail ? "w-16" : "w-60")}>
      <p className={cn(TYPE.overline, rail ? "px-0 pt-4 pb-2 text-center" : "px-5 pt-4 pb-2")}>Modules</p>
      <NavItems rail={rail} />
      <div className={cn("mt-auto border-t border-line flex flex-col gap-2", rail ? "items-center p-2 py-4" : "p-4")}>
        {rail ? (
          <Tooltip content={`Not a diagnostic device · ${VERSION}`} side="right">
            <span tabIndex={0} aria-label={`Not a diagnostic device. Build ${VERSION}`} className="grid size-11 place-items-center rounded-md text-ink-3">
              <Info size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </span>
          </Tooltip>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-2xs text-ink-3">Not a diagnostic device</p>
            <p className="font-mono text-2xs text-ink-3">{VERSION}</p>
          </div>
        )}
        {mode === "full" && (
          <IconButton
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={toggle}
            tooltipSide="right"
            className={rail ? "" : "self-start"}
          />
        )}
      </div>
    </nav>
  );
}
