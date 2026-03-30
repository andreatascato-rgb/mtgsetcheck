import { useCallback } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ToastProvider, useToast } from "./contexts/ToastContext";

function AppContent() {
  const { showToast } = useToast();
  const onStorageError = useCallback(
    (message: string) => showToast({ kind: "err", message }),
    [showToast],
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AppShell onStorageError={onStorageError} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
