# SCOUT 2026-10-05 copy of evals/model-refresh-2026-10-04/scout/bedrock-list.py.
# SCOUT: loads AWS_* via evals/model-scout-2026-10-04/speech/awsenv.py logic (the original exec'd a cwd awsenv.py);
# SCOUT: adds us-west-2 (images, per procedure); SCOUT: output results/bedrock-list-2026-10-05.json.
import os, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
for line in open(os.path.join(ROOT, '.env.local')):
    line = line.strip()
    if line.startswith('AWS_') and '=' in line:
        k, v = line.split('=', 1); os.environ[k] = v.strip().strip('"').strip("'")
os.environ['AWS_CA_BUNDLE'] = '/root/.ccr/ca-bundle.crt'
import boto3
boto3.client('sts').get_caller_identity()
out={}
for r in ['ap-south-1','us-east-1','us-west-2']:
    b=boto3.client('bedrock',region_name=r)
    fm=b.list_foundation_models()['modelSummaries']
    ips=[]; tok=None
    while True:
        kw={'maxResults':100}
        if tok: kw['nextToken']=tok
        x=b.list_inference_profiles(**kw); ips+=x['inferenceProfileSummaries']; tok=x.get('nextToken')
        if not tok: break
    out[r]={'fm':[{k:m.get(k) for k in ['modelId','providerName','modelName','inputModalities','outputModalities','inferenceTypesSupported','modelLifecycle','responseStreamingSupported']} for m in fm],
            'ip':[{'id':p['inferenceProfileId'],'name':p['inferenceProfileName'],'type':p['type'],'models':[m['modelArn'].split('/')[-1]+'@'+m['modelArn'].split(':')[3] for m in p['models']]} for p in ips]}
    print(r,len(fm),len(ips))
json.dump(out,open(os.path.join(os.path.dirname(__file__),'..','results','bedrock-list-2026-10-05.json'),'w'),default=str)
