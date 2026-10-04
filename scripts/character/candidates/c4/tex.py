"""Candidate c4 (forked from c1), stage 1b: the source's maps -> the TaxilaSkin / Eye / Hair / Cloth slots, re-toned to the brief.

    python3 scripts/character/candidates/c4/tex.py --tex <Rocketbox Textures dir> --build <dir> --look <look.json>

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
head = dilate(rd("f007_head_color.tga")[:, :, :3])
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
# c4: Female_Adult_07's painted scalp hair (and the bun shell islands) is a light chestnut with orange highlights; the
# brief's teacher has near-black brown hair. Hair texels (dark, outside the face oval, not the mouth/eye islands) are
# re-toned in Lab: L* compressed toward a dark target with the strand detail kept, chroma cut to a cool dark brown.
# They also leave the skin gain (the gain is a skin solve; hair has its own target).
lab_h = to_lab(s2l(head))
oval = np.sqrt(((xx - 1024) / 340.0) ** 2 + ((yy - 700) / 380.0) ** 2) < 1.0
hairm = smooth(52, 42, lab_h[..., 0]) * (~oval) * (~keep) * (lab_h[..., 2] > 4)
HL, HA, HB = L.get("hair", {}).get("lab", [17.0, 4.5, 6.5])
medL = np.median(lab_h[hairm > 0.8][:, 0]) if (hairm > 0.8).any() else 35.0
nl = np.stack([HL + (lab_h[..., 0] - medL) * 0.55, HA + (lab_h[..., 1] - 10) * 0.15, HB + (lab_h[..., 2] - 18) * 0.2], -1)
lab_h = lab_h * (1 - hairm[..., None]) + nl * hairm[..., None]
# the red ear studs -> small warm gold studs (a* well above any skin texel, near the ears only)
earz = (((xx - 520) ** 2 + (yy - 790) ** 2) < 40 ** 2) | (((xx - 1524) ** 2 + (yy - 790) ** 2) < 40 ** 2)
stud = earz & (lab_h[..., 1] > 30)
lab_h[stud] = np.stack([lab_h[stud][:, 0] * 0.9 + 12, np.full(stud.sum(), 6.0), np.full(stud.sum(), 38.0)], -1)
head = l2s(from_lab(lab_h))
skin_m = skin_m * (1 - hairm)
skin_m[stud] = 0
# (polish pass 2) lips: the donor's lips are paler and pinker than her skin, which read "pasted on" at MST 6. Inside a
# feathered ellipse on the mouth, texels redder than the cheek median are taken to a deeper rose-brown: L* down by up
# to 9, b* pulled toward the skin's, a* kept (lips stay lips, no lipstick).
lab_l = to_lab(s2l(head))
dl = np.sqrt(((xx - 1022) / 105.0) ** 2 + ((yy - 830) / 52.0) ** 2)  # (polish 3) taller: the lower lip stayed pale
ck = lab_l[870:930, 760:840].reshape(-1, 3)
a_ck, b_ck = np.median(ck[:, 1]), np.median(ck[:, 2])
lipm = (1 - smooth(0.7, 1.0, dl)) * np.clip((lab_l[..., 1] - a_ck - 0.5) / 4, 0, 1) * skin_m
lab_l[..., 0] -= 4 * lipm  # c4: 9 -> 4 (this source's lip is already a full pink; 9 read as lipstick)
lab_l[..., 1] -= 0.35 * np.clip(lab_l[..., 1] - a_ck, 0, None) * lipm
lab_l[..., 2] = lab_l[..., 2] * (1 - 0.5 * lipm) + b_ck * 0.5 * lipm
# (polish 3) the donor's LOWER lip is a lighter, pinker photo than her upper lip (atlas rows ~828-870) and stayed
# "pasted on" after the pass above: its own ellipse, L* down 8 more and a* trimmed by a quarter (rose-brown, not pink)
dlo = np.sqrt(((xx - 1022) / 84.0) ** 2 + ((yy - 850) / 23.0) ** 2)
lom = (1 - smooth(0.6, 1.0, dlo)) * skin_m
lab_l[..., 0] -= 2 * lom  # c4: 8 -> 2
lab_l[..., 1] -= 0.25 * np.clip(lab_l[..., 1] - a_ck, 0, None) * lom
head = l2s(from_lab(lab_l))
# c4 polish: (1) the source's freckles and blotches read "blotchy" once darkened to MST 6 (cheeks, nose bridge): inside
# the face skin, the mid-frequency luminance/chroma detail (a 7 px Gaussian band at 2048 px) is cut to 45%; pores and
# fine detail stay in the normal map. (2) a* +2.0 on the skin texels: the G9-solved render matched the hex in L*/C*
# but read olive-grey in the shadows (G9 re-checked after this).
from PIL import ImageFilter
lab_s = to_lab(s2l(head))
blur = np.stack([np.asarray(Image.fromarray(np.uint8(np.clip((lab_s[..., c] - lo_) / (hi_ - lo_), 0, 1) * 255)).filter(ImageFilter.GaussianBlur(7))).astype(np.float64) / 255 * (hi_ - lo_) + lo_
                 for c, (lo_, hi_) in enumerate(((0, 100), (-30, 50), (-20, 60)))], -1)
facez = (1 - smooth(0.85, 1.05, np.sqrt(((xx - 1024) / 360.0) ** 2 + ((yy - 760) / 420.0) ** 2))) * skin_m
mouthz = 1 - (1 - smooth(0.9, 1.3, np.sqrt(((xx - 1022) / 120.0) ** 2 + ((yy - 835) / 60.0) ** 2)))  # keep the lip line crisp
eyez = 1 - (1 - smooth(0.9, 1.4, np.minimum(np.sqrt(((xx - 880) / 90.0) ** 2 + ((yy - 580) / 45.0) ** 2), np.sqrt(((xx - 1168) / 90.0) ** 2 + ((yy - 580) / 45.0) ** 2))))
sw = 0.55 * facez * mouthz * eyez
lab_s = lab_s * (1 - sw[..., None]) + blur * sw[..., None]
lab_s[..., 1] += L["skin"].get("warmA", 2.0) * skin_m
head = l2s(from_lab(lab_s))
lin = s2l(head)
alb = l2s(lin * (1 - skin_m[..., None] + skin_m[..., None] * gain))
# the head atlas' upper-chest skin, linear, after the gain: what the body atlas' V-neck must meet at the seam
head_chest = np.median((lin * gain)[1440:1600, 900:1140].reshape(-1, 3), 0)
save(alb, "skin_albedo_H.png")
save(alb, "skin_albedo.png")
# eye crop (v up in UV, rows down in the image)
x0, x1 = int(eb[0] * W_), int(np.ceil(eb[2] * W_))
y0, y1 = int((1 - eb[3]) * H_), int(np.ceil((1 - eb[1]) * H_))
ecrop = head[y0:y1, x0:x1].copy()
# c4: the source iris is grey-green; the brief's teacher has dark brown eyes. Iris texels (mid-dark, low chroma or
# green/blue, inside the iris disc of the crop) take a warm brown, their L* pattern (crypts, limbal ring) kept.
lab_e = to_lab(s2l(ecrop))
eh, ew = ecrop.shape[:2]
ey, ex = np.mgrid[0:eh, 0:ew]
ir = lab_e[..., 0] < 72
cy, cx = np.median(ey[ir & (np.abs(ey - eh / 2) < eh / 4)]), np.median(ex[ir & (np.abs(ex - ew / 2) < ew / 4)])
disc = np.sqrt((ey - cy) ** 2 + (ex - cx) ** 2) < 0.13 * min(eh, ew)
im = disc * smooth(80, 66, lab_e[..., 0]) * (lab_e[..., 1] < 18)
IL = L["eyes"].get("irisLab", [30.0, 9.0, 17.0])
ne = np.stack([IL[0] + (lab_e[..., 0] - 50) * 0.45, np.full(lab_e.shape[:2], IL[1]), np.full(lab_e.shape[:2], IL[2])], -1)
lab_e = lab_e * (1 - im[..., None]) + ne * im[..., None]
ecrop = l2s(from_lab(lab_e))
eye = Image.fromarray((np.clip(ecrop, 0, 1) * 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS)
eye.save(os.path.join(out, "eye_albedo.png"))

# normal + packed
nrm = rd("f007_head_normal.tga")[:, :, :3]
save(nrm, "skin_normal.png")
spec = rd("f007_head_specular.tga")[:, :, 0]
rough = np.clip(0.66 - spec * 0.55, 0.42, 0.8)
nz = nrm * 2 - 1
slope = np.sqrt(np.clip(nz[..., 0] ** 2 + nz[..., 1] ** 2, 0, 1))
cav = np.clip(1.0 - smooth(0.25, 0.7, slope) * 0.35, 0, 1)
packed = np.stack([cav, rough, np.zeros_like(rough), np.ones_like(rough)], -1)
save(packed, "skin_packed.png", "RGBA")

# ------------------------------------------------------------------ body atlas (garment mesh: dress + V-neck skin + hands)
body = dilate(rd("f007_body_color.tga")[:, :, :3])
lum = body @ np.array([0.2126, 0.7152, 0.0722])
bskin = smooth(0.26, 0.40, lum) * (body[..., 0] > body[..., 2] * 1.15)
blin = s2l(body)


hexlab = lambda hx: to_lab(s2l(np.array([int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)])))
hx = L["garment"]["base"]
tgt, tgt2 = hexlab(hx), hexlab(L["garment"].get("top", "#E9DFCB"))
lab = to_lab(blin)
Ld = lab[..., 0]
# c4: the bust carries two garments: the brown corduroy jacket (-> the look's base colour) and the crimson V of the top
# underneath (-> a soft ivory). The top is the high-a* non-skin texels.
topm = smooth(22, 34, lab[..., 1]) * (1 - bskin) * (lab[..., 2] < 25)
mL = np.median(Ld[(bskin < 0.1) & (topm < 0.1)])
newL = tgt[0] + (Ld - mL) * 1.1          # keep the cord's relative light/dark, centred on the target's L*
jacket = from_lab(np.stack([newL, np.full_like(newL, tgt[1]), np.full_like(newL, tgt[2])], -1))
mT = np.median(Ld[topm > 0.9]) if (topm > 0.9).any() else 40.0
topc = from_lab(np.stack([tgt2[0] + (Ld - mT) * 0.6, np.full_like(Ld, tgt2[1]), np.full_like(Ld, tgt2[2])], -1))
dress = jacket * (1 - topm[..., None]) + topc * topm[..., None]
# the V-neck skin island (the core of it; medians, not means) meets the head atlas' chest colour at the seam
vneck = (bskin > 0.9) & (yy > 935) & (yy < 990) & (xx > 990) & (xx < 1060)
body_skin = np.median((blin * gain)[vneck].reshape(-1, 3), 0) if vneck.any() else head_chest
match = np.clip(head_chest / body_skin, 0.6, 1.4)
glin = blin * gain * match * bskin[..., None] + dress * (1 - bskin[..., None])
galb = l2s(glin)
grough = 0.9 * (1 - bskin) + 0.6 * bskin
save(np.concatenate([galb, grough[..., None]], -1), "garment_albedo.png", "RGBA")

# ------------------------------------------------------------------ hair + lashes (source alpha cards, as authored)
op = np.asarray(Image.open(os.path.join(a.tex, "f007_opacity_color.tga")).convert("RGBA")).astype(np.float64) / 255
# the card atlas' transparent texels carry a light grey RGB, which the mips and the coverage edge pulled in as pale
# lines along every card seen edge-on (the bun, first look): push the hair colour out under alpha < 0.3
rgb = op[..., :3].copy()
rgb[op[..., 3] < 0.3] = 0
op[..., :3] = dilate(rgb, 64)
# c4: the cards (bun strands, lashes) take the same dark hair tone as the painted hair
lab_o = to_lab(s2l(op[..., :3]))
mo = np.median(lab_o[op[..., 3] > 0.5][:, 0]) if (op[..., 3] > 0.5).any() else 35.0
lab_o = np.stack([HL + (lab_o[..., 0] - mo) * 0.55, np.full(lab_o.shape[:2], HA), np.full(lab_o.shape[:2], HB)], -1)
op[..., :3] = l2s(from_lab(lab_o))
save(op, "hair_atlas.png", "RGBA")
save(op, "cards_atlas.png", "RGBA")
json.dump({"albedoGain": gain.tolist(), "skinTexelsHead": float(skin_m.mean()), "skinTexelsBody": float((bskin > 0.5).mean()),
           "garmentTarget": hx, "bodySkinMatch": match.tolist()}, open(os.path.join(out, "tex.json"), "w"), indent=1)
print("tex ok", gain)
