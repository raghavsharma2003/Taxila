"""Snapshot Google Play listings for the global AI tutor teardown.

Run: python3 global_tutors_playstore.py  (needs google_play_scraper)
Writes global-tutors-playstore-<date>.json next to this file.
Fields: title, installs bucket, realInstalls, score, ratings, IAP price range
(US and IN storefronts), release date. Written 2026-10-02 for global-ai-tutors.md.
"""
import json, datetime, os
from google_play_scraper import app

IDS = ['org.khanacademy.android', 'org.khankids.android', 'com.duolingo', 'com.selabs.speak',
       'ai.praktika.android', 'com.ellotechnology.learn', 'com.synthesis.tutor', 'com.ajeei.padhai',
       'co.brainly', 'com.education.android.h.intelligence', 'com.microblink.photomath',
       'com.qianfan.aihomework', 'com.google.android.apps.seekh', 'com.prathamInternational.padhAI',
       'com.loora.app', 'us.nobarriers.elsa']
KEYS = ['title', 'installs', 'realInstalls', 'score', 'ratings', 'reviews', 'price', 'free', 'offersIAP',
        'inAppProductPrice', 'contentRating', 'released', 'lastUpdatedOn', 'developer', 'genre']

if __name__ == '__main__':
    out = {}
    for i in IDS:
        for c in ('us', 'in'):
            try:
                a = app(i, lang='en', country=c)
                out[f'{i}|{c}'] = {k: a.get(k) for k in KEYS}
            except Exception as e:  # noqa
                out[f'{i}|{c}'] = {'error': str(e)[:120]}
            print(c, i, out[f'{i}|{c}'].get('realInstalls'), out[f'{i}|{c}'].get('score'))
    d = datetime.date.today().isoformat()
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'global-tutors-playstore-{d}.json')
    json.dump(out, open(path, 'w'), indent=1, default=str)
    print('wrote', path)
