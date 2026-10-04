import { writeFileSync } from "node:fs";
let tok=null, all=[], page=0;
do {
  const body = { filters: [{ field: "labels", operator: "eq", values: ["latest"] }], pageSize: 100, ...(tok?{continuationToken:tok}:{}) };
  const r = await fetch("https://api.catalog.azureml.ms/asset-gallery/v1.0/models", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json(); all.push(...(j.summaries||[])); tok=j.continuationToken; page++;
  if(page%5==0) console.error(page, all.length);
} while(tok && page<200);
const slim = all.map(s=>({name:s.name,ver:s.version,pub:s.publisher,reg:s.registryName,created:s.createdTime,life:s.lifecycle,direct:s.isDirectFromAzure,hosted:s.hostedOn,opts:s.deploymentOptions,skus:(s.deploymentSku||[]).map(k=>({n:k.name,l:k.locations})),tasks:s.inferenceTasks,inMod:s.modelLimits?.supportedInputModalities,outMod:s.modelLimits?.supportedOutputModalities,langs:s.modelLimits?.supportedLanguages,lic:s.license,minQ:s.minQuotaTier,retire:s.deprecation?.inferenceRetirementDate,summary:(s.summary||'').slice(0,240),offers:s.azureOffers}));
writeFileSync("catalog-all.json", JSON.stringify(slim));
console.log(all.length);
