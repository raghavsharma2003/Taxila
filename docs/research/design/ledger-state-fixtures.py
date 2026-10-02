# PRODUCT-DESIGN.md §6.4.1 ledger state machine: reference fold + PD-G28 fixtures
# (gap-fill G1-ledger-entry-rule2). Written 2026-10-02. Deterministic, stdlib only.
# Run from this folder: python3 ledger-state-fixtures.py
# Writes ledger-state-fixtures-2026-10-02.json (fixtures + expected states) for porting to
# tests/fixtures/ledger/pd-g28/ against the real fold (src/learner/kt/mastery.ts, kt-algorithms §5).
#
# This is a REFERENCE for the rule, not the product module. Simplifications, all on purpose:
#  - FSRS retrievability gate omitted (R = 1); exits here depend on outcomes, not on pL.
#  - LRs are the kt-algorithms §1.2 launch priors; probe.why / probe.teachback use the grader-folded
#    values from kt-algorithms §1.3 (5.3 / 4.8 for a full pass). All [U] there, so [U] here.
#  - the ema shadow guard is omitted (PRODUCT-DESIGN §11 open question 8: from ema = 0 it needs 12 C0).
#  - placement updates no pL (kt D4: placement goes through IRT theta, not BKT); it only sets flags.
import json, math, os, copy

HERE = os.path.dirname(os.path.abspath(__file__))
DELAY_H = 20.0       # learning-science rule 2(c) via kt-algorithms §2.6: >= 20 h, a different session
PL_GUARD = 0.95      # kt-algorithms §2.6 learned-today threshold (necessary, never sufficient)
T_LEARN = 0.12       # kt-algorithms §2.4, T3 concepts

LR = {
    'item.open': {'C0': 8.0, 'C1': 1.0, 'C2': 0.35, 'C3': 0.16, 'C4': 0.05},
    'item.mcq2': {'correct': 1.8, 'wrong': 0.20},
    'item.mcq3': {'correct': 2.7, 'wrong': 0.15},
    'item.mcq4': {'correct': 3.6, 'wrong': 0.13},
    'probe.why': {'full': 5.3, 'partial': 1.22, 'none': 0.34, 'misc': 0.17},
    'probe.why.choice': {'correct': 1.8, 'wrong': 0.20},          # "because A or B?" = an mcq2
    'probe.teachback': {'hi': 4.8, 'mid': 1.25, 'lo': 0.36, 'misc': 0.17},
    'probe.transfer.near': {'pass': 5.7, 'fail': 0.18},
    'probe.errorspot': {'caught_fixed': 5.0, 'caught': 1.15, 'missed': 0.33},
}
RECOGNISE = {'item.mcq2', 'item.mcq3', 'item.mcq4', 'probe.why.choice'}
CORRECT = {'C0', 'C1', 'C2', 'C3', 'correct', 'full', 'hi', 'pass', 'caught_fixed'}
WORD = {0: 'Abhi nahi', 1: 'Abhyaas mein', 2: 'Aa gaya', 3: 'Pakka'}
BAGIYA = {0: 'plot+seed packet', 1: 'two-leaf sprout', 2: 'flower', 3: 'fruit+done ring'}
AASMAAN = {0: 'outline ring', 1: 'dot', 2: '4-point star', 3: '4-point star in ticked ring'}

BASE = dict(require_generative=True, recognition_counts=False, demote_after=2, delay_h=DELAY_H)
CONTROLS = {
    'NC1 drop (b) requirement': dict(BASE, require_generative=False),
    'NC2 taps count as produce': dict(BASE, recognition_counts=True),
    'NC3 demote on first miss': dict(BASE, demote_after=1),
    'NC4 no 20 h delay': dict(BASE, delay_h=0.0),
}


def form_of(ev):
    if ev['cls'] in RECOGNISE:
        return 'recognise'
    return ev.get('form', 'produce')


def lr_of(ev):
    if ev['cls'] == 'probe.transfer.near' and form_of(ev) == 'recognise':
        return LR['item.mcq3']['correct' if ev['o'] == 'pass' else 'wrong']
    return LR[ev['cls']][ev['o']]


def new_skill(prior):
    return dict(level=0, max_level=0, pL=prior, a_day=None, b_day=None, correct_day=None,
                ab_anchor=None, delay_anchor=None, misses=0, recheck_due=False,
                tap_pass=False, produce_pass=False, seen=set(), taught=set(), rows=[], child=[], parent=[])


