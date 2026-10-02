#!/usr/bin/env python3
"""content-orchestration.sql on a scratch Postgres 16: functional checks + lock-order race cells.

Rationale and results: content-orchestration.md §4.4 (gap-fill G2-content-orchestration-media, 2026-10-02).
Needs a scratch PG16 that trusts user postgres:   PGHOST=/socket/dir PGPORT=5499 python3 content-orchestration-pg16-probe.py
It creates and drops databases named forge_probe_*; it never touches anything else. Stdlib only. Runtime ~2 min.

Functional checks F1-F20 run once (n = 1, deterministic). Race cells D0-D4 run 5 times each; a cell's "control"
reproduces the revision-G1 lock order (function bodies taken from the G1 text, with one pg_sleep injected at the lock
point) and must deadlock; the treatment runs the shipped G2 function with the same injected sleep and must not.
"""
import os, re, subprocess, sys, time, json

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
CORE = os.path.join(REPO, 'db', 'migrations', '001_core.sql')
FORGE = os.path.join(HERE, 'content-orchestration.sql')
HOST, PORT = os.environ.get('PGHOST', 'localhost'), os.environ.get('PGPORT', '5432')
A, B = '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b'
LES = '00000000-0000-0000-0000-0000000000e1'
results = []

def psql(db, sql, check=True):
    p = subprocess.run(['psql', '-h', HOST, '-p', PORT, '-U', 'postgres', '-d', db, '-q', '-X', '-t', '-A',
                        '-v', 'ON_ERROR_STOP=1', '-c', sql], capture_output=True, text=True)
    if check and p.returncode != 0:
        raise RuntimeError(p.stderr.strip())
    return (p.stdout.strip(), p.stderr.strip(), p.returncode)

def one(db, sql):
    return psql(db, sql)[0]

def fresh(name):
    psql('postgres', f'drop database if exists {name}')
    psql('postgres', f'create database {name}')
    for f in (CORE, FORGE):
        p = subprocess.run(['psql', '-h', HOST, '-p', PORT, '-U', 'postgres', '-d', name, '-q', '-X',
                            '-v', 'ON_ERROR_STOP=1', '-f', f], capture_output=True, text=True)
        if p.returncode != 0:
            raise RuntimeError(f + ': ' + p.stderr)
    psql(name, f"""
      insert into guardian (id, email, pw_hash, name) values ('00000000-0000-0000-0000-0000000000f1','g@x','x','G');
      insert into child (id, guardian_id, first_name, class_level) values
        ('{A}','00000000-0000-0000-0000-0000000000f1','A',4), ('{B}','00000000-0000-0000-0000-0000000000f1','B',4);
      insert into lesson (id, child_id, topic_id) values ('{LES}','{A}','maths.c4.fractions');
      insert into reviewer (id, display_name, queues, langs, daily_review_sec, backup_id) values
        ('r2','R2','{{subject,kid_ux,lang,art}}','{{hi,en}}',7200,null),
        ('r1','R1','{{subject,kid_ux,lang,art}}','{{hi,en}}',7200,'r2');""")
    return name

def keyj(name, tier='T1', bc='engine_params', modality='sim', extra=None):
    k = {"objectiveId": "obj." + name, "misconceptionId": None, "engine": "eng@1", "specHash": "sh_" + name,
         "band": "B2", "deviceClass": "full", "kitVersion": "k1", "gateVersion": "g1", "generatorVersion": "v1"}
    if extra: k.update(extra)
    m = {"tier": tier, "buildClass": bc, "modality": modality, "identityKey": "id_" + name}
    return json.dumps(k), json.dumps(m)

def demand(child, name, horizon='in_lesson', tier='T1', bc='engine_params', wanted="ist_today()", extra=None, fn='forge_file_demand'):
    k, m = keyj(name, tier, bc, extra=extra)
    c = 'null' if child is None else f"'{child}'"
    les = f"'{LES}'" if child == A else 'null'
    return (f"select {fn}({c}, ist_today(), {les}, 's1', '{horizon}', {wanted}, '{name}', '{k}'::jsonb, '{m}'::jsonb)")

