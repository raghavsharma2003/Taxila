# asr-check.py — rough ASR round trip on every render (Azure Speech STT hi-IN, Lexical form = no digit ITN), 2026-10-04.
# Not a gpt-4o scorer. Two numbers per take: number words heard (the raters' "wrong numbers" failure) and a rough CER
# on the Devanagari part of the line (English words are dropped from both sides because hi-IN STT re-spells them).
# A screen for defects before a human hears anything, not a quality score.
# Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; python3 docs/research/voice/v3/renders/asr-check.py
import json, os, re, subprocess, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
MF = os.path.join(HERE, "manifest.json")
KEY = os.environ["AZURE_AI_CENTRALINDIA_KEY"]
URL = "https://centralindia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=hi-IN&format=detailed"
NUMS = ["सत्ताईस", "पैंतीस", "बीस", "तीस", "पचास", "सात", "पाँच", "बारह", "बासठ", "चार", "तीन", "दो", "एक"]
def deva(s): return re.sub(r"[^ऀ-ॿ]", "", s.replace("।", ""))
def cer(ref, hyp):
    r, h = deva(ref), deva(hyp); d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        p, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (r[i - 1] != h[j - 1]))
    return round(d[len(h)] / max(1, len(r)), 3)
def toks(s): return re.findall(r"[ऀ-ॿ]+", s.replace("पांच", "पाँच"))
m = json.load(open(MF))
for r in m["renders"]:
    if "file" not in r: continue
    req = urllib.request.Request(URL, data=subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(HERE, r["file"]), "-ar", "16000", "-ac", "1", "-f", "wav", "-"], capture_output=True, check=True).stdout, method="POST",
        headers={"Ocp-Apim-Subscription-Key": KEY, "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", "Accept": "application/json"})
    try: j = json.load(urllib.request.urlopen(req, timeout=60))
    except Exception as e: r["asr"] = {"error": str(e)[:120]}; continue
    nb = (j.get("NBest") or [{}])[0]; lex = nb.get("Lexical", "")
    want = [n for n in NUMS if n in toks(r["text"])]; got = toks(lex)
    r["asr"] = {"engine": "azure-stt hi-IN short-audio (Lexical)", "lexical": lex, "numbers_expected": want,
                "numbers_heard": [n for n in want if n in got], "deva_cer": cer(r["text"], lex)}
    print(f"{r['arm']:30s} {r['line']:12s} {r['cond']:10s} nums={len(r['asr']['numbers_heard'])}/{len(want)} cer={r['asr']['deva_cer']}")
json.dump(m, open(MF, "w"), ensure_ascii=False, indent=1)
