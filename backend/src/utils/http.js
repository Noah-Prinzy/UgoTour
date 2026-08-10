export function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}
export function sendNoContent(response) { response.writeHead(204); response.end(); }
export async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_200_000) { const error = new Error("Request body is too large."); error.statusCode=413; throw error; }
  }
  if (!body) return {};
  try { return JSON.parse(body); } catch { const error = new Error("Request body must contain valid JSON."); error.statusCode=400; throw error; }
}
export function getBearerToken(request) {
  const authorization = request.headers.authorization ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}