def check(fid, desc, ok, observed):
    results.append((fid, desc, ok, observed))
    print(f"{'PASS' if ok else 'FAIL'} {fid} {desc} :: {observed}")

def build(db, name, tier='T1', bc='engine_params', qa='ship', reviewed="'{auto:qa@1}'", models='[{"deployment":"taxila-fast"}]',
          egress='null', ast='null', csp='null', langs="'{}'"):
    """drive requested → spec → built → auto_validated and add an artefact; returns (request_id, artifact_id, seq)."""
    rid = one(db, f"select id from forge_request where library_key='{name}'")
    for (f, t) in (('requested', 'spec'), ('spec', 'built')):
        seq = one(db, f"select state_seq from forge_request where id={rid}")
        assert one(db, f"select forge_transition_to({rid},'{f}','{t}',{seq},'job:1','probe')") == 't'
    art = 'fa_' + name
    psql(db, f"""insert into forge_artifact (id, request_id, library_key, tier, build_class, content_hash, blob_prefix, bytes,
                 manifest, qa_decision, reviewed_by, models, egress, ast_banlist_pass, csp_policy_hash, langs)
               values ('{art}', {rid}, '{name}', '{tier}', '{bc}', 'h_{name}', 'lib/{art}/h/', 100, '{{}}', '{qa}',
                       {reviewed}, '{models}'::jsonb, {egress}, {ast}, {csp}, {langs})""")
    seq = one(db, f"select state_seq from forge_request where id={rid}")
    assert one(db, f"select forge_transition_to({rid},'built','auto_validated',{seq},'job:1','probe',null,'{art}')") == 't'
    return rid, art, one(db, f"select state_seq from forge_request where id={rid}")

