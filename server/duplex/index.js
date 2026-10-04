// Duplex controller (docs/research/duplex/ARCHITECTURE.md): one import surface. Every module here except launch.js is pure
// and browser-safe. NOT WIRED: nothing in the live lesson path imports this yet (Wave 2.5 plan with the exact W2 files:
// docs/research/duplex/INTEGRATION.md; keep/supersede map: ARCHITECTURE.md v2 §12; floorManager.js + eot.js are the
// superseded silence-gated v1, kept frozen as TaxilaFDB baseline B3; the engine contract is src/duplex/engine.ts and the
// device runtime is src/duplex/host.ts + governor.ts + engineRules.ts + adapter.ts).
export { FloorManager, DEFAULTS as FLOOR_DEFAULTS } from "./floorManager.js";
export { understand, valuesIn, afterHold, textHash, normText } from "./understand.js";
export { decideEnd, rowFor, CAND_MS, HOLD_REQUEST_MS, SAFETY_SILENCE_MS } from "./eot.js";
export { BackchannelPolicy, NOD } from "./backchannel.js";
export { Overlap, heardChars, OVERLAP_CAND_MS } from "./bargein.js";
export { DraftManager, CAPS as DRAFT_CAPS } from "./drafts.js";
export { triage, RevealQueue } from "./triage.js";
export { Ear, FRAME_MS } from "./ear.js";
// v2 runtime, server slice (ARCHITECTURE.md v2 §2.2, §4, §10; INTEGRATION.md §1-§2)
export { TurnTranscript, SOURCE_LAG } from "./fanin.js";
export { EchoSubtractor, ECHO } from "./echo.js";
export { PartialSafety } from "./partialSafety.js";
export { Speculator, PREPARE_CAPS } from "./speculator.js";
export { BuildIntents, PHASE_BOUNDARY } from "./buildIntent.js";
export { DuplexSlice } from "./slice.js";
export { createDuplexRoutes } from "./routes.js";
