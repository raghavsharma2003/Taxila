const E=process.env, BASE=E.AZURE_OPENAI_ENDPOINT.replace(/\/+$/,"").replace(/\/openai\/v1$/,""), KEY=E.AZURE_OPENAI_API_KEY;
const hosts=[BASE.replace(".openai.azure.com",".services.ai.azure.com"), BASE.replace(".openai.azure.com",".cognitiveservices.azure.com")];
const paths=["/models/embeddings?api-version=2024-05-01-preview","/openai/deployments/measure-cohere-embed5-pro/embeddings?api-version=2024-10-21","/v2/embed","/providers/cohere/v2/embed"];
for(const h of hosts) for(const p of paths){ const body=p.includes("embed?")||p.endsWith("/embed")?{model:"measure-cohere-embed5-pro",texts:["teen bata chaar","three quarters"],input_type:"search_document",embedding_types:["float"]}:{model:"measure-cohere-embed5-pro",input:["teen bata chaar","three quarters"]};
 const r=await fetch(h+p,{method:"POST",headers:{"api-key":KEY,"content-type":"application/json"},body:JSON.stringify(body)}); const t=await r.text(); console.log(r.status,h.split(".")[1],p,t.slice(0,160).replace(/\s+/g," ")); }
