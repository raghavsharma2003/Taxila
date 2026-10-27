# QA data (round 5)

These are the container-only results of the QA stream, copied for the handoff. Read `../qa.md` first.

- `harness/`: every scratch script. The run lists are `t*.sh`, the helpers `t6common.sh` and `t13common.sh`, and the probes
  conv / end / ag / stay / sp2 / frac (`.mjs`). Paths inside them point at the old container's scratchpad, so set `S` / `Q` to new ones.
- `results/<set>/`: per-run outputs. `qa144/` covers the 14.4 → 14.4.2 rounds: the `<TAG>.json` files are conv/end/ag output,
  the `t<N><lane>.out` files are run logs, and `t<N>setup.out` the account set-ups. Passwords are redacted, and cookie state
  (`state-*.json`), `accounts.json` and screenshots were left out.
- `logs/`: server logs per candidate (`server-<sha>.log.gz`) plus the gate and test logs, all gzipped.
- `wavs/`: 16 kHz mono child-voice lines looped by the fake mic. `v2-lm-patanahi.wav` holds two segments (see `sp2.mjs`), and
  `test-only-disclosure.wav` is a disclosure line for TEST only.
- `accounts.md`: the TEST accounts (no passwords).
