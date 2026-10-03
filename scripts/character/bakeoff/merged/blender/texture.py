"""Stage 1b (headless Blender + numpy): procedural textures for one look, rasterised in the face's own UV layout.

No photo, scan or third-party texture of a person goes in (TEACHER-VISUAL §11): every skin texel is a function of the
texel's 3D rest position, its interpolated normal and region weights of OUR mesh, evaluated with seeded gradient
noise. Hair and lash/brow alphas reuse the MakeHuman CC0 card textures; their colour comes from the look spec.

Outputs (PNG, linear data unless noted) in <out>/tex/:
  skin_albedo.png (sRGB)  skin_normal.png  skin_wrinkle.png (compress)  skin_wrinkle_stretch.png
  skin_maskA.png (forehead, glabella, crowL, crowR)  skin_maskB.png (nasoL, nasoR, chin, neck)
  skin_packed.png (R cavity, G roughness, B thickness, A ambient occlusion)
  garment_albedo.png (sRGB, A = roughness)  hair_atlas.png (sRGB + alpha)  cards_atlas.png (sRGB + alpha)
"""
import argparse, json, math, os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# shared, unchanged helpers (mpfb_env, identity_sculpt) come from the main pipeline
sys.path.insert(1, os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../blender"))
import numpy as np
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
from mpfb_env import co, deltas, hex_lin, smoothstep, USER_DATA
import keys as K

ap = argparse.ArgumentParser()
ap.add_argument("--look", required=True)
ap.add_argument("--build", required=True)
ap.add_argument("--res", type=int, default=2048)
args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
look = json.load(open(args.look))
rep = json.load(open(os.path.join(args.build, "report.json")))
OUT = os.path.join(args.build, "tex")
os.makedirs(OUT, exist_ok=True)
T0 = time.time()
R = args.res
bpy.ops.wm.open_mainfile(filepath=os.path.join(args.build, "base.blend"))


def log(m):
    print(f"[tex:{look['id']}] {m} t={time.time() - T0:.1f}s", flush=True)


# ------------------------------------------------------------------ noise (seeded 3D gradient noise, vectorised)
class Noise:
    G = np.array([[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
                  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]], float)

    def __init__(self, seed):
        p = np.random.default_rng(seed).permutation(256)
        self.p = np.concatenate([p, p]).astype(np.int64)

    def __call__(self, P):
        Pi = np.floor(P).astype(np.int64)
        f = P - Pi
        Pi &= 255
        u = f * f * f * (f * (f * 6 - 15) + 10)
        p = self.p
        out = 0
        res = {}
        for dx in (0, 1):
            for dy in (0, 1):
                for dz in (0, 1):
                    h = p[p[p[Pi[:, 0] + dx] + Pi[:, 1] + dy] + Pi[:, 2] + dz] % 12
                    g = self.G[h]
                    res[(dx, dy, dz)] = (g * (f - np.array([dx, dy, dz]))).sum(1)
        lerp = lambda a, b, t: a + (b - a) * t
        x00 = lerp(res[0, 0, 0], res[1, 0, 0], u[:, 0])
        x10 = lerp(res[0, 1, 0], res[1, 1, 0], u[:, 0])
        x01 = lerp(res[0, 0, 1], res[1, 0, 1], u[:, 0])
        x11 = lerp(res[0, 1, 1], res[1, 1, 1], u[:, 0])
        return lerp(lerp(x00, x10, u[:, 1]), lerp(x01, x11, u[:, 1]), u[:, 2])

    def fbm(self, P, octaves=4, lac=2.03, gain=0.5):
        a, s, f = 1.0, 0.0, 1.0
        for _ in range(octaves):
            s = s + a * self(P * f)
            f *= lac
            a *= gain
        return s


NZ = Noise(look["seed"])


# ------------------------------------------------------------------ rasteriser
def raster(uvt, res):
    """uvt (T,3,2) in [0,1]. Returns tri index map (res,res) int32 (-1 empty) and barycentrics (res,res,3)."""
    tri = np.full((res, res), -1, np.int32)
    bar = np.zeros((res, res, 3), np.float32)
    P = uvt * res - 0.5
    for t in range(len(P)):
        a, b, c = P[t]
        x0, y0 = np.floor(np.minimum(np.minimum(a, b), c)).astype(int)
        x1, y1 = np.ceil(np.maximum(np.maximum(a, b), c)).astype(int)
        x0, y0 = max(x0, 0), max(y0, 0)
        x1, y1 = min(x1, res - 1), min(y1, res - 1)
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(den) < 1e-12:
            continue
        w0 = ((b[1] - c[1]) * (xs - c[0]) + (c[0] - b[0]) * (ys - c[1])) / den
        w1 = ((c[1] - a[1]) * (xs - c[0]) + (a[0] - c[0]) * (ys - c[1])) / den
        w2 = 1 - w0 - w1
        e = -1e-3
        m = (w0 >= e) & (w1 >= e) & (w2 >= e)
        tri[ys[m], xs[m]] = t
        bar[ys[m], xs[m]] = np.stack([w0[m], w1[m], w2[m]], 1)
    return tri, bar


def dilate(img, mask, iters=None):
    """Fill empty texels with the nearest filled texel (UV padding)."""
    _, idx = ndimage.distance_transform_edt(~mask, return_indices=True)
    return img[idx[0], idx[1]]


def mesh_tris(ob):
    me = ob.data
    me.calc_loop_triangles()
    T = len(me.loop_triangles)
    lv = np.empty(T * 3, np.int64)
    ll = np.empty(T * 3, np.int64)
    me.loop_triangles.foreach_get("vertices", lv)
    me.loop_triangles.foreach_get("loops", ll)
    uvl = me.uv_layers.active
    uv = np.empty(len(me.loops) * 2)
    uvl.data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 2)
    return lv.reshape(-1, 3), uv[ll].reshape(-1, 3, 2)


