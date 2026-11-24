import fs from 'fs';
const dir='/home/user/Taxila/data/curriculum/';
const ids=[];
for (const f of fs.readdirSync(dir).filter(f=>/^c\d-.*\.json$/.test(f))) {
  const j=JSON.parse(fs.readFileSync(dir+f)); for (const ch of j.chapters||[]) for (const t of ch.topics||[]) ids.push(t.id);
}
const ok=p=>ids.some(i=>i===p||i.startsWith(p+'-'));
const { HELDOUT } = await import('/home/user/Taxila/evals/conversation-session/heldout-intake.mjs');
const { OPENINGS } = await import('/home/user/Taxila/evals/conversation-session/openings.mjs');
const errs=[]; const cnt=(a,k)=>a.reduce((m,r)=>(m[k(r)]=(m[k(r)]||0)+1,m),{});
const KINDS=['taught','homework','test','not_understood','want','nothing','unknown','share'];
const seen=new Set();
for (const r of HELDOUT){ if(seen.has(r.id))errs.push('dup '+r.id); seen.add(r.id);
  if(!KINDS.includes(r.kind))errs.push('kind '+r.id); if(!(r.cls>=3&&r.cls<=8))errs.push('cls '+r.id);
  if(!['hinglish','hindi','english'].includes(r.lang))errs.push('lang '+r.id);
  if(!Array.isArray(r.gold)||!r.gold.length)errs.push('gold '+r.id);
  for(const g of r.gold){ if(g===null)continue; if(!ok(g))errs.push('bad gold '+r.id+' '+g); const c=+g.match(/^c(\d)/)[1]; if(c!==r.cls&&c!==r.cls-1)errs.push('gold class '+r.id);}
  if(r.lang==='hindi'&&!/[ऀ-ॿ]/.test(r.text))errs.push('hindi script '+r.id);
}
const P=['safeguard','child_request','test_revise','homework','school_continue','school_reteach','review','level_path'];
for (const o of OPENINGS){ if(seen.has(o.id))errs.push('dup '+o.id); seen.add(o.id);
  const c=o.ctx; if(c.subjects.length!==2)errs.push('subj '+o.id);
  for(const d of c.dueReviews) if(!ok(d)||!d.startsWith('c'+o.cls+'-'))errs.push('due '+o.id+' '+d);
  if(!ok(c.levelPathTopic)||!c.levelPathTopic.startsWith('c'+o.cls+'-'))errs.push('lpt '+o.id);
  for(const [s,n] of Object.entries(c.pointer)) if(!ok(`c${o.cls}-${s}-ch${String(n).padStart(2,'0')}`))errs.push('ptr '+o.id+' '+s);
  if(!P.includes(o.expect.purpose))errs.push('purpose '+o.id);
  if(o.expect.topicPrefix!==null&&!ok(o.expect.topicPrefix))errs.push('tp '+o.id);
  if(o.turns.length<1||o.turns.length>3||o.expect.maxTurns>o.turns.length||o.expect.maxTurns<1)errs.push('turns '+o.id);
  if(o.expect.purpose==='review'&&o.expect.topicPrefix!==c.dueReviews[0])errs.push('review first '+o.id);
  if(o.expect.purpose==='level_path'&&(c.dueReviews.length||o.expect.topicPrefix!==c.levelPathTopic))errs.push('lp '+o.id);
}
console.log('errors',errs);
console.log('HELDOUT',HELDOUT.length,cnt(HELDOUT,r=>r.kind),cnt(HELDOUT,r=>r.cls),cnt(HELDOUT,r=>r.lang), 'null-gold', HELDOUT.filter(r=>r.gold[0]===null).length);
console.log('OPENINGS',OPENINGS.length,cnt(OPENINGS,r=>r.expect.purpose),cnt(OPENINGS,r=>r.cls),cnt(OPENINGS,r=>r.lang));
