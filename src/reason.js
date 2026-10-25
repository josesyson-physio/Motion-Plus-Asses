/* ---------- Clinical reasoning, goals and "is this change real?" ----------
   Links findings across tests into possible contributing factors (never a diagnosis), suggests measurable goals
   from each test's minimal clinically important difference, tracks progress to those goals at every visit,
   and marks each change as meaningful, real or within measurement error. */

const ROM_MDC = 5; // degrees: a typical minimal detectable change for goniometry by the same tester
const latestOf = (pid, tid) => db.assessments.filter(a => a.pid === pid && a.tid === tid).sort(byDate).at(-1);
function latestResults(pid) {
  const p = P(pid), out = {};
  for (const a of db.assessments.filter(x => x.pid === pid).sort(byDate)) out[a.tid] = a;
  for (const k in out) { const a = out[k], t = getTpl(a); out[k] = { a, t, r: runScore(t, a.values, p) }; }
  return out;
}
const flagged = x => x && ["warn", "bad"].includes(x.r.band?.[1]);
function romRows(a) {
  const t = TPLMAP.rom, out = [];
  for (const f of t.fields) { const x = a.values[f.id]; if (!x || typeof x !== "object") continue;
    for (const s of ["L", "R"]) if (has(x[s])) out.push({ f, s, v: +x[s], pct: f.normal ? +x[s] / f.normal : null }); }
  return out;
}
const MMT_N = g => parseFloat(g) + (/\+$/.test(g) ? .3 : /-$/.test(g) ? -.3 : 0);
function mmtWeak(a, names) {
  const t = TPLMAP.mmt, out = [];
  t.fields.forEach(f => { if (!names.some(n => f.label.startsWith(n))) return; const x = a.values[f.id] || {};
    for (const s of ["L", "R"]) if (has(x[s]) && MMT_N(x[s]) < 4) out.push(`${f.label} ${s} ${x[s]}/5`); });
  return out;
}

/* Possible contributing factors: each needs evidence from at least two tests, and is worded as a possibility. */
function reasoning(pid) {
  const L = latestResults(pid), out = [], ev = x => `${x.t.short || x.t.name} ${x.r.txt} (${x.r.band[0].toLowerCase()})`;
  const rom = L.rom && romRows(L.rom.a), knee = rom?.filter(x => /^Knee flexion/.test(x.f.label) && x.pct < .8) || [];
  const func = ["lefs", "sts5", "gait", "tug"].map(k => L[k]).filter(flagged);
  if (knee.length && func.length) out.push({ area: "knee", h: "Reduced knee bend may be contributing to limits in daily activities", why: [...knee.map(x => `Knee flexion ${x.s} ${x.v}° (${Math.round(100 * x.pct)}% of normal)`), ...func.map(ev)] });
  const weak = L.mmt ? mmtWeak(L.mmt.a, ["Hip abductors", "Hip extensors", "Knee extensors", "Ankle dorsiflexors", "Ankle plantarflexors"]) : [];
  const bal = ["berg", "tinetti", "tug", "sts5", "sls", "freach"].map(k => L[k]).filter(flagged);
  if (weak.length && bal.length) out.push({ area: "balance", h: "Leg weakness may be contributing to the balance and mobility findings", why: [...weak.slice(0, 4), ...bal.map(ev)] });
  if (bal.length >= 2) out.push({ area: "balance", h: "Two or more balance and mobility tests point the same way, which may mean a higher fall risk", why: bal.map(ev) });
  const pain = L.pain && L.pain.r.val >= 5 ? L.pain : null, dis = ["lefs", "odi", "ndi", "qdash"].map(k => L[k]).filter(flagged);
  if (pain && dis.length) out.push({ area: "pain", h: "Pain may be limiting function", why: [ev(pain), ...dis.map(ev)] });
  const asym = []; if (rom) { const by = {}; rom.forEach(x => { (by[x.f.label] ||= {})[x.s] = x.v; }); for (const [k, v] of Object.entries(by)) if (v.L != null && v.R != null && Math.abs(v.L - v.R) >= 15) asym.push(`${k}: left ${v.L}°, right ${v.R}°`); }
  if (asym.length && (L.gait || L.posture)) out.push({ area: "asym", h: "A left-right difference in joint range may be contributing to the movement findings", why: [...asym.slice(0, 3), ...[L.gait, L.posture].filter(Boolean).map(ev)] });
  const post = L.posture && /: Treat/.test(L.posture.a.values.focus || "") ? L.posture : null, spine = ["ndi", "odi"].map(k => L[k]).filter(flagged);
  if (post && (spine.length || pain)) out.push({ area: "spine", h: "Posture findings may be contributing to neck or back symptoms", why: [String(L.posture.a.values.focus).split("\n").filter(x => /: Treat/.test(x)).slice(0, 2).join("; "), ...spine.map(ev), ...(pain ? [ev(pain)] : [])].filter(Boolean) });
  if (L.mwt6 && flagged(L.mwt6) && L.mwt6.r.lines.some(l => /desaturation/i.test(l))) out.push({ area: "heart", h: "Oxygen dropping during the walk may be limiting exercise capacity", why: [ev(L.mwt6), L.mwt6.r.lines.find(l => /desaturation/i.test(l))] });
  return out;
}

