"""Snapshot Google Play listings for the China/Asia teardown (china-asia.md).

Run: python3 china_asia_playstore.py  (needs google_play_scraper)
Writes china-asia-playstore-<date>.json next to this file. Written 2026-10-02.
realInstalls is a global count, not a per-country count. The storefront flag
only changes the localized title, rating and IAP currency.
"""
import json, datetime, os
from google_play_scraper import app

IDS = [('com.ruangguru.livestudents', 'id'), ('com.mathpresso.qanda', 'in'), ('com.mathpresso.qanda', 'id'),
       ('co.riiid.vida', 'kr'), ('com.solvely.photo.math.solver.calculator.ai', 'in'),
       ('com.education.android.h.intelligence', 'in'), ('com.qianfan.aihomework', 'in'), ('co.brainly', 'in')]
KEYS = ['title', 'installs', 'realInstalls', 'score', 'ratings', 'inAppProductPrice', 'released', 'lastUpdatedOn', 'developer']

if __name__ == '__main__':
    out = {}
    for i, c in IDS:
        try:
            a = app(i, lang='en', country=c)
            out[f'{i}|{c}'] = {k: a.get(k) for k in KEYS}
        except Exception as e:  # noqa
            out[f'{i}|{c}'] = {'error': str(e)[:120]}
        print(c, i, out[f'{i}|{c}'].get('realInstalls'), out[f'{i}|{c}'].get('score'))
    d = datetime.date.today().isoformat()
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'china-asia-playstore-{d}.json')
    json.dump(out, open(path, 'w'), indent=1, default=str)
    print('wrote', path)
