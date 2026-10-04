# screen.py — machine screen for the final voice pick (2026-10-04). Gates, checklists and thresholds below were written
# BEFORE any render of this set existed (render.mjs RULES); any change made after seeing a transcript is recorded in
# POST_HOC with the reason, never silently.
# Instruments are imported, not copied, so they cannot drift from rounds 2-3:
#   ../v3/screen/collect.py : pcm16k, energy VAD, taxila-gpt-transcribe (eastus2, no prompt), Azure hi-IN short-audio
#                             with chaining (centralindia)
#   ../v3/screen/score.py   : Levenshtein word alignment (align)
#   ../v3/blind/build.py    : measure() (ffmpeg ebur128 integrated loudness + true peak), TARGET -26 LUFS, TP -2 dBFS
# Stages:  python3 screen.py probe   -> screens the 2 oai script-probe renders, writes renders/script-choice.json
#          python3 screen.py main    -> screens every main take, picks takes, copies picks to renders/wav/, writes
#                                       renders/manifest.json and prints the table
# Needs .env.local in the environment for the STT calls. Never prints a key.
import json, os, re, sys, shutil, unicodedata, statistics
from concurrent.futures import ThreadPoolExecutor
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(VOICE, "../../.."))
OUT = os.path.join(HERE, "renders")
RAW = os.path.join(OUT, "screen-raw"); os.makedirs(RAW, exist_ok=True)
sys.path.insert(0, os.path.join(VOICE, "v3", "screen"))
import collect as C3  # noqa: E402
import score as S3  # noqa: E402
sys.path.insert(0, os.path.join(VOICE, "v3", "blind"))
import build as R2  # noqa: E402

GATES = {
    "numbers": "a number phrase in the checklist missed by BOTH STTs (count in transcript < count in the passage), or a number phrase over-counted by both (inserted)",
    "terms": "an English term in the checklist missed by BOTH STTs",
    "punct_read": "either STT transcript contains a punctuation name (comma, full stop, question mark, exclamation, dot, dash ...)",
    "silence": "an internal VAD pause > 1.5 s, or leading silence > 1.5 s (energy VAD, 20 ms frames, as rounds 2-3)",
    "truncation": "(a) the passage's tail anchor found by neither STT, or (b) no trailing silence (< 0.04 s: audio ends mid-sound), or (c) a beat with < 40% of its reference words aligned in the better of the two STTs (skipped or garbled beat)",
    "extra": "both STTs' transcripts > 125% of the reference word count (repeated or invented speech)",
    "loudness": "raw true peak > -0.1 dBFS (clipping), or one static gain to -26 LUFS would push true peak above -2 dBFS (the round-2 encode() refusal)",
}
FLAGS = "not gates, reported only: words/s outside 1.8-3.6; level drift (a quarter's median active-frame level > 6 dB from the clip median); trailing silence > 1.5 s"
POST_HOC = []  # (date, change, reason) for anything changed after a transcript was seen; no gate was changed
OBSERVED_AFTER_SCREEN = [
    "2026-10-04: the 'truncation: beat<40%' part fires falsely when an STT writes English words in Devanagari (mai P3 t1: gptx transliterated both English beats, Azure hi-IN always does), because beat coverage is a literal word alignment. The gate was NOT changed; mai P3 has no passing take either way (all fail silence+loudness), and the fallback rule picks t2 (2 fails) over t1 (3 fails, one of them this artefact).",
    "2026-10-04: oai P3 'truncation: tail' is real: in 3/3 takes both STTs end at 'okay' and the audio ends 0.08-0.10 s after it; the closing 'Bye bye!' is not spoken.",
    "2026-10-04: words inserted by BOTH STTs (not gated, reported as ins_both): MAI adds words not in the text (e.g. 'अब बताओ', 'तुम', 'बहुत', 'तो', and a 'छछ' mouth noise), see each take's screen.ins_both.",
]

PUNCT_NAMES = ["comma", "कॉमा", "कोमा", "full stop", "फुल स्टॉप", "फुलस्टॉप", "पूर्ण विराम", "पूर्णविराम", "question mark", "क्वेश्चन मार्क",
               "प्रश्नवाचक", "exclamation", "एक्सक्लेमेशन", "विस्मयादिबोधक", "डॉट", " dot ", "डैश", "dash", "हाइफ़न", "हाइफन", "hyphen",
               "semicolon", "सेमीकोलन", "colon", "कोलन"]

