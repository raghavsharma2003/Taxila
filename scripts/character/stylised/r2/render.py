# Render evidence from a built .blend: python render.py <in.blend> <outdir> <views...>
#   view names: front, q3L, q3R, profile, close, back; or pose:<name> (shape-key pose from poses.json)
import sys, os, json, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy
import stage

blend, outdir = sys.argv[1], sys.argv[2]
views = sys.argv[3:] or ['front']
res = int(os.environ.get('RES', '768'))
spp = int(os.environ.get('SPP', '48'))
os.makedirs(outdir, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend)
stage.setup(res=res, samples=spp)
CT = (-0.0047, 0.02, -0.0211)
cam = stage.camera(dist=1.0, target=CT, ortho=0.323)
POSES = json.load(open(os.path.join(HERE, 'poses.json'))) if os.path.exists(os.path.join(HERE, 'poses.json')) else {}


def set_gaze(yaw, pitch):
    import math
    for n in ('eye_L', 'eye_R', 'cornea_L', 'cornea_R'):
        o = bpy.data.objects.get(n)
        if o is None:
            continue
        c = sum((v.co for v in o.data.vertices), __import__('mathutils').Vector()) / len(o.data.vertices) if False else None
        o.rotation_mode = 'XYZ'
        o.rotation_euler = (-math.radians(pitch), 0, math.radians(yaw))


def set_pose(bs):
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and o.data.shape_keys:
            for kb in o.data.shape_keys.key_blocks[1:]:
                kb.value = float(bs.get(kb.name, 0.0))


def frame(name):
    if name == 'front':
        cam.data.ortho_scale = 0.323; stage.set_cam(cam, 0, 0, 1.0, CT)
    elif name == 'q3L':
        cam.data.ortho_scale = 0.323; stage.set_cam(cam, 35, 0, 1.0, (0, 0.03, CT[2]))
    elif name == 'q3R':
        cam.data.ortho_scale = 0.323; stage.set_cam(cam, -35, 0, 1.0, (0, 0.03, CT[2]))
    elif name == 'profile':
        cam.data.ortho_scale = 0.323; stage.set_cam(cam, 90, 0, 1.0, (0, 0.05, CT[2]))
    elif name == 'profref':   # matches refs/profile-left.webp scale (0.379 mm/px) and eye placement
        cam.data.ortho_scale = 0.388; stage.set_cam(cam, 90, 0, 1.0, (0, 0.0277, -0.0454))
    elif name == 'top':
        cam.data.ortho_scale = 0.30; stage.set_cam(cam, 0, 60, 1.0, (0, 0.04, 0.03))
    elif name == 'back':
        cam.data.ortho_scale = 0.323; stage.set_cam(cam, 180, 0, 1.0, (0, 0.05, CT[2]))
    elif name == 'close':
        cam.data.ortho_scale = 0.17; stage.set_cam(cam, 0, 0, 1.0, (0, -0.02, -0.018))
    elif name == 'face':
        cam.data.ortho_scale = 0.21; stage.set_cam(cam, 0, 0, 1.0, (0, -0.02, -0.012))
    elif name == 'mouth':
        cam.data.ortho_scale = 0.075; stage.set_cam(cam, 0, 0, 1.0, (0, -0.03, -0.05))
    elif name == 'eyes':
        cam.data.ortho_scale = 0.12; stage.set_cam(cam, 0, 0, 1.0, (0, -0.02, -0.006))


for v in views:
    if v.startswith('pose:'):
        name = v[5:]
        pz = POSES[name]
        set_pose(pz.get('bs', {}))
        set_gaze(*pz.get('gaze', [0, 0]))
        frame(pz.get('frame', 'close'))
        stage.render(os.path.join(outdir, f'pose_{name}.png'))
        set_pose({}); set_gaze(0, 0)
    else:
        set_pose({})
        frame(v)
        stage.render(os.path.join(outdir, f'{v}.png'))
os._exit(0)
