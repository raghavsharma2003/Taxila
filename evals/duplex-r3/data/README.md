# TaxilaFDB replay streams (JSON only)

`taxilafdb-streams-json.tar.gz` (4.5 MB): the 2,240 per-stream JSON files (`streams/*.json`: meta, 20 ms frame
features, recorded STT events) plus `child-profiles.json` of the SIMULATED TaxilaFDB set (`taxilafdb-mix/2026-10-04`:
child-like Azure TTS voices mixed clean/noisy; not children, not real speech). It is what `evals/duplex-r3/fdb.mjs` and
`evals/p1-duplex/fdb.mjs` replay; the raw `.s16` audio (773 MB) is not needed for replay and is not committed.

```
mkdir -p /tmp/taxilafdb && tar -xzf evals/duplex-r3/data/taxilafdb-streams-json.tar.gz -C /tmp/taxilafdb
TAXILA_FDB_STREAMS=/tmp/taxilafdb/streams node evals/duplex-r3/fdb.mjs --split dev --arms stage-a --lanes D4,FAST,MAI_HOME --name dev-base
```

The real recorded adult-speech STT events (AMI, eot-bench Hindi; CC BY 4.0, evaluation only) are already committed
under `evals/duplex-real/results/*.json.gz`.
