// Phase 5 temporary backend data.
// This file behaves like a tiny in-memory database table for destinations.
// In Phase 6 these records will move into PostgreSQL.

export const destinations = [
  {
    id: 1,
    name: "Murchison Falls National Park",
    category: "Nature",
    region: "Northern Uganda",
    description: "Explore the Nile, powerful waterfalls, savannah landscapes and wildlife.",
    highlight: "Murchison Falls and Nile wildlife cruises"
  },
  {
    id: 2,
    name: "Bwindi Impenetrable National Park",
    category: "Wildlife",
    region: "Southwestern Uganda",
    description: "A UNESCO-listed rainforest famous for mountain gorillas and exceptional biodiversity.",
    highlight: "Mountain gorilla trekking"
  },
  {
    id: 3,
    name: "Jinja",
    category: "Adventure",
    region: "Eastern Uganda",
    description: "A vibrant Nile-side destination known for rafting, kayaking and outdoor adventure.",
    highlight: "Source of the Nile experiences"
  },
  {
    id: 4,
    name: "Queen Elizabeth National Park",
    category: "Wildlife",
    region: "Western Uganda",
    description: "Savannah, crater lakes, wildlife drives and the Kazinga Channel create a varied safari experience.",
    highlight: "Kazinga Channel wildlife cruises"
  },
  {
    id: 5,
    name: "Kidepo Valley National Park",
    category: "Wildlife",
    region: "Northeastern Uganda",
    description: "Remote wilderness, broad valleys and dramatic mountain scenery in Uganda's northeast.",
    highlight: "Remote savannah landscapes"
  },
  {
    id: 6,
    name: "Lake Bunyonyi",
    category: "Nature",
    region: "Southwestern Uganda",
    description: "A peaceful highland lake surrounded by green hills and many small islands.",
    highlight: "Island views and canoe experiences"
  },
  {
    id: 7,
    name: "Sipi Falls",
    category: "Adventure",
    region: "Eastern Uganda",
    description: "A series of waterfalls near Mount Elgon with hiking, coffee tours and scenic viewpoints.",
    highlight: "Waterfall hikes and coffee experiences"
  },
  {
    id: 8,
    name: "Kampala",
    category: "Culture",
    region: "Central Uganda",
    description: "Uganda's capital combines history, food, nightlife, markets and cultural landmarks.",
    highlight: "Urban culture and heritage"
  },
  {
    id: 9,
    name: "Rwenzori Mountains",
    category: "Adventure",
    region: "Western Uganda",
    description: "High-altitude trekking through dramatic alpine scenery in the Mountains of the Moon.",
    highlight: "Mountain trekking"
  }
];
