"""Likeness to the reference: MediaPipe landmarks on a neutral render of the built head vs on the generated portrait,
2D similarity-aligned (Procrustes), error as % of the outer-eye-corner distance (IOD, landmarks 33-263), the usual
face-alignment NME. Reported over all 468, the interior (no contour), and per region.
    python likeness.py --ref landmarks.json:front --render lm.json:teal_yaw0 --regions mp_regions.json"""
import argparse, json
import numpy as np
ap = argparse.ArgumentParser()
ap.add_argument("--pairs", nargs="+", required=True, help="refFile:refView=renderFile:renderView")
ap.add_argument("--regions", required=True); ap.add_argument("--out")
a = ap.parse_args()
RG = json.load(open(a.regions))
def sim2(A, B):
    ma, mb = A.mean(0), B.mean(0); A0, B0 = A - ma, B - mb
    U, S, Vt = np.linalg.svd(B0.T @ A0); D = np.eye(2); D[1, 1] = np.sign(np.linalg.det(U @ Vt)); Rm = U @ D @ Vt
    s = (S * np.diag(D)).sum() / (A0 ** 2).sum()
    return lambda X: s * (X - ma) @ Rm.T + mb
res = {}
for pr in a.pairs:
    r, q = pr.split("=")
    rf, rv = r.rsplit(":", 1); qf, qv = q.rsplit(":", 1)
    R = np.array(json.load(open(rf))[rv]["lm"])[:468, :2]; Q = np.array(json.load(open(qf))[qv]["lm"])[:468, :2]
    oval = np.isin(np.arange(468), RG["oval"])
    f = sim2(Q[~oval], R[~oval])
    e = np.linalg.norm(f(Q) - R, axis=1) / np.linalg.norm(R[33] - R[263]) * 100
    row = {"all": round(float(e.mean()), 2), "interior": round(float(e[~oval].mean()), 2), "contour": round(float(e[oval].mean()), 2)}
    for k in ("leye", "reye", "lips", "lbrow", "rbrow"):
        row[k] = round(float(e[RG[k]].mean()), 2)
    # face proportions: contour width at the cheekbones / eye-corner distance, nose-to-chin / IOD, mouth width / IOD
    P = lambda X, i, j: np.linalg.norm(X[i] - X[j]) / np.linalg.norm(X[33] - X[263])
    row["ratios"] = {k: [round(float(P(R, i, j)), 3), round(float(P(Q, i, j)), 3)] for k, (i, j) in
                     {"faceWidth234_454": (234, 454), "noseChin1_152": (1, 152), "mouth61_291": (61, 291), "browEye105_159": (105, 159), "eyeOpen159_145": (159, 145)}.items()}
    res[pr.split("=")[1]] = row
    print(qv, "vs", rv, json.dumps(row))
if a.out: json.dump(res, open(a.out, "w"), indent=1)