# Digit forms the STTs write, mapped to the spoken words before counting (so "25" and "पच्चीस" are the same hit).
DIGITS = {"1": "एक", "2": "दो", "3": "तीन", "4": "चार", "8": "आठ", "10": "दस", "12": "बारह", "15": "पंद्रह", "24": "चौबीस",
          "25": "पच्चीस", "50": "पचास", "250": "ढाई सौ", "300": "तीन सौ", "600": "छह सौ", "300000": "तीन लाख",
          "150000000": "पंद्रह करोड़"}
SPELL = [("छः", "छह"), ("छे सौ", "छह सौ"), ("छै", "छह"), ("पच्चिस", "पच्चीस"), ("पचीस", "पच्चीस"), ("चौबिस", "चौबीस"), ("बारा ", "बारह "),
         ("पन्द्रह", "पंद्रह"), ("दो सौ पचास", "ढाई सौ"), ("बटे", "बटा"), ("करोड", "करोड़"), ("ढाई सो", "ढाई सौ"), ("तीन सो", "तीन सौ")]

# Checklists: (kind, label, variants). Expected count = matches in the passage text itself (same matcher), so the
# count can never be typed wrong. Variants are matched as whole tokens after normalisation; longer phrases are
# consumed first so "ढाई सौ" never also counts as "सौ".
CHECK = {
    "P1-maths": [
        ("num", "ढाई सौ", ["ढाई सौ"]), ("num", "तीन सौ", ["तीन सौ"]), ("num", "छह सौ", ["छह सौ"]),
        ("num", "पच्चीस", ["पच्चीस"]), ("num", "बारह", ["बारह"]), ("num", "चौबीस", ["चौबीस"]), ("num", "पचास", ["पचास"]),
        ("num", "दस", ["दस"]), ("num", "दो", ["दो"]),
        ("term", "samosa", ["samosa", "samosas", "समोसा", "समोसे", "समोसों", "समोसो"]),
        ("term", "double", ["double", "डबल"]),
        ("term", "shortcut", ["shortcut", "short cut", "short-cut", "शॉर्टकट", "शार्टकट", "शॉर्ट कट", "शार्ट कट", "शॉटकट"]),
    ],
    "P2-science": [
        ("num", "तीन लाख", ["तीन लाख"]), ("num", "पंद्रह करोड़", ["पंद्रह करोड़"]), ("num", "आठ", ["आठ"]),
        ("term", "second", ["second", "सेकंड", "सेकेंड", "सेकण्ड", "सेकेण्ड"]), ("term", "time", ["time", "टाइम"]),
        ("term", "mirror", ["mirror", "मिरर"]), ("term", "torch", ["torch", "टॉर्च", "टार्च", "टोर्च"]),
        ("term", "science", ["science", "साइंस", "सांइस"]),
        ("term", "किलोमीटर", ["किलोमीटर", "kilometer", "kilometers", "kilometre", "kilometres", "km", "कि.मी."]),
    ],
    "P3-mixed": [
        ("num", "तीन बटा चार", ["तीन बटा चार"]), ("num", "एक बटा चार", ["एक बटा चार"]), ("num", "दो बटा आठ", ["दो बटा आठ"]),
        ("num", "ढाई सौ", ["ढाई सौ"]), ("num", "चार", ["चार"]), ("num", "तीन", ["तीन"]),
        ("term", "revision", ["revision", "रिवीजन", "रिविज़न", "रिविजन", "रीविज़न"]),
        ("term", "two minutes", ["two minutes", "दो minutes", "टू मिनट्स", "टू मिनिट्स", "दो मिनट", "दो मिनट्स"]),
        ("term", "fractions", ["fractions", "fraction", "फ्रैक्शंस", "फ्रैक्शन्स", "फ्रेक्शन", "फ्रैक्शन", "फ्रेक्शंस", "फ्रेक्शन्स"]),
        ("term", "denominator", ["denominator", "डिनॉमिनेटर", "डिनोमिनेटर", "डीनॉमिनेटर", "डिनामिनेटर", "डेनोमिनेटर"]),
        ("term", "litre", ["litre", "liter", "लीटर", "लिटर"]),
        ("term", "cold drink", ["cold drink", "cold drinks", "कोल्ड ड्रिंक", "कोल्ड ड्रिंक्स", "कोल्डड्रिंक", "cold-drink"]),
        ("term", "millilitre", ["millilitre", "milliliter", "millilitres", "milliliters", "ml", "मिलीलीटर", "मिली लीटर", "मिलिलीटर", "एमएल"]),
        ("term", "carbon dioxide", ["carbon dioxide", "कार्बन डाइऑक्साइड", "कार्बन डाई ऑक्साइड", "कार्बन डाईऑक्साइड", "कार्बन डायऑक्साइड", "co2"]),
        ("term", "photosynthesis", ["photosynthesis", "फोटोसिंथेसिस", "फ़ोटोसिंथेसिस", "फोटो सिंथेसिस", "फोटोसिंथेसीस"]),
        ("term", "idea", ["idea", "आइडिया", "आईडिया"]),
        ("term", "plant", ["plant", "प्लांट"]),
        ("term", "tomorrow", ["tomorrow", "टुमॉरो", "टुमारो", "टूमारो"]),
    ],
}
TAIL = {"P1-maths": ["पकड़ लिया", "पकड लिया", "pakad liya"], "P2-science": ["कैसा लगा", "kaisa laga"],
        "P3-mixed": ["bye bye", "bye-bye", "बाय बाय", "बाय-बाय", "बायबाय", "bye"]}