# ───────────────────────────── functional checks ─────────────────────────────
def functional():
    db = fresh('forge_probe_f')
    r = one(db, demand(A, 'k_t1a'));                                          check('F1', 'first in_lesson demand files a request + waiter', r == 'filed' and one(db, "select count(*) from forge_waiter") == '1', r)
    r = one(db, demand(A, 'k_t1a'));                                          check('F2', 'same child, same key again', r == 'already', r)
    r = one(db, demand(B, 'k_t1a', 'next_lesson', wanted="ist_today()+1"))
    check('F3', 'second child joins the same request (single-flight), demand_count = 2',
          r == 'waiting' and one(db, "select demand_count from forge_request where library_key='k_t1a'") == '2', r)
    outs = [one(db, demand(A, n)) for n in ('k_t1b', 'k_t1c', 'k_t1d')]
    check('F4', 'per-child daily cap: 3 waiters, the 4th demand returns cap', outs == ['filed', 'filed', 'cap'], outs)
    outs = [one(db, demand(B, n, 'next_lesson', 'T3', 'kit_extended', "ist_today()+1")) for n in ('k_t3a', 'k_t3b')]
    check('F5', 'expensive-tier races cap: child B (1 waiter already) gets 1 T3 waiter, then cap at 2 races? (races=2)',
          outs == ['filed', 'filed'] and one(db, demand(B, 'k_t3c', 'next_lesson', 'T3', 'kit_extended', "ist_today()+1")) == 'cap', outs)
    r = one(db, demand(None, 'k_term', 'term'))
    check('F6', 'term demand without a child files, no waiter', r == 'filed' and one(db, "select count(*) from forge_waiter w join forge_request q on q.id=w.request_id where q.library_key='k_term'") == '0', r)
    r = one(db, demand(A, 'k_2w', 'two_weeks'))
    check('F7', 'two_weeks demand WITH a child: no waiter, no error (G1 aborted the commit here)', r == 'filed' and one(db, "select count(*) from forge_waiter w join forge_request q on q.id=w.request_id where q.library_key='k_2w'") == '0', r)
    k, m = keyj('k_bad', extra={"childId": A})
    _, err, rc = psql(db, f"select forge_file_demand(null, ist_today(), null, null, 'term', ist_today(), 'k_bad', '{k}'::jsonb, '{m}'::jsonb)", check=False)
    check('F8', 'I-F2: a key carrying childId is refused by the table check', rc != 0 and 'check constraint' in err, err.split('\n')[0][:90])
    rid, art, seq = build(db, 'k_t1a')
    n = one(db, f"select forge_publish({rid}, '{art}', {seq}, 'job:1')")
    exp = one(db, f"select bool_and(expires_at = ist_end_of(case when child_id='{A}' then ist_today() else ist_today()+1 end)) from module_ready where library_key='k_t1a'")
    check('F9', 'auto-tier publish fans out to both waiters, consumes them, IST expiry',
          n == '2' and one(db, f"select count(*) from forge_waiter where request_id={rid}") == '0' and exp == 't', f"fanout={n} expiryIST={exp}")
    lr = one(db, f"select lesson_id from module_ready where child_id='{A}' and library_key='k_t1a'")
    check('F10', 'in_lesson module_ready carries the asking lesson (the Director turn poll filters on it)', lr == LES, lr)
    r = one(db, demand(A, 'k_t1a', 'next_lesson'))
    check('F11', 'demand after publish is a hit (no build, no waiter)', r == 'hit', r)
    # model guard
    one(db, demand(None, 'k_img', 'term', 'image', 'raster'))
    rid2, art2, seq2 = build(db, 'k_img', 'image', 'raster', models='[{"deployment":"taxila-opus"}]')
    _, err, rc = psql(db, f"select forge_publish({rid2}, '{art2}', {seq2}, 'job:2')", check=False)
    check('F12', 'I-F13: a model outside allowed_model cannot publish', rc != 0 and 'not allowed' in err, err.split('\n')[0][:80])
    psql(db, "update allowed_model set allowed_until = ist_today() where deployment='taxila-sora'")
    one(db, demand(None, 'k_vid', 'term', 'image', 'svg'))
    rid3, art3, seq3 = build(db, 'k_vid', 'image', 'svg', models='[{"deployment":"taxila-sora"}]')
    _, err, rc = psql(db, f"select forge_publish({rid3}, '{art3}', {seq3}, 'job:3')", check=False)
    check('F13', 'I-F13: a deployment on its retirement day cannot publish (sora on 2026-10-15)', rc != 0 and 'not allowed' in err, err.split('\n')[0][:80])
    # human tier: T3 kit_extended (subject + lang per served language)
    one(db, demand(A, 'k_t3h', 'next_lesson', 'T3', 'kit_extended', "ist_today()+1"))
    rid4, art4, seq4 = build(db, 'k_t3h', 'T3', 'kit_extended', reviewed='null', langs="'{hi,en}'",
                             egress="'{\"policy\":\"deny\",\"runnerIdentity\":\"none\"}'::jsonb", ast='true',
                             csp='(select csp_hash from forge_policy)')
    n = one(db, f"select review_enqueue({rid4}, {seq4}, '{art4}')")
    due_ok = one(db, f"select bool_and(sla_due_at <= ((ist_today()+1)::timestamp + interval '15 hours') at time zone 'Asia/Kolkata' and escalate_at < sla_due_at) from review_item where artifact_id='{art4}'")
    check('F14', 'review_enqueue: subject + lang(hi) + lang(en) items, next_lesson SLA capped at 15:00 IST of wanted_by',
          n == '3' and due_ok == 't', f"items={n} slaOK={due_ok}")
    _, err, rc = psql(db, f"select forge_publish({rid4}, '{art4}', (select state_seq from forge_request where id={rid4}), 'x')", check=False)
    check('F15', 'I-F1: a human tier cannot publish before its keys', rc != 0, err.split('\n')[0][:80])
    ids = [one(db, "select review_next('r1')") for _ in range(3)]
    outs = [one(db, f"select review_decide({i}, 'r1', 'approve', '{{}}', 30)") for i in ids]
    grade = one(db, f"select review_grade from forge_artifact where id='{art4}'")
    check('F16', 'three approvals publish on the last key; one reviewer = one_key',
          outs[-1] == 'published' and grade == 'one_key' and one(db, f"select state from forge_request where id={rid4}") == 'published', f"{outs} {grade}")
    # T3 without egress attestation
    one(db, demand(None, 'k_t3e', 'term', 'T3', 'kit_extended'))
    rid5, art5, seq5 = build(db, 'k_t3e', 'T3', 'kit_extended', reviewed='null', langs="'{}'")
    one(db, f"select review_enqueue({rid5}, {seq5}, '{art5}')")
    i = one(db, "select review_next('r1')")
    _, err, rc = psql(db, f"select review_decide({i}, 'r1', 'approve', '{{}}', 30)", check=False)
    check('F17', 'I-F8: a T3 build with no egress/CSP attestation cannot publish even when approved', rc != 0 and 'attestation' in err, err.split('\n')[0][:80])
    # quarantine + ready_for + served
    before = one(db, f"select count(*) from forge_ready_for('{A}')")
    one(db, f"insert into module_run (lesson_id, engine, params, source, artifact_id) values ('{LES}','eng@1','{{}}','module_ready','fa_k_t1a')")
    after_serve = one(db, f"select count(*) from forge_ready_for('{A}')")
    one(db, f"select forge_quarantine({rid4}, 'ops', 'safety', '{{}}')")
    after_q = one(db, f"select count(*) from forge_ready_for('{A}')")
    bl = one(db, "select count(*) from forge_blocklist where content_hash='h_k_t3h'")
    check('F18', 'forge_ready_for: served rows drop out; quarantine removes module_ready and blocklists the hash at once',
          (before, after_serve, after_q, bl) == ('2', '1', '0', '1'), f"ready {before}->{after_serve}->{after_q}, blocklisted={bl}")
    # rework then reject
    one(db, demand(None, 'k_t3r', 'term', 'T3', 'kit_extended'))
    rid6, art6, seq6 = build(db, 'k_t3r', 'T3', 'kit_extended', reviewed='null')
    one(db, f"select review_enqueue({rid6}, {seq6}, '{art6}')")
    i = one(db, "select review_next('r1')")
    o1 = one(db, f"select review_decide({i}, 'r1', 'request_changes', '{{layout}}', 30)")
    st = one(db, f"select state||':'||rework_count from forge_request where id={rid6}")
    check('F19', 'request_changes reworks once (human_review → spec, rework_count 1)', o1 == 'rework' and st == 'spec:1', f"{o1} {st}")
    # sweep + escalate
    psql(db, f"update forge_waiter set wanted_by = ist_today()-1")
    psql(db, "update review_item set escalate_at = now() - interval '1 minute' where status in ('open','claimed')")
    sw = one(db, "select forge_sweep()")
    esc = one(db, "select review_escalate(100)")
    to = one(db, "select string_agg(distinct coalesce(assigned_to,'-'), ',') from review_item where status='escalated'")
    check('F20', 'sweep drops past-wanted_by waiters; escalation moves overdue items to the backup reviewer',
          int(sw) >= 1 and one(db, "select count(*) from forge_waiter") == '0' and int(esc) >= 1, f"swept={sw} escalated={esc} to={to}")
    psql('postgres', f'drop database {db}')

