import bpy, sys, os
f = sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=f)
for o in bpy.data.objects:
    line = f"{o.type:9s} {o.name:40s} parent={o.parent.name if o.parent else None}"
    if o.type == 'MESH':
        me = o.data
        line += f" v={len(me.vertices)} f={len(me.polygons)} tris={sum(len(p.vertices)-2 for p in me.polygons)} mats={[m.name for m in me.materials]}"
        if me.shape_keys:
            ks = [k.name for k in me.shape_keys.key_blocks]
            line += f" keys={len(ks)}"
            print(line); print('   ', ks); continue
    if o.type == 'ARMATURE':
        line += f" bones={len(o.data.bones)}"
    print(line)
for m in bpy.data.materials:
    imgs=[n.image.name for n in (m.node_tree.nodes if m.node_tree else []) if n.type=='TEX_IMAGE' and n.image]
    print('MAT', m.name, imgs)
os._exit(0)
