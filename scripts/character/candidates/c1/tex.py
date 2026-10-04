"""Candidate c1, stage 1b: the source's maps -> the TaxilaSkin / Eye / Hair / Cloth slots, re-toned to the brief.

    python3 scripts/character/candidates/c1/tex.py --tex <Rocketbox Textures dir> --build <dir> --look <look.json>

Re-tone (MIT permits modification; the licence notice travels in art/character/LICENSES.md):
  * skin: one linear per-channel gain (look.skin.albedoGain, solved against the RENDER by g9.mjs --solve, the same G9
    loop as the in-house looks) applied to every skin texel: the whole head atlas except the mouth-interior and eye
    islands, and the skin texels of the body atlas (V-neck, hands; luminance/hue mask). One gain everywhere, so the
    head/body seam at the neckline keeps its continuity and the photo detail (pores, lids, lips) is kept as authored;
  * garment: the brown knit dress keeps its own luminance detail (ribs, folds, shading) and takes the look's colour
    (a deep teal) in Lab: L* from the source (lifted so the knit reads), a*b* from the target hex;
  * eye: the source's photo iris island cropped to its own 512 px map (build.py remaps the eye UVs to it);
  * packed (R cavity, G roughness, B thickness, A AO): roughness from the source specular map, clamped to >= 0.42 like
    the in-house skin; cavity from the normal map's slope; AO 1 (the source albedo already carries its baked AO).
"""
import argparse, json, os
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--tex", required=True)
ap.add_argument("--build", required=True)
ap.add_argument("--look", required=True)
ap.add_argument("--face-from", default=None, help="another Rocketbox head atlas (same UV template) whose face oval is composited in")
a = ap.parse_args()
L = json.load(open(a.look))
st = json.load(open(os.path.join(a.build, "Bplus.stats.json")))
out = os.path.join(a.build, "tex")
os.makedirs(out, exist_ok=True)
rd = lambda n: np.asarray(Image.open(os.path.join(a.tex, n))).astype(np.float64) / 255.0
s2l = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
l2s = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)
save = lambda arr, n, mode="RGB": Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8), mode).save(os.path.join(out, n))
smooth = lambda e0, e1, x: (lambda t: t * t * (3 - 2 * t))(np.clip((x - e0) / (e1 - e0), 0, 1))
gain = np.array(L["skin"].get("albedoGain", [1, 1, 1]), np.float64)

def to_lab(rgb_lin):
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    X = rgb_lin @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    fx, fy, fz = f(X[..., 0]), f(X[..., 1]), f(X[..., 2])
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)


def from_lab(lab):
    fy = (lab[..., 0] + 16) / 116
    fx, fz = fy + lab[..., 1] / 500, fy - lab[..., 2] / 200
    finv = lambda t: np.where(t ** 3 > 0.008856, t ** 3, (t - 16 / 116) / 7.787)
    X = np.stack([finv(fx) * 0.95047, finv(fy), finv(fz) * 1.08883], -1)
    Mi = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]])
    return np.clip(X @ Mi.T, 0, 1)


def dilate(img, n=24):
    """Fill the atlas' pure-black background outward from every island (n px). The source atlases have no padding,
    so bilinear / mip samples at island borders pulled black in: the jagged dark collar at the nape (first look)."""
    img = img.copy()
    bad = img.sum(-1) < 0.012
    for _ in range(n):
        acc = np.zeros_like(img)
        cnt = np.zeros(img.shape[:2])
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ok = np.roll(~bad, (dy, dx), (0, 1))
            acc += np.roll(img, (dy, dx), (0, 1)) * ok[..., None]
            cnt += ok
        fill = bad & (cnt > 0)
        img[fill] = acc[fill] / cnt[fill][:, None]
        bad = bad & ~fill
        if not bad.any():
            break
    return img


