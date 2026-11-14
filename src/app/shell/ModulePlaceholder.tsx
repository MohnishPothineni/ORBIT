import { useEffect } from "react";
import { Card } from "../../shared/ui/Card";
import { ICON_STROKE } from "../../shared/ui/cn";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import { MODULE_BY_KEY, type ModuleKey } from "./modules";

/** Rendered for modules that are not built yet. */
export function ModulePlaceholder({ module }: { module: ModuleKey }) {
  const meta = MODULE_BY_KEY[module];
  const Icon = meta.icon;

  useEffect(() => {
    document.title = `${meta.label} · ORBIT`;
  }, [meta.label]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-5">
      <SectionHeader title={meta.label} subtitle="Not available on this build." />
      <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Icon size={24} strokeWidth={ICON_STROKE} aria-hidden="true" className="text-ink-3" />
        <p className="text-md font-semibold text-ink">This module is not built yet</p>
        <p className="font-mono text-xs text-ink-3">{meta.route}</p>
      </Card>
    </div>
  );
}

/** Suspense fallback while a lazily loaded module downloads. */
export function ModuleSkeleton() {
  return (
    <div role="status" aria-label="Loading module" aria-busy="true" className="mx-auto max-w-[1600px] px-6 py-5">
      <div className="flex items-end justify-between gap-4 pb-5 mb-5 border-b border-line">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-56 rounded-md bg-raised animate-pulse" />
          <div className="h-5 w-80 rounded-md bg-raised animate-pulse" />
        </div>
        <div className="h-11 w-36 rounded-md bg-raised animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <div className="h-[220px] rounded-lg bg-raised animate-pulse" />
          <div className="h-[420px] rounded-lg bg-raised animate-pulse" />
        </div>
        <div className="h-[420px] rounded-lg bg-raised animate-pulse" />
      </div>
    </div>
  );
}

export function NotFound() {
  useEffect(() => {
    document.title = "Not found · ORBIT";
  }, []);
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-5">
      <SectionHeader title="Page not found" subtitle="This address does not match any module on this device." />
      <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <p className="text-md font-semibold text-ink">Nothing here</p>
        <p className="text-sm text-ink-2">Choose a module from the sidebar.</p>
        <p className="font-mono text-xs text-ink-3">{window.location.pathname}</p>
      </Card>
    </div>
  );
}
