"""c2 stage 1b: Rocketbox maps -> the TaxilaSkin / Hair / Cards / Cloth slots, with the look's recolour.

    bpyenv/bin/python scripts/character/candidates/c2/texture_c2.py --look art/character/candidates/c2/look.json --build <dir>

MIT allows modification, so the recolour edits the texels directly:
  - skin: Rocketbox's painted skin (a light-medium tan) is moved toward the look's Monk band in CIE L*a*b*: lightness
    and chroma are re-mapped around the skin's own median (keeping every painted shade, pore and blush relative to it),
    hue is pulled to the target hue. The look's albedoGain then fine-tunes against the RENDER (G9, our g9 method).
  - lips: desaturated toward the skin (no lipstick register), see look.lips;
  - hair: re-tinted to the look's hair colour by luminance (strand detail kept);
  - garment: the black blazer -> the look's jacket colour, the white shirt -> the look's blouse colour, by luminance
    masks of Rocketbox's own body atlas;
  - packed (R cavity, G roughness, B thickness, A AO): cavity and AO from the normal map's low-frequency relief,
    roughness from Rocketbox's specular map, thickness at the ears and nostrils by UV region.
"""
import argparse, colorsys, json, os, sys
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("--look", required=True)
ap.add_argument("--build", required=True)
ap.add_argument("--src", default=os.environ.get("C2_SRC", "/tmp/claude-0/char/c2/src"))
args = ap.parse_args()
L = json.load(open(args.look))
out = os.path.join(args.build, "tex")
os.makedirs(out, exist_ok=True)
rd = lambda f: np.asarray(Image.open(os.path.join(args.src, f)).convert("RGBA" if "opacity" in f else "RGB")).astype(np.float32) / 255


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


def save(a, name, mode=None):
    a = np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(a, mode).save(os.path.join(out, name))


UVP = json.load(open(os.path.join(args.build, "uvpolys.json")))


