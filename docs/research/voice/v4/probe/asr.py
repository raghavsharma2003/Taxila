# asr.py — Azure STT hi-IN (centralindia, short-audio REST, Lexical, word timestamps) over v4 renders, 2026-10-04.
# Screens for: words spoken that were markup (leaks), numbers heard, and per-word durations (the emphasis test).
# Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; python3 docs/research/voice/v4/probe/asr.py caps|lines [idRegex]
import json, os, re, subprocess, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
KEY = os.environ["AZURE_AI_CENTRALINDIA_KEY"]
URL = "https://centralindia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=hi-IN&format=detailed&wordLevelTimestamps=true"

def stt(path):
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ar", "16000", "-ac", "1", "-f", "wav", "-"], capture_output=True, check=True).stdout
    req = urllib.request.Request(URL, data=pcm, method="POST", headers={"Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", "Accept": "application/json"})
    j = json.load(urllib.request.urlopen(req, timeout=60))
    nb = (j.get("NBest") or [{}])[0]
    words = [{"w": w["Word"], "ms": round(w["Duration"] / 1e4), "at": round(w["Offset"] / 1e4)} for w in nb.get("Words", [])]
    return {"lexical": nb.get("Lexical", ""), "words": words}

if __name__ == "__main__":
    which = sys.argv[1]; flt = re.compile(sys.argv[2]) if len(sys.argv) > 2 else None
    mf = os.path.join(HERE, f"{which}-renders.json"); man = json.load(open(mf))
    for r in man["renders"]:
        if "file" not in r or (flt and not flt.search(r["id"])): continue
        try: r["asr"] = stt(os.path.join(HERE, r["file"]))
        except Exception as e: r["asr"] = {"error": str(e)[:120]}
        print(r["id"], r.get("take"), r["asr"].get("lexical", r["asr"].get("error")))
    json.dump(man, open(mf, "w"), ensure_ascii=False, indent=1)
