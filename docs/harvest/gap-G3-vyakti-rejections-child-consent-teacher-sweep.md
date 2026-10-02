# Gap G3: rejection-ledger sweep for child, consent, teacher and realtime entries

Gap-fill, 2026-10-02. Read-only. Everything was read with `git show <ref>:<path>` into a scratch directory. Nothing in
`html-portfolio` was checked out, committed or pushed. No secrets were opened, and no secret appears in any entry
quoted here.

## Sources and method

| short | ref | file | lines | `## ` headings |
|---|---|---|---|---|
| `@vy` | `origin/claude/vyakti-cloning-platform-aq05n4@ebe16cc0` (2026-09-30) | `context/rejected.md` | 19,360 | 1,023 |
| `@h206` | `origin/codex/handoff206@20263775` (2026-09-09) | `context/rejected.md` | 17,817 | 860 |
| `@h206` | same | `context/decisions.md` | 24,035 | 1,066 |

**Structural finding.** `rejected.md@h206` is a byte-identical prefix of `rejected.md@vy`. I checked this with
`diff <(head -17817 vy) h206`, which printed nothing. Every `@h206` rejection therefore has the same line number at
`@vy`, and a sweep of `@vy` covers `@h206` completely. The line numbers below are valid at both refs up to L17817.

**Method.**
1. I grepped the headings for
   `child|minor|student|teacher|lesson|pedagog|parent|consent|age-tier|realtime|azure|foundry|deployment`. That gave
   42 hits at `@vy`, 33 at `@h206` and 52 in `decisions.md@h206`.
2. I scored every entry body for
   `child|minor|student|teacher|lesson|pedagog|consent|age-tier|foundry|realtime|guardian|kid|dpdp|coppa`. 34 entries
   scored 3 or more.
3. I grepped the bodies for minor-safety tokens: `parental|guardian|minor-safe|AGE_TIER|is_adult|under 18|age gate|1098|childline|14416`.
4. I checked every hit against the text of all `docs/harvest/*.md` and `json/*.json` files to see whether a harvest
   report already cites it.
5. I read every uncited hit in full.

Bare `parent`, `azure` and `deployment` are too noisy in bodies (DOM parent, git parent, Azure resources), so I used
them only in headings. Body hits where "child" means a DOM node or child process (`ws-r64`, `ws-r160`, `ws-r181`,
`ws-r169`, `ws-r159`, `ws-r106`) were read and set aside as irrelevant to Taxila's domain.

**Correction to the task premise.** Three entries the brief listed as uncited are cited in segment reports, though not
in the consolidated map's §3:
- `ws-r61` and `ws-r82` appear in `hp-vyakti-b.md` #24 and #25, and in `json/hp-vyakti-b.json`.
- `interrupted-activation-closeout-lessons-20260930` appears in map §3 #183 and in `hp-vyakti-cloning-tip.md` R28.

`ws-r83` (rejected), `test-ui-with-empty-server-bypass`, `comparison-seam32`, both 2026-09-07 teacher-sheet entries
and the thirty-day-receipt entry were cited nowhere, as the brief said.

## Findings: rejections (numbered to continue map §3; last existing number is 252)

The numbers here are this report's own. The map addendum merges some of these and renumbers them as §3 #253-#279, and
the addendum's numbers are the ones to cite.

### Consent surfaces and consent ceremonies

253. **A test UI that hides consent while the server-side test bypass stays empty.**
   - **Tried:** the Vite-built internal test workspace hid the consent and verification controls, and the server's
     test settings were left unset.
   - **Broke:** `bootstrapSelfTestReplica` correctly stayed off, so no capture or storage grant ever existed. The API
     returned `capture_and_storage_consent_required` forever, and retrying or making a new clone could not repair a
     deployment configuration split between client and server.
   - **Fix:** one exact internal contract on both Vercel and the worker, plus a test that an applied bootstrap cannot
     surface the consent-required error.
   - **For Taxila:** a parent-consent screen must never be hidden by a client flag that the server does not share.
     Client and server read one consent contract.
   - Source: `rj:test-ui-with-empty-server-bypass-is-a-consent-trap@vy` L15581 (2026-08-29).

