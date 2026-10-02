import json, sys, statistics as st, re, os
D = os.path.dirname(os.path.abspath(__file__))
def q(v, p):
    v = sorted(v); return v[min(len(v) - 1, int(p * len(v)))] if v else None
def play(arr, B, cut=None):
    if not arr: return None
    start = arr[0][0] + B; cur = start; gaps = []; segs = []
    for t, ms in arr:
        if cut is not None and t >= cut: break
        if t > cur: gaps.append(t - cur); cur = t
        segs.append((cur, cur + ms)); cur += ms
    if cut is not None: segs = [(a, min(b, cut)) for a, b in segs if a < cut]
    return {"start": start, "gaps": gaps, "segs": segs, "end": segs[-1][1] if segs else start}
def ngrams(ws, n=3): return {tuple(ws[i:i + n]) for i in range(len(ws) - n + 1)}
def norm(s): return re.findall(r"[\w']+", s.lower())
rows = []
for name in ["P0", "P1", "P2", "P3", "P4", "P1c", "P5n", "P5p", "P6"]:
    f = f"{D}/results/{name}.json"
    if not os.path.exists(f): continue
    d = json.load(open(f)); L = d["log"]; T = d["turns"]
    ttfa = [t["ttfa"] for t in T if t["ttfa"] is not None]
    out = {"profile": name, "n": len(T), "rtt_ms": round(st.median(d["pongRtt"])) if d["pongRtt"] else None,
           "ttfa_med": q(ttfa, .5), "ttfa_p90": q(ttfa, .9), "ttfa_max": max(ttfa) if ttfa else None}
    # gaps per buffer, over every response of the turn (with its cut)
    for B in (0, 150, 300, 600):
        g_turns = 0; worst = 0; tot = []
        for t in T:
            gs = []
            for arr, cut in zip(t["arrivals"], t["cut"]):
                p = play(arr, B, cut)
                if p: gs += [g for g in p["gaps"] if g >= 50]
            if gs: g_turns += 1
            worst = max([worst] + gs); tot.append(sum(gs))
        out[f"gap_turns_B{B}"] = g_turns; out[f"gap_max_B{B}"] = round(worst); out[f"gap_sum_med_B{B}"] = round(q(tot, .5) or 0)
    out["responses_per_turn"] = [t["responses"] for t in T]
    out["statuses"] = sorted({s for t in T for s in t["statuses"] if s})
    out["no_audio_responses"] = sum(t["noAudio"] for t in T)
    out["stalls"] = sum(1 for e in L if e["type"] == "stalled")
    out["notices"] = sum(1 for e in L if e["type"] == "app_voice_notice")
    out["orphan_events"] = sum(1 for e in L if e["type"] == "orphan_event")
    out["discarded_audio_ms"] = sum(sum(t["discardedMs"]) for t in T)
    # burst: audio ms received within 1 s of first arrival (first response of each turn)
    bursts = []; durs = []
    for t in T:
        if t["arrivals"] and t["arrivals"][0]:
            a = t["arrivals"][0]; a0 = a[0][0]; bursts.append(sum(ms for tt, ms in a if tt <= a0 + 1000)); durs.append(sum(ms for _, ms in a))
    out["audio_ms_in_first_1s_med"] = q(bursts, .5); out["reply_audio_ms_med"] = q(durs, .5)
    # outage metrics
    if name in ("P5n", "P5p", "P6"):
        rec = []; dead = []; notice_after = []; overlap = []; extra_resp = 0; answered_held = []
        starts = [e for e in L if e["type"] == "outage_start"]; ends = [e for e in L if e["type"] == "outage_end"]
        for k, t in enumerate(T):
            if k >= len(starts): break
            b0, b1 = starts[k]["t"], ends[k]["t"]
            segs = []
            for arr, cut in zip(t["arrivals"], t["cut"]):
                p = play(arr, 300, cut)
                if p: segs += p["segs"]
            segs.sort()
            # dead air: silence the child hears = first audible after the network returns − max(outage start, end of audio already audible)
            before = [b for a, b in segs if a < b1]
            last_before = max([b0] + [min(b, b1 + 60000) for b in before])
            after = [a for a, b in segs if a >= last_before - 1]
            first_after = min([a for a in after if a > b0], default=None)
            mx = (first_after - last_before) if first_after else None
            dead.append(round(mx) if mx is not None else None)
            if first_after: rec.append(round(first_after - b1))
            nt = [e["t"] for e in L if e["type"] == "app_voice_notice" and b0 <= e["t"] <= b1 + 8000]
            if nt: notice_after.append(nt[0] - b0)
            extra_resp += max(0, t["responses"] - 2) if name != "P5n" else max(0, t["responses"] - 1)
            if name in ("P5p", "P6") and len(t["transcripts"]) >= 2:
                heard = t["heardText"][0] if t["heardText"][0] is not None else None
                if heard is None and t["playedMs"][0] is not None:
                    w = norm(t["transcripts"][0]); tot_ms = sum(ms for _, ms in t["arrivals"][0]) or 1
                    heard = " ".join(w[: int(len(w) * t["playedMs"][0] / tot_ms)])
                hw = norm(heard or ""); rw = norm(t["transcripts"][1])
                g = ngrams(hw)
                overlap.append(round(len(g & ngrams(rw)) / len(g), 2) if g else None)
        out.update({"recovery_after_net_back_ms": rec, "recovery_med": q(rec, .5), "dead_air_ms": dead, "dead_air_med": q([x for x in dead if x is not None], .5),
                    "notice_after_outage_start_ms": notice_after, "extra_responses": extra_resp, "heard_3gram_repeat": overlap})
    rows.append(out)
json.dump(rows, open(f"{D}/results/summary.json", "w"), indent=1)
for r in rows:
    print(r["profile"], {k: v for k, v in r.items() if k not in ("profile",)})
