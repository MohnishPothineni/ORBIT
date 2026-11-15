import { lazy, Suspense } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { ModuleSkeleton, NotFound } from "./shell/ModulePlaceholder";
import { SharedWorkspace } from "./shell/SharedWorkspace";

const AnatomyModule = lazy(() => import("../modules/anatomy/components/AnatomyModule"));
const AssistantModule = lazy(() => import("../modules/assistant/components/AssistantModule"));

export const moduleRoutes: RouteObject[] = [
  {
    path: "crew/*",
    element: <SharedWorkspace page="status" />,
  },
  {
    path: "anatomy/*",
    element: (
      <Suspense fallback={<ModuleSkeleton />}>
        <AnatomyModule />
      </Suspense>
    ),
  },
  {
    path: "assistant/*",
    element: (
      <Suspense fallback={<ModuleSkeleton />}>
        <AssistantModule />
      </Suspense>
    ),
  },
  {
    path: "evidence/*",
    element: <SharedWorkspace page="research" />,
  },
];
// App.tsx renders these. The merge of 'dhruv' (1868aa9) dropped this block; keep it.
export const appRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/assistant" replace /> },
  {
    element: <AppShell />,
    children: [...moduleRoutes, { path: "*", element: <NotFound /> }],
  },
];
