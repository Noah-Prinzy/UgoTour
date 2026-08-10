// Temporary local data service.
// Later this file will use fetch() to request destinations from our Node.js REST API.
const starterDestinations = [
  { id: 1, name: "Murchison Falls", category: "Nature", description: "Waterfalls, wildlife and Nile experiences." },
  { id: 2, name: "Bwindi", category: "Wildlife", description: "Forest landscapes and mountain gorilla experiences." },
  { id: 3, name: "Jinja", category: "Adventure", description: "Source of the Nile experiences and outdoor activities." }
];

export function getStarterDestinations() {
  return [...starterDestinations];
}
