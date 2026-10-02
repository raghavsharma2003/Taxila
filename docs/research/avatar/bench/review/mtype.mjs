import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder});
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f); const types = {}; let sparse=0, tb=0, verts=0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) for (const t of p.listTargets()) for (const s of t.listSemantics()) {
    const a = t.getAttribute(s); const k = s+':'+a.getArray().constructor.name+(a.getNormalized()?'N':''); types[k]=(types[k]||0)+1; if (a.getSparse()) sparse++; tb += a.getArray().byteLength; }
  console.log(f, JSON.stringify(types), 'sparse', sparse, 'targetArrayMB', (tb/1e6).toFixed(1));
}
