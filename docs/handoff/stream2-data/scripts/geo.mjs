import fs from "node:fs";
const {planEngine, validModes}=await import("/home/user/Taxila/shared/engine-catalog.js"); const {engineConfigError}=await import("/home/user/Taxila/server/director/engine-check.js");
const topic = process.argv[2] ?? "c6-maths-ch06-t01";
const kit=JSON.parse(fs.readFileSync(`/home/user/Taxila/data/kits/${topic.split("-").slice(0,2).join("-")}.json`)).topics.find(t=>t.topicId===topic); const tm=JSON.parse(fs.readFileSync("/home/user/Taxila/shared/engine-topic-map.json"));
for (const item of [null,...kit.items]) for (const mode of ["show","predict"]) { const p=planEngine({kit,item,lang:"hinglish",mode,representation:"diagram",topicMap:tm}); if(!p){console.log(item?.id,mode,"none");continue;} const params=validModes(p.engine,p.params); console.log(item?.id, mode, p.engine, JSON.stringify(params).slice(0,120), "ERR:", engineConfigError(p.engine,params)); }
