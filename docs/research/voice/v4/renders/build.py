# build.py — picks one take per arm-line by the pre-registered rule (render.mjs RULES.take_rule), loudness-normalises it
# exactly as round 2 did (../../v3/blind/build.py: ebur128 measure, ONE static gain to -26 LUFS, true peak <= -2 dBFS,
# no compression), writes WAV (source rate, 16-bit mono) + MP3 (44.1 kHz mono 96 kbps), and the manifest with the screen.
# Arm A is the exact round-2 page MP3 (byte copy, found through ../../v3/blind/blind-key.json) plus its source WAV at the
# same static gain. Run after screen.py score.   python3 docs/research/voice/v4/renders/build.py
import json, os, re, shutil, subprocess, sys, hashlib, statistics as st
HERE = os.path.dirname(os.path.abspath(__file__))
V4 = os.path.dirname(HERE); ROOT = os.path.abspath(os.path.join(V4, "../../../.."))
BLIND = os.path.join(V4, "..", "v3", "blind")
TARGET, TP = -26.0, -2.0
LINES5 = ["L1-think", "L2-laugh", "L3-surprise", "L4-correct", "L5-wonder"]
ARMS = {"A": "dhd-diya-anchor", "B": "dhd-diya-text", "C": "dhd-diya-plan", "D": "nova-kiara-plan"}


def sh(a): return subprocess.run(a, capture_output=True, text=True)


def loud(path):
    e = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])


def encode(src, wav, mp3):
    i, tp = loud(src); g = TARGET - i
    if tp + g > TP: sys.exit(f"{src}: gain {g:+.2f} dB would push true peak above {TP} dBFS")
    af = f"volume={g:.2f}dB"
    for dst, extra in ((wav, ["-c:a", "pcm_s16le"]), (mp3, ["-af", af + ",aresample=44100", "-c:a", "libmp3lame", "-b:a", "96k"])):
        if dst is None: continue
        args = ["ffmpeg", "-hide_banner", "-y", "-i", src, "-ac", "1"] + (["-af", af] if dst == wav else []) + extra + [dst]
        r = sh(args)
        if r.returncode: sys.exit(r.stderr[-1500:])
    oi, otp = loud(wav)
    return {"input_lufs": i, "gain_db": round(g, 2), "wav_lufs": oi, "wav_true_peak_dbfs": otp}


def md5(p): return hashlib.md5(open(p, "rb").read()).hexdigest()


def main():
    clips = {m["id"]: m for m in json.load(open(os.path.join(HERE, "screen", "clips.json")))}
    ren = json.load(open(os.path.join(HERE, "renders.json")))
    rules = ren["rules"]
    key = json.load(open(os.path.join(BLIND, "blind-key.json")))["clips"]
    r2code = {v["line"]: k for k, v in key.items() if v["arm"] == "r1-dhd-diya-plain"}
    for d in ("wav", "mp3"): os.makedirs(os.path.join(HERE, d), exist_ok=True)
    out = []
    picks = [(L, "orig", "primary", "A") for L in LINES5]
    for r in ren["renders"]:
        if r.get("take") == 1 and "file" in r: picks.append((r["line"], r["v"], r["role"], r["arm"]))
    for line, v, role, arm in sorted(set(picks), key=lambda x: (x[3], x[0], x[2] != "primary")):
        name = f"{arm}__{ARMS[arm]}__{line}" + ("" if role == "primary" else f"__{v}-reserve")
        wav, mp3 = os.path.join(HERE, "wav", name + ".wav"), os.path.join(HERE, "mp3", name + ".mp3")
        if arm == "A":
            cid = f"A__dhd-diya-anchor__{line}__t1"; m = clips[cid]
            code = r2code[line]; src_mp3 = os.path.join(BLIND, f"{code}.mp3")
            shutil.copyfile(src_mp3, mp3)
            n = encode(m_src := os.path.join(ROOT, key[code]["source"]), wav, None)
            e = {"arm": arm, "line": line, "v": "orig", "role": role, "take": 1, "take_check": [{"take": 1, "gate_fails": m["gate_fails"]}],
                 "source": key[code]["source"], "round2_page_mp3": os.path.relpath(src_mp3, ROOT), "round2_code": code,
                 "mp3_is_byte_copy": md5(src_mp3) == md5(mp3), "round2_output_lufs": key[code]["output_lufs"], **n}
        else:
            tk = [clips[f"{arm}__{ARMS[arm]}__{line}{v}__t{t}"] for t in range(1, rules["takes"] + 1)]
            chosen = next((m for m in tk if not m["gate_fails"]), None)
            flagged = chosen is None
            m = chosen or tk[0]
            rr = next(x for x in ren["renders"] if x["id"] == m["id"])
            src = os.path.join(HERE, rr["file"])
            n = encode(src, wav, mp3)
            e = {"arm": arm, "line": line, "v": v, "role": role, "take": m["take"], "no_take_passed": flagged,
                 "take_check": [{"take": x["take"], "gate_fails": x["gate_fails"]} for x in tk], "source": os.path.relpath(src, ROOT),
                 "voice": rr["voice"], **({"ssml": rr["ssml"]} if rr.get("ssml") else {}), **({"nova_system": rr["system"], "nova_self_transcript": rr.get("said")} if arm == "D" else {}), **n}
        mp3i, mp3tp = loud(mp3)
        e.update({"id": name, "engine_arm": ARMS[arm], "text": m["text"], "wav": os.path.relpath(wav, HERE), "mp3": os.path.relpath(mp3, HERE),
                  "mp3_lufs": mp3i, "mp3_true_peak_dbfs": mp3tp, "screen_clip_id": m["id"], "screen": screen_of(m)})
        out.append(e)
        print(name, f"t{e['take']}", f"{e['input_lufs']:+.1f} -> wav {e['wav_lufs']:+.1f} mp3 {mp3i:+.1f} tp {e['wav_true_peak_dbfs']:+.1f}", e["take_check"])
    summary = summarise(out, clips)
    man = {"v": "taxila-voice-r3-candidates/1", "date": "2026-10-04", "built_by": "docs/research/voice/v4/renders/build.py",
           "status": "machine screen only; nobody has listened. Filenames name the arm: re-code them (v3/blind/build.py) before any rater sees them.",
           "arms": {"A": "DragonHD Diya, the exact round-2 clip (original line, plain SSML) — anchor",
                    "B": "DragonHD Diya, v4 spoken-register line, plain SSML (no prosody, no breaks)",
                    "C": "DragonHD Diya, the same line + per-clause DeliveryPlan compiled to SSML (lines.mjs compileDragonHD: <break> = pause-200 ms, slow-only <prosody rate>, pitch -8%)",
                    "D": "Nova 2 Sonic kiara (AWS us-east-1), the same line as the user turn; system = reader rule + band + the situation + the clause plan as prose (lines.mjs compileNova)"},
           "lines_rule": rules["lines"], "take_rule": rules["take_rule"], "stt_equivalences_added_before_screening": rules["stt_equivalences_added_before_screening"],
           "loudness": f"ffmpeg ebur128, one static gain per clip to I={TARGET} LUFS (true peak <= {TP} dBFS, no compression); WAV 16-bit mono at the source rate; MP3 44.1 kHz mono 96 kbps (as round 2). Arm A MP3 = the round-2 page file, unchanged.",
           "screen_method": "../../v3/screen collect.py + align.py + score.py, imported unchanged by screen.py: words/numbers via taxila-gpt-transcribe AND Azure hi-IN (a word is wrong only if both miss it); pauses = energy-VAD gaps >= 180 ms placed on word boundaries by Hindi CTC forced alignment (mid-phrase = after a word with no punctuation); rate = syllables / speech span (pauses included), artic = syllables / phonation time; planned_hit = clause boundaries the plan gives >= 300 ms that carry a VAD pause >= 180 ms (the same boundaries are counted for B and D, which have no SSML plan).",
           "summary_primary_5_lines": summary, "clips": out}
    json.dump(man, open(os.path.join(HERE, "manifest.json"), "w"), ensure_ascii=False, indent=1)


