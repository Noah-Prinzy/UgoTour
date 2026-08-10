import {
  getAllDestinations,
  getDestinationById
} from "../services/destination-service.js";
import { sendJson } from "../utils/http.js";

// Controllers are asynchronous now because their services query PostgreSQL.
export async function listDestinations(_request, response) {
  sendJson(response, 200, {
    data: await getAllDestinations()
  });
}

export async function getDestination(_request, response, params) {
  const destination = await getDestinationById(params.id);

  if (!destination) {
    sendJson(response, 404, { error: "Destination not found." });
    return;
  }

  sendJson(response, 200, { data: destination });
}
