// The one place a harness turns "which server?" into a URL. There is NO default: production is never a fallback.
// A harness that talks to a server calls resolveBase(<what the caller gave>) and gets either a clean URL or a throw.
// Pure and side-effect free (no fetch, no env writes), so a test can import it with a stubbed fetch.

export const BASE_HELP = "set TAXILA_BASE (or pass --base / the base-url argument) to the server to test, e.g. http://127.0.0.1:5190; there is no default, on purpose (a default once sent a run to production)";

/** @param {string|undefined|null} raw  what the caller supplied (env var, flag or argument) @returns {string} URL without a trailing slash */
export function resolveBase(raw) {
  const s = String(raw ?? "").trim();
  if (!s) throw new Error(`no base URL: ${BASE_HELP}`);
  let u;
  try { u = new URL(s); } catch { throw new Error(`base URL "${s}" is not a URL: ${BASE_HELP}`); }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error(`base URL "${s}" must be http(s): ${BASE_HELP}`);
  return s.replace(/\/+$/, "");
}

/** Same, for a script that prints usage and exits instead of throwing. */
export function resolveBaseOrExit(raw, usage) {
  try { return resolveBase(raw); } catch (e) { console.error(`${usage ? usage + "\n" : ""}${e.message}`); process.exit(2); }
}
