"""bpy + numpy helpers shared by the Arm B stages (prep / build / render). Blender world: Z up, the character faces -Y,
her left = +X, metres (glTF export swaps to Y up, +Z forward = the CHARACTER-PIPELINE 4.2 character space)."""
import math
import os

import bpy
import bmesh
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

BG_SRGB = (247, 229, 196)          # c-front background, sampled at the corners


def smoothstep(e0, e1, x):
    t = np.clip((np.asarray(x, float) - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def srgb_to_lin(c):
    c = np.asarray(c, float) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights, bpy.data.armatures):
        for b in list(coll):
            coll.remove(b)


def mesh_from_np(name, V, F, link=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(map(float, v)) for v in V], [], [list(map(int, f)) for f in F])
    me.update(calc_edges=True)
    ob = bpy.data.objects.new(name, me)
    if link:
        bpy.context.scene.collection.objects.link(ob)
    return ob


def co(me):
    a = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", a)
    return a.reshape(-1, 3)


def set_co(me, P):
    me.vertices.foreach_set("co", np.asarray(P, float).ravel())
    me.update()


def faces_np(me):
    return [list(p.vertices) for p in me.polygons]


def bvh_from_np(V, F):
    return BVHTree.FromPolygons([tuple(map(float, v)) for v in V], [tuple(map(int, f)) for f in F], all_triangles=False)


def raycast(bvh, O, D, far=10.0):
    """first hit per ray; returns (P (n,3), hit mask, face index)."""
    n = len(O)
    P = np.zeros((n, 3)); ok = np.zeros(n, bool); fi = -np.ones(n, int)
    for k in range(n):
        loc, nor, idx, dist = bvh.ray_cast(Vector(O[k]), Vector(D[k]), far)
        if loc is not None:
            P[k] = loc; ok[k] = True; fi[k] = idx
    return P, ok, fi


def nearest(bvh, P):
    n = len(P)
    Q = np.zeros((n, 3)); N = np.zeros((n, 3)); fi = -np.ones(n, int); d = np.zeros(n)
    for k in range(n):
        loc, nor, idx, dist = bvh.find_nearest(Vector(P[k]))
        if loc is not None:
            Q[k] = loc; N[k] = nor; fi[k] = idx; d[k] = dist
    return Q, N, fi, d


def shade_smooth(ob):
    me = ob.data
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    me.update()


def set_vcol(ob, C, name="Col"):
    """per-vertex sRGB colour (n,3 or n,4 in 0..1) as a byte colour attribute on the point domain."""
    me = ob.data
    if name in me.color_attributes:
        me.color_attributes.remove(me.color_attributes[name])
    at = me.color_attributes.new(name, "BYTE_COLOR", "POINT")
    C = np.asarray(C, float)
    if C.shape[1] == 3:
        C = np.concatenate([C, np.ones((len(C), 1))], 1)
    # BYTE_COLOR stores sRGB bytes; foreach_set on .color expects LINEAR floats (Blender converts)
    lin = C.copy()
    lin[:, :3] = np.where(C[:, :3] <= 0.04045, C[:, :3] / 12.92, ((C[:, :3] + 0.055) / 1.055) ** 2.4)
    at.data.foreach_set("color", lin.ravel())
    me.color_attributes.active_color = at
    me.color_attributes.render_color_index = me.color_attributes.active_color_index
    return at


def new_material(name, base=(0.8, 0.8, 0.8), rough=0.5, vcol=None, metallic=0.0, spec=0.5, sss=0.0, sss_radius=(1, 0.35, 0.2),
                 sss_scale=0.004, transmission=0.0, ior=1.45, coat=0.0, image=None, alpha=1.0, emission=None, sheen=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Specular IOR Level"].default_value = spec
    bsdf.inputs["IOR"].default_value = ior
    if sss:
        bsdf.inputs["Subsurface Weight"].default_value = sss
        bsdf.inputs["Subsurface Radius"].default_value = sss_radius
        bsdf.inputs["Subsurface Scale"].default_value = sss_scale
    if transmission:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if coat:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.08
    if sheen:
        bsdf.inputs["Sheen Weight"].default_value = sheen
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = 1.0
    if vcol:
        n = nt.nodes.new("ShaderNodeVertexColor")
        n.layer_name = vcol
        if base != (1, 1, 1) and base != (1.0, 1.0, 1.0):
            mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            nt.links.new(n.outputs["Color"], mix.inputs[6])
            mix.inputs[7].default_value = (*base, 1)
            nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
        else:
            nt.links.new(n.outputs["Color"], bsdf.inputs["Base Color"])
    if image:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = image
        tex.extension = "EXTEND"
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return m


def look_at(ob, target, up=(0, 0, 1)):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def camera(name, loc, target, lens=85, ortho=None, sensor=36):
    cam = bpy.data.cameras.new(name)
    cam.lens = lens
    cam.sensor_width = sensor
    cam.clip_start = 0.01
    cam.clip_end = 50
    if ortho:
        cam.type = "ORTHO"; cam.ortho_scale = ortho
    ob = bpy.data.objects.new(name, cam)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = Vector(loc)
    look_at(ob, target)
    return ob


def area_light(name, loc, target, energy, size, color=(1, 1, 1), shape="DISK"):
    li = bpy.data.lights.new(name, "AREA")
    li.energy = energy; li.size = size; li.color = color; li.shape = shape
    ob = bpy.data.objects.new(name, li)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = Vector(loc)
    look_at(ob, target)
    return ob


def setup_render(res=1024, samples=48, bg=BG_SRGB, exposure=0.0):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.max_bounces = 6
    sc.cycles.transmission_bounces = 6
    sc.cycles.transparent_max_bounces = 8
    sc.render.resolution_x = sc.render.resolution_y = res
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = exposure
    sc.render.image_settings.file_format = "PNG"
    w = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = w
    w.use_nodes = True
    bgn = w.node_tree.nodes["Background"]
    lin = srgb_to_lin(bg)
    bgn.inputs["Color"].default_value = (*lin, 1)
    bgn.inputs["Strength"].default_value = 1.0
    return sc


def render_to(path, cam):
    sc = bpy.context.scene
    sc.camera = cam
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
