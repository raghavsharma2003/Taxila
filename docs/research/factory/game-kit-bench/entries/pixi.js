import { Application, Graphics, Text, Sprite } from 'pixi.js'; import {N,W,H,mkBalls,stepBalls,frame} from './_common.js';
const app=new Application(); await app.init({width:W,height:H,preference:'webgl'}); document.body.appendChild(app.canvas);
const tex=app.renderer.generateTexture(new Graphics().circle(8,8,8).fill(0xff8800)); const balls=mkBalls(); const s=balls.map(b=>{const sp=new Sprite(tex); app.stage.addChild(sp); return sp;}); app.stage.addChild(new Text({text:'score 0',style:{fontSize:20,fill:0xffffff}}));
app.ticker.add(()=>{ stepBalls(balls); s.forEach((sp,i)=>{sp.x=balls[i].x;sp.y=balls[i].y}); frame(); });
