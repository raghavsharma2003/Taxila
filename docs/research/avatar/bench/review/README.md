Graphics-review reproductions (2026-10-02), referenced from web-3d-talking-heads.md "## Graphics review".

- fpscap.mjs: simulates TalkingHead 1.7's frame cap (`if (dt < 1000/modelFPS) return; animTimeLast = t`) at 60/90/120 Hz. `node fpscap.mjs`
- bundle entries: npm i three@0.180.0 @babylonjs/core@9 @babylonjs/loaders@9 @react-three/fiber react react-dom esbuild;
  copy TalkingHead `modules/` to ./thmods; then for each entry:
  npx esbuild X.mjs --bundle --minify --format=esm --define:process.env.NODE_ENV='"production"' --outfile=out-X.js && gzip -9c out-X.js | wc -c

Verification-pass additions (resumed session, 2026-10-02), referenced from "### Review addendum":
- mtype.mjs <glbs>: morph accessor component types after `gltf-transform optimize` (quantized? sparse? position-only?).
- prim.mjs <glbs>: per-primitive vertex count x target count, and how many vertices target 0 actually moves.
- mclose.mjs <glbs>: mouthClose vs jawOpen displacement (does mouthClose assume an open jaw?).
  Needs @gltf-transform/{core,extensions} + meshoptimizer; run from a dir where they are installed.