def norm(s):
    s = unicodedata.normalize("NFC", s or "").lower()
    s = s.replace("़", "").replace("ँ", "ं")  # nukta and chandrabindu are STT spelling noise (as score.py)
    s = s.replace("₹", " ").replace("रु.", " ")
    s = re.sub(r"(?<=\d)[,](?=\d)", "", s)          # 3,00,000 -> 300000
    s = re.sub(r"(\d)\s*/\s*(\d)", r"\1 बटा \2", s)  # 1/4 -> 1 बटा 4
    s = re.sub(r"(\d)([^\d\s])", r"\1 \2", s); s = re.sub(r"([^\d\s])(\d)", r"\1 \2", s)
    s = re.sub(r"\d+", lambda m: " " + DIGITS.get(m.group(0), m.group(0)) + " ", s)
    s = re.sub(r"[।॥,!?.;:\"'“”‘’()…]", " ", s)
    s = unicodedata.normalize("NFC", s.replace("़", ""))
    s = " " + re.sub(r"\s+", " ", s).strip() + " "
    for a, b in SPELL: s = s.replace(a.replace("़", ""), b.replace("़", ""))
    return s


def count_items(text, items):
    s = norm(text); out = {}
    order = sorted(items, key=lambda it: -max(len(v) for v in it[2]))
    for kind, label, vs in order:
        n = 0
        for v in sorted(vs, key=len, reverse=True):
            pat = re.compile(r"(?<= )" + re.escape(norm(v).strip()) + r"(?= )")
            n += len(pat.findall(s)); s = pat.sub(" # ", s)
        out[label] = (kind, n)
    return out


def words(text): return [w for w in norm(text).split() if w]


