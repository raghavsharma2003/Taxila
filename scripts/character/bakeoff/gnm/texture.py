"""E-GNM1 step 3: the GNM face's maps, on GNM's own UV layout (packed by assemble.py), from the reference portraits.

albedo   projected from the TRAIN portraits (front, q45_left, q45_right, profile90_left, profile90_right; the held-out
         q3 views are never projected, so the likeness check on them stays honest) through the fit's own cameras:
         per texel, each view's colour (bilinear, linear light) weighted by visibility (a z-buffer of the face from that
         camera, 1.5 mm tolerance) x the facing term (n.v)^4 x a view prior, plus a mild flattening of the portrait's
         shading (divided by the square root of the soft frontal Lambert term the portraits were lit with); texels no view sees are filled by diffusion in UV. Eye-socket skin (the lid's inner rim, which
         the projection would paint with sclera) is set to a dark warm pink. Multiplied by look.skin.albedoGain (G9).
normal   flat + the portrait's own fine detail (high-pass luminance as height, small amplitude, lightly blurred)
packed   R cavity (high-pass darkness), G roughness (T-zone 0.42, cheeks 0.5, lips 0.32), B thickness (ears, nose,
         lids), A ambient occlusion (16-ray hemisphere casts per sampled vertex against the face, interpolated)
wrinkle  compress map: procedural creases in GNM's own regions (forehead lines, glabella, crow's feet, nasolabial,
         chin); stretch map flat; mask A (forehead, glabella, crowL, crowR) and B (nasoL, nasoR, chin, neck)
detail   R fuzz, G subsurface tint weight, B moisture, A micro strength (procedural-v3's channel meanings)
micro    procedural-v3's tiled micro tile (UV-independent), copied
Writes $CHAR_HOME/bakeoff-gnm/teal/tex/*.png (+ tex.json) for finish.mjs. Garment, hair and cards atlases are v3's.
    python texture.py [--size 2048]"""
import argparse, json, os, shutil, time
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt, map_coordinates
from scipy.spatial.transform import Rotation as Rot
from scipy.spatial import cKDTree
import gnm_model as G
import geom

ap = argparse.ArgumentParser()
ap.add_argument("--size", type=int, default=2048)
a = ap.parse_args()
t0 = time.time()
BD = os.path.join(G.CH, "bakeoff-gnm", "teal")
TX = os.path.join(BD, "tex")
os.makedirs(TX, exist_ok=True)
REFD = os.path.join(G.ROOT, "art/character/bakeoff/merged/refs/teal")
LOOK = json.load(open(os.path.join(G.ART, "looks", "teal.json")))
LM_ = json.load(open(os.path.join(REFD, "landmarks.json")))
fit = json.load(open(os.path.join(G.ART, "fit", "teal.json")))
asm = json.load(open(os.path.join(BD, "assemble.json")))
m = G.GNM()
sc = json.load(open(os.path.join(BD, "H", "scene.json")))
fm = [x for x in sc["meshes"] if x["name"] == "face"][0]
rd = lambda f, dt=np.float32: np.fromfile(os.path.join(BD, "H", f), dt)
P = rd(fm["attrs"]["POSITION"]["file"]).reshape(-1, 3).astype(np.float64)
NRM = rd(fm["attrs"]["NORMAL"]["file"]).reshape(-1, 3).astype(np.float64)
UV = rd(fm["attrs"]["TEXCOORD_0"]["file"]).reshape(-1, 2).astype(np.float64)
REG = np.round(rd(fm["attrs"]["_REGION"]["file"])).astype(int)
F = rd(fm["indices"], np.uint32).reshape(-1, 3).astype(int)
R_pl = np.array(asm["placement"]["R"]); t_w = np.array(asm["placement"]["t"])
Pg = (P - t_w) @ R_pl                                        # back into GNM's model frame (the fit cameras' frame)
Ng = NRM @ R_pl
# GNM source vertex of each face vertex (seam duplicates share one); assemble keeps GNM vertices first, in order
src = None
cid = np.array(fit["identity"])
Vg = np.load(os.path.join(BD, "keys.npz"))["V0"]
d_, src = cKDTree(Vg).query(Pg)
src[d_ > 1e-5] = -1
grp = lambda name: np.where(src >= 0, m.group(name)[np.maximum(src, 0)], False)

# ---------------------------------------------------------------- UV rasteriser: texel -> (tri, bary)
S = a.size
Fs = F[(REG[F] == 0).all(1)]


