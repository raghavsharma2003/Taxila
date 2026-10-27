# Taxila: handoff to the next Claude Code session (2026-10-27)

This branch (`handoff/2026-10-27`) is the whole project as of 2026-10-27. Read this file first, then `CLAUDE.md`, then
`context/` (start with `context/rejected.md`). Nothing here repeats what `context/` already records in detail; this file
says where everything is, what state it is in, and how the owner wants work done from now on.

---

## 0. The owner's directives as of 2026-10-27 (these override anything older)

1. **Build the product first. Testing, safety and compliance come later.** The architecture, stack, product, UI/UX and
   backend are not final, so investing in safety batteries, compliance and large test runs now is wasted effort. The
   order is:
   1. Build the full product with every requirement and feature.
   2. Test it ourselves and keep iterating on internal feedback until it is a real, fully working product.
   3. Only when we are about to put it in front of real users do the security / safety / compliance pass.

   Existing safety code stays where it is (do not rip it out), but do not spend effort extending or measuring it.
   Unit tests and the build gates (`tsc`, `vite build`, `npm test`) still run on code changes. Large sim-lab and QA
   batteries are not the default.
2. **Azure usage: sensible, not a hard rule.** Keep Azure usage from being unnecessarily high. If something needs high
   usage (big batteries, bulk generation, many model calls), ask the owner first. This is guidance, not a ban: the
   product build comes first.
