#!/usr/bin/env python3
"""Arm B gates (TECH-PLAN 5.5 subset, measured on the built .blend):
G1 names 82/82 on the face; G2 bounded (max key delta); G3 mirror (rest skin vs its mirror, max nearest distance);
G4 lid seal (upper vs lower margin gap at blink, also with lookDown / squint + correctives, and at partial weights);
lid vertices inside the eyeball; G5 lip seal at rest and PP (upper vs lower lip-line gap).
    python gates.py BUILD/stage.blend BUILD/stage.meta.json OUT.json
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import lib as L  # noqa: E402
import shapes as SH  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
bpy.ops.wm.open_mainfile(filepath=args[0])
meta = json.load(open(args[1]))
face = bpy.data.objects["face"]
kb = face.data.shape_keys.key_blocks
names = [k.name for k in kb[1:]]
rest = L.co(face.data)
n = len(rest)
D = {}
for k in kb[1:]:
    a = np.empty(n * 3); k.data.foreach_get("co", a)
    D[k.name] = a.reshape(-1, 3) - rest
rep = {}
want = SH.all_keys()
rep["G1_names"] = {"have": len(set(want) & set(names)), "want": len(want), "missing": sorted(set(want) - set(names))}
rep["G2_maxDeltaMM"] = {k: round(float(np.linalg.norm(v, axis=1).max() * 1000), 2) for k, v in D.items()}
ns = meta["nskin"]
S = rest[:ns][np.array(meta["used"])]
from scipy.spatial import cKDTree  # noqa: E402
dm, _ = cKDTree(S * np.array([-1, 1, 1])).query(S)
rep["G3_mirrorMaxMM"] = round(float(dm.max() * 1000), 3)


def posed(bs):
    for k, (p, q) in SH.CORRECTIVES.items():
        bs[k] = bs.get(p, 0) * bs.get(q, 0)
    P = rest.copy()
    for k, w in bs.items():
        if k in D and w:
            P += D[k] * w
    return P


g4 = {}
inside = {}
for side, nm in (("L", "Left"), ("R", "Right")):
    E = meta["eye"][side]
    up = np.array(E["upper"]); lo = np.array(E["lower"])
    C = np.array(E["C"]); r = E["r"]
    lids = np.array(E["lidIds"])
    for label, bs in (("blink", {f"eyeBlink{nm}": 1}), ("blink+lookDown", {f"eyeBlink{nm}": 1, f"eyeLookDown{nm}": 1}),
                      ("blink+squint", {f"eyeBlink{nm}": 1, f"eyeSquint{nm}": 1}), ("blink+cheekSquint", {f"eyeBlink{nm}": 1, f"cheekSquint{nm}": 1}),
                      ("blink0.5", {f"eyeBlink{nm}": 0.5}), ("rest", {})):
        P = posed(dict(bs))
        gap = np.linalg.norm(P[up] - P[lo], axis=1)
        g4[f"{side}:{label}"] = {"maxGapMM": round(float(gap.max() * 1000), 2), "meanGapMM": round(float(gap.mean() * 1000), 2)}
        d = np.linalg.norm(P[lids] - C, axis=1)
        inside[f"{side}:{label}"] = int((d < r * 1.0).sum())
rep["G4_lidGap"] = g4
rep["lidVertsInsideBall"] = inside
mu = np.array(meta["mouth"]["upper"]); ml = np.array(meta["mouth"]["lower"])
g5 = {}
for label, bs in (("rest", {}), ("PP", {"viseme_PP": 1}), ("jaw0.3+close0.3", {"jawOpen": 0.3, "mouthClose": 0.3}), ("aa", {"viseme_aa": 1})):
    P = posed(dict(bs))
    gap = np.linalg.norm(P[mu] - P[ml], axis=1)
    g5[label] = {"p95MM": round(float(np.percentile(gap, 95) * 1000), 2), "maxMM": round(float(gap.max() * 1000), 2)}
rep["G5_lipGap"] = g5
json.dump(rep, open(args[2], "w"), indent=1)
print(json.dumps({k: v for k, v in rep.items() if k != "G2_maxDeltaMM"}, indent=1))
sys.stdout.flush()
os._exit(0)
