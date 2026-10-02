# Harvest: command-centre (raghavsharma2003/command_centre, all 21 branches)

Segment id: `command-centre`. Harvested 2026-10-02. I read everything with `git show`, `git ls-tree`, `git log` and `git diff` against refs. Nothing was checked out, committed or pushed in the source repo.

| | |
|---|---|
| Source repo | `/home/user/command_centre`. Shallow clone, 137 commits reachable on main. The mobile, team-chat and codex branches share **no merge base** with main in this clone, so I compared them tree to tree. |
| `@M` | `origin/main` = `c8fd321` (2026-09-03, "docs: session log 2026-09-02/03 ... fabricated-persona trap") |
| `@R` | `claude/context-project-review-0x0i6g` = `d288e75` (2026-07-24). Security hardening sweep, 136/136 tests, project review and growth-insights docs. **Not merged to main.** |
| `@N` | `data-hunt/SE-2026-07-31` = `a23a00e`. Lane N agent-harvest report and its method. |
| `@MOB` | `claude/mobile-apps-ios-android-4r54ys` = `f93fba2`, and `fix/team-chat-reaction-mobile` = `9d9b7a5`. Their content is already in `@M`, which has moved on from them. |
| `@MCP` | `claude/supabase-mcp-permissions-v1px7r` = `c90226c` |
| `@SMTP` | `claude/email-replies-smtp-2wpifv` = `c3e7029` |
| `@KNL` | `claude/knl-deal-negotiation-tr6zdw` = `1990b4a` (2026-10-02). GST invoice template and renderer. |
| `@PRE` | `claude/carbonsettle-precursor-emissions-5miavb` = `20f8ede` |
| `@STRAT` | `claude/carbonsettle-business-strategy-tcflss` = `91c0f8a` |
| Branches with 0 unique commits | cargo-center-demo, client-proposal-writeup, data-hunt-lane-a, startup-context-handoff, tarasha-partners, data-hunt/A, fix/reports-summary-test-mock |
| Secrets | **Nothing was printed or copied.** The code reads `.env.local`, but that file is not tracked on any ref I listed. Three items need flagging: (1) **A secret is present in a commit message.** `dc83eb3` (on the `@MOB` branch) states a shared default team passcode in plain text. Treat it as burned. (2) `docs/world-class-roadmap.md@M` says "Leaked Supabase keys in git history (known)". I did not hunt for them. (3) `.mcp.json@MCP` holds only a Supabase project_ref, which is not a secret. `scripts/send-via-prod.mjs@SMTP` embeds client names and reply UUIDs. That is PII, not a credential. |

---

## 0. TL;DR for Taxila

**What this repo is.** CarbonSettle's "Command Centre" (CC) is a Next.js 16, Supabase and Vercel CRM with a cold-email engine. Around it sit an inbox with AI intent classification, a WhatsApp Business channel, personalised public offer pages (`/p/<signed-token>`) with React-PDF briefs, first-party analytics, team chat with Web Push, and a Capacitor Android/iOS shell that loads the live URL. The owner calls it "the central nervous system" (`supabase/migrations/20260623_team_messaging.sql@M`).

**What "company brain" actually is here.** There is **no RAG or knowledge-graph code in the product.** The "Ask the Command Centre" panel on `/investor` is canned Q&A. The real company brain is a **process artefact**, made of four parts:
- `docs/AGENT-CONTEXT.md`, the master orientation, with sections for goal, founder rules, architecture, current state and context system.
- `docs/SESSION-LOG.md`, an 882-line journal written newest first. Every entry follows the fields Did, Why, Commits, Founder preferences, State, Open.
- `docs/SESSION-LOG-PROTOCOL.md`, which says what to do at start, during and end of a session.
- A Claude-Code auto-memory graph that is not in git: one fact per file, typed `user|feedback|project|reference`, linked with `[[wikilinks]]`.

`CLAUDE.md` and `AGENTS.md` mirror each other, so non-Claude tools (Codex, Cursor) also orient themselves. Taxila's `context/` graph already supersedes this. The parts worth keeping are the **session-log protocol and its "feedback memory with the WHY" rule**, and a large set of measured rejections.

**The single most important finding for Taxila: most measured "engagement" was machines.** Mail-security sandboxes (Outlook SafeLinks and similar) open every link in an email. They inflated offer-page analytics about 3x: 205 page views were really about 67, and 149 brief reads were really about 26. The founder celebrated six phantom leads for days. `lib/engagement-classifier.ts@M` now holds a written rule for what counts as HUMAN, and every session gets a verdict with reasons. **Any Taxila parent-report link, email open or "parent viewed the report" metric will be inflated the same way.** The same heartbeat-cadence method can also be used to judge whether a *child* is really attending to a generated module (§3.4).

**Top takes, ranked:**

| # | Take | From | Taxila use |
|---|---|---|---|
| 1 | HUMAN-vs-MACHINE session classifier. Its rule: session ≥45s, ≥2 heartbeats, >8s per heartbeat, first event >10 min after send. | `lib/engagement-classifier.ts@M` | Telemetry for parent links; attention verdicts on modules |
| 2 | Behavioural tracker. It records scroll milestones, per-section dwell via IntersectionObserver, visible-only active time, a 15s heartbeat, delegated clicks, and batches everything with `sendBeacon` | `components/proposal/proposal-analytics.tsx@M` | Covert engagement signals from Forge modules |
| 3 | Agent-lane fan-out with **central gating**. The rule is "nothing an agent wrote was trusted". An adversarial 10% audit escalates to a 100% census when defects exceed 20%. | `docs/data-hunt/SPEC.md@M`, `docs/data-hunt/out/N-2026-07-31-REPORT.md@N` | Forge, teaching-kit factory, research fleets |
| 4 | Heuristic-first intent classifier. A high-precision keyword path runs first, then an LLM with a forced tool schema, then a best-effort heuristic that never returns null. The model and confidence are persisted. | `lib/cold-email/reply-classifier.ts@M` | Classifying child utterances and parent messages; safety pre-filter |
| 5 | Generic DB audit trigger. It writes the full old and new row as jsonb, the changed fields, and the `app.actor` GUC, and skips changes that only touch updated_at. | `supabase/migrations/20260715_critical_tables_audit_trigger.sql@M` | Audit trail for the learner model, consent and Conductor |
| 6 | Atomic lease claim. A conditional UPDATE pushes `next_send_at` forward; only one worker wins. | `lib/cold-email/sequence-engine.ts@M` ~L397 | Job queues for Conductor and Forge |
| 7 | Web Push with zero third parties (VAPID, a service worker, a PWA manifest), plus a polling toast with vibration | `lib/messaging/push.ts`, `public/sw.js`, `app/manifest.ts`, `components/layout/{push-toggle,live-alerts}.tsx@M` | Parent notifications without Firebase |
| 8 | Signed links whose verification survives a secret rotation | `lib/cold-email/proposal-link.ts@R` | Parent report, consent and magic links |
| 9 | Durable write-ahead by email. If the DB write fails, the record is emailed from two paths. | `app/api/website-lead/route.ts@M` | Safeguarding hand-off must survive a DB outage |
| 10 | Env checker. It fingerprints each secret value (sha256[:8]) and reports placeholder and min-length problems. | `lib/required-env.ts@M` | Checking Azure Container Apps secrets |
| 11 | Edge-safe HMAC app-gate cookie and a signed `v1:user:sig` identity cookie, with the signing secret kept separate from the password | `lib/app-auth.ts@M`, `lib/messaging/session.ts@R` | Auth layers, parent/admin gate |
| 12 | Team-chat schema. It has DMs deduped by a sorted `dm_key`, channels pinned to a CRM entity, read-state unread counts, and reactions. | `supabase/migrations/20260623_team_messaging.sql@M` | Parent↔teacher channel pinned to a child or lesson |

---

## 1. What this is

