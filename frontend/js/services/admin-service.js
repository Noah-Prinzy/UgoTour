// ============================================================
// FRONTEND ADMIN API SERVICE
// Thin browser-side wrappers around /api/admin/* endpoints. Admin page code calls
// these functions instead of constructing fetch requests itself.
// ============================================================

import { apiRequest } from "../api.js";

// Load dashboard totals (users, destinations, attractions, trips, etc.).
export async function getAdminSummary() {
  return (await apiRequest("/admin/summary", { authenticated:true })).data;
}

// Load either destination or attraction rows for the admin editor.
export async function getAdminPlaces(type) {
  return (await apiRequest(`/admin/places?type=${encodeURIComponent(type)}`, { authenticated:true })).data;
}

// Create a destination and return the backend's new-record payload.
export async function createAdminDestination(data) {
  return (await apiRequest("/admin/destinations", { method:"POST", authenticated:true, body:data })).data;
}

// Patch only the supplied fields on an existing destination.
export async function updateAdminDestination(id, data) {
  return apiRequest(`/admin/destinations/${Number(id)}`, { method:"PATCH", authenticated:true, body:data });
}

// Create a new attraction record.
export async function createAdminAttraction(data) {
  return (await apiRequest("/admin/attractions", { method:"POST", authenticated:true, body:data })).data;
}

// Patch an existing attraction record.
export async function updateAdminAttraction(id, data) {
  return apiRequest(`/admin/attractions/${Number(id)}`, { method:"PATCH", authenticated:true, body:data });
}

// Load Contact-form messages for the admin inbox.
export async function getAdminMessages() {
  return (await apiRequest("/admin/contact-messages", { authenticated:true })).data;
}

// Mark an admin message as new/read/closed.
export async function updateAdminMessage(id, status) {
  return (await apiRequest(`/admin/contact-messages/${Number(id)}`, { method:"PATCH", authenticated:true, body:{ status } })).data;
}
