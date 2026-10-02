-- Taxila: the content factory (Forge) wired into the Conductor.
-- Proposed migration db/migrations/00x_forge.sql. Applies after 001_core.sql and 002_conductor.sql (CONDUCTOR §2.4,
-- §3.8, §9.5: child_seq, student_event, ingest_event(), job, budget, gen_ulid()).
-- Rationale: docs/research/conductor/content-orchestration.md (gap-fill G1-content-orchestration, 2026-10-02).
-- Verified on a scratch Postgres 16.14 with the stubs and checks in content-orchestration.md §4.4 (n = 1 run).
--
-- Lock order (extends CONDUCTOR §3.4): child_seq → conductor_state → forge_request → forge_waiter / module_ready.
-- Every function below that touches a child-owned forge row first locks the forge_request row, so the Conductor
-- commit (one child, one key) and a publish (one key, many children) serialise on forge_request and cannot deadlock.
--
-- One writer per fact:
--   forge_request, forge_transition, forge_artifact ........ Forge (library-level; NO child column anywhere)
--   forge_waiter ............................................ Conductor commit only (Command 'forge.demand')
--   module_ready ............................................ Forge publish / retire only (read model)
--   review_item, reviewer ................................... review service (humans) + Forge (creates items)
--   allowed_model, forge_policy, forge_review_policy ........ ops (migrations), read by everyone

-- ───────────────────────────── policy (data, not code paths) ─────────────────────────────

create table allowed_model (                          -- I-R8 with retirement dates (I-F13)
  deployment    text primary key,                     -- 'taxila-codex', 'taxila-image', ...
  model         text not null,                        -- 'gpt-5.3-codex', 'gpt-image-2', ...
  model_version text,                                 -- pinned version where it matters (TTS)
  allowed_until date,                                 -- null = no known retirement
  note          text not null default '');
insert into allowed_model (deployment, model, model_version, allowed_until, note) values
  ('taxila-realtime', 'gpt-realtime-2.1', null, null, ''),
  ('taxila-realtime-mini', 'gpt-realtime-2.1-mini', null, null, 'drills only'),
  ('taxila-brain', 'gpt-5.6-sol', null, null, 'judges, VLM checklist, planner'),
  ('taxila-fast', 'gpt-5.6-luna', null, null, 'T1/T2a fills, labelling'),
  ('taxila-codex', 'gpt-5.3-codex', null, null, 'T3 builder, Manim'),
  ('taxila-image', 'gpt-image-2', null, '2027-10-21', 'GA to 2027-10-21 per video-animation-gen §1'),
  ('taxila-sora', 'sora-2', '2025-12-08', '2026-10-15', 'preview; retires 2026-10-15, no replacement (video-animation-gen §0)'),
  ('gpt-4o-mini-tts', 'gpt-4o-mini-tts', '2025-12-15', '2027-06-15', 'pin 2025-12-15 GA; 2025-03-20 retires 2026-10-15'),
  ('taxila-transcribe', 'gpt-4o-transcribe', null, null, 'TTS round-trip WER gate');

create table forge_policy (                           -- one row; the current publish policy
  id            boolean primary key default true check (id),
  csp_header    text not null,
  csp_hash      text not null,                        -- sha256 hex of csp_header; every published code artefact attests it
  qa_policy_version text not null,
  per_child_daily_demand smallint not null default 3, -- forge_waiter day slots (the insert is the cap)
  waiter_days   smallint not null default 14);        -- a waiter older than this is dropped at publish
insert into forge_policy (csp_header, csp_hash, qa_policy_version) values (
  'default-src ''none''; script-src ''self''; style-src ''self'' ''unsafe-inline''; img-src ''self'' data:; connect-src ''none''',
  encode(digest('default-src ''none''; script-src ''self''; style-src ''self'' ''unsafe-inline''; img-src ''self'' data:; connect-src ''none''', 'sha256'), 'hex'),
  'qa@1');