- **Product:** a B2B CRM and outbound engine for a CBAM (EU carbon border tax) compliance firm that sells to Indian metal exporters and EU importers. Two founders (Raghav, Aryan). Production runs at `commandcentre-six.vercel.app`, and public offer pages live on `pdf.carbonsettle.com`.
- **Stack** (`package.json@M`): Next 16.1.6 (App Router, `proxy.ts` replaces middleware), React 19.2, Tailwind 4, Radix, zustand, recharts, sonner, `@react-pdf/renderer`, `imapflow` and `mailparser` (an IMAP poller), nodemailer, `web-push`, `@anthropic-ai/sdk`, papaparse, xlsx, vitest and playwright-core. Supabase Postgres in Tokyo, Vercel region hnd1, and 14 Vercel crons (`vercel.json@M`).
- **AI layer** (`lib/ai.ts@M`): plain fetch to OpenRouter, defaulting to free `google/gemma-4-26b-a4b-it:free`, with gemini-2.5-flash(-lite) and gpt-4o-mini as fallbacks. It falls back to OpenAI direct. The reply classifier and translator prefer Claude Haiku when a key is present. **None of this is usable by Taxila under the Azure-only directive.** The *patterns* port; the providers do not.
- **Scale:** 853 tracked files. `app/api` has about 150 routes and `lib/cold-email` has 47 modules. `scripts/` holds 103 files: about 8 reusable engines plus one-shot jobs. `docs/` holds 87 files, a few living and the rest dated artefacts.
- **Mobile** (`mobile/@M`): a Capacitor 7 shell. `capacitor.config.ts` sets `server.url` to the live production URL, with no bundled web code. The README says it is for personal use only, not distributed through the stores. Push works through the installed PWA, not native FCM.
- **Team chat** (`app/team`, `lib/messaging/*`, `docs/team-messaging.md@M`): a passcode login (the first passcode a person enters is claimed as theirs), DMs and channels, file uploads to a public Supabase bucket, reactions, a contextual "Discuss with team" channel per campaign, polling (no Realtime), and Web Push.
- **Analytics:** a first-party `/collect` endpoint (`app/collect/route.ts`, `lib/site-analytics.ts@M`). It runs cookieless with a daily-rotating hash, classifies the traffic source, hashes the IP, and filters bot and datacenter AS orgs. A separate `/p/<token>/event` tracker records offer-page behaviour.
- **State of the business** (`docs/STATE-2026-08-24.md@M`): 916 cold emails to EU importers produced 2 verified humans, 0 conversations and 0 revenue. All warm demand came from Indian exporters. The CRM held 7,538 leads with exactly one in a commercial stage, and no price had ever been quoted. The engineering is far ahead of the go-to-market.

---

## 2. Reusable assets

Maturity uses `shipped-measured`, `shipped`, `prototype` or `spec-only`. Taxila use uses copy, adapt, idea or skip.

