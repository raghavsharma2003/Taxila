"""Arm B: head extras (ears, earrings, bindi), hair + bust from the target regions, shape keys, armature, GLB export."""
import json
import os
import subprocess

import bmesh
import bpy
import numpy as np

import lib as L
import regions as RG
from parts import ellipsoid, disc

GOLD = np.array([0.86, 0.66, 0.30])
BINDI = np.array([0.36, 0.12, 0.13])
DEG = np.pi / 180


def ear_mesh(c, sg, h=0.030, w=0.0165, t=0.0075):
    """stylised ear: a half-ellipsoid shell, cupped (the bowl pushed in), turned 22 deg forward, tucked into the head."""
    V, F = ellipsoid(np.zeros(3), w / 2, t / 2, h / 2, nu=20, nv=12)
    V = np.asarray(V)
    out = V[:, 1] < 0                                        # local -y = the outer (visible) face before orientation
    rr = np.sqrt((V[:, 0] / (w / 2)) ** 2 + (V[:, 2] / (h / 2)) ** 2)
    V[out, 1] += (t * 0.55) * np.clip(1 - rr[out] / 0.78, 0, 1) ** 0.8          # the bowl
    V[:, 0] *= 1 + 0.15 * (V[:, 2] > 0)                                         # fuller top (C shape)
    # orient: local -y -> outward (+-x), rotated forward; local x -> backward
    a = np.radians(22)
    out_dir = np.array([sg * np.cos(a), -np.sin(a), 0.0])
    back = np.array([sg * np.sin(a), np.cos(a), 0.0]) * sg
    Rm = np.stack([back * sg, -out_dir, np.array([0, 0, 1.0])], 1)
    Wv = c + V @ Rm.T - out_dir * 0.002
    return Wv, F


def head_extras(T, R, front_on):
    """ears (the sculpt's ear patch, decimated, tucked), earring studs, bindi disc -> (V, F, C, tags, matidx)."""
    V_all, F_all, C_all, tag, mat = [], [], [], [], []
    sb = R["skin_bvh"]
    W = R["W"]
    TV, TF = T["V"], T["F"]
    d = TV - W.c
    u = np.arctan2(d[:, 0], -d[:, 1]); e = np.arctan2(d[:, 2], np.hypot(d[:, 0], d[:, 1]))
    zone = (np.abs(u) > 55 * DEG) & (np.abs(u) < 130 * DEG) & (e > -48 * DEG) & (e < 25 * DEG) & (T["label"] == 0)
    idx = np.nonzero(zone)[0]
    Q, _, _, dist = L.nearest(sb, TV[idx])
    out = np.zeros(len(TV), bool)
    out[idx[dist > 0.0015]] = True
    fm = out[TF].all(1)
    ears = {}
    if fm.sum() > 50:
        ob, used = RG.submesh(T, fm, "ear_tmp")
        comps = RG.islands(ob)
        P = L.co(ob.data)
        keep = []
        for side, sg in (("L", 1), ("R", -1)):
            cs = [c for c in comps if np.mean(P[np.unique(np.array([ob.data.polygons[f].vertices[:] for f in c]).ravel())][:, 0]) * sg > 0]
            if cs:
                big = max(cs, key=len)
                keep += big
        RG.keep_faces(ob, keep)
        RG.decimate(ob, 700)
        RG.smooth(ob, 3, 0.5)
        RG.tuck_boundary(ob, 0.0025, 2)
        RG.mirror_symmetrize(ob)
        P = L.co(ob.data)
        for side, sg in (("L", 1), ("R", -1)):
            m = P[:, 0] * sg > 0
            if m.any():
                lobe = P[m][np.argmin(P[m][:, 2])]
                ears[side] = {"lobe": lobe, "centre": P[m].mean(0)}
        # our own stylised ear (a soft C-shaped shell) at the sculpt ear's centre, mirror-symmetric
        if "L" in ears and "R" in ears:
            c = 0.5 * (ears["L"]["centre"] + ears["R"]["centre"] * np.array([-1, 1, 1]))
            for side, sg in (("L", 1), ("R", -1)):
                cs = c * np.array([sg, 1, 1])
                Ve, Fe = ear_mesh(cs, sg)
                off = sum(len(v) for v in V_all)
                V_all.append(Ve); F_all += [[q + off for q in f] for f in Fe]
                C_all.append(np.tile(np.array([0.91, 0.55, 0.306]), (len(Ve), 1)))
                tag += ["ear"] * len(Ve); mat += [0] * len(Fe)
                ears[side]["lobe"] = Ve[np.argmin(Ve[:, 2])]
        bpy.data.objects.remove(ob)
    # earrings: gold studs on the lobes (front-view landmark height, lobe depth)
    lm2 = T["lm2"]
    for side, sg in (("L", 1), ("R", -1)):
        px = lm2["earring" + side]
        x = (px[0] - 512) * T["K"] - T["x0"]; z = (1024 - px[1]) * T["K"]
        y = ears[side]["lobe"][1] - 0.002 if side in ears else W.c[1] - 0.01
        if side in ears:
            x = ears[side]["lobe"][0] + sg * 0.0012
        Ve, Fe = ellipsoid(np.array([x, y, z]), 0.0043, 0.0043, 0.0043, nu=14, nv=8)
        off = sum(len(v) for v in V_all)
        V_all.append(Ve); F_all += [[q + off for q in f] for f in Fe]; C_all.append(np.tile(GOLD, (len(Ve), 1)))
        tag += ["earring"] * len(Ve); mat += [1] * len(Fe)
    # bindi
    P3, N3 = front_on(sb, T, [lm2["bindi"]["c"]])
    Vb, Fb = disc(P3[0], N3[0], lm2["bindi"]["r"] * T["K"] * 1.0, seg=16)
    off = sum(len(v) for v in V_all)
    V_all.append(Vb); F_all += [[q + off for q in f] for f in Fb]; C_all.append(np.tile(BINDI, (len(Vb), 1)))
    tag += ["bindi"] * len(Vb); mat += [0] * len(Fb)
    return np.concatenate(V_all), F_all, np.concatenate(C_all), np.array(tag), np.array(mat), ears


