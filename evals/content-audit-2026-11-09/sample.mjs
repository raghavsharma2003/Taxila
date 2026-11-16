import fs from "fs";
const S=process.argv[2]; // output directory
let seed=20261109; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
const pick=(a,n)=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b.slice(0,n);};
const kitQ={},kitK={};
for (const f of fs.readdirSync("data/kits").filter(f=>/^c\d+-[a-z]+\.json$/.test(f)).sort()) {
  const d=JSON.parse(fs.readFileSync("data/kits/"+f)); const subj=d.subject, cls=d.class;
  const items=d.topics.flatMap(t=>t.items.map(it=>({t,it}))).filter(x=>x.it.kind!=="teachback");
  const n=subj==="maths"?40:(subj==="science"||subj==="evs")?30:20;
  const q=[],k=[];
  for(const {t,it} of pick(items,n)){ q.push({id:it.id,class:cls,subject:subj,kind:it.kind,prompt_en:it.prompt_en,prompt_hi:it.prompt_hi}); k.push({id:it.id,answer:it.answer,acceptable:it.acceptable}); }
  const diags=d.topics.flatMap(t=>(t.misconceptions||[]).filter(m=>m.diagnostic).map(m=>m));
  for(const m of pick(diags,subj==="maths"?10:6)){ q.push({id:"DIAG:"+m.id,class:cls,subject:subj,kind:"mcq",prompt_en:m.diagnostic.prompt_en,prompt_hi:m.diagnostic.prompt_hi,options:m.diagnostic.options.map(o=>o.text)}); k.push({id:"DIAG:"+m.id,answer:m.diagnostic.options.filter(o=>o.correct).map(o=>o.text).join(" | ")}); }
  if(subj==="maths"){ const ex=d.topics.flatMap(t=>[...(t.skillExamples||[]).map(e=>({id:"EX:"+e.skillId,problem:e.problem,givens:e.givens,find:e.find,key:{steps:e.steps,answer:e.answer}})), ...(t.workedExample?[{id:"WE:"+t.topicId,problem:t.workedExample.problem,key:{steps:t.workedExample.steps,faded:t.workedExample.fadedVersion}}]:[])]);
    for(const e of pick(ex,8)){ q.push({id:e.id,class:cls,subject:subj,kind:"worked_example",prompt_en:e.problem,givens:e.givens,find:e.find}); k.push({id:e.id,...e.key}); } }
  kitQ[f]=q; kitK[f]=k;
}
const plQ={},plK={};
for (const f of fs.readdirSync("data/placement").filter(f=>/^c\d+-[a-z]+\.json$/.test(f)).sort()) {
  const d=JSON.parse(fs.readFileSync("data/placement/"+f));
  plQ[f]=d.items.map(it=>({id:it.id,class:d.class,subject:d.subject,band:it.band,format:it.format,prompt_en:it.prompt_en,prompt_hi:it.prompt_hi,...(it.unit?{unit:it.unit}:{}),...(it.options?{options:it.options.map(o=>o.text)}:{})}));
  plK[f]=d.items.map(it=>({id:it.id,answer:it.answer,acceptable:it.acceptable,unit:it.unit,usable:(it.verified?.agrees===true||it.adjudicated?.keyCorrect===true)&&!it.anchorMismatch&&!it.retired}));
}
const B={
 b1:{kits:["c1-maths","c2-maths","c3-maths"],pl:[]},
 b2:{kits:["c4-maths","c5-maths"],pl:["c4-maths","c5-maths"]},
 b3:{kits:["c6-maths","c7-maths"],pl:["c6-maths","c7-maths"]},
 b4:{kits:["c8-maths","c9-maths"],pl:["c3-maths","c8-maths"]},
 b5:{kits:["c6-science","c7-science","c8-science","c9-science"],pl:[]},
 b6:{kits:["c3-evs","c4-evs","c5-evs"],pl:["c3-evs","c4-evs","c5-evs"]},
 b7:{kits:["c6-sst","c7-sst","c8-sst","c9-sst"],pl:["c6-science","c7-science","c8-science"]},
 b8:{kits:[1,2,3,4,5,6,7,8,9].map(c=>`c${c}-english`),pl:[]},
 b9:{kits:[1,2,3,4,5,6,7,8,9].map(c=>`c${c}-hindi`),pl:[]},
};
for(const [b,{kits,pl}] of Object.entries(B)){
  const q=[...kits.flatMap(k=>kitQ[k+".json"]),...pl.flatMap(k=>plQ[k+".json"])], k=[...kits.flatMap(x=>kitK[x+".json"]),...pl.flatMap(x=>plK[x+".json"])];
  fs.mkdirSync(`${S}/solve/${b}`,{recursive:true}); fs.mkdirSync(`${S}/solve/keys-${b}`,{recursive:true});
  fs.writeFileSync(`${S}/solve/${b}/questions.json`,JSON.stringify(q,null,1)); fs.writeFileSync(`${S}/solve/keys-${b}/keys.json`,JSON.stringify(k,null,1));
  console.log(b,q.length,fs.statSync(`${S}/solve/${b}/questions.json`).size);
}
