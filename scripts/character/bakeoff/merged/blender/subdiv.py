"""procedural-v3: the H face-mask subdivision (CHARACTER-PIPELINE §3 deviation, §10.6), with every shape key carried.

The expressive mask (lids, brows, nose, lips, nasolabial, cheeks) is split off the face, Catmull-Clark subdivided once
with linear UVs (so every map baked on the sd0 layout still lands on the same skin), and each of the 82 shape keys is
re-evaluated THROUGH the subdivision (Catmull-Clark is linear in the control points, so key k at weight 1 subdivided =
the subdivided key; deltas stay exact for the runtime's linear morph blend). The mask boundary is held on the linear
(SIMPLE) subdivision in every key, and the neighbouring sd0 faces get the same edge midpoints, so the seam is
watertight in every pose. Everything is then merged back into one `face_sd1` object (same attributes, same regions).
"""
import numpy as np
import bpy, bmesh
from mpfb_env import co, key_co, set_key_co, select_only


def _attr(ob, nm):
    a = np.zeros(len(ob.data.vertices), np.float32)
    ob.data.attributes[nm].data.foreach_get("value", a)
    return a


def _eval_positions(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    P = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", P)
    ev.to_mesh_clear()
    return P.reshape(-1, 3)


def subdivide_mask(face, poly_mask, name="face_sd1"):
    """poly_mask: bool per polygon of `face` (the expressive mask). Returns (new object, stats)."""
    # ---- duplicate the face (keys, attributes, UVs travel with the copy)
    src = face.copy()
    src.data = face.data.copy()
    bpy.context.collection.objects.link(src)
    src.name = name
    me = src.data
    nkeys = len(me.shape_keys.key_blocks)
    # ---- separate the mask polygons into A
    select_only([src])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_mode(type="FACE")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    me.polygons.foreach_set("select", np.asarray(poly_mask, bool))
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.separate(type="SELECTED")
    bpy.ops.object.mode_set(mode="OBJECT")
    A = [o for o in bpy.context.selected_objects if o is not src][0]
    B = src
    nA0 = len(A.data.vertices)
    # ---- A: Catmull-Clark once, per key; SIMPLE once, per key (for the boundary)
    keysA = [kb.name for kb in A.data.shape_keys.key_blocks]
    md = A.modifiers.new("sd", "SUBSURF")
    md.levels = 1
    md.render_levels = 1
    md.uv_smooth = "NONE"
    md.boundary_smooth = "ALL"
    md.use_limit_surface = False
    A.show_only_shape_key = True
    posCC, posLin = {}, {}
    for i, k in enumerate(keysA):
        A.active_shape_key_index = i
        md.subdivision_type = "CATMULL_CLARK"
        posCC[k] = _eval_positions(A)
        md.subdivision_type = "SIMPLE"
        posLin[k] = _eval_positions(A)
    A.show_only_shape_key = False
    A.active_shape_key_index = 0
    md.subdivision_type = "CATMULL_CLARK"
    # apply the modifier to get the topology + interpolated attributes/UVs (keys must go first)
    A.shape_key_clear()
    select_only([A])
    bpy.ops.object.modifier_apply(modifier="sd")
    nA = len(A.data.vertices)
    assert all(len(v) == nA for v in posCC.values()), "subdivided vertex count differs between keys"
    bm = bmesh.new()
    bm.from_mesh(A.data)
    bnd = np.array([v.is_boundary for v in bm.verts])
    bm.free()
    for k in keysA:
        posCC[k][bnd] = posLin[k][bnd]
    A.data.vertices.foreach_set("co", posCC[keysA[0]].ravel())
    A.data.update()
    A.shape_key_add(name=keysA[0])
    for k in keysA[1:]:
        set_key_co(A.shape_key_add(name=k), posCC[k])
    # ---- B: split the edges it shares with A at their midpoints (linear in every key)
    PA = posCC[keysA[0]][bnd]
    bm = bmesh.new()
    bm.from_mesh(B.data)
    bm.verts.ensure_lookup_table()
    from scipy.spatial import cKDTree
    tree = cKDTree(PA)
    Pb = np.array([v.co[:] for v in bm.verts])
    on_seam = tree.query(Pb)[0] < 1e-6
    edges = [e for e in bm.edges if e.is_boundary and on_seam[e.verts[0].index] and on_seam[e.verts[1].index]]
    bmesh.ops.subdivide_edges(bm, edges=edges, cuts=1, use_grid_fill=False, smooth=0.0,
                              quad_corner_type="FAN")
    bm.to_mesh(B.data)
    bm.free()
    B.data.update()
    # ---- join + weld the seam (identical positions in the basis and, by construction, in every key)
    select_only([B, A])
    bpy.context.view_layer.objects.active = B
    bpy.ops.object.join()
    ob = B
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    n0 = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-6)
    welded = n0 - len(bm.verts)
    bm.to_mesh(ob.data)
    bm.free()
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.update()
    # seam check: max gap between welded neighbours in every key would show as open edges; count boundary verts
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    open_after = sum(1 for e in bm.edges if e.is_boundary)
    bm.free()
    bm = bmesh.new()
    bm.from_mesh(face.data)
    open_before = sum(1 for e in bm.edges if e.is_boundary)
    bm.free()
    stats = {"maskPolys": int(np.sum(poly_mask)), "maskVertsBefore": nA0, "maskVertsAfter": nA, "welded": int(welded),
             "verts": len(ob.data.vertices), "tris": int(sum(len(p.vertices) - 2 for p in ob.data.polygons)),
             "keys": len(ob.data.shape_keys.key_blocks) - 1, "openEdgesBefore": open_before, "openEdgesAfter": open_after}
    return ob, stats
