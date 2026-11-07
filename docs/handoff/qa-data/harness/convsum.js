let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const i=d.indexOf('{"tag"');if(i<0){console.log(d.slice(0,400));return}const j=JSON.parse(d.slice(i));
console.log('== '+j.tag+' lesson '+(j.start&&j.start.lessonId)+' topic '+(j.start&&j.start.topic));
for(const t of j.turns){ if(t.error){console.log(' t'+t.i+' ['+t.line.slice(0,50)+'] ERROR '+t.error+' '+JSON.stringify(t.ui));continue}
 console.log(' t'+t.i+' ['+t.line.slice(0,60)+'] move='+t.move+(t.verdict?' verdict='+t.verdict:'')+' sheet='+t.sheet+' HELPLINE='+t.helpline+(t.chips.length?' chips='+JSON.stringify(t.chips):'')+(t.tray&&t.tray!=='none'?' tray='+t.tray:'')+(t.topic?' topic='+t.topic:'')+'\n     "'+t.reply.slice(0,230)+'"');}
});
