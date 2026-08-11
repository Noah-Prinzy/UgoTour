import { createServer } from "node:http";
import database from "./database/connection.js";
import { router } from "./router.js";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const server = createServer((request, response) => {
  void router(request, response);
});

server.requestTimeout = 20_000;
server.headersTimeout = 25_000;
server.keepAliveTimeout = 5_000;

server.listen(PORT, HOST, () => {
  console.log(`UgoTour API running at http://${HOST}:${PORT}`);
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
