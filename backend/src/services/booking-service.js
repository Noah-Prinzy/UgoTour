import database from "../database/connection.js";
import { getDestinationById } from "./destination-service.js";

function mapBooking(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    destinationId: Number(row.destination_id),
    destinationName: row.destination_name,
    destinationCategory: row.destination_category,
    destinationRegion: row.destination_region,
    travelDate:
      row.travel_date instanceof Date
        ? row.travel_date.toISOString().slice(0, 10)
        : String(row.travel_date).slice(0, 10),
    travellers: Number(row.travellers),
    status: "confirmed",
    createdAt: row.created_at
  };
}

export async function createBooking(userId, input) {
  const destination = await getDestinationById(input.destinationId);

  if (!destination) {
    const error = new Error("Destination not found.");
    error.statusCode = 404;
    throw error;
  }

  const result = await database.query(
    `
      INSERT INTO bookings (user_id, destination_id, travel_date, travellers)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, destination_id, travel_date, travellers, created_at
    `,
    [
      Number(userId),
      Number(destination.id),
      input.travelDate,
      Number(input.travellers)
    ]
  );

  return mapBooking({
    ...result.rows[0],
    destination_name: destination.name,
    destination_category: destination.category,
    destination_region: destination.region
  });
}

export async function getBookingsForUser(userId) {
  const result = await database.query(
    `
      SELECT
        b.id,
        b.user_id,
        b.destination_id,
        d.name AS destination_name,
        d.category AS destination_category,
        d.region AS destination_region,
        b.travel_date,
        b.travellers,
        b.created_at
      FROM bookings AS b
      INNER JOIN destinations AS d
        ON d.id = b.destination_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `,
    [Number(userId)]
  );

  return result.rows.map(mapBooking);
}

export async function deleteBookingForUser(userId, bookingId) {
  const result = await database.query(
    `
      DELETE FROM bookings
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [Number(bookingId), Number(userId)]
  );

  return result.rowCount > 0;
}
