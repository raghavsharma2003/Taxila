#!/bin/sh
# Rebuild samples/ref-*.mp3 from the archived trimmed originals (REF_RAW_DIR/<CODE>.trim.wav) with the same
# two-pass linear loudnorm as gen-ref.mjs. Used after the samples/ directory was wiped by a concurrent re-run.
RAW=${REF_RAW_DIR:?set REF_RAW_DIR}; OUT=$(dirname "$0")/samples
for w in "$RAW"/*.trim.wav; do c=$(basename "$w" .trim.wav); o="$OUT/ref-$c.mp3"; [ -f "$o" ] && continue
  m=$(ffmpeg -hide_banner -i "$w" -af loudnorm=I=-24:TP=-1:LRA=20:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
  g() { echo "$m" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
  ffmpeg -hide_banner -loglevel error -y -i "$w" -af "loudnorm=I=-24:TP=-1:LRA=20:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 24000 -ac 1 -c:a libmp3lame -b:a 64k "$o"
done
