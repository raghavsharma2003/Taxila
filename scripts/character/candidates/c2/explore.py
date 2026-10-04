import bpy, bmesh, sys, os
from collections import defaultdict, Counter
f = sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=f)
arm = [o for o in bpy.data.objects if o.type=='ARMATURE'][0]
me_o = [o for o in bpy.data.objects if o.type=='MESH'][0]
print('arm scale', arm.scale[:], 'rot', arm.rotation_euler[:], 'mesh scale', me_o.scale[:], me_o.matrix_world.to_scale()[:])
print([b.name for b in arm.data.bones])
me = me_o.data
bm = bmesh.new(); bm.from_mesh(me)
bm.verts.ensure_lookup_table()
# loose parts
seen=set(); parts=[]
for v in bm.verts:
    if v.index in seen: continue
    stack=[v]; comp=[]
    seen.add(v.index)
    while stack:
        x=stack.pop(); comp.append(x.index)
        for e in x.link_edges:
            o=e.other_vert(x)
            if o.index not in seen: seen.add(o.index); stack.append(o)
    parts.append(comp)
mw = me_o.matrix_world
vg = {g.index:g.name for g in me_o.vertex_groups}
for comp in sorted(parts, key=len, reverse=True):
    mats=Counter()
    vs=set(comp)
    for fc in bm.faces:
        if fc.verts[0].index in vs: mats[me.materials[fc.material_index].name]+=1
    co=[mw @ me.vertices[i].co for i in comp]
    mn=[min(c[k] for c in co) for k in range(3)]; mx=[max(c[k] for c in co) for k in range(3)]
    w=Counter()
    for i in comp:
        for g in me.vertices[i].groups:
            if g.weight>0.3: w[vg[g.group]]+=1
    print(len(comp), dict(mats), [round(x,3) for x in mn], [round(x,3) for x in mx], w.most_common(3))
os._exit(0)
