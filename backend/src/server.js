import { createServer } from "node:http";
import { router } from "./router.js";

// PORT can later come from an environment variable on a cloud host.
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const server = createServer((request, response) => {
  router(request, response);
});

server.listen(PORT, HOST, () => {
  console.log(`UgoTour API running at http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});
