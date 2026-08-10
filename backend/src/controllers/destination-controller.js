import {
  getAllDestinations,
  getDestinationById
} from "../services/destination-service.js";
import { sendJson } from "../utils/http.js";

export function listDestinations(_request, response) {
  sendJson(response, 200, {
    data: getAllDestinations()
  });
}

export function getDestination(_request, response, params) {
  const destination = getDestinationById(params.id);

  if (!destination) {
    sendJson(response, 404, { error: "Destination not found." });
    return;
  }

  sendJson(response, 200, { data: destination });
}
