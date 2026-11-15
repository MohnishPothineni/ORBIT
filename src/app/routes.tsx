import { lazy, Suspense } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { ModuleSkeleton, NotFound } from "./shell/ModulePlaceholder";
import { SharedWorkspace } from "./shell/SharedWorkspace";

const AssistantModule = lazy(() => import("../modules/assistant/components/AssistantModule"));

export const moduleRoutes: RouteObject[] = [
  { path: "crew/*",      element: <SharedWorkspace page="status" /> },
  { path: "anatomy/*",   element: <SharedWorkspace page="anatomy" /> },
  { path: "assistant/*", element: <Suspense fallback={<ModuleSkeleton />}><AssistantModule /></Suspense> },  // Module 3
  { path: "evidence/*",  element: <SharedWorkspace page="research" /> },
];

export const appRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/assistant" replace /> },
  {
    element: <AppShell />,
    children: [...moduleRoutes, { path: "*", element: <NotFound /> }],
  },
];
