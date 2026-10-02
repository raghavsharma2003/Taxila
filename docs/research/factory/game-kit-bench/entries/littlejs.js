import * as L from 'littlejsengine'; import {N,W,H,mkBalls,stepBalls,frame} from './_common.js';
const balls=mkBalls(); L.setCanvasFixedSize(L.vec2(W,H));
L.engineInit(()=>{}, ()=>{ stepBalls(balls); }, ()=>{}, ()=>{ for(const b of balls) L.drawCircle(L.screenToWorld(L.vec2(b.x,b.y)), 0.5, L.rgb(1,.53,0)); L.drawTextScreen('score 0', L.vec2(60,20), 20); frame(); }, ()=>{});
