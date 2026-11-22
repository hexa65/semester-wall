import { Navigate, Outlet } from "react-router";
import { ErrorState } from "../components/ui/States";
import { Loading, Skeleton } from "../components/ui/Skeleton";
import { useMe } from "../hooks/useAuth";
import { hasToken } from "../lib/authStorage";
import { getErrorMessage } from "../lib/errors";

// A gate in front of every page that needs a login.
// No saved token: go to /login. Otherwise ask the API who we are before showing anything.
export function RequireAuth() {
  const me = useMe();
  if (!hasToken()) return <Navigate to="/login" replace />;

  if (me.isPending) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <Loading label="Checking your login">
          <Skeleton className="h-12" />
        </Loading>
      </div>
    );
  }
  if (me.isError) {
    // A 401 is handled by the API client (it clears the token and redirects). Anything else is a network problem.
    return (
      <div className="mx-auto max-w-xl p-4">
        <ErrorState message={getErrorMessage(me.error)} onRetry={() => void me.refetch()} />
      </div>
    );
  }
  return <Outlet />;
}
