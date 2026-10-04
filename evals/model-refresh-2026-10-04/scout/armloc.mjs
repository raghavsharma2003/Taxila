import { arm, SUB } from "/home/user/Taxila/evals/model-refresh-2026-10-04/setup/arm.mjs";
import { writeFileSync } from "node:fs";
const out={};
for (const loc of ["southindia","centralindia","eastus2"]) {
  let url=`/subscriptions/${SUB}/providers/Microsoft.CognitiveServices/locations/${loc}/models?api-version=2025-06-01`, all=[];
  while(url){ const r=await arm("GET",url); all.push(...(r.body.value||[])); url=r.body.nextLink||null; }
  out[loc]=all.map(v=>({fmt:v.model?.format,name:v.model?.name,ver:v.model?.version,life:v.model?.lifecycleStatus,skus:(v.model?.skus||[]).map(s=>s.name),dep:v.model?.deprecation?.inference,kind:v.kind}));
  console.log(loc, all.length);
}
writeFileSync("arm-loc.json",JSON.stringify(out));
