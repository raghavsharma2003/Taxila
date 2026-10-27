import json,glob,collections
p=json.load(open(glob.glob(__import__('sys').argv[1]+'/*.cpuprofile')[0]))
nodes={n['id']:n for n in p['nodes']}
parent={}
for n in p['nodes']:
    for c in n.get('children',[]): parent[c]=n['id']
def stack(i):
    out=[]
    while i in nodes:
        cf=nodes[i]['callFrame']; out.append((cf['functionName'] or '(anon)')+' '+cf['url'].split('/Taxila/')[-1].split('node_modules/')[-1]+':'+str(cf['lineNumber']))
        i=parent.get(i)
        if i is None: break
    return out
t=p['startTime']; times=[]
for d in p['timeDeltas']: t+=d; times.append(t)
samples=p['samples']
idle=lambda i: nodes[i]['callFrame']['functionName'] in ('(idle)','(program)','(garbage collector)')
# find busy runs
runs=[];cur=None
for k,(s,ts) in enumerate(zip(samples,times)):
    b = nodes[s]['callFrame']['functionName']!='(idle)'
    if b:
        if cur is None: cur=[ts,ts,[]]
        cur[1]=ts; cur[2].append(s)
    else:
        if cur and cur[1]-cur[0]>150000: runs.append(cur)
        cur=None
if cur and cur[1]-cur[0]>150000: runs.append(cur)
for r in runs:
    print('RUN', round((r[0]-p['startTime'])/1000), 'ms +', round((r[1]-r[0])/1000),'ms')
    c=collections.Counter()
    for s in r[2]:
        st=stack(s)
        for f in set(st[:]): c[f]+=1
    for f,n in c.most_common(25): print('   ',n,f)