def vnormals(me):
    n = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("normal", n)
    return n.reshape(-1, 3)


def attr(ob, nm):
    a = np.zeros(len(ob.data.vertices), np.float32)
    ob.data.attributes[nm].data.foreach_get("value", a)
    return a


def to8(x):
    return np.clip(np.round(x * 255), 0, 255).astype(np.uint8)


def lin2srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def save(name, arr, mode=None):
    img = Image.fromarray(to8(arr), mode)
    img = img.transpose(Image.FLIP_TOP_BOTTOM)       # UV v up -> image row 0 at top
    img.save(os.path.join(OUT, name), optimize=True)


# ------------------------------------------------------------------ face mesh data
face = bpy.data.objects["face"]
me = face.data
P = co(me)
Nv = vnormals(me)
region = attr(face, "region")
lipsW = attr(face, "lipsW")
scalpW = attr(face, "hairW") if "hairW" in face.data.attributes else attr(face, "scalpW")
earsW = attr(face, "earsW")
fb, FD = deltas(face)
tris, uvt = mesh_tris(face)
skin_t = np.all(region[tris] == 0, axis=1)
tris, uvt = tris[skin_t], uvt[skin_t]
log(f"raster {len(tris)} tris at {R}")
TRI, BAR = raster(uvt, R)
cov = TRI >= 0
ti = TRI[cov]
bb = BAR[cov][:, :, None]
VI = tris[ti]                                          # (N,3) vertex ids per texel
def interp(a):
    a = a[VI]
    return (a * bb).sum(1) if a.ndim == 3 else (a * bb[:, :, 0]).sum(1)
Pt = interp(P)
Nt = interp(Nv)
Nt /= np.linalg.norm(Nt, axis=1, keepdims=True)
# per-triangle tangent frame from UV (what a derivative-based TBN reconstructs at runtime)
p0, p1, p2 = P[tris[:, 0]], P[tris[:, 1]], P[tris[:, 2]]
u0, u1, u2 = uvt[:, 0], uvt[:, 1], uvt[:, 2]
e1, e2 = p1 - p0, p2 - p0
d1, d2 = u1 - u0, u2 - u0
r_ = 1.0 / np.where(np.abs(d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) < 1e-12, 1e-12, d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0])
Tt = (e1 * d2[:, 1:2] - e2 * d1[:, 1:2]) * r_[:, None]
Bt = (e2 * d1[:, 0:1] - e1 * d2[:, 0:1]) * r_[:, None]
Tx = Tt[ti]
Tx = Tx - Nt * (Tx * Nt).sum(1, keepdims=True)
Tx /= np.maximum(np.linalg.norm(Tx, axis=1, keepdims=True), 1e-12)
Bx = np.cross(Nt, Tx) * np.sign((np.cross(Nt, Tx) * Bt[ti]).sum(1, keepdims=True))
log(f"texels {cov.sum()}")

# ------------------------------------------------------------------ landmarks (from our own rig)
eyeC = {k: np.array(v) for k, v in rep["eyeC"].items()}
eyeR = rep["eyeR"]["L"]
skin_v = region == 0
lipsel = np.nonzero((lipsW > 0.3) & skin_v)[0]
mcL = P[lipsel[np.argmax(P[lipsel, 0])]]
mcR = P[lipsel[np.argmin(P[lipsel, 0])]]
lipC = P[lipsel].mean(0)
mid = skin_v & (np.abs(P[:, 0]) < 0.004) & (P[:, 2] > lipC[2]) & (P[:, 2] < eyeC["L"][2])
noseTip = P[np.nonzero(mid)[0][np.argmin(P[mid, 1])]]
chinsel = skin_v & (np.abs(P[:, 0]) < 0.006) & (P[:, 2] < lipC[2] - 0.02) & (P[:, 1] < lipC[1] + 0.03)
chin = P[np.nonzero(chinsel)[0][np.argmin(P[chinsel, 1])]]
browZ = eyeC["L"][2] + 0.022
wingL = noseTip + np.array([0.017, 0.012, 0.004])
wingR = noseTip + np.array([-0.017, 0.012, 0.004])
log(f"landmarks noseTip={noseTip.round(3)} chin={chin.round(3)} lipC={lipC.round(3)}")

# brows (for painting under/instead of cards) and per-vertex face masks
brows = bpy.data.objects["brows"]
# brow hair points: dense samples on the brow cards, kept where the card's own CC0 alpha says there is hair
_bt, _buv = mesh_tris(brows)
_bP = co(brows.data)
_bd = os.path.join(USER_DATA, "eyebrows", look["brows"])
_ba = np.asarray(Image.open(os.path.join(_bd, [f for f in os.listdir(_bd) if f.endswith(".png")][0])).convert("RGBA"))[:, :, 3] / 255.0
_rng = np.random.default_rng(3)
_w = _rng.dirichlet((1, 1, 1), size=(len(_bt), 400))                        # (T,400,3)
BP = np.einsum("tsk,tkc->tsc", _w, _bP[_bt]).reshape(-1, 3)
_uv = np.einsum("tsk,tkc->tsc", _w, _buv).reshape(-1, 2)
_px = (np.clip(_uv[:, 0], 0, 0.999) * _ba.shape[1]).astype(int)
_py = ((1 - np.clip(_uv[:, 1], 0, 0.999)) * _ba.shape[0]).astype(int)
BP = BP[_ba[_py, _px] > 0.3]
btree = cKDTree(BP)
front = smoothstep(-0.01, 0.03, -(Pt[:, 1] - (eyeC["L"][1] + 0.03)))


def gauss(Pp, c, s):
    return np.exp(-((np.linalg.norm(Pp - c, axis=1) / s) ** 2))


