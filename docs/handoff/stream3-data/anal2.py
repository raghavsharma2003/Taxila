import json,glob,collections
p=json.load(open(glob.glob('prof/*.cpuprofile')[0]))
nodes={n['id']:n for n in p['nodes']}
parent={}
for n in p['nodes']:
    for c in n.get('children',[]): parent[c]=n['id']
t=p['startTime']; times=[]
for d in p['timeDeltas']: t+=d; times.append(t)
end=times[-1]
win=[(s,ts) for s,ts in zip(p['samples'],times) if ts> end-2200000]
dt=(times[-1]-times[0])/len(times)
busy=[s for s,ts in win if nodes[s]['callFrame']['functionName'] not in ('(idle)',)]
print('window ms', 2200, 'busy ms ~', round(len(busy)*dt/1000))
def stack(i):
    out=[]
    while i in nodes:
        cf=nodes[i]['callFrame']; out.append((cf['functionName'] or '(anon)')+' '+cf['url'].split('/Taxila/')[-1].split('node_modules/')[-1]+':'+str(cf['lineNumber']))
        i=parent.get(i)
        if i is None: break
    return out
c=collections.Counter()
for s in busy:
    for f in set(stack(s)): c[f]+=1
for f,n in c.most_common(30): print(round(n*dt/1000),'ms',f)
