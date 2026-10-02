"""Headless Blender: ICT neutral -> ARKit shape keys -> visemes -> GLB. Run: bpyenv/bin/python exp/e1_build.py OUTDIR"""
import sys, os, time, json; sys.path.insert(0, os.path.dirname(__file__))
import bpy, numpy as np
from load import v
from arkit import ARKIT52, ict_sources, VISEMES
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
t0=time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
F=os.path.join(os.path.dirname(__file__),'..','ICT-FaceKit','FaceXModel')
bpy.ops.wm.obj_import(filepath=os.path.join(F,'generic_neutral_mesh.obj'), forward_axis='NEGATIVE_Z', up_axis='Y')
ob=bpy.context.selected_objects[0]; me=ob.data
N=len(me.vertices); co=np.empty(N*3); me.vertices.foreach_get('co',co); co=co.reshape(-1,3)
raw=v("generic_neutral_mesh"); conv=raw.copy()
err=np.abs(co-conv).max(); print('verts',N,'order-preserved max err',err)
assert N==raw.shape[0] and err<1e-4
def to_bl(a): return a
ob.shape_key_add(name='Basis')
cache={}
missing=[]
for a in ARKIT52:
    srcs=ict_sources(a)
    if not srcs: missing.append(a); ob.shape_key_add(name=a); continue  # placeholder, zero delta
    d=sum(to_bl(v(s))-conv for s in srcs)
    k=ob.shape_key_add(name=a); k.data.foreach_set('co',(conv+d).ravel()); cache[a]=d
for vname,mix in VISEMES.items():
    d=np.zeros_like(conv)
    for a,w in mix.items():
        if a in cache: d+=w*cache[a]
    k=ob.shape_key_add(name=vname); k.data.foreach_set('co',(conv+d).ravel())
print('missing (authored later):',missing,'build s',round(time.time()-t0,1))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'ict_arkit.blend'))
def export(name, **kw):
    p=os.path.join(out,name)
    bpy.ops.export_scene.gltf(filepath=p, export_format='GLB', export_morph=True, export_animations=False, export_skins=False, **kw)
    return os.path.getsize(p)
res={}
res['full_morphNormals']=export('ict_full_mn.glb', export_morph_normal=True)
res['full_noMorphNormals']=export('ict_full.glb', export_morph_normal=False)
# trim helper geometry (transparent eye blend/occlusion/lacrimal) and back of head stays
bpy.context.view_layer.objects.active=ob
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
names=[m.name for m in me.materials]; print('materials',names)
drop={i for i,m in enumerate(names) if any(k in m for k in ('EyeBlend','EyeOcclusion','LacrimalFluid'))}
for p in me.polygons: p.select = p.material_index in drop
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='FACE'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.delete_loose(); bpy.ops.object.mode_set(mode='OBJECT')
res['trim_verts']=len(me.vertices); res['trim_tris']=sum(len(p.vertices)-2 for p in me.polygons)
res['trim_noMorphNormals']=export('ict_trim.glb', export_morph_normal=False)
res['shape_keys']=len(me.shape_keys.key_blocks)-1
print(json.dumps(res,indent=1)); json.dump(res,open(os.path.join(out,'e1.json'),'w'),indent=1)
print('total s',round(time.time()-t0,1))