/* Goals: one MCID of improvement (or a known cut-off) over about six weeks, so each goal is specific, measurable and time-bound. */
const CUT = { tug: [13.5, "below the 13.5 s fall-risk cut-off"], berg: [45, "at or above the 45/56 cut-off"], sts5: [12, "within the expected range"], mwt10: [0.8, "community walking speed"] };
function goalIdeas(pid) {
  const L = latestResults(pid), have = new Set((P(pid).goals || []).filter(g => !g.met).map(g => g.tid + (g.f || "") + (g.s || ""))), out = [], by = new Date(Date.now() + 42 * 864e5).toISOString().slice(0, 10);
  for (const x of Object.values(L)) {
    const { t, r, a } = x;
    if (t.id === "rom") { romRows(a).filter(y => y.pct != null && y.pct < .8).slice(0, 3).forEach(y => { const tg = Math.min(y.f.normal, Math.round(y.v + 15)); if (!have.has("rom" + y.f.id + y.s)) out.push({ tid: "rom", f: y.f.id, s: y.s, base: y.v, target: tg, hb: true, unit: "°", by, text: `${y.f.label} ${y.s === "L" ? "left" : "right"} from ${y.v}° to ${tg}°` }); }); continue; }
    if (r.val == null || t.hb === undefined || !t.mcid || have.has(t.id)) continue;
    let tg = t.hb ? r.val + t.mcid : r.val - t.mcid, why = `one clinically meaningful change (${t.mcid})`;
    const c = CUT[t.id]; if (c && (t.hb ? r.val < c[0] : r.val > c[0])) { tg = t.hb ? Math.max(tg, c[0]) : Math.min(tg, c[0]); why = c[1]; }
    if (r.max != null) tg = Math.min(tg, r.max); tg = Math.max(0, Math.round(tg * 10) / 10);
    if (t.hb ? tg <= r.val : tg >= r.val) continue;
    const u = t.unit && !t.unit.startsWith("/") ? " " + t.unit : r.max ? `/${r.max}` : "";
    out.push({ tid: t.id, base: r.val, target: tg, hb: t.hb, unit: u, by, text: `${t.short} from ${r.val}${u} to ${tg}${u}`, why });
  }
  return out;
}
function goalNow(pid, g) {
  if (!g.tid) return null; const a = latestOf(pid, g.tid); if (!a || a.date < g.from) return null;
  if (g.tid === "rom") { const v = a.values[g.f]?.[g.s]; return has(v) ? { v: +v, a } : null; }
  const r = runScore(getTpl(a), a.values, P(pid)); return r.val == null ? null : { v: r.val, a };
}
function goalProgress(pid, g) {
  if (!g.tid) return { cur: null, pct: g.met ? 1 : 0, met: !!g.met, late: !g.met && g.by < today() };
  const n = goalNow(pid, g), cur = n ? n.v : g.base, span = g.target - g.base, pct = span ? Math.max(0, Math.min(1, (cur - g.base) / span)) : 1;
  return { cur, pct, met: g.hb ? cur >= g.target : cur <= g.target, late: !g.met && g.by < today() };
}
// Mark goals met after a save, with one celebration per goal.
function checkGoals(pid) {
  const p = P(pid); let hit = null;
  for (const g of p?.goals || []) { if (g.met || !g.tid) continue; const pr = goalProgress(pid, g); if (pr.met && goalNow(pid, g)) { g.met = today(); hit = g; } }
  if (hit) { save(); setTimeout(() => celebrate("Goal reached"), 350); }
}
function goalsHTML(pid, compact) {
  const gs = P(pid)?.goals || []; if (!gs.length) return compact ? "" : `<div class="empty">No goals yet. Suggested goals use each test's clinically meaningful change.</div>`;
  return gs.slice().sort((a, b) => (a.met ? 1 : 0) - (b.met ? 1 : 0)).map(g => { const pr = goalProgress(pid, g);
    return `<div class="goal ${g.met ? "met" : ""}" ${compact ? "" : `role="button" tabindex="0" data-act="goalEdit" data-pid="${pid}" data-id="${g.id}" aria-label="Edit goal: ${esc(g.text)}"`}><div class="lrow"><b>${esc(g.text)}</b>${g.met ? `<span class="chip good">Reached ${fmtShort(g.met)}</span>` : pr.late ? `<span class="chip warn">Due ${fmtShort(g.by)}</span>` : `<span class="chip neutral">By ${fmtShort(g.by)}</span>`}</div>
      ${g.tid ? `<div class="pbar"><i style="--w:${Math.round(100 * pr.pct)}%"></i></div><div class="psub">Now ${esc(pr.cur)}${esc(g.unit || "")} · target ${esc(g.target)}${esc(g.unit || "")} · ${Math.round(100 * pr.pct)}% of the way</div>` : `<div class="psub">${g.met ? "Marked as reached" : "Tracked by you · tap to update"}</div>`}${g.note ? `<div class="psub">${esc(g.note)}</div>` : ""}</div>`; }).join("");
}

