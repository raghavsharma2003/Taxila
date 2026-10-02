Graphics-review reproductions (2026-10-02), referenced from web-3d-talking-heads.md "## Graphics review".

- fpscap.mjs: simulates TalkingHead 1.7's frame cap (`if (dt < 1000/modelFPS) return; animTimeLast = t`) at 60/90/120 Hz. `node fpscap.mjs`
- bundle entries: npm i three@0.180.0 @babylonjs/core@9 @babylonjs/loaders@9 @react-three/fiber react react-dom esbuild;
  copy TalkingHead `modules/` to ./thmods; then for each entry:
  npx esbuild X.mjs --bundle --minify --format=esm --define:process.env.NODE_ENV='"production"' --outfile=out-X.js && gzip -9c out-X.js | wc -c
