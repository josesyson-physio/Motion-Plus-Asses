/* ---------- Template library ---------- */
const sc = (label, opts, extra) => ({ t: "scale", label, opts, ...extra });
const sel = (label, opts, extra) => ({ t: "sel", label, opts, ...extra });
const nm = (id, label, unit, extra) => ({ id, t: "num", label, unit, ...extra });
const lrn = (label, unit, extra) => ({ t: "lrnum", label, unit, ...extra });
const lrs = (label, opts, extra) => ({ t: "lrsel", label, opts, ...extra });
const tx = (id, label, extra) => ({ id, t: "text", label, ...extra });
const ar = (id, label, extra) => ({ id, t: "area", label, ...extra });
const ck = (id, label, opts) => ({ id, t: "check", label, opts });
const hd = label => ({ t: "head", label });
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));

function T(def) {
  def.fields.forEach((f, i) => {
    f.id = f.id || "f" + i;
    if (f.t === "scale") f.o = f.opts.map((o, j) => Array.isArray(o) ? { v: o[0], l: o[1] } : { v: j + (f.base || 0), l: o });
    if (f.t === "sel") f.o = f.opts.map(o => ({ v: o, l: o }));
  });
  return def;
}
const has = x => x !== undefined && x !== null && x !== "";
function tally(t, v, filter) {
  let sum = 0, n = 0, ans = 0, max = 0, min = 0;
  for (const f of t.fields) {
    if (f.t !== "scale" || f.noscore || (filter && !filter(f))) continue;
    n++; const vals = f.o.map(o => +o.v); max += Math.max(...vals); min += Math.min(...vals);
    if (has(v[f.id])) { ans++; sum += +v[f.id]; }
  }
  return { sum, n, ans, max, min };
}
function bandOf(x, list) { for (const b of list) if (x <= b[0]) return [b[1], b[2]]; return list.at(-1).slice(1); }
const mmtNum = g => parseFloat(g) + (/\+$/.test(g) ? 0.3 : /-$/.test(g) ? -0.3 : 0);
const lr = (v, id) => v[id] || {};

const BERG_ITEMS = [
  ["Sitting to standing", ["Needs moderate or maximal assist to stand", "Needs minimal aid to stand or to stabilise", "Able to stand using hands after several tries", "Able to stand independently using hands", "Able to stand without using hands and stabilise independently"]],
  ["Standing unsupported", ["Unable to stand 30 s unassisted", "Needs several tries to stand 30 s unsupported", "Able to stand 30 s unsupported", "Able to stand 2 min with supervision", "Able to stand safely 2 min"]],
  ["Sitting with back unsupported, feet on floor", ["Unable to sit without support 10 s", "Able to sit 10 s", "Able to sit 30 s", "Able to sit 2 min under supervision", "Able to sit safely and securely 2 min"]],
  ["Standing to sitting", ["Needs assistance to sit", "Sits independently but has uncontrolled descent", "Uses back of legs against chair to control descent", "Controls descent by using hands", "Sits safely with minimal use of hands"]],
  ["Transfers", ["Needs two people to assist or supervise", "Needs one person to assist", "Able to transfer with verbal cueing and/or supervision", "Able to transfer safely with definite need of hands", "Able to transfer safely with minor use of hands"]],
  ["Standing unsupported with eyes closed", ["Needs help to keep from falling", "Unable to keep eyes closed 3 s but stays steady", "Able to stand 3 s", "Able to stand 10 s with supervision", "Able to stand 10 s safely"]],
  ["Standing unsupported with feet together", ["Needs help to attain position and unable to hold 15 s", "Needs help to attain position but able to stand 15 s", "Places feet together independently but unable to hold 30 s", "Places feet together independently and stands 1 min with supervision", "Places feet together independently and stands 1 min safely"]],
  ["Reaching forward with outstretched arm", ["Loses balance while trying or requires external support", "Reaches forward but needs supervision", "Can reach forward 5 cm safely", "Can reach forward 12 cm safely", "Can reach forward confidently 25 cm"]],
  ["Pick up object from the floor", ["Unable to try or needs assist to keep from losing balance", "Unable to pick up and needs supervision while trying", "Unable to pick up but reaches 2–5 cm from object and keeps balance", "Able to pick up object but needs supervision", "Able to pick up object safely and easily"]],
  ["Turning to look behind over both shoulders", ["Needs assist to keep from losing balance or falling", "Needs supervision when turning", "Turns sideways only but maintains balance", "Looks behind one side only, other side shows less weight shift", "Looks behind from both sides and weight shifts well"]],
  ["Turning 360 degrees", ["Needs assistance while turning", "Needs close supervision or verbal cueing", "Able to turn 360° safely but slowly", "Able to turn 360° safely one side only in 4 s or less", "Able to turn 360° safely in 4 s or less"]],
  ["Placing alternate foot on stool", ["Needs assistance to keep from falling or unable to try", "Completes fewer than 2 steps, needs minimal assist", "Completes 4 steps without aid, with supervision", "Stands independently and completes 8 steps in more than 20 s", "Stands independently and safely completes 8 steps in 20 s"]],
  ["Standing unsupported, one foot in front", ["Loses balance while stepping or standing", "Needs help to step but can hold 15 s", "Takes small step independently and holds 30 s", "Places foot ahead independently and holds 30 s", "Places foot tandem independently and holds 30 s"]],
  ["Standing on one leg", ["Unable to try or needs assist to prevent fall", "Tries to lift leg, unable to hold 3 s but remains standing", "Lifts leg independently and holds 3 s or more", "Lifts leg independently and holds 5–10 s", "Lifts leg independently and holds more than 10 s"]],
];
const ROM_LIST = [["Cervical", "flexion", 50], ["Cervical", "extension", 60], ["Cervical", "rotation", 80], ["Shoulder", "flexion", 180], ["Shoulder", "extension", 60], ["Shoulder", "abduction", 180], ["Shoulder", "external rotation", 90], ["Shoulder", "internal rotation", 70], ["Elbow", "flexion", 150], ["Forearm", "supination", 80], ["Forearm", "pronation", 80], ["Wrist", "flexion", 80], ["Wrist", "extension", 70], ["Lumbar", "flexion", 60], ["Hip", "flexion", 120], ["Hip", "extension", 30], ["Hip", "abduction", 45], ["Hip", "internal rotation", 45], ["Hip", "external rotation", 45], ["Knee", "flexion", 135], ["Knee", "extension", 0], ["Ankle", "dorsiflexion", 20], ["Ankle", "plantarflexion", 50]];
const MMT_GROUPS = ["Neck flexors", "Shoulder flexors", "Shoulder abductors", "Shoulder external rotators", "Elbow flexors", "Elbow extensors", "Wrist extensors", "Grip", "Trunk flexors", "Hip flexors", "Hip abductors", "Hip extensors", "Knee extensors", "Knee flexors", "Ankle dorsiflexors", "Ankle plantarflexors"];
const MMT_GRADES = ["0", "1", "2-", "2", "2+", "3-", "3", "3+", "4-", "4", "4+", "5"];
const LEFS_ITEMS = ["Any of your usual work, housework or school activities", "Your usual hobbies, recreational or sporting activities", "Getting into or out of the bath", "Walking between rooms", "Putting on your shoes or socks", "Squatting", "Lifting an object, like a bag of groceries, from the floor", "Performing light activities around your home", "Performing heavy activities around your home", "Getting into or out of a car", "Walking 2 blocks", "Walking a mile", "Going up or down 10 stairs (about 1 flight)", "Standing for 1 hour", "Sitting for 1 hour", "Running on even ground", "Running on uneven ground", "Making sharp turns while running fast", "Hopping", "Rolling over in bed"];
const LEFS_OPTS = ["Extreme difficulty or unable", "Quite a bit of difficulty", "Moderate difficulty", "A little bit of difficulty", "No difficulty"];
const PHQ_OPTS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];
const FIM_LEVELS = [[1, "Total assist (patient does less than 25%)"], [2, "Maximal assist (25–49%)"], [3, "Moderate assist (50–74%)"], [4, "Minimal assist (75% or more)"], [5, "Supervision or set-up"], [6, "Modified independence (device or extra time)"], [7, "Complete independence"]];

