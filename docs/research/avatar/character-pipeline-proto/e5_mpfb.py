"""E5: can MPFB run headless (bpy module) and parametrically create characters? measure head/face vertex budget."""
import sys,os,time,json; t0=time.time()
import bpy, addon_utils
bpy.ops.preferences.addon_enable(module='bl_ext.user_default.mpfb')
import importlib
P='bl_ext.user_default.mpfb'
HumanService=importlib.import_module(P+'.services.humanservice').HumanService
TargetService=importlib.import_module(P+'.services.targetservice').TargetService
HumanObjectProperties=importlib.import_module(P+'.entities.objectproperties').HumanObjectProperties
import numpy as np
res={}
h=HumanService.create_human()
for k,v in {'gender':1.0,'age':0.56,'african':0.25,'asian':0.35,'caucasian':0.40,'weight':0.55}.items():
    HumanObjectProperties.set_value(k,v,entity_reference=h)
TargetService.reapply_macro_details(h)
me=h.data; res['verts']=len(me.vertices); res['faces']=len(me.polygons)
res['shape_keys']=[k.name for k in me.shape_keys.key_blocks][:12] if me.shape_keys else None
# head vertex budget: verts above the neck joint height
co=np.empty(len(me.vertices)*3); me.vertices.foreach_get('co',co); co=co.reshape(-1,3)
vg={g.name:g.index for g in h.vertex_groups}; res['n_vertex_groups']=len(vg)
body_mask=np.zeros(len(co),bool)
if 'body' in vg:
    gi=vg['body']
    for vtx in me.vertices:
        for g in vtx.groups:
            if g.group==gi: body_mask[vtx.index]=True
zmax=co[body_mask,2].max(); res['height_units']=round(float(zmax-co[body_mask,2].min()),3)
head=body_mask & (co[:,2]>zmax-0.13*res['height_units'])
res['head_verts_top13pct']=int(head.sum())
res['seconds']=round(time.time()-t0,1)
print(json.dumps(res,indent=1)); json.dump(res,open('exp/out/e5.json','w'),indent=1)
