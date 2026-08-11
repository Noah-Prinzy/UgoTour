import { getSessionToken } from "./cookies.js";

export function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

export function sendNoContent(response) {
  response.writeHead(204);
  response.end();
}

export async function readJsonBody(request) {
  let body = "";
  const maxBytes = Math.max(16_384, Number(process.env.MAX_JSON_BODY_BYTES || 900_000));
  let byteLength = 0;

  for await (const chunk of request) {
    byteLength += chunk.length;
    if (byteLength > maxBytes) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    body += chunk;
  }

  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must contain valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

// Kept for compatibility with older modules. New browser sessions use an
// HttpOnly cookie, while command-line/API clients may still send Bearer tokens.
export function getBearerToken(request) {
  return getSessionToken(request);
}
