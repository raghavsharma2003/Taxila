"""r5 viseme gate (judge r4 fix 3): poses for the blind forced-choice label test on mouth crops. 9 classes x 3 variants
(smile bias 0 / 0.05 / 0.25 and a jaw variation), rendered through the real solver.
    python3 labeltest-poses.py -> work/label-poses.json"""
import json
C = {
    "aa": {"viseme_aa": 1, "jawOpen": 0.55}, "o": {"viseme_O": 1, "jawOpen": 0.4}, "ee": {"viseme_E": 1, "jawOpen": 0.35},
    "oo": {"viseme_U": 1, "jawOpen": 0.2}, "mbp": {"viseme_PP": 1, "jawOpen": 0.0}, "fv": {"viseme_FF": 1, "jawOpen": 0.15},
    "ltdn": {"viseme_nn": 1, "tongueTipUp": 0.8, "tongueWide": 0.6, "jawOpen": 0.28}, "ch": {"viseme_CH": 1, "jawOpen": 0.25},
}
out = {}
for k, bs in C.items():
    for i, (sm, jm) in enumerate([(0.0, 1.0), (0.05, 0.8), (0.25, 1.2)]):
        b = dict(bs); b["jawOpen"] = round(b.get("jawOpen", 0) * jm, 3); b["mouthSmileLeft"] = b["mouthSmileRight"] = sm
        if k == "ltdn" and i == 1: b = {"viseme_DD": 1, "tongueTipUp": 0.8, "jawOpen": 0.25, "mouthSmileLeft": sm, "mouthSmileRight": sm}
        out[f"{k}_{i}"] = {"bs": b}
for i, sm in enumerate([0.0, 0.05, 0.25]):
    out[f"surprise_{i}"] = {"expr": "surprise", "bs": {"mouthSmileLeft": sm, "mouthSmileRight": sm}}
json.dump(out, open("art/character/puppet2d/polish-r10/work/label-poses.json", "w"), indent=0)
print(len(out))
