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
ap.add_argument("--look", default="teal")
a = ap.parse_args()
t0 = time.time()
LOOK_ = G.look_from_argv(); PTH = G.paths(LOOK_)
BD = PTH["BD"]
TX = os.path.join(BD, "tex")
os.makedirs(TX, exist_ok=True)
REFD = PTH["REFD"]
LOOK = json.load(open(PTH["LOOK"]))
LM_ = json.load(open(os.path.join(REFD, "landmarks.json")))
_C0 = G.mp_correspondence(); MP_ = {int(k): int(v) for k, v in zip(_C0["landmarks"], _C0["vertices"])}
fit = json.load(open(PTH["FIT"]))
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
LIPBROW = interp((grp("upper_lip_region") | grp("lower_lip_region") | grp("left_brow_region") | grp("right_brow_region")
                  | grp("middle_brow_region") | grp("eye_sockets")).astype(float)) > 0.3
# AO first (the albedo de-shading divides by it): 16-ray hemisphere casts from 2500 sampled skin vertices against the
# face (every other triangle within 6 cm), nearest-sample to the texels
skin_v = np.where(REG == 0)[0]
smp = np.random.default_rng(3).choice(skin_v, min(2500, len(skin_v)), replace=False)
_dirs = []
_gr = (1 + 5 ** 0.5) / 2
for i in range(16):
    z = (i + 0.5) / 16; r = np.sqrt(1 - z * z); ph = 2 * np.pi * i / _gr
    _dirs.append([r * np.cos(ph), r * np.sin(ph), z])
_dirs = np.array(_dirs)
ao_s = np.zeros(len(smp))
occF = F[::2]
_cen = Pg[occF].mean(1)
for k, vi in enumerate(smp):
    n = Ng[vi]; t = np.cross(n, [0, 1, 0] if abs(n[1]) < 0.9 else [1, 0, 0]); t /= np.linalg.norm(t); b = np.cross(n, t)
    D = _dirs @ np.stack([t, b, n])
    near = np.linalg.norm(_cen - Pg[vi], axis=1) < 0.06
    hits = geom.seg_hits(np.repeat(Pg[vi][None] + n * 0.0005, 16, 0), Pg[vi][None] + D * 0.06, Pg, occF[near], chunk=16)
    ao_s[k] = 1 - hits.mean()
