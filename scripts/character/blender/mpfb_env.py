"""Shared helpers for the headless-Blender character pipeline (bpy 4.2 wheel + MPFB 2 extension).

Every input here is licence-clean: the MakeHuman base mesh, modelling targets, proxies (eyes, brows, lashes,
teeth, tongue, hair) and the faceunits01 / visemes02 packs are CC0 (art/character/LICENSES.md). The MPFB plugin
code is GPLv3 and runs offline at build time only; nothing of it ships.
"""
import importlib, os, sys
import numpy as np
import bpy

P = "bl_ext.user_default.mpfb"
USER_DATA = os.path.expanduser("~/.config/blender/4.2/extensions/.user/user_default/mpfb/data")


def mod(name):
    return importlib.import_module(P + "." + name)


def enable_mpfb():
    if P not in bpy.context.preferences.addons:
        bpy.ops.preferences.addon_enable(module=P)
    return dict(
        HS=mod("services.humanservice").HumanService,
        TS=mod("services.targetservice").TargetService,
        FS=mod("services.faceservice").FaceService,
        HOP=mod("entities.objectproperties").HumanObjectProperties,
    )


def asset(kind, name, ext=".mhclo"):
    p = os.path.join(USER_DATA, kind, name, name + ext)
    if not os.path.exists(p):
        raise FileNotFoundError(p)
    return p


# ---------------------------------------------------------------- numpy <-> mesh
def co(me):
    a = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", a)
    return a.reshape(-1, 3)


def key_co(kb):
    a = np.empty(len(kb.data) * 3)
    kb.data.foreach_get("co", a)
    return a.reshape(-1, 3)


def set_key_co(kb, arr):
    kb.data.foreach_set("co", np.ascontiguousarray(arr, dtype=np.float64).ravel())


def deltas(obj):
    """{name: (N,3) delta} for every non-basis shape key."""
    kbs = obj.data.shape_keys.key_blocks
    base = key_co(kbs[0])
    return base, {k.name: key_co(k) - base for k in kbs[1:]}


def tris_of(me):
    me.calc_loop_triangles()
    t = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
    me.loop_triangles.foreach_get("vertices", t)
    return t.reshape(-1, 3)


def hex_lin(h):
    h = h.lstrip("#")
    c = np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def delete_verts(obj, mask):
    """Delete vertices where mask is True (shape keys stay consistent)."""
    import bmesh
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.verts[i] for i in np.nonzero(mask)[0]], context="VERTS")
    bm.to_mesh(me)
    bm.free()
    me.update()
