// round 7 (C1 studio-board-richness, maps decision dc-r7-maps-no-outline): build data/geo/india-places.json, the places a
// map board may pin, each with its true latitude/longitude and where that came from. Cities from Natural Earth 1:10m
// populated places (public domain; pass the downloaded ne_10m_populated_places_simple.geojson); heritage sites and the
// few towns Natural Earth lacks from Wikidata's coordinate location (P625; CC0), by a fixed QID checked against its label.
// No outline, coastline or boundary is ever built here: points only.
//   node scripts/build-india-places.mjs <ne_10m_populated_places_simple.geojson>
import fs from "node:fs";

// id → { ne: Natural Earth name (country India unless given) | qid: Wikidata id, aliases: words a kit may use }
const PLACES = {
  delhi: { ne: "Delhi", aliases: ["Delhi", "New Delhi"] },
  mumbai: { ne: "Mumbai", aliases: ["Mumbai", "Bombay"] },
  kolkata: { ne: "Kolkata", aliases: ["Kolkata", "Calcutta"] },
  chennai: { ne: "Chennai", aliases: ["Chennai", "Madras"] },
  bengaluru: { ne: "Bengaluru", aliases: ["Bengaluru", "Bangalore"] },
  hyderabad: { ne: "Hyderabad", aliases: ["Hyderabad"] },
  jaipur: { ne: "Jaipur", aliases: ["Jaipur"] },
  lucknow: { ne: "Lucknow", aliases: ["Lucknow"] },
  patna: { ne: "Patna", aliases: ["Patna", "Pataliputra"] },
  bhopal: { ne: "Bhopal", aliases: ["Bhopal"] },
  ahmedabad: { ne: "Ahmedabad", aliases: ["Ahmedabad"] },
  pune: { ne: "Pune", aliases: ["Pune"] },
  shimla: { ne: "Simla", aliases: ["Shimla", "Simla"] },
  srinagar: { ne: "Srinagar", aliases: ["Srinagar"] },
  guwahati: { ne: "Guwahati", aliases: ["Guwahati"] },
  shillong: { ne: "Shillong", aliases: ["Shillong"] },
  thiruvananthapuram: { ne: "Thiruvananthapuram", aliases: ["Thiruvananthapuram", "Trivandrum"] },
  kochi: { ne: "Kochi", aliases: ["Kochi", "Cochin"] },
  panaji: { ne: "Panaji", aliases: ["Panaji"] },
  varanasi: { ne: "Varanasi", aliases: ["Varanasi", "Kashi", "Banaras"] },
  agra: { ne: "Agra", aliases: ["Agra"] },
  amritsar: { ne: "Amritsar", aliases: ["Amritsar"] },
  chandigarh: { ne: "Chandigarh", aliases: ["Chandigarh"] },
  bhubaneswar: { ne: "Bhubaneswar", aliases: ["Bhubaneswar"] },
  ranchi: { ne: "Ranchi", aliases: ["Ranchi"] },
  raipur: { ne: "Raipur", aliases: ["Raipur"] },
  dehradun: { ne: "Dehra Dun", aliases: ["Dehradun", "Dehra Dun"] },
  gangtok: { ne: "Gangtok", aliases: ["Gangtok"] },
  imphal: { ne: "Imphal", aliases: ["Imphal"] },
  kohima: { ne: "Kohima", aliases: ["Kohima"] },
  agartala: { ne: "Agartala", aliases: ["Agartala"] },
  aizawl: { ne: "Aizawl", aliases: ["Aizawl"] },
  itanagar: { ne: "Itanagar", aliases: ["Itanagar"] },
  gandhinagar: { ne: "Gandhinagar", aliases: ["Gandhinagar"] },
  jodhpur: { ne: "Jodhpur", aliases: ["Jodhpur"] },
  udaipur: { ne: "Udaipur", aliases: ["Udaipur"] },
  madurai: { ne: "Madurai", aliases: ["Madurai"] },
  mysuru: { ne: "Mysuru", aliases: ["Mysuru", "Mysore"] },
  visakhapatnam: { ne: "Vishakhapatnam", aliases: ["Visakhapatnam", "Vishakhapatnam"] },
  nagpur: { ne: "Nagpur", aliases: ["Nagpur"] },
  indore: { ne: "Indore", aliases: ["Indore"] },
  leh: { ne: "Leh", aliases: ["Leh"] },
  ujjain: { ne: "Ujjain", aliases: ["Ujjain"] },
  prayagraj: { ne: "Allahabad", aliases: ["Prayagraj", "Allahabad"] },
  mathura: { ne: "Mathura", aliases: ["Mathura"] },
  thanjavur: { ne: "Thanjavur", aliases: ["Thanjavur", "Tanjore"] },
  surat: { ne: "Surat", aliases: ["Surat"] },
  panipat: { ne: "Panipat", aliases: ["Panipat"] },
  kanyakumari: { qid: "Q222267", label: "Kanniyakumari", aliases: ["Kanyakumari"] },
  darjeeling: { qid: "Q169997", label: "Darjeeling", aliases: ["Darjeeling"] },
  harappa: { qid: "Q185562", label: "Harappa", aliases: ["Harappa"] },
  mohenjodaro: { qid: "Q5725", label: "Mohenjo-daro", aliases: ["Mohenjo-daro", "Mohenjodaro"] },
  lothal: { qid: "Q9443", label: "Lothal", aliases: ["Lothal"] },
  dholavira: { qid: "Q9468", label: "Dholavira", aliases: ["Dholavira"] },
  kalibangan: { qid: "Q1722226", label: "Kalibangan", aliases: ["Kalibangan"] },
  taxila: { qid: "Q156093", label: "Taxila", aliases: ["Taxila", "Takshashila"] },
  hampi: { qid: "Q26732", label: "Hampi", aliases: ["Hampi", "Vijayanagara"] },
  sanchi: { qid: "Q181123", label: "Sanchi", aliases: ["Sanchi"] },
  ajanta: { qid: "Q184427", label: "Ajanta Caves", aliases: ["Ajanta"] },
  ellora: { qid: "Q189616", label: "Ellora Caves", aliases: ["Ellora"] },
  konark: { qid: "Q752091", label: "Konark Sun Temple", aliases: ["Konark", "Konarak"] },
};

