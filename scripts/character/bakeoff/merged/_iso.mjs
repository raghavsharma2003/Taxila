import { openHarness } from "./harness.mjs";
const hx = await openHarness({ w: 600, h: 750 });
await hx.page.evaluate(() => TX.load("teal", "H"));
await hx.page.evaluate(() => { TX.frame("face", 30); TX.pose({ bs: {} }); TX.render(); });
await hx.shot(`/tmp/claude-0/char/bakeoff-merged/f_real.png`);
await hx.page.evaluate(async () => {
  const THREE = TX.THREE || (await import("three"));
  const t = await new THREE.TextureLoader().loadAsync("/scripts/character/bakeoff/merged/viewer/_uvdbg.png");
  t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
  TX.rig.meshes.face.material.uniforms.tAlbedo.value = t;
  for (const [n, o] of Object.entries(TX.rig.meshes)) o.visible = n === "face";
  TX.frame("face", 30); TX.pose({ bs: {} }); TX.render();
});
await hx.shot(`/tmp/claude-0/char/bakeoff-merged/f_uv.png`);
await hx.close();
