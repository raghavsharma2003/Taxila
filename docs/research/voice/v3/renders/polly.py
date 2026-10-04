# polly.py — VOICE v3 hosted renders on Amazon Polly (round 2, 2026-10-04). AWS Activate credit.
# Kajal is the only India voice on the generative/neural engines. Polly has no native expressive control for these
# engines (no speaking styles; SSML <prosody> would be fake emphasis), so each voice gets the plain take only.
# Polly PCM tops out at 16 kHz, so the 24 kHz MP3 stream is decoded to 24 kHz PCM WAV (lossy source, noted).
# Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; python3 docs/research/voice/v3/renders/polly.py
import json, os, re, subprocess, time, html
import boto3

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../../.."))
src = open(os.path.join(ROOT, "docs/design/superhuman/voice-clips/blind-test.html"), encoding="utf8").read()
M = json.loads(re.search(r"const M=(\{.*?\});\n", src, re.S).group(1))
LINES = [(k, v["text"]) for k, v in M["scenes"].items()]
for k, t in LINES:
    assert not re.search(r"\d", t) and "..." not in t, k
MF = os.path.join(HERE, "manifest.json")

def record(e):
    m = json.load(open(MF)) if os.path.exists(MF) else {"v": "taxila-voice-v3-renders/1", "date": "2026-10-04", "renders": []}
    m["renders"] = [r for r in m["renders"] if not (r["arm"] == e["arm"] and r["line"] == e["line"] and r["cond"] == e["cond"])]
    m["renders"].append(e); m["renders"].sort(key=lambda r: r["arm"] + r["line"] + r["cond"])
    json.dump(m, open(MF, "w"), ensure_ascii=False, indent=1)

ARMS = [
    ("aws-polly-gen-kajal-hi", "ap-southeast-1", "generative", "hi-IN"),
    ("aws-polly-gen-kajal-en", "ap-southeast-1", "generative", "en-IN"),
    ("aws-polly-neural-kajal-hi", "ap-south-1", "neural", "hi-IN"),
]
PRICE = {"generative": "Polly generative $30/M chars", "neural": "Polly neural $16/M chars"}
for arm, region, engine, lang in ARMS:
    p = boto3.client("polly", region_name=region)
    p.describe_voices(LanguageCode=lang)  # warm the connection so TTFB is not TLS setup
    os.makedirs(os.path.join(HERE, arm), exist_ok=True)
    for lid, text in LINES:
        ssml = f'<speak>{html.escape(text, quote=False)}</speak>'
        t0 = time.perf_counter()
        try:
            r = p.synthesize_speech(Engine=engine, VoiceId="Kajal", LanguageCode=lang, OutputFormat="mp3", SampleRate="24000", TextType="ssml", Text=ssml)
        except Exception as ex:
            print(arm, lid, "ERR", ex); record({"arm": arm, "line": lid, "cond": "plain", "engine": f"aws-polly-{engine}", "voice": "Kajal", "error": str(ex)[:200]}); continue
        s = r["AudioStream"]; first = s.read(1024); ttfb = round((time.perf_counter() - t0) * 1000)
        rest = s.read(); total = round((time.perf_counter() - t0) * 1000)
        mp3 = os.path.join(HERE, arm, f"{lid}__plain.mp3"); open(mp3, "wb").write(first + rest)
        wav = os.path.join(HERE, arm, f"{lid}__plain.wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", wav], check=True)
        os.remove(mp3)
        dur = round((os.path.getsize(wav) - 44) / 48000, 2)
        record({"arm": arm, "line": lid, "cond": "plain", "file": os.path.relpath(wav, HERE), "engine": f"aws-polly-{engine}", "voice": "Kajal",
                "status": "GA", "region": region, "sample_rate": 24000, "dur_s": dur, "ttfb_ms": ttfb, "total_ms": total, "text": text,
                "settings": {"Engine": engine, "VoiceId": "Kajal", "LanguageCode": lang, "OutputFormat": "mp3", "SampleRate": "24000", "TextType": "ssml",
                             "notes": "no native expressive control on Polly generative/neural Kajal; plain only; MP3 24 kHz decoded to PCM WAV"},
                "licence": PRICE[engine], "billing": "AWS Activate credit (USD 1k)", "chars": len(text)})
        print(arm, lid, f"ttfb={ttfb} total={total} dur={dur}")
