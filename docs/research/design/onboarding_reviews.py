# Onboarding-theme pass over Google Play reviews (India storefront) for the onboarding teardown.
# Usage: python3 docs/research/design/onboarding_reviews.py  -> writes onboarding-reviews-<date>.json next to this file.
# Method: google-play-scraper app() metadata + reviews(sort=NEWEST, count=N, country=in, lang=en);
# a review is "onboarding-related" if its text matches any theme regex below. Regex coding is crude:
# read the samples before trusting a count.
import json, re, collections, datetime, os, sys
from google_play_scraper import app, reviews, Sort

APPS = {
    'com.duolingo': 'Duolingo',
    'org.khankids.android': 'Khan Academy Kids',
    'com.selabs.speak': 'Speak',
    'com.cuelearn.cuemathapp': 'Cuemath',
    'com.yolearn.student': 'YoLearn.AI',
}
N = int(sys.argv[1]) if len(sys.argv) > 1 else 600
THEMES = {
    'login/otp/account': r'\blog ?in\b|\bsign ?(up|in)\b|\botp\b|\bregist|\baccount\b|password|verification|verify',
    'placement/level': r'placement|level test|\blevel\b|too easy|too basic|already know|beginner',
    'trial/demo/counsellor': r'\btrial\b|\bdemo\b|free class|counsell?or|\bcall(ed|s|ing)?\b|sales',
    'paywall early': r'paywall|subscri|free trial|pay (to|before)|have to pay|premium|purchase',
    'setup/first use': r'set ?up|first (time|lesson|day|class)|onboard|getting started|start(ed|ing)? (the|my)|install',
    'mic/speech recog': r'\bmic\b|microphone|speech|recogni|voice|pronunc|doesn.?t (hear|understand)',
    'age/grade/profile': r'\bage\b|\bgrade\b|\bclass \d|profile|child(ren)?.s account|kids? account|parent',
    'language/hindi': r'hindi|hinglish|language option|regional',
}

out = {'date': datetime.date.today().isoformat(), 'method': f'google-play-scraper; reviews NEWEST count={N}, country=in, lang=en; theme regex (see THEMES)', 'apps': {}}
for pid, name in APPS.items():
    rec = {'name': name}
    try:
        a = app(pid, lang='en', country='in')
        rec.update({k: a.get(k) for k in ('title', 'score', 'ratings', 'realInstalls', 'installs', 'free', 'offersIAP', 'inAppProductPrice', 'contentRating', 'updated')})
        rec['description_head'] = (a.get('description') or '')[:1500]
    except Exception as e:
        rec['app_err'] = str(e)
    try:
        rs, _ = reviews(pid, lang='en', country='in', sort=Sort.NEWEST, count=N)
    except Exception as e:
        rec['rev_err'] = str(e); out['apps'][pid] = rec; continue
    rec['n'] = len(rs)
    if rs:
        ds = [r['at'] for r in rs]
        rec['window'] = [min(ds).strftime('%Y-%m-%d'), max(ds).strftime('%Y-%m-%d')]
        rec['mean'] = round(sum(r['score'] for r in rs) / len(rs), 2)
    tc = collections.Counter(); tc_low = collections.Counter(); samples = collections.defaultdict(list)
    for r in rs:
        t = (r['content'] or '').lower()
        for k, p in THEMES.items():
            if re.search(p, t):
                tc[k] += 1
                if r['score'] <= 2:
                    tc_low[k] += 1
                samples[k].append((r['thumbsUpCount'] or 0, r['at'].strftime('%Y-%m-%d'), r['score'], (r['content'] or '')[:280]))
    rec['theme_counts_all'] = dict(tc.most_common())
    rec['theme_counts_low'] = dict(tc_low.most_common())
    rec['samples'] = {k: [s[1:] for s in sorted(v, key=lambda s: -s[0])[:5]] for k, v in samples.items()}
    out['apps'][pid] = rec
    print(pid, rec.get('score'), rec.get('ratings'), rec.get('n'), rec.get('mean'), rec['theme_counts_all'], rec['theme_counts_low'])

here = os.path.dirname(os.path.abspath(__file__))
json.dump(out, open(os.path.join(here, f"onboarding-reviews-{out['date']}.json"), 'w'), ensure_ascii=False, indent=1, default=str)