def used_mask(part, H, W, dil=10):
    """texels any shipped polygon of `part` samples, dilated (mip safety)."""
    from PIL import ImageDraw
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)
    for poly in UVP[part]:
        d.polygon([(u * W, (1 - v) * H) for u, v in poly], fill=255)
    im = im.filter(ImageFilter.MaxFilter(2 * (dil // 2) + 1)).filter(ImageFilter.MaxFilter(2 * (dil // 2) + 1))
    return np.asarray(im).astype(np.float32) / 255 > 0.5


def flatten(img, used):
    """unused texels -> the mean colour of the used ones (a flat field costs the encoder almost nothing)."""
    m = img[used].mean(0)
    out = img.copy()
    out[~used] = m
    return out


def soft(mask, r):
    return np.asarray(Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


# ------------------------------------------------------------------ skin (head atlas)
head = rd("f014_head_color.tga")
H, W = head.shape[:2]
lab = rgb2lab(head)
Lc, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
C = np.hypot(a, b)
hue = np.degrees(np.arctan2(b, a))
# skin texels: warm hue, enough chroma, not hair-dark; the UV map's face / neck / ears (rows above the mouth atlas)
yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
skin = ((hue > 25) & (hue < 85) & (C > 9) & (Lc > 28)).astype(np.float32)
skin *= ((yy < 0.62) | ((yy < 0.83) & (xx > 0.2) & (xx < 0.7))).astype(np.float32)   # face, neck, chest V
skin = soft(skin, 3)
sk = skin > 0.9
med = np.array([np.median(Lc[sk]), np.median(C[sk]), np.median(hue[sk])])
tgt = rgb2lab(hex2rgb(L["skin"]["mstHex"]))
tL, tC, tH = tgt[0], np.hypot(tgt[1], tgt[2]), np.degrees(np.arctan2(tgt[2], tgt[1]))
S = L["skin"]
# lightness: shift the median to the target and compress the spread a little (Rocketbox's paint has strong blotches)
# polish: Rocketbox's paint carries baked light (a pale forehead, a darker jaw and neck); remove part of the
# low-frequency lightness field (mask-normalised blur, sigma ~ 45 texels) before the remap, so the shader lights it
def mblur(x, m, r):
    from scipy.ndimage import gaussian_filter
    return gaussian_filter(x * m, r) / np.maximum(gaussian_filter(m, r), 1e-4)
Llow = mblur(Lc, skin, 45)
Lc = Lc - S.get("flattenLow", 0.5) * (Llow - med[0]) * skin
Ln = tL + (Lc - med[0]) * S.get("lightSpread", 0.85)
Cn = C * (tC / med[1]) * S.get("chromaScale", 1.0)
hn = hue + (tH - med[2]) * S.get("huePull", 0.8)
labn = np.stack([Ln, Cn * np.cos(np.radians(hn)), Cn * np.sin(np.radians(hn))], -1)
skin_rgb = lab2rgb(labn)
# G9 trim (render-solved, g9.mjs --solve), applied in linear light to the skin texels only
skin_rgb = l2s(s2l(skin_rgb) * np.array(S.get("albedoGain", [1, 1, 1]))[None, None])
alb = head * (1 - skin[..., None]) + skin_rgb * skin[..., None]

# lips: Rocketbox paints a rose lip; pull its chroma toward the skin's (look.lips.desat) and darken slightly
lipbox = (yy > 0.37) & (yy < 0.44) & (xx > 0.43) & (xx < 0.57)
lipm = soft((lipbox & (a > np.median(a[sk]) + 4)).astype(np.float32), 4)
lab2 = rgb2lab(alb)
d = L.get("lips", {}).get("desat", 0.35)
lab2[..., 1] = lab2[..., 1] * (1 - d * lipm) + tgt[1] * 1.2 * d * lipm
lab2[..., 2] = lab2[..., 2] * (1 - d * lipm) + tgt[2] * 0.9 * d * lipm
lab2[..., 0] -= lipm * L.get("lips", {}).get("darken", 3.0)
alb = lab2rgb(lab2)

# hair (both in this atlas and for the hair-shell atlas): luminance-preserving tint toward the look's hair colour
hc = hex2rgb(L["hair"]["color"])
lum = head @ np.array([0.3, 0.59, 0.11])
hairm = soft(((lum < 0.2) & (C < 18) & ~((yy > 0.62) & (xx < 0.35))).astype(np.float32), 2) * (1 - skin)
ref = np.median(lum[hairm > 0.9]) if (hairm > 0.9).any() else 0.1
hair_rgb = np.clip(hc[None, None] * (lum / ref)[..., None] ** L["hair"].get("contrast", 1.15), 0, 1)
alb = alb * (1 - hairm[..., None]) + hair_rgb * hairm[..., None]
alb_face = flatten(alb, used_mask("face", H, W))
save(alb_face, "skin_albedo_H.png")
save(alb_face, "skin_albedo.png")
# hair shell: EVERY texel the shell samples is re-tinted by luminance (Rocketbox paints it red-brown with grey glints
# and a brooch); the ratio is clamped so the brooch and glints fall into the hair's own range
hu = used_mask("hair", H, W)
hl = soft(lum, 0.8)
href = np.median(hl[hu])
shell = np.clip(hc[None, None] * np.clip(hl / href, 0.25, 1.6)[..., None] ** L["hair"].get("contrast", 1.15), 0, 1)
shell = flatten(shell, hu)

# ------------------------------------------------------------------ normal (flip G if the bake is Y-down)
nrm = rd("f014_head_normal.tga")
if L.get("normalFlipG", False):
    nrm[..., 1] = 1 - nrm[..., 1]
save(flatten(nrm, used_mask("face", H, W)), "skin_normal.png")

# ------------------------------------------------------------------ packed: cavity, roughness, thickness, AO
nz = nrm[..., 2] * 2 - 1
relief = soft(1 - nz, 1.5)                                   # creases / folds tilt the normal
cav = np.clip(1 - relief * 2.2, 0.55, 1)
ao = np.clip(1 - soft(1 - nz, 6) * 2.0, 0.6, 1)
spec = rd("f014_head_specular.tga")[..., 0]
rough = np.clip(0.68 - (spec - np.median(spec)) * 1.6, 0.45, 0.85)
rough = np.where(hairm > 0.3, 0.9, rough)
# polish: the face mesh's own hairline texels (painted hair on skin polygons) took a cool Fresnel / ambient-specular
# sheen from the skin shader and read as a navy stripe at the temple; the cavity term masks that specular
cav = np.where(hairm > 0.3, 0.15, cav)
ao = np.where(hairm > 0.3, np.minimum(ao, 0.35), ao)      # ... and the AO term masks the cool rim light on those texels
thick = np.zeros_like(cav)
for (cx, cy, rx, ry) in [(0.255, 0.34, 0.045, 0.07), (0.745, 0.34, 0.045, 0.07), (0.5, 0.35, 0.04, 0.02)]:
    thick = np.maximum(thick, np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)))
packed = np.stack([cav, rough, thick * 0.8, ao], -1)
save(packed, "skin_packed.png", "RGBA")

# ------------------------------------------------------------------ garment (body atlas): blazer + shirt recolour
body = rd("f014_body_color.tga")
bl = body @ np.array([0.3, 0.59, 0.11])
blab = rgb2lab(body)
bC = np.hypot(blab[..., 1], blab[..., 2])
G = L["garment"]
jacket = soft(((bl < 0.25) & (bC < 10)).astype(np.float32), 1.5)
shirt = soft(((bl > 0.40) & (bC < 30) & (blab[..., 2] < 6)).astype(np.float32), 1.5)   # Rocketbox's shirt is a cool lavender white
jc, sc = hex2rgb(G["jacket"]), hex2rgb(G["blouse"])
jref = np.median(bl[jacket > 0.9]); sref = np.median(bl[shirt > 0.9])
jr = np.clip(jc[None, None] * ((bl / jref) ** G.get("jacketContrast", 0.7))[..., None], 0, 1)
sr = np.clip(sc[None, None] * ((bl / sref) ** 1.0)[..., None], 0, 1)
g = body * (1 - jacket[..., None] - shirt[..., None]) + jr * jacket[..., None] + sr * shirt[..., None]
# skin on the body atlas (hands, none in the bust) is left as is; alpha = roughness
gr = np.full(bl.shape + (1,), 0.85, np.float32)
g = flatten(g, used_mask("garment", *g.shape[:2]))
save(np.concatenate([g, gr], -1), "garment_albedo.png", "RGBA")

# ------------------------------------------------------------------ cards (Rocketbox alpha atlas: hair strands + lashes)
opa = rd("f014_opacity_color.tga")
ol = opa[..., :3] @ np.array([0.3, 0.59, 0.11])
oref = np.median(ol[opa[..., 3] > 0.5])
opa[..., :3] = np.clip(hc[None, None] * (np.clip(ol / oref, 0.25, 1.6) ** L["hair"].get("contrast", 1.15))[..., None], 0, 1)
# two-half cards atlas (build_c2.py packs the UVs): left = Rocketbox alpha cards, right = the hair shell (alpha 1)
half = lambda a: np.asarray(Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)).resize((a.shape[1] // 2, a.shape[0]), Image.LANCZOS)).astype(np.float32) / 255
shell4 = np.concatenate([shell, np.ones(shell.shape[:2] + (1,), np.float32)], -1)
save(np.concatenate([half(opa), half(shell4)], 1), "cards_atlas.png", "RGBA")

rep = {"skinMedianSrc_LCh": med.round(2).tolist(), "skinTarget_LCh": [round(tL, 2), round(tC, 2), round(tH, 2)],
       "skinTexels": int(sk.sum()), "hairTexels": int((hairm > 0.9).sum()), "jacketTexels": int((jacket > 0.9).sum()),
       "shirtTexels": int((shirt > 0.9).sum())}
json.dump(rep, open(os.path.join(args.build, "texture.json"), "w"), indent=1)
print(json.dumps(rep))