def raster(Fx, size):
    tri_of = -np.ones((size, size), np.int32)
    bar = np.zeros((size, size, 3), np.float32)
    U = UV * size
    for ti, f in enumerate(Fx):
        p = U[f]
        x0, y0 = np.floor(p.min(0)).astype(int); x1, y1 = np.ceil(p.max(0)).astype(int)
        x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, size - 1), min(y1, size - 1)
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        d = (p[1, 1] - p[2, 1]) * (p[0, 0] - p[2, 0]) + (p[2, 0] - p[1, 0]) * (p[0, 1] - p[2, 1])
        if abs(d) < 1e-12:
            continue
        l0 = ((p[1, 1] - p[2, 1]) * (xs - p[2, 0]) + (p[2, 0] - p[1, 0]) * (ys - p[2, 1])) / d
        l1 = ((p[2, 1] - p[0, 1]) * (xs - p[2, 0]) + (p[0, 0] - p[2, 0]) * (ys - p[2, 1])) / d
        l2 = 1 - l0 - l1
        inside = (l0 >= -0.02) & (l1 >= -0.02) & (l2 >= -0.02)
        yy, xx = ys[inside].astype(int), xs[inside].astype(int)
        tri_of[yy, xx] = ti
        bar[yy, xx] = np.stack([l0[inside], l1[inside], l2[inside]], 1)
    return tri_of, bar


tri_of, bar = raster(Fs, S)
cov = tri_of >= 0
ty, tx = np.where(cov)
tt = tri_of[cov]; bb = bar[cov].astype(np.float64)
interp = lambda A: (bb[:, :, None] * A[Fs[tt]]).sum(1) if A.ndim == 2 else (bb * A[Fs[tt]]).sum(1)
X = interp(Pg)
N = interp(Ng); N /= np.linalg.norm(N, axis=1, keepdims=True)
print(f"[tex] raster {S}^2: {cov.mean():.3f} covered ({time.time() - t0:.0f} s)", flush=True)


def to_img(vals, fill=0.0, ch=None):
    out = np.full((S, S) + (() if vals.ndim == 1 else (vals.shape[1],)), fill, np.float64)
    out[ty, tx] = vals
    return out


def dilate(img, mask, iters=None):
    """Fill uncovered texels from the nearest covered one (padding, so mips and seams do not bleed background)."""
    _, (iy, ix) = distance_transform_edt(~mask, return_indices=True)
    return img[iy, ix]


# ---------------------------------------------------------------- projection
VIEWS = {"front": 1.0, "q45_left": 0.75, "q45_right": 0.75, "profile90_left": 0.45, "profile90_right": 0.45}
s2l = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
l2s = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
# faces that can occlude: the whole GNM face (skin + interior) in the GNM frame
Focc = F


def zbuffer(cam, h, w):
    R = Rot.from_rotvec(cam[:3]).as_matrix()
    Y = Pg @ R.T
    u = cam[3] * Y[:, 0] + cam[4]; v = -cam[3] * Y[:, 1] + cam[5]; z = Y[:, 2]
    zb = np.full((h, w), -np.inf)
    for f in Focc:
        uu, vv, zz = u[f], v[f], z[f]
        x0, x1 = int(max(np.floor(uu.min()), 0)), int(min(np.ceil(uu.max()), w - 1))
        y0, y1 = int(max(np.floor(vv.min()), 0)), int(min(np.ceil(vv.max()), h - 1))
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        d = (vv[1] - vv[2]) * (uu[0] - uu[2]) + (uu[2] - uu[1]) * (vv[0] - vv[2])
        if abs(d) < 1e-9:
            continue
        l0 = ((vv[1] - vv[2]) * (xs - uu[2]) + (uu[2] - uu[1]) * (ys - vv[2])) / d
        l1 = ((vv[2] - vv[0]) * (xs - uu[2]) + (uu[0] - uu[2]) * (ys - vv[2])) / d
        l2 = 1 - l0 - l1
        ins = (l0 >= 0) & (l1 >= 0) & (l2 >= 0)
        if not ins.any():
            continue
        zi = l0 * zz[0] + l1 * zz[1] + l2 * zz[2]
        cur = zb[ys[ins], xs[ins]]
        zb[ys[ins], xs[ins]] = np.maximum(cur, zi[ins])
    return zb, R


