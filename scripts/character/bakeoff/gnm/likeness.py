"""Likeness of the built gnm teal to the reference portraits, measured exactly as the merged fit loop measures it:
neutral H renders from the face camera re-centred on the turned head ("facec"; merged's face camera at yaw swings
the GNM head half out of frame) (shoot.mjs, the same viewer, light and texture as the evidence set), MediaPipe
landmarks on each render, the reference's 468 landmarks similarity-aligned (2D Procrustes on the interior points) INTO
the render, error = mean interior distance / the render's outer-eye-corner distance (NME, % IOD).
Pairs (render yaw = the reference's own MediaPipe yaw, as merged's fitloop does): front@0, q45_left@21, q45_right@26
(TRAIN views for the GNM fit), q3_left@18, q3_right@21 (HELD OUT: never fitted, never projected into the texture), and
q45_left/right@24 (merged's yaw-24 reprojection bar: <= 1.5 x front).
    python likeness.py  -> art/character/bakeoff/gnm/reports/likeness.json"""
import json, os, subprocess, time
import numpy as np
import sys
import gnm_model as G
ROW = sys.argv[sys.argv.index("--row") + 1] if "--row" in sys.argv else "gnm"     # --row merged: the same protocol on merged's GLB

MP = os.environ.get("MP_PY", "/tmp/claude-0/apw/venv/bin/python")
MODEL = os.environ.get("MP_MODEL", "/tmp/claude-0/apw/face_landmarker.task")
SH = os.path.join(G.CH, "bakeoff-gnm", "likeness" + ("" if ROW == "gnm" else "-" + ROW))
os.makedirs(SH, exist_ok=True)
REFD = os.path.join(G.ROOT, "art/character/bakeoff/merged/refs/teal")
REF = json.load(open(os.path.join(REFD, "landmarks.json")))
RG = json.load(open(os.path.join(G.ROOT, "art/character/bakeoff/merged/mp_regions.json")))
oval = np.isin(np.arange(468), RG["oval"])
PAIRS = {"front": 0, "q45_left": 21, "q45_right": 26, "q3_left": 18, "q3_right": 21, "q45_left@24": 24, "q45_right@24": 24}
# gnm, additionally: each 3/4 reference at the yaw the GNM fit's own camera solved for it (fit/teal.json reprojection
# yawDeg: MediaPipe under-reads these generated turns by 4-6 deg, so the MediaPipe-yaw renders carry a pose mismatch)
FIT = json.load(open(os.path.join(G.ART, "fit", "teal.json")))["reprojection"]
for k, kk in (("q45_left", "q45_left"), ("q45_right", "q45_right"), ("q3_left", "q3_left (held out)"), ("q3_right", "q3_right (held out)")):
    PAIRS[f"{k}@fit{round(abs(FIT[kk]['yawDeg']))}"] = round(abs(FIT[kk]["yawDeg"]))
yaws = sorted(set(PAIRS.values()))
subprocess.run(["node", os.path.join(G.HERE, "shoot.mjs"), "--row", ROW, "--yaws", ",".join(map(str, yaws)), "--out", SH, "--frame", "facec"], cwd=G.ROOT, check=True)
lmf = os.path.join(SH, "lm.json")
if os.path.exists(lmf):
    os.remove(lmf)
subprocess.run([MP, os.path.join(G.ROOT, "scripts/character/bakeoff/merged/identity/landmarks.py"), "--model", MODEL, "--out", lmf]
               + [os.path.join(SH, f"{ROW}_yaw{y}.png") for y in yaws], check=True, capture_output=True)
LM = json.load(open(lmf))


def sim2(A, B):
    ma, mb = A.mean(0), B.mean(0); A0, B0 = A - ma, B - mb
    U, S, Vt = np.linalg.svd(B0.T @ A0); D = np.eye(2); D[1, 1] = np.sign(np.linalg.det(U @ Vt)); Rm = U @ D @ Vt
    s = (S * np.diag(D)).sum() / (A0 ** 2).sum()
    return lambda X: s * (X - ma) @ Rm.T + mb


res = {}
for k, y in PAIRS.items():
    rv = k.split("@")[0]
    R = np.array(REF[rv]["lm"])[:468, :2]
    if LM.get(f"{ROW}_yaw{y}") is None:
        res[k] = None; continue
    Q = np.array(LM[f"{ROW}_yaw{y}"]["lm"])[:468, :2]
    f = sim2(R[~oval], Q[~oval])
    e = np.linalg.norm(f(R) - Q, axis=1) / np.linalg.norm(Q[33] - Q[263]) * 100
    P = lambda X, i, j: np.linalg.norm(X[i] - X[j]) / np.linalg.norm(X[33] - X[263])
    res[k] = {"interiorNME": round(float(e[~oval].mean()), 2), "all": round(float(e.mean()), 2), "contour": round(float(e[oval].mean()), 2),
              **{r: round(float(e[RG[r]].mean()), 2) for r in ("leye", "reye", "lips", "lbrow", "rbrow")},
              "ratios_ref_render": {n: [round(float(P(R, i, j)), 3), round(float(P(Q, i, j)), 3)] for n, (i, j) in
                                    {"faceWidth234_454": (234, 454), "noseChin1_152": (1, 152), "mouth61_291": (61, 291), "browEye105_159": (105, 159), "eyeOpen159_145": (159, 145)}.items()}}
front = res["front"]["interiorNME"]
out = {"method": __doc__.split("\n")[0], "date": time.strftime("%Y-%m-%d"), "pairs": res,
       "frontNME": front, "frontBar": 1.2, "frontPass": front <= 1.2,
       "yaw24_over_front": round(0.5 * (res["q45_left@24"]["interiorNME"] + res["q45_right@24"]["interiorNME"]) / front, 3),
       "q45_matched_over_front": round(0.5 * (res["q45_left"]["interiorNME"] + res["q45_right"]["interiorNME"]) / front, 3),
       "heldOut": {k: res[k]["interiorNME"] for k in ("q3_left", "q3_right")},
       "atFitYaw": {k: v["interiorNME"] for k, v in res.items() if "@fit" in k and v},
       "merged_for_comparison": "art/character/bakeoff/merged/refs/teal/fitloop.json (merged's own loop, same metric)"}
out["yaw24Pass"] = out["yaw24_over_front"] <= 1.5
out["row"] = ROW
json.dump(out, open(os.path.join(G.ART, "reports", "likeness.json" if ROW == "gnm" else f"likeness-{ROW}.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != "pairs"}, indent=1))
print({k: (v["interiorNME"] if v else None) for k, v in res.items()})