# ------------------------------------------------------------------ head atlas
head = dilate(rd("f011_head_color.tga")[:, :, :3])
H_, W_ = head.shape[:2]
yy, xx = np.mgrid[0:H_, 0:W_]
if a.face_from:
    # c1 identity option: Rocketbox heads share one UV template (eyes, nose and mouth land on the same texels in every
    # atlas), so another character's photo face can be composited into this atlas' face oval. Colour-matched in linear
    # light on the cheeks first, so the global skin gain below treats both the same; feathered ellipse.
    f2 = np.asarray(Image.open(a.face_from)).astype(np.float64)[:, :, :3] / 255.0
    l1, l2 = s2l(head), s2l(f2)
    # the ratio is matched at the forehead AND the cheek and interpolated down the face (one cheek ratio left a light
    # forehead band at the top of the oval)
    rt = lambda sl: l1[sl].reshape(-1, 3).mean(0) / l2[sl].reshape(-1, 3).mean(0)
    r_fh, r_ck = rt((slice(470, 520), slice(960, 1090))), rt((slice(870, 930), slice(760, 840)))
    tt = np.clip((yy - 495) / (900 - 495), 0, 1)[..., None]
    l2 = l2 * (r_fh * (1 - tt) + r_ck * tt)
    d = np.sqrt(((xx - 1024) / 335.0) ** 2 + ((yy - 770) / 400.0) ** 2)
    m = (1 - smooth(0.80, 1.0, d))[..., None]
    head = l2s(l1 * (1 - m) + l2 * m)
    # the donor's eyelids carry a green-grey eyeshadow tint (no make-up beyond the skin band, TEACHER-VISUAL): above
    # the nose, texels greener than the face's median a* take the median chroma back, keeping their L*
    lab_h = to_lab(s2l(head))
    face_m = (m[..., 0] > 0.5) & (yy < 760)
    a_med, b_med = np.median(lab_h[face_m][:, 1]), np.median(lab_h[face_m][:, 2])
    # (polish pass) and the lilac half of the same shadow: texels bluer than the median b* by > 5
    g = np.clip(np.maximum((a_med - 3 - lab_h[..., 1]) / 6, (b_med - 5 - lab_h[..., 2]) / 6), 0, 1) * face_m * (yy > 520)
    lab_h[..., 1] = lab_h[..., 1] * (1 - g) + a_med * g
    lab_h[..., 2] = lab_h[..., 2] * (1 - g) + b_med * g
    head = l2s(from_lab(lab_h))
u, v = (xx + 0.5) / W_, 1 - (yy + 0.5) / H_
eb = st["eyeUVBox"]
keep = ((u < 0.205) & (v < 0.37)) | ((u >= eb[0]) & (u <= eb[2]) & (v >= eb[1]) & (v <= eb[3]))
skin_m = (~keep).astype(np.float64)
# the source's mustard knit hair tie (atlas top band) reads cheap next to the teal: a dark plum-brown, its knit kept in L*
ylw = (yy < 230) & (head[..., 0] > 0.3) & (head[..., 0] - head[..., 2] > 0.18) & (head[..., 1] - head[..., 2] > 0.1)
if ylw.any():
    lab_y = to_lab(s2l(head))
    tie = to_lab(s2l(np.array([0x3A, 0x1E, 0x22]) / 255.0))
    lab_y[..., 0] = np.where(ylw, tie[0] + (lab_y[..., 0] - np.median(lab_y[ylw][:, 0])) * 0.8, lab_y[..., 0])
    lab_y[..., 1] = np.where(ylw, tie[1], lab_y[..., 1])
    lab_y[..., 2] = np.where(ylw, tie[2], lab_y[..., 2])
    head = l2s(from_lab(lab_y))
    skin_m[ylw] = 0
