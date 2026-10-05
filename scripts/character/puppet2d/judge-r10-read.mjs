// r10 exploration only (not the acceptance judge): blind single-face emotion read. node judge-r10-read.mjs <img.jpg>... -> one phrase each
import fs from "node:fs";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local","utf8").split("\n")){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const E=process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/,""),K=process.env.AZURE_OPENAI_API_KEY;
const P=`This is a frame of an animated cartoon teacher talking to a child. In a few words, what emotion or attitude does her face express toward the child? Reply JSON only: {"reads":"..."}`;
const out = await Promise.all(process.argv.slice(2).map(async (f) => {
  const body={model:process.env.JUDGE_MODEL||"taxila-brain",max_completion_tokens:4000,response_format:{type:"json_object"},messages:[{role:"user",content:[{type:"text",text:P},{type:"image_url",image_url:{url:"data:image/jpeg;base64,"+fs.readFileSync(f).toString("base64")}}]}]};
  if(!process.env.JUDGE_MODEL) body.reasoning_effort="low";
  const r=await fetch(E+"/chat/completions",{method:"POST",headers:{"api-key":K,"content-type":"application/json"},body:JSON.stringify(body)});
  const j=await r.json(); return f.split("/").pop()+" "+(j.choices?.[0]?.message?.content||JSON.stringify(j).slice(0,200)).replace(/\s+/g," ");
}));
console.log(out.join("\n"));
