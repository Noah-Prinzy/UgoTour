// ============================================================
// DESTINATION DATA SERVICE
// ============================================================
// UgoTour still uses local JavaScript objects during the frontend
// learning phases. This keeps the data easy to inspect while we
// practise JavaScript before connecting a Node.js REST API.
//
// In a later backend phase, functions in this file will be replaced
// by fetch() requests to the API, while the page files can keep using
// the same service-style approach.

const allDestinations = [
  {
    id: 1,
    name: "Murchison Falls",
    category: "Nature",
    region: "North-Western Uganda",
    description: "Explore the Nile, dramatic waterfalls and surrounding savannah landscapes.",
    highlight: "Nile views and waterfalls",
    activities: ["Waterfall viewpoints", "Boat experiences", "Wildlife viewing"],
    bestFor: "Nature lovers and first-time safari visitors",
    suggestedDays: 2,
    travelTip: "Plan enough time for both the falls viewpoints and the Nile-side experiences."
  },
  {
    id: 2,
    name: "Bwindi Impenetrable National Park",
    category: "Wildlife",
    region: "South-Western Uganda",
    description: "Discover dense forest scenery and Uganda's famous mountain gorilla experiences.",
    highlight: "Forest and gorilla experiences",
    activities: ["Forest walks", "Gorilla trekking", "Community experiences"],
    bestFor: "Wildlife travellers and forest explorers",
    suggestedDays: 3,
    travelTip: "Prepare for changing forest weather and allow time to travel through the highland region."
  },
  {
    id: 3,
    name: "Jinja",
    category: "Adventure",
    region: "Eastern Uganda",
    description: "Enjoy Nile-side activities, outdoor adventures and the atmosphere around Jinja city.",
    highlight: "Nile adventures",
    activities: ["Nile sightseeing", "Kayaking and rafting", "City exploration"],
    bestFor: "Adventure seekers and weekend travellers",
    suggestedDays: 2,
    travelTip: "Keep one flexible day if you plan to combine several outdoor activities."
  },
  {
    id: 4,
    name: "Queen Elizabeth National Park",
    category: "Wildlife",
    region: "Western Uganda",
    description: "Experience wildlife, open savannah, crater landscapes and the Kazinga Channel area.",
    highlight: "Safari and channel experiences",
    activities: ["Game drives", "Kazinga Channel experiences", "Crater landscape viewing"],
    bestFor: "Safari travellers and photographers",
    suggestedDays: 3,
    travelTip: "Early morning and late afternoon are useful times for wildlife-focused activities."
  },
  {
    id: 5,
    name: "Kidepo Valley National Park",
    category: "Wildlife",
    region: "North-Eastern Uganda",
    description: "Explore remote savannah scenery, broad valleys and memorable wildlife landscapes.",
    highlight: "Remote savannah landscapes",
    activities: ["Game drives", "Landscape photography", "Cultural experiences"],
    bestFor: "Travellers who enjoy remote and less crowded places",
    suggestedDays: 3,
    travelTip: "Because the park is remote, include travel time when planning your total trip length."
  },
  {
    id: 6,
    name: "Lake Bunyonyi",
    category: "Nature",
    region: "South-Western Uganda",
    description: "Relax beside a scenic highland lake surrounded by green hills and small islands.",
    highlight: "Lake and highland scenery",
    activities: ["Lake viewpoints", "Canoe experiences", "Relaxation"],
    bestFor: "Slow travel, couples and peaceful getaways",
    suggestedDays: 2,
    travelTip: "Carry a light layer for the cooler highland mornings and evenings."
  },
  {
    id: 7,
    name: "Sipi Falls",
    category: "Adventure",
    region: "Eastern Uganda",
    description: "Visit a collection of waterfalls and explore hiking routes around the Mount Elgon area.",
    highlight: "Hiking and waterfalls",
    activities: ["Waterfall hikes", "Scenic viewpoints", "Coffee experiences"],
    bestFor: "Hikers and active weekend travellers",
    suggestedDays: 2,
    travelTip: "Wear footwear with good grip because some paths can become slippery after rain."
  },
  {
    id: 8,
    name: "Kampala",
    category: "Culture",
    region: "Central Uganda",
    description: "Explore Uganda's capital through food, markets, landmarks, arts and urban culture.",
    highlight: "City life and culture",
    activities: ["Landmark visits", "Food experiences", "Markets and arts"],
    bestFor: "Culture, food and city travellers",
    suggestedDays: 2,
    travelTip: "Plan activities by area because city traffic can affect travel time between stops."
  },
  {
    id: 9,
    name: "Rwenzori Mountains",
    category: "Adventure",
    region: "Western Uganda",
    description: "Discover dramatic mountain landscapes and trekking experiences in the Rwenzori range.",
    highlight: "Mountain trekking",
    activities: ["Mountain trekking", "Nature walks", "Landscape photography"],
    bestFor: "Hikers and mountain adventure travellers",
    suggestedDays: 4,
    travelTip: "Longer treks require more preparation, so match the route to your fitness and available time."
  }
];

// The Home page intentionally shows only three featured items.
export function getStarterDestinations() {
  return allDestinations.slice(0, 3).map((destination) => ({ ...destination }));
}

// The Destinations page uses the complete catalog.
export function getAllDestinations() {
  return allDestinations.map((destination) => ({ ...destination }));
}

// Phase 3: one reusable details page can load a destination using
// the numeric id found in the page URL, for example ?id=3.
export function getDestinationById(id) {
  const numericId = Number(id);
  const destination = allDestinations.find((item) => item.id === numericId);

  return destination ? { ...destination, activities: [...destination.activities] } : null;
}

// Build category filters from the data instead of hard-coding them.
export function getDestinationCategories() {
  return [...new Set(allDestinations.map((destination) => destination.category))];
}
