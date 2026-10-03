"""Step 2 (fallback path, no GPU): multi-view 3D landmark reconstruction from the generated portraits.
Orthographic bundle adjustment: unknown 3D landmarks X (468) and per-view rotation, scale and 2D shift, minimising the
2D reprojection error of MediaPipe's landmarks over the neutral views, with a weak prior on MediaPipe's own per-view
depth. Contour (face-oval) landmarks slide with the view, so they constrain only the frontal view; far-side landmarks
of turned views are dropped. Output in front-image pixel units, y up, z toward the camera.
    python3 recon.py --lm landmarks.json --regions mp_regions.json --views front,q3_left,q3_right,profile_left --out recon.json"""
import argparse, json
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation as Rot

ap = argparse.ArgumentParser()
ap.add_argument("--lm", required=True); ap.add_argument("--regions", required=True)
ap.add_argument("--views", default="front,q3_left,q3_right,profile_left"); ap.add_argument("--out", required=True)
ap.add_argument("--prior", type=float, default=0.15)
a = ap.parse_args()
LM = json.load(open(a.lm)); RG = json.load(open(a.regions))
views = [v for v in a.views.split(",") if LM.get(v)]
N = 468
oval = np.zeros(N, bool); oval[[i for i in RG["oval"] if i < N]] = True
P3 = {v: np.array(LM[v]["lm"])[:N] * np.array([1, -1, -1]) for v in views}      # (x, -y, -z): y up, z to camera
uv = {v: P3[v][:, :2] for v in views}

def procrustes(A, B):
    """similarity s, R, t minimising |s R A + t - B|"""
    ma, mb = A.mean(0), B.mean(0); A0, B0 = A - ma, B - mb
    U, S, Vt = np.linalg.svd(B0.T @ A0)
    D = np.eye(3); D[2, 2] = np.sign(np.linalg.det(U @ Vt))
    R = U @ D @ Vt; s = (S * np.diag(D)).sum() / (A0 ** 2).sum()
    return s, R, mb - s * R @ ma

X0 = P3["front"].copy()
init, prior = {}, {}
for v in views:
    s, R, t = procrustes(X0, P3[v])                 # view's 3D ~ s R X + t
    init[v] = (Rot.from_matrix(R).as_rotvec(), s, t[:2])
    si, Ri, ti = procrustes(P3[v], X0)              # the view's own 3D in the front frame (depth prior)
    prior[v] = si * P3[v] @ Ri.T + ti
yaw = {v: float(np.degrees(init[v][0][1])) for v in views}
mid = X0[:, 0].mean(); half = np.abs(X0[:, 0] - mid).max()
vis = {}
for v in views:
    m = np.ones(N, bool)
    if v != "front":
        m &= ~oval
        if abs(yaw[v]) > 12:                         # drop the far half of a turned face
            far = -np.sign(yaw[v])                   # rotation +y turns the face's +x side away from the camera
            m &= ~(far * (X0[:, 0] - mid) > 0.25 * half)
    vis[v] = m
nv = len(views)
def unpack(z):
    X = z[:3 * N].reshape(N, 3); C = z[3 * N:].reshape(nv, 6)
    return X, C
def resid(z):
    X, C = unpack(z); out = []
    for j, v in enumerate(views):
        rv, ls, t = C[j, :3], C[j, 3], C[j, 4:]
        if v == "front": rv, ls, t = np.zeros(3), 0.0, np.zeros(2)       # gauge
        Y = np.exp(ls) * (X @ Rot.from_rotvec(rv).as_matrix().T)
        r = (Y[:, :2] + t - uv[v]) * vis[v][:, None]
        out.append(r.ravel())
    # weak depth prior: the mean of the views' own 3D (MediaPipe's face model); x/y much weaker
    Pm = np.mean([prior[v] for v in views], 0)
    out.append((a.prior * (X[:, 2] - Pm[:, 2])))
    out.append((0.02 * (X[:, :2] - Pm[:, :2])).ravel())
    return np.concatenate(out)
z0 = np.concatenate([X0.ravel()] + [np.concatenate([init[v][0], [np.log(init[v][1])], init[v][2]]) for v in views])
r0 = resid(z0)
sol = least_squares(resid, z0, method="trf", x_scale="jac", max_nfev=200)
X, C = unpack(sol.x)
iod = np.linalg.norm(X[33] - X[263])
rep = {}
for j, v in enumerate(views):
    rv, ls, t = (np.zeros(3), 0.0, np.zeros(2)) if v == "front" else (C[j, :3], C[j, 3], C[j, 4:])
    Y = np.exp(ls) * (X @ Rot.from_rotvec(rv).as_matrix().T)
    e = np.linalg.norm(Y[:, :2] + t - uv[v], axis=1)[vis[v]]
    rep[v] = {"yawDeg": round(float(np.degrees(rv[1])), 1), "n": int(vis[v].sum()), "rmsPx": round(float(np.sqrt((e ** 2).mean())), 2),
              "rmsPctIOD": round(float(100 * np.sqrt((e ** 2).mean()) / np.linalg.norm(uv[v][33] - uv[v][263]) ), 2)}
    print(f"[recon] {v}: yaw {rep[v]['yawDeg']} deg, {rep[v]['n']} landmarks, rms {rep[v]['rmsPx']} px")
dz = X[:, 2] - np.mean([prior[v] for v in views], 0)[:, 2]
print(f"[recon] depth moved from the MediaPipe prior: median {np.median(np.abs(dz)) / iod * 100:.1f}% IOD, p90 {np.percentile(np.abs(dz), 90) / iod * 100:.1f}%")
json.dump({"views": views, "X": X.round(3).tolist(), "iodPx": round(float(iod), 2), "reprojection": rep,
           "depthDeltaFromPriorPctIOD": {"median": round(float(np.median(np.abs(dz)) / iod * 100), 2), "p90": round(float(np.percentile(np.abs(dz), 90) / iod * 100), 2)},
           "cameras": {v: C[j].round(5).tolist() for j, v in enumerate(views)}}, open(a.out, "w"))