254. **Keeping an "all-authenticated" self-test bootstrap on the public production origin.**
   - **Broke:** the live inventory had grown to 171 auto-consents, 33 test-verified replicas, 5,009 auto-accepted
     evidence rows and 13 auto-selected artifacts. These records were valid for a reversible harness. None of them
     showed that a public account had knowingly authorised biometric or voice processing.
   - **Fix:** every tagged grant was reversed through the append-only ledgers, and the bootstrap variables were removed
     from production.
   - **For Taxila:** no test or demo bootstrap may write parent-consent rows on a production origin. Tag every
     synthetic grant so it can be reversed through the ledger.
   - Source: `rj:production-all-account-self-test-bootstrap@vy` L16036 (2026-08-30; inventory counts as logged there).

255. **Translating a consent ceremony's chrome but not its statements.**
   - **Tried:** translating the headings, status pill and withdraw buttons of `ModelConsentGate.tsx` into Hindi, while
     the six `STATEMENTS` stayed opaque English.
   - **Broke:** nothing mechanical; the copy gate would have stayed green. It was rejected because a half-Hindi,
     half-English consent screen is a different ceremony from the one that was approved. The gate would pass while the
     property it stands in for went quiet.
   - **For Taxila:** a Hindi parent-consent or child-assent screen is reviewed and approved as one whole screen.
   - Sources: `rj:ws-r61-partial-modelconsentgate-translation-considered-and-rejected@vy` L9912 (2026-09-05). Generalised to
     all six ceremony files in `rj:ws-r83-modelconsentgate-partial-translation-still-rejected-see-ws-r61@vy` L11403.
     Decisions: `ws-r61-modelconsentgate-left-untouched-consent-ceremony-legal-text@h206` L14325;
     `ws-r61-identity-proofing-consent-statements-deferred-not-attempted@h206` L14352 (KYC statements were held back
     because no legal review of the Hindi was possible); `ws-r71-consent-ceremony-files-found-and-not-converted@h206`
     L15603 (biometric consent called "the single most legally sensitive class").

256. **Extracting a seventh consent ceremony into its own file while a sibling's completeness proof counted six.**
   - **Tried:** `EnrollmentConsentPanel.tsx` was built in full, with 180 strings routed. `tsc` was clean and the
     scanner found 0 hits.
   - **Broke:** not the code. WS-R83's eval proves that its legal-review document is complete against a named list of
     exactly six files. A seventh file would make that proof quietly stop meaning what it says, and two concurrent
     sessions had no way to renegotiate the count. The extraction was reverted. WS-R92 later widened the document to
     7 files and 104 rows, each with a `Verdict` column, and all seven files are still "not yet reviewed".
   - **For Taxila:** a consent-completeness eval must find ceremonies by a structural marker, not from a fixed list.
     Before adding a ceremony, check whether any sibling has fixed a count.
   - Sources: `rj:ws-r82-enrollment-consent-panel-extracted-then-reverted@vy` L11414;
     decisions `ws-r82-enrollment-workspace-is-a-seventh-consent-ceremony-not-converted@h206` L16687,
     `ws-r92-seventh-consent-ceremony-joins-hindi-review-document@h206` L16772,
     `ws-r83-consent-ceremony-hindi-review-document-before-conversion@h206` L16540 (88 rows; a document is what legal
     review consumes, a `.tsx` diff is not).

257. **Exporting the consent `statement_set` constant from a live API module only to tidy an eval.**
   - **Rejected:** scope. Changing an imported API module for the sake of a review document widens the blast radius.
   - **Fix:** the eval extracts the literal `statement_set: "self-replica-enrollment-v1"` from the real source by regex,
     so a rename still breaks the suite.
   - **For Taxila:** every consent ceremony's `statement_set` and `policy_version` must be checked against real source
     on every run.
   - Source: `rj:ws-r92-statement-set-constant-export-not-added@vy` L11626.