def screen_clip(c):
    """c: {id, file, passage, text(reference), beats[[beat, text]]} -> metrics and gate failures. Caches STT/VAD in RAW."""
    p = os.path.join(RAW, c["id"] + ".json")
    r = json.load(open(p)) if os.path.exists(p) else {}
    x = C3.pcm16k(c["file"])
    if "vad" not in r: r["vad"] = C3.vad(x)
    if r.get("gptx") is None:
        try: r["gptx"] = C3.gptx(x); r.pop("gptx_err", None)
        except Exception as e: r["gptx_err"] = str(e)[:200]
    if not r.get("az"):
        try:
            # C3.az chains up to 6 short-audio calls; long passages may need more, so continue from where it stopped
            az = C3.az(x); off_s = max([w["e"] for w in az["words"]] or [0])
            for _ in range(4):
                if off_s >= len(x) / 16000 - 1.0: break
                more = C3.az(x[int((off_s + 0.05) * 16000):])
                if not more["words"]: break
                for w in more["words"]: w["s"] = round(w["s"] + off_s + 0.05, 3); w["e"] = round(w["e"] + off_s + 0.05, 3)
                az["words"] += more["words"]; az["lexical"] += " " + more["lexical"]; az["calls"] += more["calls"]
                off_s = max(w["e"] for w in az["words"])
            r["az"] = az; r.pop("az_err", None)
        except Exception as e: r["az_err"] = str(e)[:200]
    if "loud" not in r: r["loud"] = R2.measure(c["file"])
    json.dump(r, open(p, "w"), ensure_ascii=False, indent=1)

    hyps = {"gptx": r.get("gptx") or "", "az": (r.get("az") or {}).get("lexical", "")}
    items = CHECK[c["passage"]]
    exp = count_items(c["text"], items)
    got = {k: count_items(h, items) for k, h in hyps.items()}
    miss_both = [l for l, (kind, n) in exp.items() if all(got[k][l][1] < n for k in got)]
    ins_num_both = [l for l, (kind, n) in exp.items() if kind == "num" and all(got[k][l][1] > n for k in got)]
    fails = []
    if [l for l in miss_both if exp[l][0] == "num"] or ins_num_both: fails.append("numbers")
    if [l for l in miss_both if exp[l][0] == "term"]: fails.append("terms")
    punct = [n for n in PUNCT_NAMES for k, h in hyps.items() if norm(n).strip() and re.search(r"(?<= )" + re.escape(norm(n).strip()) + r"(?= )", norm(h))]
    if punct: fails.append("punct_read")
    v = r["vad"]; pauses = [b - a for a, b in v.get("pauses", [])]
    maxp = max(pauses or [0])
    if maxp > 1.5 or v.get("lead_s", 0) > 1.5: fails.append("silence")
    # truncation
    tail_hit = any(re.search(r"(?<= )" + re.escape(norm(t).strip()) + r"(?= )", norm(h)) for t in TAIL[c["passage"]] for h in hyps.values())
    ref = words(c["text"]); beat_cov = []
    oks = {}
    for k, h in hyps.items():
        hw = words(h)
        oks[k] = S3.align(ref, hw)[1] if hw else [False] * len(ref)
    i0 = 0
    for beat, bt in c["beats"]:
        n = len(words(bt)); cov = max(sum(oks[k][i0:i0 + n]) / max(1, n) for k in oks); beat_cov.append((beat, round(cov, 2))); i0 += n
    trunc = []
    if not tail_hit: trunc.append("tail")
    if v.get("trail_s", 0) < 0.04: trunc.append("no-trailing-silence")
    if any(cv < 0.4 for _, cv in beat_cov): trunc.append("beat<40%")
    if trunc: fails.append("truncation")
    ratio = {k: round(len(words(h)) / len(ref), 2) for k, h in hyps.items()}
    if all(rt > 1.25 for rt in ratio.values()): fails.append("extra")
    L = r["loud"]; gain = R2.TARGET - L["input_i"]
    if L["input_tp"] > -0.1 or L["input_tp"] + gain > R2.TP: fails.append("loudness")
    wer = {k: round(S3.align(ref, words(h))[0], 3) if words(h) else None for k, h in hyps.items()}
    insl = {k: S3.align(ref, words(h))[2] if words(h) else [] for k, h in hyps.items()}
    ins_both = sorted(set(insl["gptx"]) & set(insl["az"]))  # observation only (not a gate)
    # flags
    span = v.get("speech_span_s") or v["dur_s"]; wps = round(len(c["text"].split()) / span, 2)
    xf = x.astype(np.float64); fr = 320; nfr = len(xf) // fr
    db = np.array([20 * np.log10(np.sqrt(np.mean(xf[i * fr:(i + 1) * fr] ** 2)) / 32768 + 1e-9) for i in range(nfr)])
    act = db > (np.percentile(db, 95) - 35); med = float(np.median(db[act]))
    q = [float(np.median(seg[a])) if a.any() else None for seg, a in zip(np.array_split(db, 4), np.array_split(act, 4))]
    drift = round(max(abs(qq - med) for qq in q if qq is not None), 1)
    flags = []
    if not 1.8 <= wps <= 3.6: flags.append(f"rate {wps} w/s")
    if drift > 6: flags.append(f"level drift {drift} dB")
    if v.get("trail_s", 0) > 1.5: flags.append(f"trailing silence {v['trail_s']} s")
    return {"id": c["id"], "dur_s": v["dur_s"], "speech_span_s": span, "words_per_s": wps, "max_pause_s": round(maxp, 2),
            "lead_s": v.get("lead_s"), "trail_s": v.get("trail_s"), "input_lufs": L["input_i"], "input_tp": L["input_tp"],
            "miss_both": miss_both, "ins_num_both": ins_num_both, "ins_both": ins_both, "punct_read": sorted(set(punct)), "tail_hit": tail_hit,
            "beat_cov": beat_cov, "trunc": trunc, "len_ratio": ratio, "wer": wer, "level_drift_db": drift,
            "per_stt": {k: {l: got[k][l][1] for l in exp} for k in got}, "expected": {l: n for l, (kind, n) in exp.items()},
            "stt_err": {k: r.get(k + "_err") for k in ("gptx", "az") if r.get(k + "_err")},
            "fails": fails, "flags": flags}


