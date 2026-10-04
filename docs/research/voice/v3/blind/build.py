# build.py: blind round-2 ranking page for the 6 arms named in ../SCREEN.md (2026-10-04).
# Picks take 1 of each open-weight cell unless take 1 fails a clip gate (rule pre-registered in SCREEN.md section 1),
# loudness-normalises every clip to -26 LUFS (measured integrated loudness, one static gain per clip), encodes mono MP3 under a random
# 5-character code, writes blind-key.json (code -> arm/line/cond/take/source; NEVER publish it) and index.html.
# Re-running mints NEW codes and invalidates any ratings collected against the old page, so do not re-run after
# the page is live.
import json, os, re, secrets, subprocess, sys, string, random
HERE = os.path.dirname(os.path.abspath(__file__))
V3 = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(V3, "..", "..", "..", ".."))
REN = os.path.join(V3, "renders")
R1 = os.path.join(ROOT, "docs/design/superhuman/voice-probe/wav")
LINES = ["L1-think", "L2-laugh", "L3-surprise", "L4-correct", "L5-wonder"]
TARGET, TP = -26.0, -2.0

# (arm id as in screen/clips.json, gender, cond, source path for (line, take))
ARMS = [
    ("r1-dhd-diya-plain", "F", "plain", lambda l, c, t: os.path.join(R1, f"dhd-diya__{l}__plain.wav")),
    ("oss-veena-kavya", "F", "plain", lambda l, c, t: os.path.join(REN, "veena", f"veena__kavya__{l}__plain__t{t}.wav")),
    ("oss-chatterbox-hi-vox-design-m", "M", "plain",
     lambda l, c, t: os.path.join(REN, "chatterbox-hi", f"chatterbox-hi__vox-design-M__{l}__plain__t{t}.wav")),
    ("az-omniindic-hazelmori", "F", "plain", lambda l, c, t: os.path.join(REN, "az-omniindic-hazelmori", f"{l}__plain.wav")),
    ("az-omniindic-hazelmori", "F", "expressive", lambda l, c, t: os.path.join(REN, "az-omniindic-hazelmori", f"{l}__expressive.wav")),
    ("aws-nova2sonic-kiara", "F", "plain", lambda l, c, t: os.path.join(REN, "aws-nova2sonic-kiara", f"{l}__plain.wav")),
    ("aws-nova2sonic-kiara", "F", "expressive", lambda l, c, t: os.path.join(REN, "aws-nova2sonic-kiara", f"{l}__expressive.wav")),
    ("az-omni-arjun-m", "M", "plain", lambda l, c, t: os.path.join(REN, "az-omni-arjun-m", f"{l}__plain.wav")),
]
STT_NOISE = {"burp"}  # SCREEN.md 2.2: both STTs mis-spell "burp" on almost every arm


def clip_gate(c):
    """Clip-level form of rank.py's gates. Rate is an arm-median gate in rank.py, so it is not applied per clip."""
    fails = []
    if [w for w in c["miss_both"] if w not in STT_NOISE]: fails.append("words")
    if c["num_miss_both"] or c["ins_num_both"]: fails.append("numbers")
    if c["max_pause"] > 1.5: fails.append("silence>1.5s")
    return fails


def sh(args):
    return subprocess.run(args, capture_output=True, text=True)


def measure(path):
    """Integrated loudness and true peak with ffmpeg ebur128 (the same meter that checks the output)."""
    e = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    return {"input_i": float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]), "input_tp": float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])}


def encode(src, dst):
    m = measure(src)
    gain = TARGET - float(m["input_i"])  # one static gain per clip: no compression, so the delivery's dynamics stay as rendered
    if float(m["input_tp"]) + gain > TP: sys.exit(f"{src}: gain {gain:+.1f} dB would push true peak above {TP} dBFS")
    af = f"volume={gain:.2f}dB,aresample=44100"
    r = sh(["ffmpeg", "-hide_banner", "-y", "-i", src, "-af", af, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", dst])
    if r.returncode: sys.exit(r.stderr[-2000:])
    e = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", dst, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    out_i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1])
    out_tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])
    return float(m["input_i"]), out_i, out_tp, f"static gain {gain:+.2f} dB"


