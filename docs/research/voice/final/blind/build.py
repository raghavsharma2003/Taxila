# build.py: blind FINAL voice pick page (owner directive 2026-10-04: pick ONE of Diya / MAI-Voice-2.1 / gpt-4o-mini-tts).
# 3 passages (../passages.mjs) x 3 voices = 9 clips. The take per voice-passage is the one ../renders/manifest.json
# `picks` names (take rule written before screening; MAI has no passing take and its 3 picks carry no_take_passed=true,
# which goes into the key, never onto the page).
# Each clip is encoded from its RAW chosen take with ../../v3/blind/build.py's encode() (imported, never copied):
# ebur128-measured, ONE static gain to -26 LUFS (true peak must stay <= -2 dBFS, no compression), 44.1 kHz mono MP3
# 96 kbps, measured again. Every MP3 gets a random 5-character code and every voice a random 3-character label, none
# used in rounds 2-3. Passage text comes from passages.mjs through node (not copied), so the page shows exactly the
# words every engine was given.
# Writes blind-key.json (codes -> engine/passage/take/source; NEVER publish it) and index.html.
# Re-running mints NEW codes and invalidates collected ratings, so it refuses once blind-key.json exists unless --force.
#   python3 docs/research/voice/final/blind/build.py
import json, os, random, secrets, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
FINAL = os.path.dirname(HERE)
VOICE = os.path.dirname(FINAL)
sys.path.insert(0, os.path.join(VOICE, "v3", "blind"))
import build as r2  # noqa: E402  round-2 build.py: encode(), TARGET, TP — imported so the loudness procedure cannot drift

VERSION = "taxila-voice-final/v1"
ENGINES = ["diya", "mai", "oai"]
PASSAGES = ["P1-maths", "P2-science", "P3-mixed"]
ALPHA = "ACDEFHJKLMNPRTUVWXY3479"  # no 0/O, 1/I, 2/Z, 5/S, 6/G, 8/B look-alikes (as rounds 2-3)

# Listener-facing framing only (English UI text, not stimuli): who the child is and what the feeling should do.
SCENE = {
    "P1-maths": "A maths lesson with an 11-year-old. She greets the child, thinks aloud through a samosa sum, laughs along with the child's joke, steers back to the question, then is surprised and delighted by the child's quick answer.",
    "P2-science": "A science lesson with an 11-year-old. Quiet wonder about sunlight that builds into excitement, a clear explanation, a calm and kind correction of the child's wrong idea about the moon, then encouragement.",
    "P3-mixed": "End-of-day revision with an 11-year-old, moving between English and Hindi: fractions, a cold drink shared by friends, photosynthesis, a question for the child, a playful tease, and a cheerful goodbye in English.",
}
# What the child just did, shown in brackets before the beat it leads into (the child is never heard).
CUE = {
    ("P1-maths", "joke-laugh"): "The child jokes that they will eat all twelve samosas alone.",
    ("P1-maths", "surprise"): "The child answers: six hundred.",
    ("P2-science", "kind-correction"): "The child says the moon shines with its own light, like the sun.",
}


def passages():
    js = ("import('./passages.mjs').then(m=>process.stdout.write(JSON.stringify(m.PASSAGES.map(p=>"
          "({id:p.id,title:p.title,arc:p.arc,beats:p.beats.map(b=>({beat:b.beat,text:b.text})),text:m.textOf(p)})))))")
    r = subprocess.run(["node", "-e", js], cwd=FINAL, capture_output=True, text=True)
    if r.returncode: sys.exit(r.stderr)
    return {p["id"]: p for p in json.loads(r.stdout)}


def old_codes():
    used = set()
    for f in ["v3/blind/blind-key.json", "v4/blind/blind-key.json"]:
        used |= set(json.load(open(os.path.join(VOICE, f)))["clips"])
    return used


def mint(n, used):
    while True:
        c = "".join(secrets.choice(ALPHA) for _ in range(n))
        if c not in used and not any(u.startswith(c) for u in used): used.add(c); return c


