"""Register each Stage-B edit to the rig front (ORB + RANSAC similarity on the whole frame, as face/source/measure.py),
write the frame registered by scale + translation only (rotation kept: the listening tilt is real), and report drift.
Also builds the blind identity grid (3 x 2: rest, speak, listen, think, warm, blink; the judge is not told the order).
    python3 -I register.py <out.json>"""
import sys, json, numpy as np, cv2
from PIL import Image
S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
FRONT = open(f"{S}/rig-pick.txt").read().strip()
FR = ["x-speak", "x-listen", "x-think", "x-warm", "x-blink", "x-mid", "x-yawL", "x-yawR"]
load = lambda i: np.asarray(Image.open(f"{S}/raw/{i}.png").convert("RGB"))
a = load(FRONT); ga = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY)
orb = cv2.ORB_create(5000)
k1, d1 = orb.detectAndCompute(ga, None)
out = {"front": FRONT, "method": __doc__.strip(), "frames": {}}
import os; os.makedirs(f"{S}/reg", exist_ok=True)
for f in FR:
    b = load(f); gb = cv2.cvtColor(b, cv2.COLOR_RGB2GRAY)
    k2, d2 = orb.detectAndCompute(gb, None)
    m = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d2, d1), key=lambda x: x.distance)[:800]
    p2 = np.float32([k2[x.queryIdx].pt for x in m]); p1 = np.float32([k1[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(p2, p1, method=cv2.RANSAC, ransacReprojThreshold=3)   # frame -> front
    s = float(np.hypot(M[0, 0], M[1, 0])); rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
    c = np.array([512.0, 360.0]); mc = M @ np.array([c[0], c[1], 1.0]); t = mc - s * c
    Mp = np.float32([[s, 0, t[0]], [0, s, t[1]]])
    w = cv2.warpAffine(b, Mp, (1024, 1024), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    Image.fromarray(w).save(f"{S}/reg/{f}.png")
    # drift of the face centre (512, 360) in the raw frame vs the front, in front px
    Mi = cv2.invertAffineTransform(M); d = Mi @ np.array([c[0], c[1], 1.0]) - c
    out["frames"][f] = {"scale_frame_to_front": round(s, 4), "rot_deg": round(rot, 2), "face_centre_shift_px": round(float(np.hypot(*d)), 1), "inliers": int(inl.sum()), "matches": len(m)}
    print(f, out["frames"][f])
json.dump(out, open(sys.argv[1], "w"), indent=1)
cells = [FRONT, "x-speak", "x-listen", "x-think", "x-warm", "x-blink"]
G = Image.new("RGB", (3 * 512, 2 * 512), "white")
for i, f in enumerate(cells):
    im = Image.open(f"{S}/raw/{f}.png" if f == FRONT else f"{S}/reg/{f}.png").convert("RGB").crop((162, 0, 862, 700)).resize((512, 512), Image.LANCZOS)
    G.paste(im, ((i % 3) * 512, (i // 3) * 512))
G.save(f"{S}/idgrid.png")
