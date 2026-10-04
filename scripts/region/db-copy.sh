#!/usr/bin/env bash
# The in-job half of scripts/region/db-copy.mjs (read that file's header first). Runs in a stock postgres:17 image
# inside the ACA environment's VNet. Inputs (env): SRC_URL, DST_URL (secrets), MODE copy|verify|migrations, EXPECTED
# (comma list of db/migrations files), REPLACE 0|1, TLS_MODE verify-full|require, ROOTS_PEM. Output: DBCOPY_* lines on
# stdout (read back from Log Analytics) and errors; never a connection string. Exit 0 only when everything matched.
set -uo pipefail
T0=$(date +%s)
WD=$(mktemp -d)   # fresh per run: a stale snapshot file or fifo must never be picked up
export PGTZ=UTC PGDATESTYLE=ISO PGCLIENTENCODING=UTF8 PGCONNECT_TIMEOUT=20 PGAPPNAME=taxila-dbcopy
printf '%s\n' "$ROOTS_PEM" > $WD/roots.pem
if [ "$TLS_MODE" = "require" ]; then export PGSSLMODE=require; else export PGSSLMODE=verify-full PGSSLROOTCERT=$WD/roots.pem; fi
emit() { echo "DBCOPY_$1 $2"; }
clean() { tr '"\\\n\r\t' "'/   " | cut -c1-600; }
fail() { emit RESULT "{\"ok\":false,\"mode\":\"$MODE\",\"stage\":\"$1\",\"error\":\"$(printf '%s' "$2" | clean)\"}"; emit DONE "{}"; exit 1; }
RO="-c default_transaction_read_only=on"
src() { PGOPTIONS="$RO" psql "$SRC_URL" -X -q -v ON_ERROR_STOP=1 -At "$@"; }
# only copy mode writes the target; verify and migrations sessions are read-only too
DST_OPTS=""; [ "$MODE" = "copy" ] || DST_OPTS="$RO"
dst() { PGOPTIONS="$DST_OPTS" psql "$DST_URL" -X -q -v ON_ERROR_STOP=1 -At "$@"; }
INFO="select current_setting('server_version') || '|' || coalesce((select (case when ssl then 't' else 'f' end) || '|' || coalesce(version,'') from pg_stat_ssl where pid = pg_backend_pid()), 'f|')"
emit START "{\"mode\":\"$MODE\",\"client\":\"$(pg_dump --version | clean)\",\"tls\":\"$PGSSLMODE\"}"

# TLS is enforced by libpq (PGSSLMODE above refuses a plaintext session) and confirmed CLIENT-side with \conninfo:
# pg_stat_ssl is server-side and reads f behind a TLS-terminating proxy (Neon), so it is reported, not required.
tls_of() { $1 -c '\conninfo' 2>&1 | grep -o 'SSL connection (protocol: [^,]*' | sed 's/.*protocol: //'; }
D_INFO=$(dst -c "$INFO" 2>&1) || fail connect_target "$D_INFO"
D_TLS=$(tls_of dst); [ -n "$D_TLS" ] || fail tls_target "target session is not TLS"
D_INFO="$D_INFO|client:$D_TLS"
S_INFO=""
if [ "$MODE" != "migrations" ]; then
  S_INFO=$(src -c "$INFO" 2>&1) || fail connect_source "$S_INFO"
  S_TLS=$(tls_of src); [ -n "$S_TLS" ] || fail tls_source "source session is not TLS"
  S_INFO="$S_INFO|client:$S_TLS"
fi

TABLES_SQL="select tablename from pg_tables where schemaname = 'public' order by 1"
SNAP=""
if [ "$MODE" = "copy" ]; then
  # one snapshot for the dump AND the source checksums: hold an exporting read-only transaction open on a fifo
  mkfifo $WD/hold
  ( PGOPTIONS="$RO" psql "$SRC_URL" -X -q -v ON_ERROR_STOP=1 -At < $WD/hold > $WD/hold.out 2>&1 ) &
  HOLD_PID=$!
  exec 3>$WD/hold
  echo "begin isolation level repeatable read read only;" >&3
  echo "\copy (select pg_export_snapshot()) to '$WD/snap.txt'" >&3
  for i in $(seq 1 60); do [ -s $WD/snap.txt ] && break; sleep 1; done
  SNAP=$(cat $WD/snap.txt 2>/dev/null)
  [ -n "$SNAP" ] || fail snapshot "could not export a source snapshot: $(cat $WD/hold.out 2>/dev/null)"

  N=$(dst -c "select count(*) from pg_tables where schemaname = 'public'") || fail target_probe "$N"
  if [ "$N" != "0" ]; then
    [ "$REPLACE" = "1" ] || fail target_not_empty "target has $N public tables; pass --replace to overwrite"
    OUT=$(dst -c "drop schema public cascade" -c "create schema public" 2>&1) || fail replace "$OUT"
  fi
  EXTS=$(src -c "select coalesce(string_agg(extname, ' ' order by extname), '') from pg_extension where extname <> 'plpgsql'") || fail extensions "$EXTS"
  for e in $EXTS; do
    OUT=$(dst -c "create extension if not exists \"$e\"" 2>&1) || fail extension "$e on target (allow-list it in azure.extensions): $OUT"
  done
  S1=$(date +%s)
  OUT=$(PGOPTIONS="$RO" pg_dump "$SRC_URL" --snapshot="$SNAP" -Fc -n public --no-owner --no-privileges -f $WD/db.dump 2>&1) || fail dump "$OUT"
  DUMP_BYTES=$(stat -c %s $WD/db.dump)
  S2=$(date +%s)
  # -n public dumps CREATE SCHEMA public (and its comment), which the target already has: restore everything else
  pg_restore -l $WD/db.dump | grep -vE '^[0-9]+; [0-9]+ [0-9]+ (SCHEMA - public |COMMENT - SCHEMA public )' > $WD/db.list
  OUT=$(pg_restore -d "$DST_URL" -L $WD/db.list --no-owner --no-privileges --single-transaction --exit-on-error $WD/db.dump 2>&1) || fail restore "$OUT"
  S3=$(date +%s)
  dst -c "analyze" >/dev/null 2>&1 || true
  emit STEP "{\"dumpBytes\":$DUMP_BYTES,\"dumpS\":$((S2-S1)),\"restoreS\":$((S3-S2)),\"extensions\":\"$EXTS\"}"
