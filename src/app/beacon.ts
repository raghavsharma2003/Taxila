// The client error beacon (BUILD-PLAN W1-D item 2; smooth audit G2: "a white screen on the owner's phone is
// invisible"). window.onerror and unhandledrejection post ONE small report to POST /api/client-error. The report
// carries the error's name, its message and bundle frames only: no page text, no input values, no query string. The
// server scrubs again (server/router.js scrubMessage), so a child's words never reach the logs even if a message
// quoted them. At most 5 reports per page load, identical ones once; navigator.sendBeacon so a report survives
// the page closing.

const MAX_PER_LOAD = 5;
let sent = 0;
const seen = new Set<string>();

/** The JS bundle's hashed name (main-XXXX.js) so a report ties to a build. */
function bundle(): string | null {
  const s = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]');
  return s ? s.src.split("/").pop() ?? null : null;
}

export function reportClientError(kind: "error" | "unhandledrejection" | "react" | "manual", err: unknown): void {
  try {
    if (sent >= MAX_PER_LOAD) return;
    const e = err instanceof Error ? err : null;
    const name = e?.name ?? (typeof err === "object" && err ? (err as { name?: string }).name ?? "Error" : "Error");
    const message = e?.message ?? (typeof err === "string" ? err : "non-error rejection");
    const sig = `${kind}|${name}|${message}`.slice(0, 300);
    if (seen.has(sig)) return;
    seen.add(sig);
    sent++;
    const body = JSON.stringify({
      kind, name, message: message.slice(0, 300), stack: (e?.stack ?? "").slice(0, 2000),
      path: location.pathname, bundle: bundle(), mobile: matchMedia?.("(pointer: coarse)").matches === true,
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/client-error", blob)) {
      void fetch("/api/client-error", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* a reporter must never throw */
  }
}

let installed = false;
/** Install the global handlers once (src/main.tsx, before the app renders). */
export function installBeacon(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (ev) => {
    // a failed <img>/<script> load has no error object; only script errors are reported
    if (ev.error || ev.message) reportClientError("error", ev.error ?? ev.message);
  });
  window.addEventListener("unhandledrejection", (ev) => reportClientError("unhandledrejection", ev.reason));
}
