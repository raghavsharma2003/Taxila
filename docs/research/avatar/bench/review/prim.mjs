import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder});
for (const f of process.argv.slice(2)) { const doc = await io.read(f); console.log(f);
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const t=p.listTargets(); const n=p.getAttribute('POSITION').getCount();
   if (t.length) console.log('  ', m.getName(), 'verts', n, 'targets', t.length, 'semantics', t[0].listSemantics().join('+'), 'nonzeroVertsInTarget0', (()=>{const a=t[0].getAttribute('POSITION').getArray();let c=0;for(let i=0;i<a.length;i+=3) if(a[i]||a[i+1]||a[i+2]) c++;return c})()); } }
