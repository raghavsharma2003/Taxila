"""Assemble and pack the lamp1 puppet: layers/geom.json (+ lid keys + yaw keys) gets the per-face constant block
("face", read by runtime/face.js; every value read on this front in rig space, 2026-10-10), the backdrop and the views,
then every layer goes to WebP as r8's pack.py did (feature layers q90, smooth fields q82, alpha q90) into
art/character/puppet2d/lamp1/ with a minified geom.json and a pack report (bytes, rest SSIM of WebP vs PNG composite).
The interior strip (teeth / cavity / tongue rows, 128 x 64) is r8's, recoloured to the flat palette (interior.py).
    python3 -I pack.py"""
import io, json, os, gzip, shutil
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
L = f"{S}/layers"
P = "/home/user/Taxila/art/character/puppet2d/lamp1"
os.makedirs(P, exist_ok=True)
g = json.load(open(f"{L}/geom.json"))
ml = g.pop("mouthLine")
FACE = {
    "px": {"cx": 520, "cy": 405, "rx": 300, "ry": 395, "A": 205, "fcx": 525, "fcy": 485, "fsx": 120, "fsy": 160, "B": 95, "gain": 1.0, "pivot": [525, 740]},
    "noseZ": {"x": 525, "y": 520, "s": 24, "a": 26}, "cheekZ": {"xs": [440, 610], "y": 565, "s": 45, "a": 8},
    "mid": 525, "hw": 196,
    "sil": {"y": [300, 410, 705, 805], "chin": [575, 705, 735, 815], "chinW": 0.75},
    "feat": {"box": [395, 310, 655, 714], "nose": [525, 522, 27, 24], "noseY": [455, 590], "wing": [25, 538, 11, 13], "bindi": [525, 343, 20, 18], "bindiY": 390, "mouth": [525, 44], "mouthY": [565, 590, 655, 705]},
    # r7's hairline pins are off: her brow tails sit ~27 px clear of the temple hair, and pinning dragged the hair edge up
    # off the skin plate under it (a light block above a raised brow)
    "pins": [[-2000, -2000], [-2000, -2000]], "pinS": 30,
    "cheeks": {"L": [445, 562], "R": [607, 562], "s": 42}, "wink": {"L": [425, 510], "R": [626, 510], "s": 48},
    "jawBroad": {"y": [606, 672], "s": 180}, "narrow": {"ax": [40, 170], "y": 660, "s": 70},
    "body": {"cx": 525, "hem": 1024, "sh": [165, 280], "shY": [800, 880, 990, 1024], "bw": [880, 1024], "rollY": [800, 870], "neckY": [815, 735], "neckW": [150, 200]},
    "anchor": [525, 290, 120], "bunZ": -45, "lockBun": {"R": None},
    # the turn's far-side shadow is a flat violet plane (Prakash: shadows are violet, never grey)
    "shade": {"face": {"L": [325, 525], "R": [525, 725], "amt": 0.16}, "hair": {"L": [235, 650], "R": [400, 815], "amt": 0.1}, "tint": [0.30, 0.16, 0.46]},
    "noseShade": [525, 515, 497, 1],
    "glints": [[306, 547], [748, 546]], "glintA": 0.55,
    "k": 0.94, "ke": 1.0, "kb": 1.0,
    # her sclera carries the painted lid shadow: no procedural shade at rest, 0.3 once the lid moves; her corners are pointed
    "eye": {"shade": [0.0, 0.3], "round": 3},
    "mouth": {"lineX0": ml["x0"], "lineStep": ml["step"], "line": ml["y"], "cx": 525, "hwL": 73, "hwR": 75, "tU": 17, "tL": 26, "cy": 605, "jaw": [606, 664, 135], "k": 1.12},
}
g["face"] = FACE
g["clear"] = [246 / 255, 209 / 255, 152 / 255]   # her own cream: the layers keep the art's pale outline gaps, cut against it
# 4-element views [x0, y0, w, h]: the region that must show, fitted contain-and-centred into any window (runtime render)
#   close  = the whole head, hair top (y 42) to the bun's foot (771): the 80 px SpeechRow circle
#   medium = head + neck + shoulders, y 25-900: every window (desk 325x316 .. 440x440, Home 319x172 wide,
#            Meet 220x222, Summary 78x100); below y ~930 the cardigan reaches the rest-space edges, so a wide window's
#            extra width never shows a cut sleeve
g["views"] = {"close": [160, 40, 730, 730], "medium": [110, 25, 830, 875]}
g["src"] = "docs/design/round4/asha/images/rig-b.webp, rig space = crop (162, 0)-(862, 700) x 1.4629 (rigspace.py), skin graded half-way to MST 6 (skin.py)"
json.dump(g, open(f"{L}/geom-final.json", "w"), indent=1)
import subprocess
subprocess.run(["python3", "-I", f"{os.path.dirname(os.path.abspath(__file__))}/interior.py", f"{L}/interior.webp"], check=True)   # r8's strip, recoloured flat

