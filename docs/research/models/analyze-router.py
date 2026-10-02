#!/usr/bin/env python3
"""Tables for MODEL-ROUTER.md from router-bench-2026-10-02.json + evals/results/model-bakeoff-*.json.
Prices: Azure retail prices API (serviceName 'Foundry Models', Global Standard, eastus2 meters), read 2026-10-02.
Usage: python3 docs/research/models/analyze-router.py > docs/research/models/router-tables.md"""
import json, os, statistics as st, glob
ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
R = json.load(open(os.path.join(ROOT, "docs/research/models/router-bench-2026-10-02.json")))

# $/1M tokens (input, output). Source: Azure retail prices API 2026-10-02 unless marked.
PRICE = {
    "taxila-fast": (0.2, 1.2), "taxila-brain": (4.0, 20.0), "gpt-5.6-terra": (2.0, 12.0), "taxila-codex": (1.75, 14.0),
    "taxila-ds41": (0.375, 1.5), "DeepSeek-V4-Pro": (1.74, 3.48), "DeepSeek-V4-Flash": (0.19, 0.51), "taxila-oss120": (0.15, 0.6),
    "grok-4-1-fast-non-reasoning": (0.2, 0.5), "grok-4-1-fast-reasoning": (0.2, 0.5), "grok-4-20-non-reasoning": (1.25, 2.5),
    "grok-4-20-reasoning": (1.25, 2.5), "grok-4.3": (1.25, 2.5), "taxila-grok46": (2.0, 6.0), "Mistral-Large-3": (0.5, 1.5),
    "Cohere-command-a-plus-05-2026": (0.8, 3.2), "gpt-4.1-mini": (0.4, 1.6), "taxila-kimi-code": (0.95, 4.0),
    "or:openai/gpt-6-luna": (0.1, 0.5), "or:openai/gpt-6.1-sol": (2.0, 10.0), "or:moonshotai/kimi-k3": (3.0, 15.0),
}
def cost(model, usage):
    if not usage or model not in PRICE: return None
    i = usage.get("prompt_tokens") or usage.get("input_tokens") or 0
    o = usage.get("completion_tokens") or usage.get("output_tokens") or 0
    p = PRICE[model]; return (i * p[0] + o * p[1]) / 1e6
