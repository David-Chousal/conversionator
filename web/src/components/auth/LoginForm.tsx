"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface LoginFormProps {
  workspaceName: string;
}

// Sign-in UI only; until auth exists, submitting goes straight to the board.
export function LoginForm({ workspaceName }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/analytics");
  }

  return (
    <form className="cor-login__form" onSubmit={onSubmit}>
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
          <button className="cor-input-wrap__end" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)} style={{ cursor: "pointer" }}>
            <Icon name="eye" />
          </button>
        </span>
      </label>
      <button className="cor-key cor-key--primary" type="submit" style={{ justifyContent: "space-between" }}>Sign in <kbd>⏎</kbd></button>
      <span className="cor-help">New here? Ask your workspace admin for an invite.</span>
    </form>
  );
}
