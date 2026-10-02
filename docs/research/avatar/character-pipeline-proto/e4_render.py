"""E4: headless QA contact sheet: render poses of the high-res ARKit head (Cycles CPU)."""
import sys,os,time; import bpy, numpy as np
out='exp/out'; t0=time.time()
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'ict_arkit.blend'))
ob=bpy.data.objects['generic_neutral_mesh']
bpy.context.view_layer.objects.active=ob
bpy.ops.object.shade_smooth()
COL={'Face':(0.55,0.36,0.25,1),'BackHead':(0.55,0.36,0.25,1),'GumsTongue':(0.5,0.12,0.12,1),'Teeth':(0.9,0.9,0.85,1),'Sclera':(0.95,0.95,0.95,1),'Iris':(0.08,0.05,0.03,1),'EyeLashes':(0.02,0.02,0.02,1)}
for i,m in enumerate(ob.data.materials):
    nm=bpy.data.materials.new('qa_'+m.name); nm.use_nodes=True; b=nm.node_tree.nodes['Principled BSDF']
    c=next((v for k,v in COL.items() if k in m.name),None)
    b.inputs['Base Color'].default_value=c or (0.5,0.5,0.5,1); b.inputs['Roughness'].default_value=0.5
    if c is None: b.inputs['Alpha'].default_value=0.0
    ob.data.materials[i]=nm
sc=bpy.context.scene
cam_data=bpy.data.cameras.new('cam'); cam=bpy.data.objects.new('cam',cam_data); sc.collection.objects.link(cam)
# ICT is Y-up in data; the object matrix rotates it to Blender Z-up. Face looks toward -Y in world.
cam.location=(0,-48,1.5); cam.rotation_euler=(np.radians(90),0,0); cam_data.lens=85; sc.camera=cam
L=bpy.data.lights.new('key','AREA'); L.energy=4000; L.size=20; lo=bpy.data.objects.new('key',L); lo.location=(-20,-35,20); lo.rotation_euler=(np.radians(60),0,np.radians(-30)); sc.collection.objects.link(lo)
w=bpy.data.worlds.new('w'); w.color=(0.25,0.25,0.25); sc.world=w
sc.render.engine=os.environ.get('ENGINE','CYCLES'); sc.cycles.samples=16; sc.cycles.device='CPU'
sc.render.resolution_x=320; sc.render.resolution_y=320; sc.render.film_transparent=False
poses={'neutral':{}, 'jawOpen':{'jawOpen':1}, 'eyeBlink':{'eyeBlinkLeft':1,'eyeBlinkRight':1}, 'smile':{'mouthSmileLeft':1,'mouthSmileRight':1,'cheekSquintLeft':0.5,'cheekSquintRight':0.5},
       'viseme_PP':{'viseme_PP':1}, 'viseme_aa':{'viseme_aa':1}, 'viseme_U':{'viseme_U':1}, 'viseme_FF':{'viseme_FF':1}, 'thinking':{'browInnerUp':0.6,'eyeLookUpLeft':0.5,'eyeLookUpRight':0.5,'mouthPressLeft':0.3,'mouthPressRight':0.3}}
kb=ob.data.shape_keys.key_blocks
for name,p in poses.items():
    for k in kb[1:]: k.value=0
    for k,val in p.items(): kb[k].value=val
    sc.render.filepath=os.path.join(out,f'qa_{name}.png'); bpy.ops.render.render(write_still=True)
print('render s',round(time.time()-t0,1))