# (polish pass 2) lips: the donor's lips are paler and pinker than her skin, which read "pasted on" at MST 6. Inside a
# feathered ellipse on the mouth, texels redder than the cheek median are taken to a deeper rose-brown: L* down by up
# to 9, b* pulled toward the skin's, a* kept (lips stay lips, no lipstick).
lab_l = to_lab(s2l(head))
dl = np.sqrt(((xx - 1022) / 105.0) ** 2 + ((yy - 830) / 52.0) ** 2)  # (polish 3) taller: the lower lip stayed pale
ck = lab_l[870:930, 760:840].reshape(-1, 3)
a_ck, b_ck = np.median(ck[:, 1]), np.median(ck[:, 2])
lipm = (1 - smooth(0.7, 1.0, dl)) * np.clip((lab_l[..., 1] - a_ck - 0.5) / 4, 0, 1) * skin_m
lab_l[..., 0] -= 9 * lipm
lab_l[..., 2] = lab_l[..., 2] * (1 - 0.5 * lipm) + b_ck * 0.5 * lipm
# (polish 3) the donor's LOWER lip is a lighter, pinker photo than her upper lip (atlas rows ~828-870) and stayed
# "pasted on" after the pass above: its own ellipse, L* down 8 more and a* trimmed by a quarter (rose-brown, not pink)
dlo = np.sqrt(((xx - 1022) / 84.0) ** 2 + ((yy - 850) / 23.0) ** 2)
lom = (1 - smooth(0.6, 1.0, dlo)) * skin_m
lab_l[..., 0] -= 8 * lom
lab_l[..., 1] -= 0.25 * np.clip(lab_l[..., 1] - a_ck, 0, None) * lom
head = l2s(from_lab(lab_l))
lin = s2l(head)
alb = l2s(lin * (1 - skin_m[..., None] + skin_m[..., None] * gain))
# the head atlas' upper-chest skin, linear, after the gain: what the body atlas' V-neck must meet at the seam
head_chest = np.median((lin * gain)[1440:1600, 900:1140].reshape(-1, 3), 0)
save(alb, "skin_albedo_H.png")
save(alb, "skin_albedo.png")
# eye crop (v up in UV, rows down in the image)
x0, x1 = int(eb[0] * W_), int(np.ceil(eb[2] * W_))
y0, y1 = int((1 - eb[3]) * H_), int(np.ceil((1 - eb[1]) * H_))
eye = Image.fromarray((head[y0:y1, x0:x1] * 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS)
eye.save(os.path.join(out, "eye_albedo.png"))

# normal + packed
nrm = rd("f011_head_normal.tga")[:, :, :3]
save(nrm, "skin_normal.png")
spec = rd("f011_head_specular.tga")[:, :, 0]
rough = np.clip(0.66 - spec * 0.55, 0.42, 0.8)
nz = nrm * 2 - 1
slope = np.sqrt(np.clip(nz[..., 0] ** 2 + nz[..., 1] ** 2, 0, 1))
cav = np.clip(1.0 - smooth(0.25, 0.7, slope) * 0.35, 0, 1)
packed = np.stack([cav, rough, np.zeros_like(rough), np.ones_like(rough)], -1)
save(packed, "skin_packed.png", "RGBA")

# ------------------------------------------------------------------ body atlas (garment mesh: dress + V-neck skin + hands)
body = dilate(rd("f011_body_color.tga")[:, :, :3])
lum = body @ np.array([0.2126, 0.7152, 0.0722])
bskin = smooth(0.26, 0.40, lum) * (body[..., 0] > body[..., 2] * 1.15)
blin = s2l(body)


hx = L["garment"]["base"]
tgt = to_lab(s2l(np.array([int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)])))
lab = to_lab(blin)
Ld = lab[..., 0]
mL = np.median(Ld[bskin < 0.1])
newL = tgt[0] + (Ld - mL) * 1.15          # keep the knit's relative light/dark, centred on the target's L*
dress = from_lab(np.stack([newL, np.full_like(newL, tgt[1]), np.full_like(newL, tgt[2])], -1))
# (polish pass 2) the body atlas' skin is more orange and lighter than the head atlas' after the same gain: a visible
# lighter triangle at the bottom of the V-neck. Its skin texels take one per-channel ratio onto the head's chest colour.
# the core of the V-neck island only (its rim is collar shadow and dilation fill, which dragged a mean dark: the first
# try of this pass brightened the patch by 1.3x instead of darkening it); medians, not means
vneck = (bskin > 0.9) & (yy > 1090) & (yy < 1150) & (xx > 990) & (xx < 1060)
body_skin = np.median((blin * gain)[vneck].reshape(-1, 3), 0) if vneck.any() else head_chest
match = np.clip(head_chest / body_skin, 0.6, 1.4)
glin = blin * gain * match * bskin[..., None] + dress * (1 - bskin[..., None])
galb = l2s(glin)
grough = 0.9 * (1 - bskin) + 0.6 * bskin
save(np.concatenate([galb, grough[..., None]], -1), "garment_albedo.png", "RGBA")

# ------------------------------------------------------------------ hair + lashes (source alpha cards, as authored)
op = np.asarray(Image.open(os.path.join(a.tex, "f011_opacity_color.tga")).convert("RGBA")).astype(np.float64) / 255
# the card atlas' transparent texels carry a light grey RGB, which the mips and the coverage edge pulled in as pale
# lines along every card seen edge-on (the bun, first look): push the hair colour out under alpha < 0.3
rgb = op[..., :3].copy()
rgb[op[..., 3] < 0.3] = 0
op[..., :3] = dilate(rgb, 64)
save(op, "hair_atlas.png", "RGBA")
save(op, "cards_atlas.png", "RGBA")
json.dump({"albedoGain": gain.tolist(), "skinTexelsHead": float(skin_m.mean()), "skinTexelsBody": float((bskin > 0.5).mean()),
           "garmentTarget": hx, "bodySkinMatch": match.tolist()}, open(os.path.join(out, "tex.json"), "w"), indent=1)
print("tex ok", gain)
