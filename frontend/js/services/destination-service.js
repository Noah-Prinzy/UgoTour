// ============================================================
// DESTINATION DATA SERVICE
// ============================================================
// Phase 1 and Phase 2 use local JavaScript objects so we can learn
// frontend functionality before connecting the Node.js backend.
//
// Later, this service will use fetch() to request the same kind of
// destination data from our REST API and PostgreSQL database.

const allDestinations = [
  {
    id: 1,
    name: "Murchison Falls",
    category: "Nature",
    region: "North-Western Uganda",
    description: "Explore the Nile, dramatic waterfalls and surrounding savannah landscapes.",
    highlight: "Nile views and waterfalls"
  },
  {
    id: 2,
    name: "Bwindi Impenetrable National Park",
    category: "Wildlife",
    region: "South-Western Uganda",
    description: "Discover dense forest scenery and Uganda's famous mountain gorilla experiences.",
    highlight: "Forest and gorilla experiences"
  },
  {
    id: 3,
    name: "Jinja",
    category: "Adventure",
    region: "Eastern Uganda",
    description: "Enjoy Nile-side activities, outdoor adventures and the atmosphere around Jinja city.",
    highlight: "Nile adventures"
  },
  {
    id: 4,
    name: "Queen Elizabeth National Park",
    category: "Wildlife",
    region: "Western Uganda",
    description: "Experience wildlife, open savannah, crater landscapes and the Kazinga Channel area.",
    highlight: "Safari and channel experiences"
  },
  {
    id: 5,
    name: "Kidepo Valley National Park",
    category: "Wildlife",
    region: "North-Eastern Uganda",
    description: "Explore remote savannah scenery, broad valleys and memorable wildlife landscapes.",
    highlight: "Remote savannah landscapes"
  },
  {
    id: 6,
    name: "Lake Bunyonyi",
    category: "Nature",
    region: "South-Western Uganda",
    description: "Relax beside a scenic highland lake surrounded by green hills and small islands.",
    highlight: "Lake and highland scenery"
  },
  {
    id: 7,
    name: "Sipi Falls",
    category: "Adventure",
    region: "Eastern Uganda",
    description: "Visit a collection of waterfalls and explore hiking routes around the Mount Elgon area.",
    highlight: "Hiking and waterfalls"
  },
  {
    id: 8,
    name: "Kampala",
    category: "Culture",
    region: "Central Uganda",
    description: "Explore Uganda's capital through food, markets, landmarks, arts and urban culture.",
    highlight: "City life and culture"
  },
  {
    id: 9,
    name: "Rwenzori Mountains",
    category: "Adventure",
    region: "Western Uganda",
    description: "Discover dramatic mountain landscapes and trekking experiences in the Rwenzori range.",
    highlight: "Mountain trekking"
  }
];

// The Home page intentionally shows only three starter/featured items.
export function getStarterDestinations() {
  return allDestinations.slice(0, 3).map((destination) => ({ ...destination }));
}

// The Destinations page uses the complete catalog.
export function getAllDestinations() {
  return allDestinations.map((destination) => ({ ...destination }));
}

// Build our category filters from the data instead of hard-coding them
// in the HTML. Set removes duplicate category values.
export function getDestinationCategories() {
  return [...new Set(allDestinations.map((destination) => destination.category))];
}
