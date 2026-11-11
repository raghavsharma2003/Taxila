"""Scene read-outs from a capture log (capture.mjs, 60 Hz driver ticks): the scene line's bilabial words (sealed = the
mbp key at >= 0.9 inside [word start - 80 ms, word end], audio time; the line starts at 1.5 s), blinks (entries into
the closed key) per minute, key usage, the rigid pose range, and the safety read-outs (the smile key or a smile while
she speaks; head nod while listening).
    python3 -I scene-log.py <capdir> <out.json>"""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
cap, out = sys.argv[1], sys.argv[2]
L = json.load(open(f"{cap}/log.json"))["log"]
marks = json.load(open(f"{S}/tts/line-marks.json"))
SPEAK_AT = 1.5
shown = lambda s: s[1] if s[2] >= 0.5 else s[0]
words = []
for ms, dur, text in marks["words"]:
    r = text.lower()
    if re.search(r"(^|[^p])(b|m|p(?!h))", re.sub(r"[^a-z]", "", r)) or any(v[1] == 21 and ms - 60 <= v[0] <= ms + dur for v in marks["visemes"]):
        a, b = SPEAK_AT + (ms - 80) / 1000, SPEAK_AT + (ms + dur) / 1000
        ok = any(a <= e["st"] <= b and ((e["mouth"][1] == "mbp" and e["mouth"][2] >= 0.9) or e["mouth"][:2] == ["mbp", "mbp"]) for e in L)
        words.append({"word": text, "sealed": ok})
blinks = sum(1 for i in range(1, len(L)) if shown(L[i]["eyes"]) == "closed" and shown(L[i - 1]["eyes"]) != "closed")
dur = L[-1]["st"] - L[0]["st"]
use = {}
for e in L: use[shown(e["mouth"])] = use.get(shown(e["mouth"]), 0) + 1
speak = [e for e in L if e["state"] == "speaking"]
listen = [e for e in L if e["state"] == "listening"]
res = {"date": "2026-10-10", "method": __doc__.strip(), "capture": os.path.basename(cap), "ticks": len(L), "seconds": round(dur, 2),
       "bilabialWords": f"{sum(w['sealed'] for w in words)}/{len(words)}", "words": words,
       "blinks": blinks, "blinksPerMin": round(blinks / dur * 60, 1),
       "mouthKeyTicks": use, "eyeKeys": sorted({shown(e["eyes"]) for e in L}), "browKeys": sorted({shown(e["brows"]) for e in L}),
       "pose": {k: [round(min(e["pose"][i] for e in L), 2), round(max(e["pose"][i] for e in L), 2)] for i, k in enumerate(["rotDeg", "swayPx", "nodPx"])},
       "safety": {"smileKeyTicksWhileSpeaking": sum(1 for e in speak if shown(e["mouth"]) == "smile"), "maxSmileWhileSpeaking": max((e["smile"] for e in speak), default=0),
                  "calmKeyTicks": use.get("calm", 0), "listeningNodPxRange": [round(min((e["pose"][2] for e in listen), default=0), 2), round(max((e["pose"][2] for e in listen), default=0), 2)],
                  "listeningPitchDegRange": [round(min((e["pitch"] for e in listen), default=0), 2), round(max((e["pitch"] for e in listen), default=0), 2)]}}
json.dump(res, open(out, "w"), indent=1)
print({k: v for k, v in res.items() if k not in ("method", "words")})