| id | path@ref | what | maturity | use | Taxila subsystem |
|---|---|---|---|---|---|
| cc-engagement-classifier | `lib/engagement-classifier.ts@M` | Groups events into sessions and attaches session-less events by time window. It then gives each session a HUMAN or MACHINE verdict with typed reasons: too short, too few heartbeats, heartbeats too fast, too soon after send, click before page_view, an IP shared across ≥3 unrelated leads, or no session recorded. Extra rules may only push a session towards MACHINE. | shipped-measured | adapt | telemetry/tracing; evals/gates |
| cc-proposal-tracker | `components/proposal/proposal-analytics.tsx@M` | Client tracker. It records session_start or return_visit, page_view once per session, scroll 25/50/75/100, per-`[data-section]` dwell (IntersectionObserver at 0.4), visible-only activeMs, a 15s heartbeat, delegated click classes, CustomEvent hooks such as `cs:calc`, and a session_end summary. Batches go out via sendBeacon or a keepalive fetch. A `cs_staff` flag excludes internal visits. | shipped | adapt | generative-ui/modules; telemetry; learning (covert engagement) |
| cc-site-collect | `app/collect/route.ts@M`, `lib/site-analytics.ts@M` | Public CORS beacon collector (text/plain Blob avoids a preflight). It runs cookieless with daily-rotating visitor and 30-minute session hashes (Plausible-style, no consent banner). It hashes the IP with a salt, classifies the source GA-style (paid, email, social, organic, referral, direct), drops bot user agents and datacenter or scanner AS orgs, and caches IP-to-org lookups. | shipped | adapt | growth/seo; telemetry |
| cc-reply-classifier | `lib/cold-email/reply-classifier.ts@M` | Three tiers. (1) A high-precision phrase heuristic for OOO, address migration, unsubscribe and auto-ack. (2) An LLM with a forced `tool_choice` schema (enum, confidence, reasoning ≤200 chars) and tie-break rules. (3) A best-effort heuristic that never returns null. It persists intent, model and confidence, and drives action sets such as SUPPRESS_AUTO_REPLY_INTENTS and REDIRECT_INTENTS. A cron batch picks up unclassified rows. | shipped-measured | adapt | emotional-lens/affect; safety-floor; relational-os |
| cc-ai-client | `lib/ai.ts@M` | A provider-agnostic fetch client. It maps each task (classify, draft, parse) to a chain of models, tries each once with an AbortController timeout, and advances on any non-OK response. A lenient JSON parser tries the raw text, then text with code fences stripped, then the outermost `{...}`. `aiModelFor()` supports an audit trail, and every call returns null instead of throwing. | shipped | adapt | prompt-compiler; infra/azure |
| cc-ai-draft-studio | `lib/cold-email/ai-draft.ts@M` | Grounded 1:1 drafting from a context block (thread, profile, engagement, notes) plus conversational refinement. Each refine passes `currentDraft`, the new `instruction` and the `priorInstructions` to keep. Temperature is 0.35 for a draft and 0.5 for a refine. | shipped | adapt | relational-os (parent comms); prompt-compiler |
| cc-reply-translator | `lib/cold-email/reply-translator.ts@M` | Fail-open translation into English at ingest. It strips quoted text with Gmail and Outlook markers in many languages, converts HTML to text, and stores a `translation_lang` / `translated_en` / `translated_at` contract (with 'en' meaning "checked"). | shipped | adapt | relational-os (Hindi/regional parent messages) |
| cc-webpush | `lib/messaging/push.ts@M`, `public/sw.js@M`, `components/layout/push-toggle.tsx@M`, `app/api/push/subscribe@M` | VAPID Web Push with no Firebase or APNs. The keypair is generated on first use, and dead subscriptions (404/410) are pruned. `sendPushToUser` and `notifyFounders` never throw. The service worker uses tag and renotify, and its notificationclick focuses or navigates an open window. The opt-in button needs a user gesture. | shipped | adapt | android/capacitor; design-system/ux (parent notifications) |
| cc-live-alerts | `components/layout/live-alerts.tsx@M` | An in-app watcher that polls every 12s, only while visible. The first sync seeds the "seen" timestamps and does not fire. It skips its own messages and backlog for new channels, and fires a toast plus `navigator.vibrate(180)`, which works in the Android WebView. | shipped | idea | design-system/ux; android |
| cc-notif-feed | `app/api/notifications/route.ts@M` | A notification feed built from several sources (replies needing a human, uncontacted website leads, team messages). Each item has kind, title, detail, at and href, and each source is guarded on its own. A client-side "last seen" watermark drives the badge. | shipped | adapt | parent dashboard; design-system/ux |
| cc-team-chat-schema | `supabase/migrations/20260623_team_messaging.sql@M`, `lib/messaging/server.ts@M` | `app_users`, `chat_channels` (kind dm or channel, `dm_key` unique sorted "a|b", `entity_kind`/`entity_id` pin), members with `last_read_at` and `muted`, messages with attachment, `reply_to` and soft delete, reactions keyed on (message, user, emoji), a trigger that touches `last_message_at`, and an `isMissingTableError` setup state. | shipped | adapt | group-ai/multi-agent; relational-os (parent↔teacher/school channel) |
| cc-audit-trigger | `supabase/migrations/20260715_critical_tables_audit_trigger.sql@M`, `docs/audit-and-rollback.md@M`, `scripts/audit-rollback.mjs@M` | One SECURITY DEFINER trigger function with an empty search_path for any table keyed on `id`. It writes to `record_audit` (table, row_id as text, op, db_user, `app.actor` GUC, old_row/new_row jsonb, changed_fields), skips updated_at-only changes, and has RLS with no policy. The doc ships recovery and rollback SQL recipes. | shipped | copy | db-schema; auth/consent; memory-graph |
| cc-atomic-lease | `lib/cold-email/sequence-engine.ts@M` (~L397-419) | Claims a row before doing work, with `UPDATE ... SET next_send_at=now+10m WHERE id=? AND status IN (...) AND next_send_at<=now RETURNING id`. Zero rows means the claim was lost. A partial unique index is the DB-level backstop, and slots are released on bookkeeping failure. | shipped | copy | infra (Conductor/Forge job queue) |
| cc-cron-window | `app/api/cron/send-pending/route.ts@M`, `lib/cold-email/send-limits.ts@M` | Cron requires a Bearer CRON_SECRET (made constant-time in `@R`). It enforces a hard time-of-day window and weekend block in IST, a rolling hourly cap re-checked inside the loop (`@R`), and randomised small batches for a "humanised cadence". | shipped | adapt | Conductor quiet hours / cost caps |
| cc-secure-compare | `lib/secure-compare.ts@R` | A `timingSafeEqual` wrapper that returns false on a length mismatch or empty input | shipped | copy | auth/accounts |
| cc-app-gate | `proxy.ts@M`, `lib/app-auth.ts@M` (+`@R` signing-secret split) | Splits traffic by host. PDF-only hosts serve only public surfaces and return 404 for everything else. Other hosts need an Edge-safe (WebCrypto) HMAC cookie `exp.sig`, compared constant-time. A public-path allowlist keeps already-sent links alive, and a `?next=` redirect has an open-redirect guard. | shipped | adapt | auth/accounts; infra |
| cc-signed-session | `lib/messaging/session.ts@R` | Identity cookie in the form `v1:<user>:<hmac>`, split on the LAST colon. Unsigned or tampered cookies read as null, which means re-pick, not lockout. | shipped | adapt | auth/accounts |
| cc-signed-links | `lib/cold-email/proposal-link.ts@R` (+7 tests) | Token is `base64url(id.type.sig24)`, signed and not encrypted. A `VALID_TYPES` allowlist applies. A dedicated secret signs new tokens, and verification tries the new secret then the legacy one, so sent links survive a rotation. | shipped | copy | auth/consent (parent report/consent links) |
| cc-unsub-token | `lib/cold-email/unsubscribe-token.ts@R` (+199-line test) | RFC-8058 one-click unsubscribe. GET is a no-op so prefetch does nothing; POST carries the HMAC. **Lesson:** the payload `email.ts.sig` must be split from the RIGHT. | shipped-measured | adapt | auth/consent (DPDP withdrawal links) |
| cc-encryption | `lib/cold-email/encryption.ts@M` | AES-256-GCM with a key derived by scrypt from an env string. Wire format is `[12B IV][16B tag][ct]` in base64, and the code never logs plaintext. | shipped | copy | db-schema (field-level PII encryption) |
| cc-required-env | `lib/required-env.ts@M`, `app/api/admin/env-check@M`, `scripts/check-env.ts@M` | One spec list (url or secret, required, expect, minLen). It reports present, length, a sha256[:8] fingerprint so two environments can be compared without revealing values, placeholder detection, and the expected-URL value. | shipped | copy | infra/azure; evals/gates |
| cc-http-helpers | `lib/http.ts@M` | Client fetch that reads text first, parses JSON only when it is JSON, and maps 413/502/504/401/429 to human messages | shipped | copy | design-system/ux |
| cc-durable-rescue | `app/api/website-lead/route.ts@M`, `docs/system-audit-and-resilience-2026-07-08.md@M` | Retries the DB write, then checks success. On any failure path a `rescueLead()` guard emails the full record (SMTP is independent of the DB). A FK-violating write is retried without the FK. | shipped | adapt | safety-floor (safeguarding escalation durability) |
| cc-graceful-links | `app/p/[token]/*@M` (per `SESSION-LOG` 2026-07-06, commit `1a6a88f`) | A valid token whose record was deleted degrades to a working generic page. The rule "never hard-delete a record that has a sent link" is enforced by docs, and later by a review fix. | shipped | idea | parent report links |
| cc-react-pdf-variants | `lib/free-quarter/*`, `lib/importer-brief/*@M` | Per-recipient PDFs built with React-PDF: a shared `blocks.tsx` and `diagrams.tsx`, five visual variants (flagship, editorial, saas, infographic, exec) selected by `?v=`, and a data module. Learned: WinAnsi glyph limits (no →, ₂, ≈ or ✓). | shipped | adapt | parent reports (monthly PDF) |
| cc-html-to-pdf | `scripts/render-proposal-pdf.py@M` | Turns an artefact-style HTML doc into a print PDF with headless Chromium. It pins the light palette so OS dark mode can't leak in, sets `print-color-adjust:exact`, and keeps cards and tables whole across page breaks. One source of truth for HTML and PDF. | shipped | adapt | parent reports |
| cc-reply-digest | `lib/cold-email/reply-digest.ts@M`, cron `30 2 * * *` | A daily plain-text digest of the last 24h (replies by intent, bounces, paused mailboxes) sent to a human inbox | shipped | adapt | parent daily/weekly digest |
| cc-wa-optout | `lib/whatsapp/opt-out.ts@M` | Matches STOP/START only when the whole message is the keyword. **Requires a second STOP to confirm**, then stores a `wa_opt_outs` row keyed by normalised phone. Includes a bulk check. | shipped | skip (friction conflicts with DPDP: withdrawing consent must be as easy as giving it). Keep the keyword regex only. | auth/consent |
| cc-wa-agent | `lib/whatsapp/agent.ts@M` | Reuses the email classifier's heuristic on WhatsApp inbound and suggests a reply per intent for the operator to edit and send with one tap | prototype | idea | parent WhatsApp via Azure Communication Services |
| cc-wa-executor | `lib/whatsapp/executor.ts@R` | Campaign batch with an atomic lease (queued→sending), a daily cap enforced against today's IST sends, a scope gate, and a guard against junk names | shipped | idea | parent broadcast |
| cc-junk-name-guard | `lib/clean-company.ts@M` (used by `render.ts`, `template-engine.ts@R`, WA executor) | Never interpolates a scraped or untrusted name token; falls back to neutral text. This fixes the "Hi Visit Website" bug class. | shipped-measured | adapt | prompt-compiler / relational-os (child name and nickname rendering) |
| cc-mobile-shell | `mobile/capacitor.config.ts@M`, `mobile/android/*@M`, `mobile/ios/*@M` | A Capacitor 7 BridgeActivity shell. `server.url` points at production, with an `allowNavigation` allowlist and cleartext off. No rebuild is needed per deploy. | shipped | idea (remote-URL loading is fine for personal side-loading but risky for a Play-Store kids app and offline use; Taxila should bundle) | android/capacitor |
| cc-pwa-manifest | `app/manifest.ts@M` | Next MetadataRoute manifest (standalone display, theme colour, 512 icon). This is what unlocks iOS 16.4+ Web Push. | shipped | copy | android/capacitor; design-system |
| cc-mobile-nav | `components/layout/mobile-nav.tsx@M` | A bottom bar of 4 primary tabs plus a "More" sheet. `isItemActive` handles prefix collisions (`/cold-email` vs `/cold-email/inbox`, `/import` vs `/importers`). | shipped | adapt | design-system/ux (parent app) |
| cc-session-log-protocol | `docs/SESSION-LOG-PROTOCOL.md@M`, `docs/AGENT-CONTEXT.md@M`, `CLAUDE.md@M`, `AGENTS.md@M` | Start, during and end discipline. Founder preferences are captured immediately as `feedback` memories with the WHY. AGENTS.md is a mirror for tools that can't read Claude memory. The entry template is Did, Why, Commits, Prefs, State, Open. | shipped | adapt | company-brain/knowledge-ingestion (Taxila `context/` already richer) |
| cc-startup-handoff | `docs/startup-context-handoff-2026-08-10.md@M` | A single self-contained brief for an external agent or collaborator. It is compiled from the context docs and opens with "live system wins". | shipped | idea | company-brain |
| cc-data-hunt-spec | `docs/data-hunt/SPEC.md@M` | A spec for cloud agent harvest sessions: hard quality laws (the company's own site is truth; never guess; check the licence first), named lanes, a fixed output schema, a PR-only boundary (no DB writes, no sends, no paid spend), and a fan-out pattern with a QA sample. | shipped-measured | adapt | group-ai/multi-agent; Forge content factory |
| cc-lane-gating | `docs/data-hunt/out/N-2026-07-31-REPORT.md@N` | Method: about 30 harvest subagents, concurrency ≤15 because egress returns 429 above that, a `known-domains.txt` skip-list checked before any fetch (415 skips), and central `assemble.py` mechanical gating. A seeded, stratified 10% adversarial audit (auditors told "assume every row fabricated") found 23% defects, which escalated to a 100% census. Evidence must sit in rendered body text, not `<head>`. | shipped-measured | adapt | evals/gates; Forge; teaching kits |
| cc-verdict-cache | `domain_scope_verdicts` table (`AGENT-CONTEXT §3@M`), `scripts/scope-clean-rules.mjs@M` | "Classify once, reuse forever" per-domain verdict cache, with a deterministic rules classifier run before any LLM | shipped | idea (and see the rejection: the cache drifted from the source of truth) | Forge artefact cache |
| cc-archive-ingest | `app/api/cold-email/archive-ingest/route.ts@M` | Resumable IMAP history ingest. A per-(mailbox, folder) cursor is max(uid), and `full=1` switches to set-dedupe to backfill older mail. Automated and warmup mail is filtered. Paired with UIDVALIDITY tracking (`20260714_imap_uidvalidity.sql`). | shipped | idea | company-brain/knowledge-ingestion |
| cc-rls-lockdown | `supabase/migrations/20260714_lockdown_rls_anon.sql@M` | Enables RLS with no policy on every table, drops `allow_all`/`*_anon` policies, sets views to `security_invoker`, and pins function search_path | shipped | idea (Neon has no PostgREST anon role; the principle carries over) | db-schema; auth |
| cc-ci | `.github/workflows/ci.yml@M` | On every push, runs `npm ci` → `vitest run --coverage` → `next build`. `@R` adds `npm audit` (continue-on-error). | shipped | skip (Taxila gates are stronger) | evals/gates |
| cc-mcp-allowlist | `.claude/settings.json@MCP`, `.mcp.json@MCP` | Committed project permission allowlist for the Supabase, Neon and Vercel MCP tools, and gitignored personal overrides | shipped | idea | infra |
| cc-send-via-prod | `scripts/send-via-prod.mjs@SMTP` | An ops script that calls the live app's own endpoint over HTTPS, because raw SMTP egress is blocked from cloud sessions. Dry-run is the default; `--send` dispatches. The payload is a fixed list the owner approved. | shipped | idea | infra (ops scripts pattern) |
| cc-invoice-renderer | `docs/invoice/{README.md,template.html}@KNL`, `scripts/render-invoice.py@KNL` | A GST tax and proforma invoice template plus a renderer driven by JSON. The README lists CGST Rule 46 mandatory fields, the IGST vs CGST+SGST split, TDS 194J and series numbering. | prototype | idea | payments (India B2C GST invoicing) |
| cc-investor-honest | `app/investor/page.tsx` (`SESSION-LOG` 2026-08-07, `@M`) | A demo dashboard with **verified numbers only**. The model is badged "illustrative, not current traction". The agent declined the founder's request to inflate the numbers. | shipped | idea | parent reports (honesty contract) |
| cc-reports-pagination | `selectAllPages` / `loadLeadRows` pattern (deep-audit H12, `docs/deep-audit-2026-07-14.md@M`) | Paginates beyond the PostgREST 1000-row cap so stats are not silently truncated | shipped | idea | parent dashboard stats |

---

## 3. Key code excerpts worth porting (verbatim, short, no secrets)

### 3.1 HUMAN rule, as data and as text the operator can read (`lib/engagement-classifier.ts@M`)
```ts
export const HUMAN_RULE = {
  minWallSecs: 45,
  minHeartbeats: 2,
  minSecsPerHeartbeat: 8, // strictly greater than
  minMinutesAfterSend: 10, // strictly greater than
  sharedIpCompanyThreshold: 3,
  /** How far outside a session's window a session-less event may still belong to it. */
  attachWindowMs: 10 * 60 * 1000,
} as const;
// ...
// The rule below is the one from STATE §2, verbatim, plus one extra CONSERVATIVE
// demotion (shared ip_hash across >= 3 unrelated leads). Extra rules may only
// ever move a session towards MACHINE — never towards HUMAN.
```
Why it ports: the tracker's heartbeat interval is a *known clock* (15000ms). Sandboxes virtualise timers, so their heartbeats arrive about 1.8s apart. For Taxila, any cadence the client emits can be checked server-side against wall time. Tab backgrounding, a sleeping child and a bot each have their own signature.

### 3.2 Visible-only active time and heartbeat (`components/proposal/proposal-analytics.tsx@M`)
```ts
let activeMs = 0, lastActive = Date.now(), hbCount = 0;
const tickActive = () => { if (document.visibilityState === "visible") { activeMs += Date.now() - lastActive; } lastActive = Date.now(); };
const heartbeat = setInterval(() => {
  tickActive();
  if (document.visibilityState === "visible") { hbCount += 1; track("heartbeat", { n: hbCount, activeMs: Math.round(activeMs) }); }
}, 15000);
```

### 3.3 Atomic lease (`lib/cold-email/sequence-engine.ts@M`)
```ts
const leaseUntilIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();
const { data: claimed, error: claimErr } = await sb
  .from("sequence_enrollments")
  .update({ next_send_at: leaseUntilIso })
  .eq("id", enrollment.id)
  .in("status", ["queued", "active"])
  .not("next_send_at", "is", null)
  .lte("next_send_at", nowIso)
  .select("id");
if (!claimed || claimed.length === 0) {
  // Another worker already claimed it, or it's no longer due.
  return { outcome: "failed", detail: "claim lost (already in flight)" };
}
```

### 3.4 Generic audit trigger core (`supabase/migrations/20260715_critical_tables_audit_trigger.sql@M`)
```sql
create or replace function public.log_record_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_old jsonb; v_new jsonb; v_changed text[];
        v_actor text := nullif(current_setting('app.actor', true), '');
begin
  if (tg_op = 'UPDATE') then
    v_old := to_jsonb(old); v_new := to_jsonb(new);
    select array_agg(k order by k) into v_changed
      from jsonb_object_keys(v_new) as k
      where (v_new -> k) is distinct from (v_old -> k) and k <> 'updated_at';
    if v_changed is null then return new; end if;
    insert into public.record_audit (table_name,row_id,op,db_user,app_actor,old_row,new_row,changed_fields)
    values (tg_table_name, v_new->>'id', tg_op, current_user, v_actor, v_old, v_new, v_changed);
    return new;
  -- INSERT and DELETE branches are analogous
```
For Taxila, set `SET LOCAL app.actor = 'conductor' | 'director' | 'parent:<id>'` per transaction. Then every change to the learner model or consent can be attributed to a writer.

### 3.5 Heuristic → forced-tool LLM → never-null fallback (`lib/cold-email/reply-classifier.ts@M`)
```ts
export async function classifyReply(input: ClassifierInput): Promise<ClassificationResult> {
  // 1) Cheap heuristic first — saves an LLM call on obvious OOO / unsubscribe.
  const heuristic = heuristicClassify(input);
  if (heuristic) return heuristic;
  // 2) No Claude key? Try OpenRouter/OpenAI before the weak keyword fallback.
  // 3) Claude classification (with heuristic fallback on any LLM failure)
  ...
      tools: [CLASSIFY_TOOL],
      tool_choice: { type: "tool", name: CLASSIFY_TOOL.name },
  ...
  const intent = (REPLY_INTENTS as readonly string[]).includes(raw.intent ?? "") ? (raw.intent as ReplyIntent) : "neutral";
```
On Azure OpenAI the equivalent is `tool_choice` with a function schema, or `response_format: json_schema`. Keep the enum clamp and the `confidence` clamp to [0,1].

### 3.6 Lenient JSON parse (`lib/ai.ts@M`)
```ts
function parseJsonLenient<T>(text: string): T | null {
  const candidates = [text.trim()];
  const unfenced = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  if (unfenced !== candidates[0]) candidates.push(unfenced);
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) { try { return JSON.parse(c) as T; } catch { /* try next */ } }
  return null;
}
```

### 3.7 Rotation-safe signed link verification (`lib/cold-email/proposal-link.ts@R`)
```ts
const secrets = verificationSecrets();   // [PROPOSAL_LINK_SECRET?, UNSUBSCRIBE_SECRET?]
if (!secrets.length) return null;
for (const secret of secrets) {
  const expected = signPayloadWith(`${leadId}.${type}`, secret);
  if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
    return { leadId, type };
  }
}
```

### 3.8 Web Push: prune dead subscriptions, never throw (`lib/messaging/push.ts@M`)
```ts
} catch (e: unknown) {
  const status = (e as { statusCode?: number })?.statusCode;
  if (status === 404 || status === 410) await deleteSubscription(s.endpoint as string);
}
// ...
} catch {
  return 0; // table missing / not configured — silent no-op
}
```
Taxila note: `push_config.private_key` sits in a DB table here. Put the VAPID private key in Azure Key Vault or a Container Apps secret instead. The 07-14 audit found that key readable by anon.

### 3.9 Signed identity cookie (`lib/messaging/session.ts@R`)
```ts
// Signed cookie required. Format: v1:<username>:<sig> (username may contain
// colons, so split on the LAST colon to recover the signature).
if (!raw.startsWith("v1:")) return null;
const rest = raw.slice(3);
const lastColon = rest.lastIndexOf(":");
...
if (!secureCompare(sig, sign(username, key))) return null;
```

### 3.10 Env fingerprints (`lib/required-env.ts@M`)
```ts
fingerprint: present ? createHash("sha256").update(raw!.trim()).digest("hex").slice(0, 8) : null,
value: spec.kind === "url" && present ? raw!.trim() : null,
```

---

## 4. Measurements (each with source, n, method and date where the repo gives them)

| claim | n / method | date | source |
|---|---|---|---|
| Offer-page engagement was mostly sandboxes. 205 page views ≈ 67 real; 149 brief reads ≈ 26 real (about 3x inflation). | HUMAN rule applied retroactively to exporter-campaign proposal_events | 2026-08-07 to 08-24 | `docs/STATE-2026-08-24.md@M` §2 |
| Sandbox signature: heartbeats about 1.8s apart against a 15000ms code interval; sessions 0-24s; clicks before page_view; ip_hash shared across firms; frozen Chrome builds | session forensics on /p events | 2026-08 | `docs/STATE-2026-08-24.md@M` §2, `lib/engagement-classifier.ts@M` |
| 916 cold emails to EU importers → 2 verified humans → 0 conversations → 0 revenue. The DE wave (319 sends, native German, 10:30 local) produced 0 human engagement. | live DB, HUMAN-filtered | 2026-08-24 | `docs/STATE-2026-08-24.md@M` §1 |
| About 811 importer sends produced exactly 1 verified human engager | live DB | 2026-08-10 | `docs/startup-context-handoff-2026-08-10.md@M` §5 |
| 88 replies all-time: 21 positive, 3 meeting, 8 question, 1 referral. All warm threads came from the India side. | email_replies classified intents | 2026-08-24 | `docs/STATE-2026-08-24.md@M` §3 |
| Funnel: 5,899 emailed → 208 page viewers → 149 brief readers → 76 replies (~11 interested) → 1 trial → 0 won. "Follow-through, not demand." | 4 read-only Opus analysts, live DB | 2026-07-24 | `docs/growth-insights-2026-07-24.md@R` |
| A loss-framed subject beat a "free" subject about 2.2x (6.1% vs 2.8% page-view rate) | CRM cohort comparison; timing confound noted | 2026-07-24 | `docs/growth-insights-2026-07-24.md@R` |
| Send timing: 16:00 IST 6.5% page-view rate, 14-15:00 about 4.2%, 09:00 1.2% (worst). Friday is the worst day. | CRM cohorts | 2026-07-24 | `docs/growth-insights-2026-07-24.md@R` |
| Named-contact vs info@: no measurable lift (3.59% vs 3.32% view rate) | CRM cohorts | 2026-07-24 | `docs/growth-insights-2026-07-24.md@R` |
| June vs July: 3,984 sends → 345 views / 184 briefs, vs 3,594 → 35 / 8. "Not a tracking break." | CRM | 2026-07-24 | `docs/growth-insights-2026-07-24.md@R` |
| The LLM reply classifier is "unreliable (meeting requests in 'negative')"; a human glance is still required | analyst read of threads | 2026-07-24 | `docs/growth-insights-2026-07-24.md@R` |
| The `eu_strong` tag was only about 34% reliable: 51% wrong industry, 12% wrong company | 801-company sample, 7 independent Sonnet shards re-reading sites | 2026-07-18 | `docs/SESSION-LOG.md@M` 2026-07-18 |
| Four interleaved agent shards disagreed 6x on the exporter rate (12.9 / 5.7 / 3.3 / 2.0%). Precision on re-verdict: C3 63%, C1 58%, C4 36%, C2 33%. C2 cited no evidence_url on 107/239 rows (45%). | RECON Opus lane, one written standard | 2026-07-17 | `docs/SESSION-LOG.md@M` 2026-07-17 |
| Regex/auto classifiers always over-keep: hand-reviewed lanes held ≤10% junk vs 33-56% for auto-kept lanes | per-lane QA, about 44 agents, 2 adversarial passes | 2026-07-16/17 | `docs/SESSION-LOG.md@M` 2026-07-16→17 |
| Names reverse-engineered from email local-parts: 0 of 1,876 site_crawl names carried accents, vs 49.6% in registry data. Of 2,242 names and 2,099 emails, only 106 contacts had both. | contacts QA census | 2026-07-17 | `docs/AGENT-CONTEXT.md@M` §4-eu |
| Contact-lane fail rates: registry 0%; web_research 93%; spoc_site 83%; spoc_linkedin 63% | QA audit | 2026-07-17 | `docs/SESSION-LOG.md@M` |
| Wrong-domain audit: true junk rate 5.75% over all 2,296 Indian domains fetched. 156 sends went to 87 junk domains (147 strangers, 2.15% of 7,257 sends). | full fetch, no sampling | 2026-07-17 | `docs/SESSION-LOG.md@M` |
| Name↔domain "affinity" heuristic over-condemns 4.75x (328 fail, 69 actually junk), and 48% of real junk PASSES affinity | full audit | 2026-07-17 | `docs/SESSION-LOG.md@M` |
| Lane N: 10% seeded stratified adversarial audit = 33 pass / 10 fail / 1 unverifiable (23% defects), which escalated to a 100% census. evidence_url host matched own domain 443/443. 0 fabricated emails. | 4 auditors on the sample + 7 census auditors | 2026-07-31→08-02 | `docs/data-hunt/out/N-2026-07-31-REPORT.md@N` |
| Shared sandbox egress returns 429/502 above about 15 concurrent lanes | repeated across Lane A and N, and the 07-17 fleet | 2026-07-17, 07-31 | `@N` report §Method; `SESSION-LOG@M` |
| "21 of 30 unreachable Spanish hosts answered fine on a plain retry" | Lane A recovery pass | 2026-07-31 | `docs/data-hunt/SPEC.md@M` |
| Email recovery pass won back 24 of about 110 | Lane A | 2026-07-31 | `docs/data-hunt/SPEC.md@M` |
| Raw MX-only (unverified) sends bounced about 6% and throttled the fleet; ELV-verified waves ran 0-0.3% bounce | fleet bounce stats | 2026-07-08→22 | `AGENT-CONTEXT@M` §4, `SESSION-LOG@M` |
| Fleet: 18 mailboxes, reputation 95-100, **0 spam complaints ever**; bounce about 1% on August waves vs 5.6% in July | mailbox stats | 2026-08-24 | `docs/STATE-2026-08-24.md@M` §7 |
| Spillover lost local time: 29% of July sends landed 04:00-08:00 local | send logs | 2026-08-24 | `docs/STATE-2026-08-24.md@M` §6.3 |
| WhatsApp: Meta error `131049` silently drops MARKETING templates to cold recipients. Free-form messages inside the 24h window opened by the user's own inbound are exempt. | utility-vs-marketing A/B on a new number | 2026-07-13 | `AGENT-CONTEXT@M` §4-prev |
| Phone data: 484 leads had a phone, about 398 mobile, 209 usable | live DB | 2026-07-20 | `AGENT-CONTEXT@M` §4 |
| Global hourly send cap was declared twice (150 in the cron, 120 in the planner) and had drifted, which under-booked by 25% | code read | 2026-09-02 | `SESSION-LOG@M` 2026-09-02/03 |
| 557 leads had an `in_scope` verdict in the cache that was never written back to `leads.scope_status`, so they were invisible to every audience | live DB | 2026-09-02 | `SESSION-LOG@M` 2026-09-02/03 |
| Test suites: 136/136 across 16 files after the review fixes; 47/47 on main at 08-24. CI had been red from about 07-14 to 07-27 because of a stale mock. | vitest | 2026-07-23 / 08-24 | `docs/project-review-2026-07-23.md@R`, `STATE-2026-08-24@M` §7 |
| Supabase Free/Nano (0.5 GB) with no backups went down in a capacity incident; a manual snapshot captured 53,862 rows | incident | 2026-07-08 | `SESSION-LOG@M` 2026-07-08→10 |
| Deep audit: about 40 tables were readable or writable by the anon role, including lead PII, mailbox config and the VAPID private key | Supabase advisors and live probes | 2026-07-14 | `20260714_lockdown_rls_anon.sql@M`, `deep-audit@M` C2 |
| `/api/leads` on the vercel.app alias returned 200 with 7.4 MB of lead data while Vercel "Standard" protection was on | live probe | 2026-07-14 | `SESSION-LOG@M` 2026-07-14 evening |
| A Hindi cornerstone page ("CBAM kya hai") was shipped with hreflang hi-IN↔en-IN; AI-engine referrals already convert (1 of 5 June leads) | GSC / analytics | 2026-07-15 | `SESSION-LOG@M` 2026-07-15 |
| Vercel Web Analytics was disabled on all 5 projects, so inbound was unmeasurable | Vercel API | 2026-07-24 | `docs/growth-insights-2026-07-24.md@R` |

---

## 5. Rejections (what was tried → what broke)

These are the highest-value entries. Each says what it means for Taxila.

1. **Treating link clicks and page events as human engagement.**
   - **What broke:** Most events came from mail-security sandboxes that open every link. Six phantom leads were celebrated for days, the historical funnel was 3x inflated, and the "Strike-While-Hot" push-alert feature (`docs/intelligent-features-proposal-2026-07-02.html@M`, "422 opened their page") was designed around signals that were mostly machines.
   - **Source:** `STATE-2026-08-24.md@M` §2, `lib/engagement-classifier.ts@M`.
   - **Taxila:** classify every parent-link or report-open metric before showing it. Never trigger a teacher or parent nudge on an unverified open. Never say "I saw you read the report" (the CC rule: it "reads as surveillance").
2. **Trusting pre-labelled pools and tags.**
   - **What broke:** `send_pool_1_EU_priority.csv` was pre-tagged `cbam_strong`, but only 4 of 56 rows were genuine. About 30 mis-targeted offers went out before the campaign was stopped. The `eu_strong` tag was about 63% junk.
   - **Source:** `AGENT-CONTEXT@M` §4-prev, `SESSION-LOG@M` 07-16, 07-18.
   - **Taxila:** never trust a label a content source or agent assigns (grade level, board, "verified"). Re-classify against a verified key.
3. **"Deliverable" treated as "correct".**
   - **What broke:** ELV email verification proves deliverability, not identity or ICP fit.
   - **Source:** `startup-context-handoff@M` §3.
   - **Taxila:** a check that passes on one axis says nothing about the others. A kit that renders is not a kit that is correct.
4. **A domain resolver that guessed domains from company names.**
   - **What broke:** Indian SMEs were mapped to unrelated foreign sites (enbridge.com, titanium.com, mastodon.social). The verifier then read the wrong site and stamped `eu_strong`. About 200 mis-sends reached strangers, including `+claudebot@anthropic.com`, which had been scraped from a crawler UA string.
   - **Source:** `SESSION-LOG@M` 2026-07-17.
   - **Taxila:** identity is never inferred from a name. Taxila's law already says identity is an authenticated child id.
5. **The name↔domain affinity heuristic as a junk filter.**
   - **What broke:** It over-condemned 4.75x, and 48% of real junk passed it. Fetching the page was necessary both ways.
   - **Source:** `SESSION-LOG@M` 07-17.
6. **Merging agent shards without a shared ruler.**
   - **What broke:** Four statistically identical shards disagreed 6x. The founder's hypothesis (that strict lanes under-reported) was backwards: the strict lane was the accurate one. One lane cited no evidence on 45% of its rows.
   - **Source:** `SESSION-LOG@M` 07-17.
   - **Taxila:** every Forge or kit-verification fleet needs one written standard and a reconciliation lane before any merge.
7. **Agents quoting search-result snippets as evidence.**
   - **What broke:** A DuckDuckGo snippet *is* the meta description, so "evidence" came from `<head>` or navigation chrome, not body prose.
   - **Fix:** match against rendered body text with `<head>` stripped, inside a single block element.
   - **Source:** `@N` report.
8. **Scope-gating on the product list instead of on what the company says it is.**
   - **What broke:** Producers were filed as traders, even when the manufacturing verb sat inside the quoted evidence phrase.
   - **Source:** `@N` report.
9. **Bulk-harvesting registries without a domain resolver.**
   - **What broke:** `nace_registry` made up 53% of the DB but yielded only 1.8% strong. Every registry country in Lane N breached the 20% junk threshold, and NACE codes had been renumbered in every country checked ("the NACE codes in SPEC.md are WRONG").
   - **Source:** `AGENT-CONTEXT@M` §4-eu, `@N` report.
10. **Recommending a data source before reading its licence.**
    - **What broke:** KBO Belgium was recommended twice. Its licence forbids direct-marketing use of personal data. Nine more association sources were found to be licence-dead.
    - **Source:** `SESSION-LOG@M` 07-16/17, `SPEC.md@M`.
    - **Taxila:** read the licence of any NCERT, board or third-party content before ingesting it into Forge.
11. **The `exporter_backref` pincer class (supplier logo walls as proof of an EU import).**
    - **What broke:** 56% failed. A logo cannot tell an EU import apart from a delivery to the buyer's Indian subsidiary. The whole 63-row class was rejected.
    - **Source:** `SESSION-LOG@M` 07-16/17.
12. **Self-hosted SMTP email verification.**
    - **What broke:** The IP was on Spamhaus, so every probe got a 550 reject and false "invalid" results.
    - **Source:** `AGENT-CONTEXT@M` §4-prev.
13. **Apollo industry-search discovery.**
    - **What broke:** All 2,500 credits were billed against an internal 2K cap because the internal ledger miscounted. About 758 credits were wasted and the data was contaminated. Domain-targeted enrichment was the correct approach.
    - **Rule:** enforce caps against the vendor's real billing, not your own counter.
    - **Source:** `AGENT-CONTEXT@M` §2, §4.
    - **Taxila:** Azure token spend caps must read Azure cost data, not an app-side estimate.
14. **A temporary RLS policy written as `FOR UPDATE` only.**
    - **What broke:** Rows were invisible, the UPDATE hit 0 rows, and Supabase returned **no error**. The script's success counter lied, and the first 801-row apply wrote nothing.
    - **Fix:** always use `.update().select("id")` and count the returned rows.
    - **Source:** `SESSION-LOG@M` 07-18.
15. **Free-tier DB with no backups.**
    - **What broke:** An outage in a capacity incident, with no point-in-time recovery.
    - **Source:** `SESSION-LOG@M` 07-08→10.
    - **Taxila:** Neon branching and PITR must be confirmed before real child data exists.
16. **"MVP" RLS: `allow_all` / anon policies.**
    - **What broke:** About 40 tables were exposed, including the VAPID private key. The CRM API sat on the vercel.app alias, which Vercel "Standard" Deployment Protection does not cover; covering it would have broken sent `/p/` links.
    - **Fix:** the app-wide `proxy.ts` gate.
    - **Source:** `20260714_lockdown_rls_anon.sql@M`, `SESSION-LOG@M` 07-14.
17. **App-auth cookie HMAC-keyed by the human password.**
    - **What broke:** One captured cookie lets an attacker brute-force the password offline.
    - **Fix:** a separate `CC_AUTH_SIGNING_SECRET` (`@R`).
    - **Also:** the plaintext `cc_user` cookie allowed impersonating a teammate, now signed. The `isLocal` check `startsWith("localhost")` matched `localhost.evil.com`.
    - **Source:** `docs/project-review-2026-07-23.md@R` P1.
18. **Secrets passed as query strings (`?secret=`).**
    - **What broke:** The values leak into Vercel and proxy logs and browser history, and one CRON_SECRET authorised all sending.
    - **Fix:** Bearer header only (`@R`).
19. **Unsubscribe token verification split on '.'.**
    - **What broke:** Every real email address contains dots, so **every unsubscribe link ever sent failed when clicked**. Only a new test suite found it.
    - **Fix:** split from the right; already-sent links then verified retroactively.
    - **Source:** `acd06b8@R`.
    - **Taxila:** every DPDP withdrawal or consent link needs round-trip tests with realistic inputs.
20. **Signalling success on failure.**
    - **What broke:** The claim form called `setDone(true)` in the catch block, showing the user "You're in" when nothing reached the server. The unsubscribe route returned `{ok:true}` while ignoring the DB error. The website-lead rescue missed some failure paths.
    - **Source:** `docs/deep-audit-2026-07-14.md@M` H8, H9, H11.
    - **Taxila:** a consent toggle or a safeguarding hand-off must never report success unless it truly succeeded.
21. **Suppressing before classifying.**
    - **What broke:** OOO and auto-acks marked enrollments `replied` and **permanently suppressed** the sender. Separately, fleet mail BCC'd to itself was ingested as "positive" prospect replies and fired founder pushes.
    - **Source:** `deep-audit@M` H4, H5.
    - **Taxila:** classify first, act second. Filter self-generated events out of the learner model.
22. **A stale DB CHECK constraint on the classifier enum.**
    - **What broke:** The classifier emitted 14 intents but the CHECK allowed 9. Hot `meeting` replies hit a 23514 violation, stayed NULL and were retried forever.
    - **Source:** `deep-audit@M` H3.
    - **Taxila:** the DB enum and the TypeScript enum must be generated from one source, or a gate must diff them.
23. **IMAP cursor without UIDVALIDITY.**
    - **What broke:** A mailbox reset would silently blind the poller while the health check stayed green.
    - **Source:** `deep-audit@M` H6.
    - **Taxila:** any cursor-based ingest needs an epoch or validity token.
24. **Silent PostgREST 1000-row truncation.**
    - **What broke:** About 8 dashboards showed wrong numbers. Inbox facets covered only the newest 100, so older hot replies disappeared.
    - **Source:** `deep-audit@M` H12.
    - **Taxila:** parent and admin stats must paginate, and a gate should assert the counts.
25. **A second, ungoverned send path left as live code.**
    - **What broke:** The legacy `emailer` engine had no suppression, scope, window or cap checks, and had open tracking on. It was unscheduled but still invokable.
    - **Source:** `project-review@R` P0.3.
    - **Taxila:** one `compile()` and one send path per lane. Delete the old one, don't just leave it unscheduled.
26. **A gate checked only at enroll time.**
    - **What broke:** The send worker never re-read `scope_status`, so a quarantined lead would have re-sent the moment the freeze lifted.
    - **Fix:** re-gate at send time.
    - **Source:** `project-review@R` P0.2.
    - **Taxila:** safety predicates belong at the moment of output, not only at intake.
27. **A verdict cache that drifted from the source of truth.**
    - **What broke:** `domain_scope_verdicts` said `in_scope` for 557 leads whose `leads.scope_status` was never written back. Jindal Stainless, Mukand and others were invisible to every audience. Separately, a freemail domain classifier returned "unsure" for every gmail exporter.
    - **Source:** `SESSION-LOG@M` 09-02/03.
28. **A constant declared twice.**
    - **What broke:** GLOBAL_HOURLY_CAP was 150 in one file and 120 in another, under-booking by 25%.
    - **Fix:** one constant in `send-limits.ts`.
    - **Source:** `SESSION-LOG@M` 09-02/03.
29. **A sticky code constant changed temporarily and not reverted.**
    - **What broke:** The send window was widened from 16 to 17 IST for a front-load, then flagged "STILL NEEDS REVERTING". A campaign-window overwrite (`--arm` re-stamps `send_window`) silently deferred the first batch, with sent=0 and no error.
    - **Source:** `SESSION-LOG@M` 07-22, `STATE-2026-08-24@M` §6.1.
30. **Hardcoded deadline drift.**
    - **What broke:** The offer was locked to 31 Aug, but the AI Reply Studio system prompt and an inbox quick-chip still said "30 September". An AI-drafted reply would have stated the wrong deadline. Later the page still read "Closes 31 August" on 2 Sep.
    - **Source:** `project-review@R` P0.7, `SESSION-LOG@M` 09-02.
    - **Taxila:** facts inside prompts must be compiled from one canonical source, never hand-typed.
31. **The "Hi Visit Website" bug class.**
    - **What broke:** Scraper artefacts such as `VISIT WEBSITE` used as a company name rendered as "Hi Visit Website". It was fixed in the cold engine (`87d226a`) but survived in template-engine, the WhatsApp executor and the subject-line path, and 43 sends went out with a broken subject.
    - **Source:** `project-review@R` P0.6, `growth-insights@R`.
    - **Taxila:** child names and nicknames rendered into speech or prompts need a junk and safety guard in **every** lane.
32. **Follow-ups killed, then partly re-armed through a side route.**
    - **What broke:** The "first-touch-only" rule was structurally enforced, but `lift-followup-hold` re-armed parked follow-ups (`project-review@R` P0.4). The real lesson came later: warm demand was dropped because nobody followed up. About 190 warm engagers got no second touch, a CFO's scoping email went unanswered for 13 days (buried under DMARC report noise), and 4 of 5 claimants were never contacted.
    - **Source:** `growth-insights@R`.
    - **Taxila:** the Conductor must close loops. A parent question unanswered is the failure.
33. **Fabrication requests from the owner.**
    - **Investor inflation (`SESSION-LOG@M` 08-07):** the founder asked for "10-15 clients". The agent declined and showed verified numbers, with any model badged "illustrative".
    - **Fabricated hero quotes:** the sector landers carried client-attributed quotes, which were removed (`SESSION-LOG@M` 07-15).
    - **Fabricated persona:** a doc told the founder to submit a non-existent "Dr. Rahul Sharma, Lead Carbon Auditor" to Crunchbase and a press release (`SESSION-LOG@M` 09-02/03).
    - **Taxila:** parent reports must never invent progress, and the AI tutor must never claim a fake human credential.
34. **Website redesign shipped without seeing it.**
    - **What broke:** It was rejected as "totally fucked" / "invisible" and rolled back to `fa5395f`.
    - **New rule:** screenshot at 1440px and 390px with headless Chrome, read the PNG, and iterate before shipping.
    - **Source:** `AGENT-CONTEXT@M` §2.
35. **Mobile UX defects.**
    - `overflow-y-auto` on the main area forces overflow-x to auto, so every page scrolled sideways and stuck.
    - A dropdown anchored to the bell icon ran off the left edge.
    - Chart markers placed close together overlapped.
    - The reaction button was hidden behind `group-hover`, which never fires on touch, so it was permanently invisible on phones.
    - **Source:** `e8c55fa`, `9d9b7a5@MOB`.
    - **Taxila:** children and parents are on budget Android phones. Never put an affordance behind hover.
36. **Free OpenRouter models.**
    - **What broke:** `nvidia/nemotron-3-super-120b:free` leaks chain-of-thought into content and fails JSON mode. Free models also return 429s in bursts, so every call needs a fallback chain.
    - **Source:** `lib/ai.ts@M`.
    - **Taxila (Azure-only):** keep a fallback chain across Azure deployments and regions, and validate JSON mode for each deployment.
37. **Background agents and processes dying.**
    - **What broke:** On the owner's Windows box, every task notification reaped background node. The weekly agent limit was hit mid-op. Transcripts expired. A Fable fleet had to be stopped and respawned as Sonnet from its on-disk STATE files, which worked losslessly because of the cursor discipline.
    - **Rule:** durable state files and cursors, foreground `--limit` bursts, and agents only for judgment.
    - **Source:** `SESSION-LOG@M` 07-16/17, 07-18.
38. **Raw SMTP from a cloud session.**
    - **What broke:** Egress is blocked.
    - **Fix:** call production's own endpoint over HTTPS (`send-via-prod.mjs@SMTP`).
39. **WhatsApp marketing templates to cold numbers.**
    - **What broke:** Meta throttles them silently with `131049`, and fresh numbers get banned for cold-scraped marketing.
    - **Decision:** WhatsApp is for warm follow-up and opt-in-first only.
    - **Source:** `AGENT-CONTEXT@M` §4.
    - **Taxila:** parent WhatsApp must be opt-in and utility-category (via Azure Communication Services advanced messaging).
40. **Cold email to EU importers.**
    - **What broke:** The DE test was decisive: 319 sends, 0 humans. The rule became "Stop scaling cold email to EU importers. It is measured and answered."
    - **Source:** `STATE-2026-08-24@M` §8.
    - **Taxila (growth):** relationship and association channels (schools) beat cold outreach.
41. **Unsubscribe footer on 1:1 relationship letters.**
    - **What broke:** The mass-campaign footer and postal address were appended to letters to ministries and plant heads. A trial send to an internal inbox caught it before any external send. Fixed with an audience-gated footer (`292d74b@PRE`).
    - **Taxila:** always send a trial to an internal inbox first.
42. **`next/font/google` cached build.**
    - **What broke:** Google rotated the file hashes inside the font package, so 72 Turbopack errors appeared from 404 woff2 files, and a failed main build means no offer pages ship.
    - **Fix:** self-host fonts with `next/font/local`.
    - **Source:** `SESSION-LOG@M` 08-17.
    - **Taxila:** self-host fonts, especially Devanagari faces.
43. **The `xlsx@0.18.5` dependency.**
    - **What broke:** It has CVEs for prototype pollution and ReDoS, and it parsed files operators uploaded.
    - **Fix:** replaced with the patched SheetJS 0.20.3 build (`5a46b6e@R`).

---

## 6. Concepts

- **Verify, never assert.** Numbers come from the live DB or API in the same session, and the word "verified" is used only when that check happened. Agents corrected their own overstated claims in the log (for example "715 junk domains" was really an affinity-suspicion count). Taxila: every parent-facing number is read from the DB at report time.
- **Feedback memory with the WHY.** Founder preferences are captured immediately as typed memories, each carrying the reason and how to apply it. They are the highest-value context type because they are what agents "forget". This maps to the Taxila parent-preference memory and the owner-directive log.
- **Durability over babysitting.** Long jobs write cursors, state documents and commits so a dead session resumes without loss. Agent fleets can be swapped between models (Fable to Sonnet) from on-disk STATE. This maps to Forge and Conductor job design.
- **Cheap-first, agent-only-for-judgment.** A deterministic $0 pre-filter, plus a fetch-and-cache step, condemns only confident junk and **never auto-keeps**. Agents read the cached pages for judgment calls. The prefilter may move rows only towards rejection. This maps to the teaching-kit verification pipeline.
- **Hard-law brief, central gating.** Each subagent gets inviolable laws (own-site evidence only, no guessing, licence check, retry before drop, skip-check before spend). An assembler mechanically re-checks everything, and nothing an agent writes is trusted. Adversarial auditors are told to assume fabrication, and a sample above the defect threshold escalates to a census.
- **Precision over recall; decline when uncertain.** The resolver declines uncertain matches rather than guessing. This matches Taxila's "a model never grades; classify against verified keys".
- **Rules may only move towards the safe side.** In the HUMAN classifier, extra rules may only demote to MACHINE. Asymmetric gates are a reusable safety shape: added predicates can only restrict.
- **Soft-delete and quarantine, never hard-delete.** Every bad row is soft-flagged and reversible (an agent's dedupe bug collapsed 6,540 firms, and the soft-flag let it be reverted instantly). A record with an outbound link must never be deleted.
- **Public surfaces separate from the app.** A dedicated PDF/links host serves only prospect surfaces and returns 404 for everything else. Sent links stay public forever, and the CRM is never reachable on the branded domain. This maps to Taxila parent-share links on a separate host.
- **Fail-open for enrichment, fail-closed for safety.** Translation, classification and push are best-effort and never block a request. Auth, crons and webhooks fail closed. Taxila: affect and learner signals fail open, and safety and consent fail closed.
- **One canonical rule location.** `exporter_followup_audience()` is an SQL function that is "the single place that rule lives", and send limits are one constant. This counters drift.
- **Contextual chat.** A conversation channel is pinned to the work record (`entity_kind`/`entity_id`). This maps to a parent↔teacher thread pinned to a lesson, a misconception or a weekly report.
- **Trial-to-self before any external send.** The full chain (email → page → brief → tracking) is verified on a test inbox first.
- **Screenshot before shipping.** UI is checked at 1440px and 390px with headless Chrome, and the agent reads the PNG.
- **Model tiering.** Mechanical lanes run on Sonnet; judgment, QA and verdicts run on Opus or Fable. The orchestrator verifies, commits and deploys, and the sub-agents implement on disjoint file sets.
- **Honest boundaries in copy.** "We are not a verifier", "Sample data shown" captions, no testimonials, "never say nobody does this". This maps to the Taxila honesty floor in parent reports and marketing.

---

## 7. Mapping to Taxila subsystems (quick index)

| Taxila subsystem | Assets from this repo |
|---|---|
| telemetry/tracing | cc-engagement-classifier, cc-proposal-tracker, cc-site-collect |
| generative-ui/modules | cc-proposal-tracker (module dwell, interaction events through a CustomEvent bus like `cs:calc`) |
| learning/pedagogy | engagement verdicts used as a covert attention signal (heartbeat cadence vs wall time, visible-only active time) |
| emotional-lens/affect, safety-floor | cc-reply-classifier (heuristic precision tier, then LLM forced schema, then never-null) |
| relational-os (parent comms) | cc-ai-draft-studio, cc-reply-translator, cc-reply-digest, cc-team-chat-schema, cc-wa-agent |
| memory-graph | cc-audit-trigger (who changed which learner fact, and when), cc-session-log-protocol (typed facts with WHY) |
| group-ai/multi-agent, Forge | cc-data-hunt-spec, cc-lane-gating, cc-verdict-cache |
| company-brain/knowledge-ingestion | cc-session-log-protocol, cc-startup-handoff, cc-archive-ingest |
| evals/gates | cc-required-env, cc-lane-gating census rule, unsubscribe-token style round-trip tests |
| auth/accounts/consent | cc-app-gate, cc-signed-session, cc-signed-links, cc-unsub-token, cc-secure-compare, cc-encryption |
| db-schema | cc-audit-trigger, cc-atomic-lease, cc-rls-lockdown principle |
| infra/azure/deploy | cc-ai-client (as a chain of Azure deployments), cc-cron-window, cc-send-via-prod pattern, cc-mcp-allowlist |
| android/capacitor | cc-webpush, cc-pwa-manifest, cc-live-alerts, cc-mobile-shell (as an anti-pattern for store builds) |
| design-system/ux | cc-mobile-nav, cc-http-helpers, cc-notif-feed, mobile defect rejections |
| payments | cc-invoice-renderer (GST/IGST/TDS field checklist) |
| growth/seo | Hindi hreflang page, AI-crawler robots allowlist and llms.txt (`SESSION-LOG@M` 07-15); the "cold channel answered" lesson |

---

## 8. Gaps / unread

- I read 103 `scripts/*` only by name, except where the session log describes them. That includes scope-clean-rules, verify-eu-export, harvest-worker and audit-rollback.
- I did not read `lib/cold-email` deliverability internals line by line: throttle, ramp-scheduler, health-scorer, placement-tester, mailbox-picker, soft-bounce-policy, warmup-filter, spintax, timezone-resolver. They are deliverability-specific and of low Taxila value.
- I did not read `lib/free-quarter/*` or `lib/importer-brief/*` React-PDF variants, nor `components/proposal/*` page code.
- I did not open `lib/integrations.ts`, `lib/integration-secrets.ts` or `lib/integration-runtime.ts` (webhook dispatcher), nor `lib/activity-kpis.ts`, `components/reports/*` or `app/analytics` funnel and heatmap code.
- I did not read `app/team/page.tsx` UI code. I took the chat UI pattern from the docs and the lib layer.
- I did not open the data-hunt CSVs (`docs/data-hunt/out/*.csv`). They contain business PII and were deliberately not read.
- The client-acquisition-channels branch (press pitches, LinkedIn calendar, a guest article .docx), the business-strategy suite (9 research pilots and artefacts hosted off-repo) and most of the KNL negotiation docs were skimmed through commit messages only.
- The mobile, team-chat and codex branches have no merge base in this shallow clone, so their per-commit history beyond the messages I read was not reconstructed. Their content is in `@M`.
- Out of reach: the auto-memory store (`~/.claude/projects/.../memory/`), which is local to the owner's machine and not in git; the CS-website repo; the `saas_new_/cbam-reporter` portal; and the external artefacts linked from docs.
- I made no live DB or production probes. Every number in §4 is as the repo docs state it, with their own dates and methods.
