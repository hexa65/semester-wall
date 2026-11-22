import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { AuthForm } from "../components/auth/AuthForm";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegister } from "../hooks/useAuth";
import { AuthLayout } from "../layouts/AuthLayout";
import { hasToken } from "../lib/authStorage";
import { getErrorMessage } from "../lib/errors";
import type { AuthFormValues } from "../types/auth";

export function RegisterPage() {
  useDocumentTitle("Create an account");
  const navigate = useNavigate();
  const register = useRegister();
  const [error, setError] = useState<string | null>(null);

  if (hasToken() && !register.isPending) return <Navigate to="/" replace />;

  function handleSubmit(values: AuthFormValues) {
    setError(null);
    register.mutate(values, {
      onSuccess: () => void navigate("/", { replace: true }),
      onError: (e) => setError(getErrorMessage(e)),
    });
  }

  return (
    <AuthLayout title="Create an account" intro="Each account has its own planner, so nobody overwrites anyone else's schedule.">
      <AuthForm mode="register" busy={register.isPending} serverError={error} onSubmit={handleSubmit} />
    </AuthLayout>
  );
}