create table forge_review_policy (                    -- which human keys a build class needs before publish (§10.1)
  tier          text not null, build_class text not null,
  required_queues text[] not null,                    -- '{}' = auto-publish after auto_validated (reviewed_by 'auto:<policy>')
  per_lang_key  boolean not null default false,       -- a 'lang' key per served language (strings tables)
  sample_rate   real not null default 0,              -- share of auto-published items also sent to the 'sample' queue
  est_review_sec int not null,                        -- [U] review minutes budget input (§10.3)
  primary key (tier, build_class));
insert into forge_review_policy values
  ('T1','engine_params',     '{}',                 false, 0.00,   0),
  ('T2','scene',             '{}',                 false, 0.10,  90),
  ('T2','explainer',         '{}',                 false, 0.10, 300),
  ('T3','kit_extended',      '{subject}',          true,  0.00, 600),
  ('T3','free_form',         '{subject,kid_ux}',   true,  0.00, 900),
  ('T3','new_mechanic',      '{subject,kid_ux}',   true,  0.00, 1800),
  ('image','raster',         '{}',                 false, 0.10,  25),   -- people/cast/community/VLM-flagged → '{art}' or '{community}' at runtime (§10.1)
  ('image','svg',            '{}',                 false, 0.10,  20),
  ('video','render_mp4',     '{subject,kid_ux}',   true,  0.00, 300),
  ('video','render_manim',   '{subject,kid_ux}',   true,  0.00, 300),
  ('audio','tts_lines',      '{}',                 false, 0.05,  10),
  ('audio','chant',          '{}',                 false, 0.10,  60),
  ('audio','commissioned',   '{subject,kid_ux}',   false, 0.00, 600);

-- ───────────────────────────── the state machine ─────────────────────────────

create table forge_edge (from_state text not null, to_state text not null, primary key (from_state, to_state));
insert into forge_edge values
  ('requested','spec'), ('requested','rejected'),
  ('spec','built'), ('spec','rejected'),
  ('built','auto_validated'), ('built','rejected'),
  ('auto_validated','human_review'), ('auto_validated','published'), ('auto_validated','rejected'),
  ('human_review','published'), ('human_review','rejected'), ('human_review','spec'),   -- 'spec' = one rework
  ('published','retired');

create table forge_request (                          -- one row per library key; the work item of the machine
  id                bigint generated always as identity primary key,
  library_key       text not null unique,             -- sha256 hex of canonicalJSON(LibraryKeyFields) (contracts)
  key               jsonb not null,                   -- the canonical fields themselves
  tier              text not null check (tier in ('T1','T2','T3','image','video','audio')),
  build_class       text not null,
  modality          text not null check (modality in ('voice','text','diagram','image','animation','sim','game','video','story','song','worksheet')),
  objective_id      text not null, misconception_id text, engine text not null, spec_hash text not null,
  band              text not null check (band in ('B1','B2','B3','B4')),
  device_class      text not null check (device_class in ('full','lite')),
  kit_version       text not null, gate_version text not null, generator_version text not null,
  state             text not null default 'requested'
                    check (state in ('requested','spec','built','auto_validated','human_review','published','rejected','retired')),
  state_seq         int not null default 0,           -- CAS token; bumped by every transition
  horizon           text not null check (horizon in ('in_lesson','next_lesson','two_weeks','term')),   -- nearest horizon that asked
  demand_count      int not null default 0,           -- distinct child waiters ever (aggregate; survives erasure)
  predicted_demand  real not null default 0,          -- horizon jobs: expected uses over 30 d (MO §7.3 demand_k + reuse_k)
  first_lesson_id   uuid references lesson(id) on delete set null,   -- provenance only; never a child field
  first_requested_at timestamptz not null default now(),
  last_demand_at    timestamptz not null default now(),
  value_score       real, cost_est_micro_usd bigint, review_sec_est int,       -- written by forge.admit (knapsack)
  admitted_at       timestamptz, reservation_id text,
  attempt           smallint not null default 0, rework_count smallint not null default 0 check (rework_count <= 1),
  current_artifact_id text, published_artifact_id text,
  supersedes_request_id bigint references forge_request(id),
  reject_reason     text check (reject_reason in ('declined_value','expired','budget_caps','qa_fallback','unsafe',
                                                  'human_reject','review_expired','model_retired','duplicate_of_alias')),
  retire_reason     text check (retire_reason in ('superseded','demoted','quarantined','kit_stale','model_retired')),
  updated_at        timestamptz not null default now(),
  check (key ? 'objectiveId' and key ? 'engine' and key ? 'specHash'),
  check (not (key ?| array['childId','child_id','childName','name','guardianId','lessonId','transcript','memory',
                           'interests','interestTags','utterance','skin','fill'])),            -- I-F2: no child fields, ever
  check ((state = 'published') = (published_artifact_id is not null)),
  check ((state = 'rejected') = (reject_reason is not null)),
  check ((state = 'retired') = (retire_reason is not null)));
