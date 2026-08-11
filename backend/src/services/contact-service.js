import database from "../database/connection.js";

export async function createContactMessage({ userId = null, name, email, subject, message }) {
  const result = await database.query(`
    INSERT INTO contact_messages (user_id,name,email,subject,message)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING id,status,created_at
  `, [userId ? Number(userId) : null, name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]);
  return {
    id: Number(result.rows[0].id),
    status: result.rows[0].status,
    createdAt: result.rows[0].created_at
  };
}

export async function listContactMessages() {
  const result = await database.query(`
    SELECT id,user_id,name,email,subject,message,status,created_at,updated_at
    FROM contact_messages
    ORDER BY created_at DESC
    LIMIT 250
  `);
  return result.rows.map((row) => ({
    id: Number(row.id),
    userId: row.user_id === null ? null : Number(row.user_id),
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function updateContactMessageStatus(id, status) {
  const allowed = new Set(["new", "read", "closed"]);
  if (!allowed.has(status)) {
    const error = new Error("Invalid contact message status.");
    error.statusCode = 400;
    throw error;
  }
  const result = await database.query(`
    UPDATE contact_messages SET status=$2,updated_at=NOW()
    WHERE id=$1 RETURNING id,status,updated_at
  `, [Number(id), status]);
  if (!result.rowCount) return null;
  return { id: Number(result.rows[0].id), status: result.rows[0].status, updatedAt: result.rows[0].updated_at };
}
