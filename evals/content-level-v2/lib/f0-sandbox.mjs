// Applies docs/design/reset/prework/rs6/patches/01-content-f0.patch (and 02-kits-ge.patch) to a TEMP COPY of just
// server/director/items.js, server/content/next-topic.js (and server/content/kits.js), and imports them. The rest of the
// server is reached through re-export shims to the real files; db.js and content/index.js are stubs (no database).
// The working tree is never modified. Used by the F0 unit tests and by served.mjs (served-new).
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const REPO = new URL("../../../", import.meta.url).pathname;
const PATCHES = join(REPO, "docs/design/reset/prework/rs6/patches");

export async function loadF0Sandbox({ mergedKits = false, kitsDir } = {}) {
  const root = mkdtempSync(join(process.env.RS6_TMP || tmpdir(), "rs6-f0-"));
  const S = (p) => join(root, p);
  for (const d of ["server/director", "server/content", "server/learner/kt", "server/compiler"]) mkdirSync(S(d), { recursive: true });
  copyFileSync(join(REPO, "server/director/items.js"), S("server/director/items.js"));
  copyFileSync(join(REPO, "server/content/next-topic.js"), S("server/content/next-topic.js"));
  copyFileSync(join(REPO, "server/content/kits.js"), S("server/content/kits.js"));
  // Day 0 (2026-10-05): the patches are applied in the real tree; a patch already applied is detected (its reverse
  // dry-run succeeds) and not applied twice, so the sandbox then holds copies of the REAL files (db.js still stubbed).
  // (marker: each patch's own new export; a reverse dry-run is not used because the tree may have tuned a constant since)
  const MARK = { "01-content-f0.patch": ["server/director/items.js", "function buildF0Queue"], "02-kits-ge.patch": ["server/content/kits.js", "demand"] };
  for (const p of ["01-content-f0.patch", "02-kits-ge.patch"]) {
    const [file, mark] = MARK[p];
    if (!readFileSync(S(file), "utf8").includes(mark)) execFileSync("patch", ["-p1", "-s", "-d", root, "-i", join(PATCHES, p)]);
  }
  const shim = (rel) => writeFileSync(S(rel), `export * from ${JSON.stringify(pathToFileURL(join(REPO, rel)).href)};\n`);
  ["server/director/register.js", "server/learner/kt/ability.js", "server/content/curriculum.js", "server/compiler/compile.js", "server/learner/brief.js"].forEach(shim);
  writeFileSync(S("server/db.js"), "export const q = async (sql, args) => (globalThis.__rs6Rows ?? []);\nexport const one = async () => null;\n");
  writeFileSync(S("server/content/index.js"), `import { topicIdByPrefix } from "./curriculum.js";\nexport const topicOf = (id) => topicIdByPrefix(id);\nexport const getKit = async () => null;\n`);
  let mergedDir = null;
  // Day 0: data/kits already carries the overlay (merge.mjs stamps `relevel` on a merged kit file): never merge it twice.
  const alreadyMerged = (() => { try { return !!JSON.parse(readFileSync(join(REPO, "data/kits/c4-maths.json"), "utf8")).relevel; } catch { return false; } })();
  if (mergedKits && !alreadyMerged) {
    const { mergeDir } = await import(pathToFileURL(join(REPO, "data/kits-relevel/merge.mjs")).href);
    mergedDir = S("kits-merged");
    mergeDir(join(REPO, "data/kits"), join(REPO, "data/kits-relevel"), mergedDir);
  }
  const prevKits = process.env.TAXILA_KITS_DIR;
  // The copied kits.js resolves its default dir relative to the temp copy, so always point it at real kits or the merge.
  process.env.TAXILA_KITS_DIR = kitsDir || mergedDir || join(REPO, "data/kits");
  const u = (rel) => pathToFileURL(S(rel)).href;
  const items = await import(u("server/director/items.js"));
  const nextTopic = await import(u("server/content/next-topic.js"));
  const kits = await import(u("server/content/kits.js"));
  const curriculum = await import(pathToFileURL(join(REPO, "server/content/curriculum.js")).href);
  return { root, items, nextTopic, kits, curriculum, mergedDir,
    cleanup() { if (prevKits === undefined) delete process.env.TAXILA_KITS_DIR; else process.env.TAXILA_KITS_DIR = prevKits; rmSync(root, { recursive: true, force: true }); } };
}