create index forge_request_admit on forge_request (state, horizon, value_score desc nulls last) where state = 'requested';
create index forge_request_obj on forge_request (objective_id, misconception_id, tier);

create table forge_transition (                       -- the library-level log (the analogue of student_event for Forge)
  request_id  bigint not null references forge_request(id) on delete cascade,
  seq         int not null,                           -- = forge_request.state_seq after the transition
  from_state  text, to_state text not null,
  at          timestamptz not null default now(),
  actor       text not null,                          -- 'conductor' | 'horizon' | 'forge.admit' | 'job:<id>' | 'reviewer:<id>' | 'canary' | 'bandit' | 'ops'
  reason      text not null,                          -- a code, never prose
  job_id      bigint, artifact_id text,
  evidence    jsonb not null default '{}',            -- ids, hashes, counts only (no free text: §2.3 rule applies)
  primary key (request_id, seq));

create table forge_artifact (                         -- immutable build output; servable iff its request is published on it
  id                text primary key,                 -- 'fa_' || left(content_hash, 24)
  request_id        bigint not null references forge_request(id),
  library_key       text not null,
  tier              text not null, build_class text not null,
  content_hash      text not null,                    -- sha256 of the dist (or asset bytes)
  blob_prefix       text not null check (blob_prefix like 'lib/%'),   -- CONDUCTOR §5.8 prefix rule (X31)
  bytes             int not null, gzip_bytes int,
  manifest          jsonb not null,                   -- LibManifest | GamePackage | AssetRecord | ExplainerDoc | ChantSpec
  langs             text[] not null default '{}', langs_approved text[] not null default '{}',
  qa_report_ref     text, qa_policy_version text,
  qa_decision       text check (qa_decision in ('ship','ship_partial','human_review','repair','fallback_g1','reject_unsafe')),
  qa_score          real, qa_gates jsonb not null default '{}',      -- {"Q0":"pass", ...}
  qa_judges         jsonb not null default '[]',                     -- [{model, promptHash, calls, ungrounded}]
  csp_policy_hash   text,                             -- code tiers: must equal forge_policy.csp_hash at publish
  egress            jsonb,                            -- EgressAttestation (contracts): {lane, policy:'deny', runnerIdentity:'none', hostRules, blockedRequests, cspViolations}
  ast_banlist_pass  boolean,                          -- QA Q1 / genui V1
  models            jsonb not null default '[]',      -- [{deployment, modelVersion}] every one on allowed_model at build time
  cost_micro_usd    bigint not null default 0,
  timings           jsonb not null default '{}',      -- {"specMs","buildMs","qaMs","reviewWaitS"}; the CM4 / M-CO latency source
  reviewed_by       text[],                           -- reviewer ids, or '{auto:<policy@v>}' for auto tiers
  review_grade      text check (review_grade in ('auto','one_key','two_key')),
  quality_a real not null default 2, quality_b real not null default 1, serves int not null default 0,   -- MO §8.3 bandit
  created_at        timestamptz not null default now(), published_at timestamptz, retired_at timestamptz,
  unique (request_id, content_hash));