const ne = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const out = [];
for (const [id, p] of Object.entries(PLACES)) {
  if (p.ne) {
    const f = ne.features.find((x) => x.properties.name === p.ne && x.properties.adm0name === "India");
    if (!f) throw new Error(`Natural Earth has no ${p.ne}`);
    out.push({ id, names: p.aliases, lat: +f.properties.latitude.toFixed(2), lon: +f.properties.longitude.toFixed(2), source: `naturalearth:ne_10m_populated_places:${f.properties.ne_id}` });
  } else {
    const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${p.qid}.json`, { headers: { "user-agent": "taxila-geo-build/1.0" } });
    const e = (await r.json()).entities[p.qid];
    const label = e.labels?.en?.value;
    if (label !== p.label) throw new Error(`${p.qid} is "${label}", expected "${p.label}"`);
    const c = e.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    if (!c) throw new Error(`${p.qid} has no coordinate`);
    out.push({ id, names: p.aliases, lat: +c.latitude.toFixed(2), lon: +c.longitude.toFixed(2), source: `wikidata:${p.qid}:P625` });
  }
}
for (const p of out) if (p.lat < 5 || p.lat > 38 || p.lon < 66 || p.lon > 98) throw new Error(`${p.id} at ${p.lat},${p.lon} is outside the frame`);
const doc = { note: "Points only (dc-r7-maps-no-outline): true latitude/longitude of places a map board may pin, rounded to 0.01°. Built by scripts/build-india-places.mjs from Natural Earth 1:10m populated places (public domain) and Wikidata P625 (CC0); each row names its source record.", built: new Date().toISOString().slice(0, 10), places: out };
fs.writeFileSync(new URL("../data/geo/india-places.json", import.meta.url), JSON.stringify(doc, null, 1) + "\n");
console.log(out.length, "places");