def seg_dist(Pp, a, b):
    v = b - a
    t = np.clip(((Pp - a) @ v) / (v @ v), 0, 1)
    return np.linalg.norm(Pp - (a + t[:, None] * v), axis=1), t


lipT = interp(lipsW)
scalpT = interp(scalpW)
earT = interp(earsW)

# ------------------------------------------------------------------ height fields
def pores(Pp):
    n1 = NZ(Pp * 900.0)
    n2 = NZ(Pp * 1700.0 + 13.1)
    pits = -np.clip(n1 - 0.25, 0, 1) * 1.0 - np.clip(n2 - 0.35, 0, 1) * 0.5
    return pits


def base_height(Pp):
    h = 0.00012 * pores(Pp) * (1 - 0.7 * interp_cache["lip"])
    # lips: fine vertical lines (half the first build's amplitude: they read as corrugation, review item 9)
    h += -0.00004 * interp_cache["lip"] * np.clip(np.abs(np.sin(Pp[:, 0] * 2400 + NZ(Pp * 300) * 2)) ** 6, 0, 1)
    # soft skin undulation
    h += 0.0001 * NZ.fbm(Pp * 120.0, 3)
    return h


def wrinkle_height(Pp, age):
    """Expression wrinkles as one height field; the masks decide which region shows at runtime."""
    h = np.zeros(len(Pp))
    # forehead: horizontal lines that arc with the brows
    zf = Pp[:, 2] - browZ + 2.2 * Pp[:, 0] ** 2
    fh = smoothstep(0.012, 0.02, zf) * (1 - smoothstep(0.045, 0.06, zf)) * (1 - smoothstep(0.045, 0.06, np.abs(Pp[:, 0])))
    h += -0.00034 * fh * np.clip(NZ(Pp * 120) * 1.5 + 0.6, 0, 1) * np.clip(np.sin(zf * 2 * math.pi / 0.0095 + NZ(Pp * 45) * 1.6), 0, 1) ** 3
    # glabella: two short vertical grooves between the brows
    for sx in (0.006, -0.006):
        d = np.abs(Pp[:, 0] - sx - 0.08 * (Pp[:, 2] - browZ))
        g = np.exp(-(d / 0.0011) ** 2) * smoothstep(browZ - 0.012, browZ - 0.004, Pp[:, 2]) * (1 - smoothstep(browZ + 0.008, browZ + 0.016, Pp[:, 2]))
        h += -0.0006 * g
    # crow's feet: radial lines from each outer eye corner
    for side, sg in (("L", 1), ("R", -1)):
        c = eyeC[side] + np.array([sg * (eyeR + 0.004), 0.004, -0.002])
        rel = Pp - c
        r = np.sqrt(rel[:, 0] ** 2 + rel[:, 2] ** 2)
        ang = np.arctan2(rel[:, 2], sg * rel[:, 0])
        m = smoothstep(0.004, 0.008, r) * (1 - smoothstep(0.018, 0.026, r)) * (sg * rel[:, 0] > -0.002)
        h += -0.0004 * m * np.clip(np.sin(ang * 9 + NZ(Pp * 80) * 1.5), 0, 1) ** 4
    # nasolabial fold: a SOFT groove (sigma ~3.5 mm, shallow) from the alar base along the fold to just past the mouth
    # corner. The first build used sigma 2.2 mm at 0.9 mm depth: a pen-like slash beside the corner (review item 5).
    for w_, mc in ((wingL, mcL), (wingR, mcR)):
        sg_ = np.sign(mc[0])
        start = w_ + np.array([sg_ * 0.002, 0.003, -0.002])
        bend = mc + np.array([sg_ * 0.0085, 0.001, 0.004])
        end = mc + np.array([sg_ * 0.007, 0.002, -0.008])
        d1, t1 = seg_dist(Pp, start, bend)
        d2, _ = seg_dist(Pp, bend, end)
        d = np.minimum(d1, d2)
        h += -0.0005 * np.exp(-(d / 0.0035) ** 2) * np.where(d1 < d2, smoothstep(0.0, 0.25, t1), 1.0)
    # under-eye fine lines
    for side in ("L", "R"):
        c = eyeC[side]
        rel = Pp - c
        m = gauss(Pp, c + np.array([0, -0.004, -eyeR * 0.95]), 0.008) * (rel[:, 2] < -eyeR * 0.6)
        h += -0.00022 * m * np.clip(np.sin(rel[:, 2] * 2 * math.pi / 0.0021 + NZ(Pp * 150)), 0, 1) ** 3
    # chin pebbling (mentalis)
    h += -0.0003 * gauss(Pp, chin + np.array([0, 0.002, 0.008]), 0.012) * np.clip(NZ(Pp * 500.0) - 0.1, 0, 1)
    return h


def masks(Pp):
    zf = Pp[:, 2] - browZ + 2.2 * Pp[:, 0] ** 2
    fore = smoothstep(0.004, 0.02, zf) * (1 - smoothstep(0.035, 0.06, zf)) * (1 - smoothstep(0.03, 0.06, np.abs(Pp[:, 0])))
    glab = gauss(Pp, np.array([0, eyeC["L"][1] - 0.018, browZ - 0.002]), 0.012)
    crow = []
    for side, sg in (("L", 1), ("R", -1)):
        crow.append(gauss(Pp, eyeC[side] + np.array([sg * (eyeR + 0.012), 0.008, -0.002]), 0.014))
    naso = []
    for w_, mc in ((wingL, mcL), (wingR, mcR)):
        d, t = seg_dist(Pp, w_, mc + np.array([np.sign(mc[0]) * 0.006, 0.0, -0.006]))
        naso.append(np.exp(-(d / 0.008) ** 2))
    chn = gauss(Pp, chin + np.array([0, 0.004, 0.008]), 0.016)
    neck = smoothstep(0.01, 0.03, chin[2] - Pp[:, 2]) * smoothstep(-0.02, 0.02, -(Pp[:, 1] - chin[1] - 0.04))
    f = front
    return np.stack([fore * f, glab, crow[0], crow[1]], 1), np.stack([naso[0], naso[1], chn, neck], 1)