create index forge_artifact_key on forge_artifact (library_key);

create table artifact_alias (                         -- MO §8.1 rule 3: exact keys; reuse only by an approved alias row
  from_library_key text primary key, to_artifact_id text not null references forge_artifact(id),
  approved_by text not null, approved_at timestamptz not null default now());

-- ───────────────────────────── child-owned rows (mapped in WORKSPACE_MAP, owner 'conductor' / 'forge') ─────────────────────────────

create table forge_waiter (                           -- who is waiting for a key; written only by the Conductor commit
  child_id    uuid not null references child(id) on delete cascade,
  learning_day date not null,
  day_slot    smallint not null check (day_slot between 1 and 3),     -- the INSERT is the per-child daily cap (MO §9.1)
  request_id  bigint not null references forge_request(id) on delete cascade,
  lesson_id   uuid references lesson(id) on delete set null,
  slot_id     text,
  horizon     text not null check (horizon in ('in_lesson','next_lesson')),
  wanted_by   date not null,                          -- the child's next planned lesson day; after it the waiter is dropped
  created_at  timestamptz not null default now(),
  primary key (child_id, learning_day, day_slot),
  unique (child_id, request_id));
create index forge_waiter_req on forge_waiter (request_id);

create table module_ready (                           -- the read model: "a published artefact this child asked for"
  child_id    uuid not null references child(id) on delete cascade,
  library_key text not null,
  artifact_id text not null references forge_artifact(id),
  request_id  bigint not null references forge_request(id),
  horizon     text not null,
  ready_at    timestamptz not null default now(),
  expires_at  timestamptz not null,
  primary key (child_id, library_key));
create index module_ready_artifact on module_ready (artifact_id);

create view forge_blocklist as                        -- global device doc 'lib-blocklist' (ETag); ModuleHost refuses these hashes
  select a.content_hash, r.retire_reason, a.retired_at
    from forge_artifact a join forge_request r on r.id = a.request_id
   where r.state = 'retired' and r.retire_reason in ('quarantined','demoted') and a.id = r.published_artifact_id;

-- ───────────────────────────── review queue ─────────────────────────────

create table reviewer (
  id text primary key, display_name text not null,
  queues text[] not null,                             -- subset of review_item.queue values
  langs text[] not null default '{}',
  daily_review_sec int not null check (daily_review_sec > 0),
  backup_id text references reviewer(id),             -- escalation target (the "second named adult" of review)
  active boolean not null default true, away_until date);

create table review_item (
  id           bigint generated always as identity primary key,
  request_id   bigint not null references forge_request(id),
  artifact_id  text not null references forge_artifact(id),
  queue        text not null check (queue in ('subject','kid_ux','lang','art','community','safety','sample')),
  lang         text,
  key_required boolean not null,                      -- false only for 'sample' (audit; never gates publish)
  priority     real not null,                         -- demand-ranked (CONDUCTOR §8.5): log(1 + demand) × horizon weight
  est_sec      int not null,
  sla_due_at   timestamptz not null, escalate_at timestamptz not null,
  status       text not null default 'open' check (status in ('open','claimed','escalated','decided','withdrawn')),
  assigned_to  text references reviewer(id), claimed_at timestamptz,
  verdict      text check (verdict in ('approve','reject','request_changes')),
  reason_codes text[] not null default '{}',          -- QA-style codes; appended to the debug protocol and few-shot list
  decided_by   text references reviewer(id), decided_at timestamptz, review_sec int,
  created_at   timestamptz not null default now(),
  check ((status = 'decided') = (verdict is not null)),
  check (queue <> 'sample' or not key_required),
  check (queue <> 'lang' or lang is not null));