def child_view(x):          # the child's render: a pure function of level; NO recheck_due, NO clock
    return (BAGIYA[x['level']], AASMAAN[x['level']])


def parent_view(x):
    return WORD[x['level']] + (' + re-check due' if x['recheck_due'] else '')


def fold(events, prior=0.25, cfg=BASE):
    st = {}
    for ev in sorted(events, key=lambda e: (e['t'], e.get('seq', 0))):
        skills = ev.get('skills', [ev.get('skill', 'X')])
        target = ev.get('target', skills[0])
        for sk in skills:
            x = st.setdefault(sk, new_skill(ev.get('prior', prior)))
            is_t = (sk == target)
            if ev.get('low'):                 # low-confidence, interrupted, ASR-dropped: never evidence
                x['child'].append(child_view(x)); x['parent'].append(parent_view(x)); continue
            if ev['cls'] == 'teach':
                x['taught'].add(ev['s']); continue
            t, s, day = ev['t'], ev['s'], int(ev['t'] // 24)
            form = 'produce' if cfg['recognition_counts'] else form_of(ev)
            first_in_session = s not in x['seen']
            x['seen'].add(s)

            # ---- placement (C4): no pL update; a tap pass sets Abhyaas mein only; a first-try produce pass is (a)
            if ev['cls'] == 'placement':
                if ev['o'] == 'pass':
                    x['level'] = max(x['level'], 1)
                    if form_of(ev) == 'recognise':
                        x['tap_pass'] = True               # recognition: Abhyaas mein at most, never (a)
                        if cfg['recognition_counts']:
                            x['a_day'] = day; x['b_day'] = day
                    elif not ev.get('retry'):
                        x['produce_pass'] = True           # a first-attempt produce pass is (a) for today
                        x['a_day'] = day; x['correct_day'] = day
                x['max_level'] = max(x['max_level'], x['level'])
                x['child'].append(child_view(x)); x['parent'].append(parent_view(x)); continue

            # ---- delayed check: decided on the state BEFORE this event
            delayed = (x['level'] >= 2 and is_t and first_in_session and s not in x['taught']
                       and form == 'produce' and x['delay_anchor'] is not None
                       and t >= x['delay_anchor'][0] + cfg['delay_h'] and s != x['delay_anchor'][1])

            # ---- BKT-R update (kt-algorithms §2.2 without the R gate)
            q = x['pL'] * lr_of(ev) / (x['pL'] * lr_of(ev) + 1 - x['pL'])
            x['pL'] = q + (1 - q) * T_LEARN
            x['level'] = max(x['level'], 1)
            hinted = ev.get('hinted', False)
            if is_t and ev['o'] in CORRECT and form_of(ev) == 'recognise':
                x['tap_pass'] = True                      # tracked by TRUE form, whatever cfg says
            if is_t and ev['cls'] == 'item.open' and ev['o'] == 'C0':
                x['produce_pass'] = True

            if delayed:
                o = ev['o']
                passed = (ev['cls'] == 'item.open' and o == 'C0') or (ev['cls'] == 'probe.transfer.near' and o == 'pass')
                missed = o in ('C3', 'C4', 'fail', 'none', 'misc')
                x['delay_anchor'] = (t, s)
                if passed:
                    x['misses'] = 0
                    if x['level'] == 3:
                        x['recheck_due'] = False; x['rows'].append('still right later')
                    elif x['ab_anchor'] is not None:
                        x['level'] = 3; x['rows'].append('pakka')
                elif missed:
                    x['misses'] += 1
                    x['rows'].append('missed delayed check')
                    if x['misses'] >= cfg['demote_after']:
                        x['level'] -= 1; x['misses'] = 0; x['recheck_due'] = False; x['ab_anchor'] = None
                        x['rows'].append('demotion')
                    elif x['level'] == 3:
                        x['recheck_due'] = True; x['rows'].append('re-check due')
                # C1/C2 at a delayed check: neither a pass nor a miss; the count is neither raised nor reset

            # ---- (a) and (b) for today (target skill only)
            if is_t and not hinted:
                if ev['cls'] == 'item.open' and ev['o'] == 'C0':
                    x['a_day'] = day                       # (a): unaided, first try, produce-form
                if cfg['recognition_counts'] and ev['cls'] in RECOGNISE and ev['o'] == 'correct':
                    x['a_day'] = day; x['b_day'] = day     # NC2 only: a correct tap stands in for both
                if form == 'produce':
                    gen = ((ev['cls'] == 'probe.why' and ev['o'] == 'full' and x['correct_day'] == day)
                           or (ev['cls'] == 'probe.teachback' and ev['o'] == 'hi')
                           or (ev['cls'] == 'probe.transfer.near' and ev['o'] == 'pass')
                           or (ev['cls'] == 'probe.errorspot' and ev['o'] == 'caught_fixed'))
                    if gen:
                        x['b_day'] = day                   # (b): generative or near transfer, produce-form
            if is_t and ev['o'] in CORRECT:
                x['correct_day'] = day

            ab_today = x['a_day'] == day and (x['b_day'] == day or not cfg['require_generative'])
            if is_t and ab_today and x['pL'] >= PL_GUARD:
                if x['level'] < 2:
                    x['level'] = 2; x['ab_anchor'] = (t, s); x['delay_anchor'] = (t, s); x['rows'].append('aa gaya')
                elif x['level'] == 2 and x['ab_anchor'] is None:
                    x['ab_anchor'] = (t, s); x['delay_anchor'] = (t, s); x['rows'].append('relearned')
            x['max_level'] = max(x['max_level'], x['level'])
            x['child'].append(child_view(x)); x['parent'].append(parent_view(x))
    return st


def E(t, s, cls, o, **kw):
    d = dict(t=t, s=s, cls=cls, o=o); d.update(kw); return d


# Day 0 starts 00:00 IST. Lessons run inside 07:00-20:30, so no lesson crosses midnight.
PATH_TO_PAKKA = [E(10.0, 's1', 'item.open', 'C0'), E(10.2, 's1', 'probe.transfer.near', 'pass'),
                 E(34.0, 's2', 'item.open', 'C0')]
FIXTURES = [
    dict(id='F1', name="'I know this' with two correct taps, diagnostic prior 0.85", must='never Aa gaya',
         prior=0.85, events=[E(10.0, 's1', 'item.mcq3', 'correct', check='iknow'), E(10.1, 's1', 'item.mcq4', 'correct', check='iknow')],
         expect=dict(level=1, max_level=1, tap_pass=True, produce_pass=False)),
    dict(id='F2', name='two unaided C0 today, delayed C0 tomorrow, no generative pass', must='never Pakka (nor Aa gaya)',
         events=[E(10.0, 's1', 'item.open', 'C0'), E(10.1, 's1', 'item.open', 'C0'), E(34.0, 's2', 'item.open', 'C0')],
         expect=dict(level=1, max_level=1)),
    dict(id='F3', name='positive control: (a)+(b) same day, (c) 24 h later', must='Aa gaya then Pakka',
         events=PATH_TO_PAKKA, expect=dict(level=3, max_level=3, rows_include=['aa gaya', 'pakka'])),
    dict(id='F4', name='placement taps 2 of 2 + same-day teach-back pass, diagnostic prior 0.85', must='Abhyaas mein only',
         prior=0.85, events=[E(9.0, 'p1', 'placement', 'pass', form='recognise'), E(9.1, 'p1', 'placement', 'pass', form='recognise'),
                 E(9.5, 'p1', 'probe.teachback', 'hi')],
         expect=dict(level=1, max_level=1, tap_pass=True, produce_pass=False)),
    dict(id='F4b', name='placement PRODUCE pass + same-day teach-back pass, prior 0.85 (kt fast-forward)', must='Aa gaya',
         prior=0.85, events=[E(9.0, 'p1', 'placement', 'pass', form='produce'), E(9.5, 'p1', 'probe.teachback', 'hi')],
         expect=dict(level=2, max_level=2, tap_pass=False, produce_pass=True)),
    dict(id='F5', name='B1 second micro-session 4 h later', must='stays Aa gaya (< 20 h)',
         events=[E(9.0, 's1', 'item.open', 'C0'), E(9.1, 's1', 'probe.transfer.near', 'pass'), E(13.0, 's2', 'item.open', 'C0')],
         expect=dict(level=2, max_level=2)),
    dict(id='F6', name="choice-form why ('because A or B?') after a correct answer", must='not (b)',
         events=[E(10.0, 's1', 'item.open', 'C0'), E(10.1, 's1', 'probe.why.choice', 'correct')],
         expect=dict(level=1, max_level=1)),
    dict(id='F7', name="'I know this' produce item + near transfer, on-grade prior 0.25", must='Aa gaya',
         events=[E(10.0, 's1', 'item.open', 'C0', check='iknow'), E(10.1, 's1', 'probe.transfer.near', 'pass', check='iknow')],
         expect=dict(level=2, max_level=2)),
    dict(id='F7b', name="'I know this' at above-grade prior 0.10: two passes, then the third produce item", must='Aa gaya only after item 3',
         prior=0.10,
         events=[E(10.0, 's1', 'item.open', 'C0', check='iknow'), E(10.1, 's1', 'probe.transfer.near', 'pass', check='iknow'),
                 E(10.2, 's1', 'item.open', 'C0', check='iknow')],
         expect=dict(level=2, level_after=[(1, 1), (2, 2)])),
    dict(id='F8', name='Pakka, one missed delayed re-check', must='child view unchanged; parent re-check due',
         events=PATH_TO_PAKKA + [E(200.0, 's3', 'item.open', 'C4')],
         expect=dict(level=3, recheck_due=True, child_unchanged_at=3, rows_include=['re-check due'])),
    dict(id='F9', name='Pakka, two consecutive missed re-checks', must='fruit to flower, ring off, report row',
         events=PATH_TO_PAKKA + [E(200.0, 's3', 'item.open', 'C4'), E(250.0, 's4', 'item.open', 'C3')],
         expect=dict(level=2, max_level=3, recheck_due=False, rows_include=['demotion'])),
    dict(id='F10', name='miss, pass, miss (not consecutive)', must='no demotion',
         events=PATH_TO_PAKKA + [E(200.0, 's3', 'item.open', 'C4'), E(250.0, 's4', 'item.open', 'C0'), E(300.0, 's5', 'item.open', 'C4')],
         expect=dict(level=3, recheck_due=True)),
    dict(id='F11', name='after demotion, a delayed pass without fresh (a)+(b)', must='stays Aa gaya; Pakka only after relearn + (c)',
         events=PATH_TO_PAKKA + [E(200.0, 's3', 'item.open', 'C4'), E(250.0, 's4', 'item.open', 'C4'),
                                 E(300.0, 's5', 'item.open', 'C0'),
                                 E(300.5, 's5', 'probe.why', 'full'), E(330.0, 's6', 'item.open', 'C0')],
         expect=dict(level=3, level_after=[(5, 2), (6, 2)], rows_include=['demotion', 'relearned'])),
    dict(id='F12', name='conjunctive word problem: why pass on target X', must='non-target Y stays Abhyaas mein',
         events=[E(10.0, 's1', 'item.open', 'C0', skills=['X', 'Y'], target='X'), E(10.1, 's1', 'probe.why', 'full', skill='X'),
                 E(10.2, 's1', 'probe.transfer.near', 'pass', skill='X')],
         expect=dict(skill='Y', level=1, max_level=1)),
    dict(id='F13', name='(b) in a low-confidence window', must='not (b)',
         events=[E(10.0, 's1', 'item.open', 'C0'), E(10.1, 's1', 'probe.transfer.near', 'pass', low=True)],
         expect=dict(level=1, max_level=1)),
    dict(id='F14', name='hinted correct (C2) + transfer pass', must='no (a), so no Aa gaya',
         events=[E(10.0, 's1', 'item.open', 'C2'), E(10.1, 's1', 'probe.transfer.near', 'pass')],
         expect=dict(level=1, max_level=1)),
]
for f in FIXTURES:   # the seq field keeps the sort stable for same-time events
    for i, e in enumerate(f['events']):
        e['seq'] = i


def check(f, cfg):
    st = fold(copy.deepcopy(f['events']), prior=f.get('prior', 0.25), cfg=cfg)
    x = st[f['expect'].get('skill', 'X')]
    ex = f['expect']; fails = []
    for k in ('level', 'max_level', 'recheck_due', 'tap_pass', 'produce_pass'):
        if k in ex and x[k] != ex[k]:
            fails.append(f'{k}={x[k]} want {ex[k]}')
    for r in ex.get('rows_include', []):
        if r not in x['rows']:
            fails.append(f'row "{r}" missing')
    if 'child_unchanged_at' in ex:
        i = ex['child_unchanged_at']
        if x['child'][i] != x['child'][i - 1]:
            fails.append(f'child view changed at event {i}')
    for (i, want) in ex.get('level_after', []):
        got = fold_prefix(f, cfg, i + 1)
        if got != want:
            fails.append(f'after event {i}: level {got} want {want}')
    return fails


def fold_prefix(f, cfg, n):
    st = fold(copy.deepcopy(f['events'][:n]), prior=f.get('prior', 0.25), cfg=cfg)
    return st[f['expect'].get('skill', 'X')]['level']


if __name__ == '__main__':
    print('PD-G28 ledger fixtures (reference fold). Columns: base rule, then each negative control.\n')
    cols = ['base'] + list(CONTROLS)
    print(f"{'id':<4} {'fixture':<72} " + ' '.join(f'{c[:4]:>5}' for c in cols))
    results = {}
    for f in FIXTURES:
        row = []
        for c in cols:
            cfg = BASE if c == 'base' else CONTROLS[c]
            fails = check(f, cfg)
            results[(f['id'], c)] = fails
            row.append('pass' if not fails else 'FAIL')
        print(f"{f['id']:<4} {f['name'][:72]:<72} " + ' '.join(f'{r:>5}' for r in row))
    base_ok = all(not results[(f['id'], 'base')] for f in FIXTURES)
    print('\nbase rule: ' + ('ALL PASS' if base_ok else 'FAILURES'))
    for f in FIXTURES:
        if results[(f['id'], 'base')]:
            print('  ', f['id'], results[(f['id'], 'base')])
    nc_ok = True
    for c in CONTROLS:
        tripped = [f['id'] for f in FIXTURES if results[(f['id'], c)]]
        nc_ok &= bool(tripped)
        print(f'{c}: gate {"FAILS as it must" if tripped else "DOES NOT FAIL (control is blind)"}; tripped by {tripped}')
        for fid in tripped[:3]:
            print('     ', fid, results[(fid, c)])
    print('\nGATE PD-G28 (reference): ' + ('OK: base passes and every negative control fails' if base_ok and nc_ok else 'BROKEN'))

    print('\npL traces (kt-algorithms §1.2/§2.4 priors, T = 0.12, no R gate) for the "I know this" check:')
    for prior in (0.50, 0.25, 0.10):
        p = prior; trace = [f'{p:.2f}']
        for lr in (8.0, 5.7, 8.0):
            q = p * lr / (p * lr + 1 - p); p = q + (1 - q) * T_LEARN; trace.append(f'{p:.3f}')
        print(f'  prior {prior:.2f}: C0 open -> near transfer -> C0 open : ' + ' -> '.join(trace))
    p = 0.25; q = p * 8 / (p * 8 + 1 - p); p = q + (1 - q) * T_LEARN
    q = p * 5.3 / (p * 5.3 + 1 - p); p2 = q + (1 - q) * T_LEARN
    print(f'  prior 0.25: C0 open -> why full (folded LR 5.3): {p2:.4f} (margin over 0.95: {p2 - 0.95:+.4f})')
    n = math.ceil(math.log(0.3) / math.log(0.9))
    print(f'  ema guard: from ema = 0 with alpha 0.9, ema >= 0.7 needs {n} consecutive C0 (1 - 0.9^n >= 0.7)')
    print(f'  mcq3 vs open C0 evidence: log LR {math.log(2.7):.2f} vs {math.log(8.0):.2f} (ratio {math.log(8.0)/math.log(2.7):.2f}x)')

    out = dict(date='2026-10-02', source='PRODUCT-DESIGN.md §6.4.1, gate PD-G28 (gap-fill G1-ledger-entry-rule2)',
               rule=dict(delay_h=DELAY_H, pL_guard=PL_GUARD, T=T_LEARN, demote_after=2),
               controls={k: v for k, v in CONTROLS.items()},
               fixtures=[dict(id=f['id'], name=f['name'], must=f['must'], prior=f.get('prior', 0.25),
                              events=[{k: v for k, v in e.items() if k != 'seq'} for e in f['events']],
                              expect=f['expect']) for f in FIXTURES])
    with open(os.path.join(HERE, 'ledger-state-fixtures-2026-10-02.json'), 'w') as fh:
        json.dump(out, fh, indent=1, ensure_ascii=False)
    print('\nwrote ledger-state-fixtures-2026-10-02.json')
