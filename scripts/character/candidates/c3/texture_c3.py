"""c3 stage 1b: the VRM's own textures -> four atlases in the Taxila slots, with the look's recolour.

    python3 scripts/character/candidates/c3/texture_c3.py --look art/character/candidates/c3/look.json --build <dir>

The VRM Public License settings of the source allow modification ("allowModificationRedistribution"), so the recolour
edits the texels directly:
  - skin (face atlas + the neck/chest crop of the body atlas): VRoid's pale peach is moved to the look's Monk band in
    CIE L*a*b*, around the FACE texture's own median (one transform for face and body, so the neck seam matches), every
    painted shade and the blush kept relative to it; look.skin.albedoGain is the G9 render-solved trim;
  - eye whites slightly warmed and lowered (a pure-white sclera reads stark against MST 6 skin), iris re-tinted darker;
  - eyelines and brows pulled toward near-black brown;
  - hair: re-tinted to the look's hair colour by luminance (VRoid's painted strand shading kept);
  - top: the white T-shirt -> the look's kurta colour by luminance (painted folds kept), plus a contrasting neckline
    band painted along the collar seam.
Writes <build>/tex/{skin_albedo_H, skin_albedo, eye_albedo, hair_albedo, garment_albedo}.png and texture.json.
"""
import argparse, io, json, os, struct
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("--look", required=True)
ap.add_argument("--build", required=True)
ap.add_argument("--src", default=os.environ.get("C3_SRC", "/tmp/claude-0/char/c3/src"))
args = ap.parse_args()
L = json.load(open(args.look))
AT = json.load(open(os.path.join(args.build, "atlas.json")))
out = os.path.join(args.build, "tex")
os.makedirs(out, exist_ok=True)

# ------------------------------------------------------------------ the VRM's embedded PNGs, by image name
b = open(os.path.join(args.src, "VRM1_Constraint_Twist_Sample.vrm"), "rb").read()
jl = struct.unpack("<I", b[12:16])[0]
J = json.loads(b[20:20 + jl])
bin0 = 20 + jl + 8
IMG = {}
for im in J["images"]:
    bv = J["bufferViews"][im["bufferView"]]
    o = bin0 + bv.get("byteOffset", 0)
    IMG[im["name"]] = np.asarray(Image.open(io.BytesIO(b[o:o + bv["byteLength"]])).convert("RGB")).astype(np.float32) / 255


def s2l(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def l2s(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
WP = np.array([0.95047, 1.0, 1.08883])


def rgb2lab(rgb):
    xyz = s2l(rgb) @ M.T / WP
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def lab2rgb(lab):
    fy = (lab[..., 0] + 16) / 116
    fx, fz = fy + lab[..., 1] / 500, fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], -1)
    xyz = np.where(f > 0.206893, f ** 3, (f - 16 / 116) / 7.787) * WP
    return l2s(xyz @ np.linalg.inv(M).T)


def hex2rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def rs(a, w, h):
    return np.asarray(Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(np.float32) / 255


def save(a, name):
    Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(out, name))


# ------------------------------------------------------------------ 3D position maps (paint by where a texel sits)
PM = np.load(os.path.join(args.build, "posmap.npz"))


def posmap(uvt, pt, H_, W_):
    """rasterise triangles (source-texture UVs) into an (H, W, 3) map of rest-pose positions; NaN where uncovered."""
    out = np.full((H_, W_, 3), np.nan, np.float32)
    for uv, p in zip(uvt, pt):
        x = uv[:, 0] * W_ - 0.5
        y = (1 - uv[:, 1]) * H_ - 0.5
        x0, x1 = int(max(np.floor(x.min()), 0)), int(min(np.ceil(x.max()), W_ - 1))
        y0, y1 = int(max(np.floor(y.min()), 0)), int(min(np.ceil(y.max()), H_ - 1))
        if x1 < x0 or y1 < y0:
            continue
        gy, gx = np.mgrid[y0:y1 + 1, x0:x1 + 1]
        d = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
        if abs(d) < 1e-12:
            continue
        a = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / d
        b_ = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / d
        c_ = 1 - a - b_
        m = (a >= -0.02) & (b_ >= -0.02) & (c_ >= -0.02)
        pp = a[..., None] * p[0] + b_[..., None] * p[1] + c_[..., None] * p[2]
        sub = out[y0:y1 + 1, x0:x1 + 1]
        sub[m] = pp[m]
    return out