def build(T, R, cfg, a):
    """hair + garment objects from the labelled target (remeshed, tucked); garment colour baked to a texture."""
    lm2 = T["lm2"]
    W = R["W"]
    # ---------------- hair
    fl = T["flabel"]
    ob, used = RG.submesh(T, fl == 1, "hair")
    comps = RG.islands(ob)
    P = L.co(ob.data)
    total = sum(len(c) for c in comps)
    eyeC = R["eyes"]["L"]["C"]
    keep = []
    for c in comps:
        vs = np.unique(np.array([ob.data.polygons[f].vertices[:] for f in c[:4000]]).ravel())
        cen = P[vs].mean(0)
        face_zone = abs(cen[0]) < eyeC[0] + 0.03 and cen[1] < eyeC[1] + 0.005 and (R["mouth"]["line"][:, 2].min() - 0.01) < cen[2] < eyeC[2] + 0.04
        if len(c) > 0.012 * total and not face_zone:
            keep += c
    # drop any sculpt brow left on the main hair island (our brows are their own meshes)
    Pp = np.array([np.mean([P[v] for v in ob.data.polygons[f].vertices], 0) for f in keep])
    browz = eyeC[2]
    bad = (Pp[:, 2] > browz + 0.004) & (Pp[:, 2] < browz + 0.045) & (np.abs(Pp[:, 0]) < 0.062) & (Pp[:, 1] < eyeC[1] - 0.004)
    if bad.any():
        _, _, _, dsk = L.nearest(R["skin_bvh"], Pp[bad])
        bi = np.nonzero(bad)[0]
        bad[bi[dsk > 0.008]] = False                    # only what lies ON the skin (painted brow), not temple hair
    keep = list(np.array(keep)[~bad])
    RG.keep_faces(ob, keep)
    RG.smooth(ob, 3, 0.5)
    RG.decimate(ob, cfg.get("hair_tris", 9000))
    RG.smooth(ob, 1, 0.3)
    RG.tuck_boundary(ob, 0.003, 2)
    L.shade_smooth(ob)
    L.set_vcol(ob, np.tile(RG.HAIR, (len(ob.data.vertices), 1)))
    ob.data.materials.append(L.new_material("hair", base=tuple(RG.HAIR ** 2.2), rough=0.62, spec=0.35))
    hair = ob
    # ---------------- garment (kurta + piping), baked colour
    src, used = RG.submesh(T, (fl == 2) | (fl == 3), "garment_hi")
    comps = RG.islands(src)
    RG.keep_faces(src, max(comps, key=len))
    labs = T["label"][used]
    # recompute per-vertex labels after keep_faces (vertex order preserved for kept verts): sample by nearest target vertex
    Ps = L.co(src.data)
    from scipy.spatial import cKDTree
    _, nn = cKDTree(T["V"]).query(Ps)
    lab_s = T["label"][nn]
    Cs = np.where((lab_s == 3)[:, None], RG.PIPING, RG.KURTA)
    L.set_vcol(src, Cs)
    src.name = "garment_hi"
    low = src.copy(); low.data = src.data.copy()
    bpy.context.scene.collection.objects.link(low)
    RG.decimate(low, cfg.get("garment_tris", 3600))
    RG.smooth(low, 1, 0.3)
    L.shade_smooth(low)
    garment = low
    tex_path = os.path.join(os.path.dirname(os.path.abspath(a.out)), "garment_albedo.png")
    bake_colour(src, low, tex_path, 512)
    img = bpy.data.images.load(tex_path)
    low.data.materials.clear()
    low.data.materials.append(L.new_material("cloth", rough=0.85, spec=0.25, image=img, sheen=0.3))
    bpy.data.objects.remove(src)
    low.name = "garment"
    return hair, garment, {}