def normal_from(hfun, Pp, eps=0.00025):
    hx = (hfun(Pp + Tx * eps) - hfun(Pp - Tx * eps)) / (2 * eps)
    hy = (hfun(Pp + Bx * eps) - hfun(Pp - Bx * eps)) / (2 * eps)
    n = np.stack([-hx, -hy, np.ones_like(hx)], 1)
    return n / np.linalg.norm(n, axis=1, keepdims=True)


interp_cache = {"lip": lipT}
# ---------------- procedural-v3 skin: zones + multi-octave height (skin_v3.py)
import skin_v3 as SV
_LM = {"eyeL": eyeC["L"], "eyeR": eyeC["R"], "eyeRad": eyeR, "noseTip": noseTip, "lipC": lipC, "mcL": mcL, "mcR": mcR,
       "chin": chin, "browZ": browZ}
ZONES = SV.zones(Pt, _LM)
_scalp_soft = None
age = (look["macros"]["age"] - 0.45) / 0.15
log("normals")
import hair_v3 as _H3
_scalp_soft = _H3.hair_weight(Pt, rep["joints"], earT, np.zeros(len(Pt)), seed=look["seed"], soft=3.0, hv=look["hair"].get("v3"))
def base_height(Pp, _z=ZONES):
    # the zones are evaluated at the texel; the finite-difference offsets are sub-texel, so they are reused as is
    return SV.height_v3(Pp, NZ, _z, interp_cache["lip"], earT, float(look.get("ageYears", 25)), eyeC, eyeR, browZ, _scalp_soft)
Nb = normal_from(base_height, Pt)
# the static part of the expression lines for an older face (tiny), baked into the base normal
# none below 30: forehead lines on a 24-year-old read as age (review item 5)
age_years = float(look.get("ageYears", 25))
static_k = 0.0   # procedural-v3: static age lines live in skin_v3.height_v3 (finer, broken, zone-limited)
Nw = normal_from(lambda q: wrinkle_height(q, age), Pt)
if static_k > 0:
    Ns = normal_from(lambda q: base_height(q) + static_k * wrinkle_height(q, age), Pt)
    Nb = Ns
Nstretch = normal_from(lambda q: 0.35 * base_height(q), Pt)
log("albedo")

# ------------------------------------------------------------------ albedo (linear, then sRGB)
sk = look["skin"]
# G9 (TEACHER-VISUAL H7): the albedo is anchored on the Monk Skin Tone hex of the look's band, times a per-look,
# per-channel gain that the closed loop solves (render under the stage rig -> cheek/forehead/jaw L*a*b* -> rescale;
# scripts/character/g9.mjs writes skin.albedoGain). The look's old "base" hex was a designer colour, 2-3 MST steps light
# and too orange when used as albedo (review item 1); shade and lip keep their designed ratios to that hex.
MST_HEX = {1: "#f6ede4", 2: "#f3e7db", 3: "#f7ead0", 4: "#eadaba", 5: "#d7bd96", 6: "#a07e56", 7: "#825c43",
           8: "#604134", 9: "#3a312a", 10: "#292420"}
design = hex_lin(sk["base"])
gain = np.array(sk.get("albedoGain", [1.0, 1.0, 1.0]))
base = hex_lin(MST_HEX[int(sk["mst"])]) * gain
shade = base * hex_lin(sk["shade"]) / design
lip = base * hex_lin(sk["lip"]) / design
_ll = lip @ np.array([0.2126, 0.7152, 0.0722])
lip = lip * (1 - sk.get("lipDesat", 0.2)) + _ll * sk.get("lipDesat", 0.2)       # no lipstick read (review item 9)
hairc = hex_lin(look["hair"]["color"])
browc = hex_lin(look.get("browColor", look["hair"]["color"]))
mel = NZ.fbm(Pt * 18.0, 3) * 0.5 + NZ.fbm(Pt * 70.0 + 3.3, 2) * 0.25 + NZ(Pt * 400.0) * 0.12
A = base[None, :] * (1 + 0.08 * mel[:, None])
# shade colour in creases/periphery: under-eye, upper-lid crease, sides of the nose, neck
peri = sum(gauss(Pt, eyeC[s] + np.array([0, -0.004, -eyeR * 0.9]), 0.011) for s in "LR")
lidc = sum(gauss(Pt, eyeC[s] + np.array([0, -0.006, eyeR * 0.55]), 0.008) for s in "LR")
neckd = smoothstep(0.0, 0.03, chin[2] - Pt[:, 2])
sh = np.clip(0.55 * peri + 0.45 * lidc + 0.35 * neckd, 0, 1)
A = A * (1 - sh[:, None]) + (shade[None, :] * 0.92) * sh[:, None]
# haemoglobin zones: cheeks, nose tip, ears, chin (subtle for MST 6-8)
red = np.array([0.62, 0.22, 0.18])
hz = 0.35 * sum(gauss(Pt, eyeC[s] + np.array([np.sign(eyeC[s][0]) * 0.012, -0.004, -0.03]), 0.02) for s in "LR")
hz += 0.3 * gauss(Pt, noseTip, 0.01) + 0.45 * earT + 0.15 * gauss(Pt, chin, 0.015)
hz = np.clip(hz, 0, 1) * 0.16
A = A * (1 - hz[:, None]) + (A * red / red.mean()) * hz[:, None]
# lips: vermilion colour with a soft border; slightly darker line at the closure
lt = smoothstep(0.12, 0.88, lipT)                  # feathered border (was 0.25-0.75: a hard lipstick edge)
lipcol = lip[None, :] * (1 + 0.05 * NZ(Pt * 260)[:, None])
LC = float(sk.get("lipCoverage", 0.4))             # was 0.62
A = A * (1 - LC * lt[:, None]) + lipcol * (LC * lt[:, None])
# stubble (one look): fine dark speckle over the beard area, never on the lips
if sk.get("stubble"):
    ez = eyeC["L"][2]
    beard = smoothstep(ez - 0.028, ez - 0.05, Pt[:, 2]) * (1 - lt) * smoothstep(-0.8, -0.4, Nt[:, 2])
    beard *= (1 - gauss(Pt, noseTip, 0.014)) * (1 - earT) * (Pt[:, 1] < chin[1] + 0.07)
    beard *= 1 - 0.8 * smoothstep(noseTip[2] - 0.012, noseTip[2] - 0.004, Pt[:, 2]) * smoothstep(0.022, 0.035, np.abs(Pt[:, 0]))
    dots = np.clip(NZ(Pt * 2600.0) * 2.2 + 0.2, 0, 1) * np.clip(NZ(Pt * 1300.0 + 7) * 1.5 + 0.5, 0, 1)
    sb = sk["stubble"] * beard * (0.25 + 0.75 * dots)
    A = A * (1 - 0.55 * sb[:, None]) + hairc[None, :] * (0.55 * sb[:, None])
