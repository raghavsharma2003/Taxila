"""Coverage of the CONTENT-ENGINE.md v1 engine set over maths + EVS/science topics (2026-10-02).

Run from the repo root:  python3 docs/research/content/content-engine-coverage.py
Inputs: maths-engine-map.json, science-engine-map.json (this folder). Prints the tables used in CONTENT-ENGINE.md §2.3.
"""
import json, collections, os
HERE = os.path.dirname(os.path.abspath(__file__))
m = json.load(open(os.path.join(HERE, 'maths-engine-map.json')))
s = json.load(open(os.path.join(HERE, 'science-engine-map.json')))
MERGE = {'measure-lab': 'measure', 'heat-flow': 'particles', 'number-grid': 'patterns', 'symmetry': 'shape-lab',
         'chance': 'data-graphs', 'algebra-moves': 'symbol-lab', 'rule-lab': 'symbol-lab'}
T = {}
for tid, v in m['topics'].items():
    c = int(tid.split('-')[0][1:])
    T[tid] = (c, 'maths', MERGE.get(v['primary'], v['primary']), {MERGE.get(x, x) for x in [v['primary'], *v['secondary']]})
for t in s['topics']:
    p = t['engine'].split('@')[0] if t['format'] == 'engine' else 'G:' + t['generic']
    p = MERGE.get(p, p)
    T[t['id']] = (t['class'], 'sci', p, {p})
N = len(T)
V1 = ['number-line', 'collections', 'place-value', 'fractions', 'multiply-divide', 'data-graphs', 'patterns', 'geoboard',
      'measure', 'motion-lab', 'sky', 'water-cycle']
LAYER = ['G:sorter', 'G:sequence', 'G:time-lapse', 'G:label-diagram', 'G:microscope', 'G:classification-key', 'G:habitat-match',
         'G:pattern', 'G:thali-builder', 'G:spot-the-hazard', 'G:formula-builder']

def report(name, S, layer=()):
    byc = collections.defaultdict(lambda: [0, 0]); tot = 0
    for tid, (c, sub, p, a) in T.items():
        byc[(c, sub)][1] += 1
        if p in S or p in layer:
            byc[(c, sub)][0] += 1; tot += 1
    print(f'{name}: {tot}/{N} = {tot / N:.1%}')
    for sub in ['maths', 'sci']:
        cells = [f'C{c}:{byc[(c, sub)][0]}/{byc[(c, sub)][1]}' for c in range(1, 10) if byc[(c, sub)][1]]
        a = sum(byc[(c, sub)][0] for c in range(1, 10)); b = sum(byc[(c, sub)][1] for c in range(1, 10))
        print(f'  {sub} {a}/{b} = {a / b:.0%}  ' + ' '.join(cells))

report('v1 T1 (12 engines)', V1)
report('v1 T1 + T2a/diagram layer', V1, LAYER)
cnt = collections.Counter(v[2] for v in T.values())
print('primary topics per engine:', dict(cnt.most_common()))