_, _nnao = cKDTree(Pg[smp]).query(X)
ao_t = np.clip(ao_s[_nnao], 0.25, 1.0)                     # per texel
print(f"[tex] AO ({time.time() - t0:.0f} s)", flush=True)
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
    # round 2 (slate / plum): anything outside skin's hue band is cloth (teal kurti, slate-blue shirt, plum saree); the
    # lips (hue 345-15) stay in
    # (the saturation test needs some brightness: near-black brow hair reads saturation > 0.78 in sRGB, and the rule had
    # erased slate's brows from his albedo, so curious / concerned had no brows to read)
    cloth = ((hue > 55) & (hue < 345) & (chroma > 0.02)) | ((sat > 0.78) & (cs.max(1) > 0.3))
    # image-space exclusions, dilated (bilinear samples at a line's edge are mixed): the orange piping below the chin
    # (hue 8-45, saturation > 0.62; it had printed an orange necklace line on the neck, rendered), and eye whites and
    # highlights anywhere (bright, saturation < 0.22; a 3/4 view's sclera had landed on the left upper lid, rendered)
    from scipy.ndimage import binary_dilation
    ih = np.degrees(np.arctan2(np.sqrt(3) * (im[..., 1] - im[..., 2]), 2 * im[..., 0] - im[..., 1] - im[..., 2])) % 360
    imx = im.max(2); isat = (imx - im.min(2)) / np.maximum(imx, 1e-6)
    if LM_.get(vname):
        lmv = np.array(LM_[vname]["lm"]); chin_y = lmv[152, 1] + 0.1 * np.linalg.norm(lmv[33, :2] - lmv[263, :2])
    else:                                                    # no MediaPipe face on this profile: from the model
        cy = (np.array([[0, 0, 0]]) if False else None)
        chin_g = Vg[MP_[152]] @ R.T; chin_y = -cam[3] * chin_g[1] + cam[5] + 20
    rows = np.arange(h)[:, None] > chin_y
    pipe = binary_dilation((ih > 8) & (ih < 45) & (isat > 0.62) & (imx > 0.35) & rows, iterations=4)
    white = binary_dilation((isat < 0.22) & (imx > 0.55), iterations=2)
    excl = map_coordinates((pipe | white).astype(float), [v, u], order=0) > 0.5
    per_view.setdefault(vname + ":excludedSamples", int((excl & vis).sum()))
    wv = wv * ~cloth * ~excl
    # gnm round 2: de-light THIS view before blending. The portrait's light is fitted as 2nd-order spherical harmonics
    # of the surface normal (in the camera frame) to the luminance of the skin samples (robust: Huber IRLS, lips,
    # brows and hair left out by a luminance window), and divided out; a view's shading never reaches the albedo
    lumv = col @ np.array([0.2126, 0.7152, 0.0722])
    nc = N @ R.T
    Ysh = np.stack([np.ones(len(nc)), nc[:, 0], nc[:, 1], nc[:, 2], nc[:, 0] * nc[:, 1], nc[:, 1] * nc[:, 2], nc[:, 0] * nc[:, 2],
                    nc[:, 0] ** 2 - nc[:, 1] ** 2, 3 * nc[:, 2] ** 2 - 1], 1)
    skin_s = (wv > 0.05) & ~LIPBROW & (lumv > 0.35 * np.median(lumv[wv > 0.05])) & (lumv < 2.5 * np.median(lumv[wv > 0.05]))
    rw = np.ones(skin_s.sum())
    for _ in range(6):
        A_ = Ysh[skin_s] * rw[:, None]; c_ = np.linalg.lstsq(A_, lumv[skin_s] * rw, rcond=None)[0]
        res_ = lumv[skin_s] - Ysh[skin_s] @ c_
        sc_ = 1.4826 * np.median(np.abs(res_)) + 1e-6
        rw = np.sqrt(np.minimum(1.0, 1.5 * sc_ / np.maximum(np.abs(res_), 1e-9)))
    shade = np.clip(Ysh @ c_, 1e-3, None)
    shade = np.clip(shade / np.median(shade[skin_s]), 0.45, 1.8)
    col = col / shade[:, None]
    # below the chin, a sample far darker than the view's skin is the collar's cast shadow or dark cloth (slate's shirt
    # collar printed a near-black blot on the front neck, rendered): no weight, filled from the skin around it
    dark_neck = (v > chin_y) & (lumv / shade < 0.5 * np.median(lumv[skin_s]))
    wv = wv * ~dark_neck
    per_view.setdefault(vname + ":darkNeckSamples", int((dark_neck & vis).sum()))
    per_view.setdefault("sh", {})[vname] = np.round(c_, 4).tolist()
    acc += col * wv[:, None]; wsum += wv
    per_view[vname] = {"texelsVisible": int(vis.sum()), "meanWeight": round(float(wv[vis].mean()) if vis.any() else 0, 3)}
    print(f"[tex] view {vname}: visible {vis.mean():.3f} ({time.time() - t0:.0f} s)", flush=True)
seen = wsum > 1e-3
alb = np.zeros((len(X), 3)); alb[seen] = acc[seen] / wsum[seen, None]

# gnm round 2 de-lighting, after the per-view SH division:
#  (a) symmetric lighting: the face's albedo is near mirror-symmetric, its light is not; the low-frequency luminance
#      (12 mm 3D blur) divided by its mirror-symmetric version (GNM's topological mirror) is the left/right light
#      gradient, divided out;
#  (b) ambient occlusion: soft studio light still darkens what the face shades from itself (sockets, nasolabial, under
#      the chin): divided by AO^0.6, the shader multiplies the real AO back in at render;
#  (c) the under-eye band (12 mm below each eye centre, sigma 7 mm) lifted 70 % of the way to the surrounding cheek;
#  (d) frequency split in log space: the low band (identity colour) kept, the high band (pore grain, compression
#      noise) at 0.45: H's runtime micro tile is the micro-detail fallback
lum_of = lambda A: A @ np.array([0.2126, 0.7152, 0.0722])
from scipy.sparse import coo_matrix