# procedural-v3 albedo: mottling, periorbital/perioral pigment, redness, a natural lip, moles (skin_v3.albedo_v3)
_sk = dict(sk)
_sk["moles"] = [(eyeC["L"] + np.array([0.019, -0.010, -0.036]), 0.0007), (mcR + np.array([-0.012, 0.004, -0.016]), 0.0006)]
A = SV.albedo_v3(A, Pt, NZ, ZONES, lipT, base, shade, lip, _sk)
# painted brows: dense directional strands around the brow cards (the B+ brows; under the cards on H)
bd, _ = btree.query(Pt)
bmask = (1 - smoothstep(0.0012, 0.0026, bd)) * front
strand = np.clip(NZ(np.stack([Pt[:, 0] * 900, Pt[:, 2] * 220 + Pt[:, 0] * 300, Pt[:, 1] * 400], 1)) * 1.6 + 0.4, 0, 1)
bp = np.clip(bmask * (0.45 + 0.55 * strand), 0, 1) * 0.72
A_H = A * (1 - 0.35 * bp[:, None]) + browc[None, :] * (0.35 * bp[:, None])   # H: cards carry the brow; a faint under-tone only
A = A * (1 - bp[:, None]) + browc[None, :] * bp[:, None]
# scalp under the hair: hair colour with strand streaks along the flow (the opaque core the cards sit on)
flow = np.clip(NZ(np.stack([Pt[:, 0] * 1400, Pt[:, 1] * 80, Pt[:, 2] * 80], 1)) * 1.5 + 0.5, 0, 1)
# procedural-v3: the designed hairline evaluated per TEXEL (the scalp vertices are 2-3 cm apart, so a per-vertex weight
# blurs the hairline into a smear); a seeded irregular edge, plus sparse streaks just outside it (fine baby hair)
import hair_v3
_hwT = hair_v3.hair_weight(Pt, rep["joints"], earT, np.zeros(len(Pt)), seed=look["seed"], soft=1.1, hv=look["hair"].get("v3"))
_hwS = hair_v3.hair_weight(Pt, rep["joints"], earT, np.zeros(len(Pt)), seed=look["seed"], soft=4.0, hv=look["hair"].get("v3"))
_streak = np.clip(NZ(np.stack([Pt[:, 0] * 2600, Pt[:, 1] * 300, Pt[:, 2] * 300], 1)) * 2.2 - 0.3, 0, 1)
scalpT = np.clip(_hwT + 0.45 * _streak * np.clip(_hwS - _hwT, 0, 1) * 2.0, 0, 1)
hl = smoothstep(0.3, 0.7, scalpT) * (1 - lt)
hairline = hl * (0.8 + 0.2 * flow)
_hl = (hairc[None, :] * (0.6 + 0.3 * flow[:, None]))
A = A * (1 - hairline[:, None]) + _hl * hairline[:, None]
A_H = A_H * (1 - hairline[:, None]) + _hl * hairline[:, None]
# flush (look option): pre-baked cheek tint is OFF here; delighted flush is a runtime uniform on H.

# ------------------------------------------------------------------ packed: cavity, roughness, thickness, AO
cav = np.clip(1 + 2.2 * pores(Pt), 0, 1)
tz = gauss(Pt, np.array([0, eyeC["L"][1] - 0.01, browZ + 0.03]), 0.03) + gauss(Pt, noseTip, 0.015)
# min roughness 0.42 and less T-zone gloss: plum's forehead read oily (review item 14); specular also scales down for
# darker MST bands through the cavity channel (the shader multiplies the GGX lobes by it)
rough = np.clip(0.56 - 0.05 * tz - 0.08 * lt + 0.25 * hairline, 0.42, 0.85)
specK = float(np.clip(1.0 - 0.1 * (int(sk["mst"]) - 6), 0.6, 1.0))
thick = np.clip(0.75 * earT + 0.5 * gauss(Pt, noseTip + np.array([0, 0.006, -0.004]), 0.008) + 0.3 * (sum(gauss(Pt, eyeC[s] + np.array([0, -eyeR, 0.004]), 0.006) for s in "LR")), 0, 1)
log("ao")
# vertex AO by hemisphere ray casts against the face + garment + hair (rest pose), interpolated per texel
occ_objs = [face] + [bpy.data.objects[n] for n in ("garment",) if n in bpy.data.objects]
allP, allT, off = [], [], 0
for ob in occ_objs:
    m_ = ob.data
    m_.calc_loop_triangles()
    t = np.empty(len(m_.loop_triangles) * 3, np.int64)
    m_.loop_triangles.foreach_get("vertices", t)
    allP.append(co(m_))
    allT.append(t.reshape(-1, 3) + off)
    off += len(m_.vertices)
