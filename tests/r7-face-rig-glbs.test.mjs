// Round 7 face cleanup: the build drops the rig looks' GLBs (the owner-rejected generated heads) from dist unless
// VITE_FACE_RIG=1; plates and runtime.json stay, so the face.rig path still falls back to the same look's plate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { rigGlbs } = await import("../vite.config.ts");

function fakeDist() {
  const d = mkdtempSync(join(tmpdir(), "rig-glbs-"));
  const lk = join(d, "assets/teacher/teal/1");
  mkdirSync(lk, { recursive: true });
  for (const f of ["Bplus-1.glb", "Blite-2.glb", "plate-3.webp", "runtime-4.json"]) writeFileSync(join(lk, f), "x");
  mkdirSync(join(d, "assets/teacher/protege/1"), { recursive: true });
  writeFileSync(join(d, "assets/teacher/protege/1/cloud-pup.webp"), "x");
  return d;
}
const run = (env, d) => { const p = rigGlbs(env); p.configResolved({ root: "/", build: { outDir: d } }); p.closeBundle.call({ info() {} }); };

test("face.rig off: the GLBs leave dist, every other teacher asset stays", () => {
  const d = fakeDist();
  try {
    run({}, d);
    assert.ok(!existsSync(join(d, "assets/teacher/teal/1/Bplus-1.glb")));
    assert.ok(!existsSync(join(d, "assets/teacher/teal/1/Blite-2.glb")));
    for (const f of ["teal/1/plate-3.webp", "teal/1/runtime-4.json", "protege/1/cloud-pup.webp"]) assert.ok(existsSync(join(d, "assets/teacher", f)), f);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("VITE_FACE_RIG=1: the GLBs ship", () => {
  const d = fakeDist();
  try {
    run({ VITE_FACE_RIG: "1" }, d);
    assert.ok(existsSync(join(d, "assets/teacher/teal/1/Bplus-1.glb")));
  } finally { rmSync(d, { recursive: true, force: true }); }
});
