"""r4b: landmarks for the stronger yaw keys (keys/yawL30-0, keys/yawR30-0): the hand-read 20-degree-key landmarks carried
through dense optical flow (OpenCV DIS, medium preset, on a smoothed pair), then CHECKED BY EYE on an overlay
(work/lm30-<side>.png) and corrected by hand in OVERRIDE where the flow is off. -> keys/lm30-<side>.json
    python3 scripts/character/puppet2d/polish-r7/lm30.py"""
import json
import numpy as np, cv2
K = "art/character/puppet2d/polish-r7/keys"
src = open("scripts/character/puppet2d/polish-r7/keyfield.py").read()
ns = {}
exec(src[src.index("LM = {"):src.index("FILES =")], ns)
LM = ns["LM"]
mR = json.load(open(f"{K}/lmR-r4.json"))
OVERRIDE = json.load(open(f"{K}/lm30-override.json")) if __import__("os").path.exists(f"{K}/lm30-override.json") else {}
for side, old, new, ki in (("L", "yawL-0", "yawL30-0", 1), ("R", "yawR-2", "yawR30-0", 2)):
    a = cv2.imread(f"{K}/{old}.png"); b = cv2.imread(f"{K}/{new}.png")
    ga = cv2.GaussianBlur(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), (0, 0), 1.5)
    gb = cv2.GaussianBlur(cv2.cvtColor(b, cv2.COLOR_BGR2GRAY), (0, 0), 1.5)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    dis.setFinestScale(0)
    flow = dis.calc(ga, gb, None)
    flow = cv2.GaussianBlur(flow, (0, 0), 2)
    h, w = ga.shape
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    warped = cv2.remap(b, gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR)
    face = (slice(300, 650), slice(330, 720))
    print(side, "face residual before", round(np.abs(a.astype(float) - b.astype(float))[face].mean(), 1), "after", round(np.abs(a.astype(float) - warped.astype(float))[face].mean(), 1))
    out = {}
    for k, v in LM.items():
        x, y = (mR[k] if side == "R" else v[ki])
        fx = float(cv2.getRectSubPix(np.ascontiguousarray(flow[..., 0]), (1, 1), (x, y))[0, 0])
        fy = float(cv2.getRectSubPix(np.ascontiguousarray(flow[..., 1]), (1, 1), (x, y))[0, 0])
        out[k] = [round(x + fx, 1), round(y + fy, 1)]
    out.update(OVERRIDE.get(side, {}))
    json.dump(out, open(f"{K}/lm30-{side}.json", "w"), indent=1)
    vis = b.copy()
    for k, (x, y) in out.items():
        cv2.circle(vis, (int(round(x)), int(round(y))), 3, (0, 255, 0), -1)
        cv2.putText(vis, k, (int(x) + 4, int(y) - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (0, 90, 255), 1)
    cv2.imwrite(f"art/character/puppet2d/polish-r7/work/lm30-{side}.png", vis[250:780, 260:800])
