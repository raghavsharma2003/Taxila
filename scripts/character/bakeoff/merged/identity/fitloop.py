"""Closed-loop identity fit for the MERGED build (from ai-portrait-wrap's fitloop.py, extended).

Each iteration builds the merged head (blender/build_look.py: wrap + rigid-scaled eyes + lid conform + profile term +
v3's expression stage), exports H, finishes it, renders neutral views and measures them against the references:
  front     (render yaw 0  vs refs front)      -> x and z correction of every landmark (frontal plane);
  q45_left  (render yaw 21 vs refs q45_left, MediaPipe yaw 21.4) and
  q45_right (render yaw 26 vs refs q45_right, MediaPipe yaw 26.0) -> depth, from the x error left over after the
            frontal correction (image x' = x cos(yaw) + depth sin(yaw)); at 21-26 deg the depth term is ~1.4x better
            conditioned than ai-portrait-wrap's 24 deg render against an 18 deg reference (a yaw mismatch that by
            itself put NME at 3.9%, measured: the same head scores 1.29% against q3_left at its own 18 deg);
  profile   (the profile camera vs refs profile90_left, profilefit.py) -> the face-front depth by height and the jaw
            underside's height (the silhouette term).
Held out (never fed back): q3_left (18 deg) and q3_right (21 deg). Every reference was turned the same way by the
generator (MediaPipe yaw is positive on all four), so every render is at positive yaw.
The texture is NOT rebuilt inside the loop (10 min per pass): the renders reuse the last texture set on the new UVs
(the unwrap is stable under these mm-scale edits), as ai-portrait-wrap's loop did.
    python3 fitloop.py [--iters 3] [--step 0.6] [--reset]"""
import argparse, json, math, os, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--iters", type=int, default=3)
ap.add_argument("--step", type=float, default=0.6)
ap.add_argument("--pstep", type=float, default=0.7)
ap.add_argument("--reset", action="store_true")
ap.add_argument("--no-profile", action="store_true")
ap.add_argument("--depth", type=float, default=0.6, help="gain of the 3/4 depth term (0 = off)")
ap.add_argument("--front", type=float, default=1.0, help="gain of the frontal x/z term")
a = ap.parse_args()
ROOT = "/home/user/Taxila"
CH = os.environ.get("CHAR_HOME", "/tmp/claude-0/char")
D = f"{ROOT}/art/character/bakeoff/merged"
S = f"{ROOT}/scripts/character/bakeoff/merged"
LOOK = f"{D}/looks/teal.json"
BD = f"{CH}/bakeoff-merged/teal"
SHOTS = f"{CH}/bakeoff-merged/loop"
PY = f"{CH}/bpyenv/bin/python"
MP = os.environ.get("MP_PY", "/tmp/claude-0/apw/venv/bin/python")
MODEL = os.environ.get("MP_MODEL", "/tmp/claude-0/apw/face_landmarker.task")
os.makedirs(SHOTS, exist_ok=True)
env = {**os.environ, "CHAR_TOOLS": f"{CH}/tools"}
RG = json.load(open(f"{D}/mp_regions.json"))
oval = np.isin(np.arange(468), RG["oval"])
REF = json.load(open(f"{D}/refs/teal/landmarks.json"))
PX = 2 * 0.62 * math.tan(math.radians(10)) / 750       # metres per pixel at the face plane (face camera, 600x750)
TRAIN = {"front": 0, "q45_left": 21, "q45_right": 26}
HELD = {"q3_left": 18, "q3_right": 21}
YAWS = sorted(set([0, 24] + list(TRAIN.values()) + list(HELD.values())))


def run(cmd, **kw):
    r = subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True, **kw)
    if r.returncode:
        print(r.stdout[-3000:], r.stderr[-3000:]); sys.exit(1)
    return r.stdout


def sim2(A, B):
    ma, mb = A.mean(0), B.mean(0); A0, B0 = A - ma, B - mb
    U, Sg, Vt = np.linalg.svd(B0.T @ A0); Dg = np.eye(2); Dg[1, 1] = np.sign(np.linalg.det(U @ Vt)); Rm = U @ Dg @ Vt
    s = (Sg * np.diag(Dg)).sum() / (A0 ** 2).sum()
    return lambda X: s * (X - ma) @ Rm.T + mb


