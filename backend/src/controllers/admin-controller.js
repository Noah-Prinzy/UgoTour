// ============================================================
// ADMIN CONTROLLER
// Protects administrator-only API endpoints, reads request input, and delegates
// tourism-record/contact-message work to the admin service.
// ============================================================

// Admin authorization is checked before every handler performs privileged work.
import { requireAdmin } from "../middleware/auth.js";
import {
  createAdminAttraction, createAdminDestination, getAdminSummary, listAdminPlaces,
  listContactMessages, updateAdminAttraction, updateAdminDestination, updateContactMessageStatus
} from "../services/admin-service.js";
import { readJsonBody, sendJson } from "../utils/http.js";

// GET /api/admin/summary — dashboard totals and overview information.
export async function adminSummary(request, response) {
  await requireAdmin(request);
  sendJson(response, 200, { data: await getAdminSummary() });
}

// GET /api/admin/places?type=... — choose which tourism record type to list.
export async function adminPlaces(request, response, _params, url) {
  await requireAdmin(request);
  const type = url.searchParams.get("type") === "attraction" ? "attraction" : "destination";
  sendJson(response, 200, { data: await listAdminPlaces(type) });
}

// POST /api/admin/destinations — create a destination from the JSON request body.
export async function adminCreateDestination(request, response) {
  await requireAdmin(request);
  const id = await createAdminDestination(await readJsonBody(request));
  sendJson(response, 201, { data: { id } });
}

// PATCH /api/admin/destinations/:id — update an existing destination.
export async function adminUpdateDestination(request, response, params) {
  await requireAdmin(request);
  const updated = await updateAdminDestination(params.id, await readJsonBody(request));
  if (!updated) return sendJson(response, 404, { error: "Destination not found." });
  sendJson(response, 200, { message: "Destination updated." });
}

// POST /api/admin/attractions — create a new attraction record.
export async function adminCreateAttraction(request, response) {
  await requireAdmin(request);
  const id = await createAdminAttraction(await readJsonBody(request));
  sendJson(response, 201, { data: { id } });
}

// PATCH /api/admin/attractions/:id — edit an existing attraction record.
export async function adminUpdateAttraction(request, response, params) {
  await requireAdmin(request);
  const updated = await updateAdminAttraction(params.id, await readJsonBody(request));
  if (!updated) return sendJson(response, 404, { error: "Attraction not found." });
  sendJson(response, 200, { message: "Attraction updated." });
}

// GET /api/admin/contact-messages — load visitor messages for moderation/support.
export async function adminMessages(request, response) {
  await requireAdmin(request);
  sendJson(response, 200, { data: await listContactMessages() });
}

// PATCH /api/admin/contact-messages/:id — change a message's workflow status.
export async function adminUpdateMessage(request, response, params) {
  await requireAdmin(request);
  const body = await readJsonBody(request);
  const updated = await updateContactMessageStatus(params.id, body.status);
  if (!updated) return sendJson(response, 404, { error: "Message not found." });
  sendJson(response, 200, { data: updated });
}
