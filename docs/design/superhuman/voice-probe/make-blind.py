#!/usr/bin/env python3
"""make-blind.py — builds the owner blind test for the HUMAN-VOICE expressive-layer experiment (2026-10-04).

Writes
  ../voice-clips/<CODE>.mp3     every final clip, same chain: edge silence capped (lead 150 ms, tail 400 ms, the
                                production trimmer's rule), loudness -24 LUFS (2-pass linear loudnorm), mp3 64 kbps mono 24 kHz
  ../voice-clips/blind-key.json UNBLINDING FILE (code -> arm, line, condition). Do not open before rating.
  ../voice-clips/blind-test.html self-contained page: pairwise A/B per (voice, line) in random order, plus per-clip
                                ratings. Holds codes, scene text and pair ids only.
Patterns reused from docs/research/voice/v2 (make-blind-v2.py, blind-test.template.html): fresh random codes,
localStorage autosave with in-memory fallback, Export/Import JSON, playback must start before rating unlocks.
"""
import json, os, re, secrets, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "voice-clips"))
os.makedirs(OUT, exist_ok=True)
sys.path.insert(0, HERE)
clips = json.load(open(os.path.join(HERE, "clips.json")))
lines = json.loads(subprocess.run(["node", "--input-type=module", "-e", "import {LINES} from './lines.mjs'; console.log(JSON.stringify(LINES))"], cwd=HERE, capture_output=True, text=True, stdin=subprocess.DEVNULL).stdout)
LINE = {l["id"]: l for l in lines}
VOICE_LABEL = {"4omtts-marin": "Voice 1", "dhd-diya": "Voice 2", "dhd-arjun": "Voice 3", "omni-diya": "Voice 4", "mai-priyaF": "Voice 5", "rt-marin": "Voice 6"}

keyf = os.path.join(OUT, "blind-key.json")
key = json.load(open(keyf)) if os.path.exists(keyf) else {}
by_id = {v["id"]: c for c, v in key.items()}

TRIM = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.4,areverse"
def encode(src, dst):
    # Two steps: the single graph (silenceremove+areverse feeding loudnorm linear) hung ffmpeg indefinitely on
    # omni-diya L3 (2026-10-04); trimming to a temp wav first, then 2-pass loudnorm, finishes in < 1 s.
    tmp = dst + ".trim.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-af", TRIM, tmp], check=True, stdin=subprocess.DEVNULL, timeout=60)
    st = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-24:TP=-1.5:LRA=20:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=60).stderr
    m = json.loads(st[st.rindex("{"):st.rindex("}") + 1])
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", tmp, "-af",
        f"loudnorm=I=-24:TP=-1.5:LRA=20:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true",
        "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "64k", dst], check=True, stdin=subprocess.DEVNULL, timeout=60)
    os.remove(tmp)

for c in clips:
    code = by_id.get(c["id"])
    if not code:
        code = secrets.token_hex(3).upper()[:5]
        while code in key: code = secrets.token_hex(3).upper()[:5]
        key[code] = {"id": c["id"], "arm": c["arm"], "line": c["line"], "cond": c["cond"], "src": c["file"]}
    dst = os.path.join(OUT, f"{code}.mp3")
    if not os.path.exists(dst): encode(os.path.join(HERE, c["file"]), dst)
    json.dump(key, open(keyf, "w"), indent=1)  # incremental: a restart keeps the code<->clip map
json.dump(key, open(keyf, "w"), indent=1)

# pairs: plain vs expressive for every (arm, line); for DragonHD also expressive-noclip vs expressive (splice effect)
code_of = {v["id"]: k for k, v in key.items()}
pairs = []
for arm in VOICE_LABEL:
    for lid in LINE:
        p = code_of.get(f"{arm}__{lid}__plain"); e = code_of.get(f"{arm}__{lid}__expressive"); n = code_of.get(f"{arm}__{lid}__expressive-noclip")
        if p and e: pairs.append({"pid": secrets.token_hex(3), "voice": VOICE_LABEL[arm], "line": lid, "a": p, "b": e})
        if n and e: pairs.append({"pid": secrets.token_hex(3), "voice": VOICE_LABEL[arm], "line": lid, "a": n, "b": e})
manifest = {"v": "taxila-human-voice-blind/v1", "pairs": pairs,
            "scenes": {lid: {"scene": l["scene"], "child": l["child"], "text": l["text"]} for lid, l in LINE.items()}}
page = open(os.path.join(HERE, "blind.template.html")).read().replace("/*MANIFEST*/null", json.dumps(manifest, ensure_ascii=False))
open(os.path.join(OUT, "blind-test.html"), "w").write(page)
print(f"{len(key)} clips, {len(pairs)} pairs -> {OUT}")
