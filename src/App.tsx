import { useRoutes } from "react-router-dom";
import { appRoutes } from "./app/routes";
import { CrewProvider } from "./shared/context/CrewContext";
import { SystemStatusProvider } from "./shared/context/SystemStatusContext";
import { ToastProvider } from "./shared/ui/Toast";

function AppRoutes() {
  return useRoutes(appRoutes);
}

export default function App() {
  return (
    <ToastProvider>
      <SystemStatusProvider>
        <CrewProvider>
          <AppRoutes />
        </CrewProvider>
      </SystemStatusProvider>
    </ToastProvider>
  );
}
