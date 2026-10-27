// mimics tests/index.js: every file imported into ONE runner, in sorted order, then a probe
globalThis.__taxilaNativeFetch ??= globalThis.fetch;
for (const f of ["forge-g1-serve", "p2-face-player", "p4-content-seam", "r4-latency-spec-row", "voice-player-clock"].sort()) await import(`/home/user/Taxila/tests/${f}.test.mjs`);
await import("./probe.mjs");