create unique index review_item_once on review_item (artifact_id, queue, coalesce(lang, ''));
create index review_open on review_item (queue, priority desc) where status in ('open','claimed','escalated');
create index review_sla on review_item (escalate_at) where status in ('open','claimed');

-- ───────────────────────────── functions ─────────────────────────────

-- Called ONLY inside the Conductor commit for Command {kind:'forge.demand'} (p_child set), or by the forge.horizon job
-- (p_child null: topic-level demand, no waiter). Returns: 'hit' | 'filed' | 'waiting' | 'already' | 'cap' | 'closed'.
create or replace function forge_file_demand(p_child uuid, p_day date, p_lesson uuid, p_slot text, p_horizon text,
                                             p_wanted_by date, p_library_key text, p_key jsonb, p_meta jsonb,
                                             p_predicted real default 0)
returns text language plpgsql as $$
declare r forge_request%rowtype; s smallint; inserted boolean := false; created boolean := false;
        rank_new int; rank_old int; p forge_policy%rowtype;
begin
  select * into p from forge_policy;
  insert into forge_request (library_key, key, tier, build_class, modality, objective_id, misconception_id, engine,
                             spec_hash, band, device_class, kit_version, gate_version, generator_version, horizon,
                             first_lesson_id, predicted_demand)
  values (p_library_key, p_key, p_meta->>'tier', p_meta->>'buildClass', p_meta->>'modality', p_key->>'objectiveId',
          p_key->>'misconceptionId', p_key->>'engine', p_key->>'specHash', p_key->>'band', p_key->>'deviceClass',
          p_key->>'kitVersion', p_key->>'gateVersion', p_key->>'generatorVersion', p_horizon, p_lesson, p_predicted)
  on conflict (library_key) do nothing
  returning (xmax = 0) into created;                  -- true only when this call inserted the row
  select * into r from forge_request where library_key = p_library_key for update;    -- lock BEFORE child rows
  if created then
    insert into forge_transition (request_id, seq, from_state, to_state, actor, reason, evidence)
    values (r.id, 0, null, 'requested', case when p_child is null then 'horizon' else 'conductor' end,
            'file:' || p_horizon, jsonb_build_object('libraryKey', p_library_key));
  end if;
  if r.state = 'published' then
    if p_child is not null then
      insert into module_ready (child_id, library_key, artifact_id, request_id, horizon, expires_at)
      values (p_child, p_library_key, r.published_artifact_id, r.id, p_horizon, (p_wanted_by + 1)::timestamptz)
      on conflict (child_id, library_key) do nothing;
    end if;
    return 'hit';                                     -- a race with publish: the child gets it, no build
  end if;
  if r.state in ('rejected','retired') then return 'closed'; end if;   -- a new key (generator/kit bump) is the only way back
  rank_new := array_position(array['in_lesson','next_lesson','two_weeks','term'], p_horizon);
  rank_old := array_position(array['in_lesson','next_lesson','two_weeks','term'], r.horizon);
  update forge_request set horizon = case when rank_new < rank_old then p_horizon else horizon end,
         predicted_demand = greatest(predicted_demand, p_predicted), last_demand_at = now(), updated_at = now()
   where id = r.id;
  if p_child is null then return case when created then 'filed' else 'waiting' end; end if;
  if exists (select 1 from forge_waiter where child_id = p_child and request_id = r.id) then return 'already'; end if;
  for s in 1 .. p.per_child_daily_demand loop
    insert into forge_waiter (child_id, learning_day, day_slot, request_id, lesson_id, slot_id, horizon, wanted_by)
    values (p_child, p_day, s, r.id, p_lesson, p_slot, p_horizon, p_wanted_by)
    on conflict do nothing returning true into inserted;
    exit when inserted;
  end loop;
  if not coalesce(inserted, false) then return 'cap'; end if;
  update forge_request set demand_count = demand_count + 1 where id = r.id;
  return case when created then 'filed' else 'waiting' end;
