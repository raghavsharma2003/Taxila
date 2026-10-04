# Per-vertex ambient occlusion (polish r2): cosine-hemisphere rays against every mesh in the scene, short range, so
# creases and the hair/ear contact read softly. Stored as data for TaxilaToon (skin: UV.x; hair/kurta: vertex colour).
import numpy as np
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def scene_bvh(exclude=()):
    bm = bmesh.new()
    for o in bpy.context.scene.objects:
        if o.type != 'MESH' or o.name in exclude or o.name.startswith('cornea'):
            continue
        me = o.data.copy()
        me.transform(o.matrix_world)
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    t = BVHTree.FromBMesh(bm)
    bm.free()
    return t


def bake(ob, bvh, n=32, dist=0.03, seed=1):
    me = ob.data
    mw = ob.matrix_world
    rng = np.random.default_rng(seed)
    u = rng.random((n, 2))
    # cosine-weighted hemisphere samples (local, +z)
    r = np.sqrt(u[:, 0]); ph = 2 * np.pi * u[:, 1]
    S = np.stack([r * np.cos(ph), r * np.sin(ph), np.sqrt(1 - u[:, 0])], 1)
    me.calc_normals_split() if hasattr(me, 'calc_normals_split') else None
    out = np.ones(len(me.vertices))
    for i, v in enumerate(me.vertices):
        p = mw @ v.co
        nn = (mw.to_3x3() @ v.normal).normalized()
        a = Vector((1, 0, 0)) if abs(nn.x) < 0.9 else Vector((0, 1, 0))
        t = nn.cross(a).normalized(); b = nn.cross(t)
        o = p + nn * 0.0003
        hit = 0.0
        for s in S:
            d = t * s[0] + b * s[1] + nn * s[2]
            loc, _, _, dd = bvh.ray_cast(o, d, dist)
            if loc is not None:
                hit += 1.0 - (dd / dist) ** 2 * 0.5
        out[i] = 1.0 - hit / n
    return out
