import bpy, sys, os, numpy as np
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=sys.argv[-1])
o=[x for x in bpy.data.objects if x.type=='MESH'][0]; arm=[x for x in bpy.data.objects if x.type=='ARMATURE'][0]
mw=np.array(o.matrix_world); me=o.data
P=np.array([v.co[:]+(1,) for v in me.vertices])@mw.T; P=P[:,:3]
vg={g.index:g.name for g in o.vertex_groups}
for side in ['LEye','REye']:
    idx=[v.index for v in me.vertices if any(vg[g.group]=='Bip01 '+side and g.weight>0.5 for g in v.groups)]
    Q=P[idx]
    A=np.c_[2*Q,np.ones(len(Q))]; b=(Q**2).sum(1); s=np.linalg.lstsq(A,b,rcond=None)[0]; c=s[:3]; r=np.sqrt(s[3]+c@c)
    print(side,'n',len(Q),'fit c',c.round(4),'r',round(r,4),'front y',Q[:,1].min().round(4),'bbox',Q.min(0).round(4),Q.max(0).round(4))
    bm=arm.data.bones['Bip01 '+side]; h=np.array(arm.matrix_world)@np.array(list(bm.head_local)+[1]); print(' bone head',h[:3].round(4))
for n in ['Bip01 Head','Bip01 Neck','Bip01 Spine2','Bip01 L Clavicle','Bip01 R Clavicle','Bip01 L UpperArm','Bip01 MJaw']:
    bm=arm.data.bones[n]; h=np.array(arm.matrix_world)@np.array(list(bm.head_local)+[1]); print(n,h[:3].round(4))
kb=me.shape_keys.key_blocks
B=np.array([v.co[:] for v in kb['Basis'].data])
for k in ['_Neutral','AK_25_JawOpen','AK_09_EyeBlinkLeft','AK_11_EyeLookDownLeft','HB_12_TongueUp','HB_09_TongueIn','HB_11_TongueDown','HB_08_TongueOut','AK_52_TongueOut','AA_VI_10_aa','AK_44_MouthSmileLeft']:
    K=np.array([v.co[:] for v in kb[k].data]); d=np.linalg.norm(K-B,axis=1)*0.01
    print(k,'max mm',round(d.max()*1000,2),'n moved',(d>1e-5).sum(), 'eyes moved', d[idx].max()*1000 if len(idx) else 0)
os._exit(0)