# ───────────────────────────── race cells ─────────────────────────────
def fn_body(sql_text, name):
    m = re.search(r"create or replace function " + name + r"\(.*?\n\$\$;\n|create or replace function " + name + r"\(.*?end \$\$;", sql_text, re.S)
    return m.group(0)

def inject(fn_sql, after_regex, sleep=0.6, newname=None):
    out, n = re.subn(after_regex, lambda mm: mm.group(0) + f"\n  perform pg_sleep({sleep});", fn_sql, count=1, flags=re.S)
    assert n == 1, after_regex
    if newname:
        out = re.sub(r"create or replace function (\w+)\(", f"create or replace function {newname}(", out, count=1)
    return out

def run_pair(db, sql1, sql2, delay=0.15):
    p1 = subprocess.Popen(['psql', '-h', HOST, '-p', PORT, '-U', 'postgres', '-d', db, '-q', '-X', '-t', '-A', '-c', sql1],
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    time.sleep(delay)
    p2 = subprocess.Popen(['psql', '-h', HOST, '-p', PORT, '-U', 'postgres', '-d', db, '-q', '-X', '-t', '-A', '-c', sql2],
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    o1, e1 = p1.communicate(); o2, e2 = p2.communicate()
    return (e1 + e2).count('deadlock detected'), o1 + o2

def races():
    g2 = open(FORGE).read()
    g1_path = os.path.join(HERE, 'content-orchestration.g1-frozen.sql')   # optional: the revision-G1 text, for the controls
    g1 = open(g1_path).read() if os.path.exists(g1_path) else None
    db = fresh('forge_probe_r')
    # D1: two Conductor commits (children A, B) each filing keys k_x and k_y; control = opposite orders; treatment = sorted.
    for label, orderA, orderB, expect in (('D1 control: commits file k_x/k_y in opposite orders', ('k_x', 'k_y'), ('k_y', 'k_x'), '>0'),
                                         ('D1 G2: both commits sorted by library_key', ('k_x', 'k_y'), ('k_x', 'k_y'), '=0')):
        dl = 0
        for t in range(5):
            psql(db, "truncate forge_waiter, module_ready, forge_transition, review_item cascade; delete from forge_artifact; delete from forge_request;")
            s1 = f"begin; {demand(A, orderA[0])}; select pg_sleep(0.5); {demand(A, orderA[1])}; commit;"
            s2 = f"begin; {demand(B, orderB[0])}; select pg_sleep(0.5); {demand(B, orderB[1])}; commit;"
            d, _ = run_pair(db, s1, s2); dl += d
        check(label.split(':')[0], label, (dl > 0) if expect == '>0' else (dl == 0), f"deadlocks {dl}/5")
    # D2: publish of k_new (supersedes k_old) vs a commit filing k_old then k_new (sorted: k_new > k_old).
    for label, variant, expect in (('D2 control: G1 publish locks the new request before the superseded one', 'g1', '>0'),
                                   ('D2 G2: publish locks both in library_key order', 'g2', '=0')):
        if variant == 'g1' and g1 is None:
            check('D2', label + ' (skipped: no G1 text on disk)', True, 'skipped'); continue
        if variant == 'g1':
            f = inject(fn_body(g1, 'forge_publish'), r"select \* into r from forge_request where id = p_request for update;", newname='probe_publish')
        else:
            f = inject(fn_body(g2, 'forge_publish'), r"order by library_key for update;", newname='probe_publish')
        psql(db, f)
        dl = 0
        for t in range(5):
            psql(db, "truncate forge_waiter, module_ready, forge_transition, review_item cascade; delete from forge_artifact; update forge_request set supersedes_request_id=null; delete from forge_request;")
            one(db, demand(None, 'k_old', 'term'))
            rid_o, art_o, seq_o = build(db, 'k_old')
            one(db, f"select forge_publish({rid_o}, '{art_o}', {seq_o}, 'p')")
            one(db, demand(None, 'k_new', 'term'))
            psql(db, f"update forge_request set supersedes_request_id={rid_o} where library_key='k_new'")
            rid_n, art_n, seq_n = build(db, 'k_new')
            s_pub = f"select probe_publish({rid_n}, '{art_n}', {seq_n}, 'p')"
            s_com = f"begin; {demand(A, 'k_old', 'next_lesson')}; select pg_sleep(0.5); {demand(A, 'k_new', 'next_lesson')}; commit;"
            d, _ = run_pair(db, s_pub, s_com, 0.25); dl += d
        check(label.split(':')[0], label, (dl > 0) if expect == '>0' else (dl == 0), f"deadlocks {dl}/5")
    # D3: two reviewers decide two keys of one artefact at once (reject + approve).
    for label, variant, expect in (('D3 control: G1 review_decide locks the item before forge_request', 'g1', '>0'),
                                   ('D3 G2: review_decide locks forge_request first', 'g2', '=0')):
        if variant == 'g1' and g1 is None:
            check('D3', label + ' (skipped: no G1 text on disk)', True, 'skipped'); continue
        if variant == 'g1':
            f = inject(fn_body(g1, 'review_decide'), r"select \* into i from review_item where id = p_item for update;", newname='probe_decide')
        else:
            f = inject(fn_body(g2, 'review_decide'), r"select \* into r from forge_request where id = v_req for update;", newname='probe_decide')
        psql(db, f)
        dl = 0; states = []
        for t in range(5):
            psql(db, "truncate forge_waiter, module_ready, forge_transition, review_item cascade; delete from forge_artifact; update forge_request set supersedes_request_id=null; delete from forge_request;")
            one(db, demand(None, 'k_rv', 'term', 'T3', 'free_form'))
            rid, art, seq = build(db, 'k_rv', 'T3', 'free_form', reviewed='null')
            one(db, f"select review_enqueue({rid}, {seq}, '{art}')")
            i1, i2 = one(db, f"select string_agg(id::text, ',' order by id) from review_item where artifact_id='{art}'").split(',')
            d, _ = run_pair(db, f"select probe_decide({i1}, 'r1', 'reject', '{{x}}', 10)",
                            f"select probe_decide({i2}, 'r2', 'approve', '{{}}', 10)", 0.2); dl += d
            states.append(one(db, f"select state from forge_request where id={rid}"))
        check(label.split(':')[0], label, (dl > 0) if expect == '>0' else (dl == 0), f"deadlocks {dl}/5; final states {sorted(set(states))}")
    # D4: Conductor commit filing k_z for child A vs forge_publish(k_z), both orders: never a deadlock, never a lost
    #     waiter (A always ends with exactly one module_ready row for k_z: I-F5).
    for label, first in (('D4 commit first, then publish', 'commit'), ('D4 publish first, then commit', 'publish')):
        dl = 0; ready = []
        for t in range(5):
            psql(db, "truncate forge_waiter, module_ready, forge_transition, review_item cascade; delete from forge_artifact; update forge_request set supersedes_request_id=null; delete from forge_request;")
            one(db, demand(None, 'k_z', 'term'))
            rid, art, seq = build(db, 'k_z')
            s_com = f"begin; select pg_sleep(0.1); {demand(A, 'k_z', 'next_lesson')}; select pg_sleep(0.5); commit;"
            s_pub = f"begin; select forge_publish({rid}, '{art}', {seq}, 'p'); select pg_sleep(0.5); commit;"
            d, _ = (run_pair(db, s_com, s_pub, 0.3) if first == 'commit' else run_pair(db, s_pub, s_com, 0.2)); dl += d
            ready.append(one(db, f"select count(*) from module_ready where child_id='{A}' and library_key='k_z'"))
        check('D4', label, dl == 0 and ready == ['1'] * 5, f"deadlocks {dl}/5; module_ready rows {ready}")
    psql('postgres', f'drop database {db}')

if __name__ == '__main__':
    v = one('postgres', 'show server_version')
    print('server_version', v)
    functional()
    races()
    bad = [r for r in results if not r[2]]
    print(f"\n{len(results) - len(bad)}/{len(results)} checks as expected")
    sys.exit(1 if bad else 0)
