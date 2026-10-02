# perf bench (performance-android.md §3)
Node 22, Chromium 141 (Playwright build, SwiftShader WebGL2), 4-core Xeon 2.1 GHz. Inputs: TalkingHead sample avatars
(`../../web-3d-talking-heads.md` §3.1; brunette is CC BY-NC, measurement only, never ship).
    npm i three@0.180.0 draco3dgltf meshoptimizer @gltf-transform/{core,extensions,functions}@4 sharp ktx2-encoder
    node asset.mjs <dir of meshopt+webp GLBs>      # sizes; writes out/*.{raw,meshopt,draco}.glb
    node codec.mjs                                 # pure codec decode ms
    node tex.mjs                                   # WebP vs KTX2 ETC1S/UASTC, transcode ms, GPU MB
    node pipeline.mjs <raw TalkingHead glb>        # T3 / T2 / T2-lite character build
    node run-web.mjs <playwright index.mjs> <chromium>   # frame cadence, main vs OffscreenCanvas worker, iframe load
`web-result-avatars.json` was transcribed from stdout of the first run-web plan (the file was overwritten by later plans).