258. **Documenting a post-grant success heading as a consent-ceremony row.**
   - **Rejected:** inconsistent with precedent. A boundary or refusal line that states what the consent covers is
     legally load-bearing in every state. A success heading shown after the ceremony is a status label.
   - **For Taxila:** this is the same row rule for parent-consent copy review.
   - Source: `rj:ws-r92-post-grant-heading-not-documented-as-ceremony-row@vy` L11662.

259. **A storybook fixture teacher rendered on a consent screen** (a decision whose rejected alternative is this).
   - **Broke:** `DisclosurePreview` told a real teacher "You're talking with an AI clone of Arjun Sir", and the embed
     snippet pointed at `teacher-demo-arjun`. A fixture on a screen that records a decision is a false statement.
   - **Fix:** a seed built from the owner's own name, and a labelled empty state for the preview. A seed may not be
     captioned "drafted from your uploads".
   - **For Taxila:** demo tutors and demo children never appear on parent-consent, disclosure or report screens.
     Reversal: none.
   - Source: decision `demo-teacher-is-not-a-placeholder@h206` L4881 (2026-08-26, WS-AE).

260. **Mixing creator material with platform safety in the compiler: an open creator-material block across the
   CORE/TAIL boundary.**
   - **Broke:** `compile()` inserts the call speech style, `AGE_TIER_SAFETY_OVERRIDE` for minor-safe turns and
     `ROOM_MODE_NOTE` between module parts. All three became text inside the untrusted creator-material envelope. A
     module-only concatenation test could not see this.
   - **Fix:** separate closed blocks, and a suite that compiles chat, call, minor and Room prompts through the real
     compiler and asserts that every safety insertion lies outside creator material.
   - **For Taxila:** teacher or curriculum material must never straddle the place where the child-safety floor is
     inserted. Test the final compiled string, never a module.
   - Source: `rj:wave25-open-creator-material-across-the-compiler-boundary@vy` L18973 (2026-09-14).

261. **A consent-candidate selection that ties on timestamp and sorts the UUID in opposite directions.**
   - **Broke:** preparation 146 broke storage-timestamp ties by descending UUID, and 145 by ascending UUID, so valid
     prepared material could disappear.
   - **Fix:** fresh candidates now match the exact still-active bound consent IDs.
   - **Open:** the logged note says the real-SQL proof on tied rows is still pending.
   - **For Taxila:** any "latest consent" or "latest grant" query needs a total order with the same tiebreak at every
     call site, or it must bind consent IDs exactly.
   - Source: `rj:comparison-seam32-consent-tie@vy` L17273 (2026-09-08).

262. **Showing agreement while the consent list is still loading or has failed.**
   - **Broke:** the normal Studio ignored `loadState`. `allSettled` could later overwrite real receipts with its earlier
     empty snapshot, an old 401 could sign out a new owner, and completed promises wrote history after unmount. Token
     equality alone swallowed refresh failures.
   - **For Taxila:** the parent dashboard must treat "unknown" as distinct from "no consents", and must guard every late
     response with the account generation.
   - Source: `rj:first-use-unknown-is-not-empty-and-old-read-is-not-receipt-20260907@vy` L16849.

### Erasure, retention and deletion receipts (DPDP-relevant)

263. **Starting a 30-day deletion-receipt clock while a Neon child branch still holds the records.**
   - **Broke:** a one-off verification branch held 13 target rows. A persistent child branch is a database state that
     can be recovered independently and can outlive a 30-day backup window.
   - **Fix:** diff the child branch against primary, prove no non-target writes exist, delete the branch, re-read the
     branch list, and only then erase.
   - **Reversal:** only a provider-enforced cross-branch erasure primitive, proven by a negative control.
   - **For Taxila:** every Neon branch is part of the inventory for a child's deletion. A parent's deletion receipt may
     not start while any branch holds that child's rows.
   - Source: `rj:a-thirty-day-receipt-cannot-start-while-a-child-branch-retains-the-records@vy` L16208 (2026-09-02).

