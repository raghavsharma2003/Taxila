import { openHarness } from "./harness.mjs";
const hx = await openHarness({ w: 400, h: 500 });
await hx.page.evaluate(() => TX.load("teal", "H"));
console.log(await hx.page.evaluate(() => Object.fromEntries(Object.entries(TX.rig.meshes).map(([n, m]) => [n, { morphs: Object.keys(m.morphTargetDictionary || {}).length, verts: m.geometry.attributes.position.count, attrs: Object.keys(m.geometry.attributes) }]))));
await hx.close();
