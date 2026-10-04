exec(open('awsenv.py').read())
import json
print(boto3.client('sts').get_caller_identity()['Account'])
out={}
for r in ['ap-south-1','us-east-1']:
    b=boto3.client('bedrock',region_name=r)
    fm=b.list_foundation_models()['modelSummaries']
    ips=[]; tok=None
    while True:
        kw={'maxResults':100}; 
        if tok: kw['nextToken']=tok
        x=b.list_inference_profiles(**kw); ips+=x['inferenceProfileSummaries']; tok=x.get('nextToken')
        if not tok: break
    out[r]={'fm':[{k:m.get(k) for k in ['modelId','providerName','modelName','inputModalities','outputModalities','inferenceTypesSupported','modelLifecycle','responseStreamingSupported']} for m in fm],
            'ip':[{'id':p['inferenceProfileId'],'name':p['inferenceProfileName'],'type':p['type'],'models':[m['modelArn'].split('/')[-1]+'@'+m['modelArn'].split(':')[3] for m in p['models']]} for p in ips]}
    print(r,len(fm),len(ips))
json.dump(out,open('bedrock-list.json','w'),default=str)