const TPL = [
  /* ---------- Physiotherapy: balance and mobility ---------- */
  T({ id: "berg", name: "Berg Balance Scale", short: "BBS", disc: ["PT", "Neuro"], cat: "Balance", hb: true, mcid: 7, mcidNote: "MDC about 7 points in older adults",
    desc: "14 balance tasks scored 0–4. Total out of 56 with fall-risk bands.",
    fields: BERG_ITEMS.map(b => sc(b[0], b[1])),
    score(v, p, t) { const s = tally(t, v); return { val: s.sum, max: 56, txt: `${s.sum}/56`, band: bandOf(s.sum, [[20, "High fall risk", "bad"], [40, "Medium fall risk", "warn"], [56, "Low fall risk", "good"]]), lines: [s.sum < 45 ? "Below the 45/56 cut-off commonly linked to increased fall risk." : "At or above the 45/56 cut-off for fall risk."] }; } }),

  T({ id: "tinetti", name: "Tinetti Balance and Gait (POMA)", short: "POMA", disc: ["PT", "Neuro"], cat: "Balance", hb: true, mcid: 4,
    desc: "Performance-Oriented Mobility Assessment. Balance /16 and gait /12, total /28.",
    fields: [hd("Balance"),
      sc("Sitting balance", ["Leans or slides in chair", "Steady, safe"], { g: "b" }),
      sc("Rises from chair", ["Unable without help", "Able, uses arms to help", "Able without using arms"], { g: "b" }),
      sc("Attempts to rise", ["Unable without help", "Able, needs more than one attempt", "Able to rise with one attempt"], { g: "b" }),
      sc("Immediate standing balance (first 5 s)", ["Unsteady (staggers, moves feet, trunk sway)", "Steady but uses walker or other support", "Steady without walker or other support"], { g: "b" }),
      sc("Standing balance", ["Unsteady", "Steady but wide stance or uses support", "Narrow stance without support"], { g: "b" }),
      sc("Nudged (feet close together, light push on sternum)", ["Begins to fall", "Staggers, grabs, catches self", "Steady"], { g: "b" }),
      sc("Eyes closed (feet close together)", ["Unsteady", "Steady"], { g: "b" }),
      sc("Turning 360°: steps", ["Discontinuous steps", "Continuous steps"], { g: "b" }),
      sc("Turning 360°: steadiness", ["Unsteady (grabs, staggers)", "Steady"], { g: "b" }),
      sc("Sitting down", ["Unsafe (misjudges distance, falls into chair)", "Uses arms or not a smooth motion", "Safe, smooth motion"], { g: "b" }),
      hd("Gait"),
      sc("Initiation of gait", ["Any hesitancy or multiple attempts", "No hesitancy"], { g: "g" }),
      sc("Right swing foot passes left stance foot", ["No", "Yes"], { g: "g" }),
      sc("Right foot completely clears floor", ["No", "Yes"], { g: "g" }),
      sc("Left swing foot passes right stance foot", ["No", "Yes"], { g: "g" }),
      sc("Left foot completely clears floor", ["No", "Yes"], { g: "g" }),
      sc("Step symmetry", ["Right and left step length not equal", "Right and left step length appear equal"], { g: "g" }),
      sc("Step continuity", ["Stopping or discontinuity between steps", "Steps appear continuous"], { g: "g" }),
      sc("Path", ["Marked deviation", "Mild or moderate deviation, or uses walking aid", "Straight without walking aid"], { g: "g" }),
      sc("Trunk", ["Marked sway or uses walking aid", "No sway but flexes knees or back, or spreads arms", "No sway, no flexion, no use of arms or aid"], { g: "g" }),
      sc("Walking stance", ["Heels apart", "Heels almost touching while walking"], { g: "g" })],
    score(v, p, t) { const b = tally(t, v, f => f.g === "b"), g = tally(t, v, f => f.g === "g"), s = b.sum + g.sum;
      return { val: s, max: 28, txt: `${s}/28`, band: bandOf(s, [[18, "High fall risk", "bad"], [23, "Moderate fall risk", "warn"], [28, "Low fall risk", "good"]]), lines: [`Balance ${b.sum}/16 · Gait ${g.sum}/12`] }; } }),

  T({ id: "tug", name: "Timed Up and Go", short: "TUG", disc: ["PT", "Neuro"], cat: "Mobility", hb: false, mcid: 3.4, unit: "s",
    desc: "Time to stand from a chair, walk 3 m, turn, walk back and sit.",
    fields: [nm("time", "Time", "s", { step: 0.1 }), sel("Walking aid", ["None", "Single-point cane", "Quad cane", "Rollator", "Walking frame", "Crutches"], { id: "aid" }), ck("obs", "Observations", ["Unsteady on standing", "Shuffling gait", "Reduced step length", "Loss of balance on turning", "Uses arms to push up", "Needs supervision"])],
    score(v) { const s = +v.time; if (!has(v.time)) return { val: null, txt: "—" };
      return { val: s, txt: `${s} s`, band: bandOf(s, [[10, "Normal mobility", "good"], [13.4, "Independent, low fall risk", "good"], [20, "Increased fall risk", "warn"], [999, "Impaired functional mobility", "bad"]]), lines: [s >= 13.5 ? "At or above the 13.5 s cut-off for fall risk in community-dwelling older adults." : "Below the 13.5 s fall-risk cut-off."] }; } }),

  T({ id: "sts5", name: "Five Times Sit to Stand", short: "5xSTS", disc: ["PT"], cat: "Mobility", hb: false, mcid: 2.3, unit: "s",
    desc: "Time to stand up fully and sit down 5 times with arms folded.",
    fields: [nm("time", "Time", "s", { step: 0.1 }), sel("Arms used", ["No", "Yes"], { id: "arms" }), tx("seat", "Chair height / notes")],
    score(v, p) { const s = +v.time; if (!has(v.time)) return { val: null, txt: "—" };
      const age = +p.age, norm = age >= 80 ? 14.8 : age >= 70 ? 12.6 : age >= 60 ? 11.4 : null;
      return { val: s, txt: `${s} s`, band: s > 15 ? ["Increased fall risk", "bad"] : s > 12 ? ["Reduced lower-limb strength", "warn"] : ["Within expected range", "good"], lines: [norm ? `Age norm about ${norm} s for ${Math.floor(age / 10) * 10}–${Math.floor(age / 10) * 10 + 9} years.` : "More than 15 s suggests increased fall risk in older adults."] }; } }),

  T({ id: "mwt6", name: "Six-Minute Walk Test", short: "6MWT", disc: ["PT", "Cardio"], cat: "Endurance", hb: true, mcid: 30, unit: "m",
    desc: "Distance walked in 6 minutes, with vitals and % of predicted distance.",
    fields: [nm("dist", "Distance walked", "m"), nm("ht", "Height", "cm"), nm("wt", "Weight", "kg"), sel("Walking aid", ["None", "Cane", "Rollator", "Walking frame", "Oxygen"], { id: "aid" }), nm("rests", "Number of rests", ""),
      hd("Before"), nm("hr0", "Heart rate", "bpm"), nm("sp0", "SpO₂", "%"), sc("Breathlessness (0–10)", range(0, 10), { id: "d0", noscore: true }),
      hd("After"), nm("hr1", "Heart rate", "bpm"), nm("sp1", "SpO₂", "%"), sc("Breathlessness (0–10)", range(0, 10), { id: "d1", noscore: true })],
    score(v, p) { const d = +v.dist; if (!has(v.dist)) return { val: null, txt: "—" };
      const ht = +v.ht, wt = +v.wt, age = +p.age; let pred = null;
      if (ht && wt && age) pred = p.sex === "M" ? 7.57 * ht - 5.02 * age - 1.76 * wt - 309 : p.sex === "F" ? 2.11 * ht - 2.29 * wt - 5.78 * age + 667 : null;
      const pct = pred ? Math.round(100 * d / pred) : null, lines = [];
      if (pred) lines.push(`Predicted ${Math.round(pred)} m (Enright and Sherrill). Achieved ${pct}% of predicted.`); else lines.push("Add height, weight, age and sex for % of predicted distance.");
      if (has(v.sp1) && (+v.sp1 < 88 || (has(v.sp0) && +v.sp0 - +v.sp1 >= 4))) lines.push(`Exercise desaturation: SpO₂ ${v.sp0 || "?"}% to ${v.sp1}%.`);
      return { val: d, txt: `${d} m`, band: pct ? bandOf(pct, [[49, "Severely reduced capacity", "bad"], [79, "Reduced capacity", "warn"], [999, "Within expected range", "good"]]) : (d < 300 ? ["Low functional capacity", "bad"] : d < 400 ? ["Limited community ambulation", "warn"] : ["Community ambulation", "good"]), lines }; } }),

  T({ id: "mwt10", name: "Ten-Metre Walk Test", short: "10MWT", disc: ["PT", "Neuro"], cat: "Gait", hb: true, mcid: 0.1, unit: "m/s",
    desc: "Comfortable or fast gait speed over the middle of a 10 m walkway.",
    fields: [nm("time", "Time", "s", { step: 0.01 }), nm("dist", "Distance timed", "m", { def: 6, hint: "Usually the middle 6 m of a 10 m walkway" }), sel("Speed", ["Comfortable", "Fast"], { id: "pace" }), sel("Walking aid", ["None", "Cane", "Quad cane", "Rollator", "Walking frame", "AFO"], { id: "aid" })],
    score(v) { if (!has(v.time)) return { val: null, txt: "—" }; const sp = Math.round(100 * (+v.dist || 6) / +v.time) / 100;
      return { val: sp, txt: `${sp} m/s`, band: bandOf(sp, [[0.39, "Household ambulator", "bad"], [0.79, "Limited community ambulator", "warn"], [99, "Community ambulator", "good"]]), lines: [sp >= 1.2 ? "Fast enough to cross a street safely (≥1.2 m/s)." : "Below the 1.2 m/s typically needed to cross a street safely."] }; } }),

  T({ id: "freach", name: "Functional Reach Test", short: "FRT", disc: ["PT"], cat: "Balance", hb: true, mcid: 4, unit: "cm",
    desc: "Maximum forward reach while standing, mean of trials.",
    fields: [nm("t1", "Trial 1", "cm"), nm("t2", "Trial 2", "cm"), nm("t3", "Trial 3", "cm")],
    score(v) { const t = ["t1", "t2", "t3"].filter(k => has(v[k])).map(k => +v[k]); if (!t.length) return { val: null, txt: "—" };
      const m = Math.round(10 * t.reduce((a, b) => a + b) / t.length) / 10;
      return { val: m, txt: `${m} cm`, band: bandOf(m, [[0, "Unable to reach (8× fall risk)", "bad"], [15.2, "High fall risk (4×)", "bad"], [25.3, "Moderate fall risk (2×)", "warn"], [999, "Low fall risk", "good"]]), lines: ["Duncan et al. cut-offs: under 15 cm and 15–25 cm."] }; } }),

  T({ id: "sls", name: "Single-Leg Stance", short: "SLS", disc: ["PT"], cat: "Balance", hb: true, unit: "s",
    desc: "Time standing on one leg, eyes open and eyes closed.",
    fields: [lrn("Eyes open", "s", { id: "eo" }), lrn("Eyes closed", "s", { id: "ec" })],
    score(v) { const e = lr(v, "eo"); if (!has(e.L) && !has(e.R)) return { val: null, txt: "—" }; const m = Math.min(...[e.L, e.R].filter(has).map(Number));
      return { val: m, txt: `L ${e.L ?? "–"} s · R ${e.R ?? "–"} s`, band: m < 5 ? ["Increased fall risk", "bad"] : m < 10 ? ["Reduced balance", "warn"] : ["Within expected range", "good"], lines: ["Under 5 s eyes open is linked to injurious falls in older adults."] }; } }),

  /* ---------- Physiotherapy: musculoskeletal ---------- */
  T({ id: "rom", name: "Range of Motion (Goniometry)", short: "ROM", disc: ["PT", "OT"], cat: "Musculoskeletal", hb: true,
    desc: "Active range in degrees, left and right, compared with normal values. Leave blank to skip.",
    fields: ROM_LIST.map(([j, m, n]) => lrn(`${j} ${m}`, "°", { normal: n })),
    score(v, p, t) { let n = 0; const lim = [];
      for (const f of t.fields) { const x = lr(v, f.id); for (const s of ["L", "R"]) if (has(x[s])) { n++; if (f.normal && +x[s] < 0.8 * f.normal) lim.push(`${f.label} ${s} ${x[s]}° (${Math.round(100 * x[s] / f.normal)}% of ${f.normal}°)`); } }
      if (!n) return { val: null, txt: "—" };
      return { val: null, txt: `${n} measured`, band: lim.length ? [`${lim.length} limited`, "warn"] : ["Within normal range", "good"], lines: lim.length ? ["Limited (under 80% of normal): " + lim.join("; ")] : [] }; } }),

  T({ id: "mmt", name: "Manual Muscle Testing", short: "MMT", disc: ["PT", "OT", "Neuro"], cat: "Musculoskeletal", hb: true,
    desc: "Oxford / MRC grades 0–5 with plus and minus, left and right.",
    fields: MMT_GROUPS.map(g => lrs(g, MMT_GRADES)),
    score(v, p, t) { const weak = []; let n = 0;
      for (const f of t.fields) { const x = lr(v, f.id); for (const s of ["L", "R"]) if (has(x[s])) { n++; if (mmtNum(x[s]) < 4) weak.push(`${f.label} ${s} ${x[s]}/5`); } }
      if (!n) return { val: null, txt: "—" };
      return { val: null, txt: `${n} tested`, band: weak.length ? [`${weak.length} below 4/5`, weak.some(w => /\s[0-2][+-]?\/5$/.test(w)) ? "bad" : "warn"] : ["Strength 4/5 or better", "good"], lines: weak.length ? ["Weakness: " + weak.join("; ")] : [] }; } }),

  T({ id: "pain", name: "Pain Assessment (NPRS)", short: "NPRS", disc: ["PT", "OT", "General"], cat: "Pain", hb: false, mcid: 2, unit: "/10",
    desc: "Numeric pain rating now, worst and best in 24 hours, with location and behaviour.",
    fields: [sc("Pain now", range(0, 10), { id: "now" }), sc("Worst in last 24 h", range(0, 10), { id: "worst", noscore: true }), sc("Best in last 24 h", range(0, 10), { id: "best", noscore: true }),
      tx("loc", "Location"), ck("pat", "Pattern", ["Constant", "Intermittent", "Night pain", "Morning stiffness over 30 min", "Worse at end of day"]),
      ck("qual", "Quality", ["Aching", "Sharp", "Burning", "Throbbing", "Shooting", "Pins and needles", "Numbness"]),
      ar("agg", "Aggravating factors"), ar("eas", "Easing factors")],
    score(v) { if (!has(v.now)) return { val: null, txt: "—" }; const s = +v.now;
      return { val: s, max: 10, txt: `${s}/10`, band: bandOf(s, [[0, "No pain", "good"], [3, "Mild pain", "good"], [6, "Moderate pain", "warn"], [10, "Severe pain", "bad"]]), lines: has(v.worst) ? [`Range over 24 h: ${v.best ?? "?"}–${v.worst}/10.`] : [] }; } }),

  T({ id: "lefs", name: "Lower Extremity Functional Scale", short: "LEFS", disc: ["PT"], cat: "Musculoskeletal", hb: true, mcid: 9,
    desc: "20 activities rated 0–4 by the patient. Total out of 80.",
    fields: [hd("Today, do you or would you have any difficulty with:"), ...LEFS_ITEMS.map(i => sc(i, LEFS_OPTS))],
    score(v, p, t) { const s = tally(t, v);
      return { val: s.sum, max: 80, txt: `${s.sum}/80`, band: bandOf(s.sum, [[29, "Severe limitation", "bad"], [59, "Moderate limitation", "warn"], [80, "Mild or no limitation", "good"]]), lines: [`${Math.round(100 * s.sum / 80)}% of maximal function. MCID 9 points.`] }; } }),

  T({ id: "odi", name: "Oswestry Disability Index (score entry)", short: "ODI", disc: ["PT"], cat: "Spine", hb: false, mcid: 10, unit: "%", lic: "Licensed questionnaire. Give the patient the official form and enter each section score (0–5) here.",
    desc: "Low back pain disability, 10 sections scored 0–5, as a percentage.",
    fields: ["Pain intensity", "Personal care", "Lifting", "Walking", "Sitting", "Standing", "Sleeping", "Sex life", "Social life", "Travelling"].map(s => sc(s, range(0, 5))),
    score(v, p, t) { const s = tally(t, v); if (!s.ans) return { val: null, txt: "—" }; const pc = Math.round(100 * s.sum / (5 * s.ans));
      return { val: pc, max: 100, txt: `${pc}%`, band: bandOf(pc, [[20, "Minimal disability", "good"], [40, "Moderate disability", "warn"], [60, "Severe disability", "bad"], [80, "Crippling back pain", "bad"], [100, "Bed-bound or exaggerating", "bad"]]), lines: [`${s.sum} points from ${s.ans} sections answered.`] }; } }),

  T({ id: "ndi", name: "Neck Disability Index (score entry)", short: "NDI", disc: ["PT"], cat: "Spine", hb: false, mcid: 10, unit: "%", lic: "Use the official NDI form and enter each section score (0–5) here.",
    desc: "Neck pain disability, 10 sections scored 0–5, as a percentage.",
    fields: ["Pain intensity", "Personal care", "Lifting", "Reading", "Headaches", "Concentration", "Work", "Driving", "Sleeping", "Recreation"].map(s => sc(s, range(0, 5))),
    score(v, p, t) { const s = tally(t, v); if (!s.ans) return { val: null, txt: "—" }; const pc = Math.round(100 * s.sum / (5 * s.ans));
      return { val: pc, max: 100, txt: `${pc}%`, band: bandOf(pc, [[8, "No disability", "good"], [28, "Mild disability", "good"], [48, "Moderate disability", "warn"], [68, "Severe disability", "bad"], [100, "Complete disability", "bad"]]), lines: [`Raw score ${s.sum}/${5 * s.ans}.`] }; } }),

  T({ id: "qdash", name: "QuickDASH (score entry)", short: "QuickDASH", disc: ["PT", "OT"], cat: "Upper limb", hb: false, mcid: 15, lic: "Licensed questionnaire (Institute for Work & Health). Use the official form and enter each item response (1–5) here.",
    desc: "Upper-limb disability, 11 items scored 1–5, converted to 0–100.",
    fields: range(1, 11).map(i => sc(`Item ${i}`, range(1, 5), { base: 1 })),
    score(v, p, t) { const s = tally(t, v); if (s.ans < 10) return { val: null, txt: `${s.ans}/11 answered`, band: ["Needs at least 10 items", "neutral"] };
      const d = Math.round(10 * (s.sum / s.ans - 1) * 25) / 10;
      return { val: d, max: 100, txt: `${d}/100`, band: bandOf(d, [[20, "Minimal disability", "good"], [40, "Moderate disability", "warn"], [100, "Severe disability", "bad"]]), lines: ["Higher scores mean more disability. MCID about 15 points."] }; } }),

  /* ---------- Neuro ---------- */
  T({ id: "mas", name: "Modified Ashworth Scale", short: "MAS", disc: ["PT", "OT", "Neuro"], cat: "Tone", hb: false,
    desc: "Spasticity grades 0, 1, 1+, 2, 3, 4 by muscle group, left and right.",
    fields: ["Elbow flexors", "Elbow extensors", "Wrist flexors", "Finger flexors", "Hip adductors", "Knee flexors", "Knee extensors", "Ankle plantarflexors"].map(g => lrs(g, ["0", "1", "1+", "2", "3", "4"])),
    score(v, p, t) { const hi = []; let n = 0;
      for (const f of t.fields) { const x = lr(v, f.id); for (const s of ["L", "R"]) if (has(x[s])) { n++; if (x[s] !== "0") hi.push(`${f.label} ${s} ${x[s]}`); } }
      if (!n) return { val: null, txt: "—" };
      return { val: null, txt: `${n} tested`, band: hi.length ? [`Increased tone in ${hi.length}`, hi.some(h => /\s[34]$/.test(h)) ? "bad" : "warn"] : ["No increase in tone", "good"], lines: hi.length ? [hi.join("; ")] : [] }; } }),

  T({ id: "gcs", name: "Glasgow Coma Scale", short: "GCS", disc: ["Neuro", "General"], cat: "Consciousness", hb: true,
    desc: "Eye, verbal and motor response. Total 3–15.",
    fields: [sc("Eye opening", [[1, "None"], [2, "To pressure"], [3, "To sound"], [4, "Spontaneous"]], { g: "e" }),
      sc("Verbal response", [[1, "None"], [2, "Sounds"], [3, "Words"], [4, "Confused"], [5, "Oriented"]], { g: "v" }),
      sc("Motor response", [[1, "None"], [2, "Extension"], [3, "Abnormal flexion"], [4, "Normal flexion (withdraws)"], [5, "Localising"], [6, "Obeys commands"]], { g: "m" })],
    score(v, p, t) { const s = tally(t, v); if (!s.ans) return { val: null, txt: "—" };
      return { val: s.sum, max: 15, txt: `${s.sum}/15`, band: bandOf(s.sum, [[8, "Severe", "bad"], [12, "Moderate", "warn"], [15, "Mild or normal", "good"]]), lines: [`E${v.f0 ?? "?"} V${v.f1 ?? "?"} M${v.f2 ?? "?"}`] }; } }),

  T({ id: "mrs", name: "Modified Rankin Scale", short: "mRS", disc: ["Neuro"], cat: "Global disability", hb: false,
    desc: "Overall disability after stroke or neurological injury, 0–5.",
    fields: [sc("Grade", ["No symptoms", "No significant disability; able to carry out all usual activities despite some symptoms", "Slight disability; able to look after own affairs without assistance but unable to carry out all previous activities", "Moderate disability; requires some help but able to walk unassisted", "Moderately severe disability; unable to attend to own bodily needs without assistance and unable to walk unassisted", "Severe disability; requires constant nursing care and attention, bedridden, incontinent"])],
    score(v) { if (!has(v.f0)) return { val: null, txt: "—" }; const s = +v.f0;
      return { val: s, max: 5, txt: `mRS ${s}`, band: bandOf(s, [[1, "Independent", "good"], [2, "Slight disability", "good"], [3, "Moderate disability", "warn"], [5, "Severe disability", "bad"]]) }; } }),

  T({ id: "fmue", name: "Fugl-Meyer Upper Extremity (score entry)", short: "FMA-UE", disc: ["PT", "OT", "Neuro"], cat: "Motor recovery", hb: true, mcid: 5, lic: "Administer with the official Fugl-Meyer protocol and enter subsection totals here.",
    desc: "Post-stroke upper-limb motor recovery. Motor score out of 66.",
    fields: [nm("a", "A. Upper extremity", "/36", { max: 36 }), nm("b", "B. Wrist", "/10", { max: 10 }), nm("c", "C. Hand", "/14", { max: 14 }), nm("d", "D. Coordination and speed", "/6", { max: 6 }),
      hd("Other domains (optional)"), nm("h", "H. Sensation", "/12", { max: 12 }), nm("j", "Passive joint motion", "/24", { max: 24 }), nm("jp", "Joint pain", "/24", { max: 24 })],
    score(v) { const k = ["a", "b", "c", "d"]; if (!k.some(x => has(v[x]))) return { val: null, txt: "—" }; const s = k.reduce((a, x) => a + (+v[x] || 0), 0);
      return { val: s, max: 66, txt: `${s}/66`, band: bandOf(s, [[28, "Severe motor impairment", "bad"], [42, "Moderate motor impairment", "warn"], [66, "Mild motor impairment", "good"]]), lines: ["Severity bands from Woytowicz et al. (0–28, 29–42, 43–66)."] }; } }),

  T({ id: "senscreen", name: "Sensory Examination", short: "Sensory exam", disc: ["Neuro", "PT", "OT", "Sensory"], cat: "Sensation", hb: true,
    desc: "Screening of sensory modalities, left and right.",
    fields: [...["Light touch", "Sharp / dull", "Temperature", "Proprioception (joint position)", "Vibration", "Stereognosis", "Two-point discrimination"].map(m => lrs(m, ["Intact", "Impaired", "Absent", "Not tested"])), tx("area", "Regions or dermatomes affected")],
    score(v, p, t) { const bad = []; let n = 0;
      for (const f of t.fields) { if (f.t !== "lrsel") continue; const x = lr(v, f.id); for (const s of ["L", "R"]) if (has(x[s]) && x[s] !== "Not tested") { n++; if (x[s] !== "Intact") bad.push(`${f.label} ${s} ${x[s].toLowerCase()}`); } }
      if (!n) return { val: null, txt: "—" };
      return { val: null, txt: `${n} tested`, band: bad.length ? [`${bad.length} impaired`, bad.some(b => /absent/.test(b)) ? "bad" : "warn"] : ["All intact", "good"], lines: bad.length ? [bad.join("; ")] : [] }; } }),

  /* ---------- OT and function ---------- */
  T({ id: "barthel", name: "Barthel Index", short: "BI", disc: ["OT", "PT"], cat: "ADL", hb: true, mcid: 10,
    desc: "10 activities of daily living. Total 0–100.",
    fields: [sc("Feeding", [[0, "Unable"], [5, "Needs help cutting, spreading butter, etc."], [10, "Independent"]]),
      sc("Bathing", [[0, "Dependent"], [5, "Independent (or in shower)"]]),
      sc("Grooming", [[0, "Needs help with personal care"], [5, "Independent face, hair, teeth, shaving"]]),
      sc("Dressing", [[0, "Dependent"], [5, "Needs help but can do about half unaided"], [10, "Independent including buttons, zips, laces"]]),
      sc("Bowels", [[0, "Incontinent (or needs enemas)"], [5, "Occasional accident"], [10, "Continent"]]),
      sc("Bladder", [[0, "Incontinent, or catheterised and unable to manage"], [5, "Occasional accident"], [10, "Continent"]]),
      sc("Toilet use", [[0, "Dependent"], [5, "Needs some help but can do something alone"], [10, "Independent (on and off, dressing, wiping)"]]),
      sc("Transfers (bed to chair and back)", [[0, "Unable, no sitting balance"], [5, "Major help (one or two people), can sit"], [10, "Minor help (verbal or physical)"], [15, "Independent"]]),
      sc("Mobility on level surfaces", [[0, "Immobile or under 50 m"], [5, "Wheelchair independent, including corners, over 50 m"], [10, "Walks with help of one person over 50 m"], [15, "Independent (may use aid) over 50 m"]]),
      sc("Stairs", [[0, "Unable"], [5, "Needs help (verbal, physical, carrying aid)"], [10, "Independent"]])],
    score(v, p, t) { const s = tally(t, v);
      return { val: s.sum, max: 100, txt: `${s.sum}/100`, band: bandOf(s.sum, [[20, "Total dependency", "bad"], [60, "Severe dependency", "bad"], [90, "Moderate dependency", "warn"], [99, "Slight dependency", "good"], [100, "Independent", "good"]]) }; } }),

  T({ id: "fim", name: "Functional Independence Measure (score entry)", short: "FIM", disc: ["OT", "PT", "Speech"], cat: "ADL", hb: true, mcid: 22, lic: "FIM is a licensed instrument. Enter the 1–7 level for each item as rated by trained staff.",
    desc: "18 items rated 1–7. Motor /91, cognitive /35, total /126.",
    fields: [hd("Motor"), ...["Eating", "Grooming", "Bathing", "Dressing, upper body", "Dressing, lower body", "Toileting", "Bladder management", "Bowel management", "Transfer: bed, chair, wheelchair", "Transfer: toilet", "Transfer: tub or shower", "Walk / wheelchair", "Stairs"].map(i => sc(i, FIM_LEVELS, { g: "m" })),
      hd("Cognitive"), ...["Comprehension", "Expression", "Social interaction", "Problem solving", "Memory"].map(i => sc(i, FIM_LEVELS, { g: "c" }))],
    score(v, p, t) { const m = tally(t, v, f => f.g === "m"), c = tally(t, v, f => f.g === "c"), s = m.sum + c.sum, n = m.ans + c.ans; if (!n) return { val: null, txt: "—" };
      const avg = s / n;
      return { val: s, max: 126, txt: `${s}/126`, band: avg >= 6 ? ["Independent", "good"] : avg >= 4 ? ["Needs minimal help or supervision", "warn"] : ["Needs moderate to total assistance", "bad"], lines: [`Motor ${m.sum}/91 · Cognitive ${c.sum}/35`] }; } }),

  T({ id: "katz", name: "Katz Index of Independence in ADL", short: "Katz ADL", disc: ["OT"], cat: "ADL", hb: true,
    desc: "Six basic activities, independent or dependent. Score 0–6.",
    fields: ["Bathing", "Dressing", "Toileting", "Transferring", "Continence", "Feeding"].map(i => sc(i, ["Dependent", "Independent"])),
    score(v, p, t) { const s = tally(t, v);
      return { val: s.sum, max: 6, txt: `${s.sum}/6`, band: bandOf(s.sum, [[2, "Severe functional impairment", "bad"], [4, "Moderate impairment", "warn"], [6, "Full function", "good"]]) }; } }),

  T({ id: "lawton", name: "Lawton IADL Scale", short: "IADL", disc: ["OT"], cat: "ADL", hb: true,
    desc: "Eight instrumental activities of daily living. Score 0–8.",
    fields: ["Using the telephone", "Shopping", "Food preparation", "Housekeeping", "Laundry", "Transportation", "Responsibility for own medications", "Ability to handle finances"].map(i => sc(i, ["Needs help or unable", "Independent"])),
    score(v, p, t) { const s = tally(t, v);
      return { val: s.sum, max: 8, txt: `${s.sum}/8`, band: bandOf(s.sum, [[3, "Low independence", "bad"], [6, "Partial independence", "warn"], [8, "High independence", "good"]]) }; } }),

  T({ id: "hand", name: "Hand Function (grip, pinch, dexterity)", short: "Hand", disc: ["OT", "PT"], cat: "Upper limb", hb: true,
    desc: "Jamar grip, pinch, Nine-Hole Peg Test and Box and Block Test.",
    fields: [sel("Dominant hand", ["Right", "Left"], { id: "dom" }), lrn("Grip strength (mean of 3)", "kg", { id: "grip" }), lrn("Lateral pinch", "kg", { id: "pinch" }), lrn("Nine-Hole Peg Test", "s", { id: "nhpt" }), lrn("Box and Block Test", "blocks/min", { id: "bbt" })],
    score(v) { const g = lr(v, "grip"), lines = []; let band = ["Recorded", "neutral"];
      if (has(g.L) && has(g.R)) { const dom = v.dom === "Left" ? "L" : "R", nd = dom === "L" ? "R" : "L", diff = Math.round(100 * (g[dom] - g[nd]) / g[dom]);
        lines.push(`Grip: dominant ${g[dom]} kg, non-dominant ${g[nd]} kg (${diff >= 0 ? diff + "% weaker" : Math.abs(diff) + "% stronger"} on non-dominant side; about 10% is typical).`);
        band = Math.abs(diff) > 20 ? ["Marked grip asymmetry", "warn"] : ["Grip symmetry typical", "good"]; }
      const n = lr(v, "nhpt"); if (has(n.L) || has(n.R)) lines.push(`Nine-Hole Peg: L ${n.L ?? "–"} s, R ${n.R ?? "–"} s.`);
      const b = lr(v, "bbt"); if (has(b.L) || has(b.R)) lines.push(`Box and Block: L ${b.L ?? "–"}, R ${b.R ?? "–"} blocks/min.`);
      return { val: null, txt: has(g.L) || has(g.R) ? `Grip L ${g.L ?? "–"} · R ${g.R ?? "–"} kg` : "—", band, lines }; } }),

  T({ id: "moca", name: "MoCA (score entry)", short: "MoCA", disc: ["OT", "Neuro", "Speech"], cat: "Cognition", hb: true, lic: "MoCA requires training and a licence from MoCA Cognition. Administer the official test and enter domain scores here.",
    desc: "Cognitive screening domains. Total out of 30.",
    fields: [nm("vis", "Visuospatial / executive", "/5", { max: 5 }), nm("nam", "Naming", "/3", { max: 3 }), nm("att", "Attention", "/6", { max: 6 }), nm("lan", "Language", "/3", { max: 3 }), nm("abs", "Abstraction", "/2", { max: 2 }), nm("rec", "Delayed recall", "/5", { max: 5 }), nm("ori", "Orientation", "/6", { max: 6 }), sel("12 years of education or fewer (+1)", ["No", "Yes"], { id: "edu" })],
    score(v) { const k = ["vis", "nam", "att", "lan", "abs", "rec", "ori"]; if (!k.some(x => has(v[x]))) return { val: null, txt: "—" };
      const s = Math.min(30, k.reduce((a, x) => a + (+v[x] || 0), 0) + (v.edu === "Yes" ? 1 : 0));
      return { val: s, max: 30, txt: `${s}/30`, band: bandOf(s, [[9, "Severe cognitive impairment", "bad"], [17, "Moderate cognitive impairment", "bad"], [25, "Mild cognitive impairment", "warn"], [30, "Normal", "good"]]) }; } }),

  /* ---------- Sensory and paediatrics ---------- */
  T({ id: "sensproc", name: "Sensory Processing Screen", short: "Sensory screen", disc: ["Sensory", "OT", "Paeds"], cat: "Sensory processing", hb: false, lic: "Clinician screening checklist, not a standardised test. Use a standardised measure for diagnosis.",
    desc: "Response pattern for each sensory system, with examples and regulation.",
    fields: [...["Tactile (touch)", "Auditory (sound)", "Visual", "Vestibular (movement)", "Proprioceptive (body position)", "Oral (taste and texture)", "Olfactory (smell)", "Interoception (hunger, toileting, pain)"].flatMap((s, i) => [sel(s, ["Typical", "Over-responsive (avoids)", "Under-responsive (misses)", "Sensory seeking"], { id: "s" + i }), tx("e" + i, "Examples")]),
      ck("reg", "Regulation and arousal", ["Often over-aroused", "Often under-aroused", "Difficulty with transitions", "Self-calms with support", "Self-calms independently", "Meltdowns with sensory overload"]),
      ar("strat", "Strategies that help")],
    score(v) { const at = []; for (let i = 0; i < 8; i++) if (has(v["s" + i]) && v["s" + i] !== "Typical") at.push(v["s" + i]);
      return { val: at.length, max: 8, txt: `${at.length}/8 atypical`, band: at.length >= 4 ? ["Broad sensory differences", "bad"] : at.length ? ["Some sensory differences", "warn"] : ["Typical patterns", "good"] }; } }),

  T({ id: "devscreen", name: "Developmental Screening", short: "Dev screen", disc: ["Paeds", "PT", "OT", "Speech"], cat: "Development", hb: false, lic: "Clinician screening checklist, not a standardised test.",
    desc: "Status of each developmental domain for age.",
    fields: [nm("age", "Age (corrected if premature)", "months"), ...["Gross motor", "Fine motor", "Receptive language", "Expressive language", "Social-emotional", "Self-care / adaptive", "Cognition / play"].flatMap((d, i) => [sel(d, ["Age-appropriate", "Emerging / mild delay", "Significant delay", "Not assessed"], { id: "d" + i }), tx("n" + i, "Notes")])],
    score(v) { let m = 0, s = 0; for (let i = 0; i < 7; i++) { if (v["d" + i] === "Emerging / mild delay") m++; if (v["d" + i] === "Significant delay") s++; }
      return { val: m + s, max: 7, txt: `${s} significant, ${m} mild`, band: s ? ["Significant delay present", "bad"] : m ? ["Mild delay present", "warn"] : ["Age-appropriate", "good"] }; } }),

  T({ id: "gmfcs", name: "Gross Motor Function Classification", short: "GMFCS", disc: ["Paeds", "PT"], cat: "Development", hb: false,
    desc: "Level I to V for children with cerebral palsy.",
    fields: [sc("Level", [[1, "Level I: walks without limitations"], [2, "Level II: walks with limitations"], [3, "Level III: walks using a hand-held mobility device"], [4, "Level IV: self-mobility with limitations, may use powered mobility"], [5, "Level V: transported in a manual wheelchair"]]), sel("Age band", ["Before 2nd birthday", "2–4 years", "4–6 years", "6–12 years", "12–18 years"], { id: "band" })],
    score(v) { if (!has(v.f0)) return { val: null, txt: "—" }; const s = +v.f0;
      return { val: s, max: 5, txt: `Level ${["", "I", "II", "III", "IV", "V"][s]}`, band: s <= 2 ? ["Ambulant", "good"] : s === 3 ? ["Ambulant with aid", "warn"] : ["Wheeled mobility", "bad"] }; } }),

  /* ---------- Speech and swallowing ---------- */
  T({ id: "intellig", name: "Speech Intelligibility Rating", short: "Intelligibility", disc: ["Speech"], cat: "Speech", hb: true,
    desc: "How well speech is understood across listeners and contexts.",
    fields: [...["Familiar listener, known topic", "Unfamiliar listener, known topic", "Unfamiliar listener, unknown topic"].map(c => sc(c, [[4, "90–100% understood"], [3, "75–90% understood"], [2, "50–75% understood"], [1, "25–50% understood"], [0, "Under 25% understood"]])),
      ck("feat", "Features observed", ["Articulation errors", "Phonological processes", "Imprecise consonants", "Reduced rate", "Fast rate", "Hypernasality", "Monopitch / monoloudness", "Dysfluency / stuttering", "Reduced breath support"]),
      ar("sample", "Speech sample notes")],
    score(v, p, t) { const s = tally(t, v); if (!s.ans) return { val: null, txt: "—" };
      return { val: s.sum, max: 12, txt: `${s.sum}/12`, band: bandOf(s.sum, [[4, "Poor intelligibility", "bad"], [8, "Reduced intelligibility", "warn"], [12, "Good intelligibility", "good"]]) }; } }),

  T({ id: "grbas", name: "GRBAS Voice Rating", short: "GRBAS", disc: ["Speech"], cat: "Voice", hb: false,
    desc: "Perceptual voice quality, each parameter 0–3.",
    fields: ["Grade (overall)", "Roughness", "Breathiness", "Asthenia (weakness)", "Strain"].map(g => sc(g, ["Normal", "Slight", "Moderate", "Severe"])),
    score(v, p, t) { const s = tally(t, v); if (!s.ans) return { val: null, txt: "—" };
      return { val: s.sum, max: 15, txt: `G${v.f0 ?? "?"}R${v.f1 ?? "?"}B${v.f2 ?? "?"}A${v.f3 ?? "?"}S${v.f4 ?? "?"}`, band: bandOf(+(v.f0 ?? 0), [[0, "Normal voice", "good"], [1, "Mild dysphonia", "warn"], [3, "Moderate to severe dysphonia", "bad"]]), lines: [`Total ${s.sum}/15.`] }; } }),

  T({ id: "fois", name: "Functional Oral Intake Scale", short: "FOIS", disc: ["Speech"], cat: "Swallowing", hb: true, mcid: 1,
    desc: "Level of oral intake, 1 (nothing by mouth) to 7 (no restrictions).",
    fields: [sc("Level", [[1, "Nothing by mouth"], [2, "Tube dependent with minimal attempts of food or liquid"], [3, "Tube dependent with consistent oral intake of food or liquid"], [4, "Total oral diet of a single consistency"], [5, "Total oral diet with multiple consistencies but requiring special preparation or compensations"], [6, "Total oral diet with multiple consistencies without special preparation, but with specific food limitations"], [7, "Total oral diet with no restrictions"]]),
      tx("diet", "Current diet and fluid levels (e.g. IDDSI)")],
    score(v) { if (!has(v.f0)) return { val: null, txt: "—" }; const s = +v.f0;
      return { val: s, max: 7, txt: `Level ${s}`, band: bandOf(s, [[3, "Tube dependent", "bad"], [6, "Oral diet with modifications", "warn"], [7, "No restrictions", "good"]]) }; } }),

  T({ id: "eat10", name: "Eating Assessment Tool (EAT-10)", short: "EAT-10", disc: ["Speech"], cat: "Swallowing", hb: false, mcid: 3,
    desc: "Patient-reported swallowing difficulty, 10 items 0–4.",
    fields: ["My swallowing problem has caused me to lose weight", "My swallowing problem interferes with my ability to go out for meals", "Swallowing liquids takes extra effort", "Swallowing solids takes extra effort", "Swallowing pills takes extra effort", "Swallowing is painful", "The pleasure of eating is affected by my swallowing", "When I swallow, food sticks in my throat", "I cough when I eat", "Swallowing is stressful"].map(i => sc(i, ["No problem", "1", "2", "3", "Severe problem"])),
    score(v, p, t) { const s = tally(t, v);
      return { val: s.sum, max: 40, txt: `${s.sum}/40`, band: s.sum >= 3 ? ["Abnormal: swallowing difficulty likely", "bad"] : ["Within normal limits", "good"], lines: ["A score of 3 or more suggests swallowing problems."] }; } }),

  T({ id: "commscreen", name: "Communication Screen", short: "Comm screen", disc: ["Speech", "Neuro"], cat: "Language", hb: true, lic: "Clinician screening checklist, not a standardised aphasia battery.",
    desc: "Bedside screen of comprehension, expression, reading and writing.",
    fields: [hd("Comprehension"), ...["Answers yes/no questions", "Follows 1-step commands", "Follows 2-step commands"].map(i => sc(i, ["Unable", "Partial or with cues", "Accurate"])),
      hd("Expression"), ...["Automatic speech (counting, days)", "Names common objects", "Repeats words", "Repeats a sentence", "Conversation"].map(i => sc(i, ["Unable", "Partial or with cues", "Accurate"])),
      hd("Reading and writing"), ...["Reads single words", "Reads a sentence", "Writes own details", "Writes a sentence"].map(i => sc(i, ["Unable", "Partial or with cues", "Accurate"])),
      sel("Fluency", ["Fluent", "Non-fluent", "Mixed"], { id: "flu" }), sel("Dysarthria", ["None", "Mild", "Moderate", "Severe"], { id: "dys" })],
    score(v, p, t) { const s = tally(t, v); if (!s.ans) return { val: null, txt: "—" };
      return { val: s.sum, max: 24, txt: `${s.sum}/24`, band: bandOf(s.sum, [[11, "Severe communication difficulty", "bad"], [19, "Moderate difficulty", "warn"], [24, "Mild or no difficulty", "good"]]) }; } }),

  /* ---------- Behavioural and mental health ---------- */
  T({ id: "phq9", name: "PHQ-9 Depression Screen", short: "PHQ-9", disc: ["Behavioural"], cat: "Mood", hb: false, mcid: 5,
    desc: "Over the last 2 weeks, how often bothered by each problem. Total 0–27.",
    fields: ["Little interest or pleasure in doing things", "Feeling down, depressed, or hopeless", "Trouble falling or staying asleep, or sleeping too much", "Feeling tired or having little energy", "Poor appetite or overeating", "Feeling bad about yourself, or that you are a failure or have let yourself or your family down", "Trouble concentrating on things, such as reading or watching television", "Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual", "Thoughts that you would be better off dead, or of hurting yourself in some way"].map(i => sc(i, PHQ_OPTS)),
    score(v, p, t) { const s = tally(t, v), lines = [];
      if (+v.f8 > 0) lines.push("Item 9 positive: assess suicide risk today and follow your safeguarding procedure.");
      return { val: s.sum, max: 27, txt: `${s.sum}/27`, band: bandOf(s.sum, [[4, "Minimal depression", "good"], [9, "Mild depression", "warn"], [14, "Moderate depression", "warn"], [19, "Moderately severe depression", "bad"], [27, "Severe depression", "bad"]]), lines, alert: +v.f8 > 0 }; } }),

  T({ id: "gad7", name: "GAD-7 Anxiety Screen", short: "GAD-7", disc: ["Behavioural"], cat: "Mood", hb: false, mcid: 4,
    desc: "Over the last 2 weeks, how often bothered by each problem. Total 0–21.",
    fields: ["Feeling nervous, anxious, or on edge", "Not being able to stop or control worrying", "Worrying too much about different things", "Trouble relaxing", "Being so restless that it is hard to sit still", "Becoming easily annoyed or irritable", "Feeling afraid, as if something awful might happen"].map(i => sc(i, PHQ_OPTS)),
    score(v, p, t) { const s = tally(t, v);
      return { val: s.sum, max: 21, txt: `${s.sum}/21`, band: bandOf(s.sum, [[4, "Minimal anxiety", "good"], [9, "Mild anxiety", "warn"], [14, "Moderate anxiety", "bad"], [21, "Severe anxiety", "bad"]]) }; } }),

  T({ id: "abc", name: "ABC Behaviour Observation", short: "ABC", disc: ["Behavioural", "Paeds"], cat: "Behaviour", hb: false,
    desc: "Antecedent, behaviour and consequence record with likely function.",
    fields: [tx("set", "Setting and activity"), ar("ant", "Antecedent (what happened just before)"), ar("beh", "Behaviour (what the person did)"), ar("con", "Consequence (what happened after)"),
      nm("dur", "Duration", "min"), nm("freq", "Times observed in session", ""), sc("Intensity", ["1 Mild", "2", "3 Moderate", "4", "5 Severe"], { base: 1, id: "int" }),
      ck("fn", "Likely function", ["Attention", "Escape / avoidance", "Access to item or activity", "Sensory / automatic"])],
    score(v) { if (!has(v.int)) return { val: null, txt: "Recorded", band: ["Observation", "neutral"] }; const s = +v.int;
      return { val: s, max: 5, txt: `Intensity ${s}/5`, band: s >= 4 ? ["High intensity", "bad"] : s >= 3 ? ["Moderate intensity", "warn"] : ["Low intensity", "good"], lines: v.fn?.length ? ["Likely function: " + v.fn.join(", ")] : [] }; } }),

  /* ---------- General ---------- */
  T({ id: "vitals", name: "Vital Signs", short: "Vitals", disc: ["General", "PT", "Cardio"], cat: "General",
    desc: "Heart rate, blood pressure, oxygen saturation, respiratory rate and temperature.",
    fields: [nm("hr", "Heart rate", "bpm"), nm("sys", "Blood pressure, systolic", "mmHg"), nm("dia", "Blood pressure, diastolic", "mmHg"), nm("spo2", "SpO₂", "%"), nm("rr", "Respiratory rate", "/min"), nm("temp", "Temperature", "°C", { step: 0.1 })],
    score(v) { const f = [];
      if (has(v.hr) && (+v.hr < 50 || +v.hr > 100)) f.push(`HR ${v.hr}`); if (has(v.sys) && (+v.sys >= 140 || +v.sys < 90)) f.push(`BP ${v.sys}/${v.dia ?? "?"}`);
      if (has(v.spo2) && +v.spo2 < 94) f.push(`SpO₂ ${v.spo2}%`); if (has(v.rr) && (+v.rr < 10 || +v.rr > 20)) f.push(`RR ${v.rr}`); if (has(v.temp) && +v.temp >= 37.8) f.push(`Temp ${v.temp}°C`);
      return { val: null, txt: has(v.sys) ? `BP ${v.sys}/${v.dia ?? "?"}` : has(v.hr) ? `HR ${v.hr}` : "—", band: f.length ? ["Outside normal range", "warn"] : ["Within normal range", "good"], lines: f.length ? ["Check: " + f.join(", ")] : [] }; } }),

  T({ id: "soap", name: "Initial Evaluation (SOAP note)", short: "SOAP", disc: ["General", "PT", "OT", "Speech", "Behavioural"], cat: "General",
    desc: "Structured evaluation note for any discipline. Good for entering paper notes later.",
    fields: [ar("s", "Subjective (history, complaints, goals of patient)"), ar("o", "Objective (observation, tests, measures)"), ar("a", "Assessment (clinical impression, problem list)"), ar("p", "Plan (treatment, frequency, home programme)"), ar("goals", "Goals"), ck("red", "Red flags screened", ["Unexplained weight loss", "Night pain", "Bladder or bowel change", "Saddle anaesthesia", "History of cancer", "Fever", "None present"])],
    score(v) { return { val: null, txt: "Note", band: v.red?.length && !v.red.includes("None present") ? ["Red flags noted", "bad"] : ["Recorded", "neutral"] }; } }),
];

const TPLMAP = Object.fromEntries(TPL.map(t => [t.id, t]));
const DISCS = ["PT", "OT", "Speech", "Behavioural", "Sensory", "Neuro", "Paeds", "Cardio", "General"];
const DISC_NAME = { PT: "Physiotherapy", OT: "Occupational therapy", Speech: "Speech and swallowing", Behavioural: "Behavioural and mental health", Sensory: "Sensory", Neuro: "Neurology", Paeds: "Paediatrics", Cardio: "Cardiorespiratory", General: "General", Custom: "Custom" };
