# SCOUT 2026-10-05: diff this week's snapshots against 2026-10-04's. Writes results/diff-2026-10-05.json.
import json, collections
P='model-refresh-2026-10-04/'; N='model-scout-2026-10-05/results/'
out={}
# Foundry catalogue: last week only kept the recent-120d slice, so diff on that window plus any lifecycle/retire change for names present.
old=json.load(open(P+'scout/results/foundry-catalog-recent-120d.json'))
new=json.load(open(N+'catalog-all-2026-10-05.json'))
def key(s): return s['name']
def locs(s): return sorted({(k['n'],l) for k in (s.get('skus') or []) for l in (k.get('l') or [])})
om={key(s):s for s in old}; nm={}
for s in new: nm.setdefault(key(s),s)
oldmin=min(s['created'] for s in old)
cat={'new':[],'changed':[],'gone_from_window':[]}
for n,s in nm.items():
    if n in om:
        o=om[n]; ch={}
        for f in ['ver','life','direct','retire','opts','minQ','offers']:
            if o.get(f)!=s.get(f): ch[f]=[o.get(f),s.get(f)]
        lo,ln=locs(o),locs(s)
        if lo!=ln: ch['skuloc']={'added':sorted(set(ln)-set(lo)),'removed':sorted(set(lo)-set(ln))}
        if ch: cat['changed'].append({'name':n,'pub':s['pub'],'ver':s['ver'],'direct':s['direct'],'life':s['life'],'changes':ch})
    elif (s.get('created') or '')>=oldmin:
        cat['new'].append({'name':n,'ver':s['ver'],'pub':s['pub'],'reg':s['reg'],'created':s['created'],'life':s['life'],'direct':s['direct'],'opts':s['opts'],
          'skus':[{'n':k['n'],'india':[l for l in (k.get('l') or []) if 'INDIA' in l.upper()],'nloc':len(k.get('l') or [])} for k in (s.get('skus') or [])],
          'tasks':s.get('tasks'),'inMod':s.get('inMod'),'outMod':s.get('outMod'),'retire':s.get('retire'),'summary':s.get('summary')})
for n in om:
    if n not in nm: cat['gone_from_window'].append({'name':n,'pub':om[n]['pub'],'ver':om[n]['ver']})
# retirements within 120 days in the full catalogue for names we route on
cat['retire_le_2027_02_02']=sorted([{'name':s['name'],'ver':s['ver'],'pub':s['pub'],'retire':s['retire'],'direct':s['direct']} for s in new if s.get('retire') and s['retire'][:10]<='2027-02-02'],key=lambda x:x['retire'])
out['foundry']=cat
# ARM per region
oa=json.load(open(P+'scout/results/arm-loc.json')); na=json.load(open(N+'arm-loc-2026-10-05.json'))
arm={}
for loc in na:
    k=lambda v:(v['name'],v['ver'],v['fmt'])
    o={k(v):v for v in oa.get(loc,[])}; n={k(v):v for v in na[loc]}
    arm[loc]={'added':[n[x] for x in n if x not in o],'removed':[o[x] for x in o if x not in n],
              'changed':[{'model':x,'old':{f:o[x][f] for f in ['life','skus','dep']},'new':{f:n[x][f] for f in ['life','skus','dep']}} for x in n if x in o and any(o[x][f]!=n[x][f] for f in ['life','skus','dep'])]}
    arm[loc]['deprecating_le_60d']=sorted([{'name':v['name'],'ver':v['ver'],'dep':v['dep'],'life':v['life']} for v in na[loc] if v.get('dep') and v['dep'][:10]<='2026-12-04'],key=lambda x:x['dep'])
out['arm']=arm
# Prices: normalize
op=json.load(open(P+'setup/results/prices-2026-10-04.json'))['items']; np_=json.load(open(N+'prices-2026-10-05.json'))['items']
ok={(i['p'],i['m'],i['r']):i['price'] for i in op}
nk={}
for i in np_:
    r=i.get('armRegionName') or ''
    if r.lower() not in ('eastus2','centralindia','southindia'): continue
    if i.get('type')!='Consumption': continue
    nk[(i['productName'],i['meterName'],r)]=i['retailPrice']
pr={'added':sorted([list(k)+[v] for k,v in nk.items() if k not in ok]),'removed':sorted([list(k)+[v] for k,v in ok.items() if k not in nk]),
    'changed':sorted([list(k)+[ok[k],v] for k,v in nk.items() if k in ok and abs(ok[k]-v)>1e-12])}
out['prices']={k:len(v) for k,v in pr.items()}; out['prices_detail']=pr
# Bedrock
ob=json.load(open(P+'scout/results/bedrock-list.json')); nb=json.load(open(N+'bedrock-list-2026-10-05.json'))
bd={}
for r in nb:
    o={m['modelId']:m for m in ob.get(r,{}).get('fm',[])}; n={m['modelId']:m for m in nb[r]['fm']}
    oi={p['id']:p for p in ob.get(r,{}).get('ip',[])}; ni={p['id']:p for p in nb[r]['ip']}
    bd[r]={'baseline':r in ob,'fm_added':[n[x] for x in n if x not in o] if r in ob else len(n),'fm_removed':[o[x] for x in o if x not in n],
       'fm_lifecycle_changed':[{'id':x,'old':o[x]['modelLifecycle'],'new':n[x]['modelLifecycle']} for x in n if x in o and o[x]['modelLifecycle'].get('status')!=n[x]['modelLifecycle'].get('status')],
       'ip_added':[ni[x] for x in ni if x not in oi] if r in ob else len(ni),'ip_removed':[x for x in oi if x not in ni],
       'legacy_or_eol':[{'id':x,'lc':n[x]['modelLifecycle']} for x in n if n[x]['modelLifecycle'].get('status')!='ACTIVE']}
out['bedrock']=bd
json.dump(out,open(N+'diff-2026-10-05.json','w'),indent=1,default=str)
print(json.dumps({'foundry':{k:len(v) for k,v in cat.items()},'arm':{l:{k:len(v) for k,v in a.items()} for l,a in arm.items()},'prices':out['prices'],
 'bedrock':{r:{k:(len(v) if isinstance(v,list) else v) for k,v in b.items()} for r,b in bd.items()}},indent=0))
