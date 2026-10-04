# Arm A export: built .blend -> joined draw groups + HeadRig skeleton -> raw GLB (then finish.mjs compresses it).
#   python export.py <in.blend> <out_raw.glb>
# Draw groups (<= 7 meshes, CHARACTER-PIPELINE §7 budget): head (skin + ears + bindi + earrings, 82 morphs),
# browlash (82 morphs), mouth (teeth + tongue, 82 morphs), eye_L / eye_R (ball + cornea, on LeftEye / RightEye),
# hair (shells + bun + locks), bust (kurta + piping).
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy
import numpy as np
from mathutils import Vector

src, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.open_mainfile(filepath=src)
P = json.load(open(os.path.join(HERE, 'params.json')))
S = bpy.context.scene
O = bpy.data.objects


def join(target, others):
    bpy.ops.object.select_all(action='DESELECT')
    for n in [target] + others:
        o = O.get(n)
        if o is not None:
            o.select_set(True)
    bpy.context.view_layer.objects.active = O[target]
    bpy.ops.object.join()
    return O[target]


# cornea: a glTF-friendly material (the render one is a node mix the exporter cannot express)
cm = bpy.data.materials.get('cornea')
if cm is not None:
    nt = cm.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (1, 1, 1, 1)
    b.inputs['Roughness'].default_value = 0.04
    b.inputs['Alpha'].default_value = 0.12
    nt.links.new(b.outputs[0], nt.nodes['Material Output'].inputs[0])
    cm.blend_method = 'BLEND'

# apply object transforms (eyes were built with their origin at the ball centre: keep that for the eye bones)
head = join('head', ['ear_L', 'ear_R', 'bindi', 'earring_L', 'earring_R'])
browlash = join('brow_L', ['brow_R', 'lash_L', 'lash_R']); browlash.name = 'browlash'
mouth = join('teeth_L', ['teeth_U', 'tongue']); mouth.name = 'mouth'
hair = join('hair_L', ['hair_R', 'bun', 'lock_L', 'lock_R']); hair.name = 'hair'
bust = join('kurta', ['piping', 'placket_L', 'placket_R']); bust.name = 'bust'
eyeL = join('eye_L', ['cornea_L']); eyeR = join('eye_R', ['cornea_R'])
for _o in (head, browlash, mouth, hair, bust, eyeL, eyeR):
    _o.data.name = _o.name

# drop lights / cameras / stray helpers
for o in list(S.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)

# ---------------- skeleton (HeadRig: Spine2, Neck, Head, LeftEye, RightEye)
arm = bpy.data.armatures.new('rig')
rig = bpy.data.objects.new('rig', arm)
S.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
def bone(name, h, t, parent=None):
    b = arm.edit_bones.new(name); b.head = Vector(h); b.tail = Vector(t)
    if parent:
        b.parent = arm.edit_bones[parent]
    return b
PH = P['head']
ec = PH['eye_c']
bone('Spine2', (0, 0.05, -0.20), (0, 0.05, -0.13))
bone('Neck', (0, 0.05, -0.13), (0, 0.048, -0.06), 'Spine2')
bone('Head', (0, 0.048, -0.06), (0, 0.048, 0.06), 'Neck')
bone('LeftEye', (ec[0], ec[1], ec[2]), (ec[0], ec[1] - 0.02, ec[2]), 'Head')
bone('RightEye', (-ec[0], ec[1], ec[2]), (-ec[0], ec[1] - 0.02, ec[2]), 'Head')
bpy.ops.object.mode_set(mode='OBJECT')


def skin(ob, weights):
    """weights: dict bone -> per-vertex array (world-space computed)."""
    for bn, w in weights.items():
        vg = ob.vertex_groups.new(name=bn)
        for i, x in enumerate(w):
            if x > 1e-4:
                vg.add([i], float(x), 'REPLACE')
    m = ob.modifiers.new('arm', 'ARMATURE'); m.object = rig
    ob.parent = rig


def wpos(ob):
    mw = ob.matrix_world
    return np.array([(mw @ v.co)[:] for v in ob.data.vertices])


X = wpos(head)
z = X[:, 2]
w_sp = np.clip((-0.11 - z) / 0.03, 0, 1)
w_head = np.clip((z + 0.085) / 0.03, 0, 1)
w_neck = np.clip(1 - w_sp - w_head, 0, 1)
skin(head, {'Spine2': w_sp, 'Neck': w_neck, 'Head': w_head})
for ob in (browlash, mouth, hair):
    skin(ob, {'Head': np.ones(len(ob.data.vertices))})
skin(bust, {'Spine2': np.ones(len(bust.data.vertices))})
# eyes: rigid on their bones (keep the object at the ball centre, bind fully)
for ob, bn in ((eyeL, 'LeftEye'), (eyeR, 'RightEye')):
    skin(ob, {bn: np.ones(len(ob.data.vertices))})

# custom data trims: no UVs on meshes that do not sample a texture
for ob in (browlash, mouth, bust):
    me = ob.data
    while me.uv_layers:
        me.uv_layers.remove(me.uv_layers[0])

bpy.ops.export_scene.gltf(
    filepath=out, export_format='GLB', use_selection=False, export_apply=False,
    export_morph=True, export_morph_normal=True, export_skins=True, export_yup=True,
    export_texcoords=True, export_normals=True, export_tangents=False,
    export_attributes=True, export_animations=False, export_extras=True)
stats = {o.name: {'verts': len(o.data.vertices), 'tris': sum(len(p.vertices) - 2 for p in o.data.polygons),
                  'morphs': (len(o.data.shape_keys.key_blocks) - 1) if o.data.shape_keys else 0}
         for o in S.objects if o.type == 'MESH'}
json.dump(stats, open(out.replace('.glb', '_stats.json'), 'w'), indent=1)
print('STATS', json.dumps(stats))
os._exit(0)
