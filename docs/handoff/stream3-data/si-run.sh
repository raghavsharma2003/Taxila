#!/bin/bash
# Run a command with TEST chat traffic on the southindia account (main, 2026-10-15), from .env.local, in this process only.
cd /home/user/Taxila
set -a; . tests/prod/prod-routing.env; set +a
eval "$(node -e '
const fs=require("fs");const e={};for(const l of fs.readFileSync(".env.local","utf8").split("\n")){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^"(.*)"$/,"$1")}
const q=(s)=>"\x27"+String(s).replace(/\x27/g,"\x27\\\x27\x27")+"\x27";
for (const L of ["CHAT","RESPONSES"]) { console.log(`export AZURE_OPENAI_ENDPOINT_${L}=${q(e.AZURE_OPENAI_ENDPOINT_SIN)}`); console.log(`export AZURE_OPENAI_API_KEY_${L}=${q(e.AZURE_OPENAI_API_KEY_SIN)}`); }')"
export TAXILA_DB=test
exec "$@"