end $$;

-- The only way to move a request, except publish (forge_publish). CAS on (state, state_seq); edges from forge_edge.
-- Returns false for a zombie or stale caller; nothing is written then.
create or replace function forge_transition_to(p_request bigint, p_from text, p_to text, p_seq int, p_actor text,
                                               p_reason text, p_job bigint default null, p_artifact text default null,
                                               p_evidence jsonb default '{}', p_reject text default null,
                                               p_retire text default null)
returns boolean language plpgsql as $$
declare n int;
begin
  if p_to = 'published' then raise exception 'publish only through forge_publish()'; end if;
  if not exists (select 1 from forge_edge where from_state = p_from and to_state = p_to) then
    raise exception 'illegal forge edge % -> %', p_from, p_to; end if;
  update forge_request
     set state = p_to, state_seq = state_seq + 1, updated_at = now(),
         reject_reason = case when p_to = 'rejected' then p_reject else reject_reason end,
         retire_reason = case when p_to = 'retired' then p_retire else retire_reason end,
         current_artifact_id = coalesce(p_artifact, current_artifact_id),
         attempt = attempt + case when p_to = 'spec' then 1 else 0 end,
         rework_count = rework_count + case when p_from = 'human_review' and p_to = 'spec' then 1 else 0 end,
         admitted_at = case when p_from = 'requested' and p_to = 'spec' then now() else admitted_at end
   where id = p_request and state = p_from and state_seq = p_seq
   returning state_seq into n;
  if n is null then return false; end if;
  insert into forge_transition (request_id, seq, from_state, to_state, actor, reason, job_id, artifact_id, evidence)
  values (p_request, n, p_from, p_to, p_actor, p_reason, p_job, p_artifact, p_evidence);
  if p_to in ('rejected','retired') then
    delete from forge_waiter where request_id = p_request;                      -- the child never knew; nothing to retract
    delete from module_ready where request_id = p_request;
    if p_to = 'retired' then update forge_artifact set retired_at = now()
                              where id = (select published_artifact_id from forge_request where id = p_request); end if;
  end if;
  return true;
end $$;

-- Publish: every guard that I-F1 / I-F8 / I-F13 name, then the module_ready fan-out, in ONE transaction.
create or replace function forge_publish(p_request bigint, p_artifact text, p_seq int, p_actor text)
returns int language plpgsql as $$
declare r forge_request%rowtype; a forge_artifact%rowtype; pol forge_review_policy%rowtype; p forge_policy%rowtype;
        n int; old_req bigint; bad text;
