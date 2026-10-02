"""Mine Google Play reviews of Indian K-9 learning apps for the 'jobs' parents hire a tutor for.

Run: python3 tutor_substitution_reviews.py   (needs google_play_scraper 1.2.7)
Writes tutor-substitution-reviews-<date>.json next to this file.

Method (written 2026-10-02 for tutor-substitution.md):
- For each app: newest N reviews, country=in, lang=en (Hinglish in Latin script lands here too).
- A review is "parent-voiced" if it matches PARENT (my son/daughter/child, as a parent, beta/beti...).
- Each review is regex-tagged with zero or more JOBS (homework, marks/exams, discipline/routine,
  doubt clearing, parent updates/reports, personal attention/teacher bond, convenience/safety,
  explicit tuition comparison).
- We report, per app and pooled, the share of parent-voiced reviews that mention each job and the
  mean stars of those reviews, plus up to K short example snippets for the explicit-tuition theme.
Caveats: regex tagging is crude and English-biased; Play reviews are self-selected, skew to
extremes, and many are short ("good app"). Use shares as RELATIVE signals between jobs, not as
population rates. No reviewer names are stored.
"""
import json, re, collections, datetime, os, sys, time
from google_play_scraper import reviews, Sort

N = int(os.environ.get("N", "1000"))
APPS = {
    "CuriousJr (PW, live tuition 1-9)": "com.curiousjr",
    "Cuemath (1:1 live maths)": "com.cuelearn.cuemathapp",
    "Vedantu": "com.vedantu.app",
    "BYJU'S": "com.byjus.thelearningapp",
    "Extramarks": "com.Extramarks.Smartstudy",
    "LEAD School parent app": "com.leadschool.parentapp",
    "Infinity Learn K5": "com.infinitylearn.k5app",
    "Seekho Jr": "com.seekhojunior.android",
    "Filo (live doubt tutors)": "com.filo.student",
    "Doubtnut": "com.doubtnutapp",
    "Teachmint": "com.teachmint.teachmint",
    "YoLearn (voice AI tutor)": "com.yolearn.student",
}
PARENT = r"\bmy (son|daughter|child|kid|kids|children|ward|boy|girl)\b|\bas a (parent|mother|father|mom|dad)\b|\bi am a (parent|mother|father)\b|\bmy (son'?s|daughter'?s|child'?s|kid'?s)\b|\b(mera|meri) (beta|beti|baccha|bachcha|bacche|bachi)\b|\bour (son|daughter|child|kid)\b"
JOBS = {
    "homework": r"home ?work|\bhw\b|assignment|school ?work|worksheet",
    "marks_exams": r"\bmarks?\b|\bexams?\b|\btests?\b|\bresults?\b|\bscore[ds]?\b|percent|\brank\b|\bgrades?\b",
    "discipline_routine": r"disciplin|\bfocus|attention span|regular(ly)?\b|routine|\bdaily\b|consisten|lazy|serious|\bstrict|habit|attendance|punctual",
    "doubt_clearing": r"doubts?\b|clear(ed|s)? (the |my |his |her )?concept|concepts? (are |is |got )?clear|explain|understand",
    "parent_updates": r"\breports?\b|\bptm\b|parent[- ]teacher|progress|feedback|updates?\b|mentor (call|meeting)|parent (call|meeting)|tracking",
    "teacher_bond_attention": r"personal attention|individual attention|one[- ]on[- ]one|\b1[:-]1\b|\bpatient\b|patience|caring|friendly|\bloves?\b (the )?(teacher|class|maam|ma'?am|sir)|favou?rite teacher|bond",
    "convenience_safety": r"\bbusy\b|working (parent|mother|mom)|\bsafe(ty)?\b|travel|commut|from home|at home|no need to go|time sav",
    "tuition_comparison": r"tuition|tution|tutor\b|coaching (class|centre|center)|home tutor",
    "ai_mention": r"\bai\b|chatgpt|artificial intelligence|\bbot\b",
}
WHEN_TUITION = {
    "replaces_tuition": r"(no need|don'?t need|didn'?t need|instead) (of |for |to go (to |for )?)?(any )?(tuition|tution|coaching)|(stopped|left|quit|removed?) (his |her |the )?(tuition|tution|coaching)|better than (any )?(offline |home )?(tuition|tution|coaching|tutor)|replace[sd]? (the )?(tuition|tution|tutor)|(tuition|tution) (ki|ka) (zarurat|jarurat)",
    "alongside_tuition": r"(along ?with|with|also|plus|besides|after) (his |her |my )?(school and |school & )?(tuition|tution|coaching)|(tuition|tution|coaching) (and|&|plus) (this|the) app",
    "worse_than_tuition": r"(worse|waste) (than|of) .{0,20}(tuition|tution|tutor)|(tuition|tution|tutor) (is|was) better|offline (tuition|tution|class(es)?) (is|are) better",
}
K = 6

