import { apiRequest } from "../api.js";

export async function getAdminSummary() {
  return (await apiRequest("/admin/summary", { authenticated:true })).data;
}
export async function getAdminPlaces(type) {
  return (await apiRequest(`/admin/places?type=${encodeURIComponent(type)}`, { authenticated:true })).data;
}
export async function createAdminDestination(data) {
  return (await apiRequest("/admin/destinations", { method:"POST", authenticated:true, body:data })).data;
}
export async function updateAdminDestination(id, data) {
  return apiRequest(`/admin/destinations/${Number(id)}`, { method:"PATCH", authenticated:true, body:data });
}
export async function createAdminAttraction(data) {
  return (await apiRequest("/admin/attractions", { method:"POST", authenticated:true, body:data })).data;
}
export async function updateAdminAttraction(id, data) {
  return apiRequest(`/admin/attractions/${Number(id)}`, { method:"PATCH", authenticated:true, body:data });
}
export async function getAdminMessages() {
  return (await apiRequest("/admin/contact-messages", { authenticated:true })).data;
}
export async function updateAdminMessage(id, status) {
  return (await apiRequest(`/admin/contact-messages/${Number(id)}`, { method:"PATCH", authenticated:true, body:{ status } })).data;
}
