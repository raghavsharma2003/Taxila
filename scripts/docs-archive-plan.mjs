// The plan for taking finished-probe media out of docs/ (audit 2026-11-09, DOCS-41). It PLANS; it never deletes.
//
//   node scripts/docs-archive-plan.mjs            print the totals
//   node scripts/docs-archive-plan.mjs --write    also write docs/ARCHIVE-remove.txt (one path per line) and the tables
//                                                 in docs/ARCHIVE.md between its two markers
//   node scripts/docs-archive-plan.mjs --verify   exit 1 if docs/ARCHIVE-remove.txt is no longer what this script computes
//                                                 (run it again at the commit where the removal is done)
//
// A media file is proposed for removal only if ALL of these hold:
//   - it is binary media (MEDIA below) under docs/, and not under docs/design/round7 or docs/handoff;
//   - no code names it or a folder above it (CODE below: a path literal, or a "docs", "design", "x" path-join). A path
//     that appears only in a comment is not a reader. A path that is a file-name prefix (`…/probe-${date}`) keeps the
//     files in that folder whose names start with it;
//   - no kept write-up (md / html under docs/, the root *.md, context/*.md) names it, its folder with a wildcard, or
//     embeds it;
//   - it is not in KEEP (the teacher-face material the main loop said to keep).
// Everything else under docs/ is kept: write-ups, JSON / CSV results, patches, scripts.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, normalize } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const MEDIA = /\.(png|jpe?g|webp|gif|wav|pcm|mp3|ogg|opus|m4a|mp4|webm|mov|glb|gz|xz|tar|zip|part-\d+)$/i;
const NEVER = [/^docs\/design\/round7\//, /^docs\/handoff\//];
// docs/design/teacher: keep r8, r9, r10, lamp1, lamp2, route-b and the 3D head; a folder that cannot be mapped is kept.
// Only the 2D puppet's judging rounds 3 to 7 are evidence for scripts the face audit is deleting.
const TEACHER_REMOVABLE = /^docs\/design\/teacher\/puppet2d\/judge-r[3-7]\//;
const CODE = ["server", "src", "shared", "scripts", "tests", "evals", "infra", "public/site", ".github", "package.json", "Dockerfile", "Dockerfile.worker", "vite.config.ts"];
const TEXT = /\.(mjs|js|ts|tsx|json|py|sh|yml|yaml|html|css|md)$/;
const SELF = new Set(["scripts/docs-archive-plan.mjs", "docs/ARCHIVE.md", "docs/ARCHIVE-remove.txt"]);

const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, maxBuffer: 1 << 28 }).toString().split("\0").filter(Boolean);
const trackedSet = new Set(tracked);
const docsFiles = tracked.filter((f) => f.startsWith("docs/"));
const dirs = new Set();
for (const f of docsFiles) for (let d = dirname(f); d !== "." && !dirs.has(d); d = dirname(d)) dirs.add(d);
const size = (f) => { try { return statSync(join(ROOT, f)).size; } catch { return 0; } };

