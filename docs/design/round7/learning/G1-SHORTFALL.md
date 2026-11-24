# G1 shortfall: class 4-7 grammar skills with fewer than 6 built sentence-train items (2026-11-04)

From `data/play/vakya/index.json` as `node server/play/tools/build-vakya.mjs` makes it after
`node scripts/kits/tag-grammar.mjs`. Columns:
- **items**: the kit's items on the skill;
- **verified**: blind-solved;
- **built**: admitted as a sentence train;
- **short**: 6 − built.

Every one of the 85 skills is short, so G1 (`node scripts/kits/run.mjs g1`) authors for all of them.

| class/subject | grammar skills | built now | skills at >= 6 | items short of 6 |
|---|---|---|---|---|
| c4-english | 12 | 10 | 0 | 62 |
| c4-hindi | 9 | 6 | 0 | 48 |
| c5-english | 11 | 9 | 0 | 57 |
| c5-hindi | 8 | 0 | 0 | 48 |
| c6-english | 18 | 17 | 0 | 91 |
| c6-hindi | 3 | 2 | 0 | 16 |
| c7-english | 20 | 22 | 0 | 98 |
| c7-hindi | 4 | 0 | 0 | 24 |
| **total** | **85** | **66** | **0** | **444** |

| skill | items | verified | built | short |
|---|---|---|---|---|
| c4-english-ch01-t01-s4 | 4 | 4 | 0 | 6 |
| c4-english-ch02-t01-s4 | 3 | 3 | 0 | 6 |
| c4-english-ch03-t01-s3 | 4 | 4 | 0 | 6 |
| c4-english-ch04-t01-s4 | 3 | 3 | 2 | 4 |
| c4-english-ch05-t01-s4 | 3 | 3 | 1 | 5 |
| c4-english-ch06-t01-s4 | 4 | 4 | 0 | 6 |
| c4-english-ch07-t01-s4 | 4 | 4 | 1 | 5 |
| c4-english-ch08-t01-s4 | 4 | 4 | 2 | 4 |
| c4-english-ch09-t01-s4 | 4 | 4 | 1 | 5 |
| c4-english-ch10-t01-s4 | 5 | 5 | 1 | 5 |
| c4-english-ch11-t01-s4 | 4 | 4 | 1 | 5 |
| c4-english-ch12-t01-s4 | 5 | 5 | 1 | 5 |
| c4-hindi-ch02-t01-s5 | 5 | 5 | 1 | 5 |
| c4-hindi-ch03-t01-s4 | 3 | 3 | 1 | 5 |
| c4-hindi-ch05-t01-s5 | 4 | 4 | 2 | 4 |
| c4-hindi-ch06-t01-s4 | 4 | 4 | 1 | 5 |
| c4-hindi-ch07-t01-s5 | 3 | 3 | 0 | 6 |
| c4-hindi-ch08-t01-s5 | 4 | 4 | 0 | 6 |
| c4-hindi-ch09-t01-s5 | 4 | 4 | 1 | 5 |
| c4-hindi-ch10-t01-s4 | 3 | 3 | 0 | 6 |
| c4-hindi-ch13-t01-s5 | 3 | 3 | 0 | 6 |
| c5-english-ch01-t01-s4 | 5 | 5 | 1 | 5 |
| c5-english-ch02-t01-s2 | 5 | 5 | 1 | 5 |
| c5-english-ch04-t01-s3 | 4 | 4 | 0 | 6 |
| c5-english-ch05-t01-s3 | 4 | 4 | 0 | 6 |
| c5-english-ch05-t01-s4 | 3 | 3 | 0 | 6 |
| c5-english-ch06-t01-s4 | 3 | 3 | 2 | 4 |
| c5-english-ch07-t01-s4 | 4 | 4 | 1 | 5 |
| c5-english-ch08-t01-s4 | 4 | 4 | 0 | 6 |
| c5-english-ch09-t01-s3 | 4 | 4 | 2 | 4 |
| c5-english-ch09-t01-s4 | 3 | 3 | 1 | 5 |
| c5-english-ch10-t01-s3 | 3 | 3 | 1 | 5 |
| c5-hindi-ch01-t01-s4 | 5 | 5 | 0 | 6 |
| c5-hindi-ch03-t01-s4 | 2 | 2 | 0 | 6 |
| c5-hindi-ch04-t01-s5 | 4 | 4 | 0 | 6 |
| c5-hindi-ch05-t01-s5 | 6 | 6 | 0 | 6 |
| c5-hindi-ch06-t01-s4 | 4 | 4 | 0 | 6 |
| c5-hindi-ch07-t01-s4 | 3 | 3 | 0 | 6 |
| c5-hindi-ch10-t01-s5 | 5 | 5 | 0 | 6 |
| c5-hindi-ch12-t01-s4 | 4 | 4 | 0 | 6 |
| c6-english-ch01-t01-s5 | 5 | 5 | 2 | 4 |
| c6-english-ch02-t01-s5 | 3 | 3 | 2 | 4 |
| c6-english-ch03-t01-s5 | 5 | 5 | 0 | 6 |
| c6-english-ch04-t01-s5 | 5 | 5 | 0 | 6 |
| c6-english-ch05-t01-s5 | 5 | 5 | 2 | 4 |
| c6-english-ch06-t01-s5 | 3 | 3 | 0 | 6 |
| c6-english-ch07-t01-s5 | 5 | 5 | 1 | 5 |
| c6-english-ch08-t01-s5 | 4 | 4 | 0 | 6 |
| c6-english-ch09-t01-s4 | 4 | 4 | 1 | 5 |
| c6-english-ch09-t01-s5 | 4 | 4 | 2 | 4 |
| c6-english-ch10-t01-s5 | 4 | 4 | 0 | 6 |
| c6-english-ch11-t01-s5 | 4 | 4 | 0 | 6 |
| c6-english-ch12-t01-s5 | 3 | 3 | 1 | 5 |
| c6-english-ch13-t01-s5 | 2 | 2 | 1 | 5 |
| c6-english-ch14-t01-s5 | 4 | 4 | 1 | 5 |
| c6-english-ch15-t01-s4 | 3 | 3 | 1 | 5 |
| c6-english-ch15-t01-s5 | 4 | 4 | 2 | 4 |
| c6-english-ch16-t01-s5 | 4 | 4 | 1 | 5 |
| c6-hindi-ch02-t01-s4 | 4 | 4 | 1 | 5 |
| c6-hindi-ch06-t01-s4 | 4 | 4 | 0 | 6 |
| c6-hindi-ch09-t01-s4 | 5 | 5 | 1 | 5 |
| c7-english-ch01-t01-s3 | 6 | 6 | 5 | 1 |
| c7-english-ch02-t01-s4 | 4 | 4 | 0 | 6 |
| c7-english-ch03-t01-s3 | 5 | 5 | 0 | 6 |
| c7-english-ch04-t01-s2 | 3 | 3 | 0 | 6 |
| c7-english-ch04-t01-s3 | 5 | 5 | 0 | 6 |
| c7-english-ch05-t01-s4 | 6 | 6 | 0 | 6 |
| c7-english-ch06-t01-s2 | 5 | 5 | 2 | 4 |
| c7-english-ch07-t01-s3 | 6 | 6 | 2 | 4 |
| c7-english-ch08-t01-s3 | 6 | 6 | 0 | 6 |
| c7-english-ch08-t01-s4 | 3 | 3 | 0 | 6 |
| c7-english-ch09-t01-s3 | 5 | 5 | 3 | 3 |
| c7-english-ch10-t01-s3 | 5 | 5 | 3 | 3 |
| c7-english-ch11-t01-s3 | 5 | 5 | 0 | 6 |
| c7-english-ch11-t01-s4 | 4 | 4 | 0 | 6 |
| c7-english-ch12-t01-s3 | 4 | 4 | 1 | 5 |
| c7-english-ch13-t01-s2 | 6 | 6 | 4 | 2 |
| c7-english-ch14-t01-s3 | 4 | 4 | 0 | 6 |
| c7-english-ch14-t01-s4 | 4 | 4 | 0 | 6 |
| c7-english-ch15-t01-s3 | 4 | 4 | 0 | 6 |
| c7-english-ch15-t01-s4 | 3 | 3 | 2 | 4 |
| c7-hindi-ch03-t01-s4 | 3 | 3 | 0 | 6 |
| c7-hindi-ch03-t01-s5 | 2 | 2 | 0 | 6 |
| c7-hindi-ch08-t01-s4 | 3 | 3 | 0 | 6 |
| c7-hindi-ch09-t01-s4 | 2 | 2 | 0 | 6 |