def blur3d(vals, sig, mask=None, n=40000):
    """Gaussian blur of a per-texel field over 3D distance (sampled kernel, nearest-sample back to texels)."""
    m_ = np.ones(len(X), bool) if mask is None else mask
    idx = np.where(m_)[0]
    sub_ = idx[np.random.default_rng(5).choice(len(idx), min(n, len(idx)), replace=False)]
    tr = cKDTree(X[sub_])
    out_ = np.zeros((len(sub_),) + vals.shape[1:]); wt = np.zeros(len(sub_))
    pairs = tr.query_pairs(2.5 * sig, output_type="ndarray")
    d = np.linalg.norm(X[sub_][pairs[:, 0]] - X[sub_][pairs[:, 1]], axis=1); w_ = np.exp(-d ** 2 / (2 * sig ** 2))
    Wm = coo_matrix((np.r_[w_, w_, np.ones(len(sub_))], (np.r_[pairs[:, 0], pairs[:, 1], np.arange(len(sub_))],
                                                         np.r_[pairs[:, 1], pairs[:, 0], np.arange(len(sub_))])), shape=(len(sub_),) * 2).tocsr()
    v_ = vals[sub_]
    out_ = (Wm @ v_) / np.asarray(Wm.sum(1)).reshape((-1,) + (1,) * (v_.ndim - 1))
    _, nn_ = tr.query(X)
    return out_[nn_]


lum = lum_of(alb)
lowL = np.where(seen, lum, np.nan)
seenf = seen.astype(float)
lowL = blur3d(np.where(seen, lum, 0.0), 0.012) / np.maximum(blur3d(seenf, 0.012), 1e-3)
# mirror: each texel's mirror point = its GNM source vertex's mirror twin (nearest texel to that 3D point)
src_t = cKDTree(Vg).query(X)[1]
mir_pt = Vg[m.mirror[src_t]] + (X - Vg[src_t]) * np.array([-1, 1, 1])
mir_idx = cKDTree(X).query(mir_pt)[1]
sym = 0.5 * (lowL + lowL[mir_idx])
asym = np.clip(lowL / np.maximum(sym, 1e-4), 0.7, 1.4)
alb[seen] = alb[seen] / asym[seen, None]
alb[seen] = alb[seen] / (ao_t[seen] ** 0.6)[:, None]
# (c) under-eye band
eyeLc, eyeRc = m.joints(np.array(fit["identity"]))[2], m.joints(np.array(fit["identity"]))[3]
front_t = (N[:, 2] > 0.3) & (X[:, 2] > eyeLc[2])           # the face's front surface (masks by x, y distance)
xy = lambda c, dy, sg: np.exp(-((X[:, 0] - c[0]) ** 2 + (X[:, 1] - (c[1] + dy)) ** 2) / (2 * sg ** 2)) * front_t
band = np.clip(sum(xy(ec, -0.012, 0.007) for ec in (eyeLc, eyeRc)), 0, 1) * ~LIPBROW
cheek = sum(xy(ec, -0.030, 0.008) for ec in (eyeLc, eyeRc)) > 0.5
lum2 = lum_of(alb)
low2 = blur3d(np.where(seen, lum2, 0.0), 0.004) / np.maximum(blur3d(seenf, 0.004), 1e-3)
target = np.median(lum2[cheek & seen])
lift = np.clip(target / np.maximum(low2, 1e-4), 1.0, 1.45)
alb = alb * (1 + 0.7 * band * (lift - 1))[:, None]
per_view["underEyeLiftMax"] = round(float((1 + 0.7 * band * (lift - 1)).max()), 3)
# eye-socket skin (inner lid rim): never the projected sclera
sock = interp(grp("eye_sockets").astype(float)) > 0.5
alb[sock] = s2l(np.array([0.42, 0.24, 0.22]))
# scalp the portraits never saw (the crown above the hairline): the hair's own colour, not a diffusion of forehead
# skin (that grey-beige fill was the pale band at the hairline in chin-down poses, rendered)
top10 = Vg[MP_[10]]
hairish = seen & (lum_of(alb) < 0.35 * np.median(lum_of(alb)[seen])) & (X[:, 1] > top10[1] - 0.01)
hair_col = np.median(alb[hairish], 0) if hairish.sum() > 50 else s2l(np.array([0.10, 0.08, 0.07]))
# "unseen" here includes texels seen only at grazing angles (total weight < 0.08): the front portrait saw the top of
# the forehead edge-on and smeared the hairline into it
scalp_unseen = (wsum < 0.08) & (X[:, 1] > top10[1] - 0.004) & (X[:, 2] < top10[2] + 0.002)
alb[scalp_unseen] = hair_col
# hair SHEEN the portraits did see: at and above the hairline, a slicked-back head (plum) shows its hair as a grey-blue
# highlight, which projected and de-lit into a pale grey band over the forehead top (rendered). Above MP-10 minus 1 cm,
# any texel that is not skin-coloured (sRGB saturation < 0.28, or hue outside skin's 0-55 band) is hair: the hair colour
cs_ = l2s(np.clip(alb, 0, 1)); sat_ = (cs_.max(1) - cs_.min(1)) / np.maximum(cs_.max(1), 1e-6)
hue_ = np.degrees(np.arctan2(np.sqrt(3) * (alb[:, 1] - alb[:, 2]), 2 * alb[:, 0] - alb[:, 1] - alb[:, 2])) % 360
sheen = seen & ~scalp_unseen & (X[:, 1] > top10[1] - 0.01) & (X[:, 2] < top10[2] + 0.002) & ((sat_ < 0.28) | ((hue_ > 55) & (hue_ < 345)))
alb[sheen] = hair_col
per_view["hairSheenToHair"] = int(sheen.sum())
seen = seen | scalp_unseen
per_view["scalpFilledWithHair"] = int(scalp_unseen.sum())
# (d) frequency split + the fill of unseen texels (normalised convolution: a smooth, tone-matched continuation; the
# old nearest-texel dilation left a lighter U where the piping was removed)
img = to_img(alb)
known = to_img(seen.astype(float)) > 0.5
logi = np.log(np.maximum(img, 1e-4))
num = gaussian_filter(np.where(known[:, :, None], logi, 0), (14, 14, 0)); den = gaussian_filter(known.astype(float), 14)[:, :, None]
fillv = num / np.maximum(den, 1e-4)
for sg in (40, 90):
    n2 = gaussian_filter(np.where(known[:, :, None], logi, 0), (sg, sg, 0)); d2 = gaussian_filter(known.astype(float), sg)[:, :, None]
    fillv = np.where(den < 0.05, n2 / np.maximum(d2, 1e-4), fillv)
    den = np.maximum(den, d2)