// 1. What code names. A named file keeps that file; a named folder keeps everything under it.
const keepFile = new Map(); // path → why
const keepDir = new Map(); // dir → why
const keepPrefix = new Map(); // "dir/name-prefix" → why
const TOO_BROAD = new Set(["docs", "docs/design", "docs/research"]);
// A reader in the product or in a gate test is binding. A reader in an offline tool (an eval, a character script, a
// screenshot harness that writes its own output folder) is reported apart: the main loop decides those tree by tree.
const HARD = (f) => /^(server|src|shared|infra|public|\.github)\//.test(f) || /^(package\.json|Dockerfile|vite\.config)/.test(f) || /^tests\/[^/]+\.test\.mjs$/.test(f) || /^tests\/fixtures\//.test(f);
const stronger = (a, b) => (a && HARD(a.split(":")[0]) ? a : b && HARD(b.split(":")[0]) ? b : a ?? b);
function nameIt(raw, why) {
  const p = normalize(raw).replace(/[.,;:)'"`]+$/, "");
  const bare = p.replace(/\/+$/, "");
  if (trackedSet.has(bare)) { keepFile.set(bare, stronger(keepFile.get(bare), why)); return; }
  const wild = bare.replace(/\/?\*.*$/, "");
  if (dirs.has(wild)) { if (!TOO_BROAD.has(wild)) keepDir.set(wild, stronger(keepDir.get(wild), why)); return; }
  // not a file and not a folder: a name prefix inside an existing folder, or a path that is simply not there
  if (dirs.has(dirname(wild)) && !/\.[a-z0-9]{1,5}$/i.test(wild)) keepPrefix.set(wild, stronger(keepPrefix.get(wild), why));
}
const COMMENT = /^\s*(\/\/|\*|\/\*|#|<!--)/;
const codeFiles = tracked.filter((f) => !SELF.has(f) && !f.startsWith("docs/") && CODE.some((c) => f === c || f.startsWith(c + "/")) && TEXT.test(f) && size(f) < 3_000_000);
for (const f of codeFiles) {
  const text = readFileSync(join(ROOT, f), "utf8");
  if (!text.includes("docs")) continue;
  text.split("\n").forEach((line, i) => {
    if (!line.includes("docs") || COMMENT.test(line)) return;
    // a trailing comment cannot read anything: keep only the code before " // " (not the "//" of a URL)
    const cut = line.search(/(^|[^:"'`])\/\/ /);
    if (cut > 0) line = line.slice(0, cut + 1);
    if (!line.includes("docs")) return;
    for (const m of line.matchAll(/docs\/[\w@.\/*-]+/g)) nameIt(m[0], `${f}:${i + 1}`);
    for (const m of line.matchAll(/["'`]docs["'`]((?:\s*,\s*["'`][\w@.*-]+["'`])+)/g)) nameIt("docs/" + [...m[1].matchAll(/["'`]([\w@.*-]+)["'`]/g)].map((x) => x[1]).join("/"), `${f}:${i + 1}`);
  });
}

// 2. What a kept write-up names or embeds.
const cited = new Map(); // media path → the write-up
const writeups = [...docsFiles.filter((f) => /\.(md|html?)$/i.test(f)), ...tracked.filter((f) => /^[^/]+\.md$/.test(f) || /^context\/[^/]+\.md$/.test(f))].filter((f) => !SELF.has(f) && size(f) < 5_000_000);
const mediaByDir = new Map();
for (const f of docsFiles) if (MEDIA.test(f)) { const d = dirname(f); mediaByDir.set(d, [...(mediaByDir.get(d) ?? []), f]); }
for (const w of writeups) {
  const text = readFileSync(join(ROOT, w), "utf8");
  const here = dirname(w);
  for (const m of text.matchAll(/[\w@.\/*%-]+\.(?:png|jpe?g|webp|gif|wav|pcm|mp3|ogg|opus|m4a|mp4|webm|mov|glb|gz|xz)\b/gi)) {
    const ref = decodeURIComponent(m[0].replace(/%(?![0-9a-f]{2})/gi, "%25")).replace(/^\.\//, "");
    for (const base of [here, ".", "docs"]) {
      const p = normalize(join(base, ref));
      if (p.includes("*")) {
        const ext = p.slice(p.lastIndexOf("."));
        const stem = p.slice(p.lastIndexOf("/") + 1, p.indexOf("*"));
        for (const f of mediaByDir.get(dirname(p)) ?? []) if (f.endsWith(ext) && f.slice(f.lastIndexOf("/") + 1).startsWith(stem) && !cited.has(f)) cited.set(f, w);
      } else if (trackedSet.has(p) && p.startsWith("docs/") && !cited.has(p)) cited.set(p, w);
    }
  }
}

// 3. Classify every media file under docs/.
const under = (f, map) => { for (let d = dirname(f); d !== "."; d = dirname(d)) if (map.has(d)) return map.get(d); return null; };
const byPrefix = (f) => { for (const [pre, why] of keepPrefix) if (f.startsWith(pre) && dirname(f) === dirname(pre)) return why; return null; };
const rows = [];
for (const f of docsFiles) {
  if (!MEDIA.test(f)) continue;
  let cls, why = "";
  if (NEVER.some((re) => re.test(f))) cls = "kept: round 7 or handoff";
  else if (keepFile.has(f) || under(f, keepDir) || byPrefix(f)) {
    why = [keepFile.get(f), under(f, keepDir), byPrefix(f)].filter(Boolean).reduce((a, b) => stronger(a, b));
    cls = HARD(why.split(":")[0]) ? "kept: named by the product or a gate test" : "kept: named by an offline tool";
  }
  else if (f.startsWith("docs/design/teacher/") && !TEACHER_REMOVABLE.test(f)) cls = "kept: teacher face material";
  else if (cited.has(f)) { cls = "kept: named by a write-up"; why = cited.get(f); }
  else if (/\.gz$/i.test(f) && /\.(html?|md|txt|json|jsonl|csv)\.gz$/i.test(f)) cls = "kept: a compressed write-up or result";
  else cls = "remove";
  rows.push({ f, cls, why, bytes: size(f) });
}
const tree = (f) => { const p = f.split("/"); return p[1] === "design" || p[1] === "research" ? p.slice(0, 3).join("/") : p.slice(0, 2).join("/"); };
const sum = (list) => ({ n: list.length, bytes: list.reduce((a, r) => a + r.bytes, 0) });
const mb = (b) => (b / 1e6).toFixed(b < 1e7 ? 1 : 0);
const remove = rows.filter((r) => r.cls === "remove").map((r) => r.f).sort();
const classes = [...new Set(rows.map((r) => r.cls))].sort();
const trees = [...new Set(rows.map((r) => tree(r.f)))].sort((a, b) => sum(rows.filter((r) => tree(r.f) === b && r.cls === "remove")).bytes - sum(rows.filter((r) => tree(r.f) === a && r.cls === "remove")).bytes);
const head = execFileSync("git", ["rev-parse", "--short=9", "HEAD"], { cwd: ROOT }).toString().trim();

let table = `| Tree | Remove: files | Remove: MB | Kept, product or gate test | Kept, offline tool | Kept, a write-up names it | Kept, other | Example reader |\n|---|---|---|---|---|---|---|---|\n`;
for (const t of trees) {
  const here = rows.filter((r) => tree(r.f) === t);
  const c = (cls) => sum(here.filter((r) => r.cls === cls));
  const other = sum(here.filter((r) => !["remove", "kept: named by the product or a gate test", "kept: named by an offline tool", "kept: named by a write-up"].includes(r.cls)));
  const ex = here.find((r) => r.cls === "kept: named by the product or a gate test")?.why ?? here.find((r) => r.cls === "kept: named by an offline tool")?.why ?? here.find((r) => r.cls === "kept: named by a write-up")?.why ?? "";
  table += `| ${t} | ${c("remove").n} | ${mb(c("remove").bytes)} | ${c("kept: named by the product or a gate test").n} (${mb(c("kept: named by the product or a gate test").bytes)} MB) | ${c("kept: named by an offline tool").n} (${mb(c("kept: named by an offline tool").bytes)} MB) | ${c("kept: named by a write-up").n} (${mb(c("kept: named by a write-up").bytes)} MB) | ${other.n} (${mb(other.bytes)} MB) | ${ex ? "`" + ex + "`" : ""} |\n`;
}
const all = sum(rows), rm = sum(rows.filter((r) => r.cls === "remove")), docsAll = sum(docsFiles.map((f) => ({ bytes: size(f) })));
let totals = `| | Files | MB |\n|---|---|---|\n| Everything under docs/ | ${docsAll.n} | ${mb(docsAll.bytes)} |\n| Media under docs/ | ${all.n} | ${mb(all.bytes)} |\n| **Proposed for removal** | **${rm.n}** | **${mb(rm.bytes)}** |\n`;
for (const c of classes.filter((c) => c !== "remove")) totals += `| ${c[0].toUpperCase() + c.slice(1)} | ${sum(rows.filter((r) => r.cls === c)).n} | ${mb(sum(rows.filter((r) => r.cls === c)).bytes)} |\n`;
totals += `| docs/ after the removal | ${docsAll.n - rm.n} | ${mb(docsAll.bytes - rm.bytes)} |\n`;
const byExt = {};
for (const r of rows.filter((r) => r.cls === "remove")) { const e = r.f.slice(r.f.lastIndexOf(".") + 1).toLowerCase(); (byExt[e] ??= []).push(r); }
const exts = Object.entries(byExt).sort((a, b) => sum(b[1]).bytes - sum(a[1]).bytes).map(([e, l]) => `${e} ${l.length} (${mb(sum(l).bytes)} MB)`).join(", ");
const block = `<!-- plan:start (written by scripts/docs-archive-plan.mjs --write; do not edit by hand) -->\nComputed at commit \`${head}\`. Code files scanned: ${codeFiles.length}. Write-ups scanned: ${writeups.length}.\n\n${totals}\nBy type, proposed for removal: ${exts}.\n\n${table}<!-- plan:end -->`;

const LIST = "docs/ARCHIVE-remove.txt", DOC = "docs/ARCHIVE.md";
const listText = remove.join("\n") + "\n";
if (process.argv.includes("--verify")) {
  const now = existsSync(join(ROOT, LIST)) ? readFileSync(join(ROOT, LIST), "utf8") : "";
  if (now !== listText) { console.error(`${LIST} is stale: it lists ${now.split("\n").filter(Boolean).length} files, the plan now computes ${remove.length}. Run --write and read the difference before removing anything.`); process.exit(1); }
  console.log(`${LIST} matches the plan: ${remove.length} files, ${mb(rm.bytes)} MB`);
} else if (process.argv.includes("--write")) {
  writeFileSync(join(ROOT, LIST), listText);
  const doc = readFileSync(join(ROOT, DOC), "utf8");
  const a = doc.indexOf("<!-- plan:start"), b = doc.indexOf("<!-- plan:end -->");
  if (a < 0 || b < 0) throw new Error(`${DOC} lacks the plan markers`);
  writeFileSync(join(ROOT, DOC), doc.slice(0, a) + block + doc.slice(b + "<!-- plan:end -->".length));
  console.log(`wrote ${LIST} (${remove.length} files, ${mb(rm.bytes)} MB) and the tables in ${DOC}`);
} else console.log(totals);
