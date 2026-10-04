# score.py: fold raw/ (STT + VAD), align/ (CTC forced alignment, x-vectors, F0) and judge.json into per-clip metrics
# and per-arm tables for SCREEN.md (2026-10-04). Local, no API calls.
# Run: python3 docs/research/voice/v3/screen/score.py   -> clips.json, arms.json, arms.md
import json, os, re, glob, unicodedata, statistics as st, itertools, collections, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
PUN = "।॥,!?.;:\"'“”‘’()-–—…"
NUMS = ["सत्ताईस", "पैंतीस", "बीस", "तीस", "पचास", "सात", "पांच", "बारह", "बासठ", "चार", "तीन", "दो", "एक"]
NUMSET = set(NUMS) | {"दस", "सोलह", "छह", "आठ", "नौ", "साठ", "सौ"}
DIG = {"27": "सत्ताईस", "35": "पैंतीस", "20": "बीस", "30": "तीस", "50": "पचास", "7": "सात", "5": "पांच", "12": "बारह", "62": "बासठ",
       "4": "चार", "3": "तीन", "2": "दो", "1": "एक", "10": "दस", "16": "सोलह", "6": "छह", "8": "आठ", "9": "नौ", "60": "साठ", "100": "सौ"}
EN = {"tens": ["टेंस", "टेन्स", "टेंट्स", "टेन्ट्स", "टैंस", "टेनस"], "total": ["टोटल", "टोटल्", "टोतल"], "cold": ["कोल्ड", "कोल"], "drink": ["ड्रिंक", "ड्रिंक्स", "ड्रिंग"],
      "burp": ["बर्प", "बर्प्स"], "divide": ["डिवाइड", "डिवाईड", "डीवाइड"], "pizza": ["पिज़्ज़ा", "पिज्जा", "पिज़ा", "पिजा", "पिज़्जा"]}
EN_INV = {unicodedata.normalize("NFC", a).replace("़", ""): k for k, v in EN.items() for a in v}
SPELL = {"सिर्फ": "सिर्फ", "वक्त": "वक्त", "यह": "ये"}  # STT orthography variants that are the same spoken word


def ntok(w):
    w = unicodedata.normalize("NFC", w).strip(PUN).lower()
    if not w: return None
    if w in DIG: return DIG[w]
    w = w.replace("़", "").replace("ँ", "ं")  # nukta and chandrabindu are STT spelling noise here
    w = unicodedata.normalize("NFC", w)
    if w in EN_INV: return EN_INV[w]
    return SPELL.get(w, w)


def toks(s):
    s = re.sub(r"(\d)([^\d\s])", r"\1 \2", s or "")
    return [t for t in (ntok(x) for x in re.split(r"[\s,।!?.]+", s)) if t]


def align(ref, hyp):
    n, m = len(ref), len(hyp); D = np.zeros((n + 1, m + 1), int); D[:, 0] = range(n + 1); D[0, :] = range(m + 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i, j] = min(D[i - 1, j] + 1, D[i, j - 1] + 1, D[i - 1, j - 1] + (ref[i - 1] != hyp[j - 1]))
    i, j, ok, ins = n, m, [False] * n, []
    while i or j:
        if i and j and D[i, j] == D[i - 1, j - 1] + (ref[i - 1] != hyp[j - 1]):
            ok[i - 1] = ref[i - 1] == hyp[j - 1]; i -= 1; j -= 1
        elif i and D[i, j] == D[i - 1, j] + 1: i -= 1
        else: ins.append(hyp[j - 1]); j -= 1
    return D[n, m] / max(1, n), ok, ins


def cer(ref, hyp):
    a, b = "".join(ref), "".join(hyp); d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        p, d[0] = d[0], i
        for j in range(1, len(b) + 1): p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] != b[j - 1]))
    return d[len(b)] / max(1, len(a))


V = set("अआइईउऊऋएऐओऔऑ"); M = set("ािीुूृेैोौॉॅ"); C = set(chr(c) for c in range(0x915, 0x93A))
EN_SYL = {"tens": 1, "total": 2, "cold": 1, "drink": 1, "burp": 1, "divide": 2, "pizza": 2}


def syl(w):
    # vowel nuclei; a consonant with no matra/virama carries schwa, deleted word-finally (Hindi schwa deletion)
    if w in EN_SYL: return EN_SYL[w]
    w = unicodedata.normalize("NFD", w); n = 0
    for i, ch in enumerate(w):
        if ch in V: n += 1
        elif ch in C:
            nx = w[i + 1] if i + 1 < len(w) else ""
            while nx == "़": i += 1; nx = w[i + 1] if i + 1 < len(w) else ""
            if nx in M: n += 1
            elif nx == "्": pass
            elif i + 1 < len(w) and nx not in ("ं", "ँ", "ः"): n += 1
            elif nx in ("ं", "ँ", "ः"): n += 1 if i + 2 < len(w) else 1
    return max(1, n)


