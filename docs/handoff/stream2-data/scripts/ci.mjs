import fs from "node:fs";
const { candidateIntents } = await import("/home/user/Taxila/server/studio/seam.js");
const dir="/home/user/Taxila/data/kits"; const c={}; let n=0, none=0;
for (const f of fs.readdirSync(dir).filter(f=>/^c\d-[a-z]+\.json$/.test(f))) for (const kit of JSON.parse(fs.readFileSync(dir+"/"+f)).topics) {
  n++; const r = candidateIntents({lessonId:"qa",kit,topicId:kit.topicId,child:{class_level:+kit.topicId[1]}}); if(!r.length) none++;
  for (const x of r) c[x.archetype]=(c[x.archetype]??0)+1; }
console.log(n, none, c);