def passages():
    js = ("import {PASSAGES, textOf} from './passages.mjs'; console.log(JSON.stringify(PASSAGES.map(p => ({id: p.id, text: textOf(p), "
          "beats: p.beats.map(b => [b.beat, b.text])}))))")
    import subprocess
    return {p["id"]: p for p in json.loads(subprocess.run(["node", "--input-type=module", "-e", js], cwd=HERE, capture_output=True, text=True, check=True).stdout)}


def renders():
    return json.load(open(os.path.join(OUT, "renders.json")))


def probe():
    P = passages()["P1-maths"]; man = renders(); res = {}
    for r in man["renders"]:
        if r.get("stage") != "probe" or "file" not in r: continue
        res[r["script"]] = screen_clip({"id": r["id"], "file": os.path.join(OUT, r["file"]), "passage": "P1-maths", "text": P["text"], "beats": P["beats"]})
    assert set(res) == {"deva", "roman"}, res.keys()
    def keyf(s):
        m = res[s]; w = [x for x in m["wer"].values() if x is not None]
        return (len(m["fails"]), len(m["miss_both"]), statistics.mean(w) if w else 9, 0 if s == "deva" else 1)
    chosen = min(res, key=keyf)
    doc = {"rule": json.load(open(os.path.join(OUT, "renders.json")))["rules"]["script_rule"], "chosen": chosen,
           "keys": {s: keyf(s) for s in res}, "screens": res}
    json.dump(doc, open(os.path.join(OUT, "script-choice.json"), "w"), ensure_ascii=False, indent=1)
    for s, m in res.items(): print(s, "fails", m["fails"], "miss_both", m["miss_both"], "wer", m["wer"], "dur", m["dur_s"])
    print("chosen", chosen)


