// cheap F0 (normalised autocorrelation, 16 kHz, 512-sample window, 80-400 Hz) as a main-thread per-frame cost
const fs=16000, W=512, x=new Float32Array(W); let f0s=[];
function f0(buf){ let best=0,bl=0; let e0=0; for(let i=0;i<W;i++) e0+=buf[i]*buf[i];
  for(let L=40;L<=200;L++){ let s=0,e1=0; for(let i=0;i<W-L;i++){ s+=buf[i]*buf[i+L]; e1+=buf[i+L]*buf[i+L]; } const c=s/Math.sqrt(e0*e1+1e-9); if(c>best){best=c;bl=L;} }
  return best>0.5? fs/bl : 0; }
const ts=[]; for(let it=0;it<3000;it++){ const hz=180+40*Math.sin(it/50); for(let i=0;i<W;i++) x[i]=Math.sin(2*Math.PI*hz*i/fs)+0.3*Math.sin(4*Math.PI*hz*i/fs)+0.05*(Math.random()-0.5);
  const t0=process.hrtime.bigint(); const f=f0(x); ts.push(Number(process.hrtime.bigint()-t0)/1e3); f0s.push(Math.abs(f-hz)/hz); }
ts.sort((a,b)=>a-b); f0s.sort((a,b)=>a-b);
console.log(`F0 per frame: p50 ${ts[1500].toFixed(0)} us, p99 ${ts[2970].toFixed(0)} us; rel err p50 ${(f0s[1500]*100).toFixed(1)}% p95 ${(f0s[2850]*100).toFixed(1)}%`);
