# dump UV layout of the head/body materials over their textures, coloured by dominant bone (for region classification)
import bpy, sys, os
import numpy as np
from PIL import Image, ImageDraw
src = sys.argv[-2]; out = sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=os.path.join(src, "Business_Female_01_facial.fbx"))
o = [x for x in bpy.data.objects if x.type == 'MESH'][0]; me = o.data
uv = me.uv_layers.active.data
vg = {g.index: g.name for g in o.vertex_groups}
col = {'Bip01 MJaw': (0,255,0), 'Bip01 MTongue': (255,0,255), 'Bip01 Head': (255,255,0), 'Bip01 LEye': (0,255,255), 'Bip01 REye': (0,255,255)}
for mi, (tex, name) in enumerate([("f014_body_color.tga", "body"), ("f014_head_color.tga", "head"), ("f014_opacity_color.tga", "opacity")]):
    im = Image.open(os.path.join(src, tex)).convert("RGB"); W, H = im.size
    d = ImageDraw.Draw(im)
    for p in me.polygons:
        if p.material_index != mi: continue
        pts = [(uv[l].uv[0] * W, (1 - uv[l].uv[1]) * H) for l in p.loop_indices]
        v = me.vertices[p.vertices[0]]
        best = max(v.groups, key=lambda g: g.weight, default=None)
        c = col.get(vg[best.group] if best else '', (255, 60, 60))
        d.line(pts + [pts[0]], fill=c, width=2)
    im.resize((1024, 1024)).save(os.path.join(out, f"uv_{name}.png"))
os._exit(0)
