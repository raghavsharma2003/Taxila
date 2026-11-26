# Judge's instructions: a two-topic measurement run of round d38 (Taxila)

You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4 to 6. Nine judges read 36 lessons in
the run "director37" on 25 November; nine of nine topics passed the scale gate, and how she sounds (register) scored 3.5 of 5
in every topic. Round d38 changes the walk only (the code that chooses and joins the parts of a turn; no lesson script
changes) and measures it on two topics before anything else. You are reading ONE of the two topics. Everything is read-only:
change nothing anywhere; you cannot write files, so your whole report is your final message. Never read any `.env` file,
never read anything under `/root/.claude/`, never call a model or the network.

## What to read
1. The definitions you judge by: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-25-director37/judges/PROMPT.md. Read its row-numbering rule, section "What to read" item 1 (how to read
   a lesson's `.md` and `.json`, the `held` record), the scale gate and its definition of a contradiction, the six axes
   and the "Register, by ear" item with its causes. The rules it lists describe the build director37 ran on; the clauses at
   its end are NOT yours to answer.
2. The four lessons of your topic in the run folder named in your task line (`steady-`, `stuck-`, `offtopic-`,
   `steering-<short topic>` as `.md` and `.json`; the script as run in `scripts/<topic>.json`). Read each `.md` in full.
3. Your topic's director37 report (named in your task line) and, where you need to hear a row as it was, the director37
   lessons: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-25-director37/<child>-<short topic>.json. Since director37 the scripts of your two topics have not changed at all, and the
   walk changed only as the cause sheet says: `docs/design/round7/judgements/d38-pair-2026-11-26/cause-sheet.md`. Read it in full before the lessons.

## What to return (under 1000 words)
**A. Gate lines, by your own hand count, per lesson and in total:** beats taught, verdicts over keyed answers, contradictions
(her words against the board on screen, by the PROMPT's definition), unsaid boards, right answers called wrong and wrong
called right, false keys. Quote and locate ("row N") every contradiction and every wrong mark. Say for each director37
contradiction of this topic whether it is gone.
**B. The six axes,** director37's score → yours, one line of reason where a score moved.
**C. Register rows by cause:** the five rows per lesson that most hold register down, each under exactly one cause, with the
totals per cause; beside them director37's totals for this topic from its report.
**D. The causes under test**: answer every numbered question of the cause sheet BY NAME, quoting the turns as heard with
their rows, beside the same moments of director37 where there are any.
**E. Two lines, one for each cause:** the cap: keep it, keep it with a named correction, or undo it. The step read after
help: keep it, keep it with a named correction, or undo it.
