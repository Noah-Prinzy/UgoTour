// ============================================================
// ADMIN SERVICE
// Contains administrator-only database operations for tourism records and
// contact-message management. Controllers authorize the admin; this layer does
// the SQL work.
// ============================================================

import database from "../database/connection.js";
import { listContactMessages, updateContactMessageStatus } from "./contact-service.js";

// These maps translate frontend camelCase field names into PostgreSQL column names.
// They also act as an allowlist so arbitrary request keys cannot become SQL columns.
const destinationFields = {
  name: "name", category: "category", region: "region", district: "district",
  description: "description", highlight: "highlight", activities: "activities",
  bestFor: "best_for", suggestedDays: "suggested_days", travelTip: "travel_tip",
  imageUrl: "image_url", latitude: "latitude", longitude: "longitude", isActive: "is_active"
};

const attractionFields = {
  destinationId: "destination_id", name: "name", category: "category", region: "region",
  district: "district", description: "description", highlight: "highlight",
  imageUrl: "image_url", latitude: "latitude", longitude: "longitude", isActive: "is_active"
};

// Keep only fields that were actually supplied in a PATCH request.
function cleanPayload(payload, map) {
  return Object.entries(map)
    .filter(([key]) => payload[key] !== undefined)
    .map(([key, column]) => ({ column, value: payload[key] }));
}

// Build the totals shown on the admin dashboard.
export async function getAdminSummary() {
  const result = await database.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM destinations) AS destinations,
      (SELECT COUNT(*) FROM attractions) AS attractions,
      (SELECT COUNT(*) FROM bookings) AS trips,
      (SELECT COUNT(*) FROM saved_places) AS saved_places,
      (SELECT COUNT(*) FROM contact_messages WHERE status='new') AS new_messages
  `);
  const row = result.rows[0];
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
}

// Load either attractions or destinations for the admin editor and map database
// snake_case columns into the camelCase shape used by frontend JavaScript.
export async function listAdminPlaces(type) {
  if (type === "attraction") {
    const result = await database.query(`
      SELECT a.id,a.destination_id,d.name AS destination_name,a.name,a.category,a.region,a.district,
        a.description,a.highlight,a.latitude,a.longitude,a.image_url,a.is_active,a.created_at,a.updated_at
      FROM attractions a LEFT JOIN destinations d ON d.id=a.destination_id
      ORDER BY a.name
    `);
    return result.rows.map((r) => ({
      id:Number(r.id), destinationId:r.destination_id===null?null:Number(r.destination_id), destinationName:r.destination_name,
      name:r.name, category:r.category, region:r.region, district:r.district, description:r.description,
      highlight:r.highlight, latitude:Number(r.latitude), longitude:Number(r.longitude), imageUrl:r.image_url,
      isActive:r.is_active, createdAt:r.created_at, updatedAt:r.updated_at
    }));
  }

  const result = await database.query(`
    SELECT id,name,category,region,district,description,highlight,activities,best_for,suggested_days,
      travel_tip,image_url,latitude,longitude,is_active,created_at,updated_at
    FROM destinations ORDER BY name
  `);
  return result.rows.map((r) => ({
    id:Number(r.id), name:r.name, category:r.category, region:r.region, district:r.district,
    description:r.description, highlight:r.highlight, activities:r.activities||[], bestFor:r.best_for,
    suggestedDays:r.suggested_days===null?null:Number(r.suggested_days), travelTip:r.travel_tip,
    imageUrl:r.image_url, latitude:r.latitude===null?null:Number(r.latitude), longitude:r.longitude===null?null:Number(r.longitude),
    isActive:r.is_active, createdAt:r.created_at, updatedAt:r.updated_at
  }));
}

// Validate the minimum destination fields, insert the record, and return its new id.
export async function createAdminDestination(payload) {
  const required = ["name","category","region","description"];
  for (const key of required) {
    if (!String(payload[key] ?? "").trim()) {
      const error = new Error(`${key} is required.`); error.statusCode=400; throw error;
    }
  }
  const result = await database.query(`
    INSERT INTO destinations (name,category,region,district,description,highlight,activities,best_for,suggested_days,travel_tip,image_url,latitude,longitude,is_active,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
    RETURNING id
  `, [
    payload.name.trim(), payload.category.trim(), payload.region.trim(), payload.district||null,
    payload.description.trim(), payload.highlight||null, Array.isArray(payload.activities)?payload.activities:[],
    payload.bestFor||null, payload.suggestedDays||null, payload.travelTip||null, payload.imageUrl||null,
    payload.latitude||null, payload.longitude||null, payload.isActive!==false
  ]);
  return Number(result.rows[0].id);
}

// Destination PATCH requests share the safe dynamic-update helper below.
export async function updateAdminDestination(id, payload) {
  return updatePlace("destinations", id, payload, destinationFields);
}

// Validate required attraction fields and create one attraction row.
export async function createAdminAttraction(payload) {
  const required = ["name","category","region","description","latitude","longitude"];
  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null || String(payload[key]).trim()==="") {
      const error = new Error(`${key} is required.`); error.statusCode=400; throw error;
    }
  }
  const result = await database.query(`
    INSERT INTO attractions (destination_id,name,category,district,region,description,highlight,latitude,longitude,image_url,is_active,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id
  `, [payload.destinationId||null,payload.name.trim(),payload.category.trim(),payload.district||null,payload.region.trim(),payload.description.trim(),payload.highlight||null,Number(payload.latitude),Number(payload.longitude),payload.imageUrl||null,payload.isActive!==false]);
  return Number(result.rows[0].id);
}

// Attraction PATCH requests use the same allowlisted update helper.
export async function updateAdminAttraction(id, payload) {
  return updatePlace("attractions", id, payload, attractionFields);
}

// Build a parameterized UPDATE statement only from fields in the allowlist.
// Values still use PostgreSQL placeholders ($1, $2, ...) instead of interpolation.
async function updatePlace(table, id, payload, fieldMap) {
  const entries = cleanPayload(payload, fieldMap);
  if (!entries.length) return false;
  const assignments = entries.map((entry, index) => `${entry.column}=$${index + 2}`);
  assignments.push("updated_at=NOW()");
  const values = [Number(id), ...entries.map((entry) => entry.value)];
  const result = await database.query(`UPDATE ${table} SET ${assignments.join(",")} WHERE id=$1 RETURNING id`, values);
  return result.rowCount > 0;
}

// Re-export contact helpers so the admin controller has one admin-service import surface.
export { listContactMessages, updateContactMessageStatus };