264. **A forget sequence that deletes the parent table before its `on delete cascade` children.**
   - **Broke:** the end state was correct, but the receipt counts for 4 tables were always 0. Three tables were reached
     only by cascade and never named. The same bug was in `PERSON_TABLES`. The offline fake DB has no foreign-key
     engine, so only a count-level completeness assertion catches it.
   - **For Taxila:** this is cited in map §2.18 and Phase D #28, but it is not in §3.
   - Source: `rj:ws-r27-child-before-parent-ordering-bug-in-roomforget-and-persontables@vy` L7192.

265. **Forcing CTE order in a single-statement erasure without `RETURNING`.**
   - **Broke:** Postgres refuses the statement with `0A000` when a data-modifying CTE is referenced by name and has no
     `RETURNING`, so the full erasure would have failed on every call. `evals/sqlcast.mjs` caught it offline.
   - **For Taxila:** Taxila's single-statement child erasure must carry `RETURNING` on every CTE that is referenced by
     name, and must run through an offline SQL parser.
   - Source: `rj:ws-r175-forced-cte-dependency-needs-returning-or-postgres-refuses-the-statement@vy` L18697.

### Teacher-authoring surfaces (Taxila's kit and teacher tools, parent settings editors)

266. **A delayed load overwriting newer edits in the teacher-sheet editor.**
   - **Broke:** the old editor code ran with a held GET. The author edited the syllabus, then the GET was released, and
     the old values came back in both editors at both widths. A successful POST announced "saved" even after later
     edits. A failure claimed "not saved" when the write might have committed.
   - **Fix:** in decision `teacher-sheet-explicit-edit-wins-20260907@h206` L23085, Save and Load share one request lock,
     request generations bind late results to scope, a save confirms only the revision it submitted, and an ambiguous
     failure stays unconfirmed until it is read explicitly.
   - **For Taxila:** this applies to every editor a parent or teacher uses, including child controls, kit review and the
     schedule.
   - Source: `rj:teacher-sheet-delayed-load-overwrites-newer-20260907@vy` L16839.

267. **Read-only blocks placed before Save, and replacing saved text with a guessed short summary.**
   - **Broke:** retained full-page captures were 4,291 px on mobile and 2,399 px on desktop. Six read-only blocks and a
     long boundary stood between the author and Save. Both editors failed the structural control "Save before
     read-only details".
   - **Rejected:** shortening saved text to a guessed interpretation.
   - **Fix:** native disclosures that keep the exact body and the malformed states, per decision
     `teacher-sheet-native-disclosures-preserve-editing-20260907@h206` L23060.
   - **Not claimed:** the entry states that no timing or cognitive-load claim follows from a screenshot.
   - Source: `rj:teacher-sheet-readonly-before-save-density-rejected-20260907@vy` L16814.

268. **A browser-side wait followed by an assertion on a Node-side fake-server counter in the same tick.**
   - **Broke:** under pool concurrency `pending.length` was 0 when 1 was expected, because the button disables before
     the request reaches the fake server. The same shape appeared at 4 sites, and it is the third suite in that wave
     with it.
   - **Fix:** a bounded Node-side poll (`awaitPending`).
   - **For Taxila:** this applies to every mounted UI test of a parent or teacher flow.
   - Source: `rj:teacher-sheet-publication-ui-asserted-the-fake-servers-pending-count-on-the-tick-the-button-disabled@vy`
     L18799.

