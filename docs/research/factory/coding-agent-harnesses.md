# Coding-agent harnesses, and the Taxila Forge harness

**Date:** 2026-10-02 · **Question:** what makes open-source coding-agent harnesses work, and what is the narrowest reliable harness for "build one personalised, multi-level HTML5 educational game, validate it, ship it into the app while the teacher is still teaching"?
**Builds on, does not repeat:** `tech-and-market.md` §3 (T0–T3 tiers, Google's 3.5% → 69.3% critique loop, sandbox/CSP, bridge v1), `content/maths-engines.md` §3 and `content/science-engines.md` §2 (engine contract, bridge v2 events, `getState/setState`, misconception detectors), `context/decisions.md#forge-models` and `#forge-infra-azure`, `context/rejected.md#claude-on-foundry-credits`.

| tag | meaning |
|---|---|
| **[V]** | verified today in source code (shallow clones of the repos, file paths given) or the primary doc page |
| **[S]** | secondary: paper abstract, vendor blog, search summary; not checked against full text |
| **[M]** | from memory of the source, not re-checked this session |
| **[U]** | our design hypothesis or estimate; Taxila must measure it before relying on it |

> **Model availability conflict, read first.** The task brief lists `taxila-opus` / `taxila-sonnet` as available. `context/rejected.md#claude-on-foundry-credits` (same date) records that provisioning Claude on this Foundry resource **failed** (Marketplace purchase blocked), and `decisions.md#forge-models` set the Forge coder to `taxila-codex` (gpt-5.3-codex). This document therefore designs a **provider-neutral** harness: codex is the default builder, Claude is an arm in the bake-off the moment the deployment actually answers a request. Everything below works on either.

---

## 0. TL;DR (decisions this research forces)

1. **Build our own thin loop; do not embed a general agent.** A 2026 source study of 11 production harnesses (Claude Code, Codex CLI, Gemini CLI, OpenHands, Aider, mini-swe-agent, OpenCode, …) found **zero** use a general-purpose agent framework and none use vector retrieval; all are hand-rolled async loops with deterministic retrieval **[S, arXiv 2609.00006]**. mini-swe-agent's whole agent class is ~100 lines and scores >74% on SWE-bench Verified **[V, `agents/default.py`, README]**. Forge's loop is ~600–900 lines of TypeScript **[U]**.
2. **The harness is mostly the verifier, not the loop.** Every game-specific result says the same thing: one-shot generation fails silently, and execution feedback fixes it.
   - Google education generative UI: 3.5% pass single-shot → 69.3% after 10 critique rounds **[S]**.
   - OpenGame: zero-shot Build Health 58.4 → near plateau at T = 5 debug iterations **[S]**.
   - Play2Code: GUI-agent playtesting raises rubric pass to 66.8%, monotonic over ~3.24 rounds **[S]**.
   - PlayCoder: SOTA models compile but have "near-zero Play@3"; an iterative repair loop reaches 20.3% **[S]**.
3. **Verify by state injection, not by free play.** GameGen-Verifier patches the running game into a target state, runs a bounded input sequence and asserts. It scores **92.2% accuracy vs 58.8%** for an agent-as-verifier and runs **16.6× faster** **[S, arXiv 2605.07442]**. Taxila engines already require `getState()/setState()` (maths-engines R10), so this is cheap for us. It is the single most important validator.
4. **Templates beat freedom.** OpenGame's ablations:
   - removing the template-method skeleton costs **−10.1 Build Health and −11.6 Intent Alignment**;
   - an evolved template library beats a static skeleton by **+11.9 BH / +12.4 IA** **[S]**.

   Forge builds **on a Game Kit** (runtime, bridge, levels, input, audio, telemetry already written). The agent writes the *mechanic module* and *level data*, never the engine plumbing.
5. **Puzzle and UI games are the weak genre, and they are exactly ours.** OpenGame is weakest on puzzle/UI (52.6 IA) "due to silent logic failures" **[S]**. Educational games are mostly puzzle/UI. So the Forge validator must check *learning logic*: correct answers accepted, wrong answers rejected, the target misconception's distractor detected, every level solvable. Visual checks alone will not catch these failures.
6. **Separate the judge from the builder.** Anthropic's generator-evaluator harness found agents "confidently praise their own work even when quality is mediocre", and that a separate evaluator was "far more tractable" **[S]**. For the same retro-game-maker brief, a solo run ($9, 20 min) gave "entities on screen [that] did not respond to input"; the full harness ($200, 6 h) gave a playable game **[S]**. Forge's critic is a different model call with its own rubric. Its findings go back to the builder as a bug list, never as a score the builder can argue with.
7. **Tool surface: small, LM-shaped, fail-loud.**
   - **Edit format:** Codex's `apply_patch` grammar, with Codex's 4-pass fuzzy line matcher. Codex models are trained on it **[V]**.
   - **Edit gate:** SWE-agent-style. Reject any edit that introduces a new syntax error, and show the before/after window. Linting alone took SWE-agent from 15.0% to 18.0% **[S]**.
   - **Output caps:** head/tail truncation, at 10k chars in mini-swe-agent **[V]** and 10k tokens in Codex **[V]**.
   - **No network inside the sandbox.**
8. **Hard budgets, best-so-far, never empty-handed.** The caps are per job: tokens, dollars, wall clock, steps and consecutive format errors (mini-swe-agent has all of these **[V]**). On any cap the harness publishes the **best validated checkpoint**. If there is none, it falls back to an engine instance (T1) of the same objective, so the child never waits on a spinner.
9. **Personalise by data, build by exception.** Most "personalised" games are a reskin plus re-parameterisation of an already-validated game: new theme from interests, new numbers from ability, new distractors from misconceptions. That takes seconds and no agent. The agent only builds when no validated game exists for (objective × mechanic). Cache key: `(kit, mechanic, objective_id)`; the per-child spec is data **[U]**.
10. **Costs.** A full Forge build is estimated at **≈$0.6–1.2 on codex, ≈$1.5–3 on Opus 5.5**, p50 6–10 min wall clock **[U]**, before measurement. A reskin is <$0.01. Budget caps per job: **$2.50, 15 min, 40 builder steps** **[U]**.

---

## 1. What a harness is

An agent is a model plus a harness. The harness is the runtime that couples the model to the world through seven subsystems **[S, 2609.00006]**:

1. the **loop** (sample → parse → act → observe → repeat);
2. **tools** (their schemas *and* their observation formats);
3. **context management** (what the model sees on each request; truncation; compaction);
4. **safety** (sandbox, approvals, policy);
5. **orchestration** (subagents, planner/worker, evaluator);
6. **extension surfaces** (AGENTS.md, skills, MCP);
7. **persistence and telemetry** (trajectories, replay, resume).

The same study reports that across the eight systems it tracked over time, policy moved from prompt text to configuration **[S]**. For a narrow production harness such as Forge, that trend argues for **moving every rule that can be checked out of the prompt and into code**. A rule in a prompt is a suggestion; a rule in the validator is a fact.

---

## 2. The harnesses, at source level

### 2.1 OpenAI Codex CLI (Rust; Apache-2.0)

**Loop.** `core/src/session/turn.rs::run_turn` (3,223 lines) runs `loop { drain pending input → capture step context → sample → run tool calls → needs_follow_up? }` **[V]**. The turn ends when the model returns a message with no tool calls *and* no user input is pending. Compaction can run at three points **[V]**:

- before sampling (`run_pre_sampling_compact`, when `token_limit_reached`);
- mid-turn (when a follow-up is needed and the window is full);
- after the turn (`model_post_turn_compact_threshold_percent`).

A comment in the code notes that compaction is also the loop's guarantee against infinite growth ("as long as compaction works well in getting us way below the token limit, we shouldn't worry about being in an infinite loop") **[V]**.

**Prompt construction and caching.**
- Each request rebuilds the full prompt (instructions + tools + history). Total tokens sent grow **quadratically** in the number of turns.
- Codex relies on prefix caching, and keeps the tool list and instructions byte-stable for that reason.
- Moving from Chat Completions to the Responses API is reported as "40–80% better cache utilisation" **[S, secondary write-up of OpenAI's "Unrolling the Codex agent loop", 2026-01-23; the primary page returned 403 to our fetcher]**.
- Codex also injects a **token-budget reminder** as a context fragment when a rollout budget is configured (`session/rollout_budget.rs`, `RolloutBudgetContext{remaining_tokens}`) **[V]**. The model is told how much budget it has left; it is not simply cut off.

**Edit tool: `apply_patch`.** This is a *freeform* custom tool constrained by a Lark grammar (`core/assets/tools/apply_patch.lark`) **[V]**:

```
start: begin_patch hunk+ end_patch
hunk: add_hunk | delete_hunk | update_hunk
add_hunk:    "*** Add File: " filename LF add_line+
delete_hunk: "*** Delete File: " filename LF
update_hunk: "*** Update File: " filename LF change_move? change?
change: (change_context | change_line)+ eof_line?
change_context: ("@@" | "@@ " /(.+)/) LF       # anchor = a line such as "function update() {"
change_line: ("+" | "-" | " ") /(.*)/ LF
```

Properties that matter:

- There are no line numbers; hunks are located by context lines, with `@@ <anchor>` lines to disambiguate.
- `seek_sequence.rs` matches context lines in four decreasing-strictness passes **[V]**: exact, then rstrip, then trim, then Unicode-punctuation-normalised (typographic dashes and quotes become ASCII).
- The parser is deliberately lenient. It accepts whitespace around markers and a heredoc-wrapped body, and it intercepts `apply_patch <<'EOF' …` even when the model sends it through the shell tool (`apply-patch/src/parser.rs`, `invocation.rs`) **[V]**.

The OpenAI platform now ships the same idea as a built-in `apply_patch` tool type, which emits `apply_patch_call` and expects `apply_patch_call_output{status, output}`; the platform guidance is to return `status:"failed"` with a helpful message so the model can recover **[V, developers.openai.com tools-apply-patch]**. **Azure caveat:** on Azure OpenAI the built-in `apply_patch` reportedly stops being chosen when any custom tool is in the same request (gpt-5.3-codex, 5.4, 5.4-mini, since about 2026-03-13). The confirmed workaround is our own grammar tool, built from the Codex repo **[S, Microsoft Q&A 5828009]**. Forge should therefore ship its own `apply_patch` as a function tool whose argument is the patch text, parsed by a port of Codex's parser.

**Shell tool.** `exec_command` (unified exec) takes `{cmd, workdir, yield_time_ms, timeout_ms, max_output_tokens, sandbox_permissions, justification, prefix_rule}` **[V, `tools/handlers/unified_exec.rs`]**. Defaults **[V, `unified_exec/mod.rs`, `exec.rs`]**:

- `DEFAULT_MAX_OUTPUT_TOKENS = 10_000`;
- a 1 MiB `HeadTailBuffer` that keeps the first and last 50% and drops the middle, with an omission marker;
- `DEFAULT_EXEC_COMMAND_TIMEOUT_MS = 10_000`;
- `MAX_YIELD_TIME_MS = 30_000`, so long processes keep running and are polled with `write_stdin`;
- at most 64 background processes.

**Sandbox.**
- macOS: Seatbelt `.sbpl` profiles.
- Linux: bubblewrap is now the default filesystem sandbox. Landlock is the legacy path, and seccomp is used for network denial. If `bwrap` is missing, Codex falls back to a bundled `bwrap` (`linux-sandbox/README.md`) **[V]**.
- Modes: `read-only` | `workspace-write` (writes allowed in cwd and writable roots; network per config) | `danger-full-access` **[V, `prompts/templates/permissions/sandbox_mode/*`]**.

**Approvals.**
- `never` | `on-request` | `unless-trusted` **[V]**.
- Commands are split at `| && || ; ( ) $( )`, and each segment is evaluated separately. Redirection, substitution, env-assignment and globs are excluded from rule matching.
- The model asks for escalation with `sandbox_permissions:"require_escalated"` plus a `justification`, and may propose a persistent `prefix_rule`. Broad prefixes such as `["python3"]` are banned **[V, `approval_policy/on_request.md`]**.
- A **Guardian** subagent (an LLM risk classifier with an exfiltration-centred policy) can approve actions unattended **[V, `prompts/templates/guardian/policy.md`]**.

**AGENTS.md.** **[V, `protocol/src/prompts/base_instructions/default.md`; `config/mod.rs`]**
- Scope is the directory tree rooted at the file's folder; deeper files win.
- Direct system and user prompts beat AGENTS.md.
- Files from the repo root down to cwd are concatenated into the developer message, capped at `AGENTS_MD_MAX_BYTES = 32 KiB`.

**Compaction prompt.** The compaction prompt is short: "CONTEXT CHECKPOINT COMPACTION… handoff summary for another LLM: progress and key decisions, constraints, what remains, critical data". The resumed model sees "Another language model started to solve this problem and produced a summary…" **[V, `prompts/templates/compact/*`]**.

**Headless use.** Codex also runs headless:
- `codex exec` takes `--output-schema FILE` (a structured final answer) and emits JSONL events **[V, `exec/src/cli.rs`]**.
- An Azure provider is a config block: `base_url = "https://<res>.openai.azure.com/openai"`, `env_key`, `query_params.api-version`, `wire_api = responses` **[V, `model-provider-info` tests]**.

That makes **`codex exec` inside our container a zero-code baseline arm** for the bake-off (§6).

**Prompt lessons from the Codex system prompts** (`gpt-5.2-codex_prompt.md`, `default.md`) **[V]**:
- "keep going until the query is completely resolved";
- "do not waste tokens by re-reading files after calling apply_patch… the tool call will fail if it didn't work";
- iterate on formatting "up to 3 times", then report;
- use plans only for non-trivial work;
- start testing as specific as possible, then broaden.

The frontend section explicitly fights "AI slop": an expressive font, CSS variables, a clear visual direction, a few meaningful animations, no purple-on-white defaults. Forge's art direction should be **kit-owned, not prompt-owned** (§5.8).

### 2.2 mini-swe-agent (Python; MIT): the minimal baseline

**The loop** (`src/minisweagent/agents/default.py`, 190 lines incl. serialisation) **[V]**:

```
messages = [system, instance(task)]
while last.role != "exit":
    try:  check limits (step_limit, cost_limit, wall_time_limit_seconds) → raise LimitsExceeded/TimeExceeded
          msg = model.query(messages); outputs = [env.execute(a) for a in msg.actions]; append observations
    except FormatError: count; after max_consecutive_format_errors (3) → exit "RepeatedFormatError"
    finally: save trajectory to disk (every step)
```

The SWE-bench config has these properties **[V, `config/benchmarks/swebench.yaml`]**:

- Limits are `step_limit: 250` and `cost_limit: $3`.
- **Bash is the only tool.** Every action runs in a **fresh subshell**, so `cd` and env do not persist, which removes a whole class of state bugs.
- There is a 60 s timeout per command.
- `PAGER=cat` and `TQDM_DISABLE=1`, so no interactive output.
- Output over 10,000 chars is replaced by a warning ("try head/tail/grep…") followed by the first 5,000 and last 5,000 chars and an elided count.
- **Submission is a sentinel.** The task ends when a command's first output line is `COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT` and the exit code is 0. The instructions make the agent build `patch.txt`, inspect it, then submit in a *separate* command.

The lesson is that a capable model needs very little scaffolding, *if* observations are clean and limits are hard. Its weakness is that nothing checks the output except the model. That is fine for SWE-bench, where hidden tests grade it, and fatal for games, where nothing does.

### 2.3 SWE-agent (Python; MIT): the Agent-Computer Interface

- **Headline results.** 12.5% on SWE-bench vs 3.8% prior **[S]**. The ACI beats the plain Linux shell by **+10.7 pp** on a 300-issue subset **[S]**.
- **Lint gate on edits** (`tools/windowed_edit_linting/bin/edit`) **[V]**:
  - flake8 is run before and after the edit;
  - if the edit introduces *new* errors, it is **reverted**, and the agent sees the errors, "how your edit would have looked", the original window, and "DO NOT re-run the same failed edit command".
  - This is worth 15.0% → 18.0% **[S]**.
- **Review-on-submit** (`tools/review_on_submit_m`, `config/default.yaml`) **[V]**. The first `submit` does not submit. It shows the full diff and a checklist (re-run your reproduction script, remove it, revert test edits). Only a second `submit` is accepted.
- **Other ACI details** **[M]**: a windowed file viewer (100 lines with line numbers), a search tool with capped results, and an empty-output message ("Your command ran successfully and did not produce any output") so the model never guesses whether something happened (`next_step_no_output_template`) **[V]**.

### 2.4 Aider (Python; Apache-2.0): edit formats and the reflection loop

- **Edit formats.** Aider offers whole-file, SEARCH/REPLACE (`editblock`), unified diff (`udiff`), `patch`, and "editor" variants (`aider/coders/*`) **[V]**.
- **Format choice moves scores.** GPT-4 Turbo scored 20% with SEARCH/REPLACE and **61% with udiff**, and lazy "…rest of code…" comments fell 3× **[V, `website/_posts/2023-12-21-unified-diffs.md`]**. The format is a model-specific knob, which is why Codex trains its models on one grammar.
- **Failure feedback is diagnostic.** A failed SEARCH block returns "SearchReplaceNoExactMatch… Did you mean to match some of these actual lines…", built from `find_similar_lines`. Matching itself falls back from exact to whitespace-tolerant to fuzzy (`editblock_coder.py`) **[V]**.
- **Reflection loop** (`base_coder.py`) **[V]**:
  - after edits, auto-lint;
  - on errors, set `reflected_message = lint_errors` and loop;
  - then run `test_cmd` and reflect on failures;
  - cap at **`max_reflections = 3`**.
- **Repo map.** tree-sitter tags feed a PageRank (networkx) over a symbol graph, personalised to the files in chat, within `map_tokens = 1024` **[V, `repomap.py`]**. Forge does not need a repo map, because a kit is small and its API doc is hand-written.
- **Architect/Editor.** A reasoning model describes the change and a second model emits the edits. o1-preview with DeepSeek or o1-mini as editor reached 85% on Aider's benchmark (SOTA at the time) **[V, `2024-09-26-architect.md`]**. Forge's planner → builder split is this pattern.

### 2.5 OpenHands (Python; MIT core): CodeAct, condensers, stuck detection

- **CodeAct: actions are code** (bash, IPython, a `str_replace_editor`, a browser). smolagents cites the CodeAct paper for "30% fewer steps" and higher performance on hard benchmarks **[V, smolagents README → arXiv 2402.01030]**.
- **Tool-surface ablation.** A 2026 ablation found that restricting Claude Code or Codex to a single `execute_code` tool was *statistically tied* on pass rate with tool-rich setups, and cheaper or tied on cost in 3 of 4 cells. "Cache-adjusted cost, not pass rate, drives the meaningful signal" **[S, arXiv 2607.10569]**. Tool count is not the lever; observation quality and verification are.
- **Condenser.** `LLMSummarizingCondenser` keeps the head events plus recent events and replaces the middle with an LLM summary when history exceeds `max_size` **[S, docs]**. It **halves cost per turn**, turning quadratic cost growth into linear. On SWE-bench Verified, 54% vs 53% baseline; at 100 iterations, 200 vs 203 resolved **[S, OpenHands blog]**.
- **SDK v1** (MLSys 2026): event-sourced state, sandboxed workspace, multi-LLM routing, **stuck detection**, a security analyser **[S, arXiv 2511.03690]**. The stuck detector flags the same action+observation repeated about 4×, the same action with an error 3×, monologue loops, and alternating A/B patterns **[M]**.

### 2.6 smolagents (Python; Apache-2.0)

`CodeAgent` uses these defaults:

- `max_steps = 20`;
- an optional `planning_interval` (it re-plans every N steps);
- **`final_answer_checks: list[Callable]`**, validators that must pass before a final answer is accepted (`agents.py`) **[V]**.

The local executor is an AST interpreter with an import allowlist, banned dangerous modules and functions, `MAX_OPERATIONS = 10,000,000` and `MAX_WHILE_ITERATIONS = 1,000,000` (`local_python_executor.py`) **[V]**. `final_answer_checks` is the right abstraction for Forge's `submit`: submission is a request that validators may refuse.

### 2.7 Goose (Block; Rust; Apache-2.0)

Recipes are portable YAML bundles. Each one holds instructions, extensions (MCP), parameters, provider settings, **retry logic** and a **structured response schema**. Sub-recipes run as independent subagents with their own provider, extensions and prompt, and a lead/worker split puts planning and execution on different models **[S, Goose docs]**. Forge's per-job configuration should look like a recipe: versioned, declarative and diffable (§5.4 `ForgeRecipe`).

### 2.8 Cline and Roo Code (TypeScript; Apache-2.0)

- **Plan/Act modes.** The model plans read-only, then acts **[M]**.
- **Shadow-git checkpoints** let any step be rolled back **[M]**.
- **Strict SEARCH/REPLACE breaks under load.** Cline's `replace_in_file` with strict SEARCH/REPLACE fails often on long sessions. The model then falls back to `write_to_file`, which "eats tokens" and sometimes **corrupts content**, and one bug reported success on an unmodified file (issues #1195, #1511, #3183, #3513, #8779) **[S]**.
- **Roo's `apply_diff`** answers this with fuzzy matching: Levenshtein on normalised strings, a `:start_line:` hint, a middle-out search within `bufferLines`, and a configurable threshold (default 1.0, i.e. exact) **[S, Roo docs]**.

Two lessons for Forge: verify every write by re-reading and hashing, and never let a failed edit silently degrade into a whole-file overwrite of a large file.

### 2.9 Claude Agent SDK (TypeScript/Python; Claude Code as a library)

`query(prompt, options)` options include **[V, code.claude.com/docs/en/agent-sdk/typescript]**:

| group | options |
|---|---|
| limits | `maxTurns`, `maxBudgetUsd` |
| permissions | `permissionMode` (`default` / `acceptEdits` / `bypassPermissions` / `plan` / `dontAsk` / `auto`), `allowedTools` / `disallowedTools` (scoped rules such as `Bash(rm *)`), a `canUseTool` callback |
| hooks | including `PreCompact` / `PostCompact` |
| orchestration | `agents` (subagents), `sandbox` |
| output | `outputFormat: {type:"json_schema"}` |
| isolation | `settingSources: []` (ignore filesystem settings) |
| model | `effort`, `fallbackModel` |

Result subtypes are `error_max_turns`, `error_max_budget_usd`, `error_max_output_tokens` and others. On Azure, set `CLAUDE_CODE_USE_FOUNDRY=1` plus `ANTHROPIC_FOUNDRY_RESOURCE` (or `_BASE_URL`), `ANTHROPIC_FOUNDRY_API_KEY` or Entra ID, and **pin** `ANTHROPIC_DEFAULT_OPUS_MODEL` / `_SONNET_MODEL`, because unpinned aliases fall back to an older default **[V, code.claude.com/docs/en/microsoft-foundry]**.

The tool semantics worth copying:
- Edit means "`old_string` must be unique, and the file must have been read first" **[M]**.
- Tool responses are capped at 25k tokens by default **[S, Anthropic "Writing tools for agents"]**.

The Agent SDK is the third bake-off arm. It cannot be the production default while Claude-on-Foundry is blocked.

**Claude-on-Foundry constraints a harness must respect** **[V, claude-api skill platform table, cached 2026-09-25]**:
- Supported: prompt caching, structured outputs / strict tools, adaptive thinking / effort, compaction (beta) and context editing (beta).
- **Not** supported: Message Batches, task budgets, mid-conversation system messages or server-side fallbacks.
- Opus 5.5 and Sonnet 5.5 **reject forced `tool_choice` (`any` / `tool`) with a 400**. Use `auto` with a strict schema plus a prompt instruction.
- **Preserved thinking** binds thinking blocks to an unedited history, so the harness must be **append-only**: no rewriting old turns. Compact by starting a fresh context with a handoff, not by editing earlier turns.
- Prices: Opus 5.5 $4 / $20 per MTok (cache read $0.20); Sonnet 5.5 $2 / $10 (cache read $0.20); 1M context; 128K output.

### 2.10 Anthropic's planner–generator–evaluator harness (2026)

**[S, anthropic.com/engineering/harness-design-long-running-apps]**

- **Structure.** A planner expands a short prompt into a product spec. A generator builds in chunks. A skeptical evaluator drives the live app with **Playwright** (navigate, screenshot, test), grades it on explicit criteria, and files precise bugs.
- **Sprint contract.** Before each chunk, the generator and evaluator agree, via shared files, on what will be built and *how it will be verified*.
- **Context.** Sonnet 4.5 showed "context anxiety", wrapping up early near its perceived limit. **Context resets** (a fresh window with a handoff) beat compaction.
- **Scaffolding is temporary.** With Opus 4.6, sprint decomposition could be removed and evaluation moved to a single end-of-build pass. Every component encodes an assumption about model weakness, so **remove one at a time and measure**.
- **The evaluator is needed** only when the task sits beyond what the model does reliably solo. Games for children do.

### 2.11 Game-specific evidence (2025–2026)

| work | what it does | numbers | rule for Forge |
|---|---|---|---|
| **OpenGame** (arXiv 2604.18394) | Phaser 3; phases: classify → scaffold → design doc → assets → code → verify; *Template Skill* (meta-template evolving into 5 physics families) + *Debug Skill* (a living debugging protocol updated from build, test and runtime outcomes); static analysis + headless browser | Sonnet 4.6 in harness: BH 72.4 / VU 67.2 / IA 65.1 (beats the Cursor baseline by +5.6 / +5.8 / +6.2); template ablation −10.1 BH; debug plateau at T = 5; puzzle/UI weakest | build on kits; keep a **debug protocol file** that grows from failures; cap repair at about 5 rounds per validator stage |
| **GameGen-Verifier** (2605.07442) | split the spec into **keypoints**; for each: patch runtime state → bounded execution → assertion; run in parallel | 92.2% vs 58.8% accuracy; 16.6× faster | keypoint tests via `window.__forge.setState / step / getState` |
| **Play2Code / PlaytestArena** (2605.28258) | a GUI agent plays the build through real inputs and returns a summary plus a **fix list mapped to code**; 200 tasks, 8 genres | 66.8% rubric pass; GUI-vs-human agreement 84.2%, κ 0.64 (human-human κ 0.66); about 3.24 effective rounds; GUI agents fail at timing and small or low-contrast UI | use the GUI playtest *only* for what state injection cannot see (feel, discoverability), and send it a fix list, not a score |
| **PlayCoder** (2604.19742) | PlayTester walkthroughs plus multi-agent repair | near-zero Play@3 one-shot → 20.3% Play@3 | compile ≠ playable; gate on play |
| **ArtifactsBench** (2507.04952) | render, **3 temporal screenshots**, MLLM judge with a per-task checklist; code-aware | 94.4% agreement with human votes; multiple screenshots and code-awareness both help | visual critic sees 3 time-separated frames plus code plus checklist |
| **V-GameGym** (2509.20136) | 2,219 Pygame tasks; screenshot and video analysis | best model about 45% | free-form game generation is hard even for frontier models |

---

## 3. Cross-harness comparison

| dimension | Codex CLI | mini-swe-agent | SWE-agent | Aider | OpenHands | Claude Agent SDK | **Forge (proposed)** |
|---|---|---|---|---|---|---|---|
| loop | hand-rolled async, turn/step | 30-line while | step + parse | reflect ≤ 3 | event-sourced | Claude Code loop | hand-rolled, step-capped, stage machine |
| edit | `apply_patch` grammar, 4-pass fuzzy | `sed` / heredoc via bash | line-range edit + lint gate | SEARCH/REPLACE / udiff | `str_replace` + code | `Edit` (unique `old_string`) | `apply_patch` (Codex grammar) + syntax gate + allowlisted paths |
| shell | yes, sandboxed, yield/poll | only tool, fresh subshell | yes | user-run | yes | yes | **no free shell**; `run_check(name)` menu |
| output cap | 10k tokens, head/tail | 10k chars, head/tail | windowed | n/a | condenser | 25k tokens | 6k tokens, head/tail plus "first error" extraction |
| self-test | model-driven | model-driven | review-on-submit | lint + test cmd | model-driven | hooks | **validator-driven, mandatory, separate critic** |
| budget | token budget reminder | steps, $, wall, format errors | $ | reflections | iterations | `maxTurns`, `maxBudgetUsd` | steps, tokens, $, wall, per-stage rounds, format errors |
| context | auto-compact (handoff) | none | last-n caching | repo map | condenser | compaction | **fresh context per repair round** with a structured handoff |
| sandbox | bwrap / seatbelt, network off | docker | docker | none | docker / remote | `sandbox` option | ACA job / dynamic session; network off; read-only kit |

---

## 4. Twenty design principles for a narrow "build one HTML5 educational game" agent

Each principle gives the evidence, then the Forge rule.

**Scope and structure**

1. **Narrow the task until verification is decidable.** SWE-bench works because hidden tests decide; games have no hidden tests unless we write them (PlayCoder near-zero Play@3). *Rule:* every Forge job carries a machine-checkable **GameSpec** written by the planner *before* any code: levels, win conditions, keypoints, solution paths, expected telemetry. If the planner cannot write the keypoints, the game is out of scope.
2. **Build on a kit; generate the delta.** Templates: +11.9 BH, and removing the skeleton costs −10.1 BH (OpenGame). *Rule:* the agent may write only `src/mechanic.ts`, `src/levels.json`, `src/theme.json` and `src/scenes/*.ts`. Runtime, bridge, input, audio, accessibility and telemetry are read-only kit code.
3. **Plan, contract, build, judge, as separate roles.** Architect/Editor reached 85% (Aider); the planner/generator/evaluator harness with sprint contracts (Anthropic). *Rule:* the planner (`taxila-brain`) emits the spec; the builder (`taxila-codex`) implements it; the critic (another model or family) judges. The spec *is* the sprint contract.
4. **Phase the work and gate each phase.** OpenGame's six phases; Google's plan → leveled goals → UI → guidance. *Rule:* a stage machine `SPEC → SCAFFOLD → BUILD → VERIFY(v0…v6) → POLISH → PUBLISH`. The builder cannot reach a stage until the previous gate is green.

**Tools**

5. **Few tools, each shaped for the model, not for a human.** ACI +10.7 pp over shell (SWE-agent), but tool count does not matter (2607.10569). *Rule:* six tools (§5.3), with consistent names, a strict JSON schema and short descriptions that say when *not* to use them.
6. **Use the edit format the model was trained on, with forgiving matching and loud failure.** Codex grammar plus 4-pass `seek_sequence`; udiff 20% → 61% for GPT-4T (Aider); Cline's strict-match failures. *Rule:* port Codex's parser and matcher. On failure, return the closest actual lines (Aider's "did you mean"), never apply partially, and never fall back silently to whole-file writes.
7. **Gate edits on syntax.** Lint gate 15 → 18% (SWE-agent). *Rule:* after every patch, run an esbuild transform (milliseconds) on the touched files. If the patch introduces new errors, revert it and show the errors plus a ±10-line window. A broken file never persists between steps.
8. **Observations are compact, deterministic and complete.** Head/tail caps (mini-swe-agent, Codex); an explicit message on empty output (SWE-agent); 25k cap (Claude Code). *Rule:*
   - cap every observation at about 6k tokens, head and tail;
   - put the *first* error with file:line above the dump;
   - strip ANSI and timestamps, and sort lists;
   - always report exit status and duration.

   Deterministic output keeps the prompt-cache prefix stable.
9. **No network and no free shell in the build sandbox.** Codex `workspace-write` with network off; approval policies exist because shells are dangerous. *Rule:* the sandbox has no egress, and the only commands are named checks (`typecheck`, `build`, `keypoints`, `playtest`, `shots`). The model loop runs *outside* the sandbox ("brain outside, hands inside"), so no model key ever enters it.

**Loop and context**

10. **Budgets are hard, multi-dimensional and visible to the model.** mini-swe-agent: steps, $, wall time, format errors; Codex budget reminders. *Rule:* per-job caps on steps, input and output tokens, $, wall clock, plus rounds per validator stage. Each observation footer shows `budget: 14/40 steps · $0.61/$2.50 · 5:12/15:00`.
11. **Fresh context per repair round instead of an ever-growing transcript.** Anthropic: context resets > compaction; OpenHands condenser 2× cheaper at equal score; quadratic cost growth; Claude preserved thinking requires append-only history. *Rule:* the builder conversation runs for one stage at a time. Between stages the harness writes a structured **handoff** (spec, file list with hashes, open bug list, debug-protocol entries) and starts a new conversation. History is never edited in place.
12. **Keep the stable prefix stable.** Codex's caching rationale; any byte change invalidates the cache after it. *Rule:* the order is system prompt (frozen per kit version) → kit API doc → FORGE.md → spec → handoff → turns. No timestamps or job ids in the prefix. The tool list is fixed per recipe version.
13. **Detect "stuck" mechanically.** OpenHands stuck detector; SWE-agent's "DO NOT re-run the same failed edit". *Rule:* hash (tool, args) and (observation). The same failing pair twice injects a "this exact action already failed: <why>" note; three times ends the stage with best-so-far. Three consecutive format errors also end it.
14. **Checkpoint every green state; roll back on regression.** Shadow-git checkpoints (Cline); best-of-trajectory. *Rule:* run `git commit` in the workspace after every validator pass. A regression (a previously green keypoint goes red) auto-reverts to the last green commit, with the diff shown to the model.

**Verification**

15. **The verifier is code first, model second.** GameGen-Verifier 92.2% vs 58.8% agent-as-verifier; puzzle/UI fails silently (OpenGame). *Rule:* validator order is static → build → boot → **keypoint state-injection tests** → scripted solve of every level → visual critique → pedagogy and safety. Cheap, deterministic checks always run first; a model critique never runs on a build that fails a deterministic check.
16. **The planner authors the solutions; the harness proves them.** *Rule:* for every level the spec includes a solution path (a sequence of semantic actions) and at least one **misconception path**: the wrong move a child with misconception X makes, and the event the game must emit (`misc_signal` / `probe_result:misc`). The harness replays both. A level that cannot be solved, or that fails to recognise the misconception, fails.
17. **Separate, skeptical judge with a checklist and temporal evidence.** Self-evaluation leniency (Anthropic); 3 temporal screenshots plus code plus checklist reach 94.4% agreement (ArtifactsBench). *Rule:* the critic gets three frames per level (start, mid-interaction, end), the spec checklist and the source. It returns `{criterion, pass, evidence, fix}[]`. Only `fix` items reach the builder.
18. **Submission is a request that validators may refuse.** `final_answer_checks` (smolagents); review-on-submit (SWE-agent). *Rule:* `submit()` runs the full gate. If anything is red, the call returns the red list and the loop continues while budget remains.
19. **Never ship nothing; degrade gracefully.** Budget caps (mini-swe-agent, Claude SDK `error_max_budget_usd`). *Rule:* on any stop condition, publish the best checkpoint that passes the *safety and boot* gates, with levels trimmed to those that passed keypoints. If none qualifies, return `fallback: engine T1 spec` for the same objective. The teacher is told which one arrived.
20. **Learn across jobs, not within a prompt.** OpenGame's living Debug Skill and evolving templates; Anthropic's "remove one component at a time". *Rule:*
    - every failure class that recurs three times becomes either a kit fix, a validator rule, or a one-line entry in `FORGE.md` §Pitfalls (capped at 40 lines, written as shapes, not sentences);
    - every month, re-measure with each scaffold removed;
    - mechanics that pass repeatedly are promoted into kits (T2 → T0/T1 per `tech-and-market` §3.2).

---

## 5. Taxila Forge harness architecture

### 5.1 Where Forge sits

```
 lesson (voice teacher, realtime)                       app (child)
   │  Director decides "a game would help here"            ▲  iframe sandbox="allow-scripts", bridge v2 events
   ▼                                                       │
 POST /api/forge/jobs  ──►  Forge API (Vercel, thin)  ──►  Azure Storage Queue `forge-jobs`
                                                            │
                                    ┌───────────────────────▼───────────────────────────┐
                                    │ forge-orchestrator (Container App, always-on, 1–N)│
                                    │  ├─ Reuse resolver: cached game? → reskin (no LLM) │
                                    │  ├─ Planner (taxila-brain) → GameSpec (strict JSON)│
                                    │  ├─ Builder loop (taxila-codex | claude arm)       │
                                    │  ├─ Critic (other model, vision)                   │
                                    │  └─ Ledger: budgets, events, trajectory → Blob     │
                                    └──────────┬───────────────────────▲─────────────────┘
                                   tool calls  │  (HTTP, mTLS)         │ observations
                                    ┌──────────▼───────────────────────┴───────────────┐
                                    │ forge-sandbox (ACA dynamic session, custom image) │
                                    │  node 22, esbuild, tsc, playwright+chromium,      │
                                    │  /kit (read-only), /work (git), NO egress         │
                                    └──────────────────────────┬────────────────────────┘
                                                               │ publish (orchestrator copies dist)
                                     Blob `taxilaforge/forge/<artifactId>/index.html` (+ manifest.json)
```

- **Brain outside, hands inside.** The model loop and the keys live in the orchestrator, and the sandbox only executes named tools. This is the Codex sandbox philosophy taken one step further: the sandbox has no credentials to leak and no network to leak them over.
- **Sandbox choice.** ACA dynamic sessions with a custom container give Hyper-V isolation per session and a pre-warmed pool ("millisecond" allocation) **[S, Microsoft Learn]**. The existing decision (`forge-infra-azure`) is plain Container Apps workers, with dynamic sessions as the reversal path once per-student isolation matters. Running *generated code* in Chromium is that case, so **adopt dynamic sessions for the sandbox and keep the orchestrator as a normal Container App** **[U; reversal: if dynamic-session custom containers cannot run Chromium within limits, fall back to ACA Jobs with network-deny NSG]**.
- **Tier placement.** Forge output is a new tier between T2 and T3. It is free-form *within a kit*, validated automatically, and *not* human-reviewed before a child sees it, but only if every deterministic gate is green **[U; this relaxes `tech-and-market` §3.6 "T2 requires human review"]**. That relaxation needs an explicit owner decision and a sampled human audit (§5.9 V7). The default until then: Forge games ship to the child in a lesson only after a validated **reskin** of a human-approved base game. New mechanics enter the library through review.

### 5.2 The job lifecycle (stage machine)

| stage | actor | input → output | gate | caps (default) |
|---|---|---|---|---|
| S0 RESOLVE | code | brief → `{reuse: artifactId, patch: SpecPatch}` or `build` | cache hit on `(kit, mechanic, objective)` with a validated base | < 1 s |
| S1 SPEC | planner (brain, structured output) | brief + kit manifest → `GameSpec` | zod validation; every level has a solution and a misconception path; keypoints ≥ 3 per level | 2 attempts, 60 s |
| S2 SCAFFOLD | code | kit template + spec → `/work` git repo | `build` green | 10 s |
| S3 BUILD | builder loop | spec + kit doc → mechanic/scene code | v0–v2 green | 20 steps |
| S4 VERIFY | validators, then builder repairs | keypoints, scripted solves, telemetry | v3–v4 green | 5 repair rounds × 8 steps |
| S5 CRITIQUE | critic, then builder fixes | 3 frames/level + checklist → fix list | v5 no `blocker`; v6 safety green | 2 rounds |
| S6 PUBLISH | code | dist → Blob + manifest; announce | hash re-check; CSP header; size ≤ 1.5 MB | 10 s |

Job-wide caps **[U]**: 40 builder steps, 15 min wall clock, $2.50, 1.5M input tokens, 80k output tokens. On a cap, the best green checkpoint goes to S6 (principle 19).

### 5.3 Tool set (the builder sees exactly these)

| tool | args | behaviour | observation |
|---|---|---|---|
| `read_file` | `{path, offset?, limit?≤400}` | paths under `/work` or `/kit/docs` | numbered lines, total line count, `sha` |
| `apply_patch` | `{patch: string}` (Codex grammar) | path allowlist (`src/**`, `assets/manifest.json`); 4-pass fuzzy match; atomic; esbuild syntax gate on touched files; revert on new errors | `ok` + per-file `+/-` counts + new `sha`, or `failed` + reason + "closest lines" + error window |
| `run_check` | `{name: "typecheck"\|"build"\|"keypoints"\|"solve"\|"boot"}` | runs the named script in the sandbox with a fixed timeout (5–60 s) | `PASS/FAIL`, first error with file:line, ≤ 6k tokens head/tail, `ms` |
| `screenshot` | `{level, at: "start"\|"mid"\|"end"}` | Playwright at 360×640 and 1280×800, after the spec's scripted actions | image (to vision-capable builders), else the critic's text description |
| `note` | `{kind: "plan"\|"hypothesis"\|"debug_protocol", text≤400}` | appended to the handoff; `debug_protocol` notes are candidates for FORGE.md pitfalls | `ok` |
| `submit` | `{summary≤300}` | runs the gates for the current stage; refuses if red | `accepted` or the red list |

There is no `write_file` for existing files and no shell. New files go through `*** Add File:`. `apply_patch` is a *function* tool whose argument is the patch text (the Azure built-in `apply_patch` tool type misbehaves alongside custom tools **[S]**). With Claude, use `tool_choice:auto` with `strict:true` (forced choice returns a 400).

### 5.4 TypeScript contracts

```ts
// shared/forge.ts
export type ForgeKind = "game" | "sim" | "worksheet";                    // video/image/song go to other pipelines
export interface ForgeBrief {
  jobId: string; childRef: string;                                        // opaque id; never a name (DPDP)
  objectiveIds: string[]; topicIds: string[];
  misconceptions: { id: `MC.${string}`; confidence: number }[];           // from learner model
  ability: { band: "c1-2" | "c3-5" | "c6-8" | "c9"; mastery: number; readingLevel: 1 | 2 | 3 | 4 | 5 };
  interests: string[];                                                    // tags, e.g. ["cricket","trains"]
  vibe: { pace: "calm" | "brisk"; humour: 0 | 1 | 2 };
  lang: "en" | "hi" | "hi-Latn+en"; numerals: "latn" | "deva";
  kitHint?: string; deadlineMs: number;                                   // teacher wants it by this point in the lesson
}
export interface ForgeRecipe {                                            // Goose-style, versioned, diffable
  id: string; version: number; kit: `${string}@${number}`;
  models: { planner: string; builder: string; critic: string };           // deployment names
  caps: Budget; stageRounds: Record<StageId, number>;
  promptHash: string; toolsHash: string;                                  // cache-prefix stability is tested in CI
}
export type StageId = "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
export interface Budget { steps: number; wallMs: number; usd: number; inTok: number; outTok: number; formatErrors: number }

export interface GameSpec {                                               // the sprint contract; written by the planner
  kit: string; mechanic: string;                                          // "sort-into-bins", "number-line-jump", "balance-pan"...
  title: L10n; theme: { skin: string; palette: string; motifs: string[] };// interests become motifs, never mascots in-play
  levels: LevelSpec[];                                                    // 3–6 levels; difficulty monotone
  telemetry: string[];                                                    // bridge v2 event types the game must emit
  accessibility: { tapOnly: true; minTargetDp: 40 | 48; captions: boolean };
}
export type L10n = { en: string; hi: string };
export interface LevelSpec {
  id: string; goal: L10n; params: Record<string, unknown>;
  solution: Action[];                                                     // replay must reach win
  miscPaths: { misc: `MC.${string}`; actions: Action[]; expectEvent: { event: string; misc: string } }[];
  keypoints: Keypoint[];
}
export type Action = { type: string; [k: string]: string | number | boolean };   // semantic, e.g. {type:"drop", item:"3/4", bin:"gt_half"}
export interface Keypoint {                                               // GameGen-Verifier style
  id: string; setup: Record<string, unknown>;                             // passed to __forge.setState
  actions: Action[];                                                      // bounded
  assert: { path: string; op: "eq" | "gt" | "lt" | "includes" | "emitted"; value: unknown }[];
}
// Kit runtime exposes, in test builds only:
// window.__forge = { setState(s), getState(): object, act(a: Action), step(ms), events(): BridgeEvent[] }

export interface Observation { ok: boolean; text: string; images?: string[]; ms: number; budgetFooter: string }
export interface CheckReport { stage: StageId; check: string; pass: boolean; firstError?: { file: string; line: number; msg: string }; details: string }
export interface CritiqueItem { criterion: string; severity: "blocker" | "major" | "minor"; pass: boolean; evidence: string; fix: string }
export interface ForgeResult {
  jobId: string; status: "published" | "published_partial" | "fallback_engine" | "failed";
  artifactId?: string; url?: string; levelsShipped: number; levelsPlanned: number;
  fallback?: { engine: string; spec: unknown };
  ledger: { steps: number; usd: number; inTok: number; outTok: number; cachedTok: number; wallMs: number; byStage: Record<StageId, number> };
  trajectoryBlob: string;                                                 // full replayable trajectory (mini-swe-agent habit)
}
```

### 5.5 The builder loop (pseudocode, about 150 lines in production)

```ts
async function runStage(job: Job, stage: StageId): Promise<StageOutcome> {
  const conv = freshConversation(job.recipe, handoff(job));          // P11: new context per stage; append-only within it
  let rounds = 0, lastGreen = job.git.head();
  while (true) {
    const cap = job.ledger.check();                                  // P10: steps, $, tokens, wall
    if (cap) return { kind: "capped", reason: cap, best: job.bestGreen };
    const msg = await model(job.recipe.models.builder).sample(conv); // stream; effort per stage (medium for BUILD)
    job.ledger.add(msg.usage);
    const calls = parseToolCalls(msg);
    if (calls.error) {                                               // malformed call / no call
      if (++job.formatErrors >= job.recipe.caps.formatErrors) return { kind: "format_fail", best: job.bestGreen };
      conv.push(formatErrorObservation(calls.error)); continue;      // template says exactly how to call tools
    }
    job.formatErrors = 0;
    for (const c of calls.list) {
      const sig = hash(c.name, c.args);
      if (job.failedSigs.get(sig) >= 2) { conv.push(stuckNote(c)); return { kind: "stuck", best: job.bestGreen }; }  // P13
      const obs = await sandbox.exec(c);                             // P9: named tools only
      if (!obs.ok) job.failedSigs.inc(sig);
      if (c.name === "submit") {
        const gate = await runGates(job, stage);                     // P18: submission may be refused
        if (gate.green) { job.git.commit(stage); job.bestGreen = job.git.head(); return { kind: "green" }; }
        if (++rounds > job.recipe.stageRounds[stage]) return { kind: "rounds_exhausted", best: job.bestGreen };
        if (gate.regressed) job.git.reset(lastGreen);                // P14
        conv.push(gateObservation(gate));                            // red list, first errors, critic fixes
      } else conv.push(obsWithFooter(obs, job.ledger));              // P8 + P10 footer
    }
  }
}
```

The orchestrator runs `S1…S6` in order. Each stage gets a fresh conversation built from the handoff, so the builder never carries more than about 40k tokens **[U]**. Compaction is never needed, and Claude's append-only rule holds by construction.

### 5.6 Validators (the real product)

| id | check | how | cost |
|---|---|---|---|
| V0 static | banned APIs, size, path allowlist | acorn AST: no `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, `Function`, dynamic `import()`, `localStorage`, `document.cookie`, `window.open`, `top`/`parent` (except the bridge); bundle ≤ 1.5 MB; no external URLs | ms |
| V1 build | `tsc --noEmit` on `src/**` + esbuild bundle | note: a bundler alone exits 0 with type errors, so tsc is separate (same lesson as Meera's `verify-release`) | 2–6 s |
| V2 boot | headless Chromium at 360×640 | loads with no console error, emits `ready` within 3 s, canvas or DOM not blank (pixel variance), ≥ 50 fps median over 5 s on a 4× CPU-throttled profile | 8 s |
| V3 keypoints | `__forge.setState → act* → assert` per keypoint, in parallel pages | GameGen-Verifier style; all keypoints of a level must pass for that level to ship | 5–20 s |
| V4 solve | replay `solution` per level, then each `miscPath` | win reached; each misc path emits `misc_signal`/`probe_result:misc` for its id; bridge v2 schema-valid; required telemetry types all seen | 5–15 s |
| V5 critique | separate model; 3 frames per level × 2 viewports + spec checklist + source | ArtifactsBench-style checklist: goal legible without reading (age band), feedback visible ≤ 300 ms, hit targets ≥ spec dp, contrast ≥ 4.5:1 for text, no seductive details (maths-engines R6), theme uses motifs, difficulty monotone | about 30 s |
| V6 pedagogy and safety | Azure AI Content Safety on every string; reading-level check per band; spec-alignment rubric | every on-screen string is from the spec or kit (the builder cannot invent copy: strings live in `levels.json`, validated); no personal data; no links | about 5 s |
| V7 human audit | sampled | 100% of new mechanics before library promotion; 5% of reskins **[U]** | async |

The GUI-agent playtest (Play2Code) is **not** in the default gate. V3 and V4 cover logic deterministically. A GUI agent is slow, and it is weak at timing and small UI, which is exactly where children's games live **[S]**. It is useful offline when promoting a mechanic to the library.

### 5.7 Workspace and FORGE.md

```
/kit/            read-only: runtime/, bridge/, ui/, audio/, docs/KIT.md (API ≤ 6k tokens), templates/<mechanic>/
/work/           git repo seeded from templates/<mechanic>
  FORGE.md       ≤ 2k tokens: what you may edit, how checks work, pitfalls (living, ≤ 40 lines, shapes not sentences)
  spec.json      the GameSpec (read-only to the builder; edits refused)
  src/mechanic.ts  src/scenes/*.ts  src/levels.json  src/theme.json
  tests/keypoints.gen.ts   (generated from spec by the harness; read-only)
```

FORGE.md follows Codex's AGENTS.md semantics (scope = tree; direct instructions win), with the 32 KiB rule cut to about 2k tokens. Every line must be checkable or point at a check. Meera's rule that "anything sentence-shaped in a prompt gets recited" applies to on-screen copy. Because strings come only from `levels.json` (V6), recited prompt text cannot reach a child.

### 5.8 Prompts as structure

**Builder system prompt** (frozen per recipe version; order is mechanism, so the binding rules come last, per Meera's "position is mechanism" lesson):

1. **Role, one line.** You implement one game mechanic inside an existing kit.
2. **Environment.** Tools and what each returns; no shell; no network; the budget footer exists.
3. **Kit contract.** A pointer to `/kit/docs/KIT.md`, plus the five kit calls you will use most.
4. **Workflow.** Read spec → read template → patch → `run_check build` → `run_check keypoints` → `submit`. Never re-read a file after a successful patch (Codex). Never repeat a failed action unchanged (SWE-agent).
5. **Edit format.** The `apply_patch` grammar, with one 6-line example built from the kit's own template (not from a game).
6. **Done means.** Every gate for this stage is green; `submit` decides, not you.
7. **Binding rules, last.** Edit only allowlisted paths. All visible text comes from `levels.json`. No decorative animation. Tap-first. Do not weaken or skip tests. When the budget footer shows < 20% left, make the smallest change that turns the current red check green.

**Planner prompt.**
- Input: the brief, the kit manifest (mechanics with their `describe()` strings, ≤ 600 chars each, per maths-engines §3.1) and a misconception catalogue excerpt.
- Output: `GameSpec` via structured output. On codex/brain, use JSON schema `strict`; on Claude, use `output_config.format`.
- The planner is told that the harness will **replay** its solutions and misconception paths, so it writes them as semantic actions.

**Critic prompt.** Inputs are the checklist (from the spec plus the age-band rubric), the frames and the source. Output is `CritiqueItem[]`. The critic is instructed that `pass:true` needs visible evidence in a frame, and that it must not suggest new features.

**Observation templates** (borrowed): mini-swe-agent's long-output warning, SWE-agent's lint-revert template ("Your changes have NOT been applied… DO NOT re-run the same failed edit"), Aider's "did you mean" lines, and an explicit "ran successfully, no output".

### 5.9 Model routing, effort and why

| role | default | alternative arm | notes |
|---|---|---|---|
| planner | `taxila-brain` (gpt-5.6-sol), structured output | Opus 5.5 at `high` | one call; most of the pedagogy lives here |
| builder | `taxila-codex` (gpt-5.3-codex) via `/openai/v1/responses`; own `apply_patch` function tool | Opus 5.5 at `medium` (its default) / Sonnet 5.5; Claude Agent SDK; `codex exec` | per `decisions.md#forge-models`; reverse on the measured pass rate |
| critic | a different model from the builder: `taxila-brain` (vision) when the builder is codex; Sonnet 5.5 when the builder is GPT | — | P17: never the same model judging itself |
| summaries / handoffs | `taxila-fast` | — | the handoff is mostly code-generated; the LLM writes ≤ 150 words |

### 5.10 Cost and latency model **[U, all; measure in §6]**

Assumptions for a full build:
- 6 stages, about 22 builder steps;
- average prompt about 35k tokens, of which 85% is a cache hit (stable prefix plus append-only within each stage);
- about 1.2k output tokens per step, plus reasoning;
- 1 planner call (10k in / 4k out) and 2 critic calls (about 15k in each, with images).

| arm | builder input (uncached / cached) | builder output | builder $ | + planner + critic | **≈ $ / build** |
|---|---|---|---|---|---|
| gpt-5.3-codex ($1.75 / $14; cache $0.175) **[S]** | 115k × 1.75 + 655k × 0.175 = $0.20 + $0.11 | 26k (+ reasoning about 26k) × $14 = $0.73 | $1.04 | about $0.15 (brain pricing **[U]**) | **≈ $1.2** |
| Opus 5.5 ($4 / $20; cache read $0.20; writes about 1.25×) | 115k × 5 + 655k × 0.20 = $0.58 + $0.13 | 52k × $20 = $1.04 | $1.75 | about $0.15 | **≈ $1.9** |
| Sonnet 5.5 ($2 / $10) | $0.29 + $0.13 | 52k × $10 = $0.52 | $0.94 | about $0.15 | **≈ $1.1** |
| reskin (S0 hit) | — | — | — | planner patch only (taxila-fast, about 2k tok) | **< $0.01** |

Latency and volume:
- **Wall clock:** about 22 steps × (8–20 s model + 1–10 s tools), plus validators, gives **p50 ≈ 6–10 min, p90 ≈ 14 min** **[U]**. This fits inside a 30–45 min lesson only if it is started early (lesson-plan prefetch, `tech-and-market` §3.5). The live path should mostly be reskins (seconds).
- **Volume:** if 1 build in 10 game requests needs a fresh build and the rest are reskins, cost per game request is about $0.12–0.20 **[U]**.

### 5.11 Failure recovery matrix

| failure | detection | recovery |
|---|---|---|
| malformed tool call / no call | parse error | format-error template; 3 in a row ends the stage |
| patch context not found | matcher returns none | "closest lines" + file `sha`; after 2 identical failures, ask for `read_file` of that range first (forced through the observation text) |
| patch introduces syntax error | esbuild gate | auto-revert; show the error window |
| check timeout / hang | sandbox timer | kill the process group (mini-swe-agent `_run`); report `TIMEOUT after Ns` and the last 40 lines |
| regression (green → red) | V3/V4 diff vs last green | `git reset` to last green; show the diff that caused it |
| stuck loop | action/observation hash repeats | stuck note, then end the stage with best-so-far |
| model API 429 / 5xx | HTTP | backoff with jitter (3 tries), then switch to the alternate builder deployment *for the next stage only* (cache namespaces are per model) |
| Claude `stop_reason: refusal` | stop reason | log the category; retry once on the codex arm (Foundry has no server-side fallbacks) |
| sandbox lost | session error | re-create, `git` restore from the orchestrator's last pushed bundle (pushed after every green), resume the stage |
| budget cap | ledger | publish best green with trimmed levels, or the engine fallback |
| unsafe content | V6 | hard fail; never published; incident logged |

### 5.12 What the teacher and the child see

- **Telemetry.** The published game emits **bridge v2** events (`maths-engines` §3.2; `science-engines` §2.2) through the kit runtime, so the teacher's observer works unchanged. `summarize(state, recent)` is a kit function, not generated code.
- **Progress.** Job progress streams to the Director as `forge_progress{stage, levelsGreen, eta_s}`. The teacher can say "your game is almost ready" honestly, and switch to the engine fallback if the ETA exceeds the lesson's remaining slot.
- **Artifact manifest.** It carries spec, recipe version, validator report, models and ledger, so the parent and teacher dashboards can show *why* a game exists (objective, misconception targeted).

---

## 6. Measurements to run first (in order)

1. **M-F1 Bake-off.** 40 briefs (20 maths, 15 science, 5 EVS; 3 age bands; each with a target misconception). Four arms:
   - (a) Forge on codex;
   - (b) `codex exec` in the same sandbox with FORGE.md as AGENTS.md and the same validators run *after*;
   - (c) Claude Agent SDK on Opus 5.5 (once the deployment answers);
   - (d) Forge on Opus 5.5 / Sonnet 5.5.

   Metrics, all per brief and with n stated:
   - **ship rate** (all gates green within caps);
   - **levels shipped / planned**;
   - $ per shipped game;
   - p50 / p90 wall clock;
   - critic blocker count;
   - human-expert acceptance on a blind sample of 15.

   The decision rule is the reversal condition already written in `decisions.md#forge-models`.
2. **M-F2 Validator validity.** Seed 30 known-bad builds: off-by-one win, misconception not detected, unreachable level, text overflow at 360 px, contrast, freeze. Measure the detection rate of V3/V4 vs V5. If V5 adds < 5 pp over V3+V4, drop it from the live gate **[U]**.
3. **M-F3 Scaffold removal.** Rerun M-F1 arm (a) with each of the following removed, one at a time: syntax gate, stuck detector, fresh-context-per-stage, budget footer, critic. Anthropic's "remove one component at a time" rule.
4. **M-F4 Cache hit rate.** Check `cached_tokens / input_tokens` per step. The target is ≥ 80%. Below 60% means a silent prefix invalidator.
5. **M-F5 Reskin safety.** 200 reskins of 10 base games through V0–V6. Measure the failure rate, to decide whether reskins can skip human audit.

Every result goes to `context/measurements.md` with n, method and date before the next phase (project rule).

---

## 7. Build vs adopt

| option | pro | con | verdict |
|---|---|---|---|
| Own thin loop (this doc) | exact gates, provider-neutral, cache-stable, append-only, cheap to change | about 1–2 weeks to build **[U]** | **build** |
| `codex exec` headless in sandbox | zero loop code; best apply_patch; Azure provider config exists **[V]** | general-purpose prompt and tools (shell); validators bolted on after; the loop needs the key inside the sandbox | baseline arm (b) |
| Claude Agent SDK | mature hooks, subagents, `maxBudgetUsd`, `outputFormat` | Claude-only; blocked on Foundry billing; built-in Bash is broad (needs `disallowedTools`) | arm (c) |
| OpenHands SDK | event sourcing, condenser, stuck detection | Python service plus Docker-in-container; heavier than needed | borrow ideas only |
| Port pieces | Codex `apply-patch` parser and `seek_sequence` (Apache-2.0, about 2.1k Rust lines → about 400 TS lines); mini-swe-agent loop shape (MIT); SWE-agent lint-gate and review-on-submit templates (MIT); Aider "did you mean" (Apache-2.0) | keep NOTICE attribution for Apache-2.0 ports | **do** |

Licences verified in the cloned repos: Codex Apache-2.0, mini-swe-agent MIT, SWE-agent MIT, Aider Apache-2.0, smolagents Apache-2.0 **[V]**.

---

## 8. Risks and open questions

- **Human review gate.** Shipping un-reviewed generated games to children conflicts with `tech-and-market` §3.6. This needs an explicit owner decision. The default proposed here (live = validated reskins of reviewed bases; new mechanics = reviewed) keeps the old rule for new code.
- **Claude availability.** Claude is still blocked on billing. The harness must not depend on Claude-only features (task budgets, Agent SDK) in the default path.
- **Azure Responses API custom/freeform tools** (Lark grammar) for gpt-5.3-codex are unverified on our resource **[U]**. Plan for a plain function tool carrying the patch text. Smoke-test grammar tools in M-F1.
- **Chromium in ACA dynamic sessions** (memory, `/dev/shm`, startup time) is unverified **[U]**. Measure cold-to-first-screenshot before committing.
- **Learning value is not proven** by passing gates. A game that passes every check can still teach nothing. Tie Forge games to the learner model's delayed-outcome measures (learning-science §7 probes) and compare against engine-only lessons.
- **Seductive details.** The interest-driven theming the owner wants pulls against the evidence (maths-engines R2/R6: bland concrete, no decorative animation). Interests go into *story and motifs between levels*, not into the manipulated objects. This is enforced by the V5 checklist **[U]**.

---

## Sources

**Source code read today (shallow clones, 2026-10-02):**
- openai/codex: `codex-rs/core/src/session/turn.rs`, `core/assets/tools/apply_patch.lark`, `apply-patch/src/{parser,seek_sequence,invocation}.rs`, `core/src/tools/handlers/{apply_patch_spec,unified_exec}.rs`, `core/src/unified_exec/{mod,head_tail_buffer}.rs`, `core/src/exec.rs`, `core/src/session/rollout_budget.rs`, `core/src/config/mod.rs`, `linux-sandbox/README.md`, `sandboxing/src/*`, `prompts/templates/{compact,permissions,guardian,review}/*`, `protocol/src/prompts/base_instructions/default.md`, `core/gpt-5.2-codex_prompt.md`, `exec/src/cli.rs`, `model-provider-info/src/model_provider_info_tests.rs`. https://github.com/openai/codex
- SWE-agent/mini-swe-agent: `src/minisweagent/agents/default.py`, `environments/local.py`, `config/benchmarks/swebench.yaml`, README. https://github.com/SWE-agent/mini-swe-agent
- SWE-agent/SWE-agent: `config/default.yaml`, `tools/windowed_edit_linting/*`, `tools/review_on_submit_m/*`. https://github.com/SWE-agent/SWE-agent
- Aider-AI/aider: `aider/coders/{base_coder,editblock_coder,editblock_prompts}.py`, `aider/repomap.py`, `website/_posts/{2023-12-21-unified-diffs,2024-09-26-architect}.md`. https://github.com/Aider-AI/aider
- huggingface/smolagents: `src/smolagents/{agents,local_python_executor}.py`, README. https://github.com/huggingface/smolagents

**Papers and posts:**
- Barbaste et al., *Harness Engineering: Anatomy, Architecture, and Evolution of Coding Agents: A Source-Code Study of Eleven Systems*, arXiv 2609.00006 (2026). https://arxiv.org/abs/2609.00006
- Yang, Yu, Desell, *When Does Restricting a Coding Agent to execute_code Help?*, arXiv 2607.10569 (2026). https://arxiv.org/abs/2607.10569
- Yang et al., *SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering*, arXiv 2405.15793. https://arxiv.org/abs/2405.15793
- *The OpenHands Software Agent SDK*, arXiv 2511.03690 (MLSys 2026). https://arxiv.org/abs/2511.03690
- OpenHands, *Context Condensation for More Efficient AI Agents*. https://www.openhands.dev/blog/openhands-context-condensensation-for-more-efficient-ai-agents
- Wang et al., *Executable Code Actions Elicit Better LLM Agents* (CodeAct), arXiv 2402.01030 (via smolagents README).
- *OpenGame: Open Agentic Coding for Games*, arXiv 2604.18394. https://arxiv.org/html/2604.18394v1
- *GameGen-Verifier: Parallel Keypoint-Based Verification for LLM-Generated Games via Runtime State Injection*, arXiv 2605.07442. https://arxiv.org/abs/2605.07442
- *GUI Agents for Continual Game Generation* (PlaytestArena, Play2Code), arXiv 2605.28258. https://arxiv.org/html/2605.28258v1
- *PlayCoder: Making LLM-Generated GUI Code Playable*, arXiv 2604.19742. https://arxiv.org/abs/2604.19742
- *ArtifactsBench*, arXiv 2507.04952. https://arxiv.org/abs/2507.04952
- *V-GameGym*, arXiv 2509.20136. https://arxiv.org/abs/2509.20136
- Anthropic Engineering, *Harness design for long-running application development* (2026). https://www.anthropic.com/engineering/harness-design-long-running-apps
- Anthropic Engineering, *Writing effective tools for agents*. https://www.anthropic.com/engineering/writing-tools-for-agents
- OpenAI, *Unrolling the Codex agent loop* (2026-01-23; primary page 403 to fetcher). https://openai.com/index/unrolling-the-codex-agent-loop/; secondary: https://codex.danielvaughan.com/2026/03/28/codex-agent-loop-deep-dive/
- OpenAI, *Harness engineering: leveraging Codex in an agent-first world* (2026), via InfoQ. https://www.infoq.com/news/2026/02/openai-harness-engineering-codex
- OpenAI, Apply Patch tool guide. https://developers.openai.com/api/docs/guides/tools-apply-patch
- Microsoft Q&A, *Azure OpenAI apply_patch unavailable when a custom tool is included*. https://learn.microsoft.com/en-us/answers/questions/5828009/azure-openai-apply-patch-works-alone-but-seems-una

**Docs:**
- Claude Agent SDK TypeScript reference. https://code.claude.com/docs/en/agent-sdk/typescript
- Claude Code on Microsoft Foundry. https://code.claude.com/docs/en/microsoft-foundry
- Goose subagents and recipes. https://goose-docs.ai/docs/guides/context-engineering/subagents/ ; https://deepwiki.com/aaif-goose/goose/4-recipes-and-scheduling
- Roo Code `apply_diff`. https://docs.roocode.com/advanced-usage/available-tools/apply-diff
- Cline issues #1195, #1511, #3183, #3513, #8779. https://github.com/cline/cline/issues
- Azure Container Apps custom container sessions. https://learn.microsoft.com/en-us/azure/container-apps/sessions-custom-container
- GPT-5.3-codex pricing (OpenRouter / Artificial Analysis). https://openrouter.ai/openai/gpt-5.3-codex
- Claude model pricing and Foundry feature availability: claude-api skill reference tables (cached 2026-09-25).
