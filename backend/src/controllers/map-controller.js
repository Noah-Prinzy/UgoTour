import { getMapLocations } from "../services/map-service.js";
import { sendJson } from "../utils/http.js";

export async function listMapLocations(_request, response) {
  sendJson(response, 200, { data: await getMapLocations() });
}
