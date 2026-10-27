# Handoff archives in Azure Storage

Container `handoff-2026-10-27` in the storage account `$AZURE_STORAGE_ACCOUNT` (the project's own account). Cost is a few rupees a month.

| Blob | What | Notes |
|---|---|---|
| `main-session-transcripts-all.tar.gz` | The main session's full transcript plus every sub-agent / workflow transcript (1,014 jsonl files, ~1.8 GB raw) and saved tool outputs | Text redacted: every secret value from `.env.local` is replaced by `[REDACTED:KEY_NAME]`, and DB passwords, AccountKeys, JWTs and bearer tokens are masked too |
| `main-session-scratchpad-full.tar.gz` | The main session's whole scratchpad (~5.6 GB): harness scripts, notes, gate/deploy logs, replay outputs, QA dumps, screenshots, voice and face assets, public speech datasets (AMI, FDB), copied PDFs | `node_modules` excluded. Text files are redacted the same way; binaries are as-is |

The smaller, most useful subset is in git: `docs/handoff/transcripts/` (the main chat) and `docs/handoff/scratchpad-main-top.tar.gz`.

Download: `python3 scripts/handoff/fetch-archive.py <blob> <out-path>` (needs `.env.local`). Then `tar -xzf <out-path>`.
`scripts/handoff/redact.py` and `scripts/handoff/blob.py` are the scripts that built and uploaded these archives.
