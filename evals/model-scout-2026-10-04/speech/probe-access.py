import awsenv, boto3, json, botocore
out = {}
for reg in ['ap-south-1','us-east-1']:
    p = boto3.client('polly', region_name=reg)
    for eng in ['standard','neural','long-form','generative']:
        try:
            vs = p.describe_voices(Engine=eng, IncludeAdditionalLanguageCodes=True)['Voices']
            out[f'polly {reg} {eng}'] = [f"{v['Id']}:{v['LanguageCode']}+{','.join(v.get('AdditionalLanguageCodes',[]))}" for v in vs if 'IN' in v['LanguageCode'] or 'hi-IN' in v.get('AdditionalLanguageCodes',[])]
        except Exception as e: out[f'polly {reg} {eng}'] = 'ERR '+str(e)[:120]
    b = boto3.client('bedrock', region_name=reg)
    try:
        ms = b.list_foundation_models(byOutputModality='SPEECH')['modelSummaries']
        out[f'bedrock {reg} speech models'] = [m['modelId'] for m in ms]
    except Exception as e: out[f'bedrock {reg} speech'] = 'ERR '+str(e)[:160]
    br = boto3.client('bedrock-runtime', region_name=reg)
    for mid in ['amazon.nova-micro-v1:0','amazon.nova-2-lite-v1:0', 'apac.amazon.nova-micro-v1:0']:
        try:
            r = br.converse(modelId=mid, messages=[{'role':'user','content':[{'text':'hi'}]}], inferenceConfig={'maxTokens':5})
            out[f'converse {reg} {mid}'] = 'OK'
        except Exception as e: out[f'converse {reg} {mid}'] = 'ERR '+str(e)[:200]
print(json.dumps(out, indent=1))