def tag(text, table):
    t = text.lower()
    return [k for k, rx in table.items() if re.search(rx, t)]

out = {"date": datetime.date.today().isoformat(), "method": __doc__.strip().splitlines()[0], "N_per_app": N, "apps": {}}
pool = collections.defaultdict(list)
pool_parent_n = 0
pool_n = 0
tuition_examples = collections.defaultdict(list)
pool_all = collections.defaultdict(list)
tuition_any = []
tuition_when = collections.defaultdict(list)
for name, pkg in APPS.items():
    rs = []
    for attempt in range(3):
        try:
            rs, _ = reviews(pkg, lang="en", country="in", sort=Sort.NEWEST, count=N)
            break
        except Exception as e:  # network hiccup
            print(name, "ERR", e, file=sys.stderr); time.sleep(3)
    if not rs:
        out["apps"][name] = {"pkg": pkg, "n": 0}
        continue
    dates = [r["at"] for r in rs]
    par = [r for r in rs if r.get("content") and re.search(PARENT, r["content"].lower())]
    jobs = collections.defaultdict(list)
    for r in par:
        for j in tag(r["content"], JOBS):
            jobs[j].append(r["score"])
            pool[j].append(r["score"])
    for r in rs:
        c = (r.get("content") or "")
        if not c:
            continue
        for j in tag(c, JOBS):
            pool_all[j].append(r["score"])
        if re.search(JOBS["tuition_comparison"], c.lower()):
            tuition_any.append(r["score"])
            for w in tag(c, WHEN_TUITION):
                tuition_when[w].append(r["score"])
                if len(tuition_examples[w]) < 3 * K:
                    snippet = re.sub(r"\s+", " ", c)[:220]
                    tuition_examples[w].append({"app": name, "stars": r["score"], "date": r["at"].date().isoformat(), "parent_voiced": bool(re.search(PARENT, c.lower())), "text": snippet})
    pool_parent_n += len(par)
    pool_n += len(rs)
    out["apps"][name] = {
        "pkg": pkg, "n": len(rs), "from": min(dates).date().isoformat(), "to": max(dates).date().isoformat(),
        "mean_stars": round(sum(r["score"] for r in rs) / len(rs), 2),
        "parent_voiced_n": len(par), "parent_voiced_pct": round(100 * len(par) / len(rs), 1),
        "jobs_in_parent_reviews": {j: {"n": len(v), "pct_of_parent": round(100 * len(v) / max(1, len(par)), 1),
                                        "mean_stars": round(sum(v) / len(v), 2)} for j, v in sorted(jobs.items(), key=lambda kv: -len(kv[1]))},
    }
    print(name, len(rs), "parent", len(par), file=sys.stderr)
out["pooled"] = {"n": pool_n, "parent_voiced_n": pool_parent_n,
                 "jobs_in_parent_reviews": {j: {"n": len(v), "pct_of_parent": round(100 * len(v) / max(1, pool_parent_n), 1),
                                                 "mean_stars": round(sum(v) / len(v), 2)} for j, v in sorted(pool.items(), key=lambda kv: -len(kv[1]))}}
out["pooled_all_reviews"] = {"n": pool_n, "jobs": {j: {"n": len(v), "pct": round(100 * len(v) / max(1, pool_n), 2), "mean_stars": round(sum(v) / len(v), 2)} for j, v in sorted(pool_all.items(), key=lambda kv: -len(kv[1]))},
    "tuition_mentions": {"n": len(tuition_any), "mean_stars": round(sum(tuition_any) / max(1, len(tuition_any)), 2),
                         "by_relation": {w: {"n": len(v), "mean_stars": round(sum(v) / len(v), 2)} for w, v in tuition_when.items()}}}
out["tuition_examples"] = tuition_examples
fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"tutor-substitution-reviews-{out['date']}.json")
json.dump(out, open(fn, "w"), indent=1, ensure_ascii=False, default=str)
print(json.dumps(out["pooled"], indent=1)); print(json.dumps(out["pooled_all_reviews"], indent=1))
for name, a in out["apps"].items():
    print(name, {k: a.get(k) for k in ("n", "from", "to", "mean_stars", "parent_voiced_n", "parent_voiced_pct")})