acc = np.zeros((len(X), 3)); wsum = np.zeros(len(X))
per_view = {}
for vname, prior in VIEWS.items():
    cam = np.array(fit["cameras"][vname])
    im = np.asarray(Image.open(os.path.join(REFD, f"{vname}.png")).convert("RGB")).astype(np.float64) / 255
    h, w, _ = im.shape
    zb, R = zbuffer(cam, h, w)
    Y = X @ R.T
    u = cam[3] * Y[:, 0] + cam[4]; v = -cam[3] * Y[:, 1] + cam[5]
    inb = (u >= 1) & (u < w - 2) & (v >= 1) & (v < h - 2)
    zt = np.full(len(X), -np.inf)
    zt[inb] = map_coordinates(np.where(np.isinf(zb), -1e3, zb), [v[inb], u[inb]], order=0)
    vis = inb & (Y[:, 2] >= zt - 0.0015)
    facing = np.clip((N @ R.T)[:, 2], 0, 1)
    wv = vis * facing ** 4 * prior
    lin = s2l(im)
    col = np.stack([map_coordinates(lin[:, :, c], [v, u], order=1, mode="nearest") for c in range(3)], 1)
    # the kurti (teal) is never skin: those samples get no weight and are filled from the skin around them
    hue = np.degrees(np.arctan2(np.sqrt(3) * (col[:, 1] - col[:, 2]), 2 * col[:, 0] - col[:, 1] - col[:, 2])) % 360
    chroma = col.max(1) - col.min(1)
    cs = l2s(col)                                           # saturation judged in sRGB (in linear light skin reads 0.75)
    sat = (cs.max(1) - cs.min(1)) / np.maximum(cs.max(1), 1e-6)
    cloth = ((hue > 150) & (hue < 260) & (chroma > 0.02)) | (sat > 0.78)      # the kurti and its orange piping
    # image-space exclusions, dilated (bilinear samples at a line's edge are mixed): the orange piping below the chin
    # (hue 8-45, saturation > 0.62; it had printed an orange necklace line on the neck, rendered), and eye whites and
    # highlights anywhere (bright, saturation < 0.22; a 3/4 view's sclera had landed on the left upper lid, rendered)
    from scipy.ndimage import binary_dilation
    ih = np.degrees(np.arctan2(np.sqrt(3) * (im[..., 1] - im[..., 2]), 2 * im[..., 0] - im[..., 1] - im[..., 2])) % 360
    imx = im.max(2); isat = (imx - im.min(2)) / np.maximum(imx, 1e-6)
    lmv = np.array(LM_[vname]["lm"]); chin_y = lmv[152, 1] + 0.1 * np.linalg.norm(lmv[33, :2] - lmv[263, :2])
    rows = np.arange(h)[:, None] > chin_y
    pipe = binary_dilation((ih > 8) & (ih < 45) & (isat > 0.62) & (imx > 0.35) & rows, iterations=4)
    white = binary_dilation((isat < 0.22) & (imx > 0.55), iterations=2)
    excl = map_coordinates((pipe | white).astype(float), [v, u], order=0) > 0.5
    per_view.setdefault(vname + ":excludedSamples", int((excl & vis).sum()))
    wv = wv * ~cloth * ~excl
    acc += col * wv[:, None]; wsum += wv
    per_view[vname] = {"texelsVisible": int(vis.sum()), "meanWeight": round(float(wv[vis].mean()) if vis.any() else 0, 3)}
    print(f"[tex] view {vname}: visible {vis.mean():.3f} ({time.time() - t0:.0f} s)", flush=True)
seen = wsum > 1e-3
alb = np.zeros((len(X), 3)); alb[seen] = acc[seen] / wsum[seen, None]

# mild flattening of the portraits' large-scale shading (half strength), in 3D, over the seen texels
lum = alb @ np.array([0.2126, 0.7152, 0.0722])
Lfront = np.clip(0.55 + 0.45 * N[:, 2], 0.2, 1)               # the soft frontal light the portraits were shot under
shade_term = np.clip(Lfront[seen] / np.median(Lfront[seen]), 0.5, 1.5)
alb[seen] = alb[seen] / (shade_term ** 0.5)[:, None]
# eye-socket skin (inner lid rim): never the projected sclera
sock = interp(grp("eye_sockets").astype(float)) > 0.5
alb[sock] = s2l(np.array([0.42, 0.24, 0.22]))
# fill the unseen texels (back of the neck under the hair, deep inside the ears) by diffusion from the seen ones
img = to_img(alb)
known = to_img(seen.astype(float)) > 0.5
filled = dilate(img, known)
for _ in range(3):
    filled = np.where(known[:, :, None], img, gaussian_filter(filled, (6, 6, 0)))
