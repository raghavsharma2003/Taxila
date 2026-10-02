"""adaptation-state-size.py: byte size of ConductorState.adapt at maximum fill, plain objects vs the packed codec
(adaptation-policy.md §7). Deterministic, no randomness. Run: python3 docs/research/conductor/adaptation-state-size.py"""
import json
DAY = '2026-10-02'
sk = lambda i: f'm4.frac.{i:02d}'          # realistic skill id length (≈ 12 chars)
close = dict(day=DAY, localHour=20, vibeClose='strained', endedBy='time_limit', minutes=18, plannedMin=20,
             soloPlanned=3, soloDone=2, soloDeclined=1)
latch = dict(on=True, since=DAY, fineRun=2)
def plain(ring):
    return dict(foldedDay=DAY, closes=[close] * ring, shortSeg=latch, lateSitting=latch, reviewBacklog=latch, soloUp=latch,
                paceBudget=dict(value=2, since=DAY, agreeDays=2, downRun=0),
                repSwitch={sk(i): dict(day=DAY, **{'from': 'F3'}, to='F5') for i in range(8)},
                prereqChecked={sk(i): dict(day=DAY, result='fail') for i in range(8)},
                choice=dict(offerId='home:2026-10-02:3:s2', context='next_topic', picked='m4.frac.07', teacherPick=False, forDay=DAY),
                goal=dict(goalId='2026-W40:1', isoWeek='2026-W40', skillIds=[sk(1)], byWeekday=4,
                          mcii=dict(obstacle='phone_busy', cue='after_dinner', action='ask_for_phone'), status='active'),
                optIns={k: dict(on=True, version=3) for k in ['mcii', 'standard', 'own_reminders']},
                depFlag=dict(lesson=True, homework=True, tohHigh=False, since=DAY),
                lastHomePick=dict(isoWeek='2026-W40', activityId='ha.child_teaches.03', kind='child_teaches'))
V = {'fine': 0, 'strained': 1, 'tired': 2}
E = {k: i for i, k in enumerate(['completed', 'time_limit', 'cap', 'bedtime', 'child_left', 'idle', 'network', 'safety', 'outage'])}
def packed(ring):
    # closes: [dayOffsetFromFoldedDay, hour, vibe, endedBy, minutes, plannedMin, soloPlanned, soloDone, soloDeclined]
    c = [[-13, 20, V['strained'], E['time_limit'], 18, 20, 3, 2, 1] for _ in range(ring)]
    l = [1, -2, 2]                                                  # [on, sinceOffset, fineRun]
    return dict(d=DAY, c=c, l=[l, l, l, l], p=[2, -2, 2, 0],
                rs=[[sk(i), -20, 3, 5] for i in range(8)], pc=[[sk(i), -9, 0] for i in range(8)],
                ch=['home:2026-10-02:3:s2', 0, 'm4.frac.07', 0, 1],
                g=['2026-W40:1', [sk(1)], 4, [1, 5, 1], 0], o=[[1, 3], [1, 3], [1, 3]], df=[1, 1, 0, -6],
                hp=['2026-W40', 'ha.child_teaches.03', 0])
b = lambda o: len(json.dumps(o, separators=(',', ':')).encode())
for ring in (8, 16):
    print(f'ring {ring:2d}: plain {b(plain(ring)):5d} B   packed {b(packed(ring)):5d} B   (target < 1536 B)')
