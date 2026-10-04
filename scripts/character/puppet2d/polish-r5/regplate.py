"""r4: the bun-corrected yawR plate (keys/yawRbun-0.png) was repainted whole by the image model (the mask was not
honoured), a few px off yawR-0. Instead of re-reading 23 landmarks by hand, register it to yawR-0 with dense optical flow
(DIS, OpenCV) and map each hand-read yawR-0 landmark through the flow -> keys/lmR-r4.json. Prints the photometric
residual after warping (the registration is only trusted if it is small on the face).
    python3 scripts/character/puppet2d/polish-r5/regplate.py"""
import json, sys
import numpy as np, cv2
sys.path.insert(0, "scripts/character/puppet2d/polish-r5")
K = "art/character/puppet2d/polish-r5/keys"
a = cv2.imread(f"{K}/yawR-0.png"); b = cv2.imread(f"{K}/yawRbun-0.png")
ga, gb = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_ULTRAFAST + 2)  # PRESET_MEDIUM
flow = dis.calc(ga, gb, None)          # a(x) ~ b(x + flow(x))
flow = cv2.GaussianBlur(flow, (0, 0), 3)
h, w = ga.shape
gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
warped = cv2.remap(b, gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR)
face = (slice(300, 650), slice(350, 700))
r0 = np.abs(a.astype(float) - b.astype(float))[face].mean()
r1 = np.abs(a.astype(float) - warped.astype(float))[face].mean()
print("face residual before", round(r0, 2), "after flow", round(r1, 2))
src = open("scripts/character/puppet2d/polish-r5/keyfield.py").read()
ns = {}
exec(src[src.index("LM = {"):src.index("FILES =")], ns)
out = {}
for k, v in ns["LM"].items():
    x, y = v[2]
    fx = float(cv2.getRectSubPix(np.ascontiguousarray(flow[..., 0]), (1, 1), (x, y))[0, 0]); fy = float(cv2.getRectSubPix(np.ascontiguousarray(flow[..., 1]), (1, 1), (x, y))[0, 0])
    out[k] = [round(float(x + fx), 1), round(float(y + fy), 1)]
    print(k, v[2], "->", out[k])
json.dump(out, open(f"{K}/lmR-r4.json", "w"), indent=1)
cv2.imwrite("/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/regcheck.png", np.concatenate([a, warped, b], 1)[200:750, :])
