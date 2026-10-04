# Arm A main build: params.json -> Blender scene (all parts, materials, vertex colours, shape keys) -> .blend.
#   python build.py <out.blend> [tier=H]
# Every stage ends with os._exit(0) (teacher-character-dead-ends #7).
import sys, os, json, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy, bmesh
import numpy as np
from PIL import Image

import head as HD
import parts as PT
from sdf import HeadSDF

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/sa/build/teacher.blend'
TIER = sys.argv[2] if len(sys.argv) > 2 else 'H'
os.makedirs(os.path.dirname(OUT), exist_ok=True)
P = json.load(open(os.path.join(HERE, 'params.json')))
PH, PP = P['head'], P['parts']
G = P['grid'][TIER]
COL = PP['colors']


def lin(c):
    c = np.asarray(c, float) / 255.0
    return np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)


def mat(name, rgb=None, rough=0.5, metal=0.0, spec=0.5, ss=0.0, trans=0.0, ior=1.45, sheen=0.0, coat=0.0,
        vcol=False, tex=None, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    if rgb is not None:
        b.inputs['Base Color'].default_value = (*lin(rgb), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Specular IOR Level'].default_value = spec
    b.inputs['IOR'].default_value = ior
    if ss > 0:
        b.inputs['Subsurface Weight'].default_value = ss
        b.inputs['Subsurface Radius'].default_value = (1.0, 0.42, 0.28)
        b.inputs['Subsurface Scale'].default_value = 0.0018
    if trans > 0:
        b.inputs['Transmission Weight'].default_value = trans
    if sheen > 0:
        b.inputs['Sheen Weight'].default_value = sheen
        b.inputs['Sheen Roughness'].default_value = 0.6
    if coat > 0:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.25
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'
    if vcol:
        ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
        nt.links.new(ca.outputs['Color'], b.inputs['Base Color'])
    if tex is not None:
        ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = tex
        nt.links.new(ti.outputs['Color'], b.inputs['Base Color'])
    return m


def obj_from(name, V, F, material=None, smooth=True, uv=None, coll=None, origin=None):
    me = bpy.data.meshes.new(name)
    V = np.asarray(V) - (np.asarray(origin) if origin is not None else 0)
    me.from_pydata([tuple(map(float, v)) for v in V], [], [list(f) for f in F])
    me.validate(clean_customdata=False)
    bmt = bmesh.new(); bmt.from_mesh(me); bmesh.ops.recalc_face_normals(bmt, faces=bmt.faces); bmt.to_mesh(me); bmt.free()
    me.update()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    if uv is not None:
        ul = me.uv_layers.new(name='UVMap')
        for li, l in enumerate(me.loops):
            ul.data[li].uv = uv[l.vertex_index]
    if material is not None:
        me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    if origin is not None:
        ob.location = tuple(map(float, origin))
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sdf = HeadSDF(PH, with_eyes=PH.get('skin_with_eyes', True))
    bm, loops, _ = HD.build_head(PH, G['N'], G['warp'], G['K_eye'], G['K_mouth'], G['eye_patch'], G['mouth_patch'])
    meta = HD.place(bm, loops, sdf, PH | {k: PP[k] for k in ('ball_tuck', 'ball_tuck_deg', 'ball_tuck_ramp') if k in PP})
    bm.verts.index_update()
    if PH.get('conform_iters', 0):
        HD.conform(bm, loops, sdf, PH, iters=PH['conform_iters'])
    tk = set(loops['eye_L_tuck'][0]) | set(loops['eye_R_tuck'][0])
    vs = [v for v in bm.verts if v not in tk]
    Xp = HD.push_out(np.array([v.co[:] for v in vs]), PH | PP)
    for v, x in zip(vs, Xp):
        v.co = x.tolist()
    L = {k: [[v.index for v in r] for r in rs] for k, rs in loops.items()}
    M = {k: {"t": [float(x) for x in t], "upper": [bool(u) for u in up]} for k, (t, up) in meta.items()}

    # ---------------- head mesh, materials, vertex colours
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)   # the mouth bag must face the viewer (three culls back faces)
    me = bpy.data.meshes.new('head')
    bm.to_mesh(me)
    for p in me.polygons:
        p.use_smooth = True
    head = bpy.data.objects.new('head', me)
    bpy.context.scene.collection.objects.link(head)
    m_skin = mat('skin', rough=0.52, spec=0.32, ss=0.22, vcol=True)
    me.materials.append(m_skin)
    nv = len(me.vertices)
    X = np.array([v.co[:] for v in me.vertices])
    col = np.tile(lin(COL['skin']), (nv, 1))

    def blend(idx, c, w):
        idx = np.asarray(idx, int)
        col[idx] = col[idx] * (1 - w) + lin(c) * w

    # blush
    for s in (1, -1):
        d2 = ((X[:, 0] - s * 0.041) / 0.016) ** 2 + ((X[:, 2] + 0.022) / 0.012) ** 2
        w = 0.22 * np.exp(-d2) * (X[:, 1] < 0)
        col = col * (1 - w[:, None]) + lin(COL['blush']) * w[:, None]
    # nose tip warmth
    d2 = (X[:, 0] / 0.008) ** 2 + ((X[:, 2] - PH['nose_c'][2]) / 0.007) ** 2
    w = 0.25 * np.exp(-d2) * (X[:, 1] < -0.03)
    col = col * (1 - w[:, None]) + lin(COL['blush']) * w[:, None]
    # nostril / under-tip shade (r2): the button reads at thumbnail by its underside, as in c-front
    for s in (1, -1, 0):
        cx = s * PH['wing_c'][0] * 0.95
        d2 = ((X[:, 0] - cx) / (0.004 if s else 0.006)) ** 2 + ((X[:, 2] - (PH['nose_c'][2] - PH['nose_r'][2] * 0.85)) / 0.0028) ** 2
        w = (0.30 if s else 0.18) * np.exp(-d2) * (X[:, 1] < -0.03)
        col = col * (1 - w[:, None]) + lin(COL['lidline']) * w[:, None]
    # lips
    up_m = M['mouth']['upper']
    for k, w in ((0, 1.0), (1, 1.0), (2, 0.55), (3, 0.06)):
        ring = L['mouth'][k]
        blend([ring[i] for i in range(len(ring)) if up_m[i]], COL['lip'], w)
        blend([ring[i] for i in range(len(ring)) if not up_m[i]], COL.get('lip_lo', COL['lip']), w)
    blend(L['mouth_in'][0], COL['lip'], 1.0)
    blend(L['mouth_in'][1], COL['bag'], 1.0)
    blend(L['mouth_in'][2], COL['bag'], 1.0)
    blend(L['mouth_bag_c'][0], COL['bag'], 1.0)
    # lower lash line + lid inner tuck
    for key in ('eye_L', 'eye_R'):
        up = M[key]['upper']
        r0 = L[key][0]; r1 = L[key][1]
        lo0 = [r0[i] for i in range(len(r0)) if not up[i]]
        lo1 = [r1[i] for i in range(len(r1)) if not up[i]]
        blend(lo0, COL['lidline'], 0.12)
        blend(L[key + '_tuck'][0], COL['lidline'], 0.8)
        upi = [r0[i] for i in range(len(r0)) if up[i]]
        blend(upi, COL['lash'], 0.95)
        upi1 = [r1[i] for i in range(len(r1)) if up[i] and 0.05 < M[key]['t'][i]]
        blend(upi1, COL['lash'], 0.6)
    ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i in range(nv):
        ca.data[i].color = (*col[i], 1.0)

    objs = {'head': head}
    # ---------------- eyes
    tex = iris_image()
    m_eye = mat('eye', rough=0.75, spec=0.05, tex=tex)
    _b = m_eye.node_tree.nodes['Principled BSDF']; _ti = [n for n in m_eye.node_tree.nodes if n.type == 'TEX_IMAGE'][0]
    _nt = m_eye.node_tree
    _lp = _nt.nodes.new('ShaderNodeLightPath'); _mul = _nt.nodes.new('ShaderNodeMath'); _mul.operation = 'MULTIPLY'; _mul.inputs[1].default_value = 0.22
    _nt.links.new(_lp.outputs['Is Camera Ray'], _mul.inputs[0])
    _nt.links.new(_ti.outputs['Color'], _b.inputs['Emission Color']); _nt.links.new(_mul.outputs[0], _b.inputs['Emission Strength'])
    m_cornea = cornea_mat()
    for s, tag in ((1, 'L'), (-1, 'R')):
        V, F, ex = PT.eyeball(PH | PP, s, **G.get('eyeball', {}))
        objs['eye_' + tag] = obj_from('eye_' + tag, V, F, m_eye, uv=ex['uv'], origin=ex['centre'])
        V, F, _ = PT.cornea(PH | PP, s, **G.get('cornea', {}))
        objs['cornea_' + tag] = obj_from('cornea_' + tag, V, F, m_cornea, origin=np.array(PH['eye_c']) * [s, 1, 1])
    # ---------------- lashes, brows
    m_lash = mat('lash', rgb=COL['lash'], rough=0.45, spec=0.4)
    m_brow = mat('brow', rgb=COL['brow'], rough=0.7, spec=0.2)
    from mathutils.bvhtree import BVHTree
    from mathutils import Vector as _V
    dg = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(head, dg)

    def snap(c, p):
        d = _V(p) - _V(c)
        L = d.length
        o = _V(c) + d.normalized() * (L * 0.5)
        last = None
        for _ in range(8):
            loc, nrm, idx, dist = bvh.ray_cast(o, d.normalized(), L * 2)
            if loc is None:
                break
            last = (loc, nrm)
            o = loc + d.normalized() * 1e-5
        if last is None:
            return None, None
        loc, nrm = last
        if nrm.dot(d) < 0:
            nrm = -nrm
        return np.array(loc[:]), np.array(nrm[:])
    for s, tag in ((1, 'L'), (-1, 'R')):
        V, F, _ = PT.lash_line(PH | PP, s, snap=snap, **G.get('lash', {}))
        objs['lash_' + tag] = obj_from('lash_' + tag, V, F if s > 0 else [f[::-1] for f in F], m_lash)
        V, F, _ = PT.brow(PH | PP, sdf, s, **G.get('brow', {}))
        objs['brow_' + tag] = obj_from('brow_' + tag, V, F, m_brow)
    # ---------------- mouth interior
    m_teeth = mat('teeth', rgb=COL['teeth'], rough=0.3, spec=0.5)
    m_tongue = mat('tongue', rgb=COL['tongue'], rough=0.45, spec=0.4, ss=0.1)
    V, F, _ = PT.teeth(PH | PP, sdf, True, **G.get('teeth', {})); objs['teeth_U'] = obj_from('teeth_U', V, F, m_teeth)
    V, F, _ = PT.teeth(PH | PP, sdf, False, **G.get('teeth', {})); objs['teeth_L'] = obj_from('teeth_L', V, F, m_teeth)
    V, F, _ = PT.tongue(PH | PP, sdf, **G.get('tongue', {})); objs['tongue'] = obj_from('tongue', V, F, m_tongue)
    # ---------------- ears, jewellery, bindi
    for s, tag in ((1, 'L'), (-1, 'R')):
        V, F, _ = PT.ear(PH | PP, sdf, s, **G.get('ear', {})); objs['ear_' + tag] = obj_from('ear_' + tag, V, F, m_skin_plain())
    m_gold = mat('gold', rgb=COL['gold'], rough=0.28, metal=0.0, spec=0.8, coat=0.6)
    for s, tag in ((1, 'L'), (-1, 'R')):
        V, F, _ = PT.ico(np.array(PP['earring_c']) * [s, 1, 1], PP['earring_r'], **G.get('ico', {}))
        objs['earring_' + tag] = obj_from('earring_' + tag, V, F, m_gold)
    bz = PP['bindi_z']
    by = float(sdf.front_y(np.array([[0.0, bz]]))[0])
    c = np.array([0.0, by, bz]); n = sdf.normal(c[None])[0]
    V, F, _ = PT.disc(c, n, PP['bindi_r'])
    objs['bindi'] = obj_from('bindi', V, F, mat('bindi', rgb=COL['bindi'], rough=0.35, spec=0.5))
    # ---------------- hair
    m_hair = mat('hair', rgb=COL['hair'], rough=0.58, spec=0.28, sheen=0.12, vcol=True)
    hs = HeadSDF(PH, with_eyes=False)
    for s, tag in ((1, 'L'), (-1, 'R')):
        V, F, ex = PT.hair_shell(PH | PP, hs, s, **G.get('hair', {}))
        objs['hair_' + tag] = obj_from('hair_' + tag, V, F, m_hair, uv=ex['uv'])
    V, F, ex = PT.bun(PP, **G.get('bun', {})); objs['bun'] = obj_from('bun', V, F, m_hair, uv=ex['uv'])
    V, F, ex = PT.lock(PP, PP['lock_L'], PP['lock_thick'], **G.get('lock', {})); objs['lock_L'] = obj_from('lock_L', V, F, m_hair, uv=ex['uv'])
    V, F, ex = PT.lock(PP, PP['lock_R'], PP['lock_thick'], **G.get('lock', {})); objs['lock_R'] = obj_from('lock_R', V, F, m_hair, uv=ex['uv'])
    # ---------------- kurta
    m_kurta = mat('kurta', rgb=COL['kurta'], rough=0.85, spec=0.2, sheen=0.1, vcol=True)
    m_pipe = mat('piping', rgb=COL['piping'], rough=0.7, spec=0.25, sheen=0.2)
    V, F, ex = PT.kurta(PP, **G.get('kurta', {}))
    V = np.array(V, float)
    for _ in range(3):
        dk = sdf(V); nk = sdf.normal(V); gap = PP.get('kurta_gap', 0.0012)
        V = V + nk * np.clip(gap - dk, 0, None)[:, None]
    objs['kurta'] = obj_from('kurta', V, F, m_kurta)
    Mk = ex['M']
    ring = V[Mk:2 * Mk]  # the outer collar edge (second section)
    C = np.vstack([ring, ring[:1]])
    Nn = np.tile([0, 0, 1.0], (len(C), 1))
    Nv, Bv = PT.frames_from_normals(C, Nn)
    Vp, Fp = PT.tube(C, Nv, Bv, np.full(len(C), PP['piping_r']), np.full(len(C), PP['piping_r']), M=G.get('piping_M', 6), cap=False)
    objs['piping'] = obj_from('piping', Vp, Fp, m_pipe)
    # placket lines
    for s, tag in ((1, 'L'), (-1, 'R')):
        zs = np.linspace(ring[0][2] - 0.001, PP['placket_z1'], 16)
        pts = []
        for z in zs:
            # front of the kurta at this height: nearest section front y (interpolate)
            secs = PP['kurta_secs']
            zz = [sc[0] for sc in secs[2:]]; yy = [sc[3] - sc[2] for sc in secs[2:]]
            y = float(np.interp(-z, [-q for q in zz], yy)) - 0.0012
            pts.append([s * PP['placket_dx'] * (1 - 0.7 * (zs[0] - z) / max(zs[0] - zs[-1], 1e-6)), y, z])
        pts = np.array(pts)
        Nv, Bv = PT.frames_from_normals(pts, np.tile([0, -1.0, 0], (len(pts), 1)))
        Vp, Fp = PT.tube(pts, Nv, Bv, np.full(len(pts), PP['piping_r'] * 0.9), np.full(len(pts), PP['piping_r'] * 0.9), M=6)
        objs['placket_' + tag] = obj_from('placket_' + tag, Vp, Fp, m_pipe)
    return objs, L, M


def cornea_mat():
    # render material: clear coat only (transparent + a sharp glossy lobe weighted by Fresnel). The runtime shader
    # draws the same thing (GGX + view-space catchlight), and the exported glTF slot is a near-transparent glossy.
    m = bpy.data.materials.new('cornea'); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    gl = nt.nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = 0.025
    fr = nt.nodes.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.5
    mx = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(fr.outputs[0], mx.inputs[0]); nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(gl.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], nt.nodes['Material Output'].inputs[0])
    m.blend_method = 'BLEND'
    return m


