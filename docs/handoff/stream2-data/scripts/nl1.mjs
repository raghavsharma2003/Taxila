import fs from "node:fs";
const m = await import("/home/user/Taxila/server/forge3/certify-tray.js");
const all = await m.moduleSamples(40);
const pick = all.filter((s) => s.engine === "number-line@1" && ["c7-maths-ch01-t02", "c4-maths-ch04-t03"].includes(s.topicId));
console.log(JSON.stringify(pick.map((s) => ({ t: s.topicId, mode: s.mode, band: s.band, params: s.params })), null, 0).slice(0, 2000));
