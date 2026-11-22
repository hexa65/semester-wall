import { useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Header } from "../components/layout/Header";
import { Toast } from "../components/ui/Toast";
import type { ToastState } from "../types/toast";

// location.state is `unknown`, so we check its shape before using it.
function readToast(state: unknown): ToastState | null {
  if (typeof state !== "object" || state === null || !("toast" in state)) return null;
  const toast = state.toast;
  if (typeof toast !== "object" || toast === null) return null;
  if (!("message" in toast) || typeof toast.message !== "string") return null;
  if (!("variant" in toast) || (toast.variant !== "success" && toast.variant !== "error")) return null;
  return { message: toast.message, variant: toast.variant };
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = readToast(location.state);
  const here = `${location.pathname}${location.search}`;

  // Clearing the state removes the toast. The function only changes when the address changes.
  const close = useCallback(() => {
    void navigate(here, { replace: true, state: null });
  }, [navigate, here]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:font-semibold focus:text-paper"
      >
        Skip to the page content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 focus:outline-none">
        <Outlet />
      </main>
      <Toast toast={toast} onClose={close} />
    </>
  );
}
