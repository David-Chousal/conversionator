"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendClient, TOKEN_COOKIE_NAME } from "@/lib/data/backend-connection";

export type LoginState = { error?: string };

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24, // matches the backend's 1-day token lifetime
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const backend = backendClient();
  if (!backend) return { error: "The backend isn't configured for this deployment." };

  const username = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const token = await backend.login(username, password);
  if (!token) return { error: "Wrong email or password." };

  (await cookies()).set(TOKEN_COOKIE_NAME, token, COOKIE_OPTIONS);
  redirect("/analytics");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE_NAME)?.value;
  // Best-effort revoke on the backend; clear the local session regardless.
  await backendClient()?.logout(token ?? "").catch(() => undefined);
  jar.delete(TOKEN_COOKIE_NAME);
  redirect("/login");
}
