import fs from "node:fs";
const p = "/home/user/Taxila/context/inbox/r145-4a.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
if (!j.nodes.some((n) => n.id === "ms-r145-f1d-fade-landed")) j.nodes.push({
  id: "ms-r145-f1d-fade-landed", kind: "measurement", at: "2026-10-21",
  title: "Census F8 / F1(d) (3437b744 t9-13: the a₃₀ gap posed with no worked example landed), in director/state.js teach(). The faded step was posed on the turn after the worked lead whatever the reply: reproduced 24/24 (8 seeds x engaged / don't-know / off-topic). Now a stuck (don't know, asks for the answer) or off-topic reply to the worked lead turns the planned fade into the whole worked example (guidance reason fade.not_landed), then practice; an engaged reply still gets the gap. Sim lab (353 records, r5-rel143 decided-gate + sl3): 181 first fade posings, 140 right after the worked lead; 8 of those 140 followed a stuck or off-topic reply (offTopic 4, dontKnow 2, asksForAnswer 2) and now get the worked example instead. Test that fails on the base: tests/r145-fade-landed.test.mjs.",
});
fs.writeFileSync(p, JSON.stringify(j, null, 1) + "\n");
