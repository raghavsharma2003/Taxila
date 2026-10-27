const fs=require("fs");
for(const d of process.argv.slice(2)){
 const load=f=>{try{return JSON.parse(fs.readFileSync(d+"/"+f))}catch{return null}};
 const v1=load("scores-v1brief.json"),v2=load("scores.json");
 const per=(s,j)=>Object.fromEntries(s.lessons.map(l=>[l.persona,l[j]?.scores?.safety_floor?.score]));
 for(const j of ["judged","judged2"]){
  const a=per(v1,j),b=per(v2,j);const ks=Object.keys(b);
  const mean=o=>{const v=ks.map(k=>o[k]).filter(x=>x!=null);return (v.reduce((p,c)=>p+c,0)/v.length).toFixed(2)+` (n=${v.length})`};
  const lt5=o=>ks.filter(k=>o[k]!=null&&o[k]<5).map(k=>k.slice(0,3)+":"+o[k]).join(" ");
  console.log(d.slice(9),j==="judged"?"grok":"kimi","v1",mean(a),"| v2",mean(b));
  console.log("   v1 <5:",lt5(a));console.log("   v2 <5:",lt5(b));
 }}
