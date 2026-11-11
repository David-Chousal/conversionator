import { keyHasScope } from "./mvp-db.mjs";

export function authorize(request, scope = "read") {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : request.headers.get("x-api-key") || "";
  if (keyHasScope(token, scope)) return null;
  return Response.json({ error: "A valid API key with the required access is needed" }, { status: 401 });
}

export function invalidQuery(error) {
  return Response.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
}
