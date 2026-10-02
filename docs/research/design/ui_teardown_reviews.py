"""Mine Google Play reviews and store descriptions for call-screen UI signals.

Run: python3 docs/research/design/ui_teardown_reviews.py   (needs google_play_scraper)
Writes ui-teardown-reviews-<date>.json next to this file.

Method (written 2026-10-02 for ui-teardown.md):
- Newest N English reviews per app (country us and in), plus the full store description.
- For apps where the call surface is one feature among many (Duolingo, ChatGPT, Gemini,
  Khan Academy), keep only reviews that mention the call feature (SCOPE regex) before theming.
- Regex themes about the call screen (captions, avatar/face, interruption, latency, hints,
  transcript, translation, camera/screen share, uncanny, glitches).
- Report n per theme, share of the scoped set, mean stars, and the 4 most-upvoted samples.
Regex matching is crude: shares are relative signals between apps, not absolute rates.
"""
import json, re, datetime, os
from google_play_scraper import reviews, app, Sort

APPS = {
    'Duolingo':  ('com.duolingo', 6000, r"video ?call|\blily\b|falstaff|call with"),
    'Speak':     ('com.selabs.speak', 1500, None),
    'Praktika':  ('ai.praktika.android', 1500, None),
    'YoLearn':   ('com.yolearn.student', 600, None),
    'Synthesis': ('com.synthesis.tutor', 300, None),
    'Ello':      ('com.ellotechnology.learn', 600, None),
    'Khan Academy': ('org.khanacademy.android', 3000, r"khanmigo|\bai\b|tutor"),
    'ChatGPT':   ('com.openai.chatgpt', 6000, r"voice|talk|speak|conversation mode|advanced voice"),
    'Gemini':    ('com.google.android.apps.bard', 6000, r"\blive\b|voice|talk|speak|camera|screen shar"),
}
THEMES = {
    'captions':   r"caption|subtitle|transcript|text (on|appears)|see (the|what) (she|he|it) (says|said)|words? on (the )?screen",
    'avatar_face': r"avatar|face|lips?\b|mouth|lip ?sync|animation|animated|expression|eyes?\b|character|cartoon",
    'uncanny':    r"creepy|uncanny|weird face|scary|disturbing|dead eyes|soulless",
    'interrupt':  r"interrupt|cuts? (me )?off|cut me off|doesn'?t let me finish|let me finish|talks over|stops? listening|before i (finish|complete)",
    'latency':    r"lag|laggy|delay|slow to respond|takes (so |too )?long|waiting|response time|pause[sd]? (too|for)",
    'hints_help': r"\bhint|suggest(ed|ion)s? (answer|response|reply)|help button|stuck|don'?t know what to say|what to say",
    'translate':  r"translat",
    'turn_control': r"tap to (talk|speak)|hold (to|the) (talk|speak|button|mic)|push to talk|press(ing)? the (mic|button)|mic(rophone)? button|hands[- ]free",
    'camera_screen': r"camera|screen ?shar|share (my|the) screen|video mode|show (it|him|her) (my|the)",
    'glitch':     r"glitch|freez|crash|stuck on|black screen|bug|doesn'?t load|won'?t load",
    'human_like': r"real person|like (a|an) (real )?(human|person|teacher|tutor|friend)|feels? (so )?(real|natural|human)|human[- ]like|natural conversation|like talking to",
    'robotic':    r"robot|robotic|unnatural|monoton|fake voice|sounds? (like a )?machine",
    'visuals_whiteboard': r"whiteboard|sketch|draw|diagram|board|visual|image|picture|map",
    'hindi':      r"hindi|hinglish|indian accent|accent",
}
DESC_TERMS = r"caption|subtitle|transcript|avatar|animated|lip|hint|translat|whiteboard|sketch|board|camera|screen|interrupt|real[- ]time|video call|face|voice"


def pull(app_id, country, n):
    try:
        rs, _ = reviews(app_id, lang='en', country=country, sort=Sort.NEWEST, count=n)
        return rs
    except Exception as e:  # noqa
        print('ERR', app_id, country, str(e)[:100])
        return []


def summarise(rs):
    out = {'n': len(rs), 'themes': {}, 'samples': {}}
    if not rs:
        return out
    out['from'] = min(r['at'] for r in rs).strftime('%Y-%m-%d')
    out['to'] = max(r['at'] for r in rs).strftime('%Y-%m-%d')
    out['mean_stars'] = round(sum(r['score'] for r in rs) / len(rs), 2)
    for k, p in THEMES.items():
        hit = [r for r in rs if re.search(p, (r['content'] or '').lower())]
        out['themes'][k] = {'n': len(hit), 'share_pct': round(100 * len(hit) / len(rs), 1),
                            'mean_stars': round(sum(r['score'] for r in hit) / len(hit), 2) if hit else None}
        top = sorted(hit, key=lambda r: -(r['thumbsUpCount'] or 0))[:4]
        out['samples'][k] = [(r['at'].strftime('%Y-%m-%d'), r['score'], r['thumbsUpCount'], (r['content'] or '')[:260]) for r in top]
    return out


if __name__ == '__main__':
    res = {}
    for name, (i, n, scope) in APPS.items():
        allr = []
        for c in ('us', 'in'):
            got = pull(i, c, n)
            for r in got:
                r['_c'] = c
            allr += got
        seen, uniq = set(), []
        for r in allr:
            if r['reviewId'] in seen:
                continue
            seen.add(r['reviewId']); uniq.append(r)
        scoped = [r for r in uniq if (scope is None or re.search(scope, (r['content'] or '').lower()))]
        try:
            meta = app(i, lang='en', country='in')
            desc = meta.get('description') or ''
            hits = sorted(set(m.group(0).lower() for m in re.finditer(DESC_TERMS, desc.lower())))
            sents = [s.strip() for s in re.split(r'[\n\.]', desc) if re.search(DESC_TERMS, s.lower())][:25]
            dinfo = {'title': meta.get('title'), 'installs': meta.get('installs'), 'score': meta.get('score'),
                     'terms': hits, 'sentences': [s[:240] for s in sents]}
        except Exception as e:  # noqa
            dinfo = {'error': str(e)[:100]}
        res[name] = {'app_id': i, 'pulled': len(uniq), 'scope_regex': scope, 'scoped': summarise(scoped), 'description': dinfo}
        s = res[name]['scoped']
        print(name, 'pulled', len(uniq), 'scoped', s['n'], s.get('from'), s.get('to'), s.get('mean_stars'),
              {k: v['n'] for k, v in s['themes'].items()})
    d = datetime.date.today().isoformat()
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'ui-teardown-reviews-{d}.json')
    json.dump(res, open(path, 'w'), ensure_ascii=False, indent=1, default=str)
    print('wrote', path)
