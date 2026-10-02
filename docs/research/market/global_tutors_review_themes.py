"""Theme-mine recent Google Play reviews of global AI tutor apps.

Run: python3 global_tutors_review_themes.py  (needs google_play_scraper)
Writes global-tutors-review-themes-<date>.json next to this file.
Method: newest N reviews per app per country (en), regex theme match on review
text, report share of reviews matching each theme and mean stars of matching
reviews. Regex matching is crude: treat shares as relative signals between
apps, not absolute rates. Written 2026-10-02 for global-ai-tutors.md.
"""
import json, re, collections, datetime, os
from google_play_scraper import reviews, Sort

APPS = {
    'Speak': 'com.selabs.speak',
    'Praktika': 'ai.praktika.android',
    'Loora': 'com.loora.app',
    'ELSA': 'us.nobarriers.elsa',
    'Duolingo': 'com.duolingo',
    'Khan Academy': 'org.khanacademy.android',
    'Khan Kids': 'org.khankids.android',
    'Gauth': 'com.education.android.h.intelligence',
    'Brainly': 'co.brainly',
    'Photomath': 'com.microblink.photomath',
    'Question.AI': 'com.qianfan.aihomework',
    'PadhAI (SigIQ)': 'com.ajeei.padhai',
}
THEMES = {
    'human_like': r"real person|like (a|an) (real )?(human|person|teacher|tutor|friend)|feels? (so )?(real|natural|human)|human[- ]like|natural conversation|like talking to",
    'robotic': r"robot|robotic|unnatural|monoton|fake voice|sounds? (like a )?machine",
    'memory': r"remember|remembers|forgot|forgets|memory",
    'interrupt_latency': r"interrupt|cuts? me off|cut me off|doesn'?t let me finish|lag|delay|too slow|takes (so )?long|waiting",
    'speech_recog': r"(doesn'?t|didn'?t|can'?t|cannot|won'?t) (understand|hear|recogni[sz]e)|recognition|microphone|\bmic\b",
    'price_paywall': r"expensive|price|paywall|subscription|subscribe|premium|pay |paid|money|refund|trial",
    'wrong_answers': r"wrong answer|incorrect|gives? wrong|not accurate|inaccurate|mistakes? in (the )?(answer|solution)",
    'explains_steps': r"step[- ]by[- ]step|explain|explanation|understand (the|it|concept)",
    'confidence_anxiety': r"confiden|anxi|nervous|shy|afraid|scared|judg",
    'boring_repetitive': r"boring|repetitive|same (thing|question|lesson)s?|repeat",
    'motivation_streak': r"streak|motivat|addict|fun\b|game",
    'hindi_india': r"hindi|hinglish|india|indian",
}

def mine(app_id, country, n):
    try:
        rs, _ = reviews(app_id, lang='en', country=country, sort=Sort.NEWEST, count=n)
    except Exception as e:  # noqa
        return {'error': str(e)[:120]}
    if not rs:
        return {'n': 0}
    out = {'n': len(rs),
           'from': min(r['at'] for r in rs).strftime('%Y-%m-%d'),
           'to': max(r['at'] for r in rs).strftime('%Y-%m-%d'),
           'mean_stars': round(sum(r['score'] for r in rs) / len(rs), 2),
           'themes': {}, 'samples': {}}
    for k, p in THEMES.items():
        hit = [r for r in rs if re.search(p, (r['content'] or '').lower())]
        out['themes'][k] = {'share_pct': round(100 * len(hit) / len(rs), 1),
                            'n': len(hit),
                            'mean_stars': round(sum(r['score'] for r in hit) / len(hit), 2) if hit else None}
        top = sorted(hit, key=lambda r: -(r['thumbsUpCount'] or 0))[:3]
        out['samples'][k] = [(r['at'].strftime('%Y-%m-%d'), r['score'], (r['content'] or '')[:220]) for r in top]
    return out

if __name__ == '__main__':
    res = {}
    for name, i in APPS.items():
        for c in ('us', 'in'):
            res[f'{name}|{c}'] = mine(i, c, 600)
            r = res[f'{name}|{c}']
            if 'themes' in r:
                print(name, c, r['n'], r['from'], r['to'], r['mean_stars'],
                      {k: v['share_pct'] for k, v in r['themes'].items()})
            else:
                print(name, c, r)
    d = datetime.date.today().isoformat()
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'global-tutors-review-themes-{d}.json')
    json.dump(res, open(path, 'w'), ensure_ascii=False, indent=1, default=str)
    print('wrote', path)
