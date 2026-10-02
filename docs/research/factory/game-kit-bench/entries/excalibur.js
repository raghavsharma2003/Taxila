import { Engine, Actor, Label, vec, Color, Font, DisplayMode } from 'excalibur'; import {N,W,H,mkBalls,stepBalls,frame} from './_common.js';
const g=new Engine({width:W,height:H,displayMode:DisplayMode.Fixed}); const balls=mkBalls(); const a=balls.map(b=>{const x=new Actor({x:b.x,y:b.y,radius:8,color:Color.Orange}); g.add(x); return x;}); g.add(new Label({text:'score 0',pos:vec(10,30),font:new Font({size:20}),color:Color.White}));
g.on('postupdate',()=>{ stepBalls(balls); a.forEach((x,i)=>{x.pos.x=balls[i].x;x.pos.y=balls[i].y}); frame(); }); g.start();
