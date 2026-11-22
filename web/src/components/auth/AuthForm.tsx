import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router";
import type { AuthFormValues } from "../../types/auth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface AuthFormProps {
  mode: "login" | "register";
  busy: boolean;
  serverError?: string | null; // for example "Email or password is incorrect."
  onSubmit: (values: AuthFormValues) => void;
}

type Errors = Partial<Record<keyof AuthFormValues, string>>;

export function AuthForm({ mode, busy, serverError, onSubmit }: AuthFormProps) {
  const isRegister = mode === "register";
  const [values, setValues] = useState<AuthFormValues>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    if (name === "name" || name === "email" || name === "password") setValues((v) => ({ ...v, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) found.email = "Enter a valid email address.";
    if (isRegister && values.password.length < 8) found.password = "Use at least 8 characters.";
    if (!isRegister && values.password === "") found.password = "Enter your password.";
    if (isRegister && values.name.length > 60) found.name = "Keep your name under 60 characters.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({ name: values.name.trim(), email: values.email.trim(), password: values.password });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 border-2 border-ink bg-sheet p-5">
      {isRegister ? (
        <Input label="Your name (optional)" name="name" value={values.name} onChange={handleChange} error={errors.name} autoComplete="name" />
      ) : null}
      <Input
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
        hint={isRegister ? "At least 8 characters." : undefined}
        autoComplete={isRegister ? "new-password" : "current-password"}
      />
      {serverError ? (
        <p role="alert" className="border-2 border-l-8 border-pin p-2 font-semibold text-pin">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? (isRegister ? "Creating account..." : "Logging in...") : isRegister ? "Create account" : "Log in"}
      </Button>
      <p className="text-center">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link to={isRegister ? "/login" : "/register"} className="inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4">
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
