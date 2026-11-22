import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { AuthForm } from "../components/auth/AuthForm";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useLogin } from "../hooks/useAuth";
import { AuthLayout } from "../layouts/AuthLayout";
import { hasToken } from "../lib/authStorage";
import { getErrorMessage } from "../lib/errors";
import type { AuthFormValues } from "../types/auth";

export function LoginPage() {
  useDocumentTitle("Log in");
  const navigate = useNavigate();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  // Already logged in: nothing to do here.
  if (hasToken() && !login.isPending) return <Navigate to="/" replace />;

  function handleSubmit(values: AuthFormValues) {
    setError(null);
    login.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => void navigate("/", { replace: true }),
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  }

  return (
    <AuthLayout title="Log in" intro="Your courses, classes and deadlines are private to your account.">
      <AuthForm mode="login" busy={login.isPending} serverError={error} onSubmit={handleSubmit} />
    </AuthLayout>
  );
}