def screen_of(m):
    return {k: m.get(k) for k in ("wer_g", "wer_a", "miss_both", "num_ok_g", "num_n", "num_miss_both", "ins_num_both", "max_pause", "pauses_ge_180",
                                  "pause_total_s", "pause_after", "pause_mid", "planned_pauses", "planned_hit", "unplanned_pauses", "rate", "artic",
                                  "dur", "gop_hi", "gop_en", "cer_ctc", "gate_fails")} | {"rate": round(m["rate"], 2), "artic": round(m["artic"], 2)}


def summarise(out, clips):
    S = {}
    for arm in "ABCD":
        P = [e["screen"] for e in out if e["arm"] == arm and e["role"] == "primary"]
        allt = [m for m in clips.values() if m["id"].startswith(arm + "__") and (arm == "A" or "L3-surpriseA" not in m["id"])]
        mean = lambda xs: round(st.mean(xs), 3) if xs else None
        S[arm] = {"n_lines": len(P),
                  "wer_gpt_transcribe": mean([p["wer_g"] for p in P]), "wer_azure": mean([p["wer_a"] for p in P]),
                  "words_missed_by_both": sum(len(p["miss_both"]) for p in P),
                  "numbers_exact_gpt": f'{sum(p["num_ok_g"] for p in P)}/{sum(p["num_n"] for p in P)}',
                  "numbers_missed_or_inserted_by_both": sum(len(p["num_miss_both"]) + len(p["ins_num_both"]) for p in P),
                  "pauses_ge_180ms_per_line": mean([p["pauses_ge_180"] for p in P]), "silence_s_per_line": mean([p["pause_total_s"] for p in P]),
                  "max_pause_s": max(p["max_pause"] for p in P), "mid_phrase_pauses": sum(len(p["pause_mid"]) for p in P),
                  "planned_pause_hits": None if arm == "A" else f'{sum(p["planned_hit"] for p in P)}/{sum(p["planned_pauses"] for p in P)}',
                  "unplanned_pauses": None if arm == "A" else sum(len(p["unplanned_pauses"]) for p in P),
                  "rate_syl_s_median": round(st.median([p["rate"] for p in P]), 2), "artic_syl_s_median": round(st.median([p["artic"] for p in P]), 2),
                  "dur_s_mean": mean([p["dur"] for p in P]),
                  "all_takes": {"n": len(allt), "gate_fail_takes": sum(1 for m in allt if m["gate_fails"]),
                                "pauses_ge_180ms_per_line": mean([m["pauses_ge_180"] for m in allt]),
                                "silence_s_per_line_sd": round(st.pstdev([m["pause_total_s"] for m in allt]), 2) if len(allt) > 1 else None}}
    return S


if __name__ == "__main__":
    main()