269. **Blaming a missing Share-tab mount on runtime activation when the real cause was a missing `?mode=teacher`.**
   - **Broke:** the diagnosis was never checked against the JSX. It was a plausible but wrong explanation for a real
     symptom.
   - **For Taxila:** drive the real UI before writing a cause into a registry comment.
   - Source: `rj:ws-r95-share-tab-mount-blamed-on-runtime-not-on-the-missing-mode-teacher-param@vy` L12689.

270. **Readiness gates that silently show the wrong screen, a fixture sheet that skipped load-time validation, and a
   non-UUID fixture id.**
   - **Broke:**
     - The Share panel gated on `voiceWorkspaceReady` alone, so a text-ready person got the wrong screen with no error.
     - `loadTeacherAgent` re-validates the sheet at load time and "must fail closed". Fixtures that only called
       `sheetToModule` missed 3 required fields, then hit `teacher_sheet_slug_mismatch`.
     - A non-UUID room id was refused with `room_knowledge_scope_invalid`.
   - **For Taxila:** kit and teacher-sheet fixtures go through the real loader, not the compile helper.
   - Source: the `ws-r174-*` sub-entries inside `rj:ws-r175-...@vy` L18707-18729.

271. **Gating an account page's presence in the parent component on a locale-chunk flag.**
   - **Broke:** the flag toggling unmounted and remounted the component, which reset the fetched settings. The
     disclosure card went blank on the first switch to Hindi.
   - **Fix:** a prop read inside the component, placed after every hook.
   - **For Taxila:** the parent dashboard's Hindi switch.
   - Source: `rj:ws-r139-restready-gated-at-the-parent-resets-accountpages-own-fetched-state@vy` L15322.

272. **Age-gate assumption: "Yes, 18+" was assumed to re-check room availability.**
   - **Broke:** only the final join tap calls `resolveRoom`. Nothing is created before it, so this is not a leak.
   - **For Taxila:** every step of a multi-step parent-consent flow that names a resource should re-resolve it, or the
     flow must document that the final step is the only authority. The source chose the second.
   - Sources: `rj:ws-r115-paused-room-button-test-assumed-a1-rechecks-availability@vy` L13215; decision
     `ws-r115-age-gate-yes-does-not-recheck-room-availability@vy` (decisions.md L19004).

### Azure, Foundry and deployment (Taxila is Azure-only)

273. **Treating "Azure by default" as an Azure-only serving boundary.**
   - **Broke:** an audit found an OpenRouter default reply lane, OpenRouter fallbacks for claims, embeddings and memory,
     Sarvam ASR, stored ElevenLabs serving, and direct voice callers outside the registry. Azure-named selfhost
     constructors accepted any HTTPS origin. A registry toggle misses all of these, and a development fetch guard is
     not production enforcement.
   - **Fix:** in decisions `azure-only-leaf-serving-and-challenge-boundary-20260907@h206` L22568 and
     `strict-azure-leaf-enforcement-20260907@h206` L22753, strict mode refuses conflicting overrides, rejects redirect
     following on signed transports, and keeps provider failure "unavailable", never a fallback.
   - **For Taxila:** this is the direct precedent for Taxila's Azure-only directive. Enforce it at every leaf caller, not
     in a registry.
   - Source: `rj:azure-default-is-not-an-azure-only-serving-boundary-20260907@vy` L16307.

274. **A build path that demands a non-Azure key under an explicit Azure selection.**
   - **Broke:**
     - The config writer required `OPENROUTER_KEY` even with Azure selected.
     - `--stub` let a build with invalid Azure settings proceed to Vite.
     - `runSelfCheck` raised a false incident for the missing OpenRouter key.
   - **Rejected fixes:** dummy production keys, and suppressing all environment failures.
   - **For Taxila:** the config writer and self-check must classify the provider explicitly. Never add an unused vendor
     key to make a build pass.
   - Sources: `rj:openrouter-required-for-explicit-azure-build-20260908@vy` L16916;
     `rj:azure-self-check-openrouter-false-incident-20260908@vy` L16931;
     `rj:azure-target403-and-old-key-requirement-not-ready-20260908@vy` L16901 (a 403 on Vercel project reads meant
     the deployment stayed unverified; a local build and a push are not a deployment).

