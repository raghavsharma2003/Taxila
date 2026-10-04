// One guard for every W2 seam call site (BUILD-PLAN §4, W2 seam commit; owned by the main loop, edited only in a seam
// commit). A seam owner's bug must never become a lesson error: a throw, or a rejected promise, is logged and replaced
// by the call site's fallback (the pre-seam behaviour). A seam that returns undefined also gets the fallback.
/** Run a seam call that must never break the lesson: a throw (or a rejected promise) is logged and becomes `fallback`. */
export function seamSafe(name, fn, fallback = null) {
  try {
    const out = fn();
    if (out && typeof out.then === "function") return out.then((v) => v ?? fallback, (e) => { console.warn(`[seam] ${name} failed:`, e?.message); return fallback; });
    return out ?? fallback;
  } catch (e) {
    console.warn(`[seam] ${name} failed:`, e?.message);
    return fallback;
  }
}
