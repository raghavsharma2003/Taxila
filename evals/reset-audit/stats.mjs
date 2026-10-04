import fs from "fs";
const D = process.env.RA + "/out"; let turns = 0, mounts = [], boards = 0, lessons = 0, lat = [];
for (const f of fs.readdirSync(D).filter((f) => /^(l-|k-|v-|y-|s-).*\.json$/.test(f))) {
  const j = JSON.parse(fs.readFileSync(`${D}/${f}`));
  for (const r of j.resp || []) {
    let b = r.body; if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
    if (!b) continue;
    if (/lesson\/start/.test(r.url) && r.status < 300) lessons++;
    if (/lesson\/turn/.test(r.url) && r.status < 300) { turns++; for (const m of b.moduleCommands || []) mounts.push(`${f}:${m.op}:${m.engine ?? ""}`); if (JSON.stringify(b).match(/"board"|whiteboard|"draw"/)) boards++; }
  }
  for (const s of j.steps || []) { if (s.turnMs) lat.push(s.turnMs); }
}
lat.sort((a, b) => a - b);
console.log({ lessons, turns, mounts, boards, voiceLat: lat, median: lat[Math.floor(lat.length / 2)] });