def build_and_shoot(tag):
    run([PY, f"{S}/blender/build_look.py", "--look", LOOK, "--out", BD])
    run([PY, f"{S}/blender/export_tier.py", "--look", LOOK, "--build", BD, "--tier", "H"])
    run(["node", f"{S}/finish.mjs", BD, "teal", f"{ROOT}/public/assets/teacher-bakeoff/merged/teal"])
    run(["node", f"{S}/identity/shoot.mjs", "--look", "teal", "--yaws", ",".join(map(str, YAWS)), "--out", SHOTS])
    lmf = f"{SHOTS}/lm_{tag}.json"
    if os.path.exists(lmf):
        os.remove(lmf)
    subprocess.run([MP, f"{S}/identity/landmarks.py", "--model", MODEL, "--out", lmf] + [f"{SHOTS}/teal_yaw{y}.png" for y in YAWS],
                   capture_output=True, text=True, cwd=ROOT)
    if not a.no_profile:
        run(["node", f"{S}/identity/profshot.mjs", "--look", "teal", "--out", SHOTS])
    return json.load(open(lmf))


def err(lm, rv, y):
    R = np.array(REF[rv]["lm"])[:468, :2]; Q = np.array(lm[f"teal_yaw{y}"]["lm"])[:468, :2]
    f = sim2(R[~oval], Q[~oval])                      # reference INTO the render frame (keeps our scale/pose)
    e = f(R) - Q
    iod = np.linalg.norm(Q[33] - Q[263])
    return e, float((np.linalg.norm(e, axis=1)[~oval]).mean() / iod * 100)


L = json.load(open(LOOK))
corrF = f"{D}/refs/teal/fit_correction.json"
profF = f"{D}/refs/teal/profile_correction.json"
if a.reset:
    for f in (profF,):
        if os.path.exists(f):
            os.remove(f)
corr = np.array(json.load(open(corrF))["mm"]) / 1000 if os.path.exists(corrF) else np.zeros((468, 3))
L["wrap"]["correction"] = corrF
if not a.no_profile:
    L["wrap"]["profileCorrection"] = profF
log = []
for it in range(a.iters + 1):
    json.dump({"mm": np.round(corr * 1000, 3).tolist(), "note": "merged fitloop.py closed-loop correction added to wrap targets"}, open(corrF, "w"))
    json.dump(L, open(LOOK, "w"), indent=2)
    lm = build_and_shoot(it)
    E = {rv: err(lm, rv, y) for rv, y in {**TRAIN, **HELD}.items()}
    E["q45_at_yaw24_left"] = err(lm, "q45_left", 24)
    E["q45_at_yaw24_right"] = err(lm, "q45_right", 24)
    row = {"iter": it, **{k: round(v[1], 2) for k, v in E.items()}}
    row["yaw24_over_front"] = round(0.5 * (E["q45_at_yaw24_left"][1] + E["q45_at_yaw24_right"][1]) / E["front"][1], 3)
    if not a.no_profile:
        r = subprocess.run(["python3", f"{S}/identity/profilefit.py", "measure", "--ref", f"{D}/refs/teal/profile90_left.png",
                            "--reflm", f"{D}/refs/teal/landmarks.json", "--render", f"{SHOTS}/teal_profile.png",
                            "--cam", f"{SHOTS}/teal_profile.json", "--corr", profF if it < a.iters else f"{SHOTS}/profile_final.json",
                            "--step", str(a.pstep if it < a.iters else 0.0)], cwd=ROOT, capture_output=True, text=True)
        row["profile"] = r.stdout.strip()[-200:]
    log.append(row); print(json.dumps(row), flush=True)
    if it == a.iters:
        break
    ef = E["front"][0]
    dX = ef[:, 0] * PX; dZ = -ef[:, 1] * PX
    dz = []
    for rv in ("q45_left", "q45_right"):
        th = math.radians(TRAIN[rv])
        eq = E[rv][0]
        dz.append((eq[:, 0] * PX - dX * math.cos(th)) / math.sin(th))
    dzgl = np.mean(dz, 0)
    dzgl[oval] = 0
    dzgl = np.clip(dzgl, -0.004, 0.004)
    corr = corr + a.step * np.stack([dX * a.front, -dzgl * a.depth, dZ * a.front], 1)
json.dump({"log": log, "pxPerM": 1 / PX, "step": a.step, "train": TRAIN, "heldOut": HELD, "method": __doc__.split("\n")[0]},
          open(f"{D}/refs/teal/fitloop.json", "w"), indent=1)
