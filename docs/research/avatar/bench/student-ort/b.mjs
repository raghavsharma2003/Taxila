import * as ort from 'onnxruntime-web';
import fs from 'fs';
ort.env.wasm.numThreads=1; ort.env.wasm.simd=true;
for (const f of process.argv.slice(2)) {
  const s=await ort.InferenceSession.create(fs.readFileSync(f).buffer,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  const feeds={x:new ort.Tensor('float32',new Float32Array(84),[1,84,1])};
  const C=f.includes('t00')?8:f.includes('03')?96:f.includes('05')?160:224, H=f.includes('t00')?8:f.includes('03')?96:f.includes('05')?128:192;
  [1,2,4,8,16].forEach((d,i)=>{const cin=i?C:84;feeds['s'+i]=new ort.Tensor('float32',new Float32Array(cin*2*d),[1,cin,2*d]);});
  feeds.h0=new ort.Tensor('float32',new Float32Array(H),[1,1,H]);
  for(let i=0;i<300;i++) await s.run(feeds);
  const t=[]; for(let i=0;i<2000;i++){const a=performance.now(); const o=await s.run(feeds); t.push(performance.now()-a);}
  t.sort((a,b)=>a-b); console.log(f,'median',t[1000].toFixed(3),'p95',t[1900].toFixed(3),'ms/frame');
}
