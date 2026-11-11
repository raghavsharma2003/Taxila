// Putting Taxila on the child's own device (r7 app-child-device-pairing, main 2026-11-08). The parent makes a one-time
// code in the parent corner; the child's device enters it at /pair and gets a CHILD-SCOPED session for that one child
// (child routes only; the parent corner stays behind the parent's own sign-in). The parent can unpair a device, which
// ends that session at once. Identity stays the authenticated child id: the device only holds a session the parent
// can revoke. Routes are Platform's (server/auth.js):
//   POST   /api/pair/code { childId }   → { code, expiresAt }      parent-authenticated; 6 chars, 10 minutes, one use
//   POST   /api/pair/redeem { code }    → { childId, name } + cookie   no auth; rate-limited; a wrong code says nothing
//   GET    /api/pair/devices?childId=   → { devices: PairedDevice[] }   parent-authenticated, newest first
//   DELETE /api/pair/devices?id=        → { ok }                     parent-authenticated; the session ends server-side
// (Platform's routes, claude/r7-platform 703b1968.) A wrong, used or expired code is one 400 { code: "pair.invalid" };
// too many tries 429 { code: "pair.rate_limited" }. The device boots child mode from the readable tx_paired cookie
// (src/app/device.ts), never from /api/me, which refuses a device-only browser (403 scope.child_device).
import { ApiError, getJson, postJson, request } from "./api.ts";

/** The code alphabet: no 0/O and no 1/I (they are read aloud and typed on a phone). */
export const PAIR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const PAIR_LEN = 6;

/** PURE. What the child typed → the code as the server expects it: upper case, letters of the alphabet only, at most 6.
 *  Spaces, dashes and lower case are fine; 0/O/1/I never appear in a code, so they are dropped. */
export function cleanPairCode(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "").split("").filter((c) => PAIR_ALPHABET.includes(c)).join("").slice(0, PAIR_LEN);
}

/** PURE. A whole code (6 characters of the alphabet). */
export const isPairCode = (s: string): boolean => s.length === PAIR_LEN && [...s].every((c) => PAIR_ALPHABET.includes(c));

/** PURE. "K7P 3QX": the code as it is shown and read aloud, in two halves. */
export const showPairCode = (code: string): string => (code.length === PAIR_LEN ? `${code.slice(0, 3)} ${code.slice(3)}` : code);

/** PURE. The link a QR carries: this site's /pair with the code filled in. */
export const pairLink = (origin: string, code: string): string => `${origin.replace(/\/+$/, "")}/pair?code=${encodeURIComponent(code)}`;

/** PURE. Whole seconds left on a code (0 when it has expired or the time is unreadable). */
export function secondsLeft(expiresAt: string, now: number): number {
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) ? Math.max(0, Math.ceil((t - now) / 1000)) : 0;
}

export interface PairedDevice { id: string; childId?: string; childName?: string; label?: string | null; pairedAt: string; lastSeenAt?: string | null }

export const pairApi = {
  code: (childId: string) => postJson<{ code: string; expiresAt: string }>("/api/pair/code", { childId }),
  redeem: (code: string) => postJson<{ childId: string; name?: string }>("/api/pair/redeem", { code }),
  devices: (childId: string) => getJson<{ devices: PairedDevice[] }>(`/api/pair/devices?childId=${encodeURIComponent(childId)}`),
  unpair: (id: string) => request<{ ok: boolean }>("DELETE", `/api/pair/devices?id=${encodeURIComponent(id)}`, { id }),
};

/** PURE. A failed redeem → one sentence for the child (never which children exist). */
export function redeemErrorOf(e: unknown, online = true): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return "Too many tries. Wait a minute, then type the code again.";
    if ((e.body as { code?: string } | null)?.code === "pair.rate_limited") return "Too many tries. Wait a minute, then type the code again.";
    if (e.status === 404 || e.status === 400 || e.status === 410) return "That code did not work. Ask your grown-up for a new one.";
    if (e.status === 0 || !online) return "You seem to be offline. Check the internet and try again.";
    return "Something went wrong. Try again.";
  }
  return online ? "Something went wrong. Try again." : "You seem to be offline. Check the internet and try again.";
}
