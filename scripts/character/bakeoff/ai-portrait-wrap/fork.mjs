// The bakeoff renders with the SAME evidence scripts as the pipeline. This writes thin forks of them into
// scripts/character/bakeoff/ai-portrait-wrap/fork/ by explicit string replacement, so the only differences are paths
// (assets, look specs, outputs) and nothing in public/assets/teacher/** or docs/design/teacher/renders/** is touched.
// The viewer fork imports the ORIGINAL rig.js / shaders.js / presets.js, so the shading is identical.
//   node scripts/character/bakeoff/ai-portrait-wrap/fork.mjs
import fs from "node:fs";
import path from "node:path";
const SRC = "scripts/character", DST = "scripts/character/bakeoff/ai-portrait-wrap/fork";
const ASSETS = "art/character/bakeoff-assets/ai-portrait-wrap", LOOKS = "art/character/bakeoff/ai-portrait-wrap/looks";
const RENDERS = "docs/design/teacher/bakeoff/ai-portrait-wrap/renders";
fs.mkdirSync(path.join(DST, "viewer"), { recursive: true });
function fork(file, out, reps) {
  let s = fs.readFileSync(path.join(SRC, file), "utf8");
  for (const [a, b] of reps) {
    if (!s.includes(a)) throw new Error(`${file}: pattern not found: ${a}`);
    s = s.split(a).join(b);
  }
  fs.writeFileSync(path.join(DST, out), `// FORK of ${SRC}/${file} (fork.mjs: paths and the two bakeoff hooks only). Do not edit; re-run fork.mjs.\n` + s);
}
fork("viewer/index.html", "viewer/index.html", [["<title>Teacher rig harness", "<title>Bakeoff rig harness"]]);
fs.writeFileSync(path.join(DST, "viewer/index.html"), fs.readFileSync(path.join(DST, "viewer/index.html"), "utf8").replace(/^\/\/.*\n/, ""));
fork("viewer/main.js", "viewer/main.js", [
  ['from "./rig.js"', 'from "/scripts/character/viewer/rig.js"'],
  ['from "./presets.js"', 'from "/scripts/character/viewer/presets.js"'],
  ["`/art/character/looks/${lookId}.json`", `\`/${LOOKS}/\${lookId}.json\``],
  ["`/public/assets/teacher/${lookId}/${tier}.glb", `\`/${ASSETS}/\${lookId}/\${tier}.glb`],
  ["  get rig() { return rig; },", `  // bakeoff addition: world hit point (rest pose) of a ray through canvas pixel (x, y from top-left), for correspondences
  pick(pts) {
    const rc = new THREE.Raycaster(); rc.params.Mesh = {};
    rig.apply({}, [0, 0, 0], [0, 0], 0, 0); renderer.render(scene, camera);
    return pts.map(([x, y]) => {
      rc.setFromCamera(new THREE.Vector2((x / W) * 2 - 1, -(y / H) * 2 + 1), camera);
      const h = rc.intersectObject(rig.meshes.face, false)[0];
      if (!h) return null;
      const p = h.point.clone(); pivot.worldToLocal(p);
      return p.toArray();
    });
  },
  cameraInfo() { return { pos: camera.position.toArray(), quat: camera.quaternion.toArray(), fov: camera.fov, aspect: camera.aspect, W, H, pivotYaw: pivot.rotation.y }; },
  get rig() { return rig; },`],
]);
fork("harness.mjs", "harness.mjs", [["/scripts/character/viewer/index.html", `/${DST}/viewer/index.html`]]);
fork("render.mjs", "render.mjs", [
  ['"docs/design/teacher/renders"', `"${RENDERS}"`],
  ['from "./harness.mjs"', 'from "./harness.mjs"'],
  ["`art/character/looks/${look}.json`", `\`${LOOKS}/\${look}.json\``],
  ['path.join("public/assets/teacher", look, "plate")', `path.join("${ASSETS}", look, "plate")`],
  ['path.join(AUDIO, `${look}.mp3`)', 'path.join("docs/design/teacher/renders/audio", `${look}.mp3`)'],
  ['path.join(AUDIO, `${look}.align.json`)', 'path.join("docs/design/teacher/renders/audio", `${look}.align.json`)'],
  ['"scripts/character/plates.py"', '"scripts/character/plates.py"'],
]);
fork("g9.mjs", "g9.mjs", [
  ["`art/character/looks/${look}.json`", `\`${LOOKS}/\${look}.json\``],
  ['"art/character/reports/g9-solve.json"', '"art/character/bakeoff/ai-portrait-wrap/reports/g9-solve.json"'],
]);
fork("measure.mjs", "measure.mjs", [["`docs/design/teacher/renders/measure-", `\`${RENDERS}/measure-`]]);
fork("runtime-json.mjs", "runtime-json.mjs", [
  ['from "./viewer/presets.js"', 'from "../../../viewer/presets.js"'],
  ["`art/character/looks/${look}.json`", `\`${LOOKS}/\${look}.json\``],
  ["`public/assets/teacher/${look}/plate/plate.json`", `\`${ASSETS}/\${look}/plate/plate.json\``],
  ["`public/assets/teacher/${look}/runtime.json`", `\`${ASSETS}/\${look}/runtime.json\``],
]);
// finish: the projected albedo and its normal detail carry photographic high frequencies that UASTC RDO 1.0 does not
// compress (H 7.43 MB / B+ 2.35 MB against 6 / 2.2, measured); they take the cards' stronger RDO setting
fork("finish.mjs", "finish.mjs", [['const RDO = { "hair_atlas.png": "2.5", "cards_atlas.png": "2.5" };',
  'const RDO = { "hair_atlas.png": "2.5", "cards_atlas.png": "2.5", ...JSON.parse(process.env.APW_RDO || \'{"skin_albedo_H.png":"3","skin_albedo.png":"3","skin_normal.png":"3"}\') };'],
  // H face albedo and normal at 1536 (still above the source: the portrait face is 472 px wide, the 1536 chart about
  // 680 px); RDO alone left H at 6.88 MB (measured)
  ['["skin_albedo_H.png", "TaxilaSkin", "baseColor", { H: [2048, 2048, "u"]', '["skin_albedo_H.png", "TaxilaSkin", "baseColor", { H: [1536, 1536, "u"]'],
  ['["skin_normal.png", "TaxilaSkin", "normal", { H: [2048, 2048, "u"]', '["skin_normal.png", "TaxilaSkin", "normal", { H: [1536, 1536, "u"]'],
]);
console.log("forked into", DST);
// ---- Blender stages: build_look.py gets ONE hook (the wrap, after the identity sculpt); texture.py gets ONE hook (the
// portrait projection, before the skin maps are written). Everything else is the pipeline's own code.
const PYPATH = 'sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))';
const PYPATH2 = 'sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../blender")))\nsys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")))';
// (b) the resting lid: a fraction of eyeBlink baked into the basis AND every key, with eyeBlink itself shortened by the
// same fraction so blink = 1 still lands on the closed lid (G4 unchanged); the portraits' lids cover the top of the iris
// (eye opening 0.110 IOD on the portrait vs 0.140 on the fitted head, likeness.py)
const BLINK = `rb_ = float(look.get("faceStyle", {}).get("restBlink", 0.0))
if rb_ > 0:
    for S_ in ("Left", "Right"):
        dB_ = _D["eyeBlink" + S_] * _body[:, None]       # skin only: the unit also moves the eye HELPER, and moving it moved the eyeball (G4 14% escape at 0.35, measured)
        for kb in _kbs:
            set_key_co(kb, key_co(kb) + rb_ * dB_)
        set_key_co(_kbs["eyeBlink" + S_], key_co(_kbs["eyeBlink" + S_]) - rb_ * dB_)
        _D["eyeBlink" + S_] = _D["eyeBlink" + S_] - rb_ * dB_
    # the mesh vertices must follow the Basis key: later stages read co(mesh), and a Basis-only edit left the rest lid
    # where it was while eyeBlink got shorter (G4 blink 14% escape, basis diff 0.0 mm, measured)
    h.data.vertices.foreach_set("co", key_co(_kbs[0]).ravel())
    h.data.update()
    report["restBlinkBaked"] = rb_
`;
fork("blender/build_look.py", "build_look.py", [
  [PYPATH, PYPATH2],
  ['stage("sculpt")\n', `stage("sculpt")
# ---- bakeoff ai-portrait-wrap: wrap the basis onto the portrait reconstruction (wrap.py); keys/proxies load after this
if look.get("wrap"):
    import wrap as WR
    if look["wrap"].get("dump"):
        np.savez(look["wrap"]["dump"], B=B, hw=head_weight(B), mir=MIR, F=tris_of(h.data), body=_body)
    B, report["wrap"] = WR.apply(B, look["wrap"], head_weight(B), log=lambda m: print(f"[build:{look['id']}] {m}", flush=True), mir=MIR)
    h.data.vertices.foreach_set("co", B.ravel())
    h.data.update()
    stage("wrap")
`],
  ['rs = float(look.get("faceStyle", {}).get("restSmile", 0.0))\n', BLINK + 'rs = float(look.get("faceStyle", {}).get("restSmile", 0.0))\n'],
  // (c) the pipeline's resting-smile bake edits the Basis KEY only; Blender later re-bases every key on the mesh
  // vertices, so the bake vanished (basis diff restSmile 0.03 vs 0: 0.000 mm, measured). Sync the mesh after it.
  ['    report["restSmileBaked"] = rs\nB = key_co(_kbs[0])\n', '    report["restSmileBaked"] = rs\n    h.data.vertices.foreach_set("co", key_co(_kbs[0]).ravel())\n    h.data.update()\nB = key_co(_kbs[0])\n'],
]);
fork("blender/texture.py", "texture.py", [
  [PYPATH, PYPATH2],
  ["# ------------------------------------------------------------------ write skin maps\n", `# ---- bakeoff ai-portrait-wrap: project + de-light the portraits onto our UVs (project.py), G9-anchored
if look.get("projection"):
    import project as PJ
    A, A_H, Nb = PJ.apply(globals())
# ------------------------------------------------------------------ write skin maps
`],
]);
for (const f of ["build_look.py", "texture.py"]) {
  const p = path.join(DST, f);
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/^\/\/ FORK/, "# FORK"));
}
console.log("forked blender stages");
