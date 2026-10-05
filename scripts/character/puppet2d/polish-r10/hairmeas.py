"""r10: the hair cap's part line and silhouette extents of rendered frames (view 0,0,1024 = c-front frame), with hairfit.py's
detector, beside the fitted keys at 2/3 travel (the 20-degree target).   python3 hairmeas.py <rest.png> <yaw_m20.png> <yaw_p20.png>"""
import sys, json
import numpy as np
from PIL import Image
sys.argv += []
import importlib.util
spec = importlib.util.spec_from_file_location("hf", __file__.replace("hairmeas.py", "hairfit_lib.py")); hf = importlib.util.module_from_spec(spec); spec.loader.exec_module(hf)
fit = json.load(open("art/character/puppet2d/polish-r10/keys/hairfit.json"))
rest, m20, p20 = [Image.open(p).convert("RGB") for p in sys.argv[1:4]]
res = {}
for nm, im in (("rest", rest), ("m20", m20), ("p20", p20)):
    m, L = hf.hairmask(im); res[nm] = {"part": hf.part(L, m), "ext": hf.extents(m)}
F = fit["front"]
def tgt(side, y, k):
    a = F["ext"].get(str(y)); b = fit[side]["ext"].get(str(y))
    return None if not a or not b else round(a[k] + (b[k] - a[k]) * 2 / 3)
print("part  rest", res["rest"]["part"], "| m20", res["m20"]["part"], "target", round(F["part"] + (fit["L"]["part"] - F["part"]) * 2 / 3), "| p20", res["p20"]["part"], "target", round(F["part"] + (fit["R"]["part"] - F["part"]) * 2 / 3))
for y in range(100, 440, 40):
    r = res["rest"]["ext"].get(y); a = res["m20"]["ext"].get(y); b = res["p20"]["ext"].get(y)
    print(y, "rest", r, "| m20", a, "tgt", [tgt("L", y, 0), tgt("L", y, 1)], "| p20", b, "tgt", [tgt("R", y, 0), tgt("R", y, 1)])