_skin_plain = None
def m_skin_plain():
    global _skin_plain
    if _skin_plain is None:
        _skin_plain = mat('skin_ear', rgb=COL['skin'], rough=0.52, spec=0.32, ss=0.22)
    return _skin_plain


def iris_image():
    arr = PT.iris_texture(PH | PP, 256)
    path = os.path.join(os.path.dirname(OUT), 'iris.png')
    Image.fromarray(arr[::-1]).save(path)
    img = bpy.data.images.load(path)
    img.pack()
    return img


def bake_ao(objs):
    import ao as AO
    bvh = AO.scene_bvh()
    res = {}
    for n in ['head', 'hair_L', 'hair_R', 'bun', 'lock_L', 'lock_R', 'kurta']:
        ob = objs[n]
        a = AO.bake(ob, bvh, n=24 if n == 'head' else 16, dist=0.03 if n != 'kurta' else 0.05)
        me = ob.data
        E = np.zeros(len(me.edges) * 2, int); me.edges.foreach_get('vertices', E); E = E.reshape(-1, 2)
        deg = np.bincount(E.ravel(), minlength=len(a)).astype(float)
        for _ in range(8 if n == 'head' else 4):   # AO is a soft field: no per-vertex speckle
            acc = np.zeros(len(a)); np.add.at(acc, E[:, 0], a[E[:, 1]]); np.add.at(acc, E[:, 1], a[E[:, 0]])
            a = 0.5 * a + 0.5 * np.where(deg > 0, acc / np.maximum(deg, 1), a)
        if n == 'head':
            ul = me.uv_layers.new(name='UVMap')
            for li, l in enumerate(me.loops):
                ul.data[li].uv = (float(a[l.vertex_index]), 0.0)
        else:
            ca = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
            for i in range(len(me.vertices)):
                ca.data[i].color = (float(a[i]), float(a[i]), float(a[i]), 1.0)
        res[n] = float(a.mean())
    print('AO', res)


if __name__ == '__main__':
    objs, L, M = build()
    bake_ao(objs)
    try:
        import keys as KY
        KY.author(objs, L, M, P, tier=TIER)
    except ImportError:
        pass
    json.dump({'loops': L, 'meta': M}, open(OUT.replace('.blend', '_loops.json'), 'w'))
    tris = 0
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            t = sum(len(p.vertices) - 2 for p in o.data.polygons)
            tris += t
    print('TOTAL TRIS', tris)
    bpy.ops.wm.save_as_mainfile(filepath=OUT)
    os._exit(0)
