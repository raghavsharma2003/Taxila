# Creates (or reports) the hi-IN custom vocabulary "taxila-scout-hi" in ap-south-1 from the D4 keyword list
# (16 lesson terms + 6 decoys), so arm T5 gets the same lexical help D4 got. Usage: python3 vocab.py create|status|delete
import awsenv, boto3, json, sys, os
t = boto3.client('transcribe', region_name='ap-south-1'); NAME = 'taxila-scout-hi'
terms = json.load(open(os.path.join(os.path.dirname(__file__), 'results/vocab-terms.json')))
cmd = sys.argv[1]
if cmd == 'create':
    phrases = [x.replace(' ', '-') for x in terms]  # multi-word phrases are hyphenated in Phrases lists
    try: t.create_vocabulary(VocabularyName=NAME, LanguageCode='hi-IN', Phrases=phrases); print('created', len(phrases))
    except Exception as e: print('ERR', str(e)[:300])
elif cmd == 'delete': t.delete_vocabulary(VocabularyName=NAME); print('deleted')
r = t.get_vocabulary(VocabularyName=NAME) if cmd != 'delete' else {}
print({k: str(v) for k, v in r.items() if k in ('VocabularyState', 'FailureReason', 'LanguageCode')})
