import json,sys,collections
p=json.load(open(sys.argv[1]))
nodes={n['id']:n for n in p['nodes']}; parent={}
for n in p['nodes']:
    for c in n.get('children',[]): parent[c]=n['id']
def name(i):
    cf=nodes[i]['callFrame']; u=cf['url'].split('/assets/')[-1] if cf['url'] else ''
    return f"{cf['functionName'] or '(anon)'} {u}:{cf['lineNumber']}"
t=p['startTime']; times=[]
for d in p['timeDeltas']: t+=d; times.append(t)
dt=[0]+[times[i]-times[i-1] for i in range(1,len(times))]
busy=collections.Counter(); selfc=collections.Counter(); tot=0
# time buckets of 250ms busy
buckets=collections.Counter()
for s,ts,d in zip(p['samples'],times,dt):
    nm=nodes[s]['callFrame']['functionName']
    if nm in ('(idle)',): continue
    tot+=d; selfc[name(s)]+=d
    buckets[int((ts-p['startTime'])/250000)]+=d
    i=s; seen=set()
    while i is not None:
        k=name(i)
        if k not in seen: busy[k]+=d; seen.add(k)
        i=parent.get(i)
print('busy ms', round(tot/1000), 'span ms', round((times[-1]-p['startTime'])/1000))
print('busy per 250ms bucket:', ' '.join(f"{k*250}:{round(v/1000)}" for k,v in sorted(buckets.items())))
print('--- top inclusive')
for k,v in busy.most_common(40): print(round(v/1000), k)
print('--- top self')
for k,v in selfc.most_common(20): print(round(v/1000), k)
