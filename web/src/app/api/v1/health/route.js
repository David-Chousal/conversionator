import { connection } from "next/server";
import { getDb } from "../../../../lib/server/mvp-db.mjs";


export async function GET() {
  await connection();
  const db = getDb();
  db.prepare("SELECT 1").get();
  return Response.json({ status: "ok", database: "sqlite" });
}