bvh = BVHTree.FromPolygons([Vector(p) for p in np.concatenate(allP)], np.concatenate(allT).tolist())
rng = np.random.default_rng(5)
dirs = rng.normal(size=(24, 3))
dirs /= np.linalg.norm(dirs, axis=1, keepdims=True)
aov = np.ones(len(P))
for i in np.nonzero(region == 0)[0]:
    n = Nv[i]
    hits = 0
    tot = 0
    for d in dirs:
        if d @ n <= 0.05:
            d = d - 2 * (d @ n) * n
        hit = bvh.ray_cast(Vector(P[i] + n * 0.0006), Vector(d), 0.03)
        hits += hit[0] is not None
        tot += 1
    aov[i] = 1 - hits / tot
AOt = interp(aov)
AOt = np.clip(0.35 + 0.65 * AOt, 0, 1)

# ---- merged (ai-portrait-wrap hook): project + de-light the portraits onto the FINAL face UVs (identity/project.py),
# after v3's procedural maps (so v3's designed per-texel hairline is the scalp the projection blends over), G9-anchored.
# The subdivided H face uses linear UV subdivision, so these maps are its maps too.
if look.get("projection"):
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "identity"))
    import project as PJ
    A, A_H, Nb = PJ.apply(globals())
    # extend v3's designed hairline where the portraits show hair (project.py PJ_HAIR): those texels take the same
    # hair-coloured scalp as the rest of the hairline (above the brows only, never the lips)
    _hx = smoothstep(0.35, 0.65, PJ_HAIR) * smoothstep(browZ + 0.012, browZ + 0.03, Pt[:, 2]) * (1 - lt)
    _ext = np.clip(_hx - hl, 0, 1) * (0.8 + 0.2 * flow)
    A = A * (1 - _ext[:, None]) + _hl * _ext[:, None]
    A_H = A_H * (1 - _ext[:, None]) + _hl * _ext[:, None]
    hl = np.maximum(hl, _hx)
    log(f"hairline extended from the portraits on {int((_ext > 0.5).sum())} texels")
    # merged (fix 2): re-paint v3's designed hairline OVER the projection, so the scalp colour starts exactly where the
    # curve-generated cards root (hair_v3.hairline_el). Without it the portrait's own higher, centre-parted hairline
    # showed as a skin V between the cards at the crown (the parting wedge, VERDICT item 1)
    # inside the mask (hl > 0.5) the paint is full strength, so the bar "0 skin texels inside the hairline" is real
    _hl2 = np.clip(2.0 * hl, 0, 1) * (0.9 + 0.1 * flow)
    A = A * (1 - _hl2[:, None]) + _hl * _hl2[:, None]
    A_H = A_H * (1 - _hl2[:, None]) + _hl * _hl2[:, None]
    # the temple band: above the brows, off the ears, where NEITHER the portrait projection (alpha < 0.5) NOR the
    # painted hairline (hl < 0.5) covers the texel, the bare procedural skin showed as a light flap between the
    # portrait's own temple hair and v3's hairline (in the turntable at both temples). Those texels take the scalp.
    _pja_ = globals().get("PJ_ALPHA")
    if _pja_ is not None:
        _band = smoothstep(browZ + 0.012, browZ + 0.03, Pt[:, 2]) * (earT < 0.3) * (1 - lt)
        _fill = np.clip(_band * np.clip(1 - _pja_ / 0.5, 0, 1) * np.clip(1 - 2 * hl, 0, 1), 0, 1) * (0.9 + 0.1 * flow)
        A = A * (1 - _fill[:, None]) + _hl * _fill[:, None]
        A_H = A_H * (1 - _fill[:, None]) + _hl * _fill[:, None]
        hl = np.maximum(hl, _fill)
        log(f"temple band filled on {int((_fill > 0.5).sum())} texels")
# merged gate (VERDICT item 1, the parting wedge): texels INSIDE the hairline mask (designed hairline weight > 0.5, off
# the lips) whose final H albedo is nearer the skin colour than the hair colour. Bar 0.
_inmask = (hl > 0.5)
_skin_ref = np.median(A_H[(hl < 0.05) & (front > 0.5)], axis=0)
_dS = np.linalg.norm(A_H[_inmask] - _skin_ref, axis=1)
_dHc = np.linalg.norm(A_H[_inmask] - hairc, axis=1)
# the gap the old check missed: texels above the brows, front-facing, that neither the projection (alpha < 0.5) nor
# the painted hairline (hl < 0.5) covers, i.e. bare procedural skin where the portrait and the cards both expect hair
_pja = globals().get("PJ_ALPHA")
_gap = int(((hl < 0.5) & (_pja < 0.5) & (Pt[:, 2] > browZ + 0.03) & (earT < 0.3) & (lt < 0.5)).sum()) if _pja is not None else None
WEDGE = {"maskTexels": int(_inmask.sum()), "skinAlbedoTexels": int((_dS < _dHc).sum()), "uncoveredGapTexels": _gap,
         "skinRefLin": np.round(_skin_ref, 4).tolist(), "hairLin": np.round(hairc, 4).tolist()}
log(f"wedge check: {WEDGE['skinAlbedoTexels']} skin-albedo texels of {WEDGE['maskTexels']} inside the hairline mask; {_gap} uncovered gap texels")
# ------------------------------------------------------------------ write skin maps
def img(vals, ch):
    out = np.zeros((R, R, ch), np.float32)
    out[cov] = vals.reshape(len(vals), ch)
    return dilate(out, cov)


for nm_, AA in (("skin_albedo.png", A), ("skin_albedo_H.png", A_H)):
    A_ = img(lin2srgb(AA), 3)
    # white patch (teeth/tongue/bag UVs point here): neutral; the shader colours those regions itself
    A_[int(R * 0.985):, int(R * 0.985):] = 1.0
    save(nm_, A_)
