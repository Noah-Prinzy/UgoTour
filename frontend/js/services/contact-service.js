// ============================================================
// FRONTEND CONTACT API SERVICE
// Keeps Contact-page code focused on form/UI behavior while this tiny wrapper
// owns the POST /api/contact request.
// ============================================================

import { apiRequest } from "../api.js";

// Send the already-collected Contact form object to the backend and return its response.
export async function sendContactMessage(input) {
  const payload = await apiRequest("/contact", { method:"POST", body:input });
  return payload;
}
