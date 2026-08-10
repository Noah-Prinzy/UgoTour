import { URL } from "node:url";
import { loginUser, logoutUser, signup } from "./controllers/auth-controller.js";
import { getAttraction, listAttractions, listDestinationAttractions } from "./controllers/attraction-controller.js";
import { deleteBooking, listBookings, postBooking } from "./controllers/booking-controller.js";
import { getDestination, listDestinations } from "./controllers/destination-controller.js";
import { getHealth } from "./controllers/health-controller.js";
import { listMapLocations } from "./controllers/map-controller.js";
import { getProfile, patchPassword, patchProfile, patchProfilePhoto } from "./controllers/profile-controller.js";
import { applyCors } from "./middleware/cors.js";
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
  { method:"GET", pattern:/^\/api\/profile$/, handler:getProfile },
  { method:"PATCH", pattern:/^\/api\/profile$/, handler:patchProfile },
  { method:"PATCH", pattern:/^\/api\/profile\/photo$/, handler:patchProfilePhoto },
  { method:"PATCH", pattern:/^\/api\/profile\/password$/, handler:patchPassword },
  { method:"GET", pattern:/^\/api\/bookings$/, handler:listBookings },
  { method:"POST", pattern:/^\/api\/bookings$/, handler:postBooking },
  { method:"DELETE", pattern:/^\/api\/bookings\/(?<id>\d+)$/, handler:deleteBooking }
];

export async function router(request, response) {
  applyCors(response);
  if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return; }
  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const route = routes.find((candidate) => candidate.method === request.method && candidate.pattern.test(url.pathname));
  if (!route) return sendJson(response, 404, { error:"Route not found.", method:request.method, path:url.pathname });
  const match = url.pathname.match(route.pattern); const params = match?.groups ?? {};
  try { await route.handler(request, response, params, url); }
  catch (error) { const statusCode = Number(error.statusCode) || 500; console.error(error); sendJson(response, statusCode, { error: statusCode === 500 ? "Internal server error." : error.message }); }
}