enc = lambda n: n * 0.5 + 0.5
Nimg = img(enc(Nb), 3)
Nimg[int(R * 0.985):, int(R * 0.985):] = (0.5, 0.5, 1.0)
save("skin_normal.png", Nimg)
save("skin_wrinkle.png", img(enc(Nw), 3))
save("skin_wrinkle_stretch.png", img(enc(Nstretch), 3))
mA, mB = masks(Pt)
save("skin_maskA.png", img(mA, 4))
save("skin_maskB.png", img(mB, 4))
_brk = np.clip(0.88 + 0.22 * NZ.fbm(Pt * 260.0 + 9.1, 2), 0.6, 1.2)          # specular breakup (mid frequency)
save("skin_packed.png", img(np.stack([np.clip(cav * specK * _brk, 0, 1), rough, thick, AOt], 1), 4))
_DT = SV.detail_map(Pt, NZ, ZONES, lipT, earT, _scalp_soft, eyeC, eyeR)
save("skin_detail.png", img(_DT, 4))
_MT = SV.micro_tile(seed=look["seed"])
Image.fromarray(to8(_MT), "RGBA").save(os.path.join(OUT, "skin_micro.png"), optimize=True)
log("skin maps written")

# ------------------------------------------------------------------ garment atlas
G = bpy.data.objects["garment"]
gtris, guvt = mesh_tris(G)
GR = 1024
TRI2, BAR2 = raster(guvt, GR)
cov2 = TRI2 >= 0
VI2 = gtris[TRI2[cov2]]
b2 = BAR2[cov2]
gi = lambda a: (a[VI2] * (b2 if a.ndim == 1 else b2[:, :, None])).sum(1)
GP = co(G.data)
gPt = gi(GP)
gEdge = gi(attr(G, "gEdge"))
gLayer = np.round(gi(attr(G, "gLayer")))
gk = look["garment"]
col = np.zeros((len(gPt), 3))
rgh = np.full(len(gPt), 0.8)
th = np.arctan2(gPt[:, 0], -(gPt[:, 1] - rep["joints"]["joint-neck"][1]))
arc = th * 0.13                                   # ~ metres around the torso
weave = NZ(np.stack([gPt[:, 0] * 3000, gPt[:, 1] * 3000, gPt[:, 2] * 3000], 1)) * 0.5 + 0.5
fine = 0.94 + 0.06 * weave
inner = gLayer == 0
outer = gLayer == 1
kind = gk["kind"]
if kind == "kurti-jacket":
    # procedural-v3: kurti cotton with a tone-on-tone block-print buti (small dot rosettes on a half-drop grid)
    kc = hex_lin(gk["base"])
    uu, vv = arc / 0.026, gPt[:, 2] / 0.026
    vv2 = vv + 0.5 * (np.floor(uu) % 2)
    du, dv = (uu % 1.0) - 0.5, (vv2 % 1.0) - 0.5
    rr = np.hypot(du, dv)
    ros = np.clip(1 - np.abs(rr - 0.16) / 0.05, 0, 1) * (0.5 + 0.5 * np.cos(np.arctan2(dv, du) * 6)) + np.clip(1 - rr / 0.06, 0, 1)
    printc = kc * np.array([0.78, 0.86, 0.86])
    ink = np.clip(ros * (0.75 + 0.25 * NZ(gPt * 900)), 0, 1)[:, None] * (0.85 + 0.15 * NZ(gPt * 60))[:, None]
    col[inner] = (kc * fine[:, None] * (1 - ink) + printc * ink)[inner]
    # denim: indigo warp with a diagonal twill, slub, fading on the high points, double topstitching on the placket,
    # single stitching 5 mm in from every collar / flap / front edge
    twill = 0.5 + 0.5 * np.sin((arc * 1.0 + gPt[:, 2]) * 2 * math.pi / 0.0012)
    slub = NZ(np.stack([gPt[:, 0] * 60, gPt[:, 1] * 60, gPt[:, 2] * 900], 1))
    den = hex_lin(gk["jacket"]) * (0.8 + 0.2 * twill[:, None]) * (0.9 + 0.12 * slub[:, None]) * (0.93 + 0.14 * NZ(gPt * 40)[:, None])
    col[outer] = den[outer]
    gPl = gi(attr(G, "gPlacket")) if "gPlacket" in G.data.attributes else np.full(len(gPt), 1.0)
    gPa = np.round(gi(attr(G, "gPart"))) if "gPart" in G.data.attributes else np.zeros(len(gPt))
    thread = hex_lin("#B98A4A")
    dash = (np.sin(gPt[:, 2] * 2 * math.pi / 0.0035 + gPt[:, 0] * 900) > -0.3)
    st_edge = outer & (np.abs(gEdge - 0.005) < 0.0006) & dash
    st_plk = outer & (gPa == 0) & ((np.abs(gPl - 0.030) < 0.0006) | (np.abs(gPl - 0.024) < 0.0006)) & dash
    col[st_edge | st_plk] = thread
    rgh[outer] = 0.9
elif kind == "shirt-tee":
    col[inner] = hex_lin(gk["tee"]) * fine[inner, None]
    # a woven plaid, not a grid: soft (cosine-profile) bands in two colours, the overlap darker, a thin light line
    u = arc / 0.022
    v = gPt[:, 2] / 0.022
    band = lambda x, w: np.clip(1 - np.abs(((x % 1.0) - 0.5) / w), 0, 1) ** 1.5
    bu, bv = band(u, 0.16), band(v, 0.16)
    thin = np.clip(band(u + 0.5, 0.05) + band(v + 0.5, 0.05), 0, 1)
    c0, c1 = hex_lin(gk["base"]), hex_lin(gk.get("check", gk["shade"]))
    mixw = np.clip(0.5 * bu + 0.5 * bv, 0, 1)
    sc = c0 * (1 - mixw[:, None]) + c1 * mixw[:, None]
    sc = sc * (1 - 0.18 * (bu * bv)[:, None]) * (1 + 0.18 * thin[:, None]) * (0.95 + 0.1 * weave[:, None])
    col[outer] = (sc * fine[:, None])[outer]