275. **Creating a new Foundry project and chat deployment before reading current Azure state.**
   - **Broke (avoided):** the existing ARM session already listed the Foundry account and its successful deployments.
     Duplicates would add resources and cost.
   - **For Taxila:** inventory the grant's Foundry deployments before any `az ... create`.
   - Source: `rj:standalone25-azure-creation-assumption@vy` L18839 (2026-09-14).

276. **Packaging shortcuts on Azure Container Apps.**
   - **Broke:**
     - The Vite dev bridge lacks production headers.
     - A broad substring exclusion of `private` removed a legitimate JS chunk.
     - Bicep BCP100 and BCP138 errors.
     - An ACR build omitted `vite.config.ts`'s imported fixture builders (2 `UNRESOLVED_IMPORT`) and three HTML Vite
       inputs (ENOENT in a `closeBundle` hook that masked the real error).
     - A `closeBundle` guard treated only `undefined` as success.
     - TS7016 from an undeclared `.mjs` import passed bundling but failed strict `tsc`.
     - The Bicep template selected managed-identity pull while the bindings held a registry password.
   - **For Taxila:** this applies directly to `scripts/deploy-azure.mjs` and the ACR build. The build context needs a
     config-closure negative control, path-segment exclusions, and `tsc` as a separate gate from bundling.
   - Sources: `rj:azure-web33-rejected-packaging-shortcuts@vy` L17297, `#azure-web-cu3d-incomplete-vite-config-closure`
     L17549, `#azure-web-cu3e-incomplete-static-input-closure` L17554, `#azure-web68-undefined-only-success-sentinel`
     L17559, `#azure-web69-untyped-build-outcome-import` L17564, `#azure-web48-identity-pull-assumption` L17467.

277. **Proving deployment constraints with unused variables.**
   - **Broke:** a negative control showed that raw flags admitted forbidden creation and cleanup combinations unless
     the checked variables were consumed by Container App environment values.
   - **Rule:** compiler success is not cloud readiness.
   - Source: `rj:unused-deployment-guard-does-not-enforce-constraint-20260907@vy` L16427; decision
     `close-deployment-contract-before-provider-flags-20260907@h206` L22678.

278. **A test suite that reads platform behaviour from the running Node patch level.**
   - **Broke:** Node 24.21.0 stopped aborting the request signal after body consumption, which v24.18.1 did, so the
     suite failed on CI's Node 24 only.
   - **Rule:** simulate the strictest platform behaviour and state the version modelled.
   - Source: `rj:azureweb-suite-pinned-a-node-patch-level-behaviour@vy` L17875 (2026-09-13).

279. **Treating a handoff's prose count as the deployment inventory.**
   - **Broke:** the handoff said 14 crons; `vercel.json` held 23. Cutting to 14 would have retired 9 live jobs. Separately,
     merge helpers could report success after an unreviewed base advanced, or with `productionUnchanged=false`.
   - **For Taxila:** ACA Jobs and cron inventories come from configuration and a readback, never from a count in a
     handoff. A merge is not a deployment.
   - Sources: `rj:wave-25-fourteen-crons-was-a-stale-deployment-count@vy` L18875;
     `rj:wave25-merge-success-does-not-prove-deployment@vy` L19088.

280. **Create-only SAS diagnostics.**
   - **Broke:** the diagnostic expected 409 or 412 on a repeat create and got a 403 `UnauthorizedBlobOverwrite`. A
     generic 403 is not proof.
   - **For Taxila:** module and asset uploads to Blob. Create permission `c` and write permission `w` differ.
   - Source: `rj:create-only-azure-sas-overwrite-is-a-named-403-20260907@vy` L16277.