begin
  select * into p from forge_policy;
  select * into r from forge_request where id = p_request for update;
  if r.state not in ('auto_validated','human_review') or r.state_seq <> p_seq then return -1; end if;
  select * into a from forge_artifact where id = p_artifact and request_id = p_request;
  if not found then raise exception 'artifact % is not a build of request %', p_artifact, p_request; end if;
  select * into pol from forge_review_policy where tier = a.tier and build_class = a.build_class;
  if not found then raise exception 'no review policy for %/%', a.tier, a.build_class; end if;
  -- auto QA (QA §5.3): only ship / ship_partial publish
  if a.qa_decision not in ('ship','ship_partial') then raise exception 'qa_decision % cannot publish', a.qa_decision; end if;
  -- review keys (I-F1): reviewed_by always present; human tiers need every key_required item approved and no 'auto:'
  if a.reviewed_by is null or cardinality(a.reviewed_by) = 0 then raise exception 'reviewed_by missing'; end if;
  if cardinality(pol.required_queues) > 0 or r.state = 'human_review' then
    if exists (select 1 from unnest(a.reviewed_by) x where x like 'auto:%') then raise exception 'auto reviewer on a human tier'; end if;
    if exists (select 1 from review_item i where i.artifact_id = a.id and i.key_required
                 and (i.status <> 'decided' or i.verdict <> 'approve')) then raise exception 'review keys incomplete'; end if;
    if exists (select 1 from unnest(pol.required_queues) q where not exists
                 (select 1 from review_item i where i.artifact_id = a.id and i.queue = q and i.verdict = 'approve'))
      then raise exception 'a required review queue has no approval'; end if;
    if pol.per_lang_key and exists (select 1 from unnest(a.langs) l where not (l = any (a.langs_approved)))
      then raise exception 'a served language has no lang key'; end if;
  elsif r.state <> 'auto_validated' then raise exception 'auto tier must publish from auto_validated';
  end if;
  -- code tiers (I-F8): egress denied, runner without identity, AST ban list, current CSP
  if a.tier = 'T3' then
    if coalesce(a.egress->>'policy','') <> 'deny' or coalesce(a.egress->>'runnerIdentity','') <> 'none'
       or a.ast_banlist_pass is not true or a.csp_policy_hash is distinct from p.csp_hash
      then raise exception 'egress/CSP attestation failed'; end if;
  end if;
  -- models (I-F13): every model used is on the list and not retired today
  select string_agg(m->>'deployment', ',') into bad
    from jsonb_array_elements(a.models) m
   where not exists (select 1 from allowed_model am where am.deployment = m->>'deployment'
                       and (am.allowed_until is null or am.allowed_until > current_date));
  if bad is not null then raise exception 'model(s) not allowed: %', bad; end if;
  update forge_request set state = 'published', state_seq = state_seq + 1, published_artifact_id = a.id,
         current_artifact_id = a.id, updated_at = now() where id = p_request returning state_seq into n;
  update forge_artifact set published_at = now() where id = a.id;
  insert into forge_transition (request_id, seq, from_state, to_state, actor, reason, artifact_id, evidence)
  values (p_request, n, r.state, 'published', p_actor, 'publish', a.id,
          jsonb_build_object('reviewGrade', a.review_grade, 'qaDecision', a.qa_decision, 'contentHash', a.content_hash));
  -- supersede the older version of the same family, if this request names one
  if r.supersedes_request_id is not null then
    select state_seq into old_req from forge_request where id = r.supersedes_request_id and state = 'published' for update;
    if found then perform forge_transition_to(r.supersedes_request_id, 'published', 'retired', old_req::int, p_actor,
                                              'superseded', null, null, '{}', null, 'superseded'); end if;
  end if;
  -- fan-out to waiters still inside their window; everyone else learns through the inventory at the next plan
  insert into module_ready (child_id, library_key, artifact_id, request_id, horizon, expires_at)
  select w.child_id, r.library_key, a.id, r.id, w.horizon, (w.wanted_by + 1)::timestamptz
    from forge_waiter w
   where w.request_id = p_request and w.wanted_by >= current_date
     and w.created_at > now() - make_interval(days => p.waiter_days)
  on conflict (child_id, library_key) do nothing;
  get diagnostics n = row_count;
  delete from forge_waiter where request_id = p_request;
  return n;                                           -- children notified through the read model
end $$;

-- Quarantine (I-F11): safety finding, Q10 canary trip, item anomaly. One statement path, effective at once:
-- module_ready rows go, the blocklist view picks the hash up, the Director's mount check refuses it.
create or replace function forge_quarantine(p_request bigint, p_actor text, p_reason text, p_evidence jsonb)
returns boolean language plpgsql as $$
declare s int;
begin
  select state_seq into s from forge_request where id = p_request and state = 'published' for update;
  if not found then return false; end if;
  return forge_transition_to(p_request, 'published', 'retired', s, p_actor, p_reason, null, null, p_evidence, null, 'quarantined');
end $$;

