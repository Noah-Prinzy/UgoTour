import { createServer } from "node:http";
import { URL } from "node:url";
import database from "./database/connection.js";
import { router } from "./router.js";
import { serveStaticSite } from "./static-site.js";

const PORT = Number(process.env.PORT) || 3000;
// Local development stays on loopback. Production hosts such as Railway need
// the process to accept traffic on every interface.
const HOST = process.env.HOST || (process.env.APP_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

const server = createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const isApiRequest = url.pathname === "/health" || url.pathname.startsWith("/api/");

  if (isApiRequest) {
    void router(request, response);
    return;
  }

  // In production the PWA is served by the same Node process as the REST API.
  // This avoids third-party-cookie/CORS problems and gives UgoTour one origin.
  serveStaticSite(request, response, url);
});

server.requestTimeout = 20_000;
server.headersTimeout = 25_000;
server.keepAliveTimeout = 5_000;

server.listen(PORT, HOST, () => {
  console.log(`UgoTour running at http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing UgoTour gracefully...`);
  server.close(async () => {
    await database.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  void shutdown("uncaughtException");
});