281. **Swapping an ASR provider name inside a verifier.**
   - **Broke:** Azure short ASR rejects the literal `unknown` language hint, and only `auto` maps to hi-IN.
   - **Also found:** the lease picked the latest reference despite saving an issue-time version, and the UI promised a
     human review that had no consumer.
   - **For Taxila:** the child-ASR language hint must be explicit, and UI copy must never promise a reviewer who does not
     exist.
   - Source: `rj:azure-challenge-unknown-hint-and-two-upload-assumptions-corrected-20260907@vy` L16317.

282. **Interrupted activation: details beyond map §3 #183.**
   - **Broke:** the interrupted final tool call had never created its handoff. The run was recovered from real receipts,
     never from the announced patch.
   - **Rules:**
     - Do not retry consumed intents.
     - Do not weaken source or origin guards.
     - An API redeploy loses build metadata, so use the accepted CLI export.
     - A healthy enabled endpoint is not acoustic quality.
   - Source: `rj:interrupted-activation-closeout-lessons-20260930@vy` L19358.

## Decisions at `@h206` that no harvest report cites (child, consent, teacher or Azure relevant)

| decision | line | what Taxila takes |
|---|---|---|
| `ws-r16-memory-consent-required-at-optin` | L8731 | A scheduled check-in is refused at opt-in (409) when memory consent is null, rather than skipped forever at the sweep. Fail at the moment the person chooses. |
| `ws-r20-handoff-act-is-inline-not-in-meera-consent` | L9461 | The boolean consent ledger may never gain a content column. A "saw this exact content and agreed" act is recorded on the content row with `sent_at` and `policy_version`. Extract a content-bearing consent primitive when a second caller appears. For Taxila, this means parent approval of a report or share. |
| `ws-r7-room-mounts-only-in-teacher-mode-for-v1` | L8284 (+ `rj:ws-r7-room-for-generic-mode-with-no-disclosure-pathway@vy` L6298, cited) | Never show a surface whose publish blocker points at a screen that mode never renders. |
| `teacher-publication-reviews-exact-saved-subject-20260907` | L23000 | Publishing requires the owner to review the exact saved id, version, content and consent snapshot. A missing binding stays "waiting on us" and is never covered by fabricated consent. |
| `private-teacher-draft-precedes-voice-activation-20260907` | L22723 | Store incomplete drafts without inventing a persona or consent. |
| `explicit-teacher-workspace-is-an-owner-selection-20260907` | L22968 | Teacher and share links had silently chosen the first workspace. Use an exact owned lookup with an explicit refusal when the id is unavailable. For Taxila, this applies to multi-child parent accounts: never default to child #1. |
| `expert-value-first-azure-serving-only-20260907` | L22563 | "Measured quality cannot silently authorize an external vendor." This mirrors Taxila's Azure-only directive. |
| `lane-order-azure-first-attachments` | L2147 | `hasAttachments` must also detect `image_url` parts already in history. Otherwise Azure-first never fires for the ordinary upload-then-history flow. |
| `d2-on-credits` | L357 | Judges paid from grant credits must clear an agreement backtest of at least 80% against archived blind verdicts before a full run. Anthropic judges are structurally unavailable on Azure credits. |

## Unread, and limits

- I read every heading match and every body match with a score of 3 or more in full. Body hits that scored 1-2 on the
  term set were not read; 34 entries scored 3 or more.
- I did not read `@vy`'s `decisions.md` beyond `ws-r115`, and I did not read `measurements.md`.
- I read `decisions.md@h206` only for the 52 heading matches, and in full only for the about 30 that touch consent or
  teacher work or carry a stated Azure lesson. Azure decisions about the identity verifier and transcription lanes
  (`azure-identity-needs-issued-contract-*`, `azure-fast-transcription-*`, `live-mirror-call-asr-*`) were not read in
  full, because they concern adult biometric identity, which Taxila refuses for minors (map §2.18).
- No code was executed. The line numbers are from the exported files.
- `comparison-seam32-consent-tie` records its own real-SQL proof on tied rows as pending. That is unverified at the
  source.
