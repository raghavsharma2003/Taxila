# Quick look at the bare head (no parts) against the concept. Usage: python preview_head.py <outdir>
import sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
import head as HD
import stage

out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/sa/prev'
os.makedirs(out, exist_ok=True)
P = json.load(open(os.path.join(os.path.dirname(__file__), 'params.json')))
G = P['grid']['H']
bpy.ops.wm.read_factory_settings(use_empty=True)
bm, loops, sdf = HD.build_head(P['head'], G['N'], G['warp'], G['K_eye'], G['K_mouth'], G['eye_patch'], G['mouth_patch'])
HD.place(bm, loops, sdf, P['head'])
me = bpy.data.meshes.new('head')
bm.to_mesh(me)
print('head verts', len(me.vertices), 'faces', len(me.polygons), 'tris', sum(len(p.vertices) - 2 for p in me.polygons))
ob = bpy.data.objects.new('head', me)
bpy.context.scene.collection.objects.link(ob)
for p in me.polygons:
    p.use_smooth = True
mat = bpy.data.materials.new('skin'); mat.use_nodes = True
b = mat.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value = (*stage.srgb_to_lin((0.93, 0.58, 0.36)), 1)
b.inputs['Roughness'].default_value = 0.6
me.materials.append(mat)
for s in (1, -1):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=P['head']['eye_r'], location=(s * P['head']['eye_c'][0], P['head']['eye_c'][1], P['head']['eye_c'][2]), segments=32, ring_count=16)
    bpy.ops.object.shade_smooth()
stage.setup(res=512, samples=24)
CT = (-0.0047, 0.02, -0.0211)
cam = stage.camera(dist=1.0, target=CT, ortho=0.323)
mode = sys.argv[2] if len(sys.argv) > 2 else 'all'
views = [('front', 0, 0), ('q3', 35, 0), ('profile', 90, 0)] if mode == 'all' else [('front', 0, 0)]
for name, yaw, pitch in views:
    stage.set_cam(cam, -yaw, pitch, 1.0, CT)
    stage.render(os.path.join(out, f'{name}.png'))
if 'wire' in sys.argv:
    # wireframe overlay of the front
    mod = ob.modifiers.new('w', 'WIREFRAME'); mod.thickness = 0.0004; mod.use_replace = False
    cam.data.ortho_scale = 0.16
    stage.set_cam(cam, 0, 0, 1.0, (0, -0.02, -0.02))
    stage.render(os.path.join(out, 'wire.png'))
os._exit(0)