names = [n for n in g["rects"] if n != "bg"] + ["interior"]
HIGH = {"mouth_rest", "irisL", "irisR", "scleraL", "scleraR", "lidL", "lidR", "lowerL", "lowerR", "browL", "browR", "catchL", "catchR",
        "lidmidL", "lidmidR", "lidshutL", "lidshutR", "interior"}
rows, total = {}, 0
for n in names:
    if n == "interior":
        shutil.copy(f"{L}/interior.webp", f"{P}/interior.webp")
    else:
        im = Image.open(f"{L}/{n}.png").convert("RGBA")
        im.save(f"{P}/{n}.webp", "WEBP", quality=90 if n in HIGH else 82, alpha_quality=90, method=6)
    rows[n] = os.path.getsize(f"{P}/{n}.webp"); total += rows[n]
def rnd(o):
    if isinstance(o, float): return round(o, 2)
    if isinstance(o, list): return [rnd(v) for v in o]
    if isinstance(o, dict): return {k: rnd(v) for k, v in o.items() if k not in ("geom",)}
    return o
s = json.dumps(rnd(g), separators=(",", ":"))
open(f"{P}/geom.json", "w").write(s)
gz = len(gzip.compress(s.encode()))
def comp(src, ext):
    out = np.zeros((1024, 1024, 3), np.float32) + np.array(g["clear"]) * 255
    for n in ["hairback", "bun", "body", "ears", "face", "browL", "browR", "mouth_rest", "lockbed", "hair", "lockL", "lockR"]:
        r = g["rects"][n]
        a = np.asarray(Image.open(f"{src}/{n}.{ext}").convert("RGBA")).astype(np.float32) / 255
        al = a[..., 3:4]
        out[r[1]:r[3], r[0]:r[2]] = out[r[1]:r[3], r[0]:r[2]] * (1 - al) + a[..., :3] * al
    return out
def ssim(a, b):
    a = a.mean(2); b = b.mean(2); f = lambda x: ndi.gaussian_filter(x, 1.5)
    ma, mb = f(a), f(b); va = f(a * a) - ma * ma; vb = f(b * b) - mb * mb; cv = f(a * b) - ma * mb
    return ((2 * ma * mb + 1e-4) * (2 * cv + 9e-4) / ((ma * ma + mb * mb + 1e-4) * (va + vb + 9e-4)))
A, B = comp(L, "png"), comp(P, "webp")
sv = float(ssim(A, B)[40:760, 220:830].mean())
rep = {"date": "2026-10-10", "layers_webp_bytes": total, "geom_json_bytes": len(s), "geom_json_gzip_bytes": gz, "payload_bytes_wire": total + gz,
       "payload_bytes_raw": total + len(s), "ssim_webp_vs_png_head": round(sv, 4), "per_layer": rows}
json.dump(rep, open(f"{P}/pack-report.json", "w"), indent=1)
manifest = {"rev": "lamp1", "date": "2026-10-10", "pack": {**rows, "geom.json": len(s)}, "packBytes": total + len(s)}
json.dump(manifest, open(f"{P}/manifest.json", "w"), indent=1)
print({k: v for k, v in rep.items() if k != "per_layer"})