def lch(lab):
    return lab[..., 0], np.hypot(lab[..., 1], lab[..., 2]), np.degrees(np.arctan2(lab[..., 2], lab[..., 1]))


# ------------------------------------------------------------------ skin transform (face median -> MST target)
S = L["skin"]
face = IMG["Face_00"]
flab = rgb2lab(face)
fL, fC, fH = lch(flab)
skinm = (fL > 60)                                          # VRoid's face sheet is all skin except the drawn mouth line / nose
med = np.array([np.median(fL[skinm]), np.median(fC[skinm]), np.median(fH[skinm])])
tgt = rgb2lab(hex2rgb(S["mstHex"]))
tL, tC, tH = tgt[0], np.hypot(tgt[1], tgt[2]), np.degrees(np.arctan2(tgt[2], tgt[1]))


def skin_tf(img, keep_dark=True):
    lab = rgb2lab(img)
    Lc, C, H = lch(lab)
    Ln = tL + (Lc - med[0]) * S.get("lightSpread", 1.0)
    # blush: VRoid paints a pink cheek blush (higher a*); keep it at look.skin.blush of its original chroma excess
    Cn = tC + (C - med[1]) * S.get("blush", 0.5)
    Hn = tH + (H - med[2]) * 0.5
    labn = np.stack([Ln, Cn * np.cos(np.radians(Hn)), Cn * np.sin(np.radians(Hn))], -1)
    rgb = lab2rgb(labn)
    rgb = l2s(s2l(rgb) * np.array(S.get("albedoGain", [1, 1, 1]))[None, None])
    if keep_dark:                                           # drawn lines (mouth line, nose dot) stay drawn lines
        dark = np.clip((60 - Lc) / 15, 0, 1)[..., None]
        line = lab2rgb(np.stack([np.minimum(Lc, tL) * 0.55, labn[..., 1] * 0.8, labn[..., 2] * 0.8], -1))
        rgb = rgb * (1 - dark) + line * dark
    return rgb


