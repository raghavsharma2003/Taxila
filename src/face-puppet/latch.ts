// Page-level facts every puppet stage shares (ship5 p2-face). Eager (PuppetFace imports it), so nothing is missed while
// the stage chunk is still loading.
//
// The SAFETY latch (policy.ts R6). Measured on the product path (tests/prod/p2-face-acceptance.mjs, a class-5 child with
// Asha, a distress line typed): the safeguarding reply opens the TroubleScreen, which mounts a SECOND puppet after the
// calm_steady cue was emitted; that stage never saw the cue and acted her normal warm reply over the helplines. A cue bus
// is not sticky, so the page remembers: a stage built while the page is in a safety turn starts neutral, and the latch
// clears when a stage's policy leaves safety (her next onset after a normal child turn).
import { faceCues } from "../avatar/faceCues.ts";
import { puppetBus } from "./bus.ts";

let safety = false;
let installed = false;

/** Install the page listeners once (idempotent). */
export function installLatch(): void {
  if (installed) return;
  installed = true;
  faceCues.on((cue) => { if (cue.kind === "affect" && cue.display === "calm_steady") safety = true; });
  puppetBus.on((e) => { if (e.kind === "duplex" && e.cue.kind === "pose" && e.cue.pose === "calm_steady") safety = true; });
}

export const pageInSafety = (): boolean => safety;

/** A stage's policy left the safety calm (a normal turn): the page is no longer in a safety turn. */
export function clearPageSafety(): void {
  safety = false;
}

/** Tests only. */
export function resetLatch(): void {
  safety = false;
}

installLatch();
