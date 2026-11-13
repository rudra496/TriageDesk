/*
 * TriageDesk — triage engine
 * Stage 1: symptom extraction from free text (bilingual phrase matching with a
 *          simple negation guard — heuristic, disclosed as such).
 * Stage 2: deterministic rule evaluation. Every fired rule is reported so the
 *          result is fully explainable. No randomness, no hidden scoring.
 */

const SEV_RANK = { mild: 1, moderate: 2, severe: 3 };
const DUR_RANK = { today: 1, d1_3: 2, d3_7: 3, gt_week: 4 };
const AGE_ORDER = ["infant", "child", "teen", "adult", "older"];

function normText(s) {
  return (s || "").toLowerCase().replace(/[।,.!?;:"'()\[\]]/g, " ").replace(/\s+/g, " ").trim();
}

// Negation guard. English negates BEFORE the word ("no cough"); Bengali usually
// AFTER ("কাশি নেই"). Both windows are checked. Heuristic, disclosed in README.
const NEG_PATTERNS = /\b(no|not|without|denies|never)\s+$/;
const NEG_BN_BEFORE = /(নেই|ছাড়া|ভালো না|না-ই)\s*$/;
const NEG_BN_AFTER = /^(নেই|না|ছাড়া|নাই|হচ্ছে না|হয়নি)/;

// Single-word label parts that must never match alone (generic body words or
// bare adjectives — they would false-positive all over the place)
const PART_STOP = new Set([
  "pressure", "back", "jaw", "neck", "arm", "side", "skin", "lips",
  "large", "deep", "high", "low", "new", "mild", "severe", "heavy", "blue", "grey", "gray",
]);

function labelPhrases(s) {
  const parts = [];
  for (const label of [s.en, s.bn]) {
    for (const piece of label.split(" / ")) {
      const pieceTrim = piece.trim();
      const words = pieceTrim.split(/\s+/);
      const single = words.length === 1;
      if (single) {
        const w = pieceTrim.toLowerCase();
        if (w.length < 4 || PART_STOP.has(w)) continue;
      }
      parts.push(pieceTrim);
    }
  }
  return parts.concat(s.syn || []);
}

function extractSymptoms(text) {
  const t = normText(text); // Bengali passes through unchanged; Latin lowercased
  const found = [];
  if (!t) return found;
  for (const s of SYMPTOMS) {
    const phrases = labelPhrases(s).map(normText).filter(Boolean);
    for (const p of phrases) {
      const idx = t.indexOf(p);
      if (idx < 0) continue;
      const before = t.slice(Math.max(0, idx - 14), idx).trim();
      const after = t.slice(idx + p.length, idx + p.length + 8).trim();
      const negated = NEG_PATTERNS.test(before + " ") || NEG_BN_BEFORE.test(before) || NEG_BN_AFTER.test(after);
      if (!negated) { found.push(s.id); break; }
    }
  }
  return [...new Set(found)];
}

// Which rule conditions reference symptoms the user also mentioned in `any`
function boostNotes(rule, state) {
  const notes = [];
  if (rule.boost_if_any && rule.boost_if_any.some(s => state.symptoms.has(s))) notes.push("linked-feature");
  if (rule.boost_chronic_any && rule.boost_chronic_any.some(c => state.chronic.has(c))) notes.push("chronic-condition");
  return notes;
}

function ageIndex(age) { return AGE_ORDER.indexOf(age); }

function evaluate(state) {
  // state = { symptoms:Set, age, pregnant, chronic:Set, severity, duration }
  const fired = [];
  for (const rule of RULES) {
    if (rule.age_equals && rule.age_equals !== state.age) continue;
    if (rule.min_age && ageIndex(state.age) < ageIndex(rule.min_age)) continue;
    if (rule.all && !rule.all.every(s => state.symptoms.has(s))) continue;
    if (rule.any && !rule.any.some(s => state.symptoms.has(s))) continue;
    if (rule.requires_chronic_any && !rule.requires_chronic_any.some(c => state.chronic.has(c))) continue;
    if (!rule.all && !rule.any) continue;
    const sev = SEV_RANK[state.severity || "moderate"];
    if (rule.severity_min && sev < SEV_RANK[rule.severity_min]) continue;
    if (rule.severity_max && sev > SEV_RANK[rule.severity_max]) continue;
    const dur = DUR_RANK[state.duration || "d1_3"];
    if (rule.duration_min && dur < DUR_RANK[rule.duration_min]) continue;
    fired.push({ rule, notes: boostNotes(rule, state) });
  }

  let band = "self_care";
  for (const f of fired) {
    if (BAND_ORDER.indexOf(f.rule.band) < BAND_ORDER.indexOf(band)) band = f.rule.band;
  }
  const topRules = fired.filter(f => f.rule.band === band);
  const dept = (topRules[0] && topRules[0].rule.dept) || "medicine";

  return { band, dept, fired: fired.map(f => ({ id: f.rule.id, band: f.rule.band, reason_en: f.rule.reason_en, reason_bn: f.rule.reason_bn, notes: f.notes })) };
}

// Quick self-test executed on load; cheap sanity assertions.
function selfTest() {
  const mk = (sym, extra = {}) => ({
    symptoms: new Set(sym), age: "adult", pregnant: false,
    chronic: new Set(), severity: "moderate", duration: "d1_3", ...extra,
  });
  const cases = [
    { s: mk(["face_droop"]), band: "emergency" },
    { s: mk(["chest_pain", "radiating_pain"]), band: "emergency" },
    { s: mk(["chest_pain"]), band: "same_day" },
    { s: mk(["fever", "stiff_neck"]), band: "emergency" },
    { s: mk(["fever"], { age: "infant" }), band: "emergency" },
    { s: mk(["fever"]), band: "self_care" },
    { s: mk(["fever"], { duration: "d3_7" }), band: "same_day" },
    { s: mk(["fever"], { chronic: new Set(["diabetes"]) }), band: "same_day" },
    { s: mk(["cough"]), band: "self_care" },
    { s: mk(["cough"], { duration: "d3_7" }), band: "routine" },
    { s: mk(["self_harm"]), band: "emergency" },
    { s: mk(["vomit_blood"]), band: "emergency" },
    { s: mk(["joint_pain"]), band: "routine" },
    { s: mk(["preg_bleeding"]), band: "emergency" },
    { s: mk(["face_swelling", "hives"]), band: "emergency" },
    { s: mk(["rash_fever", "fever"]), band: "emergency" },
  ];
  const failures = [];
  for (const c of cases) {
    const r = evaluate(c.s);
    if (r.band !== c.band) failures.push(`${[...c.s.symptoms].join("+")} -> ${r.band} (want ${c.band})`);
  }
  return failures;
}
