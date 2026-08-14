// ============================================================
// HTTP SECURITY + REQUEST LOGGING MIDDLEWARE
// Adds common security headers and a request id, then emits structured logs when
// a request finishes.
// ============================================================

import { randomUUID } from "node:crypto";

// Attach a traceable request id and security-focused response headers before a
// controller handles the request.
export function applySecurityHeaders(request, response) {
  const requestId = String(request.headers["x-request-id"] || randomUUID());
  request.requestId = requestId;
  response.setHeader("X-Request-ID", requestId);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.setHeader("Cache-Control", "no-store");
}

// Log the request after the response completes. JSON logs are easy for hosting
// platforms and log processors to search by requestId/status/path.
export function logRequest(request, response, startedAt) {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  const entry = {
    level: "info",
    type: "http_request",
    requestId: request.requestId,
    method: request.method,
    path: request.url?.split("?")[0],
    status: response.statusCode,
    durationMs: Number(durationMs.toFixed(1)),
    at: new Date().toISOString()
  };
  console.log(JSON.stringify(entry));
}
