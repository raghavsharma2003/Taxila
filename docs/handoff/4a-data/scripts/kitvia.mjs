import fs from "fs";
const { scanSafetyDetail } = await import("/home/user/Taxila/server/director/safety.js");
const out = [];
const visit = (o, path) => {
  if (typeof o === "string") { if (o.length < 400) { const d = scanSafetyDetail(o); if (d.distress) out.push({ path, kind: d.kind, via: d.via, text: o }); } }
  else if (Array.isArray(o)) o.forEach((x, i) => visit(x, `${path}[${i}]`));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) visit(v, `${path}.${k}`);
};
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((f) => f.endsWith(".json"))) visit(JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")), f);
console.log(JSON.stringify(out, null, 1));
