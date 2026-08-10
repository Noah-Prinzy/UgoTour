import { destinations } from "../data/destinations.js";

export function getAllDestinations() {
  return destinations.map((destination) => ({ ...destination }));
}

export function getDestinationById(destinationId) {
  const destination = destinations.find((item) => item.id === Number(destinationId));
  return destination ? { ...destination } : null;
}
