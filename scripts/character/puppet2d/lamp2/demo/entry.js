// The lamp2 demo bundle: the production PuppetDriver (src/face-puppet/driver.ts, unchanged), the lamp2 KeyRig
// (src/face-puppet/rig-keys) and, for the r8 calibration through the same page, the SHIPPED r8 runtime
// (src/face-puppet/runtime/rig.js, unchanged). Bundled with rolldown as an IIFE.
export { PuppetDriver } from "/home/user/Taxila/src/face-puppet/driver.ts";
export { KeyRig } from "/home/user/Taxila/src/face-puppet/rig-keys/keyrig.ts";
export { Puppet2DRig } from "/home/user/Taxila/src/face-puppet/runtime/rig.js";
export { applySafetyFloor } from "/home/user/Taxila/src/face-puppet/safety.ts";
// round 4 lamp1: the text-side bilabial seals (prepared as integrate/06 there; applied here so the demo shows it)
export { addBilabials } from "/home/user/Taxila/scripts/character/puppet2d/lamp1/demo/bilabial.js";
