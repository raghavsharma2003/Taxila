"""Hair and bust from the sculpt's labelled regions: extract -> keep the big islands -> decimate to budget (new vertices,
fitted to the target surface) -> tuck the open boundary under the skin. The bust colour (teal kurta + orange piping) is
BAKED from the high-res labelled target to a 512 px texture on the low mesh (Cycles selected-to-active, emit)."""
import bmesh
import bpy
import numpy as np

import lib as L

KURTA = np.array([16, 112, 124]) / 255
PIPING = np.array([222, 124, 62]) / 255
HAIR = np.array([40, 34, 32]) / 255


def submesh(T, faces_mask, name):
    F = T["F"][faces_mask]
    used = np.unique(F)
    remap = -np.ones(len(T["V"]), int); remap[used] = np.arange(len(used))
    ob = L.mesh_from_np(name, T["V"][used], remap[F])
    return ob, used


def islands(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bm.faces.ensure_lookup_table()
    seen = np.zeros(len(bm.faces), bool); comps = []
    for f in bm.faces:
        if seen[f.index]:
            continue
        stack = [f]; seen[f.index] = True; comp = []
        while stack:
            g = stack.pop(); comp.append(g.index)
            for e in g.edges:
                for h in e.link_faces:
                    if not seen[h.index]:
                        seen[h.index] = True; stack.append(h)
        comps.append(comp)
    bm.free()
    return comps


def keep_faces(ob, keep_idx):
    bm = bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table()
    keep = set(keep_idx)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in keep], context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bm.to_mesh(ob.data); bm.free()


def decimate(ob, tris):
    n = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    md = ob.modifiers.new("dec", "DECIMATE")
    md.ratio = min(1.0, tris / max(n, 1))
    md.use_symmetry = True; md.symmetry_axis = "X"
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.modifier_apply(modifier="dec")


def smooth(ob, iters=4, factor=0.5):
    md = ob.modifiers.new("sm", "SMOOTH")
    md.iterations = iters; md.factor = factor
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier="sm")


def tuck_boundary(ob, depth=0.003, rings=2):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table(); bm.normal_update()
    b0 = {v.index for v in bm.verts if any(e.is_boundary for e in v.link_edges)}
    levels = [b0]
    seen = set(b0)
    for _ in range(rings - 1):
        nxt = set()
        for i in levels[-1]:
            for e in bm.verts[i].link_edges:
                j = e.other_vert(bm.verts[i]).index
                if j not in seen:
                    nxt.add(j); seen.add(j)
        levels.append(nxt)
    for k, lev in enumerate(levels):
        d = depth * (1 - k / rings)
        for i in lev:
            v = bm.verts[i]
            v.co -= v.normal * d
    bm.to_mesh(ob.data); bm.free()


def mirror_symmetrize(ob):
    """symmetrise a non-topological mesh by averaging each vertex with the nearest point of the mirrored surface."""
    P = L.co(ob.data)
    F = L.faces_np(ob.data)
    Pm = P * np.array([-1, 1, 1])
    bvh = L.bvh_from_np(Pm, [f[::-1] for f in F])
    Q, _, _, _ = L.nearest(bvh, P)
    L.set_co(ob.data, 0.5 * (P + Q))


def smooth_boundary(ob, rings=3, iters=12):
    """relax the ragged open edge of a remeshed region (hairline / sideburn crust) and the rings next to it."""
    bm = bmesh.new(); bm.from_mesh(ob.data); bm.verts.ensure_lookup_table()
    sel = {v for v in bm.verts if any(e.is_boundary for e in v.link_edges)}
    front = set(sel)
    for _ in range(rings - 1):
        nxt = set()
        for v in front:
            for e in v.link_edges:
                w = e.other_vert(v)
                if w not in sel:
                    nxt.add(w)
        sel |= nxt; front = nxt
    vs = list(sel)
    for _ in range(iters):
        bmesh.ops.smooth_vert(bm, verts=vs, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(ob.data); bm.free()
