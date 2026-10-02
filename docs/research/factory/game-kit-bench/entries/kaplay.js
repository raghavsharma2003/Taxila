import kaplay from 'kaplay'; import {N,W,H,mkBalls,stepBalls,frame} from './_common.js';
const k=kaplay({width:W,height:H,background:[0,0,0]}); const balls=mkBalls(); const objs=balls.map(b=>k.add([k.circle(8),k.pos(b.x,b.y),k.color(255,136,0)])); k.add([k.text('score 0',{size:20}),k.pos(10,10)]);
k.onUpdate(()=>{ stepBalls(balls); objs.forEach((o,i)=>{o.pos.x=balls[i].x;o.pos.y=balls[i].y}); frame(); });
