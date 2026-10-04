# collect.py: listen-proxy pass 1 for VOICE v3 (2026-10-04). For every render in ../renders/manifest*.json plus the
# round-1 DragonHD Diya plain anchor, store per clip:
#   vad  : energy VAD on 20 ms frames (speech = frame RMS within 35 dB of the clip's 95th-percentile frame), lead/trail
#          silence and every internal pause >= 120 ms
#   gptx : taxila-gpt-transcribe (gpt-transcribe 2026-07-28, eastus2), no prompt, no language hint (a prompt makes it
#          fabricate on non-speech, rejected.md gpt-transcribe-fabricates-nonspeech; every clip here is speech)
#   az   : Azure Speech short-audio hi-IN detailed + wordLevelTimestamps (centralindia). Short-audio stops at the first
#          long pause, so the remainder is re-submitted until the clip is covered (fixes the v3 renders' "STT stopped
#          early" caveat)
# Cache: raw/<clip id>.json (re-runs skip done clips). Never prints a key.
# Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; python3 docs/research/voice/v3/screen/collect.py
import json, os, re, subprocess, sys, time, uuid, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REN = os.path.join(HERE, "..", "renders")
ROOT = os.path.abspath(os.path.join(HERE, "../../../../.."))
RAW = os.path.join(HERE, "raw"); os.makedirs(RAW, exist_ok=True)
OAI = re.sub(r"/openai.*$", "", os.environ.get("AZURE_OPENAI_ENDPOINT", "").rstrip("/"))
R1 = os.path.join(ROOT, "docs/design/superhuman/voice-probe/wav")


def clips():
    out = []
    h = json.load(open(os.path.join(REN, "manifest.json")))
    for r in h["renders"]:
        out.append({**{k: r.get(k) for k in ("arm", "line", "cond", "engine", "voice", "status", "region", "ttfb_ms", "licence", "billing", "text")},
                    "take": 1, "file": os.path.join(REN, r["file"]), "src": "hosted"})
    o = json.load(open(os.path.join(REN, "manifest.open.json")))
    for r in o["renders"]:
        out.append({**{k: r.get(k) for k in ("arm", "line", "cond", "engine", "voice", "status", "region", "ttfb_ms", "licence", "billing", "text", "gender", "rtf")},
                    "take": r.get("take", 1), "file": os.path.join(REN, r["file"]), "src": "open"})
    lines = {r["line"]: r["text"] for r in h["renders"]}
    for L, t in sorted(lines.items()):
        out.append({"arm": "r1-dhd-diya-plain", "line": L, "cond": "plain", "engine": "azure-speech DragonHD (round 1 V2 plain)",
                    "voice": "en-IN-Diya? see HUMAN-VOICE (hi-IN Diya DragonHDLatestNeural)", "status": "GA", "region": "eastus2",
                    "ttfb_ms": None, "licence": "Azure Speech", "billing": "Azure grant", "text": t, "take": 1,
                    "file": os.path.join(R1, f"dhd-diya__{L}__plain.wav"), "src": "round1"})
    for c in out:
        c["id"] = f"{c['arm']}__{c['line']}__{c['cond']}__t{c['take']}"
    return out


def pcm16k(f):
    b = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f, "-ar", "16000", "-ac", "1", "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(b, dtype=np.int16)


def wav_bytes(x):
    import io, wave
    bio = io.BytesIO(); w = wave.open(bio, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(x.astype(np.int16).tobytes()); w.close()
    return bio.getvalue()


def vad(x):
    fr = 320; n = len(x) // fr
    e = np.array([np.sqrt(np.mean((x[i * fr:(i + 1) * fr].astype(np.float64)) ** 2)) + 1e-9 for i in range(n)])
    db = 20 * np.log10(e / 32768)
    ref = np.percentile(db, 95); sp = db > max(ref - 35, -60)
    idx = np.where(sp)[0]
    if len(idx) == 0: return {"dur_s": len(x) / 16000, "speech": False}
    first, last = idx[0], idx[-1]
    pauses = []; i = first
    while i <= last:
        if not sp[i]:
            j = i
            while j <= last and not sp[j]: j += 1
            if (j - i) * 0.02 >= 0.12: pauses.append([round(i * 0.02, 2), round(j * 0.02, 2)])
            i = j
        else: i += 1
    return {"dur_s": round(len(x) / 16000, 3), "lead_s": round(first * 0.02, 2), "trail_s": round((n - 1 - last) * 0.02, 2),
            "speech_span_s": round((last - first + 1) * 0.02, 2), "pauses": pauses, "ref_db": round(float(ref), 1)}


def post(url, data, headers, timeout=90):
    for a in range(5):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers), timeout=timeout))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503): time.sleep(3 * (a + 1)); continue
            raise
        except Exception:
            time.sleep(3 * (a + 1))
    raise RuntimeError("retries exhausted")


def gptx(x):
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="model"\r\n\r\ntaxila-gpt-transcribe\r\n'
            f'--{b}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n'
            f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="a.wav"\r\nContent-Type: audio/wav\r\n\r\n').encode() + wav_bytes(x) + f"\r\n--{b}--\r\n".encode()
    j = post(f"{OAI}/openai/deployments/taxila-gpt-transcribe/audio/transcriptions?api-version=2025-03-01-preview", body,
             {"api-key": os.environ["AZURE_OPENAI_API_KEY"], "Content-Type": "multipart/form-data; boundary=" + b})
    return j.get("text", "")


AZ = "https://centralindia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=hi-IN&format=detailed&wordLevelTimestamps=true"


def az(x):
    words, lex, off = [], [], 0
    for _ in range(6):
        seg = x[off:]
        if len(seg) < 16000 * 0.3: break
        j = post(AZ, wav_bytes(seg), {"Ocp-Apim-Subscription-Key": os.environ["AZURE_AI_CENTRALINDIA_KEY"],
                                       "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", "Accept": "application/json"})
        if j.get("RecognitionStatus") != "Success" or not j.get("NBest"): break
        nb = j["NBest"][0]; lex.append(nb.get("Lexical", ""))
        base = off / 16000
        ws = [{"w": w["Word"], "s": round(base + w["Offset"] / 1e7, 3), "e": round(base + (w["Offset"] + w["Duration"]) / 1e7, 3)} for w in nb.get("Words", [])]
        if not ws: break
        words += ws
        end = max(w["e"] for w in ws)  # the utterance Offset+Duration overran the last word on some clips; chain on the last word
        if end >= len(x) / 16000 - 0.4: break
        off = int((end + 0.05) * 16000)
    return {"lexical": " ".join(lex), "words": words, "calls": len(lex)}


def one(c):
    p = os.path.join(RAW, c["id"] + ".json")
    if os.path.exists(p): return "skip"
    x = pcm16k(c["file"])
    r = {"clip": c, "vad": vad(x)}
    try: r["gptx"] = gptx(x)
    except Exception as e: r["gptx_err"] = str(e)[:200]
    try: r["az"] = az(x)
    except Exception as e: r["az_err"] = str(e)[:200]
    json.dump(r, open(p, "w"), ensure_ascii=False, indent=1)
    return "ok"


if __name__ == "__main__":
    C = clips()
    if len(sys.argv) > 1 and sys.argv[1] == "list": print(len(C)); sys.exit()
    missing = [c for c in C if not os.path.exists(c["file"])]
    assert not missing, missing[:3]
    t = time.time()
    with ThreadPoolExecutor(6) as ex:
        for i, s in enumerate(ex.map(one, C)):
            if i % 25 == 0: print(i, s, round(time.time() - t), flush=True)
    print("done", len(C))
