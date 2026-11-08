// Round 7, stream G (child device pairing): the routes a paired child device may use. Deny by default: a route missing
// here answers a child-device-only request with 403 scope.child_device (server/auth.js), so a new parent route is safe
// without touching this file, and a new CHILD route a device needs is added here.
//
// Child routes: lessons and their voice/duplex lanes, games (play), the studio stream and notebook, the child's own data
// (/api/child/*), tutor choice, placement rounds (not the parent's placement note or onboarding), homework match.
// Never: /api/parent/*, /api/pair/code and /api/pair/devices (the parent's), account, consent, children, settings.

const PREFIXES = ["/api/child/", "/api/lesson/", "/api/play/", "/api/voice/", "/api/duplex/", "/api/forge/", "/api/tutors"];
const EXACT = new Set([
  "POST /api/realtime/token", "POST /api/tts", "POST /api/homework/match", "GET /api/face/config",
  "POST /api/placement/start", "POST /api/placement/answer", "GET /api/placement/result",
  "GET /api/studio/stream", "GET /api/studio/slot", "GET /api/studio/build", "POST /api/studio/answer",
  "POST /api/studio/feedback", "POST /api/studio/frame-error", "POST /api/studio/wb-timing", "POST /api/studio/viewport",
  "GET /api/studio/notebook", "GET /api/studio/notebook/pages", "GET /api/studio/made-for",
]);

/** `key` is the router's "METHOD /path" (no query). */
export function childScoped(key) {
  const k = String(key ?? "");
  if (EXACT.has(k)) return true;
  const path = k.slice(k.indexOf(" ") + 1);
  return PREFIXES.some((p) => path.startsWith(p) || path === p.replace(/\/$/, ""));
}
