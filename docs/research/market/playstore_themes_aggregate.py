import json,sys,re,collections
from google_play_scraper import reviews, Sort
ids=['com.byjus.thelearningapp','com.byjus.thelearningapp.premium','com.vedantu.app','com.curiousjr','com.Extramarks.Smartstudy','com.cuelearn.cuemathapp','com.infinitylearn.learn','com.seekhojunior.android','com.leadschool.parentapp','com.unacademyapp','com.embibe.student','com.soniqmantra.kutuki','digital.allen.study','xyz.penpencil.physicswala','com.vidyakul','com.filo.student','com.yolearn.student','com.aakash.myaakashapp','com.seekho.android','org.khanacademy.android']
themes={
 'refund/money/fraud':r'refund|money back|paisa|paise|fraud|scam|cheat|waste of money|loot',
 'sales calls/counsellor/mis-selling':r'\bcall(s|ing|ed)?\b|sales|counsell?or|spam|pressur|promis|misguid|missell|mis-sell',
 'loan/EMI/autopay':r'\bemi\b|loan|finance|nbfc|autopay|auto pay|auto-debit|deduct|kat (gaya|rahe|liya)|kat lyty|kaat',
 'price':r'expensive|costly|price|mehenga|mahanga|afford',
 'paywall':r'subscri|premium|paid|purchase|pay for|asking (for )?money|ask(s|ing)? money|free',
 'bugs/login/OTP':r'crash|bug|login|log in|otp|not (open|work|load)|error|lag|hang|slow|glitch|blank screen',
 'teacher/class quality':r'teacher|faculty|sir\b|mam\b|ma\'am|mentor|tutor|teaching|explain',
 'class not held/schedule':r'no class|class(es)? (not|didn)|cancel|schedule|timing|not conducted|no one (is )?teach',
 'support unresponsive':r'support|customer care|no response|not respond|helpline|no one (pick|receiv|answer|respond)|email',
 'language':r'hindi|language|english medium|regional|marathi|tamil|telugu',
 'AI':r'\bai\b|chatgpt|artificial',
}
parent=r'my (son|daughter|child|kid|ward|baby)|\bbeta\b|beti|bachch?[ae]|bacche|मेरे बच्चे|meri beti|mera beta|as a parent|i am a parent|i\'m a parent|parents?\b'
agg=collections.Counter(); aggp=collections.Counter(); nlow=0; npar=0; per={}
for i in ids:
    rs,_=reviews(i,lang='en',country='in',sort=Sort.NEWEST,count=400)
    low=[r for r in rs if r['score']<=2]
    pl=[r for r in low if re.search(parent,(r['content'] or '').lower())]
    allp=[r for r in rs if re.search(parent,(r['content'] or '').lower())]
    nlow+=len(low); npar+=len(pl)
    for r in low:
        t=(r['content'] or '').lower()
        for k,p in themes.items():
            if re.search(p,t): agg[k]+=1
    for r in pl:
        t=(r['content'] or '').lower()
        for k,p in themes.items():
            if re.search(p,t): aggp[k]+=1
    per[i]={'n':len(rs),'low':len(low),'parent_all':len(allp),'parent_low':len(pl),'parent_mean':round(sum(r['score'] for r in allp)/len(allp),2) if allp else None}
    print(i,per[i])
print('TOTAL low',nlow,'parent-authored low',npar)
print('ALL-LOW themes:',[(k,v,round(100*v/nlow)) for k,v in agg.most_common()])
print('PARENT-LOW themes:',[(k,v,round(100*v/max(npar,1))) for k,v in aggp.most_common()])
