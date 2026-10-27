/* ---------- Consultation room: heart, lungs and circulation ----------
   Uses the same whole-body pack as the nervous-system view (heart, its own arteries, the aorta and main veins,
   lung vessels, windpipe, airways and lungs). Every slide is built from the patient's diagnosis, vital signs and
   six-minute walk: the heart beats at their resting rate, the lungs breathe at their breathing rate. */
const CCONDS = [
  { id: "copd", kw: /\bcopd\b|emphysema|chronic (obstructive|bronchitis)/i, name: "COPD", where: "airway", hot: ["bronchi", "trachea"], rehab: "lung", breath: "plb",
    flow: ["Years of irritation, often from smoke, inflame the airways", "Airways narrow and the air sacs lose their spring", "Air gets trapped, so less fresh air reaches the blood", "Breathless on effort, tired legs, a cough"],
    helps: "Breathing techniques, pacing and regular walking or cycling train your muscles to need less oxygen." },
  { id: "asthma", kw: /asthma/i, name: "Asthma", where: "airway", hot: ["bronchi", "trachea"], rehab: "lung", breath: "plb",
    flow: ["A trigger such as cold air, allergy or hard effort", "The airway walls tighten, swell and make mucus", "Less air flows in and out", "Wheeze, chest tightness, breathlessness"],
    helps: "A good warm-up, your inhaler as prescribed and steady exercise make attacks less likely." },
  { id: "bx", kw: /bronchiectasis|cystic fibrosis/i, name: "Bronchiectasis", where: "airway", hot: ["bronchi", "lung_l", "lung_r"], rehab: "lung", breath: "plb",
    flow: ["Repeated infections widen and scar the airways", "Mucus pools in the airways and is hard to clear", "Air and oxygen move less freely", "A daily wet cough, chest infections, breathlessness"],
    helps: "Clearing the airways every day, with breathing techniques and exercise, keeps the chest clearer." },
  { id: "ild", kw: /interstitial|pulmonary fibrosis|\bild\b|\bipf\b|sarcoid/i, name: "Lung scarring (fibrosis)", where: "sacs", hot: ["lung_l", "lung_r"], rehab: "lung", breath: "control",
    flow: ["Scarring builds up in the walls of the air sacs", "The lungs become stiff and the walls thicker", "Oxygen passes into the blood more slowly", "Breathless on effort, oxygen drops when walking"],
    helps: "Paced, regular exercise with oxygen checks keeps you as fit and active as possible." },
  { id: "lungrec", kw: /pneumonia|covid|chest infection|lobectomy|pneumonectomy|thoracotomy|lung (surgery|cancer|resection)/i, name: "Lungs recovering", where: "sacs", hot: ["lung_l", "lung_r"], rehab: "lung", breath: "control",
    flow: ["An infection or operation affected part of a lung", "That part works less well while it heals", "Less oxygen reaches the blood during effort", "Tiredness, breathlessness, weaker legs"],
    helps: "Breathing exercises, then gradually more walking, help the lungs and muscles recover together." },
  { id: "hf", kw: /heart failure|\bchf\b|\bhfref\b|\bhfpef\b|cardiomyopathy|ejection fraction|\blvef\b/i, name: "Heart failure", where: "pump", hot: ["heart"], rehab: "heart", breath: "control",
    flow: ["The heart muscle is weakened or stiff", "Each beat pumps less blood round the body", "Muscles get less oxygen and fluid can build up", "Tiredness, breathlessness, swollen ankles"],
    helps: "Regular, steady exercise makes your muscles use oxygen better, so the heart does less work for the same job." },
  { id: "cad", kw: /coronary|\bcad\b|\bihd\b|angina|myocardial infarction|heart attack|\bn?stemi\b|\bmi\b|stent|\bpci\b|\bcabg\b|bypass graft/i, name: "Coronary heart disease", where: "coronary", hot: ["coronary_arteries"], rehab: "heart", breath: "control",
    flow: ["Fatty plaque narrows the heart's own arteries", "Less blood reaches the heart muscle on effort", "The heart muscle runs short of oxygen", "Chest tightness on effort, tiredness, breathlessness"],
    helps: "Cardiac rehab exercise, built up step by step, strengthens the heart and lowers the chance of another event." },
  { id: "valve", kw: /valve|aortic stenosis|mitral|\btav[ir]\b|\bavr\b|\bmvr\b|cardiac surgery|open heart|sternotomy/i, name: "Heart valve or surgery recovery", where: "pump", hot: ["heart", "aorta"], rehab: "heart", breath: "control",
    flow: ["A valve was narrowed or leaky, or the heart was operated on", "The heart worked harder to move blood", "Less blood reached the muscles; the breastbone is healing", "Tiredness, breathlessness, a sore chest"],
    helps: "Gradual walking, and arm exercise within your breastbone precautions, rebuild fitness safely." },
  { id: "af", kw: /atrial fibrillation|\ba-?fib\b|\baf\b|arrhythmi\w*|pacemaker|\bicd\b/i, name: "Heart rhythm", where: "rhythm", hot: ["heart"], rehab: "heart", breath: "control",
    flow: ["The heart's electrical signal becomes irregular", "Beats come unevenly, sometimes too fast", "The pump is less efficient during effort", "Fluttering, tiredness, breathlessness"],
    helps: "Steady exercise judged by how you feel, not only by your pulse, keeps the heart and body fit." },
  { id: "htn", kw: /hypertension|high blood pressure/i, name: "High blood pressure", where: "vessels", hot: ["aorta"], rehab: "heart", breath: "control",
    flow: ["Arteries become stiffer and narrower over time", "The heart must push harder against them", "The heart wall thickens and arteries are strained", "Often no symptoms, which is why we measure it"],
    helps: "Regular moderate exercise is one of the best ways to bring blood pressure down." },
  { id: "pad", kw: /peripheral (arterial|vascular)|\bpad\b|claudication/i, name: "Narrowed leg arteries", where: "legs", hot: ["aorta", "calf_l", "calf_r"], rehab: "legs", breath: "control",
    flow: ["Plaque narrows the arteries to the legs", "Less blood reaches the leg muscles when walking", "The calf muscles run short of oxygen", "Cramping calf pain on walking that eases with rest"],
    helps: "Walking into moderate calf pain, resting, then walking again helps new small blood vessels grow." },
  { id: "fit", kw: /deconditio\w*|critical illness|\bicu\b|prolonged (bed ?rest|admission|hospital)/i, name: "Low exercise fitness", where: "fitness", hot: ["heart", "lung_l", "lung_r"], rehab: "heart", breath: "control",
    flow: ["Less activity, illness or a hospital stay", "Heart, lungs and muscles lose fitness together", "Muscles use oxygen less well, so effort feels harder", "Tired and breathless sooner than before"],
    helps: "Regular exercise at the right effort rebuilds fitness. Every session counts." },
];
const CWHERE = { airway: "The airways", sacs: "The air sacs in the lungs", pump: "The heart muscle", coronary: "The heart's own arteries", rhythm: "The heart's rhythm", vessels: "The arteries", legs: "The leg arteries", fitness: "Muscle fitness" };
const CREHAB = {
  heart: [["Settle and learn", "Short daily walks at an easy effort", "Know your warning signs and medicines", "Breathing and gentle mobility"],
    ["Build steady fitness", "Walk or cycle 20–30 minutes at effort 3–4", "Warm up and cool down every time", "Light strength work for legs and arms"],
    ["Grow strength and stamina", "Longer or brisker sessions, 3–5 days a week", "Strength circuits twice a week", "Stairs and hills at a talking pace"],
    ["Life and long-term health", "Back to work, hobbies and travel", "A lifelong activity plan", "Regular checks of blood pressure and fitness"]],
  lung: [["Breathe easier", "Pursed-lip and recovery breathing", "Positions that ease breathlessness", "Clearing phlegm if needed"],
    ["Pace and walk", "Interval walking at breathlessness 3–4", "Pacing daily jobs", "Sit-to-stand and step-ups"],
    ["Build stamina and strength", "Longer walks or cycling", "Arm and leg strength twice a week", "Stairs with breathing control"],
    ["Stay well", "A long-term exercise habit", "An action plan for flare-ups", "Keep active through the winter"]],
  legs: [["Start walking", "Walk until the calf pain is moderate, rest, repeat", "Foot care and comfortable shoes", "Calf and ankle mobility"],
    ["Walk further", "30–45 minutes of interval walking, 3 days a week", "Heel raises and sit-to-stand", "A walking diary"],
    ["Build stamina", "Longer walks with fewer rests", "Hills and stairs", "Strength work twice a week"],
    ["Keep it going", "A lifelong walking habit", "Healthy blood pressure and cholesterol", "Regular foot and leg checks"]],
};
const CV_NAME = { heart: "Heart", coronary_arteries: "Heart's own arteries", aorta: "Main artery (aorta)", pulmonary_vessels: "Lung blood vessels", vena_cava_superior: "Main vein", vena_cava_inferior: "Main vein",
  trachea: "Windpipe", bronchi: "Airways", lung_l: "Left lung", lung_r: "Right lung", calf_l: "Calf", calf_r: "Calf" };
