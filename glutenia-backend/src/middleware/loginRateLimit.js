const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failedAttempts = new Map();

const getKey = (req) => `${req.ip}|${String(req.body?.email || "").toLowerCase()}`;

const getActiveEntry = (key, now) => {
  const entry = failedAttempts.get(key);
  if (!entry) return null;

  if (now - entry.firstFailureAt > WINDOW_MS) {
    failedAttempts.delete(key);
    return null;
  }

  return entry;
};

const pruneExpired = (now) => {
  for (const [key, entry] of failedAttempts) {
    if (now - entry.firstFailureAt > WINDOW_MS) {
      failedAttempts.delete(key);
    }
  }
};

setInterval(() => pruneExpired(Date.now()), WINDOW_MS).unref();

const loginRateLimit = (req, res, next) => {
  const key = getKey(req);
  const now = Date.now();
  const entry = getActiveEntry(key, now);

  if (entry && entry.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.firstFailureAt + WINDOW_MS - now) / 1000);
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
    });
  }

  res.on("finish", () => {
    if (res.statusCode === 401) {
      const current = getActiveEntry(key, Date.now());
      if (current) {
        current.count += 1;
      } else {
        failedAttempts.set(key, { count: 1, firstFailureAt: Date.now() });
      }
    } else if (res.statusCode < 400) {
      failedAttempts.delete(key);
    }
  });

  return next();
};

loginRateLimit.reset = () => failedAttempts.clear();

module.exports = loginRateLimit;
