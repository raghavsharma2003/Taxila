# Render stage shared by previews and the evidence sheets: camera, soft key/fill/rim, warm world, concept background.
import math
import bpy
from mathutils import Vector

BG = (252 / 255, 229 / 255, 189 / 255)


def srgb_to_lin(c):
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)


def setup(res=768, samples=48):
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = samples
    s.cycles.use_denoising = True
    s.cycles.denoiser = 'OPENIMAGEDENOISE'
    s.cycles.max_bounces = 6
    s.render.resolution_x = s.render.resolution_y = res
    s.render.film_transparent = False
    s.view_settings.view_transform = 'Standard'
    s.view_settings.look = 'None'
    s.view_settings.exposure = 0.0
    w = bpy.data.worlds.new('w') if not bpy.data.worlds else bpy.data.worlds[0]
    s.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes.get('Background')
    # world: warm ambient fill for lighting; camera sees the concept's flat background via a light-path mix
    lp = nt.nodes.new('ShaderNodeLightPath')
    mix = nt.nodes.new('ShaderNodeMixShader')
    amb = nt.nodes.new('ShaderNodeBackground'); amb.inputs[0].default_value = (0.95, 0.88, 0.80, 1); amb.inputs[1].default_value = 0.25
    cam = nt.nodes.new('ShaderNodeBackground'); cam.inputs[0].default_value = (*srgb_to_lin(BG), 1); cam.inputs[1].default_value = 1.0
    out = nt.nodes.get('World Output')
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
    nt.links.new(amb.outputs[0], mix.inputs[1])
    nt.links.new(cam.outputs[0], mix.inputs[2])
    # glossy rays see black (the corneas show only the catchlight, never a world disc)
    mix2 = nt.nodes.new('ShaderNodeMixShader')
    blk = nt.nodes.new('ShaderNodeBackground'); blk.inputs[0].default_value = (0, 0, 0, 1)
    nt.links.new(lp.outputs['Is Glossy Ray'], mix2.inputs[0])
    nt.links.new(mix.outputs[0], mix2.inputs[1])
    nt.links.new(blk.outputs[0], mix2.inputs[2])
    nt.links.new(mix2.outputs[0], out.inputs[0])
    lights = [
        # name, location, energy, size, colour
        ('key', (-0.35, -1.0, 0.38), 14.0, 2.0, (1.0, 0.95, 0.88)),
        ('fill', (0.55, -0.95, -0.05), 9.0, 2.0, (0.92, 0.95, 1.0)),
        ('rim', (0.55, 0.75, 0.45), 14.0, 0.5, (1.0, 0.86, 0.72)),
        ('rimL', (-0.6, 0.6, 0.3), 5.0, 0.5, (1.0, 0.9, 0.8)),
    ]
    for name, loc, en, size, col in lights:
        L = bpy.data.lights.new(name, 'AREA')
        L.energy = en; L.size = size; L.color = col
        o = bpy.data.objects.new(name, L)
        o.visible_glossy = False
        s.collection.objects.link(o)
        o.location = Vector(loc) + Vector((0, 0, 0.0))
        d = Vector((0, 0.02, -0.02)) - o.location
        o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    # catchlight: a small emissive ball seen only by glossy rays (the concept's white dot)
    me = bpy.data.meshes.new('catch'); import bmesh as _bm; b = _bm.new(); _bm.ops.create_uvsphere(b, u_segments=16, v_segments=8, radius=0.32); b.to_mesh(me)
    co = bpy.data.objects.new('catch', me); s.collection.objects.link(co); co.location = (-0.36, -1.05, 0.46)
    em = bpy.data.materials.new('catch'); em.use_nodes = True; nt = em.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[1].default_value = 40.0
    nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs[0]); me.materials.append(em)
    co.visible_camera = False; co.visible_diffuse = False; co.visible_shadow = False; co.visible_transmission = False
    # only the catchlight reflects in the corneas (one crisp dot, like the concept)
    corn = [o for o in s.objects if o.name.startswith('cornea')]
    if corn:
        cc = bpy.data.collections.new('corneas')
        for o in corn:
            cc.objects.link(o)
        for cobj in cc.collection_objects:
            cobj.light_linking.link_state = 'EXCLUDE'
        for o in s.objects:
            if o.type == 'LIGHT':
                o.light_linking.receiver_collection = cc
        # and the catchlight lights ONLY the corneas
        ci = bpy.data.collections.new('corneas_only')
        for o in corn:
            ci.objects.link(o)
        for c2 in ci.collection_objects:
            c2.light_linking.link_state = 'INCLUDE'
        co.light_linking.receiver_collection = ci
    return s


def camera(name='cam', yaw=0.0, pitch=0.0, dist=1.6, target=(0, 0.02, -0.04), lens=110, ortho=None):
    s = bpy.context.scene
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_start = 0.05; cd.clip_end = 10
    if ortho:
        cd.type = 'ORTHO'; cd.ortho_scale = ortho
    o = bpy.data.objects.new(name, cd)
    s.collection.objects.link(o)
    set_cam(o, yaw, pitch, dist, target)
    s.camera = o
    return o


def set_cam(o, yaw, pitch, dist, target):
    t = Vector(target)
    y, p = math.radians(yaw), math.radians(pitch)
    d = Vector((math.sin(y) * math.cos(p), -math.cos(y) * math.cos(p), math.sin(p)))
    o.location = t + d * dist
    o.rotation_euler = (t - o.location).to_track_quat('-Z', 'Y').to_euler()


def render(path):
    s = bpy.context.scene
    s.render.filepath = path
    bpy.ops.render.render(write_still=True)
