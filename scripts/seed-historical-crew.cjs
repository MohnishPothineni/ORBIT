// The voice assistant's crew: rebuilds server/data/seed.json crew and summaries from
// ui/historical-crew.js (Gordon Cooper and Scott Carpenter), so the assistant and the website
// share one crew. Run: node scripts/seed-historical-crew.cjs
const fs = require("fs");
const vm = require("vm");
const root = require("path").resolve(__dirname, "..");
const ctx = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(root + "/ui/historical-crew.js", "utf8"), ctx);
const H = ctx.module.exports;
const seedPath = root + "/server/data/seed.json";
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const callsigns = { "hist-ma9": "COOPER", "hist-ma7": "CARPENTER" };
const order = ["hist-ma9", "hist-ma7"];
const KINDS = [
  ["heart_rate", "Heart rate", "bpm", (r) => r.hr?.value],
  ["systolic_bp", "Systolic BP", "mmHg", (r) => r.sys],
  ["diastolic_bp", "Diastolic BP", "mmHg", (r) => r.dia],
  ["temperature", "Temperature", "°C", (r) => r.tempF?.c],
  ["respiratory_rate", "Respiratory rate", "/min", (r) => r.rr?.value],
];

const crew = [], summaries = {};
for (const id of order) {
  const { profile, records } = H.PROFILES.find((p) => p.profile.id === id);
  const [first, last] = profile.name.split(" ");
  crew.push({ id, callsign: callsigns[id], fullName: profile.name, role: "pilot", initials: first[0] + last[0], isCrewLeader: false, isMedicalOfficer: false });
  const sorted = [...records].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const readings = [];
  for (const [kind, label, unit, get] of KINDS) {
    const latest = sorted.filter((r) => Number.isFinite(get(r))).at(-1);
    if (latest) readings.push({ kind, label, value: get(latest), unit, recordedAt: latest.at, source: `historical record ${latest.record} (${profile.mission}, ${latest.phase})` });
  }
  summaries[id] = { crewId: id, readings, wellbeing: null };
}
seed._note = "Historical showcase: Gordon Cooper (Mercury-Atlas 9) and Scott Carpenter (Mercury-Atlas 7). Latest readings per kind from ui/historical-crew.js (user-supplied transcription of NASA records, not independently verified). Regenerate with node scripts/seed-historical-crew.cjs if those records change.";
seed.crew = crew;
seed.summaries = summaries;
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n");
console.log(`Wrote ${crew.length} crew to ${seedPath}.`);
