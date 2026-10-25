/* ---------- Guided sessions ----------
   A visit runs as one flow: plan the tests (suggested from the diagnosis and earlier visits), answer each test one page at a time
   with how-to-test tips and safety cues, time the timed tests with a built-in stopwatch, then see the session summary,
   explain it to the patient in plain words, or print the professional PDF. */

/* How-to-test tips. "how" shows on a test's first page, items[i] on that item's page, "safe" is a standing safety reminder. */
const BERG_TIPS = ["Patient sits on a chair with arms. Ask them to stand without using their hands if they can.", "Ask them to stand for 2 minutes without holding on. Score the first attempt.", "Patient sits on a bed or stool, feet flat, arms folded, for 2 minutes.", "Ask them to sit down from standing. Watch for control and use of hands.", "Set up a pivot transfer between two chairs, one with arms and one without.", "Ask them to close their eyes and stand still for 10 seconds.", "Ask them to place feet together and stand for 1 minute without holding on.", "Arm raised to 90°, fingers stretched. Measure how far they reach forward without stepping.", "Place a shoe or slipper in front of the feet and ask them to pick it up.", "Ask them to turn and look behind over the left shoulder, then the right.", "Ask them to turn a full circle, pause, then turn a full circle the other way.", "Ask them to place each foot alternately on a step or stool, 4 times each.", "Demonstrate: one foot directly in front of the other. If not possible, step far ahead.", "Ask them to stand on one leg as long as they can without holding on."];
const TIPS = {
  berg: { how: "Score the lowest category that applies. Use a stopwatch, a ruler, a step and two chairs.", items: BERG_TIPS, safe: "Stand close and guard. Use a gait belt if balance is poor." },
  tinetti: { how: "Use a firm armless chair. For gait, ask the patient to walk at their usual pace with their usual aid.", safe: "Stay alongside, especially on turns and the eyes-closed item." },
  tug: { how: "Patient sits back in a standard armchair. Start timing on \"Go\" and stop when their back touches the chair again.", safe: "Walk alongside on the turn. Use the usual walking aid." },
  sts5: { how: "Arms folded across the chest. Time five full stands, stopping when they sit down the fifth time.", safe: "Steady the chair against a wall." },
  mwt6: { how: "Walk back and forth along a 30 m corridor for 6 minutes. Give only the standard encouragement each minute.", safe: "Stop if there is chest pain, severe breathlessness, dizziness or SpO₂ below 85%." },
  mwt10: { how: "Time the middle 6 m of a 10 m walkway, so speeding up and slowing down are left out.", safe: "Walk slightly behind and to the side." },
  freach: { how: "Arm at 90° beside a wall-mounted ruler. Measure from the third knuckle at the start and at maximum reach.", safe: "Stand on the patient's open side." },
  rom: { how: "Stabilise the proximal segment. Align the axis with the joint and read at the end of active range. Use the Goniometer tool for camera or tilt readings." },
  mmt: { how: "Test against gravity first. Give resistance only if the full range against gravity is achieved." },
  pain: { how: "Ask: \"On a scale from 0 to 10, where 0 is no pain and 10 is the worst pain you can imagine, how is your pain now?\"" },
  lefs: { how: "Read each activity aloud. Ask how much difficulty they have today because of their lower limb problem." },
  odi: { how: "Ask the patient to fill in the paper ODI, then enter the section scores." }, ndi: { how: "Ask the patient to fill in the paper NDI, then enter the section scores." },
  qdash: { how: "Ask about the last week. Patients answer about their ability, whichever hand they use." },
  mas: { how: "Patient relaxed and supine. Move the limb through full range in about one second and feel for the catch." },
  barthel: { how: "Score what the patient actually does, not what they could do. Ask a carer if needed." },
  eat10: { how: "Read each statement. The patient rates how much of a problem it is, from 0 (none) to 4 (severe).", safe: "A score of 3 or more suggests a swallowing difficulty. Do not give food or drink to test it here." },
  phq9: { how: "Ask about the last 2 weeks. Read the options aloud each time.", items: [, , , , , , , , "Ask this one directly and calmly. If the answer is anything but \"not at all\", ask about current risk now and follow your clinic's safety protocol."] },
  gad7: { how: "Ask about the last 2 weeks. Read the options aloud each time." },
  vitals: { how: "Seated rest for 5 minutes first. Note the arm and position used for blood pressure." },
  hand: { how: "Seated, elbow at 90°, forearm neutral. Take the best of three grip trials on each side." },
  moca: { how: "Use the official MoCA form and instructions, then enter the section scores here." },
};
const TIMED = { tug: { cut: 13.5, cue: "Over 13.5 s means a higher fall risk. Stay alongside on the turn." }, sts5: { cut: 15, cue: "Over 15 s suggests increased fall risk." }, mwt10: { cut: null, cue: "Start when the first foot crosses the 2 m mark, stop at 8 m." } };
const MWT6_CUES = ["You are doing well. You have 5 minutes to go.", "Keep up the good work. You have 4 minutes to go.", "You are doing well. You are halfway done.", "Keep up the good work. You have only 2 minutes left.", "You are doing well. You have only 1 minute to go."];

