import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder});
for (const f of process.argv.slice(2)) { const doc = await io.read(f);
  for (const m of doc.getRoot().listMeshes()) { const names = m.getExtras()?.targetNames; if (!names) continue;
   const ci = names.indexOf('mouthClose'), ji = names.indexOf('jawOpen'); if (ci<0) continue;
   for (const p of m.listPrimitives()) { const T=p.listTargets(); if (!T[ci]) continue;
    const c = T[ci].getAttribute('POSITION'), j = T[ji].getAttribute('POSITION'); const n=c.getCount(); const a=[0,0,0], b=[0,0,0];
    let upMin=0, upMax=0, jmax=0;
    for (let i=0;i<n;i++){ c.getElement(i,a); j.getElement(i,b); if (a[1]<upMin) upMin=a[1]; if (a[1]>upMax) upMax=a[1]; const jm=Math.hypot(...b); if (jm>jmax) jmax=jm; }
    console.log(f, m.getName(), 'mouthClose dy range [', upMin.toFixed(4), upMax.toFixed(4), '] jawOpen max |d|', jmax.toFixed(4));
   } } }