def main():
    P = passages(); man = renders()
    rows = [r for r in man["renders"] if r.get("stage") == "main" and "file" in r]
    clips = [{"id": r["id"], "file": os.path.join(OUT, r["file"]), "passage": r["passage"], "text": P[r["passage"]]["text"],
              "beats": P[r["passage"]]["beats"]} for r in rows]
    with ThreadPoolExecutor(4) as ex: res = {m["id"]: m for m in ex.map(screen_clip, clips)}
    json.dump(res, open(os.path.join(OUT, "screen.json"), "w"), ensure_ascii=False, indent=1)
    picks = []
    os.makedirs(os.path.join(OUT, "wav"), exist_ok=True)
    for eng in ("diya", "mai", "oai"):
        for pid in P:
            takes = sorted([r for r in rows if r["engine"] == eng and r["passage"] == pid], key=lambda r: r["take"])
            chosen = next((r for r in takes if not res[r["id"]]["fails"]), None)
            npass = chosen is None
            if npass and takes: chosen = min(takes, key=lambda r: (len(res[r["id"]]["fails"]), r["take"]))
            if not chosen: continue
            dst = os.path.join(OUT, "wav", f"{eng}__{pid}.wav"); shutil.copyfile(os.path.join(OUT, chosen["file"]), dst)
            picks.append({"engine": eng, "passage": pid, "take": chosen["take"], "id": chosen["id"], "no_take_passed": npass,
                          "file": os.path.relpath(dst, OUT), "source": chosen["file"],
                          "take_check": [{"take": r["take"], "fails": res[r["id"]]["fails"]} for r in takes]})
    # cost per minute from billed units over ALL main takes of each engine (audio minutes = full rendered duration)
    PRICE = {"azure_hd_chars_per_M": 22.0, "oai_text_in_per_M": 0.60, "oai_audio_out_per_M": 12.0, "inr_per_usd": 88}
    cost = {}
    for eng in ("diya", "mai", "oai"):
        R = [r for r in rows if r["engine"] == eng]
        if not R: continue
        mins = sum(r["audio_s"] for r in R) / 60
        spk = sum(res[r["id"]]["speech_span_s"] for r in R) / 60
        if eng in ("diya", "mai"):
            ch = sum(r["billed_chars"] for r in R); usd = ch * PRICE["azure_hd_chars_per_M"] / 1e6
            unit = {"billed_chars": ch, "text_chars": sum(r["text_chars"] for r in R)}
        else:
            # non-streamed renders carry no usage: billed tokens = SSE calibration rates (render.mjs calib stage)
            cal = [r for r in man["renders"] if r.get("stage") == "calib" and r.get("usage")]
            tps = [r["usage"]["output_tokens"] / r["audio_s"] for r in cal]
            rate = statistics.median(tps)
            # input tokens = a + b*chars, least squares over the calibration calls (instructions repeated in each)
            xs = [r["text_chars"] for r in cal]; ys = [r["usage"]["input_tokens"] for r in cal]
            b = np.polyfit(xs, ys, 1); ti = sum(float(np.polyval(b, r["text_chars"])) for r in R)
            to = rate * sum(r["audio_s"] for r in R)
            usd = ti * PRICE["oai_text_in_per_M"] / 1e6 + to * PRICE["oai_audio_out_per_M"] / 1e6
            unit = {"input_tokens_est": round(ti), "output_tokens_est": round(to), "method": "estimated from SSE calibration (n=%d single-beat calls): median %.2f audio tokens per second of output audio (range %.2f-%.2f); input tokens by a linear fit on characters" % (len(cal), rate, min(tps), max(tps)),
                    "calib": [{"beat": r["beat"], "audio_s": r["audio_s"], **r["usage"]} for r in cal]}
        cost[eng] = {"renders": len(R), "audio_min": round(mins, 2), "speech_min": round(spk, 2), "usd": round(usd, 4), **unit,
                     "usd_per_min": round(usd / mins, 4), "inr_per_min": round(usd / mins * PRICE["inr_per_usd"], 2),
                     "usd_per_speech_min": round(usd / spk, 4), "usd_per_passage": round(usd / len(R), 4), "inr_per_passage": round(usd / len(R) * PRICE["inr_per_usd"], 2)}
    doc = {"v": "taxila-voice-final-manifest/1", "date": "2026-10-04", "built_by": "docs/research/voice/final/screen.py",
           "rules": man["rules"], "gates": GATES, "flags": FLAGS, "post_hoc": POST_HOC, "observed_after_screen": OBSERVED_AFTER_SCREEN,
           "measured_while_rendering": ["gpt-4o-mini-tts with stream_format 'sse' stalled on the full P1 after 33.85 s of audio (86 deltas, no speech.audio.done, server closed after ~5 min, n=1); the same body non-streamed returned 83.8 s of audio in 12.4 s, so every oai render here is non-streamed WAV (render.mjs oai())",
                                        "gpt-4o-mini-tts is offered in no India region (ARM model catalogue centralindia and southindia: none; eastus2: 2025-03-20 and 2025-12-15), so oai renders came from eastus2; Diya and MAI from centralindia"],
           "mai_live_stylelist": man.get("mai_live_stylelist"),
           "script_choice": {k: v for k, v in json.load(open(os.path.join(OUT, "script-choice.json"))).items() if k != "screens"},
           "prices": PRICE, "cost": cost, "picks": picks,
           "takes": [{**{k: r.get(k) for k in ("id", "engine", "passage", "take", "voice", "file", "audio_s", "ttfb_ms", "billed_chars", "text_chars", "usage", "styles", "script")},
                      "screen": res[r["id"]]} for r in sorted(rows, key=lambda r: r["id"])]}
    json.dump(doc, open(os.path.join(OUT, "manifest.json"), "w"), ensure_ascii=False, indent=1)
    print("| take | dur s | w/s | max pause | LUFS / TP | WER gptx / az | both-STT misses | words inserted (both STTs) | fails | flags |")
    for r in sorted(rows, key=lambda r: (r["engine"], r["passage"], r["take"])):
        m = res[r["id"]]
        print(f"| {r['id']} | {m['dur_s']:.1f} | {m['words_per_s']} | {m['max_pause_s']} | {m['input_lufs']:.1f} / {m['input_tp']:.1f} | "
              f"{m['wer']['gptx']} / {m['wer']['az']} | {', '.join(m['miss_both']) or '-'} | {' '.join(m['ins_both']) or '-'} | {', '.join(m['fails']) or 'PASS'} | {'; '.join(m['flags']) or '-'} |")
    for p in picks: print("PICK", p["engine"], p["passage"], "t%d" % p["take"], "NO TAKE PASSED" if p["no_take_passed"] else "")
    print(json.dumps(cost, indent=1))


if __name__ == "__main__":
    {"probe": probe, "main": main}[sys.argv[1]]()