fi

# per-table checksums. The source side runs inside the dump's snapshot when there is one.
sums() { # $1 = src|dst  $2 = snapshot or ""
  local side=$1 snap=$2 tables sql t
  tables=$($side -c "$TABLES_SQL") || return 1
  sql=""
  [ -n "$snap" ] && sql="begin isolation level repeatable read read only; set transaction snapshot '$snap';"
  for t in $tables; do
    sql="$sql select '$t' || '|' || count(*) || '|' || coalesce(md5(string_agg(h, '' order by h)), '-') from (select md5(x::text) h from public.\"$t\" x) s;"
  done
  sql="$sql select '#seq|' || coalesce(string_agg(sequencename || '=' || coalesce(last_value::text, 'null'), ',' order by sequencename), '') from pg_sequences where schemaname = 'public';"
  sql="$sql select '#mig|' || coalesce((select string_agg(name, ',' order by name) from schema_migrations), '');"
  [ -n "$snap" ] && sql="$sql commit;"
  printf '%s\n' "$sql" | $side -f -
}

DST_SUMS=$(sums dst "" 2>&1) || fail checksum_target "$DST_SUMS"
D_MIG=$(printf '%s\n' "$DST_SUMS" | sed -n 's/^#mig|//p')
MISSING=""
for m in $(printf '%s' "$EXPECTED" | tr ',' ' '); do
  case ",$D_MIG," in *",$m,"*) ;; *) MISSING="$MISSING${MISSING:+,}$m" ;; esac
done

OK=true; MISMATCH=""; S_MIG=""; SEQ_OK=null; NT=0
if [ "$MODE" != "migrations" ]; then
  SRC_SUMS=$(sums src "$SNAP" 2>&1) || fail checksum_source "$SRC_SUMS"
  S_MIG=$(printf '%s\n' "$SRC_SUMS" | sed -n 's/^#mig|//p')
  ALL=$( (printf '%s\n' "$SRC_SUMS"; printf '%s\n' "$DST_SUMS") | grep -v '^#' | cut -d'|' -f1 | sort -u)
  for t in $ALL; do
    NT=$((NT+1))
    S=$(printf '%s\n' "$SRC_SUMS" | grep "^$t|" | head -1); D=$(printf '%s\n' "$DST_SUMS" | grep "^$t|" | head -1)
    SR=$(printf '%s' "$S" | cut -d'|' -f2); DR=$(printf '%s' "$D" | cut -d'|' -f2)
    SM=$(printf '%s' "$S" | cut -d'|' -f3); DM=$(printf '%s' "$D" | cut -d'|' -f3)
    M=true; { [ -n "$S" ] && [ -n "$D" ] && [ "$SR" = "$DR" ] && [ "$SM" = "$DM" ]; } || { M=false; OK=false; MISMATCH="$MISMATCH${MISMATCH:+,}$t"; }
    emit TABLE "{\"t\":\"$t\",\"srcRows\":${SR:-null},\"dstRows\":${DR:-null},\"checksumMatch\":$([ "$SM" = "$DM" ] && echo true || echo false),\"match\":$M}"
  done
  SSEQ=$(printf '%s\n' "$SRC_SUMS" | sed -n 's/^#seq|//p'); DSEQ=$(printf '%s\n' "$DST_SUMS" | sed -n 's/^#seq|//p')
  if [ "$SSEQ" = "$DSEQ" ]; then SEQ_OK=true; else SEQ_OK=false; OK=false; fi
  [ "$S_MIG" = "$D_MIG" ] || OK=false
fi
[ -z "$MISSING" ] || OK=false
if [ -n "$SNAP" ]; then echo "commit;" >&3; exec 3>&-; wait $HOLD_PID 2>/dev/null; fi

j() { printf '"%s"' "$(printf '%s' "$1" | clean)"; }
emit RESULT "{\"ok\":$OK,\"mode\":\"$MODE\",\"seconds\":$(( $(date +%s) - T0 )),\"target\":$(j "$D_INFO"),\"source\":$(j "$S_INFO"),\"tables\":$NT,\"mismatched\":$(j "$MISMATCH"),\"sequencesMatch\":$SEQ_OK,\"targetMigrations\":$(j "$D_MIG"),\"sourceMigrations\":$(j "$S_MIG"),\"missingMigrations\":$(j "$MISSING"),\"snapshot\":$([ -n "$SNAP" ] && echo true || echo false)}"
emit DONE "{}"
[ "$OK" = true ]
