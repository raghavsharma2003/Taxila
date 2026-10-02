# EVS in Classes 1–2 (Foundational Stage): how NCF-SE 2023 handles it

Checked on **2026-10-02** for the **2026-27** session.

## Short answer

There is **no EVS subject and no EVS textbook in Classes 1 and 2**. EVS content is spread across the
language and maths books. It is not a separate curricular area. The interdisciplinary area that replaces
EVS, *The World Around Us* (TWAU), begins in **Class 3** (Preparatory Stage). There the NCERT book is
*Our Wondrous World* (`c3-evs.json` … `c5-evs.json`).

For Taxila this means that `c1-evs.json` and `c2-evs.json` should **not** exist. Environment, family,
food, plants, animals, seasons and festivals for a Class 1–2 child are taught through the Hindi, English
and maths lessons listed below. The learner model should track them as foundational-stage goals
(CG-6 / CG-7, see below), not as EVS chapters.

## Evidence

1. **NCF-SE 2023, §1.4.1 (Foundational Stage, ages 3–8, i.e. pre-school + Grades 1–2).** Learning
   Standards here are set by **domains of development**: Physical, Socio-emotional and Ethical,
   Cognitive, Aesthetic and Cultural, and Language and Literacy. They are not set by subject.
   Textbooks, playbooks and workbooks are recommended only from Grade 1. §1.4.2 introduces TWAU
   "as an interdisciplinary area of study" only at the **Preparatory** Stage (ages 8–11, Grades 3–5).
   Source: <https://ncert.nic.in/pdf/NCFSE-2023-August_2023.pdf> (pp. 12–13; also Part A ch. 2, p. 59).
2. **NCF-SE 2023, §3.4.1 (Environmental education across stages).** "In the Foundational Stage,
   Curricular Goals and Competencies are organised around domains of development, and not as
   Curricular Areas." Environmental learning happens through time spent in nature and through
   stories, poems and songs with environmental elements. §3.4.2: "In the Preparatory Stage, learning
   about the environment is integrated into The World Around Us." Same PDF, p. 161.
3. **NCF for Foundational Stage 2022 (NCF-FS).** The environment-related goals sit in two domains.
   - **CG-6** (socio-emotional and ethical domain): children develop a positive regard for the natural
     environment around them (C-6.1: care for, and joy in, all life forms).
   - **CG-7** (cognitive domain): children make sense of the world around them through observation and
     logical thinking (C-7.1 categories of objects and their relationships; C-7.2 cause and effect in
     nature, with simple hypotheses; C-7.3 using tools and technology in daily life).

   §5.5.2 says simple textbooks "can be considered" for ages 6–8. They should double as workbooks.
   Source: <https://ncert.nic.in/pdf/NCF_for_Foundational_Stage_20_October_2022.pdf>
4. **The NCERT textbook listing.** In the class → subject dropdown on <https://ncert.nic.in/textbook.php>
   (inline JavaScript, read 2026-10-02), Class 1 has only English, Mathematics, Hindi and Urdu, and
   Class 2 has only Mathematics, Hindi, English and Urdu. "The World Around Us" first appears at
   Class 3. The Class 3 prelims are at <https://ncert.nic.in/textbook/pdf/ceev1ps.pdf>.
5. **The Sarangi prelims say it outright.** The आमुख in both Sarangi books (ahsr1ps.pdf, bhsr1ps.pdf)
   says the book includes content and activities that build sensitivity towards the environment. It
   cites NEP 2020's recommendation to fold Indian tradition, values, compassion and
   "पर्यावरण के प्रति संवेदनशीलता" into language and other subjects "समेकित रूप में" (in an integrated
   way). Sources: <https://ncert.nic.in/textbook/pdf/ahsr1ps.pdf>, <https://ncert.nic.in/textbook/pdf/bhsr1ps.pdf>
6. **This is not new.** The pre-2023 NCERT EVS syllabus (NCF 2005) already said: "Even in the earlier
   years children do learn about their environment, though there is no separate subject in school. It is
   expected that in Classes I-II the two subjects of Language and Mathematics will incorporate some
   themes for the development of concepts and skills in areas broadly related to EVS." Source:
   <https://ncert.nic.in/pdf/syllabus/08Environmental%20(III-V).pdf>. NCF-SE 2023 keeps that
   arrangement and moves the goals from subjects to developmental domains.

## Where the EVS-shaped content sits in our Class 1–2 files

This mapping is ours. It is a teaching judgement made from the unit names and chapter titles, not an NCERT mapping.

| EVS-style theme (as TWAU picks it up in Class 3) | Class 1 | Class 2 |
|---|---|---|
| Family and relationships | Sarangi इकाई 1: परिवार (`c1-hindi-ch01`–`ch04`); Joyful Maths "Lina's Family" | Sarangi इकाई 1: परिवार (`c2-hindi-ch01`–`ch07`) |
| Animals and plants, caring for life | Sarangi इकाई 2: जीव-जगत (`c1-hindi-ch05`–`ch08`), इकाई 5: हरी-भरी दुनिया (`ch17`–`ch19`); Mridang "A Farm"; Joyful Maths "Vegetable Farm" | Sarangi इकाई 3: हरी-भरी धरती (`c2-hindi-ch13`–`ch17`) |
| Food | Sarangi इकाई 3: हमारा खान-पान (`c1-hindi-ch09`–`ch12`); Mridang "The Food we Eat"; Joyful Maths "Mango Treat" | (in passing, e.g. मूली `c2-hindi-ch16`) |
| Festivals and fairs | Sarangi इकाई 4: त्योहार और मेले (`c1-hindi-ch13`–`ch16`); Joyful Maths "Utsav" | Joyful Maths "Decoration for Festival", "Fun at the Fair" |
| Weather, seasons, sky, water | Mridang "The Four Seasons", "Anandi's Rainbow"; हवा (`c1-hindi-ch17`), चाँद का बच्चा (`ch19`) | Sarangi इकाई 5: आकाश (`c2-hindi-ch22`–`ch26`); Mridang "A Show of Clouds", "Little Drops of Water"; Joyful Maths "Which Season is it?", "Shadow Story" |
| Daily routine, home, neighbourhood | रीना का दिन (`c1-hindi-ch03`); Joyful Maths "How do I Spend my Day?" | Mridang "Between Home and School", "This is My Town" |
| Friendship, play, colours | (in passing) | Sarangi इकाई 2: रंग ही रंग (`ch08`–`ch12`), इकाई 4: मित्रता (`ch18`–`ch21`) |

## What this means for the build

- **No EVS lane before Class 3.** The Conductor should not schedule "EVS" for a Class 1–2 child.
  Environmental curiosity goes into Hindi, English and maths lessons and into off-screen activities
  (observe a plant, sort leaves, notice the weather). That matches NCF-FS, which treats time in nature
  as part of teaching at this stage, not an add-on.
- **Learner model.** For Classes 1–2, tag CG-6 and CG-7 evidence on the language and maths topics
  above. Use those tags rather than inventing EVS topic ids. The Class 3 *Our Wondrous World* chapters
  (Family and Friends, Going to the Mela, Getting to Know Plants, Food We Eat …) are the natural next
  step from these Class 1–2 themes, so prerequisites from `c3-evs` topics may point back to these
  Hindi, English and maths topics.
- **State boards.** Some states still print a separate Class 1–2 EVS book or a combined
  "हमारा परिवेश"-style book. We have not surveyed them. Check `boards.json` before assuming that a
  non-CBSE child has no Class 1–2 EVS book. **Not verified for RBSE.**
