const buckets = new Map();

function clientIp(request) {
  if (String(process.env.TRUST_PROXY || "").toLowerCase() === "true") {
    const forwarded = request.headers["x-forwarded-for"];
    if (forwarded) return String(forwarded).split(",")[0].trim();
  }
  return request.socket?.remoteAddress || "unknown";
}

export function enforceRateLimit(request, scope, { limit, windowMs }) {
  const now = Date.now();
  const key = `${scope}:${clientIp(request)}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const error = new Error("Too many requests. Please try again later.");
    error.statusCode = 429;
    error.retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw error;
  }
}

export function generalRateLimit(request) {
  enforceRateLimit(request, "general", {
    limit: Number(process.env.GENERAL_RATE_LIMIT_PER_MINUTE || 180),
    windowMs: 60_000
  });
}

export function authRateLimit(request) {
  enforceRateLimit(request, "auth", {
    limit: Number(process.env.AUTH_RATE_LIMIT_PER_15_MINUTES || 20),
    windowMs: 15 * 60_000
  });
}

export function contactRateLimit(request) {
  enforceRateLimit(request, "contact", {
    limit: Number(process.env.CONTACT_RATE_LIMIT_PER_HOUR || 10),
    windowMs: 60 * 60_000
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60_000).unref?.();
