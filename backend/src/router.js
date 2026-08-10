import { URL } from "node:url";
import { loginUser, logoutUser, signup } from "./controllers/auth-controller.js";
import {
  deleteBooking,
  listBookings,
  postBooking
} from "./controllers/booking-controller.js";
import {
  getDestination,
  listDestinations
} from "./controllers/destination-controller.js";
import { getHealth } from "./controllers/health-controller.js";
import {
  getProfile,
  patchPassword,
  patchProfile
} from "./controllers/profile-controller.js";
import { applyCors } from "./middleware/cors.js";
import { sendJson } from "./utils/http.js";

// Small route table implemented entirely with JavaScript.
// No Express/NestJS router is used in this phase.
const routes = [
  { method: "GET", pattern: /^\/health$/, handler: getHealth },

  { method: "GET", pattern: /^\/api\/destinations$/, handler: listDestinations },
  { method: "GET", pattern: /^\/api\/destinations\/(?<id>\d+)$/, handler: getDestination },

  { method: "POST", pattern: /^\/api\/auth\/signup$/, handler: signup },
  { method: "POST", pattern: /^\/api\/auth\/login$/, handler: loginUser },
  { method: "POST", pattern: /^\/api\/auth\/logout$/, handler: logoutUser },

  { method: "GET", pattern: /^\/api\/profile$/, handler: getProfile },
  { method: "PATCH", pattern: /^\/api\/profile$/, handler: patchProfile },
  { method: "PATCH", pattern: /^\/api\/profile\/password$/, handler: patchPassword },

  { method: "GET", pattern: /^\/api\/bookings$/, handler: listBookings },
  { method: "POST", pattern: /^\/api\/bookings$/, handler: postBooking },
  { method: "DELETE", pattern: /^\/api\/bookings\/(?<id>\d+)$/, handler: deleteBooking }
];

export async function router(request, response) {
  applyCors(response);

  // Browser CORS preflight requests can end immediately.
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);

  const route = routes.find((candidate) => {
    return candidate.method === request.method && candidate.pattern.test(url.pathname);
  });

  if (!route) {
    sendJson(response, 404, {
      error: "Route not found.",
      method: request.method,
      path: url.pathname
    });
    return;
  }

  // Re-run match() after find() because RegExp.test() does not expose named groups.
  const match = url.pathname.match(route.pattern);
  const params = match?.groups ?? {};

  try {
    await route.handler(request, response, params, url);
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;

    console.error(error);

    sendJson(response, statusCode, {
      error: statusCode === 500 ? "Internal server error." : error.message
    });
  }
}
