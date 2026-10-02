// Per-device conveniences only (a draft, the last picked child, the language tile). Storage can be blocked
// or wiped; every read has a fallback, and nothing here is identity or evidence (identity is the server's).
export function readStore<T>(key: string, fallback: T, area: "local" | "session" = "local"): T {
  try {
    const raw = (area === "local" ? localStorage : sessionStorage).getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
export function writeStore(key: string, value: unknown, area: "local" | "session" = "local") {
  try {
    const s = area === "local" ? localStorage : sessionStorage;
    if (value === undefined || value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch { /* blocked: fine */ }
}
