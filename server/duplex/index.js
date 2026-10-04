// Duplex controller (docs/research/duplex/ARCHITECTURE.md): one import surface. Every module here except launch.js is pure
// and browser-safe. NOT WIRED: nothing in the live lesson path imports this yet (integration plan and keep/supersede map:
// docs/research/duplex/ARCHITECTURE.md v2 §11-§12; floorManager.js + eot.js are the superseded silence-gated v1, kept
// frozen as TaxilaFDB baseline B3; the engine contract is src/duplex/engine.ts).
export { FloorManager, DEFAULTS as FLOOR_DEFAULTS } from "./floorManager.js";
export { understand, valuesIn, afterHold, textHash, normText } from "./understand.js";
export { decideEnd, rowFor, CAND_MS, HOLD_REQUEST_MS, SAFETY_SILENCE_MS } from "./eot.js";
export { BackchannelPolicy, NOD } from "./backchannel.js";
export { Overlap, heardChars, OVERLAP_CAND_MS } from "./bargein.js";
export { DraftManager, CAPS as DRAFT_CAPS } from "./drafts.js";
export { triage, RevealQueue } from "./triage.js";
export { Ear, FRAME_MS } from "./ear.js";
