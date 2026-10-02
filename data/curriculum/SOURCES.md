# Taxila curriculum seed: sources and copyright

Checked on **2026-10-02** for the **2026-27** session. Scope: Classes 1–9. Maths for 1–9, EVS for 3–5, Science for 6–9, English for 1–9, Social Science for 6–9 and Hindi for 1–9. Classes 1–2 have no EVS book: see `FOUNDATIONAL-EVS.md`. Maths, Science and EVS go down to topic level. English, SST and Hindi have chapter titles only.

## Files

| file | holds |
|---|---|
| `c{class}-{subject}.json` | one textbook (both parts where a book comes in two). Subjects: `maths`, `evs` (3–5), `science` (6–9), `english`, `sst`, `hindi` |
| `FOUNDATIONAL-EVS.md` | why there is no `c1-evs` / `c2-evs`: under NCF-SE 2023, EVS-type content in Classes 1–2 sits inside the language and maths books (sources inside) |
| `index.json` | every file with class, subject, book, chapter and topic counts, and the `verified` flag |
| `boards.json` | which boards use these NCERT books, and in which classes |
| `validate.mjs` | `node data/curriculum/validate.mjs`. It fails on bad JSON, missing schema fields, malformed or duplicate ids, and an index that disagrees with the files. It only warns on prerequisite problems and depth gaps |

Ids follow `c{class}-{subject}-ch{NN}` and `…-t{NN}`. Chapter `number` runs straight through a year. Where NCERT splits a book into Part I and Part II and restarts the numbering (Ganita Prakash 7 and 8, Exploring Society 7 and 8), each chapter also has `part` and `partChapterNumber`, so it can be matched to the printed book. Ganita Manjari 9 numbers Part II as Chapters 9–14 itself.

`edition` is the session of the book's first edition. `printing` is what the prelims PDF says (for example "Reprint 2026-27" or "First Edition August 2026").

## How each book was verified

1. **Which book is current.** The class, subject and book dropdown on <https://ncert.nic.in/textbook.php> is built by inline JavaScript. We parsed it to get the live book code for every class and subject. Old books (Math-Magic, Marigold, Looking Around, Honeydew, the old Class 8 and 9 books) still appear in that dropdown under duplicate subject entries. They were ignored in favour of the NCF-SE 2023 titles.
2. **Chapter titles.** For every book we downloaded the prelims PDF (`/textbook/pdf/{code}ps.pdf`) and read the Contents page. All chapter titles in the JSON come from those Contents pages.
3. **Topic structure (Maths, Science, EVS).** We downloaded each chapter PDF (`/textbook/pdf/{code}{NN}.pdf`, 202 PDFs) and extracted the numbered section headings (Classes 6–9) or the main activities (Classes 1–5). Topics were then grouped and **written in our own words**. Topic titles are our own labels, not the book's headings.
4. **Hindi lesson types** (`kavita`, `kahani`, `samvad`, `patra`, `ekanki` …) were read from each lesson's opening page in the chapter PDF. In Classes 1–2 the activity label printed on the lesson (सुनें कहानी / आनंदमयी कविता / मिलकर पढ़िए) is kept as `bookLabel`. Units (इकाई) are kept as `unit` where the book has them (Sarangi 1–2, Veena 3). Contents entries marked * ("for reading only"), and the unnumbered pieces in Veena 4–5, are **not chapters**. They are listed under `extraReadings` on the chapter whose PDF contains them, so chapter numbers match the printed book. Hindi 1–5 outcomes are our own words ("Learner can …").
5. **English genre tags** (`poem`, `story`, `play` …) come from each lesson's opening ("Let us recite" vs "Let us read", verse vs prose layout). Theme notes are our own one-line descriptions.

