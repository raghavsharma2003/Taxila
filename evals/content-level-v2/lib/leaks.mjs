// Solver notes that say a rung-1..3 hint gives the answer away (CONTENT-LEVEL §2: "226 of 5,082 class 4-7 items have one").
const LEAK = /hint\s*[123]?[^.]*?(states|gives|give away|gives away|reveals|leaks?|spoils|says|tells|names)[^.]*?(answer|away|before)|answer away|leaks? the (answer|key)|gives away/i;
const NEG = /no longer|resolved|fixed|fix pass|rewritten|\bno (early )?(leak|give-?away)|not (give|leak|reveal|state)|don'?t (give|leak)|without (giving|leaking|revealing)|no hint (leaks|gives)|hints? (are )?graded/i;
export const hintLeakNote = (item) => { const n = item?.verified?.note || ""; return LEAK.test(n) && !NEG.test(n); };