const CV_COL = { heart: 0xb8333a, coronary_arteries: 0xff6a4a, aorta: 0xd8443a, pulmonary_vessels: 0x9a6ad8, vena_cava_superior: 0x4a6fd0, vena_cava_inferior: 0x4a6fd0, trachea: 0xdcd2c0, bronchi: 0xdcd2c0, lung_l: 0xe8a0a8, lung_r: 0xe8a0a8 };

/* ---------- The patient's heart and lung picture, from the diagnosis, vital signs and walk test ---------- */
function cardioOf(p, show) {
  const dx = `${p.dx || ""} ${p.notes || ""}`, vt = latestA(p.id, "vitals"), mw = latestA(p.id, "mwt6"), ev = [], v = vt?.values || {}, w = mw?.values || {};
  let cond = CCONDS.find(c => c.kw.test(dx)) || null;
  const hr = +v.hr || +w.hr0 || null, rr = +v.rr || null, spo2 = +v.spo2 || +w.sp0 || null;
  if (hr) ev.push(`Resting heart rate ${hr} bpm`);
  if (has(v.sys)) ev.push(`Blood pressure ${v.sys}/${v.dia ?? "?"}`);
  if (spo2) ev.push(`Oxygen ${spo2}% at rest`);
  if (rr) ev.push(`Breathing ${rr} a minute`);
  let walk = null;
  if (mw && has(w.dist)) { const r = runScore(getTpl(mw), w, p), pct = /Achieved (\d+)%/.exec(r.lines.join(" "))?.[1], pred = /Predicted (\d+) m/.exec(r.lines.join(" "))?.[1];
    walk = { dist: +w.dist, pct: pct ? +pct : null, pred: pred ? +pred : null, hr0: +w.hr0 || null, hr1: +w.hr1 || null, sp0: +w.sp0 || null, sp1: +w.sp1 || null, d0: has(w.d0) ? +w.d0 : null, d1: has(w.d1) ? +w.d1 : null, rests: +w.rests || 0, aid: w.aid };
    ev.push(`6-minute walk ${w.dist} m${walk.pct ? ` (${walk.pct}% of expected)` : ""}`);
    if (walk.sp1 && (walk.sp1 < 88 || (walk.sp0 && walk.sp0 - walk.sp1 >= 4))) { walk.desat = true; ev.push(`Oxygen ${walk.sp0 || "?"}% → ${walk.sp1}% while walking`); }
    if (walk.d1 != null) ev.push(`Breathlessness ${walk.d0 ?? "?"} → ${walk.d1} out of 10`);
    if (walk.rests) ev.push(`${walk.rests} rest${walk.rests > 1 ? "s" : ""} during the walk`); }
  // No heart or lung condition named: low walking fitness still gets these slides when nothing else explains the visit.
  if (!cond && show && walk && ((walk.pct && walk.pct < 80) || walk.desat || (!walk.pct && walk.dist < 400))) cond = CCONDS.find(c => c.id === "fit");
  return { cond, hr, rr, spo2, walk, ev, side: "R", cardio: !!cond };
}

