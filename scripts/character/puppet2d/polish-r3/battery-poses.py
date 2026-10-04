"""Pose matrix for the full-size artefact battery (judge r2 fix 3): every expression x {rest head, roll +-8, yaw +-20,
pitch +-10} x {blink 0, 0.5}. -> work/battery-poses.json"""
import json
EXPR = ["rest", "warm", "delight", "concern", "surprise", "playful", "thinking", "listening", "talk_aa", "talk_O", "talk_E"]
HEAD = {"h0": [0, 0, 0], "r+8": [0, 0, 8], "r-8": [0, 0, -8], "y+20": [0, 20, 0], "y-20": [0, -20, 0], "p+10": [10, 0, 0], "p-10": [-10, 0, 0]}
TALK = {"talk_aa": {"viseme_aa": 1, "jawOpen": 0.55}, "talk_O": {"viseme_O": 1, "jawOpen": 0.4}, "talk_E": {"viseme_E": 1, "jawOpen": 0.35}}
out = {}
for e in EXPR:
    for hn, h in HEAD.items():
        for b in (0, 0.5):
            spec = {"head": h}
            bs = {"mouthSmileLeft": 0.05, "mouthSmileRight": 0.05}
            if e in TALK: bs.update(TALK[e])
            elif e != "rest": spec["expr"] = e
            if b: bs.update({"eyeBlinkLeft": b, "eyeBlinkRight": b})
            spec["bs"] = bs
            out[f"{e}_{hn}_b{int(b*100)}"] = spec
json.dump(out, open("art/character/puppet2d/polish-r3/work/battery-poses.json", "w"), indent=0)
print(len(out))