def main():
    clips = {c["id"]: c for c in json.load(open(os.path.join(V3, "screen", "clips.json")))}
    scenes = json.load(open(os.path.join(V3, "screen", "scenes.json")))
    used, key, page_clips = set(), {}, []
    alpha = "ACDEFHJKLMNPRTUVWXY3479"  # no 0/O, 1/I, 2/Z, 5/S, 6/G, 8/B look-alikes
    for f in os.listdir(HERE):
        if f.endswith(".mp3"): os.remove(os.path.join(HERE, f))
    for arm, g, cond, src_of in ARMS:
        for line in LINES:
            takes = [1, 2, 3] if arm.startswith("oss-") else [1]
            chosen, why = None, []
            for t in takes:
                cid = f"{arm}__{line}__{cond}__t{t}"
                fails = clip_gate(clips[cid])
                why.append({"take": t, "gate_fails": fails})
                if not fails: chosen = t; break
            if chosen is None: chosen = 1  # no take passes: keep take 1 and say so in the key
            cid = f"{arm}__{line}__{cond}__t{chosen}"
            src = src_of(line, cond, chosen)
            assert os.path.exists(src), src
            while True:
                code = "".join(secrets.choice(alpha) for _ in range(5))
                if code not in used: used.add(code); break
            in_i, out_i, out_tp, ntype = encode(src, os.path.join(HERE, f"{code}.mp3"))
            c = clips[cid]
            key[code] = {"arm": arm, "cond": cond, "gender": g, "line": line, "take": chosen, "take_check": why,
                         "source": os.path.relpath(src, ROOT), "screen_clip_id": cid,
                         "input_lufs": in_i, "output_lufs": out_i, "output_true_peak_dbfs": out_tp,
                         "loudnorm_mode": ntype,
                         "screen_flags": {"miss_both": c["miss_both"], "num_miss_both": c["num_miss_both"],
                                          "max_pause_s": round(c["max_pause"], 2), "rate_syl_s": round(c["rate"], 2),
                                          "mid_pauses_ge_0.3s": [p for p in c["pause_mid"] if p["s"] >= 0.3]}}
            page_clips.append({"c": code, "l": line})
            print(code, arm, cond, line, f"t{chosen}", f"{in_i:+.1f} -> {out_i:+.1f} LUFS tp {out_tp:+.1f}", ntype)
    random.shuffle(page_clips)  # file order in the page leaks nothing; per-listener order is shuffled again at runtime
    M = {"v": "taxila-voice-blind-r2/v1", "target_lufs": TARGET, "clips": page_clips,
         "scenes": {l: scenes[l] for l in LINES}}
    key_doc = {"v": M["v"], "date": "2026-10-04", "built_by": "docs/research/voice/v3/blind/build.py",
               "DO_NOT_PUBLISH": "this file un-blinds the page; publish index.html and the .mp3 files only",
               "arms": [{"arm": a, "gender": g, "cond": c} for a, g, c, _ in ARMS],
               "take_rule": "take 1 unless it fails a clip gate (words missed by both STTs other than 'burp', any number missed or inserted by both, an internal silence > 1.5 s); then the first take that passes; if none pass, take 1. Hosted arms have one take. Pre-registered in SCREEN.md section 1.",
               "loudness": f"ffmpeg ebur128 measurement, then one static volume gain per clip to I={TARGET} LUFS (true peak must stay <= {TP} dBFS, no compression), then 44.1 kHz mono MP3 96 kbps; output measured with ebur128",
               "clips": key}
    json.dump(key_doc, open(os.path.join(HERE, "blind-key.json"), "w"), ensure_ascii=False, indent=1)
    tpl = open(os.path.join(HERE, "page.template.html"), encoding="utf-8").read()
    open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(
        tpl.replace("/*__M__*/null", json.dumps(M, ensure_ascii=False)))


if __name__ == "__main__":
    main()
