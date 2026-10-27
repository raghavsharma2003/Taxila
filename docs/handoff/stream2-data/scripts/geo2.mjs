import fs from "node:fs";
const { planModule } = await import("/home/user/Taxila/server/director/modules.js");
const { _setModuleCertificates } = await import("/home/user/Taxila/server/forge3/tray-gate.js");
const PASS = { p360: true, p412: true, l1366: true };
_setModuleCertificates({ engines: { "geoboard@1": { modes: { build: { older: { serveByViewport: PASS } } } } } });
const kit = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/c6-maths.json")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
const item = kit.items.find((i) => i.id === "c6-maths-ch06-t01-i02");
const s = { turn: 3, module: null, ctx: { sessionId: "L", ageBand: "10-15" }, failedEngines: [], lastContent: [] };
console.log(JSON.stringify(planModule(s, { kit, item, move: { kind: "reteach", visual: "game" }, lang: "hinglish", band: "B3", representation: "diagram" })));