/* "Is this change real?": compares the change with the test's MCID, the measurement method and the assessor. */
function changeBadge(t, c) {
  if (!c || c.d == null) return ""; if (c.d === 0) return `<span class="cb same">No change</span>`;
  if (!t.mcid) return "";
  if (Math.abs(c.d) >= t.mcid) return c.better ? `<span class="cb real">★ Meaningful change</span>` : c.better === false ? `<span class="cb worse">Meaningful decline</span>` : `<span class="cb real">Meaningful change</span>`;
  return `<span class="cb noise">Within measurement error</span>`;
}
function realityHTML(a) {
  const t = getTpl(a), p = P(a.pid), c = compare(t, a, p), r = runScore(t, a.values, p), prev = c?.prev, rows = [];
  if (c?.d != null && t.mcid) rows.push(Math.abs(c.d) >= t.mcid ? ["good", `The change of ${c.d > 0 ? "+" : ""}${c.d} is at least the ${t.mcid}-point minimal clinically important difference, so it is likely a real change the patient can feel.`] : ["neutral", `The change of ${c.d > 0 ? "+" : ""}${c.d} is smaller than the ${t.mcid}-point minimal clinically important difference. It may be measurement error; confirm at the next visit.`]);
  if (t.id === "rom" && prev) { const now = romRows(a), was = romRows(prev); now.forEach(x => { const y = was.find(w => w.f.id === x.f.id && w.s === x.s); if (y && x.v !== y.v) rows.push([Math.abs(x.v - y.v) >= ROM_MDC ? "good" : "neutral", `${x.f.label} ${x.s}: ${x.v - y.v > 0 ? "+" : ""}${x.v - y.v}° ${Math.abs(x.v - y.v) >= ROM_MDC ? "is beyond" : "is within"} the ${ROM_MDC}° goniometry error.`]); }); }
  if (r.of) rows.push(r.done < r.of ? ["warn", `${r.of - r.done} of ${r.of} items are not scored, so the total may read low.`] : ["good", "Every item is scored."]);
  if (a.values.gonio && prev?.values.gonio) { const m1 = new Map(a.values.gonio.split(";").map(x => x.split(":"))), m0 = new Map(prev.values.gonio.split(";").map(x => x.split(":")));
    const diff = [...m1].filter(([k, m]) => m0.has(k) && m0.get(k) !== m); rows.push(diff.length ? ["warn", `${diff.length} reading${diff.length > 1 ? "s use" : " uses"} a different method from last time (camera or tilt). Compare with care.`] : ["good", "Same measuring method as last time."]); }
  if (prev && a.by && prev.by) rows.push(a.by === prev.by ? ["good", "Same assessor as last time."] : ["warn", `Assessed by ${a.by}; last time by ${prev.by}. Results between testers vary more.`]);
  if (!rows.length) return "";
  return `<section class="card reality"><div class="lrow"><b>Is this change real?</b>${changeBadge(t, c)}</div>${rows.map(([k, s]) => `<div class="rrow ${k}"><i aria-hidden="true">${k === "good" ? "✓" : k === "warn" ? "!" : "~"}</i><span>${esc(s)}</span></div>`).join("")}</section>`;
}
function reasonHTML(pid) {
  const rs = reasoning(pid); if (!rs.length) return "";
  return `<h2 class="sec">Possible contributing factors</h2>${rs.map(x => `<details class="card why"><summary><b>${esc(x.h)}</b><span class="chev" aria-hidden="true">›</span></summary><ul>${x.why.map(w => `<li>${esc(w)}</li>`).join("")}</ul></details>`).join("")}
    <p class="note">Linked from this patient's latest results to support your reasoning. They are possibilities to check, not a diagnosis.</p>`;
}

