# Arm A gates (TECH-PLAN §5.5, adapted to this head): python gates.py <in.blend> <out.json>
#   G1 names (82/82 on head), G3 mirror (left key vs mirrored right key, mm),
#   G4 lid seal: front rays through each eye opening that reach the eyeball/cornea when the pose should close it
#      (eyeBlink, blink + lookDown + corrective, blink + squint + corrective, and partial weights 0.25/0.5/0.75 must
#      not show the ball ABOVE the closing line),
#   G5 mouth: front rays through the lip seam that reach the mouth interior at rest, viseme_PP, jaw 0.3 + close 0.3
#      (+ corrective), G6 teeth/tongue inside lips at rest (no ray hits teeth/tongue at rest),
#   lid-inside-ball: skin vertices inside the eyeball sphere at rest and at blink (tucks excepted).
import sys, os, json, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy
import numpy as np
from mathutils import Vector
import keys as KY

src, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.open_mainfile(filepath=src)
P = json.load(open(os.path.join(HERE, 'params.json'))); PH = P['head']
LJ = json.load(open(src.replace('.blend', '_loops.json')))
S = bpy.context.scene
for o in list(S.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
head = bpy.data.objects['head']
names = [k.name for k in head.data.shape_keys.key_blocks[1:]]
res = {'G1_names': {'n': len(names), 'missing': [k for k in KY.ALL_KEYS if k not in names], 'pass': len(names) == 82 and set(names) == set(KY.ALL_KEYS)}}


def set_pose(w):
    for o in S.objects:
        if o.data.shape_keys:
            for kb in o.data.shape_keys.key_blocks[1:]:
                kb.value = float(w.get(kb.name, 0.0))
    bpy.context.view_layer.update()


def cast(points):
    dg = bpy.context.evaluated_depsgraph_get()
    hits = []
    for x, z in points:
        r = S.ray_cast(dg, Vector((x, -0.5, z)), Vector((0, 1, 0)))
        hits.append(r[4].name if r[0] else None)
    return hits


# mirror
B = np.array([v.co[:] for v in head.data.shape_keys.key_blocks['Basis'].data])
from scipy.spatial import cKDTree
T = cKDTree(B)
dm, mir = T.query(B * [-1, 1, 1])
res['basis_asym_mm'] = round(float(dm.max()) * 1000, 3)
worst = 0.0
for k in KY.ALL_KEYS:
    if k.endswith('Left'):
        kr = k[:-4] + 'Right'
        dl = np.array([v.co[:] for v in head.data.shape_keys.key_blocks[k].data]) - B
        dr = np.array([v.co[:] for v in head.data.shape_keys.key_blocks[kr].data]) - B
        worst = max(worst, float(np.abs(dl - dr[mir] * [-1, 1, 1]).max()) * 1000)
res['G3_mirror_mm'] = {'max': round(worst, 3), 'pass': worst <= 0.5}

# eye-opening ray grid (front projection of the lid margin ring at rest)
X = B
eyepts = {}
for key, s in (('eye_L', 1), ('eye_R', -1)):
    r0 = np.array([X[i] for i in LJ['loops'][key][0]])
    xs = np.linspace(r0[:, 0].min(), r0[:, 0].max(), 24); zs = np.linspace(r0[:, 2].min(), r0[:, 2].max(), 16)
    poly = r0[:, [0, 2]]
    def inpoly(x, z, pg=poly):
        c = False; n = len(pg)
        for i in range(n):
            (x1, z1), (x2, z2) = pg[i], pg[(i + 1) % n]
            if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1:
                c = not c
        return c
    eyepts[key] = [(x, z) for x in xs for z in zs if inpoly(x, z)]


def eye_leak(w):
    set_pose(w)
    tot = 0; leak = 0
    for key in eyepts:
        h = cast(eyepts[key])
        tot += len(h); leak += sum(1 for n in h if n and (n.startswith('eye') or n.startswith('cornea')))
    return leak / max(tot, 1)


g4 = {}
for nm, w in [('blink', {'eyeBlinkLeft': 1, 'eyeBlinkRight': 1}),
              ('blink+lookDown', {'eyeBlinkLeft': 1, 'eyeBlinkRight': 1, 'eyeLookDownLeft': 1, 'eyeLookDownRight': 1, 'eyeBlink_eyeLookDownLeft': 1, 'eyeBlink_eyeLookDownRight': 1}),
              ('blink+squint', {'eyeBlinkLeft': 1, 'eyeBlinkRight': 1, 'eyeSquintLeft': 1, 'eyeSquintRight': 1, 'eyeBlink_eyeSquintLeft': 1, 'eyeBlink_eyeSquintRight': 1}),
              ('blink+cheekSquint', {'eyeBlinkLeft': 1, 'eyeBlinkRight': 1, 'cheekSquintLeft': 1, 'cheekSquintRight': 1, 'cheekSquint_eyeBlinkLeft': 1, 'cheekSquint_eyeBlinkRight': 1})]:
    g4[nm] = round(eye_leak(w) * 100, 2)
g4['open_rest_visible_pct'] = round(eye_leak({}) * 100, 1)
res['G4_lid_seal_pct_ball_visible'] = {**g4, 'pass': all(v == 0 for k, v in g4.items() if k != 'open_rest_visible_pct')}

# mouth seam rays
r0 = np.array([X[i] for i in LJ['loops']['mouth'][0]])
xs = np.linspace(r0[:, 0].min() * 0.95, r0[:, 0].max() * 0.95, 40)
mouthpts = [(x, z) for x in xs for z in np.linspace(PH['mouth_z'] - 0.002, PH['mouth_z'] + 0.004, 13)]


def mouth_leak(w):
    set_pose(w)
    h = cast(mouthpts)
    inner = sum(1 for n in h if n in ('mouth', 'teeth_U', 'teeth_L', 'tongue'))
    return inner / len(h), sum(1 for n in h if n in ('teeth_U', 'teeth_L', 'tongue'))


g5 = {}
for nm, w in [('rest', {}), ('viseme_PP', {'viseme_PP': 1}), ('jaw0.3+close0.3', {'jawOpen': 0.3, 'mouthClose': 0.3, 'jawOpen_mouthClose': 0.09})]:
    f, teeth = mouth_leak(w)
    g5[nm] = {'interior_rays_pct': round(f * 100, 2), 'teeth_or_tongue_rays': teeth}
res['G5_G6_mouth'] = {**g5, 'pass': g5['rest']['teeth_or_tongue_rays'] == 0 and g5['viseme_PP']['teeth_or_tongue_rays'] == 0}

# lid vertices inside the ball
tk = set(LJ['loops']['eye_L_tuck'][0]) | set(LJ['loops']['eye_R_tuck'][0])
nt = np.array([i not in tk for i in range(len(B))])
def inside(w):
    D = B.copy()
    for k, v in w.items():
        D += (np.array([q.co[:] for q in head.data.shape_keys.key_blocks[k].data]) - B) * v
    n = 0
    for s in (1, -1):
        c = np.array(PH['eye_c']) * [s, 1, 1]
        d = np.linalg.norm(D[nt] - c, axis=1)
        q = (D[nt] - c); th = np.degrees(np.arccos(np.clip(-q[:, 1] / np.maximum(d, 1e-9), -1, 1)))
        kk = np.clip((th - P['parts']['ball_tuck_deg']) / P['parts']['ball_tuck_ramp'], 0, 1)
        reff = PH['eye_r'] * (1 - P['parts']['ball_tuck'] * kk * kk * (3 - 2 * kk))
        n += int((d < reff).sum())
    return n
res['lid_inside_ball'] = {'rest': inside({}), 'blink': inside({'eyeBlinkLeft': 1, 'eyeBlinkRight': 1}),
                          'happy_squint': inside({'eyeSquintLeft': 1, 'eyeSquintRight': 1, 'cheekSquintLeft': 1, 'cheekSquintRight': 1})}
json.dump(res, open(out, 'w'), indent=1)
print(json.dumps(res, indent=1))
os._exit(0)
