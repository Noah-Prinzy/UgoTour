import { sendJson } from "../utils/http.js";

export function getHealth(_request, response) {
  sendJson(response, 200, {
    status: "ok",
    message: "UgoTour API is running",
    phase: 5
  });
}
