// W1-F: the GLB rig runtime behind face.rig and the asset hygiene (BUILD-PLAN §3 W1-F items 1 and 3; teacher-anim
// gaps 1, 6, 7, 10). Pure checks: the look contract, the published looks, the rig maths, and source rules that keep
// the loader off the cold path, the context opaque and the audio floor untouched. The browser arms (a .glb loads at
// tier B, a failed load falls to D with the SAME look) are tests/prod/w1f-face.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { validateRuntime, validateGltfJson, resolveShading, rigTierFor, coverBox, TIER_BUDGET_BYTES } from "../src/avatar/three/contract.ts";
import { finalWeights, correctiveParents, mouthOpening, lidClose, VISEME_TO_ARKIT } from "../src/avatar/three/presets.ts";
import { TUTORS } from "../shared/tutors.js";

const ROOT = new URL("..", import.meta.url).pathname;
const index = JSON.parse(readFileSync(join(ROOT, "src/avatar/looks.gen.json"), "utf8"));
const src = (p) => readFileSync(join(ROOT, p), "utf8");
const glbJson = (file) => {
  const b = readFileSync(file);
  assert.equal(b.toString("latin1", 0, 4), "glTF", `${file} is a GLB`);
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
};
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

// ───────────── the published looks ─────────────

test("every tutor's lookId is published with B+, B-lite and its own rendered plate", () => {
  for (const t of TUTORS) {
    assert.ok(t.lookId, `${t.id} has a lookId`);
    const e = index.looks[t.lookId];
    assert.ok(e, `${t.id} → look ${t.lookId} is in looks.gen.json`);
    assert.ok(e.tiers.Bplus && e.tiers.Blite, `${t.lookId}: B+ and B-lite`);
    assert.ok(e.plate?.files?.plate && e.plate.files.mouth && e.plate.files.blink, `${t.lookId}: plate, mouth strip, blink`);
    assert.equal(e.plate.mouthCells, 5);
  }
  // a look carries no name; distinct tutors wear distinct looks
  assert.equal(new Set(TUTORS.map((t) => t.lookId)).size, TUTORS.length);
});

test("published files live under /assets/teacher/<look>/<rev>/ with content-hashed names (immutable by serve.mjs's rule)", () => {
  const HASHED = /-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/; // server/serve.mjs HASHED
  for (const [id, e] of Object.entries(index.looks)) {
    assert.equal(e.base, `/assets/teacher/${id}/${e.rev}/`);
    const files = [e.runtime, ...Object.values(e.tiers).map((t) => t.file), ...Object.values(e.plate?.files ?? {})];
    for (const f of files) {
      assert.match(f, HASHED, `${id}/${f} is hashed`);
      const path = join(ROOT, "public", e.base, f);
      assert.ok(existsSync(path), `${path} exists`);
      const h = createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 10);
      assert.ok(f.includes(`-${h}.`), `${f}: the name's hash is the content's (${h})`);
    }
    for (const [t, m] of Object.entries(e.tiers)) assert.ok(m.bytes <= TIER_BUDGET_BYTES[t], `${id} ${t} ${m.bytes} B within budget`);
  }
});

test("each published runtime.json follows the contract and names only published tiers", () => {
  for (const [id, e] of Object.entries(index.looks)) {
    const rt = JSON.parse(readFileSync(join(ROOT, "public", e.base, e.runtime), "utf8"));
    assert.deepEqual(validateRuntime(rt), [], `${id}: ${validateRuntime(rt).join("; ")}`);
    assert.equal(rt.look, id);
    assert.equal(rt.lookRev, e.rev);
    assert.deepEqual(Object.keys(rt.tiers).sort(), Object.keys(e.tiers).sort());
    for (const [t, m] of Object.entries(e.tiers)) assert.equal(rt.tiers[t].file, m.file);
  }
});

test("each published GLB decodes with the runtime's loader set and carries the contract's meshes and bones", () => {
  for (const [id, e] of Object.entries(index.looks)) {
    for (const [t, m] of Object.entries(e.tiers)) {
      const j = glbJson(join(ROOT, "public", e.base, m.file));
      assert.deepEqual(validateGltfJson(j), [], `${id} ${t}: ${validateGltfJson(j).join("; ")}`);
      const face = j.meshes.find((x) => x.name === "face");
      const names = face.extras?.targetNames ?? face.primitives[0].extras?.targetNames ?? [];
      if (names.length) assert.ok(names.includes("jawOpen") && names.includes("eyeBlinkLeft"), `${id} ${t}: ARKit morph names`);
    }
  }
});

