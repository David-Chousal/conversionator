"use client";

import { useActionState, useState, type FormEvent } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";
import { Icon } from "@/components/ui/Icon";

interface LoginFormProps {
  workspaceName: string;
}

export function LoginForm({ workspaceName }: LoginFormProps) {
  const [state, submit, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  function toggleVisibility(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault();
    setShowPassword((shown) => !shown);
  }

  return (
    <form className="cor-login__form" action={submit}>
      <div style={{ display: "grid", gap: "var(--space-1)" }}>
        <h2 style={{ margin: 0, font: "700 24px/28px var(--font-sans)", letterSpacing: "-.02em" }}>Sign in to {workspaceName}</h2>
        <span className="cor-help">Use your work email.</span>
      </div>
      <label className="cor-fieldset">
        <span className="cor-fieldset__label"><span className="cor-tag">Work email</span></span>
        <input className="cor-input" id="login-email" name="email" type="email" autoComplete="username" required />
      </label>
      <label className="cor-fieldset">
        <span className="cor-fieldset__label">
          <span className="cor-tag">Password</span>
          <a className="cor-link" href="#forgot" style={{ fontSize: 12 }}>Forgot password?</a>
        </span>
        <span className="cor-input-wrap">
          <input className="cor-input" id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required style={{ paddingLeft: "var(--space-3)" }} />
          <button className="cor-input-wrap__end" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={toggleVisibility} style={{ cursor: "pointer" }}>
            <Icon name="eye" />
          </button>
        </span>
      </label>
      {state.error && <p className="cor-help" role="alert" style={{ color: "var(--danger, crimson)" }}>{state.error}</p>}
      <button className="cor-key cor-key--primary" type="submit" disabled={pending} style={{ justifyContent: "space-between" }}>{pending ? "Signing in…" : "Sign in"} <kbd>⏎</kbd></button>
      <span className="cor-help">New here? Ask your workspace admin for an invite.</span>
    </form>
  );
}