/* Pages: one per question; left/right rows and plain measurements are grouped; timed fields get a stopwatch page; a final page reviews and saves. */
function gSteps(t) {
  const out = []; let head = "";
  t.fields.forEach((f, i) => {
    const last = out.at(-1);
    if (f.t === "head") { head = f.label; return; }
    if (f.t === "scale" || f.t === "sel" || f.t === "check") out.push({ k: "item", fs: [f], i, head, title: f.label });
    else if (isLR(f)) { if (last?.k === "lr" && last.head === head && last.fs.length < 8) last.fs.push(f); else out.push({ k: "lr", fs: [f], i, head, title: head || "Left and right" }); }
    else if (f.t === "num" && f.id === "time" && f.unit === "s" && TIMED[t.id]) out.push({ k: "timer", fs: [f], i, head, title: t.id === "mwt10" ? "Time the walk" : t.id === "sts5" ? "Five stands, arms folded" : "Walk 3 m, turn, return, sit" });
    else if (f.t === "num") { if (last?.k === "nums" && last.head === head) last.fs.push(f); else out.push({ k: "nums", fs: [f], i, head, title: head || (t.id === "mwt6" && !out.length ? "Walk for six minutes" : "Measurements") }); }
    else if (f.t === "text" || f.t === "area") { if (last?.k === "texts") last.fs.push(f); else out.push({ k: "texts", fs: [f], i, head, title: "Details" }); }
  });
  out.push({ k: "finish", fs: [], title: "Check and save" });
  return out;
}
const stepDone = (s, v) => s.k === "finish" ? false : s.fs.some(f => has(v[f.id]) && (typeof v[f.id] !== "object" || Object.keys(v[f.id]).length));
function gCues(t, st, v) {
  const out = [], tip = TIPS[t.id] || {};
  if (tip.safe && (st.k !== "finish")) out.push(["warn", tip.safe]);
  if (["berg", "tinetti"].includes(t.id)) {
    const low = t.fields.slice(0, st.i).find(f => f.t === "scale" && has(v[f.id]) && +v[f.id] <= 1);
    if (low) out.unshift(["bad", `Stand close: the patient scored ${v[low.id]} on "${low.label}".`]);
  }
  if (t.id === "phq9" && has(v.f8) && +v.f8 > 0) out.unshift(["bad", "Item 9 was answered above zero. Ask about current risk now and follow your clinic's safety protocol."]);
  if (t.id === "mwt6" && ((has(v.sp1) && +v.sp1 < 85) || (has(v.sp0) && +v.sp0 < 88))) out.unshift(["bad", "SpO₂ is low. Check the patient before continuing and consider stopping the test."]);
  return out;
}

/* Stopwatch and countdown: one firm pulse on start and stop, a soft pulse each minute of the six-minute walk, nothing in between. */
let TM = null;
function tmStop(keep) { if (!TM) return; cancelAnimationFrame(TM.raf); clearInterval(TM.iv); const s = TM; TM = null; return keep ? s : null; }
function tmFmt(sec, down) { if (down) { const r = Math.max(0, Math.ceil(sec)), m = Math.floor(r / 60); return `${m}:${String(r % 60).padStart(2, "0")}`; } return sec.toFixed(sec < 100 ? 1 : 0); }
function tmPaint() {
  if (!TM) return; const el = $("#tmval"), ring = $("#tmring"); if (!el) return tmStop();
  const sec = (performance.now() - TM.t0) / 1000;
  if (TM.down) { const left = TM.down - sec; el.textContent = tmFmt(left, true); ring?.style.setProperty("--p", String(Math.min(1, sec / TM.down)));
    const m = Math.floor(sec / 60); if (m > TM.min && m < 6) { TM.min = m; hz("tick"); const c = $("#tmcue"); if (c) c.textContent = `Say: "${MWT6_CUES[m - 1]}"`; }
    if (left <= 0) { tmStop(); el.textContent = "0:00"; hz("warn"); $("#tmbtn").textContent = "Start again"; const c = $("#tmcue"); if (c) c.textContent = "Six minutes. Ask the patient to stop where they are and measure the distance."; return; } }
  else { el.textContent = tmFmt(sec); const cut = TIMED[draft?.tid]?.cut; ring?.style.setProperty("--p", String(Math.min(1, sec / ((cut || 20) * 1.4)))); ring?.classList.toggle("over", !!cut && sec > cut); }
  TM.raf = requestAnimationFrame(tmPaint);
}

