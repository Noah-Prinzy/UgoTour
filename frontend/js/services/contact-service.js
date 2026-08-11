import { apiRequest } from "../api.js";

export async function sendContactMessage(input) {
  const payload = await apiRequest("/contact", { method:"POST", body:input });
  return payload;
}