def main():
    if os.path.exists(os.path.join(HERE, "blind-key.json")) and "--force" not in sys.argv:
        sys.exit("blind-key.json exists: re-running mints new codes and invalidates collected ratings. Pass --force only if the page is not live.")
    man = json.load(open(os.path.join(FINAL, "renders", "manifest.json")))
    P = passages()
    assert sorted(P) == PASSAGES, sorted(P)
    picks = {(p["engine"], p["passage"]): p for p in man["picks"]}
    assert set(picks) == {(e, p) for e in ENGINES for p in PASSAGES}, sorted(picks)
    screens = {t["id"]: t for t in man.get("takes", []) if isinstance(t, dict) and "id" in t}
    used = old_codes()
    for f in os.listdir(HERE):
        if f.endswith(".mp3"): os.remove(os.path.join(HERE, f))
    vcode = {e: mint(3, used) for e in ENGINES}
    key, page_clips = {}, []
    for e in ENGINES:
        for p in PASSAGES:
            pk = picks[(e, p)]
            src = os.path.join(FINAL, "renders", pk["source"])
            assert os.path.exists(src), src
            if pk["no_take_passed"]: print("WARNING: no take passed the screen:", pk["id"])
            code = mint(5, used)
            in_i, out_i, out_tp, ntype = r2.encode(src, os.path.join(HERE, f"{code}.mp3"))
            dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                        os.path.join(HERE, f"{code}.mp3")], capture_output=True, text=True).stdout)
            key[code] = {"engine": e, "voice_code": vcode[e], "passage": p, "take": pk["take"], "manifest_id": pk["id"],
                         "no_take_passed": pk["no_take_passed"], "take_check": pk["take_check"],
                         "source": "docs/research/voice/final/renders/" + pk["source"],
                         "screen": screens.get(pk["id"], {}).get("screen") if pk["id"] in screens else None,
                         "input_lufs": in_i, "output_lufs": out_i, "output_true_peak_dbfs": out_tp,
                         "loudnorm_mode": ntype, "mp3_duration_s": round(dur, 2)}
            page_clips.append({"c": code, "p": p, "v": vcode[e]})
            print(code, vcode[e], e, p, f"t{pk['take']}", f"{in_i:+.1f} -> {out_i:+.1f} LUFS tp {out_tp:+.1f}", f"{dur:.1f}s")
    random.shuffle(page_clips)  # file order leaks nothing; per-listener order is shuffled again at runtime
    voices = list(vcode.values()); random.shuffle(voices)
    M = {"v": VERSION, "target_lufs": r2.TARGET, "voices": voices, "clips": page_clips,
         "passages": {pid: {"title": P[pid]["title"], "scene": SCENE[pid],
                            "beats": [{"cue": CUE.get((pid, b["beat"])), "t": b["text"]} for b in P[pid]["beats"]]}
                      for pid in PASSAGES}}
    for pid in PASSAGES:  # the page shows exactly the text every engine received (beats joined by one space)
        assert " ".join(b["t"] for b in M["passages"][pid]["beats"]) == P[pid]["text"], pid
    key_doc = {"v": VERSION, "date": "2026-10-04", "built_by": "docs/research/voice/final/blind/build.py",
               "DO_NOT_PUBLISH": "this file un-blinds the page; publish index.html and the .mp3 files only",
               "voices": {vcode[e]: e for e in ENGINES},
               "engines": {"diya": "en-IN-Diya:DragonHDLatestNeural, plain SSML (centralindia)",
                           "mai": "hi-IN-Priya:MAI-Voice-2.1 HD Preview, express-as excited/softvoice where listed, else plain (centralindia)",
                           "oai": "gpt-4o-mini-tts-2025-12-15 voice marin, text + acting instructions, non-streamed (eastus2)"},
               "take_rule": man["rules"], "observed_after_screen": man["observed_after_screen"],
               "audible_defects_left_in": ["oai P3: audio ends after 'okay'; the closing 'Bye bye!' printed on the page is not spoken (3/3 takes)",
                                           "mai: 1.4-2.6 s sentence-end gaps and words not in the text (no take passed the screen)"],
               "page_text": "every clip in a section said the same words (the passage text), so the printed text separates nothing",
               "loudness": f"ffmpeg ebur128 measurement of the raw source, one static volume gain per clip to I={r2.TARGET} LUFS (true peak <= {r2.TP} dBFS, no compression), 44.1 kHz mono MP3 96 kbps; output re-measured (encode() imported from ../../v3/blind/build.py)",
               "unlock": "score/ticks/notes unlock after 80% of the clip's 50 time-buckets were actually played (seeking past does not count)",
               "clips": key}
    json.dump(key_doc, open(os.path.join(HERE, "blind-key.json"), "w"), ensure_ascii=False, indent=1)
    tpl = open(os.path.join(HERE, "page.template.html"), encoding="utf-8").read()
    assert tpl.count("/*__M__*/null") == 1
    open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(
        tpl.replace("/*__M__*/null", json.dumps(M, ensure_ascii=False)))


if __name__ == "__main__":
    main()
