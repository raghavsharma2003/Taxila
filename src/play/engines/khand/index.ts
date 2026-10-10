// Khand (E2): the block world over the Nazariya law, a core3d@1 engine (create). G1's core3d (src/play/engines/core3d)
// is on base, so the engine is ported: its types come from core3d/api.ts and nothing shipped imports ./shim (the dev
// stage the Khand harnesses used before the port). Not in the engine registry yet: Khand renders through its certified
// 2D twin until its 3D cells are certified (a registry block in src/play/engines/registry.ts switches it on).
export { create } from "./engine.ts";
