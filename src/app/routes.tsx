import { lazy, Suspense } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { ModulePlaceholder, ModuleSkeleton, NotFound } from "./shell/ModulePlaceholder";

const AssistantModule = lazy(() => import("../modules/assistant/components/AssistantModule"));

export const moduleRoutes: RouteObject[] = [
  { path: "crew/*",      element: <ModulePlaceholder module="crew" /> },       // Module 1 replaces with <CrewModule />
  { path: "anatomy/*",   element: <ModulePlaceholder module="anatomy" /> },    // Module 2 replaces with <AnatomyModule />
  { path: "assistant/*", element: <Suspense fallback={<ModuleSkeleton />}><AssistantModule /></Suspense> },  // Module 3
  { path: "evidence/*",  element: <ModulePlaceholder module="evidence" /> },   // Module 4 replaces with <EvidenceModule />
];

export const appRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/crew" replace /> },
  {
    element: <AppShell />,
    children: [...moduleRoutes, { path: "*", element: <NotFound /> }],
  },
];
