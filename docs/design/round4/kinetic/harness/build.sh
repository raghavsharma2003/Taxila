#!/bin/sh
# concatenate the parts into the single deliverable file
D=/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-kinetic
OUT=/home/user/Taxila/docs/design/round4/kinetic/index.html
{ cat $D/src/1-head.html; cat $D/src/2-body.html; printf '<script>\n'; cat $D/src/4-app.js; printf '</script>\n'; } > $OUT
# local preview with a publish-like skeleton
{ printf '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style></head><body>\n'; cat $OUT; printf '</body></html>\n'; } > $D/preview.html
node --check $D/src/4-app.js && wc -c $OUT
