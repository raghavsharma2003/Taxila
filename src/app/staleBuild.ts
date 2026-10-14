// A tab left open across a deploy (r5 QA, the owner's `err.resource /assets/Landing-*.js`): the old entry asks for
// lazy chunks the new container no longer has, the import rejects, and the route error page's Home link asked for the
// same missing chunk again, so the page was dead until a manual reload. A failed chunk load now reloads the page once
// (a fresh index.html names the new build's chunks); a second failure within RELOAD_WINDOW_MS shows the error page
// instead of looping.

const KEY = "tx.staleReloadAt";
const RELOAD_WINDOW_MS = 30_000;

/** PURE. Does this error mean a lazy chunk (JS or CSS) of this build could not be fetched? */
export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err ?? "");
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|Loading chunk [\w-]+ failed/i.test(msg);
}

/** Reload once for a stale build; false when a reload was already tried moments ago (then the caller shows its error). */
export function reloadForStaleBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* no storage: still reload once per page load */
    if ((window as { __txStaleReload?: boolean }).__txStaleReload) return false;
    (window as { __txStaleReload?: boolean }).__txStaleReload = true;
  }
  location.reload();
  return true;
}

/** Vite's own signal for a failed dynamic import or preload: reload instead of letting the import reject. */
export function installStaleBuildReload(): void {
  window.addEventListener("vite:preloadError", (e) => {
    if (reloadForStaleBuild()) e.preventDefault();
  });
}
