#!/usr/bin/env python3
"""Flatten the open-weight per-arm manifests (docs/research/voice/v3/renders/<arm>/manifest.json, written by
render_open.py + pull_open.py) into docs/research/voice/v3/renders/manifest.open.json, in the SAME schema as the hosted
renders' manifest.json ("taxila-voice-v3-renders/1": v, date, method, arms, cost, renders[]), plus the same screens:
  silence  ffmpeg silencedetect -45 dB / 0.35 s (as the hosted renders)
  asr      Azure STT hi-IN short-audio, Lexical form, centralindia (the hosted asr-check.py method); --no-asr skips it
  defects  automated: internal gap > 2.5 s, numbers missing in ASR, hit the token cap, audio much longer than the line
The hosted manifest.json is never written here (another workflow owns it).

    set -a; . ./.env.local; set +a; python3 scripts/voice/v3/open_manifest.py [--no-asr]
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
REN = ROOT / "docs/research/voice/v3/renders"
OUT = REN / "manifest.open.json"
ARMS = ["veena", "svara", "voxcpm2", "chatterbox-hi", "vibevoice-hindi-7b", "vibevoice-hindi-1.5b"]
NUMS = ["सत्ताईस", "पैंतीस", "बीस", "तीस", "पचास", "सात", "पाँच", "बारह", "बासठ", "चार", "तीन", "दो", "एक"]
URL = "https://centralindia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=hi-IN&format=detailed"


def deva(s):
    return re.sub(r"[^ऀ-ॿ]", "", s.replace("।", ""))


def cer(ref, hyp):
    r, h = deva(ref), deva(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        p, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (r[i - 1] != h[j - 1]))
    return round(d[len(h)] / max(1, len(r)), 3)


def toks(s):
    return re.findall(r"[ऀ-ॿ]+", s.replace("पांच", "पाँच"))


def silence(path, dur):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "silencedetect=noise=-45dB:d=0.35", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    spans = [(s, en[i] if i < len(en) else dur) for i, s in enumerate(st)]
    lead = next((e for s, e in spans if s <= 0.01), 0.0)
    trail = next((dur - s for s, e in spans if e >= dur - 0.02 and s > 0.01), 0.0)
    gaps = [round(e - s, 2) for s, e in spans if s > 0.01 and e < dur - 0.02]
    return {"lead_s": round(lead, 2), "trail_s": round(trail, 2), "internal_gaps_s": gaps, "speech_span_s": round(dur - lead - trail, 2)}


def asr(path, key):
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-ar", "16000", "-ac", "1", "-f", "wav", "-"], capture_output=True, check=True).stdout
    req = urllib.request.Request(URL, data=pcm, method="POST", headers={"Ocp-Apim-Subscription-Key": key,
                                 "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", "Accept": "application/json"})
    for i in range(4):
        try:
            return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception as e:
            if i == 3:
                raise
            time.sleep(3 * (i + 1))


def main():
    do_asr = "--no-asr" not in sys.argv
    key = os.environ.get("AZURE_AI_CENTRALINDIA_KEY") if do_asr else None
    if do_asr and not key:
        sys.exit("AZURE_AI_CENTRALINDIA_KEY not set (source .env.local) or pass --no-asr")
    prev = {}
    if OUT.exists():                                   # keep ASR already paid for
        for r in json.load(open(OUT)).get("renders", []):
            if r.get("asr") and "error" not in r["asr"]:
                prev[r["file"]] = r["asr"]
    renders, arms, stt_s = [], [], 0.0
    for arm in ARMS:
        mf = REN / arm / "manifest.json"
        if not mf.exists():
            continue
        m = json.load(open(mf))
        job = m.get("job") or {}
        lines = {l["id"]: l["text"] for l in json.load(open(ROOT / "scripts/voice/v3/lines.json"))["lines"]}
        rows = []
        for c in m["clips"]:
            if not c.get("ok"):
                continue
            f = f"{arm}/{c['file']}"
            text = lines[c["line"]]
            r = {"arm": f"oss-{arm}-{c['voice'].lower()}", "line": c["line"], "cond": "plain" if c["style"] == "plain" else "expressive",
                 "take": c["take"], "file": f, "engine": f"open-weight {m['model']}", "voice": f"{m['model']} / {c['voice']}",
                 "gender": c.get("gender"), "status": "open weights (self-hosted experiment)", "region": job.get("region"),
                 "gpu": f"{job.get('instanceType')} {(m.get('runtime') or {}).get('gpu')} ({job.get('lifecycle')})",
                 "sample_rate": c["sampleRate"], "dur_s": c["audioS"],
                 "ttfb_ms": round(c["ttfbS"] * 1000) if c.get("ttfbS") is not None else None,
                 "ttfb_basis": m.get("ttfbNote") or "on-GPU time to first decodable audio, single stream, warm model, bf16, no server (render_open.py docstring); take 1 only",
                 "total_ms": round(c["wallS"] * 1000) if c.get("wallS") is not None and c.get("batch", 1) == 1 else None,
                 "rtf": c.get("rtf"), "text": text, "sent": c.get("textSent"),
                 "settings": {"styleControl": c.get("styleControl"), "seed": c.get("seed"), "batch": c.get("batch"), **(m.get("settings") or {})},
                 "licence": f"{m.get('licence')} ({m['model']} @ {next(iter(m['repos'].values()))['revision'][:12]}); {m.get('notes')}",
                 "billing": "AWS Activate credit (USD 1k), EC2 GPU spot", "chars": len(text)}
            p = REN / f
            r["silence"] = silence(p, c["audioS"])
            r["silence"]["chars_per_s"] = round(len(text) / max(0.1, r["silence"]["speech_span_s"]), 1)
            if do_asr:
                if f in prev:
                    r["asr"] = prev[f]
                else:
                    try:
                        j = asr(p, key)
                        stt_s += c["audioS"]
                        lex = ((j.get("NBest") or [{}])[0]).get("Lexical", "")
                        want = [n for n in NUMS if n in toks(text)]
                        got = toks(lex)
                        r["asr"] = {"engine": "azure-stt hi-IN short-audio (Lexical)", "lexical": lex, "numbers_expected": want,
                                    "numbers_heard": [n for n in want if n in got], "deva_cer": cer(text, lex)}
                    except Exception as e:
                        r["asr"] = {"error": str(e)[:120]}
            d = [f"long_silence: internal gap {g} s" for g in r["silence"]["internal_gaps_s"] if g > 2.5]
            if c.get("hitTokenCap"):
                d.append("hit_token_cap: generation stopped at max_new_tokens")
            if r["silence"]["chars_per_s"] < 8:
                d.append(f"slow_or_padded: {r['silence']['chars_per_s']} chars/s of speech span")
            a = r.get("asr") or {}
            if a.get("numbers_expected") and len(a.get("numbers_heard", [])) < len(a["numbers_expected"]):
                miss = [n for n in a["numbers_expected"] if n not in a["numbers_heard"]]
                d.append(f"numbers_missing_in_asr: {' '.join(miss)}")
            if a.get("deva_cer") is not None and a["deva_cer"] > 0.5:
                d.append(f"high_cer: {a['deva_cer']}")
            r["defects"] = d
            rows.append(r)
            print(f"{r['arm']:34s} {r['line']:12s} {r['cond']:10s} t{r['take']} cer={a.get('deva_cer')} nums={len(a.get('numbers_heard', []))}/{len(a.get('numbers_expected', []))} {d}", flush=True)
        renders += rows
        tt = sorted(x["ttfb_ms"] for x in rows if x["ttfb_ms"] is not None)
        cers = sorted(x["asr"]["deva_cer"] for x in rows if (x.get("asr") or {}).get("deva_cer") is not None)
        for v in sorted({x["arm"] for x in rows}):
            vr = [x for x in rows if x["arm"] == v]
            vt = sorted(x["ttfb_ms"] for x in vr if x["ttfb_ms"] is not None)
            vc = sorted(x["asr"]["deva_cer"] for x in vr if (x.get("asr") or {}).get("deva_cer") is not None)
            arms.append({"arm": v, "engine": vr[0]["engine"], "voice": vr[0]["voice"], "gender": vr[0]["gender"], "status": vr[0]["status"],
                         "region": vr[0]["region"], "gpu": vr[0]["gpu"], "licence": vr[0]["licence"], "billing": vr[0]["billing"],
                         "conds": sorted({x["cond"] for x in vr}), "n": len(vr), "takes_per_cell": max(x["take"] for x in vr),
                         "ttfb_ms": {"median": vt[len(vt) // 2] if vt else None, "min": vt[0] if vt else None, "max": vt[-1] if vt else None, "n": len(vt)},
                         "rtf_median": sorted(x["rtf"] for x in vr if x["rtf"] is not None)[len([x for x in vr if x["rtf"] is not None]) // 2] if any(x["rtf"] is not None for x in vr) else None,
                         "deva_cer_median": vc[len(vc) // 2] if vc else None,
                         "takes_with_defects": sum(1 for x in vr if x["defects"]),
                         "arm_dir": arm, "job": job.get("jobId"), "arm_cost_usd_est": job.get("armCostUsdEst"), "job_cost_usd": job.get("jobCostUsd")})
    out = {"v": "taxila-voice-v3-renders/1", "date": time.strftime("%Y-%m-%d"),
           "method": {"lines": "scripts/voice/v3/lines.json = the 5 round-1 lines from blind-test.html M.scenes, unchanged (numbers as Hindi words, English in Latin script, no ellipsis)",
                      "conds": "plain = the line as written; expressive = the model's own native control only (Svara end-of-line emotion tag, VoxCPM2 parenthesised style note, Chatterbox exaggeration knob). Veena and VibeVoice have no native control: plain only.",
                      "takes": "3 takes per cell, seeds recorded, nobody picked a take. Take 1 ran alone on the GPU (latency); takes 2-3 of Veena/Svara were batched (no latency).",
                      "voices": "built-in voices for Veena (kavya, maitri F; agastya, vinaya M) and Svara (Hindi Female/Male). VoxCPM2 voices designed from a text description; Chatterbox and VibeVoice clone ONLY those synthetic VoxCPM2 designs (no real person). VibeVoice's shipped hi-Priya_woman.wav was not used (provenance unstated).",
                      "ttfb": "on-GPU, single stream, warm model, bf16, HF transformers / reference code, no serving engine (vLLM/TensorRT would be faster). Codec LMs: 28 audio tokens + SNAC decode of that window. VoxCPM2/VibeVoice: first streamed chunk. Chatterbox: full synthesis (no streaming). us-east-1 GPU, so NOT India latency and not network latency.",
                      "screens": "silence: ffmpeg silencedetect -45 dB / 0.35 s; asr: Azure STT hi-IN short-audio Lexical (as the hosted asr-check.py), rough, English words dropped; defects: automated flags only. None of this replaces the blind page.",
                      "format": "mono 16-bit PCM WAV at each model's native rate (24 kHz; VoxCPM2 48 kHz; Chatterbox 24 kHz). Not loudness-normalised yet (-26 LUFS before any rater).",
                      "source": "scripts/voice/v3/render_open.py run by scripts/gpu/run.py (job dir scripts/voice/v3); pulled by pull_open.py; per-arm detail incl. weight sha256 in renders/<arm>/manifest.json"},
           "arms": arms,
           "cost": {"this_run_estimate_usd": {"aws": "see arms[].job_cost_usd (EC2 spot, run.json estimate)", "azure_stt_screen_s": round(stt_s, 1),
                                              "azure_stt_usd_est": round(stt_s / 3600 * 1.0, 3)}},
           "renders": renders}
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"{len(renders)} renders, {len(arms)} voice arms -> {OUT}; STT {stt_s:.0f} s")


if __name__ == "__main__":
    main()