def bake_colour(src, low, path, res):
    """Cycles selected-to-active EMIT bake of src's vertex colour onto low's smart-projected UVs."""
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = low
    low.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=66 * DEG, island_margin=0.01)
    bpy.ops.object.mode_set(mode="OBJECT")
    img = bpy.data.images.new("bake", res, res)
    m_low = bpy.data.materials.new("bake_low"); m_low.use_nodes = True
    tn = m_low.node_tree.nodes.new("ShaderNodeTexImage"); tn.image = img
    m_low.node_tree.nodes.active = tn
    low.data.materials.clear(); low.data.materials.append(m_low)
    m_src = bpy.data.materials.new("bake_src"); m_src.use_nodes = True
    nt = m_src.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); em = nt.nodes.new("ShaderNodeEmission")
    vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Col"
    nt.links.new(vc.outputs["Color"], em.inputs["Color"]); nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    src.data.materials.clear(); src.data.materials.append(m_src)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.samples = 4; sc.cycles.device = "CPU"
    src.select_set(True); low.select_set(True)
    bpy.context.view_layer.objects.active = low
    sc.render.bake.use_selected_to_active = True
    sc.render.bake.cage_extrusion = 0.006
    sc.render.bake.max_ray_distance = 0.02
    sc.render.bake.margin = 6
    bpy.ops.object.bake(type="EMIT")
    img.filepath_raw = path; img.file_format = "PNG"
    img.save()
    bpy.ops.object.select_all(action="DESELECT")


def add_keys(ob, rest, deltas_by_key, keys):
    ob.shape_key_add(name="Basis", from_mix=False)
    for k in keys:
        sk = ob.shape_key_add(name=k, from_mix=False)
        d = deltas_by_key.get(k)
        P = rest + (d if d is not None else 0)
        sk.data.foreach_set("co", P.astype(np.float32).ravel())
        sk.value = 0.0


def add_shape_keys(face, brows, mouth, tag, D, keys, more):
    nskin = more["nskin"]
    Pf = L.co(face.data)
    ftag = more["ftag"]
    bindi = np.nonzero(ftag == "bindi")[0]
    # the bindi follows the skin under it
    skinP = Pf[:nskin]
    nearest = np.argmin(np.linalg.norm(skinP[None, :, :] - Pf[bindi][:, None, :], axis=2), axis=1) if len(bindi) else []
    dF = {}
    for k in keys:
        d = np.zeros_like(Pf)
        d[:nskin] = D[k]["skin"][:nskin]
        if len(bindi):
            d[bindi] = D[k]["skin"][nearest]
        dF[k] = d
    add_keys(face, Pf, dF, keys)
    Pb = L.co(brows.data)
    add_keys(brows, Pb, {k: D[k]["brows"] for k in keys}, [k for k in keys if np.abs(D[k]["brows"]).max() > 1e-6])
    Pm = L.co(mouth.data)
    dM = {}
    for k in keys:
        d = np.zeros_like(Pm)
        for p in ("teethUp", "teethLo", "tongue"):
            d[tag == p] = D[k][p]
        dM[k] = d
    add_keys(mouth, Pm, dM, [k for k in keys if np.abs(dM[k]).max() > 1e-6])