logf = np.where(known[:, :, None], logi, fillv)
low = gaussian_filter(logf, (5, 5, 0))
logf = low + 0.45 * (logf - low)
filled = np.exp(logf)
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
height = gaussian_filter(np.clip(hp, -1, 1), 1.2) * 0.25      # gnm round 2: 0.6 -> 0.25, blur 0.7 -> 1.2 (the orange-peel grain)
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
rough = 0.60 - 0.10 * tz      # round 2: 0.52 -> 0.60 (the de-lit, smoother albedo read oily under the key light)
rough = np.where(mask_lips, 0.32, rough)
thick = np.clip(regions("ears") * 1.0 + regions("nose_region") * 0.35 + regions("left_orbital_region", "right_orbital_region") * 0.4, 0, 1)
ao = to_img(ao_t, 1.0)
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
mA = np.stack([forehead, glabella * 0.0, crowL, crowR], 1); mB = np.stack([nasoL, nasoR, chin * 0.0, neck], 1)   # gnm: no chin wrinkle (see the compress map)
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
# round 2: no glabella furrows in the map (with the knit they rendered as a pale raised wedge between the brows; the
# knit itself is geometry, from GNM's brow components), forehead lines at 0.35
hw = -(forehead * fh * 0.35 + crowL * cfL * 0.3 + crowR * cfR * 0.3 + (nasoL + nasoR) * 0.6)
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
vermilion = to_img(interp((grp("upper_lip") | grp("lower_lip")).astype(float))) > 0.5
wet = np.clip(vermilion * 0.9 + lidm, 0, 1)      # round 2: the vermilion only (the lip REGIONS put a wet glint beside the nose)
micro = np.where(mask_lips, 0.1, 0.9)
det = dilate(np.stack([fuzz, sss, wet, micro], 2), cov)
Image.fromarray((np.clip(det, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA").save(os.path.join(TX, "skin_detail.png"))
for f in ("hair_atlas.png", "cards_atlas.png", "garment_albedo.png", "skin_micro.png"):
    sf = os.path.join(PTH["SRCTEX"], f)
    if not os.path.exists(sf) and f == "skin_micro.png":   # iteration-2 builds have no micro map: the tileable teal one is look-free
        sf = os.path.join(G.CH, "bakeoff-pv3", "teal", "tex", f)
    shutil.copy(sf, os.path.join(TX, f))
rep = {"method": __doc__.split("\n")[0], "date": time.strftime("%Y-%m-%d"), "size": S, "covered": round(float(cov.mean()), 3),
       "seenByAView": round(float(seen.mean()), 3), "views": per_view, "albedoGain": gain.tolist(), "seconds": round(time.time() - t0)}
json.dump(rep, open(os.path.join(TX, "tex.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))
