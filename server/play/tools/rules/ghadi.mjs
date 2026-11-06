// Play coverage rules for the ghadi family (round 7: time and clocks, classes 4-5; never timed). Authored: setting a geared
// clock's hands and its day strip to a board's time IS reading a clock to 5 minutes with a.m. / p.m. (the hands are read to
// be set); winding the bus clock on by the trip IS counting on from the start time (the gears carry 60 minutes into an
// hour); making the ticket that runs a departure clock onto the arrival IS finding how long a trip takes; winding back from
// the arrival IS subtracting time (borrowing 60, not 100); trips written as 1.5 h / a quarter / three quarters of an hour
// ARE parts of an hour; a podium the race itself then checks IS ordering timings (less time is faster, the same unit
// first); a flag the day-hops then reach IS counting days ahead from the day after today. Mal-rules map only to the
// topic's own kit misconceptions where the belief is the same one: the minute hand on the number of minutes is
// "minute-number"; the hour from the number the hour hand is near is "hour-hand-next"; 12 noon on the night half is
// "noon-12am"; minutes past 60 left in the same hour is "minutes-past-60"; 2:10 − 1:50 as 210 − 150 is "base-ten-time"; the
// starting day counted is "include-start-day"; 1.5 h as 1 h 50 min is "decimal-hours"; a quarter as 25 min is
// "quarter-as-25"; borrowing 100 minutes (and reading 1 min 5 s as 105 s) is "base-hundred" / "minute-as-hundred"; the
// biggest time first is "bigger-time-faster"; 12.45 after 12.5 is "longer-decimal-bigger". c5-maths-ch12-t02-s2 (the
// difference between two timings in parts of a second) has no honest mechanic here and is not admitted.
import { R } from "./rule.mjs";

export const family = "ghadi";
const G = "ghadi";
export const RULES = [
  R("c4-maths-ch12-t01", G, "set", "hands", { "minute-number": "minute-number", "hour-next": "hour-hand-next", "noon-am": "noon-12am" }, { noon: 0.25 }),
  R("c4-maths-ch12-t02", G, "run", "arrive", { "no-carry": "minutes-past-60" }, { says: ["hm", "min"] }),
  R("c4-maths-ch12-t02", G, "run", "trip", { "base-ten": "base-ten-time" }, {}),
  R("c4-maths-ch12-t02", G, "calendar", "days", { "count-start": "include-start-day" }, {}),
  R("c5-maths-ch12-t01", G, "run", "arrive", { "decimal-hours": "decimal-hours", "quarter-25": "quarter-as-25" }, { says: ["dec", "quarter", "threeq"] }),
  R("c5-maths-ch12-t01", G, "run", "leave", { "base-hundred": "base-hundred" }, { says: ["hm", "min"] }),
  R("c5-maths-ch12-t01", G, "race", "podium", { "minute-hundred": "base-hundred" }, { fmts: [["s", "ms"]] }),
  R("c5-maths-ch12-t02", G, "race", "podium", { "bigger-faster": "bigger-time-faster", "longer-decimal": "longer-decimal-bigger", "minute-hundred": "minute-as-hundred" }, { fmts: [["s"], ["d1", "d2"], ["s", "ms"]] }),
];

export const ACTS = {
  "c4-maths-ch12-t01|hands": ["s1", "s2", "s3"],   // set the hands to the board's time (to 5 minutes), a.m. / p.m. on the strip
  "c4-maths-ch12-t02|arrive": ["s1", "s2"],        // count on from the departure; minutes past 60 become an hour
  "c4-maths-ch12-t02|trip": ["s1"],                // how long the trip takes (start to end)
  "c4-maths-ch12-t02|days": ["s3"],                // count days and weeks ahead on the calendar
  "c5-maths-ch12-t01|arrive": ["s3"],              // half, quarter, three quarters, 1.5 hours in minutes
  "c5-maths-ch12-t01|leave": ["s2"],               // hours and minutes back from the arrival (regroup 60, not 100)
  "c5-maths-ch12-t01|podium": ["s1", "s2"],        // 60 seconds = 1 minute: minutes-and-seconds against seconds
  "c5-maths-ch12-t02|podium": ["s1", "s3"],        // order race timings (less is faster), in different units
};