gain = np.array(LOOK["skin"].get("albedoGain", [1, 1, 1]))
albedo = np.clip(filled * gain, 0, 1)
albedo = dilate(albedo, cov)
Image.fromarray((l2s(albedo) * 255 + 0.5).astype(np.uint8)).save(os.path.join(TX, "skin_albedo_H.png"))
Image.fromarray((l2s(albedo) * 255 + 0.5).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS).save(os.path.join(TX, "skin_albedo.png"))

# ---------------------------------------------------------------- detail from the portrait: high-pass luminance
lum_img = (filled @ np.array([0.2126, 0.7152, 0.0722]))
hp = lum_img - gaussian_filter(lum_img, 3.0)
hp = np.where(cov, hp, 0) / max(1e-6, np.percentile(np.abs(hp[cov]), 99))
rng = np.random.default_rng(7)
# no random pore noise: on H the runtime micro tile adds the pores; random texel noise also cost 2.2 MB of UASTC (measured)
height = gaussian_filter(np.clip(hp, -1, 1), 0.7) * 0.6
mask_lips = to_img(interp((grp("upper_lip_region") | grp("lower_lip_region")).astype(float))) > 0.5
height = np.where(mask_lips, height * 0.4, height)


def height_to_normal(hm, k):
    gy, gx = np.gradient(hm)
    n = np.stack([-gx * k, -gy * k, np.ones_like(hm)], 2)
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return n


