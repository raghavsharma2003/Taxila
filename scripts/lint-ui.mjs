#!/usr/bin/env node
// UI lint (PRODUCT-DESIGN-V2 §14 B1-A8): a static scan of src/**/*.{css,ts,tsx}.
//   L-LAMP   lamp tokens (--lamp-*) and [data-lamp] only on the Answer dock (desk.css .dk-dock rules, AnswerDock.tsx,
//            the signals layer that writes it on the transition frame) and where they are defined (tokens.css)
//   L-HEX    no raw hex colours outside src/styles/tokens.css (PD-G13); token colours only
//   L-DEVA   no Devanagari in chrome strings (English-only chrome, G-EN-1): rendered files (*.tsx) and copy tables
//            (copy.ts). Content is not chrome. The lint tells them apart (CONTENT below, each with its reason):
//             - the child's or the teacher's SPOKEN words, marked `lint-ui: speech` on that line or the line above;
//             - a JSX line that renders into a [data-speech] region (the attribute is on the line): captions, the ask,
//               the board, tray labels, quoted answers;
//             - an activity's lesson-language triplet in a module engine (`tri(en, hinglish, hindi)` or
//               `{ english, hinglish, hindi }` in src/modules/frame/engines/**): TrayContent, chosen by the lesson's
//               language, never by the chrome;
//             - a Devanagari character range inside a regular expression (`/[ऀ-ॿ]/`): code that DETECTS the
//               script, not a string anyone sees.
//            System notices inside the frame or the host (loading, failed, can't open) are chrome and stay English.
//            (Speech processing in src/lesson/*.ts is not chrome and is not scanned.)
//   L-HING   no Hinglish chrome words (G-EN-1's wordlist, read from src/ui/copy.ts HINGLISH_CHROME so there is one
//            list): whole words inside a string literal or JSX text of a rendered file (*.tsx), with the same CONTENT
//            exemptions as L-DEVA (a Hinglish lesson's words are content; "Haan" on a button is chrome)
//   L-HOLD   no placeholder strings in what a child or parent can see ("coming soon", "jald aa rahi",
//            "Not available yet", or an upper-case "TODO" inside a string literal or JSX text; lower-case "todo" is
//            a Hinglish word, "todo" = break, as in "1 ko 10 mein todo")
//
//   node scripts/lint-ui.mjs                  every rule over all of src/ (exit 1 on any finding)
//   node scripts/lint-ui.mjs --paths a,b      only files under these paths (the npm-test gate uses the B1 paths)
//   node scripts/lint-ui.mjs --json           machine-readable findings
//
// ALLOW below lists the exemptions, each with its reason. A new exemption needs a reason, or it is a finding.
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const only = (arg("--paths") ?? "").split(",").filter(Boolean);
const asJson = process.argv.includes("--json");

/** rule → path prefixes exempt, with the reason. */
export const ALLOW = {
  "L-LAMP": [
    ["src/styles/tokens.css", "the lamp tokens are defined here"],
    ["src/child/lesson/AnswerDock.tsx", "the dock is the one lamp target (§4.2 rule 5)"],
    ["src/lesson/signals.ts", "writes [data-lamp] on the dock on the transition frame (§4.2 rule 1)"],
  ],
  "L-HEX": [
    ["src/styles/tokens.css", "the palette is defined here"],
    ["src/modules/frame/", "the sandboxed engine frame is its own document with its own kit palette"],
    ["src/avatar/three/", "WebGL material and shader colours (not CSS)"],
    ["src/pages/LessonDev.tsx", "dev route only (/dev/lesson, VITE_DEV_ROUTES=1): never in a production build"],
    ["src/pages/AvatarDev.tsx", "dev route only (/dev/avatar, VITE_DEV_ROUTES=1): never in a production build"],
  ],
  "L-DEVA": [],
  "L-HING": [["src/ui/copy.ts", "defines the wordlist itself"]],
  "L-HOLD": [],
};

/** L-DEVA / L-HING content (not chrome): [path prefix ("" = any file), line test, reason]. Each exemption covers the
 *  content and nothing else on the line: the line is reduced by CONTENT_STRIP first and the rest is still tested.
 *  (A whole-line exemption let `<p data-speech="">{cap}</p><button>Haan</button>` and a marker on the line above
 *  exempt chrome: B4 fixer, 2026-10-03.) */
