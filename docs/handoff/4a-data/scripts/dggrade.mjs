import fs from "node:fs";
const R = process.argv[2];
for (const arm of ["agent_gpt6", "director"]) {
  const c = {}; let n = 0;
  for (const f of fs.readdirSync(R + "/records").filter((f) => f.includes(`--${arm}--`))) {
    const r = JSON.parse(fs.readFileSync(`${R}/records/${f}`, "utf8"));
    for (const t of r.turns) {
      const d = t.decided; if (!d?.outcome) continue;
      n++;
      const cls = t.reasons?.classification?.outcome ?? "none";
      const k = `${d.depth}/${d.outcome} -> ${cls === "correct" ? "correct" : cls === "no_evidence" || cls === "none" ? "NO_EVID" : cls === "partial" ? "partial" : "wrong"}`;
      c[k] = (c[k] ?? 0) + 1;
    }
  }
  console.log(arm, "answered-a-posed-item turns:", n);
  for (const [k, v] of Object.entries(c).sort()) console.log("   ", k.padEnd(30), v);
}