-- A reviewer's decision. Approvals publish when the last key lands; a reject closes; request_changes reworks once.
create or replace function review_decide(p_item bigint, p_reviewer text, p_verdict text, p_reasons text[], p_sec int)
returns text language plpgsql as $$
declare i review_item%rowtype; r forge_request%rowtype; ok boolean;
begin
  select * into i from review_item where id = p_item for update;
  if i.status in ('decided','withdrawn') then return 'stale'; end if;
  select * into r from forge_request where id = i.request_id for update;
  update review_item set status = 'decided', verdict = p_verdict, reason_codes = p_reasons, decided_by = p_reviewer,
         decided_at = now(), review_sec = p_sec where id = p_item;
  if i.queue = 'lang' and p_verdict = 'approve' then
    update forge_artifact set langs_approved = array(select distinct unnest(langs_approved || i.lang)) where id = i.artifact_id;
  end if;
  if not i.key_required then return 'sample_recorded'; end if;   -- audit samples never gate; a sample reject → quarantine by ops
  if r.state <> 'human_review' then return 'not_in_review'; end if;
  if p_verdict = 'reject' or (p_verdict = 'request_changes' and r.rework_count >= 1) then
    update review_item set status = 'withdrawn' where artifact_id = i.artifact_id and status <> 'decided';
    perform forge_transition_to(r.id, 'human_review', 'rejected', r.state_seq, 'reviewer:' || p_reviewer,
                                'review:' || p_verdict, null, i.artifact_id,
                                jsonb_build_object('codes', p_reasons), 'human_reject');
    return 'rejected';
  end if;
  if p_verdict = 'request_changes' then
    update review_item set status = 'withdrawn' where artifact_id = i.artifact_id and status <> 'decided';
    perform forge_transition_to(r.id, 'human_review', 'spec', r.state_seq, 'reviewer:' || p_reviewer, 'rework',
                                null, i.artifact_id, jsonb_build_object('codes', p_reasons));
    return 'rework';
  end if;
  update forge_artifact set reviewed_by = array(select distinct unnest(coalesce(reviewed_by, '{}') || p_reviewer)),
         review_grade = case when (select count(distinct decided_by) from review_item
                                    where artifact_id = i.artifact_id and key_required and verdict = 'approve') >= 2
                             then 'two_key' else 'one_key' end
   where id = i.artifact_id;
  select not exists (select 1 from review_item where artifact_id = i.artifact_id and key_required
                       and (status <> 'decided' or verdict <> 'approve')) into ok;
  if ok then perform forge_publish(r.id, i.artifact_id, r.state_seq, 'reviewer:' || p_reviewer); return 'published'; end if;
  return 'approved_key';
end $$;

-- Ticker (taxila-worker leader, every 15 s with fire_wakeups): escalate items past escalate_at to the backup reviewer.
create or replace function review_escalate(p_limit int) returns int language sql as $$
  with d as (select i.id, rv.backup_id from review_item i left join reviewer rv on rv.id = i.assigned_to
              where i.status in ('open','claimed') and i.escalate_at <= now()
              order by i.escalate_at for update of i skip locked limit p_limit)
  update review_item i set status = 'escalated', assigned_to = d.backup_id from d where i.id = d.id
  returning 1;
$$;
-- (returns one row per escalated item; the caller counts rows and pages ops once per run: §10.4)

-- Budget scopes for content (merged into CONDUCTOR §9.5 `budget`; seeds for a launch cohort, every limit [U]).
-- scope 'child'  unit 'micro_usd:content'   period 'day:<learningDay>'  soft 50_000 / hard 100_000 (MO8)
-- scope 'forge'  scope_id 'next'|'two_weeks'|'term'  unit 'micro_usd'   period 'day:<date>' (term: 'seed:<academicYear>')
-- scope 'review' scope_id '<reviewerId>'     unit 'review_sec'           period 'day:<date>'  (= reviewer.daily_review_sec)
-- scope 'deployment' scope_id 'taxila-image' unit 'req'                  period 'min'          (4 RPM; race lane holds 1)
