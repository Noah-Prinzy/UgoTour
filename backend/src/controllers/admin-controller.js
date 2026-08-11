import { requireAdmin } from "../middleware/auth.js";
import {
  createAdminAttraction, createAdminDestination, getAdminSummary, listAdminPlaces,
  listContactMessages, updateAdminAttraction, updateAdminDestination, updateContactMessageStatus
} from "../services/admin-service.js";
import { readJsonBody, sendJson } from "../utils/http.js";

export async function adminSummary(request, response) {
  await requireAdmin(request);
  sendJson(response, 200, { data: await getAdminSummary() });
}

export async function adminPlaces(request, response, _params, url) {
  await requireAdmin(request);
  const type = url.searchParams.get("type") === "attraction" ? "attraction" : "destination";
  sendJson(response, 200, { data: await listAdminPlaces(type) });
}

export async function adminCreateDestination(request, response) {
  await requireAdmin(request);
  const id = await createAdminDestination(await readJsonBody(request));
  sendJson(response, 201, { data: { id } });
}

export async function adminUpdateDestination(request, response, params) {
  await requireAdmin(request);
  const updated = await updateAdminDestination(params.id, await readJsonBody(request));
  if (!updated) return sendJson(response, 404, { error: "Destination not found." });
  sendJson(response, 200, { message: "Destination updated." });
}

export async function adminCreateAttraction(request, response) {
  await requireAdmin(request);
  const id = await createAdminAttraction(await readJsonBody(request));
  sendJson(response, 201, { data: { id } });
}

export async function adminUpdateAttraction(request, response, params) {
  await requireAdmin(request);
  const updated = await updateAdminAttraction(params.id, await readJsonBody(request));
  if (!updated) return sendJson(response, 404, { error: "Attraction not found." });
  sendJson(response, 200, { message: "Attraction updated." });
}

export async function adminMessages(request, response) {
  await requireAdmin(request);
  sendJson(response, 200, { data: await listContactMessages() });
}

export async function adminUpdateMessage(request, response, params) {
  await requireAdmin(request);
  const body = await readJsonBody(request);
  const updated = await updateContactMessageStatus(params.id, body.status);
  if (!updated) return sendJson(response, 404, { error: "Message not found." });
  sendJson(response, 200, { data: updated });
}