/* ---------- The guided form ---------- */
VIEWS.gform = () => {
  const t = getTpl(draft), p = P(draft.pid), steps = gSteps(t), n = steps.length;
  draft.g = Math.max(0, Math.min(n - 1, draft.g || 0)); const g = draft.g, st = steps[g], v = draft.values;
  const tip = TIPS[t.id] || {}, itemTip = st.k === "item" ? (tip.items?.[t.fields.indexOf(st.fs[0])] || st.fs[0].hint) : null;
  const tipTxt = itemTip || (g === 0 ? tip.how || t.desc : null), cues = gCues(t, st, v), sess = draft.sid && db.session?.id === draft.sid ? db.session : null;
  if (cues[0]?.[0] === "bad" && gCued !== draft.id + cues[0][1]) { gCued = draft.id + cues[0][1]; hz("warn"); }
  const pct = (g + 1) / n, C = 2 * Math.PI * 19;
  chrome(null, `<button class="gnav" data-act="gGo" data-i="${g - 1}" ${g ? "" : "disabled"} aria-label="Previous page">‹</button><div class="score" id="live" aria-live="polite" aria-atomic="true"></div>${st.k === "finish" ? `<button class="primary" data-act="saveA">${sess ? "Save and continue" : "Save"}</button>` : `<button class="primary" data-act="gGo" data-i="${g + 1}">${g === n - 2 ? "Review" : "Next"}</button>`}`);
  let body = "";
  if (st.k === "item") body = `<div class="gpage single">${fieldHTML(st.fs[0], v[st.fs[0].id])}</div>`;
  else if (st.k === "lr") body = `<div class="form gpage"><div class="lrrow lrhead" aria-hidden="true"><span></span><span>Left</span><span>Right</span></div>${st.fs.map(f => fieldHTML(f, v[f.id])).join("")}</div>`;
  else if (st.k === "nums" || st.k === "texts") body = `<div class="form gpage">${t.id === "mwt6" && st.fs.some(f => f.id === "dist") ? timerHTML(360) : ""}${st.fs.map(f => fieldHTML(f, v[f.id])).join("")}</div>`;
  else if (st.k === "timer") body = `${timerHTML(0, v[st.fs[0].id])}<div class="form gpage">${fieldHTML(st.fs[0], v[st.fs[0].id])}</div>`;
  else body = finishHTML(t, steps, v);
  $("#app").innerHTML = `
  <header class="ghead">${back(sess ? "sessHub" : A(draft.id) ? "result" : "library", A(draft.id) && !sess ? `data-id="${draft.id}"` : `data-pid="${draft.pid}"`)}
    <span class="gring" role="img" aria-label="Page ${g + 1} of ${n}"><svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="19"/><circle class="on" cx="23" cy="23" r="19" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct)).toFixed(1)}"/></svg><b class="${n > 9 ? "sm" : ""}">${g + 1}/${n}</b></span>
    <div class="grow"><div class="psub">${esc(t.short || t.name)} · ${esc(p.code)}</div><h1>${esc(st.title)}</h1></div>
    <button class="ghost" data-act="gList" aria-label="Show all questions on one page">List</button></header>
  <div class="stack">
    ${st.head && st.k !== "lr" ? `<div class="label">${esc(st.head)}</div>` : ""}
    ${t.lic && g === 0 ? `<p class="note lic">${esc(t.lic)}</p>` : ""}
    ${tipTxt ? `<div class="tip"><b>${g === 0 && !itemTip ? "How to test." : "Tip."}</b> ${esc(tipTxt)}</div>` : ""}
    ${cues.map(([k, c]) => `<div class="cue ${k}" role="note">${k === "bad" ? "⚠" : "!"} <span>${esc(c)}</span></div>`).join("")}
    ${body}
    <nav class="gdots" aria-label="Jump to a question">${steps.map((s, i) => `<button data-act="gGo" data-i="${i}" class="${i === g ? "c" : stepDone(s, v) ? "d" : ""}" aria-label="${esc(s.title)}${stepDone(s, v) ? ", answered" : ""}" ${i === g ? 'aria-current="step"' : ""}>${s.k === "finish" ? "✓" : i + 1}</button>`).join("")}</nav>
    ${st.k === "item" && st.fs[0].t !== "check" ? `<p class="note center">Choosing an answer moves on. Tap a number to go back and check one.</p>` : ""}
  </div>`;
  updateLive();
};
let gCued = "";
function timerHTML(down, val) {
  return `<div class="timer idle" id="tmring" style="--p:0"><button class="tmface" data-act="tmToggle" data-down="${down}" aria-label="Start or stop the timer"><svg viewBox="0 0 250 250" aria-hidden="true"><circle cx="125" cy="125" r="108"/><circle class="on" cx="125" cy="125" r="108" pathLength="1"/></svg><b id="tmval">${down ? tmFmt(down, true) : has(val) ? esc(val) : "0.0"}</b><span>${down ? "minutes left" : "seconds"}</span></button>
    <div class="actions"><button data-act="tmReset" data-down="${down}">Reset</button><button class="primary" id="tmbtn" data-act="tmToggle" data-down="${down}">Start</button></div>
    ${down ? `<div class="cue" id="tmcue" aria-live="polite">Say at the start: "Walk as far as possible for 6 minutes, but don't run or jog."</div>` : TIMED[draft.tid]?.cue ? `<div class="cue">${esc(TIMED[draft.tid].cue)}</div>` : ""}</div>`;
}
function finishHTML(t, steps, v) {
  const rows = steps.slice(0, -1).map((s, i) => { const vals = s.fs.map(f => has(v[f.id]) ? fmtVal(f, v[f.id]) : "").filter(Boolean);
    return `<button class="trow" data-act="gGo" data-i="${i}"><span class="gnum ${vals.length ? "d" : ""}">${i + 1}</span><span class="grow"><b>${esc(s.title)}</b><small>${vals.length ? esc(vals.join(" · ").slice(0, 120)) : "Not answered"}</small></span><span class="chev" aria-hidden="true">›</span></button>`; }).join("");
  return `<div class="result"><div class="label">Result so far</div><div class="bigrow"><span class="big" id="gbig"></span><span id="gband"></span></div></div>
    <div class="field"><span class="label" id="adatel">Assessment date</span><div class="segc dates" role="group" aria-labelledby="adatel">${[[today(), "Today"], [daysAgo(1), "Yesterday"]].map(([d, l]) => `<button type="button" data-act="pickDate" data-v="${d}" aria-pressed="${draft.date === d}">${l}</button>`).join("")}
      <label id="adatelab" class="${[today(), daysAgo(1)].includes(draft.date) ? "" : "on"}"><span>${[today(), daysAgo(1)].includes(draft.date) ? "Earlier…" : fmtShort(draft.date)}</span><input id="adate" type="date" value="${draft.date}" max="${today()}" aria-label="Choose an earlier date"></label></div></div>
    <div class="field"><label class="label" for="anotes">Clinical notes and observations</label><textarea id="anotes" rows="3" placeholder="Quality of movement, compensations, patient comments, safety">${esc(draft.notes)}</textarea></div>
    <h2 class="sec">Your answers</h2><div class="card list">${rows}</div>`;
}
function gMove(i, dir) {
  const steps = gSteps(getTpl(draft)); if (i < 0 || i >= steps.length || i === draft.g) return;
  tmStop(); navNext = dir || (i > draft.g ? "fwd" : "back"); draft.g = i; keepDraft(); render(); window.scrollTo(0, 0); animateNav(navDir("gform"));
}
// Swipe left or right on a question page to move between pages.
{ let x0 = null, y0 = 0;
  document.addEventListener("touchstart", e => { x0 = view.name === "form" && draft?.g != null && !sheetEl && e.touches.length === 1 && !e.target.closest("input,textarea,.timer") && e.touches[0].clientX > 30 ? e.touches[0].clientX : null; y0 = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", e => { if (x0 == null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > 1.6 * Math.abs(dy)) gMove(draft.g + (dx < 0 ? 1 : -1)); }, { passive: true }); }

/* ---------- Session: plan, hub, summary ---------- */
const DX_RULES = [
  [/\b(acl|pcl|mcl|knee|tkr|tka|menisc\w*|patell\w*)\b/i, "knee", ["pain", "lefs", GONIO, "gait"]],
  [/\b(hip|thr|femur|femoral|ankle|foot|achilles|lower limb)\b/i, "lower limb", ["pain", "lefs", "tug", GONIO]],
  [/\b(stroke|cva|hemipar\w*|tbi|brain injury|parkinson\w*|multiple sclerosis|ms|sci|spinal cord)\b/i, "neurological rehab", ["berg", "tug", "mwt10", "mas", "mmt"]],
  [/\b(back|lumbar|disc|sciatica|spine|spinal|spondyl\w*|lbp)\b/i, "back pain", ["pain", "odi", "posture"]],
  [/\b(neck|cervical|whiplash)\b/i, "neck pain", ["pain", "ndi", "posture"]],
  [/\b(shoulder|rotator|frozen|elbow|wrist|hand|carpal|upper limb|humer\w*)\b/i, "upper limb", ["pain", "qdash", GONIO, "hand"]],
  [/\b(fall\w*|balance|elder\w*|frail\w*|vertigo|dizz\w*)\b/i, "balance and falls", ["berg", "tug", "sts5"]],
  [/\b(swallow\w*|dysphag\w*)\b/i, "swallowing", ["eat10", "fois"]],
  [/\b(autism|asd|sensory|adhd|develop\w*|delay)\b/i, "development", ["sensproc", "devscreen"]],
  [/\b(copd|cardiac|heart|lung|pulmonary|covid|breath\w*)\b/i, "heart and lungs", ["vitals", "mwt6"]],
  [/\b(speech|aphasia|voice|dysarthria|language)\b/i, "communication", ["commscreen", "intellig"]],
];
const MINS = { tug: 2, sts5: 2, mwt6: 9, mwt10: 3, [GONIO]: 4, posture: 3, gait: 3, pain: 1, vitals: 3 };
const planName = tid => tid === GONIO ? "Goniometer" : allTpl().find(x => x.id === tid)?.name || tid;
const planShort = tid => tid === GONIO ? "Joint angles" : allTpl().find(x => x.id === tid)?.short || tid;
const planMins = tid => MINS[tid] || Math.max(1, Math.round((allTpl().find(x => x.id === tid)?.fields.length || 4) * 0.25));
const isProTid = tid => tid === GONIO || !!TPLMAP[tid]?.tool;
function suggest(p) {
  const dx = `${p.dx} ${p.notes}`, rule = DX_RULES.find(r => r[0].test(dx)), ids = new Set(allTpl().map(t => t.id).concat(GONIO));
  const prev = [...new Set(db.assessments.filter(a => a.pid === p.id && a.date >= daysAgo(90)).sort(byDate).reverse().map(a => isGonio(a) ? GONIO : a.tid))];
  let list = [...new Set([...(rule ? rule[2] : ["pain"]), ...prev])].filter(t => ids.has(t));
  if (list.includes(GONIO)) list = list.filter(t => t !== "rom"); // the Goniometer saves into the ROM record
  list = list.slice(0, 5);
  return { list, why: rule ? `Suggested for ${rule[1]}` : prev.length ? "Suggested from earlier visits" : "Suggested to start" };
}
let planDraft = null;
VIEWS.plan = pid => {
  const p = P(pid); if (!p) return go("today");
  if (!planDraft || planDraft.pid !== pid) { const s = suggest(p); planDraft = { pid, on: new Set(s.list), list: s.list, why: s.why }; }
  const on = planDraft.list.filter(t => planDraft.on.has(t)), mins = on.reduce((m, t) => m + planMins(t), 0);
  const visits = new Set(db.assessments.filter(a => a.pid === pid).map(a => a.date)), last = [...visits].sort().at(-1);
  chrome(null, `<button class="primary wide" data-act="planStart" ${on.length ? "" : "disabled"}>Begin session · ${on.length} test${on.length === 1 ? "" : "s"} · about ${mins} min</button>`);
  $("#app").innerHTML = `
  <header>${back("patient", `data-id="${pid}"`)}<div class="grow"><div class="psub">New session</div><h1>${esc(p.code)}</h1></div></header>
  <div class="stack">
    <div class="card"><div class="psub">${esc(p.age)} yrs · ${esc(p.sex)} · ${esc(p.dx || "No diagnosis recorded")}</div><div class="chips" style="margin-top:8px">${last ? `<span class="chip neutral">Last visit ${fmtShort(last)}</span>` : `<span class="chip neutral">First visit</span>`}<span class="chip neutral">${visits.size} visit${visits.size === 1 ? "" : "s"}</span></div></div>
    <h2 class="sec">${esc(planDraft.why)}</h2>
    <div class="card list" role="group" aria-label="Tests in this session">${planDraft.list.map(t => `<button class="trow" data-act="planToggle" data-t="${t}" aria-pressed="${planDraft.on.has(t)}"><span class="pchk" aria-hidden="true">✓</span><span class="grow"><b>${esc(planName(t))}${isProTid(t) ? ' <span class="pro-chip">PRO</span>' : ""}</b><small>${t === GONIO ? "Camera or phone tilt" : TOOLS[t] ? esc(TOOLS[t].tag) : `${gSteps(allTpl().find(x => x.id === t)).length - 1} pages`} · about ${planMins(t)} min</small></span></button>`).join("")}
      <button class="trow muted" data-act="planAdd"><span class="pchk add" aria-hidden="true">+</span><span class="grow"><b>Add a test</b></span></button></div>
    <p class="note center">Based on the diagnosis and what was measured before. Tap a test to leave it out.</p>
  </div>`;
};
function sessNext() { const s = db.session; return s?.plan.find(t => !s.done[t] && !s.skip.includes(t)); }
function sessNote(planTid, pid, aid, sid) {
  const s = db.session; if (!s || s.pid !== pid || !s.plan.includes(planTid) || (sid && sid !== s.id)) return false;
  s.done[planTid] = aid; s.skip = s.skip.filter(x => x !== planTid); save(); go(sessNext() ? "sess" : "summary"); return true;
}
VIEWS.sess = () => {
  const s = db.session, p = s && P(s.pid); if (!p) { db.session = null; return go("today"); }
  const next = sessNext(), doneN = Object.keys(s.done).length;
  if (!next) return go("summary");
  chrome(null, `<button data-act="sessSkip" data-t="${next}">Skip</button><button class="primary wide" data-act="sessStart" data-t="${next}">Start ${esc(planShort(next))}</button>`);
  $("#app").innerHTML = `
  <header>${back("patient", `data-id="${p.id}"`)}<div class="grow"><div class="psub">Session · ${fmtShort(s.date)}</div><h1>${esc(p.code)}</h1></div></header>
  <div class="stack">
    <div class="pbar" role="progressbar" aria-valuenow="${doneN}" aria-valuemin="0" aria-valuemax="${s.plan.length}" aria-label="Tests done"><i style="--w:${Math.round(100 * doneN / s.plan.length)}%"></i></div>
    <section class="cont"><span class="label gold">Next up · ${doneN + 1} of ${s.plan.length}</span><b class="ctitle">${esc(planName(next))}</b><span class="psub">About ${planMins(next)} min${TIPS[next]?.safe ? ` · ${esc(TIPS[next].safe)}` : ""}</span></section>
    <div class="card list">${s.plan.map(t => { const a = s.done[t] && A(s.done[t]), r = a && runScore(getTpl(a), a.values, p);
      return `<div class="trow"><span class="pchk ${a ? "on" : s.skip.includes(t) ? "skip" : t === next ? "now" : ""}" aria-hidden="true">${a ? "✓" : s.skip.includes(t) ? "–" : "•"}</span><span class="grow"><b>${esc(planName(t))}</b><small>${a ? esc(r.txt) : s.skip.includes(t) ? "Skipped" : t === next ? "Next" : "Waiting"}</small></span>${a ? chip(r.band) : ""}</div>`; }).join("")}</div>
    ${doneN ? `<button data-act="sessFinish">Finish session now</button>` : ""}
  </div>`;
};
VIEWS.summary = () => {
  const s = db.session, p = s && P(s.pid); if (!p) return go("today");
  const rows = s.plan.filter(t => s.done[t] && A(s.done[t])).map(t => { const a = A(s.done[t]), tp = getTpl(a); return { t, a, tp, r: runScore(tp, a.values, p), c: compare(tp, a, p) }; });
  const better = rows.filter(x => x.c?.better && x.c.d !== 0).length, worse = rows.filter(x => x.c?.better === false && x.c.d !== 0).length, stars = rows.filter(x => x.c?.better && x.c.meaningful);
  const head = !rows.length ? "Nothing saved yet" : better && !worse ? "Good progress" : worse && !better ? "Results to review" : "Session complete";
  chrome(null, `<button data-act="explain" data-pid="${p.id}">Explain</button><button data-act="sessPdf">PDF</button><button class="primary wide" data-act="sessDone">Finish</button>`);
  $("#app").innerHTML = `
  <div class="sumhead"><div class="wglow" aria-hidden="true"></div><div class="psub">Session · ${esc(p.code)} · ${fmt(s.date)}</div><h1>${head}</h1><p class="note">${rows.length} test${rows.length === 1 ? "" : "s"} saved to the patient's record.</p></div>
  <div class="stack">
    <div class="card list">${rows.map(x => { const d = x.c?.d, u = x.tp.unit && !x.tp.unit.startsWith("/") ? " " + x.tp.unit : "";
      return `<button class="trow ${x.c?.better && x.c.meaningful ? "mcid" : ""}" data-act="result" data-id="${x.a.id}"><span class="grow"><b>${esc(x.tp.name)}</b><small>${esc(x.r.band[0])}</small></span><span class="sval">${esc(x.r.txt)}</span>${d != null && d !== 0 ? `<span class="sdelta ${x.c.better === null ? "" : x.c.better ? "up" : "down"}">${d > 0 ? "+" : ""}${d}${esc(u)}${changeBadge(x.tp, x.c)}</span>` : ""}</button>`; }).join("") || `<div class="empty">No tests were saved in this session.</div>`}</div>
    ${stars.map(x => `<div class="star"><span aria-hidden="true">★</span><p><b>${esc(x.tp.short)} ${x.c.d > 0 ? "rose" : "fell"} by ${Math.abs(x.c.d)}${x.tp.unit && !x.tp.unit.startsWith("/") ? " " + esc(x.tp.unit) : " points"}.</b> That is more than the ${x.tp.mcid}-point change seen as clinically meaningful, so it is likely a real change, not measurement noise.</p></div>`).join("")}
    ${(p.goals || []).length ? `<h2 class="sec">Goals</h2>${goalsHTML(p.id, true)}` : ""}
    ${reasonHTML(p.id)}
    ${s.skip.length ? `<p class="note">Skipped: ${s.skip.map(planShort).map(esc).join(", ")}.</p>` : ""}
  </div>`;
  if (!s.cheered && rows.length) { s.cheered = 1; save(); if (stars.length) hz("success"); }
};

/* ---------- Explain to patient ----------
   A bright page to turn toward the patient: body graphics and plain words, no clinical scores or labels.
   It informs and encourages; it never diagnoses. Mood screens are left off this page. */
const PLAIN = { pain: "Pain", lefs: "Everyday activities", berg: "Balance", tinetti: "Balance and walking", tug: "Getting up and walking", sts5: "Standing up from a chair", mwt6: "Walking stamina", mwt10: "Walking speed", freach: "Reaching without losing balance", sls: "Standing on one leg", rom: "How far your joints bend", mmt: "Muscle strength", odi: "Back and daily life", ndi: "Neck and daily life", qdash: "Arm and hand use", hand: "Grip and hand use", posture: "Posture", gait: "Walking pattern", barthel: "Daily self-care", eat10: "Swallowing", fois: "Eating and drinking", mas: "Muscle stiffness", vitals: "Heart and breathing" };
const REGION = { lefs: "knee", sts5: "knee", freach: "balance", berg: "balance", tinetti: "balance", tug: "balance", sls: "balance", mwt10: "balance", gait: "balance", mwt6: "heart", vitals: "heart", odi: "spine", ndi: "spine", posture: "spine", qdash: "shoulder", hand: "shoulder", eat10: "swallow", fois: "swallow" };
const WORK = { knee: [["Full bend", "M8 3v8l-3 9M8 11l7 2 2 7"], ["Strength", "M4 12h16M6 8v8M18 8v8M3 10v4M21 10v4"], ["Walking", "M13 4.5a2 2 0 1 0 0 .1M13 7l-1 6-3 3-1 5M12 13l3 3 1 5"]],
  balance: [["Balance", "M12 4.5a2 2 0 1 0 0 .1M12 7v7M5 10h14M12 14l-3 7M12 14l3 7"], ["Standing up", "M6 20V12h6v8M12 8v4M14 4.5a2 2 0 1 0 0 .1"], ["Walking", "M13 4.5a2 2 0 1 0 0 .1M13 7l-1 6-3 3-1 5M12 13l3 3 1 5"]],
  spine: [["Posture", "M12 3v18M9 6h6M9 10h6M9 14h6M9 18h6"], ["Core", "M7 8c2 2 8 2 10 0M7 12c2 2 8 2 10 0M7 16c2 2 8 2 10 0"], ["Moving well", "M5 18c4-10 10-10 14 0"]],
  shoulder: [["Reach", "M5 19l7-7 7-7M14 5h5v5"], ["Strength", "M4 12h16M6 8v8M18 8v8M3 10v4M21 10v4"], ["Posture", "M12 3v18M9 6h6M9 10h6M9 14h6"]],
  swallow: [["Safe swallowing", "M12 3v10M8 9l4 4 4-4M6 20h12"], ["Mouth exercises", "M6 12c3 3 9 3 12 0M8 10h8"], ["Meal plan", "M6 4v16M18 4v16M6 12h12"]],
  heart: [["Stamina", "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"], ["Breathing", "M12 4v8M8 12c-3 0-4 3-4 6M16 12c3 0 4 3 4 6"], ["Walking", "M13 4.5a2 2 0 1 0 0 .1M13 7l-1 6-3 3-1 5M12 13l3 3 1 5"]] };
const BODY = {
  knee: { t: "knee", h: "The knee joint", p: "Bending, strength and confidence all help the knee carry you through the day.", svg: `<path d="M50 4h30l-2 58q16 10 14 30-6 12-30 8-24 4-30-8-2-20 16-30z" class="b1"/><path d="M30 114q32-10 64 0l-8 14-4 58H52l-6-58z" class="b1"/><ellipse cx="102" cy="86" rx="10" ry="15" class="b2"/><circle cx="64" cy="106" r="26" class="hl"/><path d="M74 97 56 115" class="gold"/>` },
  spine: { t: "back", h: "Your spine", p: "Small blocks of bone with cushions between them. Movement and strength keep them healthy.", svg: Array.from({ length: 8 }, (_, i) => `<rect x="${44 - i}" y="${8 + i * 22}" width="${42 + 2 * i}" height="15" rx="6" class="b1"/><rect x="${50 - i}" y="${24 + i * 22}" width="${30 + 2 * i}" height="5" rx="2.5" class="${i === 5 || i === 6 ? "goldf" : "b2"}"/>`).join("") + `<circle cx="65" cy="150" r="30" class="hl"/>` },
  shoulder: { t: "shoulder", h: "The shoulder", p: "A ball in a shallow socket, held by the rotator cuff muscles. They guide every reach.", svg: `<path d="M8 40q40-22 90-6l-4 16q-40-10-82 4z" class="b1"/><circle cx="84" cy="70" r="22" class="b1"/><path d="M70 88l-8 96h30l8-96z" class="b1"/><path d="M60 52q24-16 46 6" class="gold"/><circle cx="84" cy="70" r="34" class="hl"/>` },
  balance: { t: "balance", h: "Balance and walking", p: "Your legs, inner ear and eyes work together to keep you steady on your feet.", svg: `<circle cx="65" cy="22" r="13" class="b1"/><path d="M65 36v62M65 52l-26 22M65 52l26 22M65 98l-18 82M65 98l18 82" class="limb"/><path d="M65 8v180" class="gold dash"/><path d="M30 186h70" class="gold"/><circle cx="65" cy="98" r="7" class="goldf"/>` },
  swallow: { t: "swallowing", h: "Swallowing", p: "Muscles in the mouth and throat work in order to move food safely down.", svg: `<path d="M30 30q20-26 60-10 20 10 18 40l-8 40q-6 10-20 10l-6 76H48l2-80q-22-8-22-40z" class="b1"/><path d="M76 74q-4 30-6 112" class="gold"/><circle cx="72" cy="90" r="26" class="hl"/>` },
  heart: { t: "heart and lungs", h: "Heart and lungs", p: "Every walk trains your heart and lungs to deliver energy to your muscles.", svg: `<path d="M65 170s-48-30-48-70a26 26 0 0 1 48-14 26 26 0 0 1 48 14c0 40-48 70-48 70z" class="b1"/><path d="M30 106h20l8-16 10 32 8-16h24" class="gold"/>` },
};
function explainData(pid) {
  const s = db.session?.pid === pid ? db.session : null;
  let as = s ? Object.values(s.done).map(A).filter(Boolean) : [];
  if (!as.length) { const last = new Map(); db.assessments.filter(a => a.pid === pid).sort(byDate).forEach(a => last.set(isGonio(a) ? "rom" : a.tid, a)); const d = [...last.values()].map(a => a.date).sort().at(-1); as = [...last.values()].filter(a => a.date === d); }
  return as.filter(a => !["phq9", "gad7", "abc", "moca"].includes(a.tid));
}
function regionFor(p, as) {
  const dx = DX_RULES.find(r => r[0].test(`${p.dx} ${p.notes}`))?.[1], byDx = { knee: "knee", "lower limb": "knee", "back pain": "spine", "neck pain": "spine", "upper limb": "shoulder", "balance and falls": "balance", "neurological rehab": "balance", swallowing: "swallow", "heart and lungs": "heart" }[dx];
  if (byDx) return byDx; const n = {}; as.forEach(a => { const r = REGION[a.tid]; if (r) n[r] = (n[r] || 0) + 1; });
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0] || "balance";
}
VIEWS.explain = pid => {
  const p = P(pid); if (!p) return go("today");
  const as = explainData(pid), reg = regionFor(p, as), B = BODY[reg];
  const items = as.map(a => { const t = getTpl(a), r = runScore(t, a.values, p), c = compare(t, a, p);
    const pill = !c || c.d == null ? ["First time we measured this", "n"] : c.d === 0 || c.better === null ? ["About the same", "a"] : c.better ? ["Better than last time", "g"] : ["A little harder than last time", "a"];
    const frac = r.max && r.val != null ? (t.hb === false ? 1 - r.val / r.max : r.val / r.max) : null;
    const word = { good: "Looking good", warn: "Some room to improve", bad: "We'll focus on this together", neutral: "Recorded today" }[r.band?.[1]] || "Recorded today";
    return { name: PLAIN[a.tid] || t.name.replace(/\s*\(.*\)/, ""), pill, frac, word }; });
  const better = items.filter(x => x.pill[1] === "g").length, harder = items.filter(x => x.pill[0].startsWith("A little")).length;
  const title = better && !harder ? `Your ${B.t} is getting stronger` : better ? "You're making progress" : harder ? "Let's work on this together" : "Here's where we are today";
  explainText = `${title}\n\n${items.map(x => `• ${x.name}: ${x.pill[0].toLowerCase()}. ${x.word}.`).join("\n")}\n\nThis week we'll work on: ${WORK[reg].map(w => w[0].toLowerCase()).join(", ")}.\n\n${db.settings.clinic || db.settings.therapist || "Your therapist"}`;
  document.body.classList.add("lightpage");
  chrome(null, `<button data-act="explainDone">Done</button><button class="primary wide" data-act="explainShare">Send to patient</button>`);
  $("#app").innerHTML = `
  <header class="lhead">${back("explainDone")}<div class="grow"><div class="psub">Your progress · ${fmt(today())}</div><h1>${esc(title)}</h1></div></header>
  <div class="stack">
    <div class="lcard body"><svg viewBox="0 0 130 192" class="bodyart" role="img" aria-label="${esc(B.h)}">${B.svg}</svg><div><div class="label">${esc(B.h)}</div><p>${esc(B.p)}</p></div></div>
    ${items.map(x => `<div class="lcard"><div class="lrow"><b>${esc(x.name)}</b><span class="pill ${x.pill[1]}">${esc(x.pill[0])}</span></div>${x.frac != null ? `<div class="lbar"><i style="--w:${Math.round(100 * Math.max(.04, Math.min(1, x.frac)))}%"></i></div>` : ""}<p>${esc(x.word)}</p></div>`).join("") || `<div class="lcard"><p>Nothing measured yet today.</p></div>`}
    ${(p.goals || []).filter(g => !g.met).length ? `<div class="label">Your goals</div>${p.goals.filter(g => !g.met).slice(0, 3).map(g => { const pr = goalProgress(pid, g); return `<div class="lcard"><b>${esc(g.text)}</b>${g.tid ? `<div class="lbar"><i style="--w:${Math.round(100 * Math.max(.04, pr.pct))}%"></i></div><p>${pr.pct >= .5 ? "More than halfway there" : pr.pct > 0 ? "On the way" : "Just getting started"} · by ${fmt(g.by)}</p>` : `<p>By ${fmt(g.by)}</p>`}</div>`; }).join("")}` : ""}
    <div class="label">This week we'll work on</div>
    <div class="lwork">${WORK[reg].map(([w, d]) => `<div class="lcard"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg><span>${esc(w)}</span></div>`).join("")}</div>
    <p class="note center">Your therapist will talk you through what this means for you.</p>
  </div>`;
};
let explainText = "";

/* ---------- Actions ---------- */
const SESS_ACT = {
  gGo: d => gMove(+d.i),
  gList: () => { tmStop(); draft.g = null; db.settings.formMode = "list"; save(); render(); toast("Showing all questions. Settings can switch back."); },
  gPaged: () => { draft.g = 0; db.settings.formMode = "guided"; save(); render(); },
  tmToggle: d => {
    if (TM) { const s = tmStop(true); hz("tap"); $("#tmbtn").textContent = "Start"; if (!s.down) { const sec = (performance.now() - s.t0) / 1000, f = gSteps(getTpl(draft))[draft.g].fs[0]; const val = sec.toFixed(f.step === 0.01 ? 2 : 1); setVal(f.id, null, val); const i = document.getElementById("i_" + f.id); if (i) i.value = val; $("#tmval").textContent = val; } return; }
    hz("tap"); TM = { t0: performance.now(), down: +d.down || 0, min: 0 }; $("#tmbtn").textContent = "Stop"; $("#tmring").classList.add("run"); $("#tmring").classList.remove("idle"); tmPaint();
  },
  tmReset: d => { tmStop(); $("#tmbtn").textContent = "Start"; $("#tmring").classList.remove("run", "over"); $("#tmring").classList.add("idle"); $("#tmring").style.setProperty("--p", "0"); $("#tmval").textContent = +d.down ? tmFmt(+d.down, true) : "0.0"; },
  planToggle: (d, b) => { const on = planDraft.on; on.has(d.t) ? on.delete(d.t) : on.add(d.t); hz("tick"); render(); },
  planAdd: () => { const have = new Set(planDraft.list); openSheet("Add a test", `<div class="sopts">${[GONIO, ...allTpl().map(t => t.id)].filter(t => !have.has(t)).map(t => `<button class="sopt" data-act="planPick" data-t="${t}">${esc(planName(t))}</button>`).join("")}</div>`); },
  planPick: d => { planDraft.list.push(d.t); planDraft.on.add(d.t); render(); },
  planStart: () => { const pid = planDraft.pid, plan = planDraft.list.filter(t => planDraft.on.has(t)); planDraft = null;
    db.session = { id: uid(), pid, date: today(), plan, done: {}, skip: [], created: Date.now() }; save(); hz("tap"); go("sess"); },
  sessStart: d => { const s = db.session; startForm(s.pid, d.t); if (draft && view.name === "form") { draft.sid = s.id; draft.g = 0; keepDraft(); render(); } },
  sessSkip: d => { db.session.skip.push(d.t); save(); go(sessNext() ? "sess" : "summary"); },
  sessHub: () => { tmStop(); go("sess"); },
  sessFinish: () => go("summary"),
  sessPdf: () => { const s = db.session; makePdf({ pid: s.pid, aids: Object.values(s.done).filter(A), title: "Session Report" }); },
  sessDone: () => { const pid = db.session.pid; db.session = null; save(); celebrate("Session saved"); go("patient", pid); pilotAsk(); },
  resumeSess: () => go(sessNext() ? "sess" : "summary"),
  explain: d => go("explain", d.pid),
  explainDone: () => { document.body.classList.remove("lightpage"); navNext = "back"; const s = db.session; s && P(s.pid)?.id === view.args[0] ? go("summary") : go("patient", view.args[0]); },
  explainShare: async () => { const text = explainText; try { if (navigator.share) { await navigator.share({ title: "Your progress", text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); toast("Copied. Paste it into WhatsApp or a message."); } catch (e) { toast("Sharing isn't available in this browser."); } },
  newSession: d => d.pid ? go("plan", d.pid) : db.patients.length ? go("pickPatient", "session") : go("editPatient", null, "session"),
};
