# screen.py — round-2 machine screen over the round-3 candidate renders (2026-10-04), same instruments as
# ../../v3/screen (imported, not copied, so the method is byte-identical):
#   collect : energy VAD + taxila-gpt-transcribe + Azure hi-IN short-audio (chained)   (v3 collect.py)
#   align   : Hindi CTC forced alignment -> word times, GOP; x-vectors; F0                 (v3 align.py)
#   score   : WER/both-STT misses, numbers, pauses placed on word boundaries, rate          (v3 score.py)
# Additions for v4 text, fixed before any screen ran (render.mjs RULES): English words 'tricky', 'second' added to the
# EN maps; STT spelling 'पच्चास' == पचास. Plus one new metric for arms with a plan: planned-pause hits (a VAD pause
# >= 180 ms at a clause boundary the plan gave a pause to) and unplanned pauses.
# Stages: python3 screen.py collect | align | score       (collect needs .env.local in the environment; never prints a key)
import json, os, sys, glob, re
HERE = os.path.dirname(os.path.abspath(__file__))
V4 = os.path.dirname(HERE); ROOT = os.path.abspath(os.path.join(V4, "../../../.."))
S3 = os.path.join(V4, "..", "v3", "screen"); sys.path.insert(0, S3)
RAW = os.path.join(HERE, "screen", "raw"); ALN = os.path.join(HERE, "screen", "align")
os.makedirs(RAW, exist_ok=True); os.makedirs(ALN, exist_ok=True)
R1 = os.path.join(ROOT, "docs/design/superhuman/voice-probe/wav")
LINES5 = ["L1-think", "L2-laugh", "L3-surprise", "L4-correct", "L5-wonder"]


def clip_list():
    scenes = json.load(open(os.path.join(S3, "scenes.json")))
    out = [{"id": f"A__dhd-diya-anchor__{L}__t1", "arm": "A", "line": L, "v": "orig", "role": "primary", "take": 1,
            "text": scenes[L]["text"], "file": os.path.join(R1, f"dhd-diya__{L}__plain.wav")} for L in LINES5]
    man = json.load(open(os.path.join(HERE, "renders.json")))
    for r in man["renders"]:
        if "file" in r:
            out.append({k: r[k] for k in ("id", "arm", "line", "v", "role", "take", "text")} | {"file": os.path.join(HERE, r["file"])})
    return out


def plan_bounds(line, v):
    """word index (0-based, in the joined text) of the last word of each clause, with the planned pause after it."""
    import subprocess
    js = ("import {LINES} from './lines.mjs'; const l = LINES.find(x => x.id === %r && x.v === %r);"
          "console.log(JSON.stringify(l.clauses.map(c => [c.t, c.pause])))") % (line, v)
    cl = json.loads(subprocess.run(["node", "--input-type=module", "-e", js], cwd=V4, capture_output=True, text=True, check=True).stdout)
    out, n = [], 0
    for t, p in cl:
        n += len([w for w in t.split() if w.strip("।,!?.")])
        out.append((n - 1, p))
    return out[:-1]  # the last clause has no boundary after it


def collect():
    import collect as C3
    from concurrent.futures import ThreadPoolExecutor
    C3.RAW = RAW
    def one(c):
        p = os.path.join(RAW, c["id"] + ".json")
        if os.path.exists(p):
            r = json.load(open(p))
            if r.get("gptx") is not None and r.get("az"): return "skip"
        x = C3.pcm16k(c["file"]); r = {"clip": {**c, "src": "v4", "cond": c["arm"]}, "vad": C3.vad(x)}
        try: r["gptx"] = C3.gptx(x)
        except Exception as e: r["gptx_err"] = str(e)[:200]
        try: r["az"] = C3.az(x)
        except Exception as e: r["az_err"] = str(e)[:200]
        json.dump(r, open(p, "w"), ensure_ascii=False, indent=1)
        return "ok" if r.get("gptx") is not None and r.get("az") else "partial"
    with ThreadPoolExecutor(3) as ex: res = list(ex.map(one, clip_list()))
    print({k: res.count(k) for k in set(res)})


def align():
    import align as A3
    A3.OUT = ALN
    A3.EN.update({"tricky": "ट्रिकी", "second": "सेकंड"})
    C = clip_list()
    if len(sys.argv) > 2: i, n = map(int, sys.argv[2].split("/")); C = C[i::n]  # shard i of n (parallel workers)
    for c in C:
        try: A3.one(c)
        except Exception as e: print("ERR", c["id"], repr(e)[:200], flush=True)
    print("aligned", len(glob.glob(os.path.join(ALN, "*.json"))))


def score():
    import score as S
    S.EN.update({"tricky": ["ट्रिकी", "ट्रिक्की"], "second": ["सेकंड", "सेकेंड", "सेकण्ड"]})
    S.EN_INV.clear(); S.EN_INV.update({S.unicodedata.normalize("NFC", a).replace("़", ""): k for k, v in S.EN.items() for a in v})
    S.SPELL["पच्चास"] = "पचास"; S.EN_SYL.update({"tricky": 2, "second": 2})
    S.HERE = os.path.join(HERE, "screen")  # per_clip reads HERE/raw and HERE/align; no judge.json here
    CL = {m["id"]: m for m in S.per_clip()}
    clips = clip_list(); bounds_cache = {}
    for c in clips:
        m = CL[c["id"]]; m["text"] = c["text"]
        a = json.load(open(os.path.join(ALN, c["id"] + ".json")))
        r = json.load(open(os.path.join(RAW, c["id"] + ".json")))
        W = a["words"]; P = [p for p in r["vad"].get("pauses", []) if p[1] - p[0] >= 0.18]
        at = {}  # word index -> pause length after it
        for p in P:
            c0 = (p[0] + p[1]) / 2
            for i in range(len(W) - 1):
                if W[i]["e"] is not None and W[i + 1]["s"] is not None and W[i]["s"] <= c0 <= W[i + 1]["e"] and c0 >= W[i]["e"] - 0.1:
                    at[i] = round(p[1] - p[0], 2); break
        m["pauses_ge_180"] = len(P); m["pause_total_s"] = round(sum(p[1] - p[0] for p in P), 2)
        m["pause_after"] = {W[i]["ref"] + f"#{i}": s for i, s in sorted(at.items())}
        if c["arm"] != "A":
            key = (c["line"], c["v"]); bounds_cache.setdefault(key, plan_bounds(*key))
            B = bounds_cache[key]; planned = [i for i, p in B if p >= 300]
            m["planned_pauses"] = len(planned); m["planned_hit"] = sum(1 for i in planned if i in at)
            m["unplanned_pauses"] = [W[i]["ref"] for i in at if i not in planned]
        m["gate_fails"] = gate(m)
    json.dump(list(CL.values()), open(os.path.join(HERE, "screen", "clips.json"), "w"), ensure_ascii=False, indent=0, default=lambda o: None)
    return {k: v for k, v in CL.items() if True}


def gate(m):
    f = []
    if [w for w in m.get("miss_both", []) if w != "burp"]: f.append("words")
    if m.get("num_miss_both") or m.get("ins_num_both"): f.append("numbers")
    if m["max_pause"] > 1.5: f.append("silence>1.5s")
    if any(p["s"] >= 0.3 for p in m.get("pause_mid", [])): f.append("mid-phrase pause>=0.3s")
    return f


if __name__ == "__main__":
    {"collect": collect, "align": align, "score": score}[sys.argv[1]]()
