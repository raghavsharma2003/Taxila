// The flight recorder's masking (release 12, dc-r12-flight-recorder; gate-tested): what may never be recorded is
// replaced by "[masked]" before an event leaves the page. By key (shared/trace.ts TRACE_MASK_KEYS: password, PIN,
// email, phone, tokens, keys, cookies, the Authorization header) at any depth, and by shape inside free strings
// (an email address, an Indian phone number, a bearer token). Values are also capped so one event stays small.
import { TRACE_MASK_KEYS, TRACE_MAX_DATA_BYTES } from "../../shared/trace.ts";

export const MASK = "[masked]";
const KEYS = new Set(TRACE_MASK_KEYS.map((k) => k.toLowerCase()));
// key names that hold a secret even when they are not spelled exactly as in the list (newPassword, guardianEmail, pinHash…)
const KEY_RE = /pass(word)?|email|phone|mobile|otp|token|secret|api_?key|authori[sz]ation|cookie|ephemeral/i;
// a PIN key in any casing style (pin, pinHash, newPin, PIN, pin_code), never a word that merely contains "pin" (pinned, spinner)
const PIN_RE = /(^|[^a-zA-Z])pin(?![a-z])|Pin(?![a-z])|PIN/;

/** Does a key name a value that is never recorded? */
export function maskedKey(k: string): boolean {
  return KEYS.has(k.toLowerCase()) || KEY_RE.test(k) || PIN_RE.test(k);
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /(?<![\d])(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?![\d])/g;
const BEARER = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi;
const LONG_SECRET = /\b(?:sk|ek|key|tok)_[A-Za-z0-9]{16,}\b/g;

/** A free string with every email, phone number and bearer/secret token replaced. */
export function maskString(s: string, cap = 2000): string {
  const out = s.replace(BEARER, `$1 ${MASK}`).replace(LONG_SECRET, MASK).replace(EMAIL, MASK).replace(PHONE, MASK);
  return out.length > cap ? `${out.slice(0, cap)}…[+${out.length - cap}]` : out;
}

/** A deep copy with secret keys masked, strings scrubbed and capped, depth and breadth bounded. Never throws. */
export function maskDeep(v: unknown, depth = 0): unknown {
  try {
    if (v == null || typeof v === "number" || typeof v === "boolean") return v;
    if (typeof v === "string") return maskString(v);
    if (depth > 6) return "[deep]";
    if (Array.isArray(v)) return v.slice(0, 50).map((x) => maskDeep(x, depth + 1)).concat(v.length > 50 ? [`[+${v.length - 50}]`] : []);
    if (typeof v === "object") {
      const o: Record<string, unknown> = {};
      let n = 0;
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (n++ >= 60) { o["…"] = "[more keys]"; break; }
        o[k] = maskedKey(k) ? MASK : maskDeep(x, depth + 1);
      }
      return o;
    }
    return String(v);
  } catch {
    return "[unmaskable]";
  }
}

/** Masked data that fits TRACE_MAX_DATA_BYTES serialized; an oversized payload keeps its keys with values cut. */
export function fitData(data: Record<string, unknown>): Record<string, unknown> {
  const m = maskDeep(data) as Record<string, unknown>;
  let s = JSON.stringify(m);
  if (s.length <= TRACE_MAX_DATA_BYTES) return m;
  const cut: Record<string, unknown> = { truncated: s.length };
  for (const [k, x] of Object.entries(m)) cut[k] = typeof x === "string" ? x.slice(0, 600) : typeof x === "object" && x ? JSON.stringify(x).slice(0, 600) : x;
  s = JSON.stringify(cut);
  return s.length <= TRACE_MAX_DATA_BYTES ? cut : { truncated: s.length, keys: Object.keys(m).slice(0, 40) };
}

/** A JSON (or text) body as recorded: parsed and masked when it is JSON, else a scrubbed, capped string. */
export function maskBody(text: string | null | undefined, cap = 6000): unknown {
  if (text == null || text === "") return undefined;
  try { return maskDeep(JSON.parse(text)); } catch { return maskString(text, cap); }
}
