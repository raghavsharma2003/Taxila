# How often do Indian K-12 app reviews complain about getting in (OTP / login / sign-up / sales call after sign-up)?
# Usage: python3 docs/research/design/onboarding_login_themes.py  -> prints a table and writes onboarding-login-themes-<date>.json
# Method: google-play-scraper reviews(sort=NEWEST, count=400, country=in, lang=en); regex coding (crude; read samples).
import json, re, datetime, os, collections
from google_play_scraper import reviews, Sort

IDS = ['com.byjus.thelearningapp', 'com.vedantu.app', 'com.curiousjr', 'xyz.penpencil.physicswala',
       'com.Extramarks.Smartstudy', 'com.unacademyapp', 'com.cuelearn.cuemathapp', 'com.seekhojunior.android',
       'com.infinitylearn.learn', 'com.yolearn.student']
PAT = {
    'otp': r'\botp\b',
    'login/signup': r'\blog ?in\b|\bsign ?(up|in)\b|\bregist|not able to (log|sign)|account',
    'call after signup': r'(call(ed|s|ing)?|counsell?or|sales).{0,60}(after|once|as soon as).{0,30}(regist|sign|download|number)|(number|regist|sign).{0,60}(call(ed|s|ing)?|counsell?or)',
}
out = {'date': datetime.date.today().isoformat(), 'method': 'google-play-scraper NEWEST 400 country=in lang=en; regex PAT', 'apps': {}}
print(f"{'app':32} {'n':>4} {'low':>4} " + ' '.join(f'{k:>18}' for k in PAT))
for pid in IDS:
    try:
        rs, _ = reviews(pid, lang='en', country='in', sort=Sort.NEWEST, count=400)
    except Exception as e:
        print(pid, 'ERR', e); continue
    low = [r for r in rs if r['score'] <= 2]
    rec = {'n': len(rs), 'n_low': len(low), 'counts_low': {}, 'samples': {}}
    if rs:
        ds = [r['at'] for r in rs]; rec['window'] = [min(ds).strftime('%Y-%m-%d'), max(ds).strftime('%Y-%m-%d')]
    for k, p in PAT.items():
        hits = [r for r in low if re.search(p, (r['content'] or '').lower())]
        rec['counts_low'][k] = len(hits)
        rec['samples'][k] = [(r['at'].strftime('%Y-%m-%d'), r['score'], (r['content'] or '')[:240]) for r in sorted(hits, key=lambda r: -(r['thumbsUpCount'] or 0))[:3]]
    out['apps'][pid] = rec
    print(f"{pid:32} {len(rs):>4} {len(low):>4} " + ' '.join(f"{rec['counts_low'][k]:>18}" for k in PAT))
here = os.path.dirname(os.path.abspath(__file__))
json.dump(out, open(os.path.join(here, f"onboarding-login-themes-{out['date']}.json"), 'w'), ensure_ascii=False, indent=1, default=str)
