export const N = 200, W = 360, H = 640;
export function mkBalls(){ const a=[]; let s=1; const r=()=>{s=(s*16807)%2147483647;return s/2147483647}; for(let i=0;i<N;i++)a.push({x:r()*W,y:r()*H,vx:(r()-.5)*4,vy:(r()-.5)*4}); return a; }
export function stepBalls(a){ for(const b of a){ b.x+=b.vx; b.y+=b.vy; if(b.x<0||b.x>W)b.vx*=-1; if(b.y<0||b.y>H)b.vy*=-1; } }
let frames=0, started=false;
export function frame(){ if(!started){ started=true; window.__firstFrame=performance.now(); setTimeout(()=>{ window.__fps=frames/5; },5000);} frames++; }