def ref_words(text):
    out = []
    for raw in text.split():
        core = raw.strip(PUN)
        if core: out.append((ntok(core), raw[-1] in "।,!?"))
    return out


def per_clip():
    J = json.load(open(os.path.join(HERE, "judge.json"))) if os.path.exists(os.path.join(HERE, "judge.json")) else {}
    out = []
    for f in sorted(glob.glob(os.path.join(HERE, "raw", "*.json"))):
        r = json.load(open(f)); c = r["clip"]; cid = c["id"]
        a = json.load(open(os.path.join(HERE, "align", cid + ".json"))) if os.path.exists(os.path.join(HERE, "align", cid + ".json")) else None
        RW = ref_words(c["text"]); ref = [w for w, _ in RW]
        m = {"id": cid, "arm": c["arm"], "line": c["line"], "cond": c["cond"], "take": c["take"], "src": c["src"]}
        okg = oka = None
        if r.get("gptx") is not None:
            h = toks(r["gptx"]); m["wer_g"], okg, ins = align(ref, h); m["cer_g"] = cer(ref, h)
            m["ins_num_g"] = [t for t in ins if t in NUMSET]
        if r.get("az"):
            h2 = toks(r["az"]["lexical"]); m["wer_a"], oka, ins2 = align(ref, h2)
            m["ins_num_a"] = [t for t in ins2 if t in NUMSET]
        idx_num = [i for i, w in enumerate(ref) if w in NUMS]
        if okg is not None:
            m["num_ok_g"] = sum(okg[i] for i in idx_num); m["num_n"] = len(idx_num)
            # a word counts as wrong only when BOTH recognisers miss it (an LM-heavy STT can repair a slip; hi-IN STT drops English)
            both = [not okg[i] and (oka is None or not oka[i]) for i in range(len(ref))]
            m["miss_both"] = [ref[i] for i in range(len(ref)) if both[i]]
            m["num_miss_both"] = [ref[i] for i in idx_num if both[i]]
            m["ins_num_both"] = sorted(set(m["ins_num_g"]) & set(m.get("ins_num_a", m["ins_num_g"])))
        v = r["vad"]; m["dur"] = v["dur_s"]; m["span"] = v.get("speech_span_s")
        P = [p for p in v.get("pauses", []) if p[1] - p[0] >= 0.18]
        m["max_pause"] = max([p[1] - p[0] for p in P], default=0)
        sy = sum(syl(w) for w in ref); m["syl"] = sy
        if m["span"]:
            m["rate"] = sy / m["span"]; ph = m["span"] - sum(p[1] - p[0] for p in P); m["artic"] = sy / max(ph, 0.5)
        if a:
            W = a["words"]; m["gop_hi"] = st.mean([w["gop"] for w in W if w["gop"] is not None and not w["en"]] or [0])
            m["gop_en"] = st.mean([w["gop"] for w in W if w["gop"] is not None and w["en"]] or [0]) if any(w["en"] for w in W) else None
            m["gop_bad"] = [w["ref"] for w in W if w["gop"] is not None and w["gop"] < -3]
            # greedy (LM-free, Hindi acoustic model) CER on the Devanagari words: accent / articulation proxy
            hiref = [ntok(w["ref"]) for w in W if not w["en"]]
            gh = [t for t in toks(a["greedy"]) if t not in EN]
            m["cer_ctc"] = cer(hiref, gh)
            # pauses -> word boundary: a pause between word i and i+1 is a clause pause if word i ends with punctuation
            mid, clause = [], 0
            for p in P:
                c0 = (p[0] + p[1]) / 2; k = None
                for i in range(len(W) - 1):
                    if W[i]["e"] is not None and W[i + 1]["s"] is not None and W[i]["s"] <= c0 <= W[i + 1]["e"] and c0 >= W[i]["e"] - 0.1:
                        k = i; break
                if k is None: continue
                if W[k]["clause_end"]: clause += 1
                else: mid.append({"after": W[k]["ref"], "s": round(p[1] - p[0], 2)})
            m["pause_mid"] = mid; m["pause_clause"] = clause
            nb = sum(1 for w in W[:-1] if w["punct"] in "।!?" and w["punct"])
            m["sent_bounds"] = nb
            m["spk_en_hi"] = a["spk"]["en_vs_hi"]; m["spk_halves"] = a["spk"]["half1_vs_half2"]
            m["f0_en_hi_st"] = a["f0"]["en_minus_hi_st"]; m["f0_range_st"] = a["f0"]["range_st"]; m["f0_med"] = a["f0"]["median_hz"]
            m["_emb"] = a["emb"]
        j = J.get(cid, {})
        for k, short in (("taxila-realtime", "rt"), ("gpt-realtime-2.1-mini", "mini")):
            x = j.get(k)
            if x and not x.get("error"):
                for f_ in ("talking", "warmth", "accent", "humanlike"):
                    if isinstance(x.get(f_), (int, float)): m[f"j_{short}_{f_}"] = x[f_]
                for f_ in ("english_accented_hindi", "accent_switch", "voice_change", "odd_pause", "spoken_punctuation", "wrong_words"):
                    if isinstance(x.get(f_), bool): m[f"j_{short}_{f_}"] = x[f_]
                m[f"j_{short}_rate"] = x.get("rate"); m[f"j_{short}_laugh"] = x.get("laugh"); m[f"j_{short}_reason"] = x.get("reason")
        out.append(m)
    return out