/* Photo and video consent: asked once per patient before any camera tool, and recorded with the date. */
function needConsent(pid, go_) {
  const p = P(pid); if (!p || p.consent?.media) return false;
  consentNext = go_;
  openSheet("Photo and video consent", `<p class="note" style="font-size:14px">Before using the camera, ask the patient (or their carer) for consent:</p>
    <div class="tip">"I'd like to take photos or a short video of you moving. The phone measures your posture and joints, then the photos are deleted. Only the measurements are kept in your record. Is that okay?"</div>
    <button class="primary" data-act="consentYes" data-pid="${pid}">Patient agrees</button><button data-act="consentNo">Not now</button>`);
  return true;
}

const REASON_ACT = {
  goalSuggest: d => { const ideas = goalIdeas(d.pid); goalCache = ideas;
    openSheet("Suggested goals", `${ideas.length ? `<p class="note">About six weeks each, based on the latest results. Tap one to adjust it before adding.</p><div class="sopts">${ideas.map((g, i) => `<button class="sopt goalopt" data-act="goalAdd" data-pid="${d.pid}" data-i="${i}"><b>${esc(g.text)}</b><small>${esc(g.why || "Toward the normal range")} · by ${fmtShort(g.by)}</small></button>`).join("")}</div>` : `<p class="note">No goals to suggest yet. Goals come from scored tests that have a clinically meaningful change, and from limited joint range.</p>`}<button data-act="goalNew" data-pid="${d.pid}">Write my own goal</button>`); },
  goalAdd: d => { const g = goalCache[+d.i]; if (!g) return; goalDraft = { ...g, id: null, from: today() }; go("goal", d.pid); },
  goalNew: d => { goalDraft = { id: null, tid: "", text: "", base: "", target: "", unit: "", hb: true, by: new Date(Date.now() + 42 * 864e5).toISOString().slice(0, 10), from: today(), note: "" }; go("goal", d.pid); },
  goalEdit: d => { const g = P(d.pid)?.goals?.find(x => x.id === d.id); if (!g) return; goalDraft = JSON.parse(JSON.stringify(g)); go("goal", d.pid); },
  goalMeasure: d => { goalSync(); const m = goalMeasures(view.args[0]).find(x => x.key === d.k); Object.assign(goalDraft, m ? { tid: m.tid, f: m.f, s: m.s, unit: m.unit, hb: m.hb, base: m.cur } : { tid: "", f: undefined, s: undefined, unit: "" });
    if (m && (!goalDraft.text || goalDraft.auto)) { goalDraft.text = m.label; goalDraft.auto = 1; } render(); },
  goalSave: () => { goalSync(); const pid = view.args[0], p = P(pid), g = goalDraft;
    if (!g.text.trim()) { toast("Write what the goal is."); $("#gtext")?.focus(); return; }
    if (g.tid && (!isFinite(parseFloat(g.base)) || !isFinite(parseFloat(g.target)))) { toast("Enter a starting value and a target."); return; }
    if (g.tid) { g.base = +g.base; g.target = +g.target; if (g.target !== g.base) g.hb = g.target > g.base; } else { delete g.base; delete g.target; }
    delete g.auto; const isNew = !g.id; if (isNew) { g.id = uid(); g.created = Date.now(); (p.goals ||= []).push(g); } else p.goals[p.goals.findIndex(x => x.id === g.id)] = g;
    if (g.tid && !g.met) { const pr = goalProgress(pid, g); if (pr.met && goalNow(pid, g)) g.met = today(); }
    save(); goalDraft = null; navNext = "back"; go("patient", pid); toast(isNew ? "Goal added" : "Goal saved"); },
  goalMet: () => { goalSync(); goalDraft.met = goalDraft.met ? undefined : today(); if (goalDraft.met) hz("success"); render(); },
  goalDel: () => { const pid = view.args[0], p = P(pid), old = p.goals.slice(); p.goals = p.goals.filter(g => g.id !== goalDraft.id); save(); goalDraft = null; navNext = "back"; go("patient", pid); undoable("Goal removed", () => { p.goals = old; }); },
  consentYes: d => { const p = P(d.pid); p.consent = { ...(p.consent || {}), media: today() }; save(); hz("tap"); const n = consentNext; consentNext = null; n?.(); },
  consentNo: () => { consentNext = null; },
  assessor: () => { const team = (db.settings.team || "").split(/\n|,/).map(x => x.trim()).filter(Boolean);
    openSheet("Who is assessing?", `<div class="sopts">${team.map(n => `<button class="sopt" data-act="setAssessor" data-v="${esc(n)}" aria-pressed="${n === db.settings.therapist}">${esc(n)}</button>`).join("") || `<p class="note">Add your therapists' names in Settings, under Clinic.</p>`}</div><button data-act="tab" data-tab="settings">Edit the team in Settings</button>`); },
  setAssessor: d => { db.settings.therapist = d.v; save(); toast(`Assessor: ${d.v}`); render(); },
};
let goalCache = [], consentNext = null, goalDraft = null;

/* The goal editor: wording, the linked measure (or none, for a goal you track yourself), start, target, due date and notes. */
function goalMeasures(pid) {
  const out = [];
  for (const { t, r, a } of Object.values(latestResults(pid))) {
    if (t.id === "rom") { romRows(a).forEach(y => out.push({ key: `rom|${y.f.id}|${y.s}`, tid: "rom", f: y.f.id, s: y.s, label: `${y.f.label} ${y.s === "L" ? "left" : "right"}`, cur: y.v, unit: "°", hb: true })); continue; }
    if (r.val == null) continue;
    out.push({ key: t.id, tid: t.id, label: t.name.replace(/\s*\(.*\)/, ""), cur: r.val, unit: t.unit && !t.unit.startsWith("/") ? " " + t.unit : r.max ? `/${r.max}` : "", hb: t.hb !== false });
  }
  return out;
}
function goalSync() {
  const g = goalDraft, v = id => document.getElementById(id)?.value; if (!g || !$("#gtext")) return;
  if (v("gtext") !== g.text) { g.text = v("gtext"); delete g.auto; }
  g.note = v("gnote") ?? g.note; g.by = v("gby") || g.by; if ($("#gbase")) { g.base = v("gbase"); g.target = v("gtarget"); }
}
VIEWS.goal = pid => {
  const p = P(pid), g = goalDraft; if (!p || !g) return go("patient", pid);
  const ms = goalMeasures(pid), key = g.tid ? (g.tid === "rom" ? `rom|${g.f}|${g.s}` : g.tid) : "", cur = ms.find(m => m.key === key);
  chrome(null, `${g.id ? `<button data-act="goalDel">Delete</button>` : ""}<button class="primary wide" data-act="goalSave">${g.id ? "Save goal" : "Add goal"}</button>`);
  $("#app").innerHTML = `
  <header>${back("patient", `data-id="${pid}"`)}<div class="grow"><div class="psub">${esc(p.code)}</div><h1>${g.id ? "Edit goal" : "New goal"}</h1></div></header>
  <div class="stack">
    <div class="field"><label class="label" for="gtext">Goal</label><textarea id="gtext" rows="2" placeholder="e.g. Climb one flight of stairs with one rail, without stopping">${esc(g.text)}</textarea></div>
    <div class="field"><span class="label" id="gml">Measured by</span>
      <div class="chips" role="group" aria-labelledby="gml"><button class="fchip" data-act="goalMeasure" data-k="" aria-pressed="${!key}">No test (I'll mark it)</button>${ms.map(m => `<button class="fchip" data-act="goalMeasure" data-k="${esc(m.key)}" aria-pressed="${m.key === key}">${esc(m.label)}</button>`).join("")}</div></div>
    ${g.tid ? `<div class="row2"><div class="field"><label class="label" for="gbase">Starting value${g.unit ? ` (${esc(g.unit.trim())})` : ""}</label><input id="gbase" type="number" inputmode="decimal" step="any" value="${esc(g.base)}"></div>
      <div class="field"><label class="label" for="gtarget">Target${g.unit ? ` (${esc(g.unit.trim())})` : ""}</label><input id="gtarget" type="number" inputmode="decimal" step="any" value="${esc(g.target)}"></div></div>
      ${cur ? `<p class="note">Latest result: ${esc(cur.cur)}${esc(cur.unit)}. Progress updates by itself each time this test is saved.</p>` : ""}` : `<p class="note">Without a linked test, you mark the goal as reached yourself.</p>`}
    <div class="field"><label class="label" for="gby">Reach by</label><input id="gby" type="date" value="${esc(g.by)}" min="${esc(g.from || today())}"></div>
    <div class="field"><label class="label" for="gnote">Notes (optional)</label><input id="gnote" value="${esc(g.note || "")}" placeholder="e.g. Agreed with the patient for return to work"></div>
    ${g.id || !g.tid ? `<button class="${g.met ? "" : "primary-soft"}" data-act="goalMet">${g.met ? `Reached ${fmtShort(g.met)} · tap to reopen` : "Mark as reached"}</button>` : ""}
  </div>`;
};
document.addEventListener("keydown", e => { const b = e.target.closest?.('[role="button"][data-act]'); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); b.click(); } });
// Show when the phone is offline: everything still saves on the device.
addEventListener("online", () => view.name === "today" && render()); addEventListener("offline", () => view.name === "today" && render());