face_rgb = skin_tf(face)
# lip tint (feature-animation convention: VRoid draws the mouth as one line; a soft rose-brown lower lip and a thinner
# upper lip make the mouth read at teacher distance without lipstick). Painted by 3D position around the mouth line.
FP = posmap(PM["face_uv"], PM["face_p"], face.shape[0], face.shape[1])
mc = PM["mouth"]
line_px = (fL < 70) & ~np.isnan(FP[..., 0]) & (np.abs(FP[..., 2] - mc[2]) < 0.006) & (np.abs(FP[..., 0]) < 0.03)
hw = float(np.abs(FP[line_px, 0]).max()) if line_px.any() else 0.009
LP = L.get("lips", {})
fx, fz = np.nan_to_num(FP[..., 0], nan=9), np.nan_to_num(FP[..., 2], nan=9)
low = np.exp(-((fx / (hw * LP.get("rx", 0.85))) ** 2 + ((fz - (mc[2] - LP.get("lowDz", 0.0026))) / LP.get("lowRz", 0.0022)) ** 2) ** 1.5)
upp = np.exp(-((fx / (hw * LP.get("rx", 0.85) * 0.95)) ** 2 + ((fz - (mc[2] + LP.get("upDz", 0.0012))) / LP.get("upRz", 0.0012)) ** 2) ** 1.5)
lipw = np.clip(low + 0.75 * upp, 0, 1) * LP.get("strength", 1.0)
lab_f = rgb2lab(face_rgb)
lab_f[..., 0] -= lipw * LP.get("darken", 7.0)
lab_f[..., 1] += lipw * LP.get("redden", 9.0)
lab_f[..., 2] -= lipw * 2.0
face_rgb = lab2rgb(lab_f)
body = IMG["Body_00"]
c = AT["crop"]["Body_00"]
bh, bw = body.shape[:2]
bcrop = body[int((1 - c[3]) * bh):int((1 - c[1]) * bh), int(c[0] * bw):int(c[2] * bw)]
body_rgb = skin_tf(bcrop, keep_dark=False)
blab = rgb2lab(bcrop)
# VRoid paints the underwear into the body sheet (black); none of it is visible above the neckline, flatten it to skin
und = (blab[..., 0] < 45).astype(np.float32)
und = np.asarray(Image.fromarray((und * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)[..., None] / 255
body_rgb = body_rgb * (1 - und) + lab2rgb(np.broadcast_to(np.array([tL, tgt[1], tgt[2]]), body_rgb.shape)) * und

# mouth interior: VRoid's salmon -> a deeper, less saturated rose; teeth slightly off-white
mouth = IMG["FaceMouth_00"].copy()
mlab = rgb2lab(mouth)
teeth = (mlab[..., 0] > 85)[..., None]
mlab2 = mlab.copy()
mlab2[..., 0] = mlab[..., 0] * 0.72
mlab2[..., 1] *= 0.85
mouth = np.where(teeth, mouth * np.array([0.93, 0.9, 0.84]), lab2rgb(mlab2))

white = IMG["EyeWhite_00"] * np.array([0.93, 0.9, 0.86])
line = IMG["FaceEyeline_00"]
llab = rgb2lab(line)
llab[..., 0] *= 0.75
llab[..., 1:] *= 0.6
line = lab2rgb(llab)
brow = IMG["FaceBrow_00"]
hc = hex2rgb(L["hair"]["color"])
blum = brow @ np.array([0.3, 0.59, 0.11])
brow = np.clip(hc[None, None] * 1.25 * (blum / np.median(blum))[..., None], 0, 1)

# ------------------------------------------------------------------ face atlas 2048^2 (v up -> image rows from the top)
A = np.zeros((2048, 2048, 3), np.float32) + lab2rgb(np.array([tL, tgt[1], tgt[2]]))
def place(atlas, img, tile):
    H_, W_ = atlas.shape[:2]
    u0, v0, su, sv = tile
    x0, x1 = int(round(u0 * W_)), int(round((u0 + su) * W_))
    y0, y1 = int(round((1 - v0 - sv) * H_)), int(round((1 - v0) * H_))
    atlas[y0:y1, x0:x1] = rs(img, x1 - x0, y1 - y0)
T = AT["tile"]
place(A, face_rgb, T["Face_00"]); place(A, body_rgb, T["Body_00"]); place(A, mouth, T["FaceMouth_00"])
place(A, white, T["EyeWhite_00"]); place(A, line, T["FaceEyeline_00"]); place(A, brow, T["FaceBrow_00"])
save(A, "skin_albedo_H.png")
save(rs(A, 1024, 1024), "skin_albedo.png")

# ------------------------------------------------------------------ eyes atlas 1024^2: iris top, highlight bottom
iris = IMG["EyeIris_00"]
ilab = rgb2lab(iris)
it = rgb2lab(hex2rgb(L["eyes"].get("irisTint", "#4A2C18")))
mask = (ilab[..., 0] > 8)
iL = ilab[..., 0]
ref = np.median(iL[mask])
ilab2 = np.stack([iL * (it[0] / ref) * 0.95, np.full_like(iL, it[1]) * np.clip(iL / ref, 0, 1.4), np.full_like(iL, it[2]) * np.clip(iL / ref, 0, 1.4)], -1)
iris2 = np.where(mask[..., None], lab2rgb(ilab2), iris)
E = np.zeros((1024, 1024, 3), np.float32)
place(E, iris2, T["EyeIris_00"]); place(E, IMG["EyeHighlight_00"], T["EyeHighlight_00"])
save(E, "eye_albedo.png")

# ------------------------------------------------------------------ hair atlas 1024^2: strands left, scalp cap right
def hair_tint(img):
    lum = img @ np.array([0.3, 0.59, 0.11])
    r = np.clip(lum / np.median(lum), 0.3, 1.8) ** L["hair"].get("contrast", 1.1)
    return np.clip(hc[None, None] * r[..., None], 0, 1)
Hh = np.zeros((1024, 1024, 3), np.float32)
place(Hh, hair_tint(IMG["Hair_00"]), T["Hair_00"]); place(Hh, hair_tint(IMG["HairBack_00"]), T["HairBack_00"])
save(Hh, "hair_albedo.png")

# ------------------------------------------------------------------ garment: crop of the top, recoloured
tops = IMG["Tops_01"]
c = AT["crop"]["Tops_01"]
th_, tw_ = tops.shape[:2]
tcrop = tops[int((1 - c[3]) * th_):int((1 - c[1]) * th_), int(c[0] * tw_):int(c[2] * tw_)]
G = L["garment"]
gl = tcrop @ np.array([0.3, 0.59, 0.11])
gc = hex2rgb(G["color"])
g = np.clip(gc[None, None] * (gl / np.median(gl))[..., None] ** 1.6, 0, 1)
# kurta neckline: a contrasting band along the collar opening and a short front placket, painted by 3D position
TP = posmap(PM["top_uv"], PM["top_p"], tops.shape[0], tops.shape[1])
TP = TP[int((1 - c[3]) * th_):int((1 - c[1]) * th_), int(c[0] * tw_):int(c[2] * tw_)]
tp = PM["top_p"].reshape(-1, 3)
# collar opening = boundary edges of the top near its highest point
tri = PM["top_p"]
from collections import Counter
ek = Counter()
for t in tri:
    for i in range(3):
        a_, b2 = tuple(np.round(t[i], 5)), tuple(np.round(t[(i + 1) % 3], 5))
        ek[(a_, b2) if a_ < b2 else (b2, a_)] += 1
# boundary edges, densified (point-to-point distance to the 36 loop vertices alone scalloped the band)
bnd = np.array([np.array(a_) + (np.array(b2) - np.array(a_)) * t for (a_, b2), n in ek.items() if n == 1 for t in np.linspace(0, 1, 12)])
zt = tp[:, 2].max()
collar = bnd[bnd[:, 2] > zt - 0.06] if len(bnd) else np.zeros((0, 3))
TR = L["garment"]
if len(collar) and TR.get("trim"):
    from scipy.spatial import cKDTree
    ok = ~np.isnan(TP[..., 0])
    dist = np.full(TP.shape[:2], 9.0)
    dist[ok] = cKDTree(collar).query(TP[ok])[0]
    band = 1 - np.clip((dist - TR.get("band", 0.007)) / 0.0015, 0, 1)
    zc = collar[collar[:, 1] < 0, 2].min() if (collar[:, 1] < 0).any() else collar[:, 2].min()
    px_, py_, pz_ = (np.nan_to_num(TP[..., i], nan=9) for i in range(3))
    plk = (1 - np.clip((np.abs(px_) - TR.get("placketHalf", 0.0045)) / 0.001, 0, 1)) * (pz_ > zc - TR.get("placketLen", 0.06)) * (pz_ < zc + 0.004) * (py_ < 0)
    tw = np.clip(np.maximum(band, plk), 0, 1)[..., None]
    trc = hex2rgb(TR["trim"])
    tcol = np.clip(trc[None, None] * (gl / np.median(gl))[..., None] ** 1.2, 0, 1)
    g = g * (1 - tw) + tcol * tw
    TRIM = {"collarPts": int(len(collar)), "trimTexelFrac": round(float((tw > 0.5).mean()), 4)}
else:
    TRIM = {"collarPts": int(len(collar))}
save(rs(g, 1024, 1024), "garment_albedo.png")

rep = {"skinMedianSrc_LCh": med.round(2).tolist(), "skinTarget_LCh": [round(float(tL), 2), round(float(tC), 2), round(float(tH), 2)],
       "bodyCrop": AT["crop"]["Body_00"], "topCrop": AT["crop"]["Tops_01"], "irisRefL": round(float(ref), 2), "lipHalfWidthMm": round(hw * 1000, 1), "trim": TRIM}
json.dump(rep, open(os.path.join(args.build, "texture.json"), "w"), indent=1)
print(json.dumps(rep))