def med(a):
    a = sorted(x for x in a if x is not None); return a[len(a)//2] if a else None
def p90(a):
    a = sorted(x for x in a if x is not None); return a[min(len(a)-1, int(len(a)*0.9))] if a else None
def per1k(model, rows):
    c = [cost(model, r.get("usage")) for r in rows]; c = [x for x in c if x is not None]
    return f"${1000*st.mean(c):.2f}" if c else "n/a"

out = []
if "T" in R:
    T = R["T"]; rows = T["rows"]; models = list(dict.fromkeys(r["model"] for r in rows))
    sc = {m: {j: [] for j in ("taxila-brain", "grok-4-20-reasoning")} for m in models}
    leaks = {m: 0 for m in models}; leakn = {m: 0 for m in models}
    for jd in T["judged"]:
        for m, s in (jd.get("scores") or {}).items():
            if not s: continue
            try: sc[m][jd["judge"]].append({k: float(s[k]) for k in ("pedagogy", "natural", "mirror", "warmth", "overall")})
            except Exception: pass
            leakn[m] += 1; leaks[m] += 1 if s.get("leak") else 0
    def avg(lst, k): return st.mean(x[k] for x in lst) if lst else float("nan")
    out.append("## T live teacher reply (10 child turns: 6 Hinglish, 3 English, 1 Devanagari; 2 reps Azure / 1 rep OpenRouter)\n")
    out.append("| model | TTFT p50 | TTFT p90 | total p50 | words p50 | markup | q-end | overall (sol judge) | overall (grok judge) | natural (mean of judges) | pedagogy (mean) | leak flags | $/1k turns |")
    out.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    table = []
    for m in models:
        r = [x for x in rows if x["model"] == m and not x.get("err")]
        a, b = sc[m]["taxila-brain"], sc[m]["grok-4-20-reasoning"]
        both = a + b
        table.append((avg(a, "overall") + avg(b, "overall"), m, r, a, b, both))
    for _, m, r, a, b, both in sorted(table, key=lambda t: -t[0] if t[0] == t[0] else 0):
        errs = len([x for x in rows if x["model"] == m and x.get("err")])
        out.append(f"| {m} | {med([x['ttft'] for x in r])} | {p90([x['ttft'] for x in r])} | {med([x['ms'] for x in r])} | {med([x['words'] for x in r])} | {sum(x['markup'] for x in r)}/{len(r)} | {sum(x['endsQ'] for x in r)}/{len(r)} | {avg(a,'overall'):.2f} | {avg(b,'overall'):.2f} | {avg(both,'natural'):.2f} | {avg(both,'pedagogy'):.2f} | {leaks[m]}/{leakn[m]} | {per1k(m, r)} |" + (f" errs {errs}" if errs else ""))
    out.append("")

def acc_table(key, title, extra=None):
    if key not in R: return
    rows = R[key]["rows"]; models = list(dict.fromkeys(r["model"] for r in rows))
    out.append(f"## {title}\n")
    hdr = "| model | accuracy | p50 ms | p90 ms | $/1k calls |" + (" " + extra[0] + " |" if extra else "")
    out.append(hdr); out.append("|" + "---|" * (hdr.count("|") - 1))
    t = []
    for m in models:
        r = [x for x in rows if x["model"] == m]
        ok = sum(1 for x in r if x["ok"])
        t.append((ok / len(r), m, r, ok))
    for _, m, r, ok in sorted(t, key=lambda z: -z[0]):
        e = (" " + extra[1](r) + " |") if extra else ""
        out.append(f"| {m} | {ok}/{len(r)} | {med([x['ms'] for x in r])} | {p90([x['ms'] for x in r])} | {per1k(m, r)} |{e}")
    out.append("")

acc_table("C", "C answer classification vs verified key (20 cases x 2 reps)",
          ("misses", lambda r: "; ".join(sorted(set(f"{x['said']}→{x['got']}" for x in r if not x['ok'])))[:160]))
acc_table("S", "S distress classification, production prompt (16 cases: 8 distress, 8 tricky benign; x 2 reps)",
          ("distress recall / false alarms", lambda r: f"{sum(1 for x in r if x['gold'] and x['got'])}/{sum(1 for x in r if x['gold'])} / {sum(1 for x in r if not x['gold'] and x['got'])}/{sum(1 for x in r if not x['gold'])}"))
acc_table("D", "D director planning (8 scenarios x 2 reps; 1 rep OpenRouter)",
          ("misses", lambda r: "; ".join(sorted(set(f"{x['gold']}→{x['got']}" for x in r if not x['ok'])))[:160]))

if "W" in R:
    W = R["W"]; out.append("## W parent report writing (blind comparative judging; 1-5)\n")
    out.append("| model | lang | faithful (sol/grok) | language (sol/grok) | overall (sol/grok) | invented facts flagged | ms |"); out.append("|---|---|---|---|---|---|---|")
    for lang in ("Hindi", "English"):
        js = {jd["judge"]: jd["scores"] for jd in W["judged"] if jd["lang"] == lang}
        rows = [r for r in W["rows"] if r["lang"] == lang]
        def g(m, j, k):
            s = (js.get(j) or {}).get(m) or {}; return s.get(k, "-")
        def ov(m):
            try: return float(g(m, "taxila-brain", "overall")) + float(g(m, "grok-4-20-reasoning", "overall"))
            except Exception: return 0
        for r in sorted(rows, key=lambda r: -ov(r["model"])):
            m = r["model"]; inv = [*((js.get("taxila-brain") or {}).get(m) or {}).get("invented", []), *((js.get("grok-4-20-reasoning") or {}).get(m) or {}).get("invented", [])]
            out.append(f"| {m} | {lang} | {g(m,'taxila-brain','faithful')}/{g(m,'grok-4-20-reasoning','faithful')} | {g(m,'taxila-brain','language')}/{g(m,'grok-4-20-reasoning','language')} | {g(m,'taxila-brain','overall')}/{g(m,'grok-4-20-reasoning','overall')} | {len(inv)}: {'; '.join(map(str,inv))[:110]} | {r['ms']} |")
    out.append("")

if "V" in R:
    V = R["V"]; out.append("## V homework OCR (4 synthetic handwriting-font images; CER, lower is better)\n")
    out.append("| model | CER img1 (Hindi) | img2 (English maths) | img3 (Hindi+numbers) | img4 (Hindi) | mean CER | p50 ms |"); out.append("|---|---|---|---|---|---|---|")
    models = list(dict.fromkeys(r["model"] for r in V["rows"]))
    t = []
    for m in models:
        r = sorted([x for x in V["rows"] if x["model"] == m], key=lambda x: x["img"])
        c = [x.get("cer") for x in r]; mean = st.mean([x for x in c if x is not None]) if any(x is not None for x in c) else None
        t.append((mean if mean is not None else 9, m, c, r))
    for mean, m, c, r in sorted(t):
        out.append(f"| {m} | " + " | ".join(str(x) if x is not None else "err" for x in c) + f" | {mean if mean != 9 else 'n/a':.3} | {med([x.get('ms') for x in r])} |" if mean != 9 else f"| {m} | err | err | err | err | n/a | - |")
    out.append("")

if "M" in R:
    out.append("## M embeddings cross-lingual retrieval (12 concepts; query -> English doc)\n")
    for m, v in R["M"].items(): out.append(f"- {m}: Hinglish R@1 {v['hinglish']['r1']} (MRR {v['hinglish']['mrr']}), Devanagari R@1 {v['devanagari']['r1']} (MRR {v['devanagari']['mrr']})")
    out.append("")

A = sorted(glob.glob(os.path.join(ROOT, "evals/results/model-bakeoff-*-A.json")))
if A:
    d = json.load(open(A[-1])); rows = d["A"]
    out.append(f"## A interactive diagrams (evals/model-bakeoff.mjs A, n={d['n']} per diagram, 3 diagrams; judge taxila-brain vision)\n")
    out.append("| model | rendered | interactive | console errs | correctness | legibility | appeal | sum | p50 s |"); out.append("|---|---|---|---|---|---|---|---|---|")
    models = list(dict.fromkeys(r["model"] for r in rows)); t = []
    for m in models:
        r = [x for x in rows if x["model"] == m]; ok = [x for x in r if x.get("render") == "ok"]
        js = [x["judge"] for x in ok if x.get("judge") and "correctness" in x["judge"]]
        def a(k): return st.mean(float(j[k]) for j in js) if js else 0
        s = a("correctness") + a("legibility") + a("appeal")
        t.append((s * len(js) / max(1, len(r)), m, r, ok, js, a))
    for _, m, r, ok, js, a in sorted(t, key=lambda z: -z[0]):
        out.append(f"| {m} | {len(ok)}/{len(r)} | {sum(1 for x in ok if x.get('interactive'))}/{len(r)} | {sum(x.get('consoleErrors') or 0 for x in ok)} | {a('correctness'):.2f} | {a('legibility'):.2f} | {a('appeal'):.2f} | {a('correctness')+a('legibility')+a('appeal'):.2f} (judged {len(js)}/{len(r)}) | {(med([x['ms'] for x in r]) or 0)/1000:.1f} |")
    out.append("")
print("\n".join(out))
