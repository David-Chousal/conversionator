import { DataSourceError, dataSource } from "@/lib/data";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const UNEXPECTED = "Something went wrong on our side. Try again in a moment.";

async function requireAdmin(): Promise<void> {
  const user = await dataSource.getCurrentUser();
  if (user.role !== "admin") throw new DataSourceError("not_found", "Only admins can change this.");
}

/** Runs an operation, turning expected failures into messages and logging the rest. */
export async function runAsUser<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    if (error instanceof DataSourceError) return { ok: false, message: error.message };
    console.error("Action failed", error);
    return { ok: false, message: UNEXPECTED };
  }
}

/** Like runAsUser, for operations only admins may perform. */
export async function runAdmin<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  return runAsUser(async () => {
    await requireAdmin();
    return operation();
  });
}