/* ---------- 3D: the chest, with the heart beating at the patient's rate and the lungs breathing ---------- */
function cvSetup(data) {
  const V = a => new THREE.Vector3(...a), c = id => NV.byId[id]?.c;
  const h = c("heart") || V([25, 1300, 20]), ll = c("lung_l") || V([75, 1310, 0]), lr = c("lung_r") || V([-60, 1270, 0]);
  NV_VIEWS.chest = [[h.x - 10, h.y + 20, h.z], 560]; NV_VIEWS.legs = [[0, 600, 0], 1300];
  NV.cvPaths = {
    airL: [[0, 1480, 2], [0, 1420, -8], [0, 1372, -14], [38, 1345, -20], [ll.x, ll.y + 10, ll.z - 10]], airR: [[0, 1480, 2], [0, 1420, -8], [0, 1372, -14], [-36, 1345, -20], [lr.x + 6, lr.y + 20, lr.z - 10]],
    lungIn: [[ll.x, ll.y, ll.z], [45, 1310, 0], [h.x + 10, h.y + 4, h.z - 10]], lungInR: [[lr.x, lr.y, lr.z], [-30, 1300, -5], [h.x - 10, h.y, h.z - 10]],
    out: [[h.x, h.y - 10, h.z + 10], [8, 1335, 12], [6, 1380, 8], [16, 1398, -6], [22, 1365, -42], [16, 1290, -40], [12, 1220, -10], [10, 1150, 8], [7, 1030, 22]],
    back: [[-15, 1395, 15], [-15, 1360, 15], [h.x - 18, h.y + 6, h.z + 8]], backL: [[-14, 1030, 15], [-14, 1200, 15], [h.x - 16, h.y - 10, h.z + 8]],
    legs: [[7, 1030, 22], [40, 900, 30], [80, 600, 20], [95, 300, -10]] };
  for (const k in NV.cvPaths) NV.cvPaths[k] = new THREE.CatmullRomCurve3(NV.cvPaths[k].map(V));
}
function cvFlow(k, col, opt = {}) { if (!NV?.cvPaths) return; NV.pulses.push({ curve: NV.cvPaths[k], t: opt.t0 || 0, dur: opt.dur || 2.4, col, g: NV.pulseMesh(col, true), small: true, block: opt.block ?? null, slow: opt.slow, loop: opt.loop }); }
const CV_AIR = 0x9fe8ff, CV_RED = 0xff5a4a, CV_BLUE = 0x6f8fff;
function cvBreathe(block) { const b = block ? .55 : null; cvFlow("airL", CV_AIR, { block: b, dur: 2.2 }); cvFlow("airR", CV_AIR, { block: b, dur: 2.2, t0: .1 }); }
function cvPump(slow) { cvFlow("lungIn", CV_RED, { dur: 1.6 }); cvFlow("lungInR", CV_RED, { dur: 1.6, t0: .1 }); setTimeout(() => NV && cvFlow("out", CV_RED, { dur: 2.6, slow }), 900); setTimeout(() => NV && (cvFlow("back", CV_BLUE, { dur: 1.6 }), cvFlow("backL", CV_BLUE, { dur: 2 })), 1500); }
// The condition's parts, with the detail pack's named arteries and valves where they add to it.
const cvHotIds = c => { const x = (c.where === "legs" ? hxFind(n => /femoral artery$|popliteal artery|tibial artery$|dorsalis pedis|iliac artery/.test(n)) : c.id === "valve" ? hxFind(n => /valve|leaflet|cusp/.test(n)) : c.id === "htn" ? hxFind(n => /aorta$|carotid/.test(n)) : []);
  return c.id === "valve" && x.length ? ["aorta", ...x] : [...c.hot, ...x]; };
