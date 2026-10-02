import {N,W,H,mkBalls,stepBalls,frame} from './_common.js';
const c=document.createElement('canvas'); c.width=W; c.height=H; document.body.appendChild(c); const x=c.getContext('2d'); const balls=mkBalls();
function loop(){ stepBalls(balls); x.fillStyle='#000'; x.fillRect(0,0,W,H); x.fillStyle='#f80'; for(const b of balls){x.beginPath();x.arc(b.x,b.y,8,0,6.283);x.fill();} x.fillStyle='#fff'; x.font='20px sans-serif'; x.fillText('score 0',10,30); frame(); requestAnimationFrame(loop);} requestAnimationFrame(loop);
