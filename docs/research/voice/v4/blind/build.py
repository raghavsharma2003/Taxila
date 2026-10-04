# build.py: blind round-3 ranking page (2026-10-04). Reuses ../../v3/blind/build.py's encode() and code minting unchanged.
# 5 cards (the round-2 scenes) x 4 arms = 20 clips. The arms and the take per arm-line come from ../renders/manifest.json,
# whose take rule was written before any screening (first take passing the 4 clip gates; every primary arm-line passed on
# take 1). The L3 "A-reserve" renders are NOT on the page (manifest role "reserve").
# Each clip is encoded from its RAW source (the chosen take, or for arm A the round-1 WAV that round 2 encoded) exactly as
# round 2 did: ebur128-measured, ONE static gain to -26 LUFS (true peak must stay <= -2 dBFS, no compression), 44.1 kHz
# mono MP3 96 kbps under a random 5-character code (never a round-2 code), then measured again with ebur128.
# Writes blind-key.json (code -> arm/line/text/take/source; NEVER publish it) and index.html.
# Re-running mints NEW codes and invalidates every rating collected against the old page, so it refuses to run once
# blind-key.json exists unless --force is given.   python3 docs/research/voice/v4/blind/build.py
import json, os, random, secrets, sys
HERE = os.path.dirname(os.path.abspath(__file__))
V4 = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(V4, "..", "..", "..", ".."))
V3 = os.path.join(V4, "..", "v3")
sys.path.insert(0, os.path.join(V3, "blind"))
import build as r2  # noqa: E402  round-2 build.py: encode(), measure(), TARGET, TP — imported, not copied, so the procedure cannot drift

LINES = ["L1-think", "L2-laugh", "L3-surprise", "L4-correct", "L5-wonder"]
ARMS = ["A", "B", "C", "D"]
VERSION = "taxila-voice-blind-r3/v1"


def main():
    if os.path.exists(os.path.join(HERE, "blind-key.json")) and "--force" not in sys.argv:
        sys.exit("blind-key.json exists: re-running mints new codes and invalidates collected ratings. Pass --force only if the page is not live.")
    man = json.load(open(os.path.join(V4, "renders", "manifest.json")))
    scenes = json.load(open(os.path.join(V3, "screen", "scenes.json")))
    r2codes = set(json.load(open(os.path.join(V3, "blind", "blind-key.json")))["clips"])
    prim = [c for c in man["clips"] if c["role"] == "primary"]
    cells = {(c["arm"], c["line"]) for c in prim}
    assert len(prim) == 20 and cells == {(a, l) for a in ARMS for l in LINES}, sorted(cells)
    used, key, page_clips = set(r2codes), {}, []
    alpha = "ACDEFHJKLMNPRTUVWXY3479"  # no 0/O, 1/I, 2/Z, 5/S, 6/G, 8/B look-alikes (as round 2)
    for f in os.listdir(HERE):
        if f.endswith(".mp3"): os.remove(os.path.join(HERE, f))
    for c in sorted(prim, key=lambda c: (c["arm"], c["line"])):
        src = os.path.join(ROOT, c["source"])
        assert os.path.exists(src), src
        if c.get("no_take_passed"): print("WARNING: no take passed the clip gates:", c["id"])
        while True:
            code = "".join(secrets.choice(alpha) for _ in range(5))
            if code not in used: used.add(code); break
        in_i, out_i, out_tp, ntype = r2.encode(src, os.path.join(HERE, f"{code}.mp3"))
        s = c["screen"]
        key[code] = {"arm": c["arm"], "engine_arm": c["engine_arm"], "arm_desc": man["arms"][c["arm"]], "line": c["line"],
                     "line_variant": c["v"], "text": c["text"], "take": c["take"], "take_check": c["take_check"],
                     "source": c["source"], "manifest_id": c["id"], "screen_clip_id": c["screen_clip_id"],
                     "round2_code": c.get("round2_code"),
                     "input_lufs": in_i, "output_lufs": out_i, "output_true_peak_dbfs": out_tp, "loudnorm_mode": ntype,
                     "screen_flags": {"miss_both": s["miss_both"], "num_miss_both": s["num_miss_both"],
                                      "ins_num_both": s["ins_num_both"], "max_pause_s": round(s["max_pause"], 2),
                                      "pauses_ge_180ms": s["pauses_ge_180"], "pause_total_s": round(s["pause_total_s"], 2),
                                      "planned_hit": s.get("planned_hit"), "planned_pauses": s.get("planned_pauses"),
                                      "unplanned_pauses": s.get("unplanned_pauses"), "rate_syl_s": round(s["rate"], 2),
                                      "mid_pauses_ge_0.3s": [p for p in s["pause_mid"] if p["s"] >= 0.3]}}
        page_clips.append({"c": code, "l": c["line"], "t": c["text"]})
        print(code, c["arm"], c["line"], f"t{c['take']}", f"{in_i:+.1f} -> {out_i:+.1f} LUFS tp {out_tp:+.1f}", ntype)
    random.shuffle(page_clips)  # file order in the page leaks nothing; per-listener order is shuffled again at runtime
    M = {"v": VERSION, "target_lufs": r2.TARGET, "clips": page_clips,
         "scenes": {l: {"scene": scenes[l]["scene"], "child": scenes[l]["child"]} for l in LINES}}
    key_doc = {"v": VERSION, "date": "2026-10-04", "built_by": "docs/research/voice/v4/blind/build.py",
               "DO_NOT_PUBLISH": "this file un-blinds the page; publish index.html and the .mp3 files only",
               "arms": man["arms"], "lines_rule": man["lines_rule"],
               "take_rule": man["take_rule"],
               "page_text": "each clip shows the words it says; arm A says the round-2 line, B/C/D the v4 line, so the text separates A from B/C/D exactly as the audio already does and says nothing about B vs C vs D",
               "loudness": f"ffmpeg ebur128 measurement of the raw source, then one static volume gain per clip to I={r2.TARGET} LUFS (true peak must stay <= {r2.TP} dBFS, no compression), then 44.1 kHz mono MP3 96 kbps; output measured with ebur128 (procedure imported from ../../v3/blind/build.py)",
               "fail_ticks_added_in_r3": ["mood", "fades", "choppy"],
               "clips": key}
    json.dump(key_doc, open(os.path.join(HERE, "blind-key.json"), "w"), ensure_ascii=False, indent=1)
    tpl = open(os.path.join(HERE, "page.template.html"), encoding="utf-8").read()
    assert tpl.count("/*__M__*/null") == 1
    open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(
        tpl.replace("/*__M__*/null", json.dumps(M, ensure_ascii=False)))


if __name__ == "__main__":
    main()
