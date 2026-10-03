"""Closed-loop landmark fit (the "landmark-pinned solve" measured in the same space as the likeness metric).

The open-loop wrap (wrap.py) moves our mesh's landmark points onto the reconstructed 3D landmarks. MediaPipe does not
place landmarks on a CG render exactly where it places them on a photo, so the open loop leaves a bias (measured:
eye opening 0.143 IOD vs 0.110 on the portrait). This loop renders the built head, runs MediaPipe on the render, and
feeds the 2D error back as a per-landmark correction (metres, Blender axes) that wrap.py adds to its targets:
  front view (yaw 0)  -> x and z (frontal plane),
  q3 view (yaw ~24)   -> depth, from the x error left over after the frontal x correction;
damped (step 0.6), contours frontal only, symmetrised by wrap.py's field symmetrisation. Held out: q3_right.
    python3 fitloop.py --iters 3
"""
import argparse, json, math, os, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--iters", type=int, default=3)
ap.add_argument("--step", type=float, default=0.6)
ap.add_argument("--q3yaw", type=float, default=24)
a = ap.parse_args()
ROOT = "/home/user/Taxila"
D = f"{ROOT}/art/character/bakeoff/ai-portrait-wrap"
S = f"{ROOT}/scripts/character/bakeoff/ai-portrait-wrap"
LOOK = f"{D}/looks/teal.json"
BD = "/tmp/claude-0/apw/build/teal"
SHOTS = "/tmp/claude-0/apw/loop"
PY = "/tmp/claude-0/char/bpyenv/bin/python"
MP = "/tmp/claude-0/apw/venv/bin/python"
os.makedirs(SHOTS, exist_ok=True)
env = {**os.environ, "CHAR_TOOLS": "/tmp/claude-0/char/tools"}
RG = json.load(open(f"{D}/mp_regions.json"))
oval = np.isin(np.arange(468), RG["oval"])
REF = json.load(open(f"{D}/refs/teal/landmarks.json"))
PX = 2 * 0.62 * math.tan(math.radians(10)) / 750       # metres per pixel at the face plane (face camera, 600x750)


def run(cmd, **kw):
    r = subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True, **kw)
    if r.returncode:
        print(r.stdout[-2000:], r.stderr[-2000:]); sys.exit(1)
    return r.stdout


def sim2(A, B):
    ma, mb = A.mean(0), B.mean(0); A0, B0 = A - ma, B - mb
    U, Sg, Vt = np.linalg.svd(B0.T @ A0); Dg = np.eye(2); Dg[1, 1] = np.sign(np.linalg.det(U @ Vt)); Rm = U @ Dg @ Vt
    s = (Sg * np.diag(Dg)).sum() / (A0 ** 2).sum()
    return lambda X: s * (X - ma) @ Rm.T + mb


def build_and_shoot(tag):
    run([PY, f"{S}/fork/build_look.py", "--look", LOOK, "--out", BD])
    for t in ("H",):
        run([PY, "scripts/character/blender/export_tier.py", "--look", LOOK, "--build", BD, "--tier", t])
    run(["node", "scripts/character/finish.mjs", BD, "teal", "public/assets/teacher-bakeoff/ai-portrait-wrap/teal"])
    run(["node", f"{S}/shoot.mjs", "--look", "teal", "--yaws", f"0,{a.q3yaw:g},27", "--out", SHOTS])
    lmf = f"{SHOTS}/lm_{tag}.json"
    if os.path.exists(lmf):
        os.remove(lmf)
    r = subprocess.run([MP, f"{S}/landmarks.py", "--model", "/tmp/claude-0/apw/face_landmarker.task", "--out", lmf,
                        f"{SHOTS}/teal_yaw0.png", f"{SHOTS}/teal_yaw{a.q3yaw:g}.png", f"{SHOTS}/teal_yaw27.png"], capture_output=True, text=True)
    return json.load(open(lmf))


def errors(lm):
    out = {}
    for rv, qv in (("front", "teal_yaw0"), ("q3_left", f"teal_yaw{a.q3yaw:g}"), ("q3_right", "teal_yaw27")):
        R = np.array(REF[rv]["lm"])[:468, :2]; Q = np.array(lm[qv]["lm"])[:468, :2]
        f = sim2(R[~oval], Q[~oval])                      # reference INTO the render frame (keeps our scale/pose)
        e = f(R) - Q                                      # px: where the landmark should move in the render
        iod = np.linalg.norm(Q[33] - Q[263])
        out[rv] = (e, float((np.linalg.norm(e, axis=1)[~oval]).mean() / iod * 100), float(np.linalg.norm(e, axis=1).mean() / iod * 100))
    return out


L = json.load(open(LOOK))
corrF = f"{D}/refs/teal/fit_correction.json"
corr = np.array(json.load(open(corrF))["mm"]) / 1000 if os.path.exists(corrF) and L["wrap"].get("correction") else np.zeros((468, 3))
L["wrap"]["correction"] = corrF
log = []
th = math.radians(a.q3yaw)
for it in range(a.iters + 1):
    json.dump({"mm": np.round(corr * 1000, 3).tolist(), "note": "fitloop.py closed-loop correction added to wrap targets"}, open(corrF, "w"))
    json.dump(L, open(LOOK, "w"), indent=2)
    lm = build_and_shoot(it)
    E = errors(lm)
    row = {"iter": it, **{k: {"interiorNME": round(v[1], 2), "allNME": round(v[2], 2)} for k, v in E.items()}}
    log.append(row); print(json.dumps(row), flush=True)
    if it == a.iters:
        break
    ef, eq = E["front"][0], E["q3_left"][0]
    dX = ef[:, 0] * PX; dZ = -ef[:, 1] * PX
    # yaw view: image x' = x cos + z_gl sin  ->  depth (glTF z, toward camera) from the residual after the frontal x
    dzgl = (eq[:, 0] * PX - dX * math.cos(th)) / math.sin(th)
    dzgl[oval] = 0
    dzgl = np.clip(dzgl, -0.004, 0.004)
    corr = corr + a.step * np.stack([dX, -dzgl * 0.5, dZ], 1)
json.dump({"log": log, "pxPerM": 1 / PX, "step": a.step}, open(f"{D}/refs/teal/fitloop.json", "w"), indent=1)