export const CONTENT = [
  ["src/modules/frame/engines/", (line) => /\btri\(\s*["'`]/.test(line) || /\bhindi\s*:/.test(line) && /\benglish\s*:/.test(line),
    "an activity's lesson-language triplet (what it asks, or an answer it offers): TrayContent. Controls and verdicts use chrome() (English)"],
  ["src/modules/frame/kit/i18n.ts", (line) => /\btri\(\s*["'`]/.test(line), "the shared activity prompts and answer words (W): TrayContent; W's controls use chrome()"],
  ["src/child/lesson/useDesk.ts", (line) => /^\s*\w+:\s*\[\s*"[^"]*",\s*"[^"]*",\s*"[^"]*"\s*\],?\s*$/.test(line),
    "REQUESTS: the CHILD's words sent to the Director as a chip, one per lesson language (shown as what the child said)"],
];
/** Strip the spoken-content parts of a line, leaving whatever else it renders to be tested:
 *   - the text of an element that itself carries data-speech (`<q data-speech="">…</q>`, or a self-closing one);
 *   - ONE string literal on a line marked `// lint-ui: speech` (the child's or the teacher's spoken words). A marked
 *     line with more than one literal is not exempt at all: the marker names one string, never a ternary of labels. */
export function stripContent(line) {
  let l = line.replace(/<([A-Za-z][\w.]*)\b[^<>]*\bdata-speech\b[^<>]*\/>/g, "")
    .replace(/<([A-Za-z][\w.]*)\b[^<>]*\bdata-speech\b[^<>]*>(?:(?!<\/?\1\b)[\s\S])*<\/\1>/g, "");
  if (/\/\/\s*lint-ui:\s*speech\b/.test(l)) {
    const code = l.replace(/\/\/.*$/, "");
    const lits = [...code.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)];
    if (lits.length === 1) l = code.slice(0, lits[0].index) + '""' + code.slice(lits[0].index + lits[0][0].length);
  }
  return l;
}
/** Where L-DEVA and L-HING look: every rendered file and every string table under src/, except the speech pipeline
 *  (src/lesson, src/voice: what she says and hears is processed there, never shown as chrome) and dev-only routes. */
export const LANG_SCOPE = (file) => /\.(tsx|ts)$/.test(file) && !/\.d\.ts$/.test(file) &&
  !/^src\/(lesson|voice)\//.test(file) && !/(^|\/)dev\//.test(file) && !/^src\/pages\/(LessonDev|AvatarDev)\.tsx$/.test(file);
/** Not text anyone reads: a regex character class holding Devanagari (a range or the danda: code that detects or
 *  splits the script; no quote inside, so a string array never matches) and a string of Devanagari digits only (a
 *  numeral lookup table). */
const stripScriptRanges = (line) => line.replace(/\[[^\]\n"'`]*[\u0900-\u097F][^\]\n"'`]*\]/g, "[]")
  .replace(/(["'`])[\u0966-\u096F]+\1/g, '""');

/** The §5.3 wordlist, parsed from src/ui/copy.ts (one source). */
export const HINGLISH = (() => {
  try {
    const src = readFileSync(join(ROOT, "src/ui/copy.ts"), "utf8");
    const body = /HINGLISH_CHROME\s*=\s*\[([\s\S]*?)\]/.exec(src)?.[1] ?? "";
    // + words B4 found in chrome that the §5.3 list lacks ("Kaun padhega?", "Kya tum … ho?" on Who; "tum" itself is the address value, not chrome): propose them for
    //   HINGLISH_CHROME, whose owner is src/ui
    return [...[...body.matchAll(/"([a-z ]+)"/g)].map((m) => m[1]), "kya", "kaun", "padhega"];
  } catch { return []; }
})();
const HING_RE = new RegExp(`\\b(${HINGLISH.join("|") || "(?!)"})\\b`, "i");
/** The visible text of a line: string literals and JSX text, without comments, imports, class names or keys. */
const visibleText = (line) => {
  // string-literal union members ("bagiya" | "aasmaan") are ids in a type or a comparison, never rendered text
  const l = line.replace(/\/\/.*$|\/\*.*?\*\//g, "").replace(/(["'])[a-z_-]*\1(?=\s*\|)|(?<=\|\s*)(["'])[a-z_-]*\2/g, "");
  if (/^\s*(import|export \{)/.test(l)) return "";
  const lits = [...l.matchAll(/(["'`])((?:(?!\1).)*)\1/g)].filter((m) => !/(className|key|id|data-[\w-]+|href|to|src|name|type|role)=$/.test(l.slice(0, m.index).trimEnd() + "")).map((m) => m[2]);
  const jsx = [...l.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]);
  return [...lits, ...jsx].join(" | ");
};

const RULES = {
  "L-LAMP": { test: (line) => /--lamp-|data-lamp|\[data-lamp\]/.test(line), why: "lamp token or [data-lamp] outside the dock" },
  "L-HEX": { test: (line) => /(^|[^\w&])#[0-9a-fA-F]{3}([0-9a-fA-F]{1,5})?\b/.test(line.replace(/\/\/.*$|\/\*.*?\*\//g, "")) && !/#[0-9a-fA-F]{3,8}\s*["'`]?\s*\)?\s*;?\s*\/\/\s*lint-ui:\s*hex-ok/.test(line), why: "raw hex colour outside tokens.css" },
  "L-DEVA": { test: (line) => /[\u0900-\u097F]/.test(stripScriptRanges(line)), why: "Devanagari in a chrome string (content: see CONTENT; mark spoken words `lint-ui: speech`)" },
  "L-HING": { test: (line) => HING_RE.test(visibleText(line)), why: "Hinglish chrome word (G-EN-1 wordlist; content: see CONTENT)" },
  "L-HOLD": {
    test: (line) => /["'`][^"'`\n]*\b(coming soon|jald aa rahi|not available yet)\b[^"'`\n]*["'`]/i.test(line) || /["'`][^"'`\n]*\bTODO\b[^"'`\n]*["'`]/.test(line) || />[^<{}\n]*\b(coming soon|jald aa rahi|not available yet)\b[^<{}\n]*</i.test(line),
    why: "placeholder string a person can see",
  },
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(css|ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

export function lintSource(file, text) {
  const findings = [];
  const lines = text.split("\n");
  const css = file.endsWith(".css");
  let inDockRule = false;
  lines.forEach((line, i) => {
    // CSS: track whether we are inside a .dk-dock rule (the lamp may be styled there and nowhere else)
    if (css && /\{/.test(line)) inDockRule = /\.dk-dock\b/.test(line.split("{")[0]) || (inDockRule && !/\}/.test(line));
    for (const [id, rule] of Object.entries(RULES)) {
      if (ALLOW[id].some(([p]) => file.startsWith(p))) continue;
      if (!rule.test(line)) continue;
      if (id === "L-LAMP" && css && (inDockRule || /\.dk-dock\b/.test(line))) continue;
      if ((id === "L-LAMP" || id === "L-HOLD") && /^\s*(\/\/|\*|\/\*)/.test(line)) continue; // comments may name them
      if ((id === "L-DEVA" || id === "L-HING") && !LANG_SCOPE(file)) continue;
      if ((id === "L-DEVA" || id === "L-HING") && /^\s*(\/\/|\*|\/\*)/.test(line)) continue; // comments are not rendered
      if ((id === "L-DEVA" || id === "L-HING") && CONTENT.some(([p, ok]) => file.startsWith(p) && ok(line))) continue;
      if ((id === "L-DEVA" || id === "L-HING") && !rule.test(stripContent(line))) continue;
      findings.push({ rule: id, file, line: i + 1, why: rule.why, text: line.trim().slice(0, 120) });
    }
    if (css && /\}/.test(line) && !/\{[^}]*$/.test(line)) inDockRule = false;
  });
  return findings;
}

/** A path is a directory (or a file): "src/ui" holds src/ui/** and never the sibling src/ui-v3/** (W2 integration). */
const under = (f, p) => f === p || f.startsWith(p.endsWith("/") ? p : `${p}/`);
export function lint({ paths = [] } = {}) {
  const files = walk(join(ROOT, "src")).map((f) => relative(ROOT, f)).filter((f) => !paths.length || paths.some((p) => under(f, p)));
  return files.flatMap((file) => lintSource(file, readFileSync(join(ROOT, file), "utf8")));
}

/** The B1-owned paths (the npm-test gate); the rest of src/ is reported by a bare run for its owners. */
export const B1_PATHS = ["src/ui", "src/styles", "src/child/lesson", "src/stage", "src/app", "src/lesson", "src/avatar/picker"];

if (import.meta.url === `file://${process.argv[1]}`) {
  const f = lint({ paths: only });
  if (asJson) console.log(JSON.stringify(f, null, 2));
  else {
    for (const x of f) console.log(`${x.rule} ${x.file}:${x.line}  ${x.why}\n    ${x.text}`);
    const by = Object.groupBy ? Object.groupBy(f, (x) => x.rule) : {};
    console.log(`\nlint-ui: ${f.length} finding(s)${only.length ? ` under ${only.join(", ")}` : " in src/"} ${JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.length])))}`);
  }
  process.exit(f.length ? 1 : 0);
}
