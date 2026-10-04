// The published looks (src/avatar/looks.gen.json, written by scripts/character/publish-look.mjs) and the per-look
// fetches. Bundled on purpose: the D plate is the first thing a child sees (t = 0), so its URLs and crop rects must
// not wait on a lookup round trip. Every URL here is content-hashed under /assets/teacher/<look>/<lookRev>/ and so
// served immutable.
import index from "./looks.gen.json";
import type { TutorCharacter } from "../../shared/tutors.js";
import { lookUrl, type LookEntry, type RuntimeJson } from "./three/contract.ts";

const LOOKS = (index as unknown as { looks: Record<string, LookEntry> }).looks;

export const lookById = (id: string | null | undefined): (LookEntry & { id: string }) | null => {
  const e = id ? LOOKS[id] : undefined;
  return e && id ? { ...e, id } : null;
};

/** The look a tutor wears, or null if it is not published (the caller keeps the pre-rig face). */
export const lookFor = (t: Pick<TutorCharacter, "lookId"> | null | undefined) => lookById(t?.lookId);

/** Every published look id (the dev side-by-side lists them). */
export const lookIds = () => Object.keys(LOOKS);

/** The plate's three images, absolute. Null when the look ships no plate (it cannot be on the lesson path then). */
export function plateUrls(e: LookEntry): { plate: string; mouth: string; blink: string } | null {
  const f = e.plate?.files;
  return f ? { plate: lookUrl(e, f.plate), mouth: lookUrl(e, f.mouth), blink: lookUrl(e, f.blink) } : null;
}

const runtimes = new Map<string, Promise<RuntimeJson>>();
/** runtime.json of a look, fetched once per page (immutable URL). */
export function fetchRuntime(e: LookEntry): Promise<RuntimeJson> {
  const url = lookUrl(e, e.runtime);
  let p = runtimes.get(url);
  if (!p) {
    p = fetch(url, { credentials: "same-origin" }).then((r) => {
      if (!r.ok) throw new Error(`runtime.json ${r.status}`);
      return r.json() as Promise<RuntimeJson>;
    });
    p.catch(() => runtimes.delete(url));
    runtimes.set(url, p);
  }
  return p;
}

/** Warm the HTTP cache with a look's GLB (child home on Wi-Fi; never on the lesson's cold path). */
export function prefetchLook(e: LookEntry, tier: "Bplus" | "Blite" = "Bplus"): void {
  const t = e.tiers[tier];
  if (!t || typeof document === "undefined") return;
  const href = lookUrl(e, t.file);
  if (document.head.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "prefetch";
  l.href = href;
  document.head.appendChild(l);
}
