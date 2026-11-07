# Startup prompt for the new Claude Code session

The owner pastes the block below as the first message of the new session (after adding the repo + this branch and
putting the keys in the environment settings).

---

```
You are taking over Taxila, an AI tutor for Indian students in classes 1-9. A previous Claude Code session built it
for a month and handed off on 2026-10-27. Everything is in the GitHub repo raghavsharma2003/Taxila, branch
handoff/2026-10-27.

1. Setup:
   - Check out handoff/2026-10-27.
   - Run `node scripts/handoff/write-env-local.mjs`. It writes .env.local from the environment variables I added
     and tells you which keys are missing. Never print a value, never commit .env.local, and load it only with
     `node --env-file=.env.local`.
   - Run `npm ci`.
2. Read, in this order: HANDOFF.md (the whole of it), CLAUDE.md, context/rejected.md, then skim context/decisions.md
   and context/architecture.md. Use `node scripts/context.mjs` to query the decision graph.
3. Merge in the parallel streams' last work if their branches have new commits since the handoff:
   claude/r4-conversation, claude/r4-content, claude/r4-duplex, claude/r4-latency, claude/r5-qa, claude/r5-simlab.
   Each has docs/handoff/<stream>.md describing its state.
4. The old chat is in docs/handoff/transcripts (keys redacted). Search it when you need the history behind a
   decision. Bigger archives are in Azure Storage (docs/handoff/STORAGE.md). Download them only if needed.
5. How I want you to work now:
   - Build the full product first: every feature and requirement. Then we test it ourselves and iterate on our own
     feedback until it is a real, fully working product. Safety, security and compliance come only when we're ready
     for real users. Don't spend effort on safety or compliance work or big test batteries now.
   - Keep Azure usage sensible. Ask me before anything that needs heavy usage.
   - For any judging or evaluation, use your own reasoning (Claude), not Foundry models on Azure.
   - Keep logging decisions and measurements to context/ as the repo describes.
6. Don't start building yet. First give me a short summary of where the product stands: what works end to end,
   what's half-built, and what's missing against the product vision. Then propose a build plan, and we'll discuss
   it before you begin.
```

---

Before pasting, the owner also:
- adds the GitHub repo `raghavsharma2003/Taxila` to the new session / environment, with branch `handoff/2026-10-27`;
- adds the 83 keys as environment variables (the values are in the secrets file the old session handed over
  privately, not in git; names in `docs/handoff/ENV-KEYS.md`);
- reconnects the connectors if wanted: Neon (MCP) and Vercel (MCP);
- network: the environment needs outbound access to `*.azure.com`, `*.microsoft.com`, `*.windows.net`,
  `*.neon.tech`, `github.com`, `registry.npmjs.org`.