else:
    col[inner] = hex_lin(gk["blouse"]) * fine[inner, None]
    # handloom: fine warp streaks along the pallu; the border is trim along the strip's long edges (gEdge = distance
    # to them), a thin gold zari line inside it. (Rejected 2026-10-03: a texture-space band on an offset shell.)
    hl_ = hex_lin(gk["base"]) * (0.88 + 0.12 * NZ(np.stack([gPt[:, 0] * 1400, gPt[:, 1] * 1400, gPt[:, 2] * 90], 1))[:, None])
    col[outer] = (hl_ * fine[:, None])[outer]
    bw = float(gk.get("palluBorder", 0.012))
    border = outer & (gEdge < bw)
    col[border] = hex_lin(gk["border"]) * (0.85 + 0.15 * weave[border, None])
    gold = outer & (np.abs(gEdge - (bw + 0.0025)) < 0.0012)
    col[gold] = hex_lin("#B8955A")
# garment AO (hemisphere casts per vertex against face + garment): collars, lapels, the pallu over the blouse and the
# tee under the shirt get contact shading; the first build's tee was flat and unshaded (review item 7)
Gn = vnormals(G.data)
gao = np.ones(len(GP))
for i in range(len(GP)):
    n = Gn[i]
    hits = 0
    for d in dirs:
        if d @ n <= 0.05:
            d = d - 2 * (d @ n) * n
        hits += bvh.ray_cast(Vector(GP[i] + n * 0.0008), Vector(d), 0.04)[0] is not None
    gao[i] = 1 - hits / len(dirs)
col *= np.clip(0.45 + 0.55 * gi(gao), 0, 1)[:, None]
gA = np.zeros((GR, GR, 4), np.float32)
gA[cov2, :3] = lin2srgb(col)
gA[cov2, 3] = rgh
gA = dilate(gA, cov2)
import garments_v3                                        # registers the v3 patches (copper buttons, piping)
from parts import ACC_PATCH
for nm, (u_, v_) in ACC_PATCH.items():
    x, y = int(u_ * GR), int(v_ * GR)
    c = {"metal": lin2srgb(hex_lin("#2B2B2E")), "gold": lin2srgb(hex_lin("#D4AF37")), "lens": np.array([0.9, 0.95, 1.0]),
         "copper": lin2srgb(hex_lin("#8C5A32")), "piping": lin2srgb(hex_lin(gk.get("piping", "#C2410C")))}[nm]
    r = {"metal": 0.35, "gold": 0.3, "lens": 0.05, "copper": 0.32, "piping": 0.8}[nm]
    gA[y - 20:y + 20, x - 20:x + 20, :3] = c
    gA[y - 20:y + 20, x - 20:x + 20, 3] = r
save("garment_albedo.png", gA, "RGBA")
log("garment written")

# ------------------------------------------------------------------ hair atlas: procedural-v3 strand atlas (hair_v3)
import hair_v3
HA = hair_v3.make_atlas(hairc, seed=look["seed"])
HA[:, :, :3] = lin2srgb(HA[:, :, :3])
Image.fromarray(to8(HA), "RGBA").save(os.path.join(OUT, "hair_atlas.png"), optimize=True)

# ------------------------------------------------------------------ cards atlas: brows | lashes (MH CC0 alphas)
def card_tex(kind, name):
    d = os.path.join(USER_DATA, kind, name)
    f = [x for x in os.listdir(d) if x.endswith(".png")][0]
    return np.asarray(Image.open(os.path.join(d, f)).convert("RGBA").resize((1024, 1024), Image.LANCZOS)).astype(np.float32) / 255


# brows at 1024 px, full brow colour, alpha x1.3 (was 512 px, colour x0.6, alpha x1.9: tan, patchy, blobby; item 11)
Cb = card_tex("eyebrows", look["brows"])
Cl = card_tex("eyelashes", look["lashes"])
C = np.zeros((1024, 2048, 4), np.float32)
bc = lin2srgb(browc)
C[:, :1024, :3] = bc
# merged: on the projected face the brows are already in the albedo (the reference's own brows), so the H brow cards are
# THINNED to a sparse hair layer over them (look.browCards.alpha, default 1.6 = v3): full cards over projected brows
# read as drawn-on (VERDICT, ai-portrait-wrap defect 3). The cards also take the projected brows' tone, not pure brow hex.
_bcA = float(look.get("browCards", {}).get("alpha", 1.6))
_bcG = float(look.get("browCards", {}).get("alphaGamma", 1.0))
C[:, :1024, 3] = np.clip((Cb[:, :, 3] ** _bcG) * _bcA, 0, 1)
C[:, 1024:, :3] = lin2srgb(np.array([0.012, 0.010, 0.009]))
C[:, 1024:, 3] = Cl[:, :, 3]
Image.fromarray(to8(C), "RGBA").save(os.path.join(OUT, "cards_atlas.png"), optimize=True)
log("hair + cards written")
json.dump({"res": R, "texels": int(cov.sum()), "wedge": WEDGE if "WEDGE" in globals() else None, "landmarks": {"noseTip": noseTip.tolist(), "chin": chin.tolist(),
           "lipC": lipC.tolist(), "mcL": mcL.tolist(), "mcR": mcR.tolist(), "browZ": float(browZ)}},
          open(os.path.join(OUT, "tex.json"), "w"), indent=1)
log("done")

sys.stdout.flush()
os._exit(0)   # bpy 4.2 can segfault in interpreter teardown; everything is written by now
