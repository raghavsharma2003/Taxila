"""Light-fringe gate for the hair/lock/bun mattes (r2 item 2). Each dark-hair layer is composited ALONE over cream,
black, magenta and white grounds at 1024 px. A fringe pixel is a pixel within 3 px outside/inside the layer's edge
whose luminance exceeds BOTH the local solid-hair luminance and the ground luminance by > 10/255 (i.e. a halo that
neither the hair nor the ground can explain). Target: 0 on every ground.
    python3 scripts/character/puppet2d/polish-r7/fringe.py [layers_dir]"""
import json, sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
L = sys.argv[1] if len(sys.argv) > 1 else "art/character/puppet2d/polish-r7/layers"
g = json.load(open(f"{L}/geom.json"))
grounds = {"cream": (251, 229, 189), "black": (0, 0, 0), "magenta": (255, 0, 255), "white": (255, 255, 255), "teal": (20, 120, 130)}
lum = lambda c: 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]
res = {}
for name in ("hair", "lockL", "lockR", "bun"):
    a = np.asarray(Image.open(f"{L}/{name}.png")).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3] / 255
    solid = al > 0.97
    # local hair luminance: max solid-hair lum within 6 px
    hl = np.where(solid, lum(rgb), 0)
    hl = ndi.maximum_filter(hl, 13)
    edge = ndi.binary_dilation(al > 0.02, iterations=3) & ~ndi.binary_erosion(solid, iterations=3)
    hl = np.where(hl > 0, hl, np.median(lum(rgb)[solid]))      # no solid pixel within 6 px: the layer's median hair
    # contamination: an edge pixel whose OWN colour (straight alpha) is lighter than the hair it belongs to; this is
    # what shows as a light rim over any ground darker than cream
    cont = edge & (al > 0.04) & (lum(rgb) > hl + 10)
    r = {}
    for gname, gc in grounds.items():
        G = np.array(gc, np.float32)
        comp = rgb * al[..., None] + G * (1 - al[..., None])
        f = edge & (lum(comp) > np.maximum(hl, lum(G[None, None])) + 10)
        r[gname] = int(f.sum())
    r["contaminated"] = int(cont.sum())
    res[name] = r
print(json.dumps(res))

# ---- render-level: the WebGL rest frame vs c-front along every hair edge (3 px band). A halo pixel is one the
# render shows > 15/255 lighter than c-front there. Usage: fringe.py <layers> <rest_render.png>
if len(sys.argv) > 2:
    m = np.load("art/character/puppet2d/polish-r7/work/masks-r2.npz")
    hairm = m["hair"] | m["lockL"] | m["lockR"] | m["bun"]
    band = ndi.binary_dilation(hairm, iterations=3) & ~ndi.binary_erosion(hairm, iterations=3)
    ref = np.asarray(Image.open("art/character/puppet2d/polish-r7/c-front.png").convert("RGB")).astype(np.float32)
    ren = np.asarray(Image.open(sys.argv[2]).convert("RGB").resize((1024, 1024))).astype(np.float32)
    lk = band & (ndi.binary_dilation(m["lockL"] | m["lockR"], iterations=3))
    # halo = lighter than ANYTHING within 2 px in c-front (a light rim the original cannot explain). The 1 px dark
    # feather against cream is a thinning, not a halo, and is not counted.
    h = band & (lum(ren) > ndi.maximum_filter(lum(ref), 5) + 8)
    print(json.dumps({"render_halo_px_all_hair_edges": int(h.sum()), "render_halo_px_lock_edges": int((h & lk).sum()), "band_px": int(band.sum())}))