nrm = height_to_normal(height, 0.9)
Image.fromarray(((nrm * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)).save(os.path.join(TX, "skin_normal.png"))

# ---------------------------------------------------------------- packed: cavity, roughness, thickness, AO
cav = np.clip(1.0 + np.minimum(hp, 0) * 0.5, 0.4, 1.0)
regions = lambda *names: to_img(interp(np.any([grp(n) for n in names], 0).astype(float)))
tz = regions("forehead_region", "nose_region", "middle_brow_region", "chin_region")
rough = 0.52 - 0.10 * tz
rough = np.where(mask_lips, 0.32, rough)
thick = np.clip(regions("ears") * 1.0 + regions("nose_region") * 0.35 + regions("left_orbital_region", "right_orbital_region") * 0.4, 0, 1)
# AO: 16-ray hemisphere casts from 2500 sampled skin vertices against a decimated occluder (every face triangle of the
# face mesh within 6 cm), interpolated to all texels by nearest sample
skin_v = np.where(REG == 0)[0]
smp = np.random.default_rng(3).choice(skin_v, min(2500, len(skin_v)), replace=False)
dirs = []
gr = (1 + 5 ** 0.5) / 2
for i in range(16):
    z = (i + 0.5) / 16; r = np.sqrt(1 - z * z); ph = 2 * np.pi * i / gr
    dirs.append([r * np.cos(ph), r * np.sin(ph), z])
dirs = np.array(dirs)
ao_s = np.zeros(len(smp))
occF = F[::2]
for k, vi in enumerate(smp):
    n = Ng[vi]; t = np.cross(n, [0, 1, 0] if abs(n[1]) < 0.9 else [1, 0, 0]); t /= np.linalg.norm(t); b = np.cross(n, t)
    D = dirs @ np.stack([t, b, n])
    cen = Pg[occF].mean(1)
    near = np.linalg.norm(cen - Pg[vi], axis=1) < 0.06
    hits = geom.seg_hits(np.repeat(Pg[vi][None] + n * 0.0005, 16, 0), Pg[vi][None] + D * 0.06, Pg, occF[near], chunk=16)
    ao_s[k] = 1 - hits.mean()
_, nn = cKDTree(Pg[smp]).query(X)
ao = to_img(np.clip(ao_s[nn], 0.25, 1.0), 1.0)
ao = gaussian_filter(ao, 4)
packed = np.stack([cav, rough, thick, ao], 2)
packed = dilate(packed, cov)
Image.fromarray((np.clip(packed, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA").save(os.path.join(TX, "skin_packed.png"))
print(f"[tex] packed ({time.time() - t0:.0f} s)", flush=True)

# ---------------------------------------------------------------- wrinkle masks and the compress map (GNM regions)
C = G.mp_correspondence()
MP = {int(k): int(v) for k, v in zip(C["landmarks"], C["vertices"])}
lm = lambda i: Vg[MP[i]]
gauss = lambda c, sig: np.exp(-np.sum((X - c) ** 2, 1) / (2 * sig ** 2))
forehead = interp(grp("forehead_region").astype(float))
glabella = interp(grp("middle_brow_region").astype(float))
crowL = gauss(lm(263) + np.array([0.008, 0, -0.004]), 0.008); crowR = gauss(lm(33) + np.array([-0.008, 0, -0.004]), 0.008)


def seg_mask(p0, p1, sig):
    d = p1 - p0; t_ = np.clip(((X - p0) @ d) / (d @ d), 0, 1)
    return np.exp(-np.sum((X - (p0 + t_[:, None] * d)) ** 2, 1) / (2 * sig ** 2))


nasoL = seg_mask(lm(358), lm(291) + np.array([0.004, -0.004, 0]), 0.004)
nasoR = seg_mask(lm(129), lm(61) + np.array([-0.004, -0.004, 0]), 0.004)
chin = interp(grp("chin_region").astype(float))
neck = np.clip((lm(152)[1] - 0.02 - X[:, 1]) / 0.02, 0, 1) * (X[:, 2] > 0.02)
mA = np.stack([forehead, glabella, crowL, crowR], 1); mB = np.stack([nasoL, nasoR, chin * 0.0, neck], 1)   # gnm: no chin wrinkle (see the compress map)
for nm, M_ in (("skin_maskA.png", mA), ("skin_maskB.png", mB)):
    im_ = dilate(gaussian_filter(to_img(np.clip(M_, 0, 1)), (3, 3, 0)), cov)
    Image.fromarray((np.clip(im_, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA").save(os.path.join(TX, nm))
# compress creases as a height field in 3D -> texels: forehead horizontal lines, glabella vertical, crow's feet radial,
# nasolabial and chin folds; amplitude in normal-map units
eL, eR = lm(263), lm(33)
# gnm: soft and few (the first build's even sine stripes read as a ribbed forehead and a barred glabella, rendered):
# three forehead lines that fade toward the temples, two glabella furrows, faint crow's feet, the nasolabial fold;
# nothing on the chin (it showed as a pale patch under mouthShrugLower)
fy = (X[:, 1] - lm(9)[1])                                   # height above the brow midpoint
fh = sum(np.exp(-((fy - o) / 0.0016) ** 2) for o in (0.012, 0.020, 0.028)) * np.exp(-(X[:, 0] / 0.035) ** 2)
gl = sum(np.exp(-((X[:, 0] - o) / 0.0012) ** 2) for o in (-0.005, 0.005))
cfL = np.cos(np.arctan2(X[:, 1] - eL[1], X[:, 0] - eL[0]) * 5) ** 8; cfR = np.cos(np.arctan2(X[:, 1] - eR[1], X[:, 0] - eR[0]) * 5) ** 8
hw = -(forehead * fh * 0.5 + glabella * gl * 0.5 + crowL * cfL * 0.3 + crowR * cfR * 0.3 + (nasoL + nasoR) * 0.6)
hwi = gaussian_filter(to_img(hw), 2.0)
wr = height_to_normal(hwi, 3.0)
Image.fromarray(((dilate(wr, cov) * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)).save(os.path.join(TX, "skin_wrinkle.png"))
flat = np.zeros((1024, 1024, 3), np.uint8); flat[:] = (128, 128, 255)
Image.fromarray(flat).save(os.path.join(TX, "skin_wrinkle_stretch.png"))

# ---------------------------------------------------------------- detail: fuzz, SSS tint, moisture, micro strength
fuzz = np.clip(regions("left_cheek_region", "right_cheek_region", "forehead_region", "left_zygomatic_region", "right_zygomatic_region") * 0.7 + 0.2, 0, 1)
fuzz = np.where(mask_lips, 0, fuzz)
sss = np.clip(regions("ears") + regions("nose_region") * 0.6 + mask_lips * 0.8 + 0.3, 0, 1)
lidm = gaussian_filter(regions("eye_sockets"), 3) * 2
wet = np.clip(mask_lips * 0.9 + lidm, 0, 1)
micro = np.where(mask_lips, 0.1, 0.9)
det = dilate(np.stack([fuzz, sss, wet, micro], 2), cov)
Image.fromarray((np.clip(det, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA").save(os.path.join(TX, "skin_detail.png"))
for f in ("hair_atlas.png", "cards_atlas.png", "garment_albedo.png", "skin_micro.png"):
    shutil.copy(os.path.join(G.CH, "bakeoff-pv3", "teal", "tex", f), os.path.join(TX, f))
rep = {"method": __doc__.split("\n")[0], "date": time.strftime("%Y-%m-%d"), "size": S, "covered": round(float(cov.mean()), 3),
       "seenByAView": round(float(seen.mean()), 3), "views": per_view, "albedoGain": gain.tolist(), "seconds": round(time.time() - t0)}
json.dump(rep, open(os.path.join(TX, "tex.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))
