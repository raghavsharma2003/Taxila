// RUNNER half of the persona/safety invariant suite (data in ./persona-invariants.data.mjs). For EVERY registered
// teacher character it compiles the real instructions on every lane × language × age band × move shape and runs
// the floor checks on each, then runs the in-run negative controls: deliberately broken prompts that each check
// must reject. Exit 1 on any failed check or any control that passed. Run by scripts/verify-release.mjs.
//   node evals/persona-invariants.mjs
import { CHARACTERS } from "../server/compiler/characters/index.js";
import { buildLanes, FLOOR_CHECKS, negativeControls } from "./persona-invariants.data.mjs";

let pass = 0, fail = 0;
const failures = [];
const characters = Object.values(CHARACTERS);
if (!characters.length) { console.log("FAIL  no registered characters"); process.exit(1); }

for (const c of characters) {
  const lanes = buildLanes(c);
  console.log(`\n── ${c.id}: ${lanes.length} compiled lanes × ${FLOOR_CHECKS.length} floor checks ──`);
  for (const [name, check] of FLOOR_CHECKS) {
    const bad = lanes.map((l) => [l, check(l)]).filter(([, r]) => r !== true);
    if (bad.length) { fail++; failures.push(`${c.id}: ${name}`); console.log(`FAIL  ${name}  ${bad.length}/${lanes.length}: ${bad[0][0].id}: ${bad[0][1]}`); }
    else { pass++; console.log(`PASS  ${name}  (${lanes.length}/${lanes.length})`); }
  }
  console.log(`\n── ${c.id}: negative controls (each must FAIL its check) ──`);
  for (const good of [lanes.find((l) => l.lane === "text" && l.move === "practice"), lanes.find((l) => l.lane === "voice" && l.move === "practice")]) {
    for (const [name, broken] of negativeControls(good)) {
      const check = FLOOR_CHECKS.find(([n]) => n === name)?.[1];
      const r = check ? check(broken) : true;
      if (r === true) { fail++; failures.push(`${c.id}: control ${name} (${good.lane}) passed`); console.log(`FAIL  control passed: ${name} (${good.lane})`); }
      else { pass++; console.log(`PASS  control rejected: ${name} (${good.lane}) → ${String(r).slice(0, 80)}`); }
    }
  }
}
console.log(fail ? `\n${fail} of ${pass + fail} FAILED:\n${failures.map((f) => `  - ${f}`).join("\n")}` : `\nALL ${pass} CHECKS PASS across ${characters.length} characters`);
process.exitCode = fail ? 1 : 0;
