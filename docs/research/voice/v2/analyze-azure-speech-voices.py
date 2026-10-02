# analyze-azure-speech-voices.py — aggregate results.json from azure-speech-voices.mjs into per-arm table rows.
# Prices: Azure retail prices API, eastus2, fetched 2026-10-02 (see report §Price). [U] marks a meter guess.
import json, statistics as st, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
rows = json.load(open(os.path.join(HERE, "results.json")))
HINDI = {"a-greet", "b-fractions", "c-hindi", "e-praise-correct"}

def price(arm, chars, secs):
    # $/1M chars, and evidence tag
    if arm.startswith("dhd-"): return 22.0, "V (Neural HD meter)"
    if arm.startswith("mai-hd"): return 22.0, "U (no MAI meter; assumes Neural HD)"
    if arm.startswith("mai-flash"): return 15.0, "U (no MAI meter; assumes Neural)"
    if arm.startswith("omni"): return 22.0, "U (assumes Neural HD)"
    if arm == "diya-dragon": return 15.0, "U (assumes Neural)"
    if arm.startswith("swara"): return 15.0, "V (S1 Neural meter)"
    if arm.startswith("4omtts"):  # meters V: gpt-4o-mini-tts-aud-out-glbl $0.012/1K tok, txt-inp-glbl $0.0006/1K
        # $12/M audio-out tokens (global), ~1250 audio tok/min (OpenAI's $0.015/min estimate) + $0.6/M text in (~chars/3 tok)
        usd = secs / 60 * 1250 * 12e-6 + chars / 3 * 0.6e-6
        return usd / chars * 1e6, "I (tokens from audio length)"
    return None, "?"

arms = {}
for r in rows:
    arms.setdefault(r["arm"], []).append(r)
out = []
for arm, rs in arms.items():
    ok = [r for r in rs if "code" in r]
    errs = len(rs) - len(ok)
    if not ok:
        out.append({"arm": arm, "voice": rs[0]["voice"], "n": 0, "errors": errs, "err": rs[0].get("err")}); continue
    chars = sum(r["chars"] for r in ok); secs = sum(r["audio_s"] or 0 for r in ok)
    w = [r["wer"] for r in ok if "wer" in r]
    offscript = sum(1 for r in ok if r["passage"] in HINDI and r.get("asr_script") and (r["asr_script"].get("arabic", 0) + r["asr_script"].get("bengali", 0) + r["asr_script"].get("other", 0)) > 0.1)
    p, tag = price(arm, chars, secs)
    out.append({
        "arm": arm, "voice": ok[0]["voice"], "n": len(ok), "errors": errs,
        "ttfb_med": round(st.median(r["ttfb_ms"] for r in ok)), "ttfb_max": max(r["ttfb_ms"] for r in ok),
        "total_med": round(st.median(r["total_ms"] for r in ok)),
        "rtf": round(sum(r["total_ms"] for r in ok) / 1000 / secs, 3) if secs else None,
        "cps": round(chars / secs, 1) if secs else None,
        "wer_mean": round(st.mean(w), 3) if w else None, "wer_max": max(w) if w else None,
        "wer_by_p": {r["passage"][0]: r.get("wer") for r in ok},
        "offscript": offscript,
        "usd_per_M": round(p, 2) if p else None, "price_tag": tag,
        "usd_per_min": round(p * (chars / secs) * 60 / 1e6, 4) if p and secs else None,
    })
json.dump(out, open(os.path.join(HERE, "summary.json"), "w"), indent=1, ensure_ascii=False)
print("| arm | voice | n | TTFB med (max) ms | total med ms | RTF | chars/s | WER mean (max) | WER a/b/c/d/e | off-script | $/1M chars | $/min speech |")
print("|---|---|---|---|---|---|---|---|---|---|---|---|")
for o in sorted(out, key=lambda o: (o.get("wer_mean") is None, o["arm"])):
    if not o["n"]:
        print(f"| `{o['arm']}` | `{o['voice']}` | 0 | ERROR: {str(o.get('err'))[:60]} |||||||||"); continue
    wp = "/".join("-" if o["wer_by_p"].get(k) is None else f"{o['wer_by_p'][k]:.2f}" for k in "abcde")
    print(f"| `{o['arm']}` | `{o['voice']}` | {o['n']} | {o['ttfb_med']} ({o['ttfb_max']}) | {o['total_med']} | {o['rtf']} | {o['cps']} | {o['wer_mean']:.3f} ({o['wer_max']:.2f}) | {wp} | {o['offscript']} | {o['usd_per_M']} {o['price_tag'][0]} | {o['usd_per_min']} |")
