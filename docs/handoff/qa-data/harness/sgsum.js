const d=require('fs').readFileSync(process.argv[2],'utf8');const j=JSON.parse(d.slice(d.indexOf('{')));
console.log('== '+process.argv[3]);console.log(' start chips',JSON.stringify(j.start.chips),'board',j.start.ui.board,'hint',j.start.ui.hint);
for(const s of j.steps){ if(s.closeSheet){console.log(' close:',s.closeSheet);continue}
 console.log(' ['+s.line.slice(0,30)+'] move',s.move,'| chips',JSON.stringify(s.ui&&s.ui.chips),'| sheet',s.ui&&s.ui.sheet,'| hint',s.ui&&s.ui.hint,'| type',s.ui&&s.ui.type,s.couldNotType?'| NOTYPE':'','\n   reply:',(s.reply||'').slice(0,220));}