def finish(R, T, cfg, a, face, eyes, cor, brows, mouth, hair, garment, more, D, keys):
    """armature (Spine2 / Neck / Head / eyes / shoulders), weights, raw GLB export, then finish.mjs (KTX2 + meshopt)."""
    W = R["W"]
    chin = R["mouth"]["line"][:, 2].min() - 0.03
    eyeL, eyeR = R["eyes"]["L"]["C"], R["eyes"]["R"]["C"]
    neck_top = np.array([0, W.c[1] + 0.01, chin - 0.012])
    neck_base = np.array([0, W.c[1] + 0.015, chin - 0.06])
    arm_d = bpy.data.armatures.new("rig"); arm = bpy.data.objects.new("rig", arm_d)
    bpy.context.scene.collection.objects.link(arm)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_d.edit_bones

    def bone(n, h, t, parent=None):
        b = eb.new(n); b.head, b.tail = tuple(map(float, h)), tuple(map(float, t)); b.roll = 0
        if parent:
            b.parent = eb[parent]
    bone("Spine2", neck_base - np.array([0, 0, 0.08]), neck_base)
    bone("Neck", neck_base, neck_top, "Spine2")
    bone("Head", neck_top, neck_top + np.array([0, 0, 0.14]), "Neck")
    bone("LeftEye", eyeL, eyeL + np.array([0, -0.03, 0]), "Head")
    bone("RightEye", eyeR, eyeR + np.array([0, -0.03, 0]), "Head")
    sh_z = neck_base[2] - 0.03
    bone("LeftShoulder", (0.02, neck_base[1], sh_z), (0.13, neck_base[1], sh_z - 0.02), "Spine2")
    bone("RightShoulder", (-0.02, neck_base[1], sh_z), (-0.13, neck_base[1], sh_z - 0.02), "Spine2")
    bpy.ops.object.mode_set(mode="OBJECT")
    BONES = ["Spine2", "Neck", "Head", "LeftEye", "RightEye", "LeftShoulder", "RightShoulder"]

    def assign(ob, Wd):
        vgs = {b: ob.vertex_groups.new(name=b) for b in BONES}
        for b, w in Wd.items():
            for i in np.nonzero(w > 1e-4)[0]:
                vgs[b].add([int(i)], float(w[i]), "REPLACE")
        md = ob.modifiers.new("Armature", "ARMATURE"); md.object = arm
        ob.parent = arm

    def body_w(P, head_ok=True):
        wH = L.smoothstep(neck_top[2] - 0.012, neck_top[2] + 0.01, P[:, 2]) if head_ok else np.zeros(len(P))
        rest = 1 - wH
        wN = rest * L.smoothstep(neck_base[2] - 0.01, neck_base[2] + 0.02, P[:, 2])
        wS = rest - wN
        sh = L.smoothstep(0.05, 0.12, np.abs(P[:, 0])) * (P[:, 2] < neck_base[2])
        wSh = wS * sh
        return {"Head": wH, "Neck": wN, "Spine2": wS - wSh, "LeftShoulder": wSh * (P[:, 0] > 0), "RightShoulder": wSh * (P[:, 0] <= 0)}
    assign(face, body_w(L.co(face.data)))
    Pe = L.co(eyes.data); assign(eyes, {"LeftEye": (Pe[:, 0] > 0) * 1.0, "RightEye": (Pe[:, 0] <= 0) * 1.0})
    Pc = L.co(cor.data); assign(cor, {"LeftEye": (Pc[:, 0] > 0) * 1.0, "RightEye": (Pc[:, 0] <= 0) * 1.0})
    for ob in (brows, mouth, hair):
        assign(ob, {"Head": np.ones(len(ob.data.vertices))})
    assign(garment, body_w(L.co(garment.data), head_ok=False))
    stats = {"meshes": {}, "tris": 0}
    for ob in (face, eyes, cor, brows, mouth, hair, garment):
        t = int(sum(len(p.vertices) - 2 for p in ob.data.polygons))
        stats["meshes"][ob.name] = {"verts": len(ob.data.vertices), "tris": t,
                                    "keys": (len(ob.data.shape_keys.key_blocks) - 1) if ob.data.shape_keys else 0}
        stats["tris"] += t
    stats["faceKeys"] = [k.name for k in face.data.shape_keys.key_blocks[1:]]
    raw = a.out.replace(".blend", ".raw.glb")
    kw = dict(filepath=raw, export_format="GLB", export_morph=True, export_morph_normal=False, export_skins=True,
              export_attributes=True, export_yup=True, export_texcoords=True, export_normals=True, export_tangents=False,
              export_materials="EXPORT", export_animations=False, export_apply=False, use_selection=False, export_extras=False)
    try:
        bpy.ops.export_scene.gltf(**kw, export_vertex_color="ACTIVE")
    except TypeError:
        bpy.ops.export_scene.gltf(**kw)
    stats["rawBytes"] = os.path.getsize(raw)
    return stats