test("validateRuntime names what breaks the contract", () => {
  assert.ok(validateRuntime(null).length);
  const bad = validateRuntime({ schema: 2, look: "", lookRev: 0, tiers: {}, lighting: { toneMapping: "ACES", keyDir: [1], keyColor: [1, 1, 1], rimDir: [1, 1, 1], rimColor: [1, 1, 1], sh: [] }, jawCeiling: 2 });
  for (const s of ["schema", "look", "lookRev", "tiers.Bplus", "tiers.Blite", "keyDir", "sh", "toneMapping", "jawCeiling"]) assert.ok(bad.some((p) => p.includes(s)), `flags ${s}`);
  assert.ok(validateRuntime({ schema: 1, look: "x", lookRev: 1, tiers: { Bplus: { file: "a.glb", bytes: 3e6 }, Blite: { file: "b.glb" } }, lighting: { keyDir: [1, 1, 1], keyColor: [1, 1, 1], rimDir: [1, 1, 1], rimColor: [1, 1, 1], sh: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]] } })
    .some((p) => p.includes("budget")), "B+ over 2.2 MB is refused");
  assert.ok(validateGltfJson({ extensionsRequired: ["KHR_draco_mesh_compression"], meshes: [{ name: "face" }], nodes: [] }).some((p) => p.includes("draco")));
});

// ───────────── per-look shading is data, not code ─────────────

test("resolveShading: iteration-2 defaults; merged when declared or implied; candidate fixes are flags", () => {
  const v2 = resolveShading({});
  assert.equal(v2.merged, false);
  assert.equal(v2.pupil, 0.42);
  assert.deepEqual(v2.bag, [0.09, 0.022, 0.018]);
  const m = resolveShading({ eyePass: { sclera: [0.34, 0.29, 0.28], restLid: 0.35 } });
  assert.equal(m.merged, true);
  assert.deepEqual(m.sclera, [0.34, 0.29, 0.28]);
  assert.equal(resolveShading({ eyePass: {}, shading: { profile: "v2" } }).merged, false, "an explicit profile wins");
  const c = resolveShading({ shading: { hairKK: 0.1, cardRim: false, hairLumaGate: true }, mouthInterior: { bag: [0.15, 0.045, 0.04] } });
  assert.equal(c.hairKK, 0.1);
  assert.equal(c.cardRim, false);
  assert.equal(c.hairLumaGate, true);
  assert.deepEqual(c.bag, [0.15, 0.045, 0.04]);
});

test("the shader defines every per-look switch resolveShading can raise", () => {
  const s = src("src/avatar/three/shaders.ts");
  for (const d of ["PROFILE_MERGED", "EYE_TEX", "NO_CARD_RIM", "HAIR_LUMA_GATE", "TIER_LITE", "HAS_DETAIL"]) assert.ok(s.includes(`#ifdef ${d}`) || s.includes(`#ifndef ${d}`), d);
  const r = src("src/avatar/three/rig.ts");
  for (const d of ["PROFILE_MERGED", "EYE_TEX", "NO_CARD_RIM", "HAIR_LUMA_GATE"]) assert.ok(r.includes(d), `rig.ts raises ${d}`);
});

// ───────────── rig maths ─────────────

test("finalWeights: B+ folds visemes, H passes them; clamp; jaw ceiling; correctives are products of clamped parents", () => {
  const corr = [["jawOpen_mouthSmileLeft", correctiveParents("jawOpen_mouthSmileLeft")]];
  assert.deepEqual(corr[0][1], ["jawOpen", "mouthSmileLeft"]);
  const f = finalWeights({ viseme_aa: 1, mouthSmileLeft: 1.4 }, [0, 0], { hasVisemes: false, jawCeiling: 0.55, correctives: corr });
  assert.equal(f.viseme_aa, undefined, "B+ has no viseme morphs: folded");
  assert.equal(f.jawOpen, 0.55, `aa folds to jaw ${VISEME_TO_ARKIT.viseme_aa.jawOpen}, clamped at the look's ceiling`);
  assert.equal(f.mouthSmileLeft, 1, "clamped to 1");
  assert.equal(f.jawOpen_mouthSmileLeft, 0.55, "corrective = product of the final parents");
  const h = finalWeights({ viseme_aa: 0.7 }, [0, 0], { hasVisemes: true });
  assert.equal(h.viseme_aa, 0.7);
  assert.ok(mouthOpening(h, true) > 0.3, "a viseme tier's interior opens with the viseme");
  assert.equal(mouthOpening({ jawOpen: 0.2 }, false), 0.2);
  const look = finalWeights({}, [0, 20], { hasVisemes: false });
  assert.equal(look.eyeLookUpLeft, 0.4, "lid follow: the upper lid tracks gaze pitch at 0.5");
  assert.ok(lidClose({ eyeBlinkLeft: 1 }, 0.35, "Left") === 1 && lidClose({}, 0.35, "Right") === 0.35);
});

