#!/usr/bin/env node
// UI lint (PRODUCT-DESIGN-V2 §14 B1-A8): a static scan of src/**/*.{css,ts,tsx}.
//   L-LAMP   lamp tokens (--lamp-*) and [data-lamp] only on the Answer dock (desk.css .dk-dock rules, AnswerDock.tsx,
//            the signals layer that writes it on the transition frame) and where they are defined (tokens.css)
//   L-HEX    no raw hex colours outside src/styles/tokens.css (PD-G13); token colours only
//   L-DEVA   no Devanagari in chrome strings (English-only chrome): rendered files (*.tsx) and copy tables
//            (copy.ts). A line may carry Devanagari only when it is the child's or the teacher's SPOKEN words, marked
//            `lint-ui: speech` on that line or the line above. (Speech processing in src/lesson/*.ts is not chrome.)
//   L-HOLD   no placeholder strings in what a child or parent can see ("coming soon", "jald aa rahi",
//            "Not available yet", "TODO" inside a string literal or JSX text)
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
  ],
  "L-DEVA": [],
  "L-HOLD": [],
};

const RULES = {
  "L-LAMP": { test: (line) => /--lamp-|data-lamp|\[data-lamp\]/.test(line), why: "lamp token or [data-lamp] outside the dock" },
  "L-HEX": { test: (line) => /(^|[^\w&])#[0-9a-fA-F]{3}([0-9a-fA-F]{1,5})?\b/.test(line.replace(/\/\/.*$|\/\*.*?\*\//g, "")) && !/#[0-9a-fA-F]{3,8}\s*["'`]?\s*\)?\s*;?\s*\/\/\s*lint-ui:\s*hex-ok/.test(line), why: "raw hex colour outside tokens.css" },
  "L-DEVA": { test: (line) => /[ऀ-ॿ]/.test(line), why: "Devanagari in a chrome string (mark spoken words `lint-ui: speech`)" },
  "L-HOLD": {
    test: (line) => /["'`][^"'`\n]*\b(coming soon|jald aa rahi|not available yet|TODO)\b[^"'`\n]*["'`]/i.test(line) || />[^<{}\n]*\b(coming soon|jald aa rahi|not available yet)\b[^<{}\n]*</i.test(line),
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
      if (id === "L-DEVA" && !(file.endsWith(".tsx") || /(^|\/)copy\.ts$/.test(file))) continue;
      if (id === "L-DEVA" && (/lint-ui:\s*speech/.test(line) || /lint-ui:\s*speech/.test(lines[i - 1] ?? ""))) continue;
      findings.push({ rule: id, file, line: i + 1, why: rule.why, text: line.trim().slice(0, 120) });
    }
    if (css && /\}/.test(line) && !/\{[^}]*$/.test(line)) inDockRule = false;
  });
  return findings;
}

export function lint({ paths = [] } = {}) {
  const files = walk(join(ROOT, "src")).map((f) => relative(ROOT, f)).filter((f) => !paths.length || paths.some((p) => f.startsWith(p)));
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
