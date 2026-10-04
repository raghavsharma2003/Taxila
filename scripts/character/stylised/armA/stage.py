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
    nt.links.new(mix.outputs[0], out.inputs[0])
    lights = [
        # name, location, energy, size, colour
        ('key', (-0.55, -0.85, 0.65), 16.0, 0.9, (1.0, 0.95, 0.88)),
        ('fill', (0.7, -0.8, 0.05), 5.0, 1.2, (0.92, 0.95, 1.0)),
        ('rim', (0.55, 0.75, 0.45), 14.0, 0.5, (1.0, 0.86, 0.72)),
        ('rimL', (-0.6, 0.6, 0.3), 5.0, 0.5, (1.0, 0.9, 0.8)),
        ('catch', (-0.18, -1.2, 0.30), 1.6, 0.06, (1.0, 1.0, 1.0)),
    ]
    for name, loc, en, size, col in lights:
        L = bpy.data.lights.new(name, 'AREA')
        L.energy = en; L.size = size; L.color = col
        if name == 'catch':
            L.cycles.cast_shadow = False
        o = bpy.data.objects.new(name, L)
        if name == 'catch':
            o.visible_diffuse = False
        s.collection.objects.link(o)
        o.location = Vector(loc) + Vector((0, 0, 0.0))
        d = Vector((0, 0.02, -0.02)) - o.location
        o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
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
