import { createHash, randomBytes } from "node:crypto";
import database from "../database/connection.js";
import { hashPassword } from "../utils/password.js";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function publicResetUrl(token) {
  const base = String(process.env.PUBLIC_APP_URL || "http://127.0.0.1:5500").replace(/\/$/, "");
  return `${base}/pages/reset-password.html?token=${encodeURIComponent(token)}`;
}

async function deliverResetEmail(email, resetUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM;

  if (apiKey && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Reset your UgoTour password",
        html: `<p>We received a request to reset your UgoTour password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>`
      })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Password reset email delivery failed (${response.status}). ${text.slice(0, 160)}`);
    }
    return { delivered: true, provider: "resend" };
  }

  if (process.env.APP_ENV === "production") {
    console.warn("Password reset email requested but RESEND_API_KEY/PASSWORD_RESET_FROM are not configured.");
    return { delivered: false, provider: "unconfigured" };
  }

  console.log(`UgoTour development password reset link for ${email}: ${resetUrl}`);
  return { delivered: false, provider: "development-console" };
}

export async function requestPasswordReset(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const result = await database.query("SELECT id,email FROM users WHERE email=$1", [normalized]);
  const user = result.rows[0];
  if (!user) return { accepted: true };

  await database.query("DELETE FROM password_reset_tokens WHERE user_id=$1 OR expires_at <= NOW()", [user.id]);

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await database.query(
    "INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES ($1,$2,$3)",
    [user.id, tokenHash, expiresAt]
  );

  const resetUrl = publicResetUrl(token);
  let delivery = { delivered: false, provider: "unavailable" };
  try {
    delivery = await deliverResetEmail(user.email, resetUrl);
  } catch (error) {
    // Do not reveal whether an email address exists by returning a different
    // public response when the provider has a transient failure.
    console.error(`Password reset delivery error: ${error.message}`);
  }
  return {
    accepted: true,
    developmentResetUrl: process.env.APP_ENV === "production" ? undefined : resetUrl,
    delivery: process.env.APP_ENV === "production" ? undefined : delivery.provider
  };
}

export async function confirmPasswordReset(token, newPassword) {
  const tokenHash = hashToken(String(token || ""));
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(`
      SELECT prt.id, prt.user_id
      FROM password_reset_tokens prt
      WHERE prt.token_hash=$1
        AND prt.used_at IS NULL
        AND prt.expires_at > NOW()
      FOR UPDATE
    `, [tokenHash]);

    const reset = result.rows[0];
    if (!reset) {
      const error = new Error("This password reset link is invalid or has expired.");
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await hashPassword(newPassword);
    await client.query("UPDATE users SET password_hash=$2,updated_at=NOW() WHERE id=$1", [reset.user_id, passwordHash]);
    await client.query("UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1", [reset.id]);
    await client.query("DELETE FROM sessions WHERE user_id=$1", [reset.user_id]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
