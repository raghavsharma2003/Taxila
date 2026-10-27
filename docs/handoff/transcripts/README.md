The main session's whole chat (2026-10-01 → 2026-10-27), keys redacted, split into parts under GitHub's 100 MB limit:

    cat main-session.jsonl.gz.part-* > main-session.jsonl.gz && gunzip main-session.jsonl.gz

It's one JSON object per line (Claude Code transcript format). Useful greps: user messages are `"type":"user"` lines
without tool results; the release history sits around the words "Ship release". Streams' transcripts, if they
exported them, are in this folder on their branches as `<stream>.jsonl.gz`.
