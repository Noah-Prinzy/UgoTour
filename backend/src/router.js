// ============================================================
// CENTRAL REST API ROUTER
// This file is the traffic director for every /api/* request. It maps an HTTP
// method + URL pattern to a controller, applies shared middleware, extracts route
// parameters and converts thrown application errors into JSON responses.
// ============================================================

import { URL } from "node:url";

// Controller imports are the endpoint handlers the route table can dispatch to.
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
import { getMapCapabilities, listMapLocations, nearbyMapPlaces, routeMap, searchMapPlaces } from "./controllers/map-controller.js";
import { confirmReset, requestReset } from "./controllers/password-reset-controller.js";
import { getFeedback, getProfile, patchFeedback, patchPassword, patchProfile, patchProfilePhoto } from "./controllers/profile-controller.js";
import { createSaved, deleteSaved, getSavedStatus, listSaved } from "./controllers/saved-controller.js";

// Middleware/utilities run around the matched controller rather than inside every handler.
import { applyCors, enforceTrustedWriteOrigin } from "./middleware/cors.js";
import { generalRateLimit } from "./middleware/rate-limit.js";
import { applySecurityHeaders, logRequest } from "./middleware/security.js";
import { sendJson } from "./utils/http.js";

// Each entry pairs one HTTP method with a regular-expression path and controller.
// Named regex groups (for example `(?<id>\d+)`) become the controller's params object.
const routes = [
  // Health + public tourism discovery endpoints.
  { method:"GET", pattern:/^\/health$/, handler:getHealth },
  { method:"GET", pattern:/^\/api\/destinations$/, handler:listDestinations },
  { method:"GET", pattern:/^\/api\/destinations\/(?<id>\d+)$/, handler:getDestination },
  { method:"GET", pattern:/^\/api\/destinations\/(?<id>\d+)\/attractions$/, handler:listDestinationAttractions },
  { method:"GET", pattern:/^\/api\/attractions$/, handler:listAttractions },
  { method:"GET", pattern:/^\/api\/attractions\/(?<id>\d+)$/, handler:getAttraction },

  // Interactive map discovery/routing endpoints.
  { method:"GET", pattern:/^\/api\/map\/locations$/, handler:listMapLocations },
  { method:"GET", pattern:/^\/api\/map\/capabilities$/, handler:getMapCapabilities },
  { method:"GET", pattern:/^\/api\/map\/search$/, handler:searchMapPlaces },
  { method:"GET", pattern:/^\/api\/map\/nearby$/, handler:nearbyMapPlaces },
  { method:"GET", pattern:/^\/api\/map\/route$/, handler:routeMap },
  { method:"POST", pattern:/^\/api\/map\/route$/, handler:routeMap },

  // Account authentication and password recovery.
  { method:"POST", pattern:/^\/api\/auth\/signup$/, handler:signup },
  { method:"POST", pattern:/^\/api\/auth\/login$/, handler:loginUser },
  { method:"POST", pattern:/^\/api\/auth\/logout$/, handler:logoutUser },
  { method:"POST", pattern:/^\/api\/auth\/password-reset\/request$/, handler:requestReset },
  { method:"POST", pattern:/^\/api\/auth\/password-reset\/confirm$/, handler:confirmReset },

  // Authenticated profile/account editing.
  { method:"GET", pattern:/^\/api\/profile$/, handler:getProfile },
  { method:"PATCH", pattern:/^\/api\/profile$/, handler:patchProfile },
  { method:"PATCH", pattern:/^\/api\/profile\/photo$/, handler:patchProfilePhoto },
  { method:"PATCH", pattern:/^\/api\/profile\/password$/, handler:patchPassword },
  { method:"GET", pattern:/^\/api\/profile\/feedback$/, handler:getFeedback },
  { method:"PATCH", pattern:/^\/api\/profile\/feedback$/, handler:patchFeedback },

  // Personal My Trips endpoints.
  { method:"GET", pattern:/^\/api\/bookings$/, handler:listBookings },
  { method:"POST", pattern:/^\/api\/bookings$/, handler:postBooking },
  { method:"DELETE", pattern:/^\/api\/bookings\/(?<id>\d+)$/, handler:deleteBooking },

  // Personal Favorites endpoints.
  { method:"GET", pattern:/^\/api\/saved$/, handler:listSaved },
  { method:"GET", pattern:/^\/api\/saved\/status$/, handler:getSavedStatus },
  { method:"POST", pattern:/^\/api\/saved$/, handler:createSaved },
  { method:"DELETE", pattern:/^\/api\/saved\/(?<placeType>destination|attraction)\/(?<id>\d+)$/, handler:deleteSaved },

  // Public Contact form submission.
  { method:"POST", pattern:/^\/api\/contact$/, handler:postContactMessage },

  // Administrator-only tourism/content-management endpoints.
  { method:"GET", pattern:/^\/api\/admin\/summary$/, handler:adminSummary },
  { method:"GET", pattern:/^\/api\/admin\/places$/, handler:adminPlaces },
  { method:"POST", pattern:/^\/api\/admin\/destinations$/, handler:adminCreateDestination },
  { method:"PATCH", pattern:/^\/api\/admin\/destinations\/(?<id>\d+)$/, handler:adminUpdateDestination },
  { method:"POST", pattern:/^\/api\/admin\/attractions$/, handler:adminCreateAttraction },
  { method:"PATCH", pattern:/^\/api\/admin\/attractions\/(?<id>\d+)$/, handler:adminUpdateAttraction },
  { method:"GET", pattern:/^\/api\/admin\/contact-messages$/, handler:adminMessages },
  { method:"PATCH", pattern:/^\/api\/admin\/contact-messages\/(?<id>\d+)$/, handler:adminUpdateMessage }
];

// Main request pipeline called by server.js for /health and /api/* traffic.
export async function router(request, response) {
  const startedAt = process.hrtime.bigint();

  // Apply headers/CORS immediately and arrange for a structured completion log.
  applySecurityHeaders(request, response);
  applyCors(request, response);
  response.once("finish", () => logRequest(request, response, startedAt));

  // Browsers send OPTIONS preflight requests before some cross-origin calls.
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    // Shared protections run before route matching/controller work.
    enforceTrustedWriteOrigin(request);
    generalRateLimit(request);

    // Find the first route whose HTTP method and pathname both match.
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
    const route = routes.find((candidate) => candidate.method === request.method && candidate.pattern.test(url.pathname));
    if (!route) return sendJson(response, 404, { error:"Route not found.", method:request.method, path:url.pathname });

    // Pull named regex groups out as route parameters, then call the controller.
    const match = url.pathname.match(route.pattern);
    const params = match?.groups ?? {};
    await route.handler(request, response, params, url);
  } catch (error) {
    // All thrown controller/service errors arrive here. Known statusCode values are
    // preserved; unexpected errors become a safe generic 500 in production.
    const statusCode = Number(error.statusCode) || 500;
    if (error.retryAfter) response.setHeader("Retry-After", String(error.retryAfter));
    console.error(JSON.stringify({ level:"error", type:"request_error", requestId:request.requestId, status:statusCode, message:error.message, stack:process.env.APP_ENV === "production" ? undefined : error.stack, at:new Date().toISOString() }));
    if (!response.headersSent) sendJson(response, statusCode, { error: statusCode === 500 ? "Internal server error." : error.message });
    else if (!response.writableEnded) response.end();
  }
}