function cvProblem() {
  const C = NV.N, c = C.cond; if (!c) return; NV.focus = true; nvSetHot(cvHotIds(c), c.where === "legs" ? "legs" : "chest");
  if (c.where === "airway") cvBreathe(true); else if (c.where === "sacs") { cvBreathe(); setTimeout(() => NV && cvFlow("lungIn", CV_RED, { dur: 2.4, slow: true }), 900); }
  else if (c.where === "legs") cvFlow("legs", CV_RED, { dur: 3, block: .7 }); else cvPump(true);
  nvCap(`${c.name}: ${c.id === "valve" ? "the heart valves" : CWHERE[c.where].toLowerCase()}`); hz("tap");
}
function cvStep(t) {
  const C = NV.N, stops = [0, 3, 7, 11, C.cond ? 15 : 11, C.cond ? 20.5 : 15], st = stops.findLastIndex(x => t >= x); if (st === NV.stage) return; NV.stage = st;
  if (st === 0) { nvSetHot([]); NV.focus = false; nvView("chest"); NV.spin = true; nvCap("Your heart and lungs"); }
  if (st === 1) { NV.spin = false; NV.az = 0; nvSetHot(["trachea", "bronchi"]); NV.focus = false; cvBreathe(); nvCap("Air flows down the windpipe into the lungs"); }
  if (st === 2) { nvSetHot(["lung_l", "lung_r"]); cvFlow("lungIn", CV_RED, { dur: 1.8 }); cvFlow("lungInR", CV_RED, { dur: 1.8, t0: .1 }); nvCap("Oxygen passes into the blood and goes to the heart"); }
  if (st === 3) { nvSetHot(["heart"]); NV.az = -25; cvFlow("out", CV_RED, { dur: 2.6 }); setTimeout(() => NV && cvFlow("back", CV_BLUE, { dur: 1.6 }), 700); nvCap(C.hr ? `Your heart pumps it round the body, ${C.hr} beats a minute at rest` : "The heart pumps it round the body"); }
  if (st === 4 && C.cond) { NV.az = 0; cvProblem(); }
  if (st === 5) { NV.story = 0; NV.toured = true; nvCap(""); }
  nvSync();
}
// The opacity each part wants in the chest view; null leaves the nerve view's rule in charge.
function cvWant(p, hot) {
  if (p.kind === "skin") return .08; if (p.kind === "bone") return /ribs|sternum|spine_thoracic|clavicle|scapula/.test(p.id) ? .16 : .05;
  if (p.kind === "brain" || p.kind === "nerve") return 0; if (p.kind === "muscle") return hot ? .9 : p.id === "diaphragm" ? .3 : 0;
  if (p.kind === "organ") return hot ? (/lung/.test(p.id) ? .62 : 1) : NV.focus ? (/lung/.test(p.id) ? .14 : .35) : /lung/.test(p.id) ? .3 : p.id === "pulmonary_vessels" ? .7 : 1;
  return null;
}
// Heartbeat and breathing: scale each organ about its own centre.
function cvAnimate(s) {
  const C = NV.N, bps = (C.hr || 72) / 60, irregular = C.cond?.where === "rhythm", ph = (s * bps + (irregular ? .18 * Math.sin(s * 2.3) + .1 * Math.sin(s * 5.1) : 0)) % 1;
  const beat = Math.exp(-((ph - .08) ** 2) / .002) + .6 * Math.exp(-((ph - .3) ** 2) / .003), br = .5 - .5 * Math.cos(2 * Math.PI * s * (C.rr || 14) / 60);
  const sc = (id, k) => { const p = NV.byId[id]; if (!p) return; p.m.scale.setScalar(k); p.m.position.copy(p.c).multiplyScalar(1 - k); };
  const hb = 1 + .045 * beat * (C.cond?.where === "pump" ? .55 : 1); sc("heart", hb); sc("coronary_arteries", hb);
  const lb = 1 + .05 * br * (C.cond?.where === "sacs" ? .5 : C.cond?.where === "airway" ? .7 : 1); sc("lung_l", lb); sc("lung_r", lb); sc("bronchi", 1 + .02 * br);
  const d = NV.byId.diaphragm; if (d) d.m.position.y = -14 * br;
}