| class | subject | book | edition · printing | chapters | NCERT source | verified |
|---|---|---|---|---|---|---|
| 1 | maths | Joyful Mathematics | 2023-24 · Reprint 2026-27 | 13 | [aejm1](https://ncert.nic.in/textbook.php?aejm1=0-13) · [prelims](https://ncert.nic.in/textbook/pdf/aejm1ps.pdf) | yes |
| 1 | english | Mridang | 2023-24 · Reprint 2026-27 | 9 | [aemr1](https://ncert.nic.in/textbook.php?aemr1=0-9) · [prelims](https://ncert.nic.in/textbook/pdf/aemr1ps.pdf) | yes |
| 1 | hindi | सारंगी (Sarangi) | 2023-24 · Reprint 2026-27 | 19 | [ahsr1](https://ncert.nic.in/textbook.php?ahsr1=0-19) · [prelims](https://ncert.nic.in/textbook/pdf/ahsr1ps.pdf) | yes |
| 2 | maths | Joyful Mathematics | 2023-24 · Reprint 2026-27 | 11 | [bejm1](https://ncert.nic.in/textbook.php?bejm1=0-11) · [prelims](https://ncert.nic.in/textbook/pdf/bejm1ps.pdf) | yes |
| 2 | english | Mridang | 2023-24 · Reprint 2026-27 | 13 | [bemr1](https://ncert.nic.in/textbook.php?bemr1=0-13) · [prelims](https://ncert.nic.in/textbook/pdf/bemr1ps.pdf) | yes |
| 2 | hindi | सारंगी (Sarangi) | 2023-24 · Reprint 2026-27 | 26 | [bhsr1](https://ncert.nic.in/textbook.php?bhsr1=0-26) · [prelims](https://ncert.nic.in/textbook/pdf/bhsr1ps.pdf) | yes |
| 3 | maths | Maths Mela | 2024-25 · Reprint 2026-27 | 14 | [cemm1](https://ncert.nic.in/textbook.php?cemm1=0-14) · [prelims](https://ncert.nic.in/textbook/pdf/cemm1ps.pdf) | yes |
| 3 | evs | Our Wondrous World | 2024-25 · Reprint 2026-27 | 12 | [ceev1](https://ncert.nic.in/textbook.php?ceev1=0-12) · [prelims](https://ncert.nic.in/textbook/pdf/ceev1ps.pdf) | yes |
| 3 | english | Santoor | 2024-25 · Reprint 2026-27 | 12 | [cesa1](https://ncert.nic.in/textbook.php?cesa1=0-12) · [prelims](https://ncert.nic.in/textbook/pdf/cesa1ps.pdf) | yes |
| 3 | hindi | वीणा (Veena) | 2024-25 · Reprint 2026-27 | 18 | [chve1](https://ncert.nic.in/textbook.php?chve1=0-18) · [prelims](https://ncert.nic.in/textbook/pdf/chve1ps.pdf) | yes |
| 4 | maths | Maths Mela | 2025-26 · Reprint 2026-27 | 14 | [demm1](https://ncert.nic.in/textbook.php?demm1=0-14) · [prelims](https://ncert.nic.in/textbook/pdf/demm1ps.pdf) | yes |
| 4 | evs | Our Wondrous World | 2025-26 · Reprint 2026-27 | 10 | [deev1](https://ncert.nic.in/textbook.php?deev1=0-10) · [prelims](https://ncert.nic.in/textbook/pdf/deev1ps.pdf) | yes |
| 4 | english | Santoor | 2025-26 · Reprint 2026-27 | 12 | [desa1](https://ncert.nic.in/textbook.php?desa1=0-12) · [prelims](https://ncert.nic.in/textbook/pdf/desa1ps.pdf) | yes |
| 4 | hindi | वीणा (Veena) | 2025-26 · Reprint 2026-27 | 13 | [dhve1](https://ncert.nic.in/textbook.php?dhve1=0-13) · [prelims](https://ncert.nic.in/textbook/pdf/dhve1ps.pdf) | yes |
| 5 | maths | Maths Mela | 2025-26 · Reprint 2026-27 | 15 | [eemm1](https://ncert.nic.in/textbook.php?eemm1=0-15) · [prelims](https://ncert.nic.in/textbook/pdf/eemm1ps.pdf) | yes |
| 5 | evs | Our Wondrous World | 2025-26 · Reprint 2026-27 | 10 | [eeev1](https://ncert.nic.in/textbook.php?eeev1=0-10) · [prelims](https://ncert.nic.in/textbook/pdf/eeev1ps.pdf) | yes |
| 5 | english | Santoor | 2025-26 · Reprint 2026-27 | 10 | [eesa1](https://ncert.nic.in/textbook.php?eesa1=0-10) · [prelims](https://ncert.nic.in/textbook/pdf/eesa1ps.pdf) | yes |
| 5 | hindi | वीणा (Veena) | 2025-26 · Reprint 2026-27 | 12 | [ehve1](https://ncert.nic.in/textbook.php?ehve1=0-12) · [prelims](https://ncert.nic.in/textbook/pdf/ehve1ps.pdf) | yes |
| 6 | maths | Ganita Prakash | 2024-25 · Reprint 2026-27 | 10 | [fegp1](https://ncert.nic.in/textbook.php?fegp1=0-10) · [prelims](https://ncert.nic.in/textbook/pdf/fegp1ps.pdf) | yes |
| 6 | science | Curiosity | 2024-25 · Reprint 2026-27 | 12 | [fecu1](https://ncert.nic.in/textbook.php?fecu1=0-12) · [prelims](https://ncert.nic.in/textbook/pdf/fecu1ps.pdf) | yes |
| 6 | english | Poorvi | 2024-25 · Reprint 2026-27 | 16 | [fepr1](https://ncert.nic.in/textbook.php?fepr1=0-16) · [prelims](https://ncert.nic.in/textbook/pdf/fepr1ps.pdf) | yes |
| 6 | sst | Exploring Society: India and Beyond | 2024-25 | 14 | [fees1](https://ncert.nic.in/textbook.php?fees1=0-14) · [prelims](https://ncert.nic.in/textbook/pdf/fees1ps.pdf) | yes |
| 6 | hindi | मल्हार (Malhar) | 2024-25 · Reprint 2026-27 | 13 | [fhml1](https://ncert.nic.in/textbook.php?fhml1=0-13) · [prelims](https://ncert.nic.in/textbook/pdf/fhml1ps.pdf) | yes |
| 7 | maths | Ganita Prakash | 2025-26 · Part I: Reprint 2026-27; Part II: First Edition October 2025 | 15 | [gegp1](https://ncert.nic.in/textbook.php?gegp1=0-8) · [prelims](https://ncert.nic.in/textbook/pdf/gegp1ps.pdf)<br>[gegp2](https://ncert.nic.in/textbook.php?gegp2=0-7) · [prelims](https://ncert.nic.in/textbook/pdf/gegp2ps.pdf) | yes |
| 7 | science | Curiosity | 2025-26 · Reprint 2026-27 | 12 | [gecu1](https://ncert.nic.in/textbook.php?gecu1=0-12) · [prelims](https://ncert.nic.in/textbook/pdf/gecu1ps.pdf) | yes |
| 7 | english | Poorvi | 2025-26 · Reprint 2026-27 | 15 | [gepr1](https://ncert.nic.in/textbook.php?gepr1=0-15) · [prelims](https://ncert.nic.in/textbook/pdf/gepr1ps.pdf) | yes |
| 7 | sst | Exploring Society: India and Beyond | 2025-26 · Reprint 2026-27 | 20 | [gees1](https://ncert.nic.in/textbook.php?gees1=0-12) · [prelims](https://ncert.nic.in/textbook/pdf/gees1ps.pdf)<br>[gees2](https://ncert.nic.in/textbook.php?gees2=0-8) · [prelims](https://ncert.nic.in/textbook/pdf/gees2ps.pdf) | yes |
| 7 | hindi | मल्हार (Malhar) | 2025-26 · Reprint 2026-27 | 10 | [ghml1](https://ncert.nic.in/textbook.php?ghml1=0-10) · [prelims](https://ncert.nic.in/textbook/pdf/ghml1ps.pdf) | yes |
| 8 | maths | Ganita Prakash | 2025-26 · Part I: Reprint 2026-27; Part II: First Edition December 2025 | 14 | [hegp1](https://ncert.nic.in/textbook.php?hegp1=0-7) · [prelims](https://ncert.nic.in/textbook/pdf/hegp1ps.pdf)<br>[hegp2](https://ncert.nic.in/textbook.php?hegp2=0-7) · [prelims](https://ncert.nic.in/textbook/pdf/hegp2ps.pdf) | yes |
| 8 | science | Curiosity | 2025-26 · Reprint 2026-27 | 13 | [hecu1](https://ncert.nic.in/textbook.php?hecu1=0-13) · [prelims](https://ncert.nic.in/textbook/pdf/hecu1ps.pdf) | yes |
| 8 | english | Poorvi | 2025-26 · Reprint 2026-27 | 15 | [hepr1](https://ncert.nic.in/textbook.php?hepr1=0-15) · [prelims](https://ncert.nic.in/textbook/pdf/hepr1ps.pdf) | yes |
| 8 | sst | Exploring Society: India and Beyond | 2025-26 · Part I: Reprint 2026-27; Part II: First Edition June 2026 | 15 | [hees1](https://ncert.nic.in/textbook.php?hees1=0-7) · [prelims](https://ncert.nic.in/textbook/pdf/hees1ps.pdf)<br>[hees2](https://ncert.nic.in/textbook.php?hees2=0-8) · [prelims](https://ncert.nic.in/textbook/pdf/hees2ps.pdf) | yes |
| 8 | hindi | मल्हार (Malhar) | 2025-26 · Reprint 2026-27 | 10 | [hhml1](https://ncert.nic.in/textbook.php?hhml1=0-10) · [prelims](https://ncert.nic.in/textbook/pdf/hhml1ps.pdf) | yes |
| 9 | maths | Ganita Manjari | 2026-27 · Part I: First Edition April 2026; Part II: First Edition August 2026 | 14 | [iemh1](https://ncert.nic.in/textbook.php?iemh1=0-8) · [prelims](https://ncert.nic.in/textbook/pdf/iemh1ps.pdf)<br>[iemh2](https://ncert.nic.in/textbook.php?iemh2=0-6) · [prelims](https://ncert.nic.in/textbook/pdf/iemh2ps.pdf) | yes |
| 9 | science | Exploration | 2026-27 · First Edition April 2026 | 13 | [iesc1](https://ncert.nic.in/textbook.php?iesc1=0-13) · [prelims](https://ncert.nic.in/textbook/pdf/iesc1ps.pdf) | yes |
| 9 | english | Kaveri | 2026-27 · First Edition January 2026 | 16 | [iebe1](https://ncert.nic.in/textbook.php?iebe1=0-16) · [prelims](https://ncert.nic.in/textbook/pdf/iebe1ps.pdf) | yes |
| 9 | sst | Understanding Society: India and Beyond | 2026-27 · Part I: First Edition June 2026 | 16 | [iest1](https://ncert.nic.in/textbook.php?iest1=0-9) · [prelims](https://ncert.nic.in/textbook/pdf/iest1ps.pdf) | **no**: see note |
| 9 | hindi | गंगा (Ganga) | 2026-27 | 12 | [ihga1](https://ncert.nic.in/textbook.php?ihga1=0-12) · [prelims](https://ncert.nic.in/textbook/pdf/ihga1ps.pdf) | yes |

## What is NOT verified, or only partly verified

- **Class 9 Social Science Part II** (`c9-sst.json`, chapters 10–16, each marked `"verified": false`). As of 2026-10-02 NCERT lists only *Understanding Society: India and Beyond Part-I*. Chapters 10–16 use the **Part 2 theme names from the CBSE 2026-27 Class IX Social Science syllabus** ([PDF](https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/SocialScience_SecP1IX_2026-27.pdf)). Replace them when NCERT publishes the book. This is the only file with `"verified": false`.
- **Hindi Devanagari spellings.** The prelims PDFs' text layer garbles matras (for example "मातृभमू ि"). Titles and authors were normalised by hand. The Class 7 Malhar text layer was the worst, so check `c7-hindi.json` against the printed book first. Hindi 1–5 (Sarangi, Veena): the Contents pages of Sarangi 1 and Veena 3 and 5 garble several conjuncts (मित्र को पत्र, न्याय की कुर्सी). Those titles were checked against the chapter PDFs. Sarangi's unit names are in a legacy (Kruti Dev-style) font in the prelims and were read from the chapter PDFs. Contents re-checked against the prelims PDFs on 2026-10-02: chapter counts 19/26/18/13/12 match.
- **English theme notes** (`theme` and the "(theme: …)" in outcomes) are our own one-line summaries, written from each lesson's opening pages. They are not authoritative descriptions.
- **Primary maths topics (Classes 1–5).** Maths Mela chapter titles are story names ("Raksha Bandhan", "The Surajkund Fair"). The mathematical focus of each chapter was inferred from scanning the chapter PDF, not from a published syllabus.
- **Prerequisites** are best-effort links that we wrote. All of them resolve (see `validate.mjs`), but they are a teaching judgement, not an NCERT mapping.
- **Not covered:** CBSE's new optional *Mathematics / Science at Advanced Level* for Class 9 (2026-27); Sanskrit, Arts, Physical Education and Vocational books; and the pre-2026 Class 9 books that RBSE still prescribes (see `boards.json`).

## Board sources (`boards.json`)

- CBSE curriculum 2026-27 index: <https://cbseacademic.nic.in/curriculum_2027.html>. Class IX Maths, Science, English and SST PDFs are linked from that page. Read 2026-10-02.
- CBSE Affiliation Bye-Laws 2018, clause 2.4.7 (books): <https://www.cbse.gov.in/cbsenew/aff-bye-laws.html>
- RBSE syllabus 2026-27, Class 9: <https://rajeduboard.rajasthan.gov.in/anudeshika-etc/09_2027.pdf>. It prescribes the *old* NCERT Class 9 books (Beehive/Moments, old Mathematics, old Science, the four-book SST set). Most of the PDF is in Kruti Dev legacy encoding; the book names are in English.
- RSCERT Udaipur textbook-writing call for classes 6–8, order dated 23-05-2025 (secondary report): <https://www.shivira.in/2025/05/rscert-udaipur-invites-voluntary.html>
- CISCE prescribed-books appendix, ICSE 2027: <https://cisce.org/wp-content/uploads/2026/04/ICSE-2027-Appendix-I-List-of-Prescribed-Books.pdf>. Our fetch got HTTP 403, so the policy wording comes from search-indexed text.

**Third-party sites were consulted and not relied on.** They proved unreliable. A web-search summary built from popular "NCERT solutions" sites listed Ganita Manjari Part II as including "Statistics" and "Probability". The NCERT Part II prelims (first edition August 2026) actually lists *Propositions and their Converses, How Quantities Combine, The World of Algorithms, Quadrilaterals, Two Variables One Line, Math of Space*. Always re-check against ncert.nic.in.

## Background for the misconception entries

The misconceptions are our own phrasing of widely documented patterns. None is quoted from these works:

- K. M. Hart (ed.), *Children's Understanding of Mathematics: 11–16* (CSMS project, 1981): place value, fractions, ratio, letters in algebra (Küchemann)
- J. S. Brown & R. R. Burton (1978), "Diagnostic models for procedural bugs in basic mathematical skills": the smaller-from-larger subtraction bug
- C. Kieran (1981), "Concepts associated with the equality symbol"
- V. Steinle & K. Stacey: decimal misconceptions ("longer-is-larger", "shorter-is-larger")
- Y. Ni & Y.-D. Zhou (2005), whole-number bias in fraction learning
- E. Fischbein et al. (1985): "multiplication makes bigger, division makes smaller"
- A. Tversky & D. Kahneman (1971), "Belief in the law of small numbers": the gambler's fallacy
- R. Driver, A. Squires, P. Rushworth & V. Wood-Robinson, *Making Sense of Secondary Science* (1994): plants and food, states of matter, particles, heat vs temperature, forces, light, electricity
- R. Osborne & P. Freyberg, *Learning in Science* (1985)
- D. Shipstone (1984/1988): children's models of current in circuits
- J. Clement (1982): preconceptions in mechanics ("motion needs a force")
- S. Vosniadou & W. Brewer: children's models of the Earth and the day/night cycle
- Piaget's conservation tasks (number, length, liquid quantity)

## Copyright note

NCERT textbooks are © NCERT, *All rights reserved*. Every prelims page says no part may be reproduced without permission. This seed therefore stores only:

- **structural facts**: book names, chapter and lesson titles, chapter order, part and unit names, author names for Hindi lessons, edition and printing dates. These are bibliographic identifiers, not textbook prose;
- **our own writing**: every topic title, learning outcome, misconception, hook and theme note was written for Taxila. Outcomes use NCF-SE 2023 style competency phrasing ("Learner can …"); none are copied from the NCF document or the textbooks;
- **links** to ncert.nic.in, where students can read the books themselves.

It stores **no** textbook passages, exercises, answers, poems, images or page scans. A few hooks name a story setting the book uses (for example a character name such as "Nani Maa" or "Deba and Deep's cows") so a teacher can connect to the page the child has open. These are short pointers, not reproduced text. Keep it that way. The voice teacher must not read out textbook text. It should paraphrase, or ask the child to read from their own book.

The downloaded PDFs used for verification were kept only in the session scratchpad. They are not in the repository and must not be committed.
