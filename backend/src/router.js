import { URL } from "node:url";
import {
  adminCreateAttraction, adminCreateDestination, adminMessages, adminPlaces, adminSummary,
  adminUpdateAttraction, adminUpdateDestination, adminUpdateMessage
} from "./controllers/admin-controller.js";
import { getAttraction, listAttractions, listDestinationAttractions } from "./controllers/attraction-controller.js";
import { loginUser, logoutUser, signup } from "./controllers/auth-controller.js";
import { deleteBooking, listBookings, postBooking } from "./controllers/booking-controller.js";
import { postContactMessage } from "./controllers/contact-controller.js";
import { getDestination, listDestinations } from "./controllers/destination-controller.js";
import { getHealth } from "./controllers/health-controller.js";
import { listMapLocations } from "./controllers/map-controller.js";
import { confirmReset, requestReset } from "./controllers/password-reset-controller.js";
import { getProfile, patchPassword, patchProfile, patchProfilePhoto } from "./controllers/profile-controller.js";
import { createSaved, deleteSaved, getSavedStatus, listSaved } from "./controllers/saved-controller.js";
import { applyCors, enforceTrustedWriteOrigin } from "./middleware/cors.js";
import { generalRateLimit } from "./middleware/rate-limit.js";
import { applySecurityHeaders, logRequest } from "./middleware/security.js";
import { sendJson } from "./utils/http.js";

const routes = [
  { method:"GET", pattern:/^\/health$/, handler:getHealth },
  { method:"GET", pattern:/^\/api\/destinations$/, handler:listDestinations },
  { method:"GET", pattern:/^\/api\/destinations\/(?<id>\d+)$/, handler:getDestination },
  { method:"GET", pattern:/^\/api\/destinations\/(?<id>\d+)\/attractions$/, handler:listDestinationAttractions },
  { method:"GET", pattern:/^\/api\/attractions$/, handler:listAttractions },
  { method:"GET", pattern:/^\/api\/attractions\/(?<id>\d+)$/, handler:getAttraction },
  { method:"GET", pattern:/^\/api\/map\/locations$/, handler:listMapLocations },

  { method:"POST", pattern:/^\/api\/auth\/signup$/, handler:signup },
  { method:"POST", pattern:/^\/api\/auth\/login$/, handler:loginUser },
  { method:"POST", pattern:/^\/api\/auth\/logout$/, handler:logoutUser },
  { method:"POST", pattern:/^\/api\/auth\/password-reset\/request$/, handler:requestReset },
  { method:"POST", pattern:/^\/api\/auth\/password-reset\/confirm$/, handler:confirmReset },

  { method:"GET", pattern:/^\/api\/profile$/, handler:getProfile },
  { method:"PATCH", pattern:/^\/api\/profile$/, handler:patchProfile },
  { method:"PATCH", pattern:/^\/api\/profile\/photo$/, handler:patchProfilePhoto },
  { method:"PATCH", pattern:/^\/api\/profile\/password$/, handler:patchPassword },

  { method:"GET", pattern:/^\/api\/bookings$/, handler:listBookings },
  { method:"POST", pattern:/^\/api\/bookings$/, handler:postBooking },
  { method:"DELETE", pattern:/^\/api\/bookings\/(?<id>\d+)$/, handler:deleteBooking },

  { method:"GET", pattern:/^\/api\/saved$/, handler:listSaved },
  { method:"GET", pattern:/^\/api\/saved\/status$/, handler:getSavedStatus },
  { method:"POST", pattern:/^\/api\/saved$/, handler:createSaved },
  { method:"DELETE", pattern:/^\/api\/saved\/(?<placeType>destination|attraction)\/(?<id>\d+)$/, handler:deleteSaved },

  { method:"POST", pattern:/^\/api\/contact$/, handler:postContactMessage },

  { method:"GET", pattern:/^\/api\/admin\/summary$/, handler:adminSummary },
  { method:"GET", pattern:/^\/api\/admin\/places$/, handler:adminPlaces },
  { method:"POST", pattern:/^\/api\/admin\/destinations$/, handler:adminCreateDestination },
  { method:"PATCH", pattern:/^\/api\/admin\/destinations\/(?<id>\d+)$/, handler:adminUpdateDestination },
  { method:"POST", pattern:/^\/api\/admin\/attractions$/, handler:adminCreateAttraction },
  { method:"PATCH", pattern:/^\/api\/admin\/attractions\/(?<id>\d+)$/, handler:adminUpdateAttraction },
  { method:"GET", pattern:/^\/api\/admin\/contact-messages$/, handler:adminMessages },
  { method:"PATCH", pattern:/^\/api\/admin\/contact-messages\/(?<id>\d+)$/, handler:adminUpdateMessage }
];

export async function router(request, response) {
  const startedAt = process.hrtime.bigint();
  applySecurityHeaders(request, response);
  applyCors(request, response);
  response.once("finish", () => logRequest(request, response, startedAt));

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    enforceTrustedWriteOrigin(request);
    generalRateLimit(request);
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
    const route = routes.find((candidate) => candidate.method === request.method && candidate.pattern.test(url.pathname));
    if (!route) return sendJson(response, 404, { error:"Route not found.", method:request.method, path:url.pathname });
    const match = url.pathname.match(route.pattern);
    const params = match?.groups ?? {};
    await route.handler(request, response, params, url);
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;
    if (error.retryAfter) response.setHeader("Retry-After", String(error.retryAfter));
    console.error(JSON.stringify({
      level: "error",
      type: "request_error",
      requestId: request.requestId,
      status: statusCode,
      message: error.message,
      stack: process.env.APP_ENV === "production" ? undefined : error.stack,
      at: new Date().toISOString()
    }));
    if (!response.headersSent) {
      sendJson(response, statusCode, { error: statusCode === 500 ? "Internal server error." : error.message });
    } else if (!response.writableEnded) {
      response.end();
    }
  }
}