/* ---------- 2D: where oxygen goes, and where it is held up for this patient ---------- */
function o2SVG(C) {
  const w = C.cond?.where, at = { airway: "lungs", sacs: "lungs", pump: "heart", coronary: "heart", rhythm: "heart", vessels: "pipe", legs: "muscles", fitness: "muscles" }[w], dur = w ? 13 : 9;
  // The loop runs along the top (oxygen-rich, red) to the muscles, back along the bottom (used, blue) and round through the lungs.
  const loop = "M120,50 H580 A60,60 0 0 1 580,170 H120 A60,60 0 0 1 120,50 Z", beg = i => `${(-i * dur / 18).toFixed(2)}s`;
  const dots = Array.from({ length: 18 }, (_, i) => `<circle r="7" class="o2d"><animateMotion dur="${dur}s" begin="${beg(i)}" repeatCount="indefinite"><mpath href="#o2loop"/></animateMotion>
    <animate attributeName="fill" dur="${dur}s" begin="${beg(i)}" repeatCount="indefinite" calcMode="discrete" values="#ff6b5b;#6f8fff;#ff6b5b" keyTimes="0;0.427;0.927"/></circle>`).join("");
  const air = Array.from({ length: at === "lungs" ? 2 : 4 }, (_, i) => `<circle r="5" class="o2air"><animateMotion dur="${at === "lungs" ? 3.6 : 2}s" begin="${-i * .5}s" repeatCount="indefinite" path="M6,110 H76"/></circle>`).join("");
  const node = (x, k, label, num, d) => `<g class="o2n ${at === k ? "hot" : ""}" transform="translate(${x} 0)">${at === k ? `<rect x="-50" y="25" width="100" height="170" rx="50" class="o2ring"/>` : ""}<rect x="-42" y="33" width="84" height="154" rx="42" class="o2c"/>
    <path d="${d}" class="o2i" transform="translate(-21 89) scale(1.75)"/><text y="222" class="o2t">${label}</text>${num ? `<text y="244" class="o2v">${esc(num)}</text>` : ""}</g>`;
  return `<svg viewBox="0 0 700 254" class="o2svg" role="img" aria-label="Air to the lungs, oxygen to the heart and on to the muscles"><path id="o2loop" d="${loop}" class="o2loop"/>
    <path d="M120,50 H580" class="o2lane r"/><path d="M580,170 H120" class="o2lane b"/>
    ${node(120, "lungs", "Lungs", C.spo2 ? `Oxygen ${C.spo2}%` : "", "M12 4v7M12 11c-2 0-3 2-5 2S4 15 4 17v1c0 1 1 2 2 2 3 0 5-3 5-6M12 11c2 0 3 2 5 2s3 2 3 4v1c0 1-1 2-2 2-3 0-5-3-5-6")}
    ${node(350, "heart", "Heart", C.hr ? `${C.hr} beats a minute` : "", "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z")}
    ${node(580, "muscles", "Muscles", C.walk ? `${C.walk.dist} m walked` : "", "M4 18c4-1 6-5 8-12 2 7 4 11 8 12")}
    ${at === "pipe" ? `<circle cx="465" cy="50" r="20" class="o2ring"/>` : ""}${dots}${air}</svg>`;
}

