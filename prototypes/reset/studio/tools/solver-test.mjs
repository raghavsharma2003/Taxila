// Circuit Lab truth test (STUDIO-V2 §10, M4): runs the REAL solver source from 02-circuit-lab/circuit.js (extracted
// by text, not copied) against hand-computed loops. Usage: node prototypes/reset/studio/tools/solver-test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, "../02-circuit-lab/circuit.js"), "utf8");
const grab = (re) => { const m = src.match(re); if (!m) throw new Error("source changed: " + re); return m[0]; };
const PHYS_SRC = grab(/const PHYS = \{[^}]*\};/);
const MAT_SRC = grab(/const MATERIALS = \{[\s\S]*?\n  \};/);
const fnSrc = (name) => { const i = src.indexOf(`function ${name}(`); let d = 0, j = src.indexOf("{", i); for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); } throw new Error(name); };
const factory = new Function("edges", "N", `${PHYS_SRC}\n${MAT_SRC}\n${fnSrc("resistanceOf")}\n${fnSrc("solve")}\n${fnSrc("gaussSolve")}\nreturn { PHYS, solve };`);

// build a loop: nodes 0..n-1 in a ring, components on each edge
function ring(comps) { const edges = comps.map((comp, i) => ({ a: i, b: (i + 1) % comps.length, comp })); return { edges, N: comps.length }; }
const cell = (plusAtB = true) => ({ type: "cell", plus: null, _plusAtB: plusAtB });
function run(comps) {
  const { edges, N } = ring(comps);
  for (const e of edges) if (e.comp && e.comp.type === "cell") e.comp.plus = e.comp._plusAtB ? e.b : e.a;
  const { PHYS, solve } = factory(edges, N);
  solve();
  return { edges, PHYS };
}
const rows = [];
const near = (a, b, tol = 2e-3) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
function check(name, got, want, tol) { const ok = near(got, want, tol); rows.push({ name, got: +got.toFixed(5), want: +want.toFixed(5), ok }); }

const P = { V: 1.5, r: 0.4, Rb: 5, Rw: 0.02 };
{ // 1. one cell, one bulb, two wires: I = V / (r + Rb + 2Rw)
  const { edges } = run([cell(), { type: "wire" }, { type: "bulb" }, { type: "wire" }]);
  const I = P.V / (P.r + P.Rb + 2 * P.Rw);
  check("single loop current", Math.abs(edges[2].I), I);
  check("same current before and after bulb (t01-m2)", Math.abs(edges[1].I), Math.abs(edges[3].I));
}
{ // 2. open switch anywhere: zero current everywhere (t02-m2)
  const { edges } = run([cell(), { type: "wire" }, { type: "bulb" }, { type: "switch", closed: false }]);
  check("open switch after bulb -> bulb current", Math.abs(edges[2].I), 0, 1e-6);
}
{ // 3. two cells aiding: I = 2V / (2r + Rb + Rw)
  const { edges } = run([cell(), cell(), { type: "bulb" }, { type: "wire" }]);
  check("two cells aiding", Math.abs(edges[2].I), (2 * P.V) / (2 * P.r + P.Rb + P.Rw));
}
{ // 4. two cells opposing: zero
  const { edges } = run([cell(true), cell(false), { type: "bulb" }, { type: "wire" }]);
  check("two cells opposing", Math.abs(edges[2].I), 0, 1e-6);
}
{ // 5. pencil lead in the tester gap: I = V / (r + Rb + Rpencil + Rw)
  const { edges } = run([cell(), { type: "bulb" }, { type: "tester", material: "pencil" }, { type: "wire" }]);
  check("pencil lead conducts weakly (t03-m3)", Math.abs(edges[1].I), P.V / (P.r + P.Rb + 7 + P.Rw));
}
{ // 6. insulator in the gap
  const { edges } = run([cell(), { type: "bulb" }, { type: "tester", material: "eraser" }, { type: "wire" }]);
  check("eraser blocks", Math.abs(edges[1].I), 0, 1e-5);
}
{ // 7. short circuit: I = V / (r + 2Rw) and it is large (the cell "heats")
  const { edges } = run([cell(), { type: "wire" }, { type: "wire" }]);
  check("short circuit current", Math.abs(edges[1].I), P.V / (P.r + 2 * P.Rw));
}
{ // 8. two bulbs in series: each dimmer, P = I^2 Rb with I = V / (r + 2Rb)
  const { edges } = run([cell(), { type: "bulb" }, { type: "bulb" }, { type: "wire" }]);
  check("two bulbs in series current", Math.abs(edges[1].I), P.V / (P.r + 2 * P.Rb + P.Rw));
}
const pass = rows.filter((r) => r.ok).length;
console.table(rows);
console.log(`solver: ${pass}/${rows.length} pass`);
fs.writeFileSync(path.resolve(here, "../recordings/solver-test.json"), JSON.stringify({ date: new Date().toISOString(), method: "real solver source extracted from circuit.js, ring circuits, hand-computed Ohm's-law values, tolerance 0.2% relative", pass, n: rows.length, rows }, null, 1));
process.exit(pass === rows.length ? 0 : 1);
