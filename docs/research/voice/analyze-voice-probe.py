#!/usr/bin/env python3
"""Summarise probe-voices-hindi.mjs results.json per arm (stdlib only; ffmpeg for loudness).

Usage: python3 analyze-voice-probe.py <outdir> [--loudness]
Prints a markdown table: lane, voice, n, median TTFA, median wall, mean key-term recall
(ASR round-trip, an intelligibility PROXY only), speech rate, verbatim fidelity for S2S lanes.
"""
import json, re, statistics, subprocess, sys, unicodedata, os

out = sys.argv[1]
rows = json.load(open(os.path.join(out, "results.json"), encoding="utf-8"))
STIM = {  # same texts as the probe, for verbatim-fidelity and chars/sec
    "s1-deva": "अच्छा, अब ध्यान से सुनो। जब हम किसी चीज़ को बराबर हिस्सों में बाँटते हैं, तो हर हिस्सा एक भिन्न कहलाता है।",
    "s2-roman": "Theek hai, toh denominator humein batata hai ki pizza ke kitne barabar tukde hain. Ab tum batao, kitne tukde khaaye?",
    "s3-mixed": "बहुत बढ़िया! Photosynthesis में पौधे sunlight, पानी और carbon dioxide से अपना खाना बनाते हैं।",
    "s4-numerals": "Rectangle का area होता है length गुणा breadth, यानी 12 cm गुणा 5 cm बराबर 60 square cm।",
    "s5-english": "Good try! Let's check it once more. Which one is bigger, three by four or two by three?",
}

def toks(t):
    t = unicodedata.normalize("NFC", t.lower()).replace("\u093c", "")
    # \w misses Devanagari matras (Mn/Mc); include the whole block so words are not shredded
    # (Gurukul `romanised-lexicon-meets-devanagari-asr`: a tokenizer that drops \p{M} splits every matra).
    return re.findall(r"[\wऀ-ॣ०-ॿ]+", t)

def fidelity(stim, said):
    """Share of stimulus tokens present in the model's own output transcript (S2S lanes only).
    Script-sensitive: a Roman stimulus echoed in Devanagari scores low, so read it with the ASR column."""
    a, b = toks(STIM[stim]), set(toks(said or ""))
    return sum(1 for x in a if x in b) / max(1, len(a))

def lufs(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", p.stderr)
    return float(m[-1]) if m else None

by = {}
for r in rows:
    by.setdefault(r["arm"], []).append(r)
want_loud = "--loudness" in sys.argv
print("| arm | n | median first audio ms | median wall ms | recall raw | recall script-aware | non-Hindi script (2 ASR passes × Hindi clips) | chars/s | verbatim (S2S) | LUFS |")
print("|---|---|---|---|---|---|---|---|---|---|")
summary = []
for arm, rs in by.items():
    ok = [r for r in rs if "err" not in r and r.get("audio_s", 0) > 0.2]
    errs = [r for r in rs if "err" in r]
    if not ok:
        print(f"| `{arm}` | 0 | {len(errs)}: {errs[0]['err'][:60] if errs else ''} | | | | | | |"); continue
    med = lambda k: int(statistics.median([r[k] for r in ok]))
    raw = [r.get("recall_nohint", r.get("key_recall")) for r in ok if r.get("key_recall") is not None]
    sa = [r["recall_sa"] for r in ok if r.get("recall_sa") is not None]
    # non-Hindi script in the ASR output (Urdu/Nastaliq or Bengali), counted over both ASR passes,
    # Hindi stimuli only: a language-ID signal, not an intelligibility one
    nonhi = lambda t: bool(re.search(r"[\u0600-\u06FF\u0980-\u09FF]", t or ""))
    hindi = [r for r in ok if r["stim"] != "s5-english"]
    urdu = sum(int(nonhi(r.get("asr"))) + int(nonhi(r.get("asr_hi"))) for r in hindi)
    cps = statistics.median([len(STIM[r["stim"]]) / r["audio_s"] for r in ok])
    fid = "" if not any(r.get("said") for r in ok) else f"{statistics.mean([fidelity(r['stim'], r.get('said')) for r in ok]):.2f}"
    loud = ""
    if want_loud:
        vals = [lufs(os.path.join(out, f"{arm.replace(':','_').replace('|','_')}__{r['stim']}.wav")) for r in ok]
        vals = [v for v in vals if v is not None]
        loud = f"{statistics.mean(vals):.1f}" if vals else ""
    f2 = lambda xs: f"{statistics.mean(xs):.2f}" if xs else "n/a"
    summary.append({"arm": arm, "n": len(ok), "ttfa": med("ttfa_ms"), "wall": med("wall_ms"), "raw": statistics.mean(raw) if raw else None,
                    "sa": statistics.mean(sa) if sa else None, "urdu": urdu, "cps": cps, "lufs": loud, "errs": len(errs)})
    shown = arm.replace("|", " + ")
    print(f"| `{shown}` | {len(ok)}{'+'+str(len(errs))+'err' if errs else ''} | {med('ttfa_ms')} | {med('wall_ms')} | {f2(raw)} | {f2(sa)} | {urdu}/{2*len(hindi)} | {cps:.1f} | {fid} | {loud} |")
json.dump(summary, open(os.path.join(out, "summary.json"), "w"), indent=1)
