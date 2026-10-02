import * as ort from "onnxruntime-web"; import fs from "node:fs";
const src = fs.readFileSync("w2a.mjs","utf8");
ort.env.wasm.numThreads = 4;
const sess = await ort.InferenceSession.create(fs.readFileSync("w2a/wav2arkit_cpu.onnx"), { executionProviders: ["wasm"], externalData: [{ path: "wav2arkit_cpu.onnx.data", data: fs.readFileSync("w2a/wav2arkit_cpu.onnx.data") }] });
const AZ2OC = ["sil","aa","aa","O","E","RR","I","U","O","O","O","I","kk","RR","nn","SS","CH","TH","FF","DD","kk","PP"];
const OPEN = { aa:1.0, E:0.7, I:0.5, O:0.75, U:0.4, PP:0.0, SS:0.25, TH:0.3, DD:0.35, FF:0.15, kk:0.45, nn:0.3, RR:0.4, CH:0.3, sil:0.0 };
function readWav(f){const b=fs.readFileSync(f);let o=12,sr,data;while(o<b.length){const id=b.toString("ascii",o,o+4),sz=b.readUInt32LE(o+4);if(id==="fmt ")sr=b.readUInt32LE(o+12);if(id==="data"){data=b.subarray(o+8,o+8+sz);break;}o+=8+sz;}const x=new Float32Array(data.length/2);for(let i=0;i<x.length;i++)x[i]=data.readInt16LE(i*2)/32768;return{sr,x};}
const down=(x,r)=>{const y=new Float32Array(Math.floor(x.length/r));for(let i=0;i<y.length;i++){const p=i*r,k=Math.floor(p),f=p-k;y[i]=x[k]*(1-f)+(x[k+1]??0)*f;}return y;};
function pearson(a,b){const n=Math.min(a.length,b.length);let ma=0,mb=0;for(let i=0;i<n;i++){ma+=a[i];mb+=b[i];}ma/=n;mb/=n;let s=0,sa=0,sb=0;for(let i=0;i<n;i++){s+=(a[i]-ma)*(b[i]-mb);sa+=(a[i]-ma)**2;sb+=(b[i]-mb)**2;}return s/Math.sqrt(sa*sb||1);}
const FR=1000/30; const names=JSON.parse(fs.readFileSync("w2a/config.json")).blendshape_names;
const agg={}; 
for (const f of fs.readdirSync("stim").filter(f=>f.endsWith(".json")).sort()) {
  const meta=JSON.parse(fs.readFileSync("stim/"+f)); const w=readWav("stim/"+f.replace(".json",".wav")); const x=down(w.x,w.sr/16000);
  const dur=x.length/16; const gt=[]; const a=1-Math.exp(-FR/50); let y=0;
  for(let t=0;t<dur;t+=FR){let v="sil";for(const e of meta.visemes){if(e.t<=t)v=AZ2OC[e.id];else break;}y+=a*(OPEN[v]-y);gt.push(y);}
  const r=await sess.run({audio_waveform:new ort.Tensor("float32",x,[1,x.length])}); const n=r.blendshapes.dims[1], bs=r.blendshapes.data;
  const col=i=>Array.from({length:n},(_,k)=>bs[k*52+i]);
  const jaw=col(24); const combo=jaw.map((v,k)=>v+0.5*(bs[k*52+33]+bs[k*52+34])/2 - 0.5*bs[k*52+26]);
  const lagR=(sig)=>{let best=[-9,0];for(let L=-6;L<=9;L++){const A=[],B=[];for(let i=0;i<gt.length;i++){const j=i+L;if(j>=0&&j<sig.length){A.push(gt[i]);B.push(sig[j]);}}const rr=pearson(A,B);if(rr>best[0])best=[rr,L];}return best;};
  const lang=meta.lang; (agg[lang] ||= {jaw0:[],jawBest:[],lag:[],combo:[]});
  agg[lang].jaw0.push(pearson(gt,jaw)); const b=lagR(jaw); agg[lang].jawBest.push(b[0]); agg[lang].lag.push(b[1]*FR); agg[lang].combo.push(lagR(combo)[0]);
  if (f.startsWith("hi-deva1__hi-IN-Swara")) console.log("frames",n,"gt",gt.length,"jaw mean/max",(jaw.reduce((s,v)=>s+v,0)/n).toFixed(3),Math.max(...jaw).toFixed(3), "nan?", jaw.some(Number.isNaN));
}
const m=a=>(a.reduce((s,v)=>s+v,0)/a.length).toFixed(3);
for(const [k,v] of Object.entries(agg)) console.log(k,"jaw@0",m(v.jaw0),"jaw@bestlag",m(v.jawBest),"lags",v.lag.map(Math.round).join(","),"combo",m(v.combo));
