// The demo bundle: the production PuppetDriver (src/face-puppet/driver.ts, unchanged: behaviour, lip driver, acting
// policy, safety floor) + the lamp1 rig (scripts/character/puppet2d/lamp1/runtime). Bundled with rolldown as an IIFE.
export { PuppetDriver } from "/home/user/Taxila/src/face-puppet/driver.ts";
export { Puppet2DRig } from "/home/user/Taxila/scripts/character/puppet2d/lamp1/runtime/rig.js";
export { applySafetyFloor } from "/home/user/Taxila/src/face-puppet/safety.ts";
// round 4: the text-side bilabial seals (prepared as a product patch, integrate/06; applied here so the demo shows it)
export { addBilabials } from "/home/user/Taxila/scripts/character/puppet2d/lamp1/demo/bilabial.js";