/* ---------- Effort: how hard to work, from the walk test ---------- */
const EFFORT = [[2, "g0", "Easy", "Warm-up and cool-down pace."], [4, "g", "Your training zone", "Breathing harder, but you can still talk in sentences."], [6, "a", "Hard", "Slow down until you can talk again."], [10, "r", "Too hard", "Stop, use your recovery breathing and rest."]];
const effortZone = v => EFFORT.find(z => v <= z[0]);
function effortHTML(C) {
  const wk = C.walk, mark = wk?.d1;
  return `<div class="ef"><div class="efbar">${Array.from({ length: 11 }, (_, i) => `<i class="z-${effortZone(i)[1]}" data-v="${i}"><b>${i}</b></i>`).join("")}${mark != null ? `<span class="efme" style="--x:${mark}">End of your walk</span>` : ""}</div>
    <input type="range" min="0" max="10" step="1" value="3" aria-label="How breathless or hard the exercise feels, out of 10"><p class="efsay" aria-live="polite"></p></div>`;
}
function cvInit(tr) {
  tr.querySelectorAll(".ef").forEach(ef => { const inp = ef.querySelector("input"), set = v => { const z = effortZone(v); ef.dataset.z = z[1]; ef.querySelectorAll(".efbar i").forEach(i => i.classList.toggle("on", +i.dataset.v === v)); ef.querySelector(".efsay").innerHTML = `<b>${esc(z[2])}</b> ${esc(z[3])}`; };
    inp.addEventListener("input", e => { const v = +e.target.value; if (effortZone(v)[1] !== ef.dataset.z) hz(effortZone(v)[1] === "r" ? "warn" : "tick"); set(v); }); set(+inp.value); });
}