def mean(xs):
    xs = [x for x in xs if x is not None]
    return round(st.mean(xs), 3) if xs else None


def per_arm(CL):
    G = collections.defaultdict(list)
    for m in CL: G[(m["arm"], m["cond"])].append(m)
    A = []
    for (arm, cond), L in sorted(G.items()):
        nn = sum(m.get("num_n", 0) for m in L if "num_ok_g" in m)
        a = {"arm": arm, "cond": cond, "n": len(L), "n_gx": sum("wer_g" in m for m in L),
             "wer_g": mean([m.get("wer_g") for m in L]), "cer_g": mean([m.get("cer_g") for m in L]),
             "num_exact_g": f'{sum(m.get("num_ok_g", 0) for m in L)}/{nn}',
             "num_miss_both": sum(len(m.get("num_miss_both", [])) for m in L), "num_ins_both": sum(len(m.get("ins_num_both", [])) for m in L),
             "word_miss_both_rate": round(sum(len(m.get("miss_both", [])) for m in L) / max(1, sum(len(ref_words_cache[m["line"]]) for m in L if "miss_both" in m)), 3),
             "rate_med": round(st.median([m["rate"] for m in L if "rate" in m]), 2), "artic_med": round(st.median([m["artic"] for m in L if "artic" in m]), 2),
             "max_pause": round(max(m["max_pause"] for m in L), 2), "long_pause_clips": sum(m["max_pause"] > 1.0 for m in L),
             "pause_mid_per_clip": mean([len(m["pause_mid"]) for m in L if "pause_mid" in m]),
             "pause_mid_long": sum(sum(p["s"] >= 0.3 for p in m.get("pause_mid", [])) for m in L),
             "gop_hi": mean([m.get("gop_hi") for m in L]), "gop_en": mean([m.get("gop_en") for m in L]), "cer_ctc": mean([m.get("cer_ctc") for m in L]),
             "spk_en_hi": mean([m.get("spk_en_hi") for m in L]), "spk_halves": mean([m.get("spk_halves") for m in L]),
             "f0_en_hi_abs_st": mean([abs(m["f0_en_hi_st"]) for m in L if m.get("f0_en_hi_st") is not None]),
             "f0_range_st": mean([m.get("f0_range_st") for m in L])}
        E = [np.array(m["_emb"]) for m in L if m.get("_emb")]
        if len(E) >= 2: a["spk_cross_line"] = round(float(np.mean([e1 @ e2 for e1, e2 in itertools.combinations(E, 2)])), 4)
        for s in ("rt", "mini"):
            for f_ in ("talking", "warmth", "accent", "humanlike"): a[f"j_{s}_{f_}"] = mean([m.get(f"j_{s}_{f_}") for m in L])
            for f_ in ("english_accented_hindi", "accent_switch", "voice_change", "odd_pause", "spoken_punctuation", "wrong_words"):
                v = [m[f"j_{s}_{f_}"] for m in L if f"j_{s}_{f_}" in m]; a[f"j_{s}_{f_}"] = f"{sum(v)}/{len(v)}" if v else None
        A.append(a)
    return A


ref_words_cache = {}
if __name__ == "__main__":
    CL = per_clip()
    for m in CL: pass
    raw0 = {json.load(open(f))["clip"]["line"]: json.load(open(f))["clip"]["text"] for f in glob.glob(os.path.join(HERE, "raw", "*__t1.json"))[:60]}
    ref_words_cache.update({k: ref_words(v) for k, v in raw0.items()})
    A = per_arm(CL)
    json.dump([{k: v for k, v in m.items() if k != "_emb"} for m in CL], open(os.path.join(HERE, "clips.json"), "w"), ensure_ascii=False, indent=0)
    json.dump(A, open(os.path.join(HERE, "arms.json"), "w"), ensure_ascii=False, indent=1)
    print(len(CL), "clips", len(A), "arm-conds")
