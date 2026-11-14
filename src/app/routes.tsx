import { Navigate, type RouteObject } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { ModulePlaceholder, NotFound } from "./shell/ModulePlaceholder";

export const moduleRoutes: RouteObject[] = [
  { path: "crew/*",      element: <ModulePlaceholder module="crew" /> },       // Module 1 replaces with <CrewModule />
  { path: "anatomy/*",   element: <ModulePlaceholder module="anatomy" /> },    // Module 2 replaces with <AnatomyModule />
  { path: "assistant/*", element: <ModulePlaceholder module="assistant" /> },  // Module 3 replaces with <AssistantModule />
  { path: "evidence/*",  element: <ModulePlaceholder module="evidence" /> },   // Module 4 replaces with <EvidenceModule />
];

export const appRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/crew" replace /> },
  {
    element: <AppShell />,
    children: [...moduleRoutes, { path: "*", element: <NotFound /> }],
  },
];