function cardioSlides(p, C, ctx) {
  const { head, take, flowHTML } = ctx, S = [], c = C.cond; if (!c) return S;
  const evc = C.ev.slice(0, 6).map(e => `<span>${esc(e)}</span>`).join("");
  S.push({ id: "heart", html: `<div class="an nv" data-mode="cardio"><div class="anstage"><div class="anlabels"></div><span class="ancap" aria-live="polite"></span><p class="c3msg">Loading the body…</p></div>
    <div class="anctl"><button class="anbtn" data-act="cvPlay" aria-label="Play the guided tour"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
      <button class="anbtn sig s" data-act="cvAir" aria-label="Show a breath">${icon("M4 8h10a3 3 0 1 0-3-3M4 12h15a3 3 0 1 1-3 3M4 16h7")}<small>Breathe</small></button>
      <button class="anbtn sig m" data-act="cvBlood" aria-label="Show the blood flow">${icon("M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z")}<small>Pump</small></button>
      <button class="anbtn hotb" data-act="cvHot" aria-label="Show where the problem is">${icon("M12 5a7 7 0 1 0 0 14 7 7 0 1 0 0-14M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5")}</button></div>
    ${evc ? `<div class="cev nvev"><b>From today's tests</b>${evc}</div>` : ""}<p class="ancredit">${esc(NEURO_CREDIT)}</p></div>`,
    say: `These are your heart and lungs. Air comes down the windpipe into the lungs, oxygen passes into the blood, and the heart pumps it round your body to your muscles.${C.hr ? ` Your heart is beating at your own resting rate, ${C.hr} beats a minute.` : ""} With ${c.name.toLowerCase()}, ${c.flow[1].toLowerCase()}.`, nv: { mode: "cardio", story: true } });
  S.push({ id: "ccause", html: `${head("What is happening", c.name, c.id === "fit" ? "From your walk test" : "Possible, not a diagnosis")}<div class="o2">${o2SVG(C)}</div>${flowHTML(c.flow)}${take(c.helps)}`,
    say: `${c.name}. Oxygen travels from the air, through the lungs, to the heart and on to your muscles. For you, the hold-up is ${CWHERE[c.where].toLowerCase()}. ${c.flow.join(". ")}. ${c.helps}` });
  const wk = C.walk, num = [];
  if (wk) { num.push(["6-minute walk", `${wk.dist} m`, wk.pred ? `Expected about ${wk.pred} m` : "", wk.pct ? wk.pct / 100 : null]);
    if (wk.hr0 && wk.hr1) num.push(["Heart rate", `${wk.hr0} → ${wk.hr1}`, "Before and after", null]);
    if (wk.sp0 && wk.sp1) num.push(["Oxygen", `${wk.sp0}% → ${wk.sp1}%`, wk.desat ? "Drops when you walk" : "Held steady", null]);
    if (wk.d1 != null) num.push(["Breathlessness", `${wk.d0 ?? "?"} → ${wk.d1}`, "Out of 10", null]); }
  const stop = ["Chest pain or tightness", "Dizziness or feeling faint", "A racing or very uneven pulse", "Breathlessness that doesn't settle", ...(wk?.desat ? ["Oxygen below 88% on your finger probe"] : [])];
  S.push({ id: "effort", html: `${head("While you exercise", "How hard to work", wk ? "From your 6-minute walk" : "Your guide at home")}${num.length ? `<div class="gtnum efnum">${num.map(([k, v, n, r]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b>${n ? `<span>${esc(n)}</span>` : ""}${r != null ? `<i style="--w:${Math.round(Math.min(1, r) * 100)}%"></i>` : ""}</div>`).join("")}</div>` : ""}
    ${effortHTML(C)}<div class="efstop"><b>${icon("M12 3 2 20h20zM12 10v4M12 17h.01")}Stop and tell us if you get</b>${stop.map(s => `<span>${esc(s)}</span>`).join("")}</div>`,
    say: `How hard to work. Rate how breathless you feel from 0 to 10. Your training zone is 3 to 4: breathing harder, but you can still talk in sentences.${wk?.d1 != null ? ` At the end of your walk test you were at ${wk.d1}.` : ""} Stop and tell us if you get chest pain, dizziness, a racing pulse, or breathlessness that doesn't settle.` });
  const plb = c.breath === "plb";
  S.push({ id: "breath", html: `${head("Your breathing tool", plb ? "Pursed-lip breathing" : "Recovery breathing", "Follow the circle")}<div class="br"><div class="brc"><span class="brring"></span><span class="brdot"></span>
      <span class="brin">In through your nose<small>1 · 2</small></span><span class="brout">${plb ? "Out slowly through pursed lips" : "Out gently through your mouth"}<small>1 · 2 · 3 · 4</small></span></div>
    <div class="brwhen">${[["M4 20h4v-4h4v-4h4V8h4", "On stairs"], ["M13 4a2 2 0 1 0 0 .1M9 21l3-7 3 3v4M7 12l3-3 4 2 3 3", "When walking"], ["M5 12h14M12 5l7 7-7 7", "When breathless"]].map(([d, t], i) => `<div style="--i:${i}">${icon(d)}<b>${t}</b></div>`).join("")}</div></div>
    ${take("Lean forward with your arms resting on your knees or a table. It lets the breathing muscles work best while you recover.")}`,
    say: `Your breathing tool: ${plb ? "pursed-lip breathing" : "recovery breathing"}. Breathe in through your nose for two, and out ${plb ? "slowly through pursed lips" : "gently through your mouth"} for four. Use it on stairs, when walking, or whenever you are breathless. Leaning forward with your arms resting on your knees helps you recover faster.` });
  return S;
}
const CARDIO_ACT = {
  cvPlay: () => { if (!NV) return; NV.story ? nvStory(false) : nvStory(); },
  cvAir: () => { if (!NV) return; nvStory(false); NV.focus = false; nvSetHot(["trachea", "bronchi"], "chest"); NV.az = 0; cvBreathe(); nvCap("Air flows down the windpipe into the lungs"); hz("tap"); },
  cvBlood: () => { if (!NV) return; nvStory(false); NV.focus = false; nvSetHot(["heart"], "chest"); NV.az = -20; cvPump(); nvCap(NV.N.hr ? `Your heart: ${NV.N.hr} beats a minute at rest` : "The heart pumps blood round the body"); hz("tap"); },
  cvHot: () => { if (!NV) return; nvStory(false); cvProblem(); },
};
