// Tiny in-memory attempt limiter (per process). Good enough to stop password / OTP brute force.
const buckets = new Map();

const prune = () => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
};

/** Registers one attempt. Returns { allowed, retryAfterSec }. */
const hit = (key, max, windowMs) => {
  prune();
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > max) {
    return { allowed: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
};

/** Clears a key (e.g. after a successful login). */
const reset = (key) => buckets.delete(key);

module.exports = { hit, reset };