test("rigTierFor and coverBox", () => {
  assert.equal(rigTierFor("B"), "Bplus");
  assert.equal(rigTierFor("Blite"), "Blite");
  assert.equal(rigTierFor("D"), null);
  const b = coverBox(80, 80, 360, 450, 0.4);
  assert.equal(b.width, 80);
  assert.equal(b.height, 100);
  assert.equal(b.top, -8);
  const w = coverBox(400, 100, 360, 450);
  assert.ok(w.width >= 400 && w.height >= 100 && w.left <= 0);
});

// ───────────── source rules ─────────────

test("GLTFLoader / KTX2Loader / MeshoptDecoder are imported only by the lazy rig module", () => {
  const files = walk(join(ROOT, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
  const users = files.filter((f) => /GLTFLoader|KTX2Loader|meshopt_decoder/.test(readFileSync(f, "utf8").split("\n").filter((l) => l.startsWith("import")).join("\n")));
  assert.deepEqual(users.map((f) => f.slice(ROOT.length)), ["src/avatar/three/rig.ts"]);
  const rigImporters = files.filter((f) => /from "\.\/rig\.ts"|from "\.\.\/three\/rig\.ts"|three\/rig\.ts"/.test(readFileSync(f, "utf8")));
  assert.deepEqual(rigImporters.map((f) => f.slice(ROOT.length)), ["src/avatar/three/stage3d.ts"], "only the stage3d chunk imports the rig");
  assert.match(src("src/avatar/TutorFace.tsx"), /import\("\.\/three\/stage3d\.ts"\)/, "stage3d stays a dynamic import");
  assert.ok(!/from "\.\/three\/stage3d\.ts"/.test(src("src/avatar/TutorFace.tsx").replace(/import type[^\n]*/g, "")), "no static value import of stage3d");
});

test("the rig renders on a hand-made opaque WebGL2 context with Neutral tone mapping (gap 10)", () => {
  const s = src("src/avatar/three/stage3d.ts");
  assert.match(s, /getContext\("webgl2", \{ alpha: false/);
  assert.match(s, /new WebGLRenderer\(\{ canvas, context, antialias \}\)/);
  assert.match(s, /NeutralToneMapping/);
  assert.match(s, /RIG_TIMEOUT_MS = 8000/);
  assert.match(s, /REVEAL_SILENCE_MS = 300/);
});

test("audio floor: the rig, the plate and the stage never create or route audio", () => {
  for (const f of ["src/avatar/three/rig.ts", "src/avatar/PlatePerson.tsx", "src/avatar/three/stage3d.ts", "src/avatar/looks.ts"]) {
    const s = src(f);
    assert.ok(!/AudioContext|createMediaElementSource|createMediaStreamSource|\.connect\(|\.muted\s*=|\.volume\s*=/.test(s), `${f} touches no audio`);
  }
});

test("face.rig is off by default and switched only by the build env or this device's storage", () => {
  const s = src("src/avatar/flags.ts");
  assert.match(s, /VITE_FACE_RIG === "1"/);
  assert.match(s, /"tx\.flag\.face\.rig"/);
  assert.ok(!existsSync(join(ROOT, ".env.production")) || !/VITE_FACE_RIG=1/.test(src(".env.production")), "not on in a committed production env");
});

test("asset hygiene: no bake-off identity and no unversioned look file is under public/", () => {
  assert.ok(!existsSync(join(ROOT, "public/assets/teacher-bakeoff")), "public/assets/teacher-bakeoff is gone (moved to art/character/bakeoff-assets)");
  const pub = walk(join(ROOT, "public/assets/teacher"));
  const loose = pub.filter((f) => !/\/assets\/teacher\/[a-z0-9-]+\/\d+\/[^/]+$/.test(f) && !/\/assets\/teacher\/basis\/r\d+\//.test(f));
  assert.deepEqual(loose.map((f) => f.slice(ROOT.length)), [], "every file is versioned (or the self-hosted transcoder)");
  assert.ok(!pub.some((f) => /\/H-[^/]*\.glb$/.test(f)), "tier H is not shipped in the first release");
  for (const f of walk(join(ROOT, "scripts/character/bakeoff")).filter((x) => /\.(mjs|js|py)$/.test(x))) {
    assert.ok(!readFileSync(f, "utf8").includes("public/assets/teacher-bakeoff"), `${f.slice(ROOT.length)} reads the moved bake-off assets`);
  }
  assert.ok(existsSync(join(ROOT, "public/assets/teacher/basis/r180/basis_transcoder.wasm")), "the basis transcoder is self-hosted");
});
