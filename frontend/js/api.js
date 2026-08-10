// Central location for REST API requests.
// We will point this to the UgoTour Node.js backend when Phase 2 begins.
export const API_BASE_URL = "http://localhost:8080/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}
