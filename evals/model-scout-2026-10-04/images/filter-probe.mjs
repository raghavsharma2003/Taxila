// Model scout 2026-10-04, images: which words trip the Azure content filters that blocked i1-courtyard (FLUX + all MAI,
// "DallECandidateBlockList"), d4-digestive (all MAI, input "mainline safety") and i5-children (FLUX only).
// One call per variant on the cheapest arm that blocked (MAI-Image-2.6-Flash $0.02, FLUX.2-pro $0.03). Writes results/filter-probe-2026-10-04[-r2].json (--round2 = second set).
// Usage: NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/model-scout-2026-10-04/images/filter-probe.mjs
import { writeFileSync } from "node:fs";
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ""), K = process.env.AZURE_OPENAI_API_KEY, HOST = E.match(/^https:\/\/([^.]+)\./)[1];
const SI = process.env.AZURE_AI_SOUTHINDIA_ENDPOINT.replace(/\/$/, ""), SIK = process.env.AZURE_AI_SOUTHINDIA_KEY;
const STY = "Matte gouache-and-pencil painting on warm paper grain, soft cream light from the upper left. No text anywhere.";
const ROUND = process.argv.includes("--round2");
const V = ROUND ? [
  ["flash", "digest-no-outline", "Flat educational illustration, white background, English labels. The human digestive system organs for class 7: Mouth, Food pipe, Stomach, Small intestine, Large intestine, each with a leader line."],
  ["flux", "court-no-neem", `${STY} A sunlit Indian home courtyard in morning light with limewash walls and terracotta pots. No people.`],
  ["flash", "digest-stomach-only", "Flat educational illustration, white background. A labelled diagram of the human stomach and intestines for a school science book."],
  ["flux", "court-no-indian", `${STY} A sunlit home courtyard in morning light with limewash walls and a neem tree. No people.`],
  ["flash", "court-fullstyle-retry", "__FULL_COURTYARD__"],
  ["flux", "court-word-courtyard", `${STY} A sunlit courtyard with white walls in morning light.`],
] : [
  ["flash", "court-full-minus-kolam", `${STY} A sunlit Indian home courtyard in morning light: limewash walls, a neem tree at the right edge, an open wooden veranda doorway at the left, two terracotta pots with leafy plants and a magenta bougainvillea spray, a charpai with teal cotton-tape weave. No people.`],
  ["flash", "court-kolam-only", `${STY} A sunlit Indian home courtyard in morning light: limewash walls, white rice-flour kolam dots on the floor near the edges. No people.`],
  ["flash", "court-minus-charpai", `${STY} A sunlit Indian home courtyard in morning light: limewash walls, a neem tree at the right edge, an open wooden veranda doorway at the left, white rice-flour kolam dots near the edges, two terracotta pots and a magenta bougainvillea spray. No people.`],
  ["flash", "court-minimal", `${STY} A sunlit Indian home courtyard in morning light with limewash walls and a neem tree. No people.`],
  ["flash", "digest-person", "Flat educational illustration, white background, English labels. The human digestive system for class 7, front view inside a simple outline of a person's head and torso. Exactly five labels with leader lines: Mouth, Food pipe, Stomach, Small intestine, Large intestine."],
  ["flash", "digest-no-outline", "Flat educational illustration, white background, English labels. The human digestive system organs for class 7: Mouth, Food pipe, Stomach, Small intestine, Large intestine, each with a leader line."],
  ["flux", "children-no-age", `${STY} Two Indian schoolchildren in plain school uniforms sitting on a woven floor mat in a courtyard, sharing a blank black slate and a piece of chalk, smiling.`],
  ["flux", "children-no-skin", `${STY} Two Indian children about 8 years old in plain school uniforms, one wearing glasses, sitting cross-legged on a woven floor mat sharing a blank slate.`],
  ["flux", "court-minimal-flux", `${STY} A sunlit Indian home courtyard in morning light with limewash walls and a neem tree. No people.`],
];
const { PROMPTS } = await import("./run-prompts.mjs");
for (const v of V) if (v[2] === "__FULL_COURTYARD__") v[2] = PROMPTS.find((p) => p.id === "i1-courtyard").text;
const out = [];
for (const [arm, id, prompt] of V) {
  const t0 = performance.now(); let status, err;
  const r = arm === "flash"
    ? await fetch(`${SI}/mai/v1/images/generations`, { method: "POST", headers: { "api-key": SIK, "content-type": "application/json" }, body: JSON.stringify({ model: "scout-mai-image26-flash", prompt, width: 1024, height: 1024 }) })
    : await fetch(`https://${HOST}.services.ai.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify({ model: "taxila-flux2", prompt, n: 1, width: 1024, height: 1024, output_format: "png" }) });
  const j = await r.json().catch(() => ({})); status = r.status; if (!r.ok) err = String(j.error?.message || JSON.stringify(j)).slice(0, 160);
  out.push({ arm, id, status, ms: Math.round(performance.now() - t0), err }); console.log(arm, id, status, err || "ok");
  await new Promise((s) => setTimeout(s, status === 429 ? 60000 : 31000));
}
writeFileSync(new URL(`results/filter-probe-2026-10-04${ROUND ? "-r2" : ""}.json`, import.meta.url), JSON.stringify({ date: "2026-10-04", variants: V.map(([a, id, p]) => ({ arm: a, id, prompt: p })), out }, null, 1));
