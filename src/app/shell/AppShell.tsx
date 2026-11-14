import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MOCK_MODE } from "../../shared/api/mockMode";
import { SyntheticDataBanner } from "../../shared/ui/SyntheticDataBanner";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { TABLET, useMediaQuery, WIDE } from "./useMediaQuery";

export function AppShell() {
  const wide = useMediaQuery(WIDE);
  const tablet = useMediaQuery(TABLET);
  const mode = wide ? "full" : tablet ? "rail" : "drawer";
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="grid h-dvh grid-rows-[48px_auto_1fr] grid-cols-[auto_1fr] bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-2 focus:z-[80] focus:rounded-md focus:bg-accent focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-on-accent"
      >
        Skip to content
      </a>
      <StatusBar showNavButton={mode === "drawer"} onOpenNav={() => setDrawerOpen(true)} />
      <div className="col-span-2">{MOCK_MODE && <SyntheticDataBanner />}</div>
      {mode === "drawer" ? (
        <Sidebar mode="drawer" drawerOpen={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
      ) : null}
      {mode !== "drawer" && <Sidebar mode={mode} drawerOpen={false} onDrawerClose={() => {}} />}
      <main id="main" tabIndex={-1} className={mode === "drawer" ? "relative col-span-2 overflow-y-auto min-h-0 focus-visible:outline-none" : "relative overflow-y-auto min-h-0 min-w-0 focus-visible:outline-none"}>
        <Outlet />
      </main>
    </div>
  );
}
