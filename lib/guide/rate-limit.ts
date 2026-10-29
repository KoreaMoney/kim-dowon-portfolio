const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const MAX_TRACKED_KEYS = 1_000;

const hits = new Map<string, number[]>();

export function isGuideRateLimited(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((timestamp) => timestamp > now - WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  if (hits.size >= MAX_TRACKED_KEYS && !hits.has(key)) {
    const oldest = hits.keys().next().value;
    if (oldest !== undefined) hits.delete(oldest);
  }
  hits.set(key, recent);
  return false;
}