3. **Judges and evaluation use Claude, not Foundry models.** Anything that was judged by Kimi / GPT / Grok on Azure
   (the sim lab's two judges, rubric scoring, blind judges) should be done by the Claude Code session itself, from
   its own usage, instead of paying Azure tokens.
4. Still in force from before: Azure for the product's own compute and AI (Container Apps, Foundry models "sold Direct
   from Azure", Storage, ACR); Neon Postgres allowed; never commit secrets; the main loop decides autonomously within
   these directives and logs to `context/`.

The cost incident behind (2) and (3) is in §6.

---

## 1. Where things are

| What | Where |
|---|---|
| Code, context, research, evals | GitHub `raghavsharma2003/Taxila`, this branch |
| Live production | Azure Container Apps `taxila-web` (eastus2), revision `taxila-web--sac4e8e8-3x6d` = **14.4.2 (commit ac4e8e88, branch int/r5-rel1441)**. Previous `taxila-web--sf74d1aa-tdd6` (14.4.1) kept for rollback. URL in `TAXILA_URL`. |
| Next release in progress | **14.4.3** = this branch's code (`d770a1f6` + handoff docs). Gate not yet passed on it; not deployed. |
| Production DB | Neon (us-east-1), `DATABASE_URL`. Test branch: `TEST_DATABASE_URL` / `CONDUCTOR_TEST_DATABASE_URL`. |
| Secrets | **Not in git.** See §4 and `docs/handoff/ENV-KEYS.md`. |
| This session's chat transcript | `docs/handoff/transcripts/main-session.jsonl.gz.part-*`: join with `cat main-session.jsonl.gz.part-* > main-session.jsonl.gz` (keys redacted). |
| This session's notes, scripts, logs | `docs/handoff/scratchpad-main-top.tar.gz` (top-level scratchpad text files, keys redacted) |
| Everything else (all sub-agent transcripts, 1.8 GB; full scratchpad incl. datasets, audio, screenshots, 5.6 GB) | Azure Storage account `$AZURE_STORAGE_ACCOUNT`, container **`handoff-2026-10-27`**, blobs `main-session-transcripts-all.tar.gz` and `main-session-scratchpad-full.tar.gz` (text files redacted). See `docs/handoff/STORAGE.md`. |
| Parallel streams' handoff notes | `docs/handoff/<stream>.md` on each stream's branch (see §3); merge them in when they land |

---

## 2. Product state (what exists)

Taxila is an AI tutor for Indian classes 1–9 (CBSE/NCERT, RBSE): a Hindi-English voice teacher driven by a server-side
**Director** (`server/director/`), a reply brain (`server/brain/`), one compiler for every lane (`server/compiler/`),
a learner model and covert comprehension engine (`server/comprehension/`), the **Forge** content factory and
**Studio**/whiteboard (`server/forge/`, `server/studio/`), the **Conductor** (day plan, parent reports), a React 19
client (`src/`) with the Kaksha "Volt" look, a 2D/3D teacher face (`src/avatar`, `src/face-puppet`), a parent corner,
and lanes: text, cascade (text reply + TTS) and realtime voice / duplex (`src/duplex`). Teaching kits for all
subjects of classes 1–9 are in `data/kits/`.

Release history and what each shipped: `context/measurements.md` (`ms-r*-live` entries) and git tags/branches
`int/r4-rel*`, `int/r5-rel*`. The last three:
- **14.4.1** end-record fixes (learner as subject, safeguarded records from facts only).
- **14.4.2 (live)** small-sadness and "safe, can I tell family" are care, not the helpline script; Bishnoi-style
  sacrifice idioms; claimed-mistake guard never strips safety copy.
- **14.4.3 (this branch, not deployed)**:
  - "helped" safeguard tier (no repeated numbers / "are you safe?" once help is in place), same-story restart,
    predicate episode keeps its kind (`ac84355e`);
  - end record never says "teach-back not passed" when none was asked (`28a323ec`);
  - 4A: stuck child is shown, not quizzed, and options are buttons on the text lane (`81863c94`);
  - stream 2: a late board her line has left is never shown (`589569e8`);
  - p13 SACRIFICE_FOR (`814663d0`).

  Gate (`node scripts/deploy-azure.mjs --gate --dry-run`) was started on d3ebc66f and stopped when stream 2 landed;
  re-run it on this branch's head before deploying.

Known open product work (from `context/` "open-*" nodes and the task list):
- the understanding phase (`open-r1441-teaching-question-unread`);
- the kit pipeline for 4A's 293 English-only items (`docs/research/census/2026-10-21-kits-english-only-forms.json`);
- QA's ac4e8e88 findings:
  - worked example uses invented sides instead of the kit's;
  - "160 dobara check" casts doubt on a right number;
  - question-form "160?" isn't credited;
  - "Geometry button" names a label that doesn't exist;
  - drawAsked "in words" vs VISUAL_DRAWING pointing (stream 2's question);
- task-list items still open: CONVERSATION-V2 into the server, BR2b lanes, W2-H Studio in the lesson, Conductor gaps,
  the 3D teacher rig, Forge visual-QA gate, owner-1 grading truth.

Deferred by directive (do NOT work on these until the product is complete; then revisit):
- QA's P0: the parent export shows class ≤4 conversation verbatim, including a disclosure, in
  `server/routes/parent.js exportAll`. QA's suggested fix is in its message, summarised in the transcript.
- The rest of the safety backlog and compliance (DPDP etc.).

---

## 3. People / sessions (the old setup)

The main loop (this session) integrated work from parallel Claude Code cloud sessions. Each was told on 2026-10-27 to
push all unpushed work and a `docs/handoff/<name>.md` to its branch, and is idle:

| Stream | Branch | Owned |
|---|---|---|
| 4A (conversation / understanding / kits) | `claude/r4-conversation` | Director + reply brain behaviour, kits |
| 4B (duplex / voice) | `claude/r4-duplex` | realtime voice, barge-in, D5, FDB data |
| stream 2 (content / board / Studio) | `claude/r4-content` | whiteboard, Studio, Forge-in-lesson |
| stream 3 (latency) | `claude/r4-latency` | latency, overflow, regions |
| QA (break-it) | `claude/r5-qa` | real-lesson QA on TEST |
| sim lab | `claude/r5-simlab` | simulated children + judges (`evals/simlab/`); results in `evals/simlab/results/` |
| others | `claude/r4-asha`, `claude/r4-asha-rig2`, `claude/r4-games-core`, `claude/r4-khand`, `claude/r4-app-design` | teacher face/rig, games, design |

The new session can either re-create streams or work single-threaded; the owner decides.

---

## 4. Credentials

All 83 keys the project uses live in one gitignored file, `.env.local`, at the repo root. Names and what each is for:
`docs/handoff/ENV-KEYS.md`. The owner pastes the values into the new cloud environment's settings (environment
variables); then `node scripts/handoff/write-env-local.mjs` writes `.env.local` from them. Load env only with
`node --env-file=.env.local ...` (never `source` it). Production secrets also live in the Container App's secret
store (set by `scripts/deploy-azure.mjs`).

Connectors the old session had (set up again in the new account): GitHub, Neon (MCP), Vercel (MCP, the paused
`taxila` project), Claude Docs. Azure is driven with the service principal (`AZURE_SP_*`) over REST; there is no `az`
CLI in the container.

---

## 5. How to work in this repo (practical)

- Gates before any code commit: `npx tsc -b && npx vite build && npm test`. The old session's side worktree was a
  sparse checkout without `public/assets/teacher/`. There, 6 asset tests and 4 tray/RCA browser tests failed. Those
  are environment failures; re-check them in a full checkout. The full integration tree passed the gate for 14.4.2.
- Deploy:
  - `git push` first (ACR builds from GitHub);
  - then `NODE_USE_ENV_PROXY=1 node --env-file=.env.local scripts/deploy-azure.mjs`;
  - it requires HEAD == origin tip of the branch and a gate stamp from
    `scripts/deploy-azure.mjs --gate --dry-run` (~30 min);
  - rollback: `--rollback`.
- One branch, one worktree (two worktrees on one branch corrupted a gate once: `rj-r1441-shared-branch-worktrees`).
- Context logging: drop entries in `context/inbox/*.json` (`{nodes, edges, md:{decisions, measurements, rejected}}`;
  kinds `decision|measurement|rejection`; edge rels `measured_by, caused_by, inherits, supersedes, blocks, part_of,
  constrains`), then `node scripts/merge-inbox.mjs` and `node scripts/context.mjs --check`.
- Model-only harnesses run with `DATABASE_URL=` empty (never against prod). Replay harnesses this session used:
  `relreplay.mjs`, `p08replay.mjs`, `linereplay.mjs`, `endfacts-ab.mjs` (in the scratchpad archive).
- Outbound HTTPS goes through the container's proxy; Node needs `NODE_USE_ENV_PROXY=1`.

---

## 6. Azure money (what happened, what's set up)

- Grant: Microsoft for Startups **Startup Sponsorship $5,000**, valid 2026-07-08 → 2027-04-04. Used ≈ **$2,797
  (₹2,68,400)** by 2026-10-24, ≈ $2,200 left (exact balance: microsoftazuresponsorships.com).
- **Spending limit: "LimitRemoved"**, so charges go to the payment method once the credit is gone. The owner was
  given the portal steps to turn it back on (Cost Management + Billing → subscription → "turn the spending limit back
  on"); check whether that happened.
- Budgets created 2026-10-24 (email the subscription Owner): `credit-guard-total` ₹4,80,000 from 2026-07-01
  (70/85/95% + forecast), `credit-guard-monthly` ₹30,000 (50/80/100% + forecast).
- Where the money went (October ₹2.46L):
  - ~89% was pay-per-token AI on burst days of our own testing: sim-lab batteries (≈₹300 per simulated lesson,
    ~200 lessons on 14–15 Oct), QA runs, model bake-offs, voice tests.
  - The biggest meters were the sim lab's Kimi K2.6 "thinking" judge (₹41k), the GPT models (~₹95k), neural HD TTS
    (₹24k) and gpt-4o-mini-tts (the sim lab's child voice, ₹15k).
  - Hence directive 3: judges run on Claude now.
- Fixed daily cost ≈ ₹1,500 across all projects. Taxila's share is ≈ ₹1,000:
  - `taxila-cin-pg` Postgres (Central India) ₹602/day. It is **unused**: the India move decided 2026-10-04
    (`dc-*india*`) never cut over, and production is still Neon.
  - `taxila-web` ₹150, `studio-qa` ₹75, `taxila-sin-staging` ₹38, `taxila-worker` ₹38, a load balancer + IP ₹70.

  Owner: do not delete resource groups; other projects (`vp-research-rg`, `vyakti-voice`) share the subscription.
- $25k grant (Milestone 3, current Founders Hub rules): **5+ distinct Azure services, each ≥ $1 spend, ~60 continuous
  days**; automatic.
  - As of 2026-10-24 only Container Apps and PostgreSQL hold ≥ $1/day every day.
  - A plan was proposed, owner decision pending:
    - downsize `taxila-cin-pg` to Burstable (still counts, cheaper);
    - a small capped daily job using Foundry Models + Foundry Tools (speech);
    - upgrade `taxilacr` to Premium;
    - the vp-research VM as a buffer.
  - Ask the owner before doing any of it.

Scripts used for this analysis (read-only, Cost Management REST): `cost.mjs`, `daily.mjs`, `monthly.mjs`,
`svcdaily.mjs`, `deps.mjs`, `bill*.mjs`, `budget.mjs` in the scratchpad archive.

---

## 7. First steps for the new session

See `docs/handoff/STARTUP-PROMPT.md`.
