"""Share of CuriousJr (PW live tuition, classes 1-9) Play reviews that mention each tutor 'job'.

Run: python3 curiousjr_review_themes.py  (needs google_play_scraper 1.2.7)
Writes curiousjr-review-themes-<date>.json next to this file. Written 2026-10-02 for
tutor-substitution.md. Method: newest 2,000 reviews, country=in, lang=en; regex per theme on review
text; share of all reviews and mean stars of matching reviews. Crude regex; reviews are mostly written
by children, so read shares as relative salience between themes, not as parent survey rates.
"""
import json, re, datetime, os
from google_play_scraper import reviews, Sort

PATS = {
    "mentor": r"\bmentors?\b",
    "teacher_sir_maam": r"teacher|\bsir\b|ma'?am|\bmam\b",
    "doubt": r"doubts?",
    "test_exam_marks": r"\btests?\b|\bexams?\b|\bmarks\b|result",
    "ptm_parent": r"\bptm\b|parent",
    "fee_price_emi": r"\bfees?\b|price|costly|expensive|\bemi\b",
    "one_to_one_personal": r"1[:-]1|one[- ]on[- ]one|personal|individual",
    "homework": r"home ?work",
}
rs, _ = reviews("com.curiousjr", lang="en", country="in", sort=Sort.NEWEST, count=2000)
rs = [r for r in rs if r.get("content")]
out = {"date": datetime.date.today().isoformat(), "app": "com.curiousjr", "n": len(rs),
       "from": min(r["at"] for r in rs).date().isoformat(), "to": max(r["at"] for r in rs).date().isoformat(),
       "mean_stars": round(sum(r["score"] for r in rs) / len(rs), 2), "themes": {}}
for k, p in PATS.items():
    h = [r for r in rs if re.search(p, r["content"].lower())]
    out["themes"][k] = {"n": len(h), "pct": round(100 * len(h) / len(rs), 1),
                        "mean_stars": round(sum(r["score"] for r in h) / max(1, len(h)), 2)}
fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"curiousjr-review-themes-{out['date']}.json")
json.dump(out, open(fn, "w"), indent=1)
print(json.dumps(out, indent=1))
