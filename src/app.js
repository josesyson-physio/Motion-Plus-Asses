/* ---------- Storage ---------- */
const STORE = "mpa-v2";
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const vals = (arr, o = 0) => Object.fromEntries(arr.map((x, i) => ["f" + (i + o), x]));

function seed() {
  const P = (code, age, sex, dx, ref) => ({ id: uid(), code, age, sex, dx, ref, branch: "Main branch", notes: "", ex: true, created: Date.now() });
  const p1 = P("MP-0001", 68, "F", "Left CVA with right hemiparesis, 4 months post-stroke", "Neurologist"),
        p2 = P("MP-0002", 34, "M", "Right ACL reconstruction, 6 weeks post-op", "Orthopaedic surgeon"),
        p3 = P("MP-0003", 6, "M", "Autism spectrum condition, sensory processing concerns", "Paediatrician"),
        p4 = P("MP-0004", 74, "M", "Oropharyngeal dysphagia after brainstem stroke", "Stroke unit");
  const A = (p, tid, date, values, notes = "") => ({ id: uid(), pid: p.id, tid, date, values, notes, created: Date.now() });
  return {
    settings: { clinic: "", branch: "Main branch", therapist: "", logo: null, logoAR: 1, prefix: "MP", next: 5 },
    patients: [p1, p2, p3, p4],
    assessments: [
      A(p1, "berg", daysAgo(66), vals([2, 2, 3, 2, 2, 2, 1, 2, 1, 2, 1, 1, 1, 0]), "Needs close supervision for all standing tasks. Fearful of falling."),
      A(p1, "tug", daysAgo(66), { time: "24.6", aid: "Quad cane", obs: ["Reduced step length", "Loss of balance on turning", "Needs supervision"] }),
      A(p1, "berg", daysAgo(38), vals([3, 3, 4, 3, 3, 3, 2, 2, 2, 3, 2, 2, 1, 1])),
      A(p1, "berg", daysAgo(10), vals([3, 4, 4, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 1]), "Improved confidence. Still uses quad cane outdoors."),
      A(p1, "tug", daysAgo(10), { time: "17.2", aid: "Single-point cane", obs: ["Reduced step length"] }),
      A(p1, "mmt", daysAgo(10), { f1: { L: "5", R: "3" }, f4: { L: "5", R: "3+" }, f9: { L: "5", R: "3" }, f12: { L: "5", R: "4-" }, f14: { L: "5", R: "2+" } }),
      A(p2, "lefs", daysAgo(28), vals([2, 0, 2, 3, 2, 1, 2, 3, 1, 2, 2, 1, 1, 2, 3, 0, 0, 0, 0, 3], 1), "Quadriceps lag 5°. Mild effusion."),
      A(p2, "pain", daysAgo(28), { now: 5, worst: 7, best: 2, loc: "Anterior right knee", pat: ["Intermittent", "Worse at end of day"], qual: ["Aching"] }),
      A(p2, "lefs", daysAgo(3), vals([3, 1, 3, 4, 3, 2, 3, 4, 2, 3, 3, 2, 2, 3, 4, 1, 0, 0, 0, 4], 1), "Effusion resolved. Started closed-chain strengthening."),
      A(p2, "pain", daysAgo(3), { now: 2, worst: 4, best: 0, loc: "Anterior right knee", pat: ["Intermittent"], qual: ["Aching"] }),
      A(p2, "rom", daysAgo(3), { f19: { L: "140", R: "118" }, f20: { L: "0", R: "-3" }, f21: { L: "20", R: "15" } }),
      A(p3, "sensproc", daysAgo(12), { s0: "Over-responsive (avoids)", e0: "Removes clothing labels, avoids messy play", s1: "Over-responsive (avoids)", e1: "Covers ears at hand dryers and school bell", s2: "Typical", s3: "Sensory seeking", e3: "Constant spinning and jumping", s4: "Sensory seeking", e4: "Crashes into furniture", s5: "Over-responsive (avoids)", e5: "Eats 6 foods, gags on mixed textures", s6: "Typical", s7: "Under-responsive (misses)", e7: "Does not notice when needing the toilet", reg: ["Difficulty with transitions", "Meltdowns with sensory overload", "Self-calms with support"] }, "Parent reports morning routine takes 90 minutes."),
      A(p4, "fois", daysAgo(30), { f0: 3, diet: "PEG feeds plus IDDSI level 4 trials with SLT" }),
      A(p4, "eat10", daysAgo(30), vals([4, 4, 3, 4, 4, 1, 4, 3, 4, 3])),
      A(p4, "fois", daysAgo(4), { f0: 5, diet: "IDDSI level 5 minced and moist, level 2 mildly thick fluids" }),
      A(p4, "eat10", daysAgo(4), vals([2, 3, 2, 2, 3, 0, 2, 2, 2, 2]), "Chin tuck strategy used consistently."),
    ],
    templates: [], reports: [],
  };
}
function load() { try { const d = JSON.parse(localStorage.getItem(STORE)); if (d && d.patients) return d; } catch (e) {} return seed(); }
let db = load();
function save() { try { localStorage.setItem(STORE, JSON.stringify(db)); return true; } catch (e) { toast("This device's storage is full. Save a backup, then delete old records."); return false; } }

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = d => new Date(d + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const fmtShort = d => new Date(d + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
const byDate = (a, b) => a.date.localeCompare(b.date) || (a.created || 0) - (b.created || 0);
const P = id => db.patients.find(p => p.id === id);
const A = id => db.assessments.find(a => a.id === id);
function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2600); }

const hydCache = new Map();
function hydrate(raw) { if (!raw) return null; const k = raw.id + ":" + (raw.v || 0); if (!hydCache.has(k)) hydCache.set(k, T(JSON.parse(JSON.stringify(raw)))); return hydCache.get(k); }
function getTpl(a) { return a.tpl ? hydrate(a.tpl) : TPLMAP[a.tid] || hydrate(db.templates.find(t => t.id === a.tid)); }
function allTpl() { return [...TPL, ...db.templates.map(hydrate)]; }

function scoreCustom(t, v) {
  const s = tally(t, v); if (!s.n) return { val: null, txt: "Recorded", band: ["Recorded", "neutral"] };
  let band = null; const bs = (t.bands || []).slice().sort((a, b) => a.min - b.min);
  const i = bs.findIndex(b => s.sum >= b.min && s.sum <= b.max);
  if (i >= 0) { const pos = bs.length === 1 ? -1 : i / (bs.length - 1), good = t.hb === false ? 1 - pos : pos; band = [bs[i].label, pos < 0 ? "neutral" : good > 0.66 ? "good" : good > 0.33 ? "warn" : "bad"]; }
  return { val: s.sum, max: s.max, txt: `${s.sum}/${s.max}`, band: band || ["Scored", "neutral"] };
}
function runScore(t, v, p) {
  let r; try { r = t.score ? t.score(v || {}, p || {}, t) : scoreCustom(t, v || {}); } catch (e) { r = { val: null, txt: "—" }; }
  const s = tally(t, v || {}); r.done = s.ans; r.of = s.n; r.band = r.band || ["Recorded", "neutral"]; r.lines = r.lines || []; return r;
}
function fmtVal(f, x) {
  if (!has(x) || (typeof x === "object" && !Array.isArray(x) && !has(x.L) && !has(x.R)) || (Array.isArray(x) && !x.length)) return "–";
  if (f.t === "scale") { const o = f.o.find(o => o.v == x); return o && o.l.length > 3 && o.l !== String(o.v) ? `${x} · ${o.l}` : String(x); }
  if (f.t === "lrnum") return `L ${x.L ?? "–"}${has(x.L) ? f.unit : ""} · R ${x.R ?? "–"}${has(x.R) ? f.unit : ""}`;
  if (f.t === "lrsel") return `L ${x.L ?? "–"} · R ${x.R ?? "–"}`;
  if (f.t === "check") return x.join(", ");
  if (f.t === "num") return `${x}${f.unit && !f.unit.startsWith("/") ? " " + f.unit : f.unit || ""}`;
  return String(x);
}
function compare(t, a, p) {
  const prev = db.assessments.filter(x => x.pid === a.pid && x.tid === a.tid && x.id !== a.id && byDate(x, a) < 0).sort(byDate).at(-1);
  if (!prev) return null;
  const r = runScore(t, a.values, p), q = runScore(t, prev.values, p);
  if (r.val == null || q.val == null) return { prev };
  const d = Math.round((r.val - q.val) * 100) / 100, better = t.hb === undefined ? null : (t.hb ? d > 0 : d < 0);
  return { prev, d, better, meaningful: t.mcid ? Math.abs(d) >= t.mcid : null };
}
function series(pid, tid) { const p = P(pid); return db.assessments.filter(a => a.pid === pid && a.tid === tid).sort(byDate).map(a => ({ date: a.date, val: runScore(getTpl(a), a.values, p).val })).filter(x => x.val != null); }
function chip(b) { return `<span class="chip ${b[1]}">${esc(b[0])}</span>`; }
function nextCode() { const s = db.settings; let c; do { c = `${s.prefix || "MP"}-${String(s.next++).padStart(4, "0")}`; } while (db.patients.some(p => p.code === c)); return c; }

/* ---------- Claude capabilities ---------- */
let AI = null, DL = null, AI_IMG = null;
if (window.claude?.use) {
  claude.use("sample").then(s => { AI = s; if (s) s.limits().then(l => { AI_IMG = l.images || null; if (view.name === "builder") render(); }).catch(() => {}); if (view.name) render(); });
  claude.use("downloads").then(d => { DL = d; });
}
const AI_ERR = { not_granted: "AI is turned off for this app on your account. You can still write the report yourself.", sampling_disabled: "AI isn't available for this account.", rate_limited: "Claude is busy or your usage limit is reached. Try again in a few minutes.", session_expired: "Sign in to Claude again, then try again.", refused: "Claude couldn't write this. Check the notes for unusual content and try again.", image_rejected: "That photo couldn't be read. Try a clearer JPG or PNG.", images_unavailable: "Photos can't be sent from this view. Paste the form's text instead.", invalid_json: "The template came back in the wrong shape. Try again." };
const aiMsg = e => AI_ERR[e?.code] || "It stopped before finishing. Try again.";
async function saveFile(filename, data) {
  if (!DL) { toast("Saving files isn't available in this view. Open the app in Claude."); return false; }
  try { await DL.save({ filename, data }); toast("Saved " + filename); return true; }
  catch (e) { if (e.code !== "declined") toast(e.code === "rate_limited" ? "A save is already waiting for you." : "The file couldn't be saved here."); return false; }
}

/* ---------- Chrome ---------- */
let view = {};
function go(name, ...args) { view = { name, args }; render(); window.scrollTo(0, 0); }
function render() { (VIEWS[view.name] || VIEWS.patients)(...(view.args || [])); }
function chrome(tab, barHtml) {
  $("#tabs").hidden = !tab; $("#bar").hidden = !barHtml; $("#barIn").innerHTML = barHtml || "";
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false"));
  document.body.classList.toggle("has-bar", !!barHtml); document.body.classList.toggle("has-tabs", !!tab);
}
const back = (act, extra = "") => `<button class="back" data-act="${act}" ${extra} aria-label="Back">‹</button>`;
const brand = () => `<div class="brand">MOTIONPLUS PHYSIO${db.settings.clinic ? " · " + esc(db.settings.clinic).toUpperCase() : ""}</div>`;
const topHead = (title, right = "") => `<header><img class="mark" src="${MP_LOGO}" alt="MotionPlus Physio"><div class="grow">${brand()}<h1>${title}</h1></div>${right}</header>`;
const IC = { user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c.6-3.6 3.2-5.5 6.5-5.5 1.6 0 3 .4 4.1 1.2M18 14v6M15 17h6"/></svg>', clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5V2.5h6v1M8.5 9h7M8.5 12.5h7M8.5 16h4"/></svg>', cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>' };

/* ---------- Views ---------- */
const VIEWS = {};
let q = "", libQ = "", libDisc = "All";

VIEWS.patients = () => {
  chrome("patients");
  $("#app").innerHTML = `
  ${topHead("Home")}
  <div class="stack">
    <section class="hero"><div><div class="label">${esc(db.settings.branch || "MotionPlus Assess")}</div><h2>Assess. Track. <em>Report.</em></h2><p class="note">${db.settings.therapist ? `Signed in as ${esc(db.settings.therapist)}` : "Digital rehab assessments for every discipline."}</p></div><img src="${MP_LOGO}" alt=""></section>
    <div class="stats"><div class="stat"><b>${db.patients.length}</b><span>Patients</span></div><div class="stat"><b>${db.assessments.filter(a => a.date >= daysAgo(30)).length}</b><span>Tests, 30 days</span></div><div class="stat"><b>${db.reports.length}</b><span>AI reports</span></div></div>
    <div class="quick"><button class="primary" data-act="newPatient">${IC.user}New patient</button><button data-act="tab" data-tab="library">${IC.clip}Start a test</button><button data-act="builder" data-pid="">${IC.cam}Form from photo</button></div>
    <h2 class="sec">Patients</h2>
    <input id="q" type="search" placeholder="Search by code or diagnosis" value="${esc(q)}" aria-label="Search patients">
    <div class="stack" id="plist"></div>
  </div>`;
  listPatients();
};
function listPatients() {
  const ql = q.toLowerCase();
  const ps = db.patients.filter(p => (p.code + " " + p.dx).toLowerCase().includes(ql));
  $("#plist").innerHTML = ps.map(p => {
    const last = db.assessments.filter(a => a.pid === p.id).sort(byDate).at(-1);
    const r = last && runScore(getTpl(last), last.values, p);
    return `<button class="patient" data-act="patient" data-id="${p.id}"><span class="avatar">${esc(p.code.split("-").pop())}</span>
      <span class="pmeta"><span class="pname">${esc(p.code)}${p.ex ? ' <span class="tag">Example</span>' : ""}</span><span class="psub">${esc(p.age)} · ${esc(p.sex)} · ${esc(p.dx)}</span>
      ${last ? `<span class="psub">Last: ${esc(getTpl(last)?.short || "")} ${esc(r.txt)} · ${fmtShort(last.date)}</span>` : ""}</span>
      ${r ? chip(r.band) : chip(["New", "neutral"])}</button>`;
  }).join("") || `<div class="empty">${db.patients.length ? "No patients match that search." : "No patients yet. Tap New patient to add the first one."}</div>`;
}

VIEWS.editPatient = (id, thenTid) => {
  const p = id ? P(id) : { code: nextCodePreview(), age: "", sex: "F", dx: "", ref: "", branch: db.settings.branch || "", notes: "" };
  chrome(null, `<button class="primary wide" data-act="savePatient" data-id="${id || ""}" data-then="${thenTid || ""}">${id ? "Save changes" : "Add patient"}</button>`);
  $("#app").innerHTML = `
  <header>${back(id ? "patient" : "tab", id ? `data-id="${id}"` : 'data-tab="patients"')}<h1>${id ? "Edit patient" : "New patient"}</h1></header>
  <form class="stack" id="pform" onsubmit="return false">
    <p class="note">Patients are identified by code only. Don't enter names or contact details.</p>
    <div class="field"><label class="label" for="pcode">Patient code</label><input id="pcode" value="${esc(p.code)}" autocomplete="off"></div>
    <div class="row2"><div class="field"><label class="label" for="page">Age (years)</label><input id="page" type="number" inputmode="decimal" min="0" max="120" value="${esc(p.age)}"></div>
      <div class="field"><label class="label" for="psex">Sex</label><select id="psex">${["F", "M", "Other"].map(s => `<option ${p.sex === s ? "selected" : ""}>${s}</option>`).join("")}</select></div></div>
    <div class="field"><label class="label" for="pdx">Diagnosis or reason for referral</label><input id="pdx" value="${esc(p.dx)}" placeholder="e.g. Right TKR, post-op week 2"></div>
    <div class="row2"><div class="field"><label class="label" for="pref">Referred by</label><input id="pref" value="${esc(p.ref)}"></div>
      <div class="field"><label class="label" for="pbr">Branch</label><input id="pbr" value="${esc(p.branch)}"></div></div>
    <div class="field"><label class="label" for="pnotes">Background notes</label><textarea id="pnotes" rows="3" placeholder="Relevant history, precautions, goals">${esc(p.notes)}</textarea></div>
  </form>`;
};
function nextCodePreview() { const s = db.settings; let n = s.next, c; do { c = `${s.prefix || "MP"}-${String(n++).padStart(4, "0")}`; } while (db.patients.some(p => p.code === c)); return c; }

VIEWS.patient = id => {
  const p = P(id); if (!p) return go("patients");
  const as = db.assessments.filter(a => a.pid === id).sort(byDate).reverse();
  const reps = db.reports.filter(r => r.pid === id).sort((a, b) => b.date.localeCompare(a.date));
  const tids = [...new Set(as.map(a => a.tid))];
  const charts = tids.map(tid => { const s = series(id, tid); if (s.length < 2) return ""; const t = getTpl(as.find(a => a.tid === tid)), d = Math.round((s.at(-1).val - s[0].val) * 100) / 100;
    const better = t.hb === undefined ? null : t.hb ? d > 0 : d < 0;
    return `<div class="chart"><div class="chead"><b>${esc(t.name)}</b><span class="chip ${better === null || d === 0 ? "neutral" : better ? "good" : "bad"}">${d > 0 ? "+" : ""}${d}${t.unit ? " " + esc(t.unit) : ""} since ${fmtShort(s[0].date)}</span></div>${chartSVG(s, t)}</div>`; }).join("");
  chrome(null, `<button class="primary wide" data-act="library" data-pid="${id}">+ New assessment</button>`);
  $("#app").innerHTML = `
  <header>${back("tab", 'data-tab="patients"')}<h1>${esc(p.code)}</h1><button class="ghost" data-act="editPatient" data-id="${id}">Edit</button></header>
  <div class="stack">
    <div class="psub">${esc(p.age)} yrs · ${esc(p.sex)} · ${esc(p.dx)}${p.ref ? ` · Referred by ${esc(p.ref)}` : ""}${p.branch ? ` · ${esc(p.branch)}` : ""}</div>
    ${p.notes ? `<p class="note">${esc(p.notes)}</p>` : ""}
    <div class="actions">
      <button data-act="aiProgress" data-id="${id}" ${as.length ? "" : "disabled"}>✦ AI progress report</button>
      <button data-act="pdfPatient" data-id="${id}" ${as.length ? "" : "disabled"}>PDF summary</button>
      <button data-act="transfer" data-id="${id}">Transfer</button>
    </div>
    ${charts ? `<h2 class="sec">Progress</h2>${charts}` : ""}
    <h2 class="sec">Assessments</h2>
    <div>${as.map(a => { const t = getTpl(a), r = runScore(t, a.values, p); return `<button class="hist" data-act="result" data-id="${a.id}">
      <span class="grow"><b>${esc(t?.name || "Assessment")}</b><span class="psub">${fmt(a.date)} · ${esc(r.txt)}</span></span>${chip(r.band)}</button>`; }).join("") || `<div class="empty">No assessments yet. Tap New assessment to start one.</div>`}</div>
    ${reps.length ? `<h2 class="sec">Reports</h2><div>${reps.map(r => `<button class="hist" data-act="report" data-id="${r.id}"><span class="grow"><b>${r.kind === "progress" ? "Progress report" : "Assessment report"}</b><span class="psub">${fmt(r.date)} · ${r.aids.length} assessment${r.aids.length > 1 ? "s" : ""}${r.edited ? " · edited" : ""}</span></span><span class="chip neutral">AI draft</span></button>`).join("")}</div>` : ""}
    <div class="danger"><button class="link-danger" data-act="delPatient" data-id="${id}">Delete patient and all records</button></div>
  </div>`;
};

function chartSVG(s, t) {
  const W = 320, H = 150, L = 34, R = 14, Tp = 14, B = 26, vs = s.map(x => x.val);
  let hi = t.max ?? Math.max(...vs) * 1.15, lo = t.max != null ? (t.id === "gcs" ? 3 : 0) : Math.min(0, Math.min(...vs));
  if (hi === lo) hi = lo + 1;
  const x = i => L + (s.length === 1 ? 0 : i * (W - L - R) / (s.length - 1)), y = v => Tp + (hi - v) * (H - Tp - B) / (hi - lo);
  const nice = v => Math.round(v * 10) / 10;
  const grid = [lo, (lo + hi) / 2, hi].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${nice(v)}</text>`).join("");
  const pts = s.map((p, i) => [x(i), y(p.val), p]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = line + ` L${pts.at(-1)[0]},${y(lo)} L${pts[0][0]},${y(lo)} Z`;
  const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 5 : 3.5}" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>${i === 0 || i === pts.length - 1 || s.length <= 5 ? `<text x="${p[0]}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}" class="ax">${fmtShort(p[2].date)}</text>` : ""}`).join("");
  const last = pts.at(-1);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t.name)} over time">${grid}<path d="${area}" fill="var(--accent)" opacity=".1"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${dots}<text x="${last[0] - 9}" y="${last[1] - 9}" text-anchor="end" class="ax strong">${nice(last[2].val)}</text></svg>`;
}

VIEWS.library = pid => {
  const p = pid && P(pid);
  chrome(pid ? null : "library");
  const tpls = allTpl();
  $("#app").innerHTML = `
  ${pid ? `<header>${back("patient", `data-id="${pid}"`)}<h1>Choose assessment</h1></header>` : topHead("Assessments")}
  <div class="stack">
    ${p ? `<div class="psub">For ${esc(p.code)}</div>` : ""}
    <input id="libq" type="search" placeholder="Search ${tpls.length} assessments" value="${esc(libQ)}" aria-label="Search assessments">
    <div class="chips" role="group" aria-label="Filter by discipline">${["All", ...DISCS, "Custom"].map(d => `<button class="fchip" data-act="disc" data-d="${d}" aria-pressed="${libDisc === d}">${d === "All" ? "All" : esc(DISC_NAME[d] || d)}</button>`).join("")}</div>
    <button class="maker" data-act="builder" data-pid="${pid || ""}"><b>+ Create a template</b><span>Build your own form, or make one from a photo of a paper form</span></button>
    <div id="tlist"></div>
  </div>`;
  listTemplates(pid);
};
function listTemplates(pid) {
  const ql = libQ.toLowerCase();
  const list = allTpl().filter(t => (libDisc === "All" || (libDisc === "Custom" ? t.custom : t.disc.includes(libDisc))) && (t.name + t.short + t.cat + t.desc).toLowerCase().includes(ql));
  $("#tlist").innerHTML = list.map(t => `<div class="tool"><button class="tool-main" data-act="startForm" data-tid="${t.id}" data-pid="${pid || ""}">
      <span class="tname">${esc(t.name)}</span><span class="psub">${esc(t.desc)}</span>
      <span class="tags">${(t.custom ? ["Custom"] : []).concat(t.disc).map(d => `<span class="tag">${esc(d)}</span>`).join("")}<span class="tag soft">${esc(t.cat)}</span></span></button>
      ${t.custom ? `<button class="ghost" data-act="builder" data-tid="${t.id}" data-pid="${pid || ""}" aria-label="Edit ${esc(t.name)}">Edit</button>` : ""}</div>`).join("") || `<div class="empty">No assessments match. Try another word, or create your own template.</div>`;
}

VIEWS.pickPatient = tid => {
  const t = allTpl().find(x => x.id === tid);
  chrome(null, `<button class="primary wide" data-act="newPatient" data-then="${tid}">+ New patient</button>`);
  $("#app").innerHTML = `<header>${back("tab", 'data-tab="library"')}<h1>Which patient?</h1></header>
  <div class="stack"><div class="psub">Starting ${esc(t.name)}</div>
  ${db.patients.map(p => `<button class="patient" data-act="startForm" data-tid="${tid}" data-pid="${p.id}"><span class="avatar">${esc(p.code.split("-").pop())}</span><span class="pmeta"><span class="pname">${esc(p.code)}</span><span class="psub">${esc(p.age)} · ${esc(p.sex)} · ${esc(p.dx)}</span></span></button>`).join("") || `<div class="empty">No patients yet. Add one to start.</div>`}</div>`;
};

/* ---------- Assessment form ---------- */
let draft = null;
function startForm(pid, tid, aid) {
  if (aid) { const a = A(aid); draft = JSON.parse(JSON.stringify(a)); }
  else { const t = allTpl().find(x => x.id === tid); draft = { id: uid(), pid, tid, date: today(), values: {}, notes: "", created: Date.now() };
    if (t.custom) draft.tpl = db.templates.find(x => x.id === tid);
    t.fields.forEach(f => { if (f.def != null) draft.values[f.id] = String(f.def); }); }
  go("form");
}
VIEWS.form = () => {
  const t = getTpl(draft), p = P(draft.pid);
  chrome(null, `<div class="score" id="live"></div><button class="primary" data-act="saveA">Save</button>`);
  $("#app").innerHTML = `
  <header>${back(draft.created && A(draft.id) ? "result" : "library", A(draft.id) ? `data-id="${draft.id}"` : `data-pid="${draft.pid}"`)}<h1>${esc(t.name)}</h1></header>
  <div class="stack">
    <div class="psub">${esc(p.code)} · ${esc(p.age)} yrs · ${esc(p.sex)}</div>
    ${t.lic ? `<p class="note lic">${esc(t.lic)}</p>` : ""}
    <div class="field"><label class="label" for="adate">Assessment date</label><input id="adate" type="date" value="${draft.date}" max="${today()}"></div>
    <p class="note">${esc(t.desc)} You can backdate this to enter a paper form later.</p>
  </div>
  <div class="form">${formFields(t, draft.values)}</div>
  <div class="field" style="margin-top:18px"><label class="label" for="anotes">Clinical notes and observations</label><textarea id="anotes" rows="4" placeholder="Quality of movement, compensations, patient comments, safety">${esc(draft.notes)}</textarea></div>`;
  updateLive();
};
function fieldHTML(f, x) {
  const id = f.id;
  if (f.t === "head") return `<h2 class="sec">${esc(f.label)}</h2>`;
  if (f.t === "scale" || f.t === "sel") {
    const short = f.o.every(o => String(o.l).length <= 3), chipish = f.t === "sel" && f.o.every(o => o.l.length <= 16);
    const btns = f.o.map(o => `<button type="button" data-act="pick" data-f="${id}" data-v="${esc(o.v)}" aria-pressed="${has(x) && String(x) === String(o.v)}">${short ? esc(o.l) : chipish ? esc(o.l) : `${f.t === "scale" && String(o.v) !== o.l ? `<span class="ov">${esc(o.v)}</span>` : ""}<span>${esc(o.l)}</span>`}</button>`).join("");
    return `<div class="item"><div class="ilabel" id="l_${id}">${esc(f.label)}</div><div class="${short ? "seg" : chipish ? "chips" : "opts"}" role="group" aria-labelledby="l_${id}">${btns}</div>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ""}</div>`;
  }
  if (f.t === "check") return `<div class="item"><div class="ilabel" id="l_${id}">${esc(f.label)}</div><div class="chips" role="group" aria-labelledby="l_${id}">${f.opts.map(o => `<button type="button" class="fchip" data-act="toggle" data-f="${id}" data-v="${esc(o)}" aria-pressed="${(x || []).includes(o)}">${esc(o)}</button>`).join("")}</div></div>`;
  if (f.t === "num") return `<div class="item row-num"><label class="ilabel" for="i_${id}">${esc(f.label)}${f.hint ? `<small>${esc(f.hint)}</small>` : ""}</label><span class="unitwrap"><input id="i_${id}" data-f="${id}" type="number" inputmode="decimal" step="${f.step || "any"}" ${f.max != null ? `max="${f.max}"` : ""} value="${esc(x ?? "")}"><span class="unit">${esc(f.unit || "")}</span></span></div>`;
  if (f.t === "lrnum" || f.t === "lrsel") {
    const v = x || {}; const ctl = side => f.t === "lrnum"
      ? `<input id="i_${id}_${side}" data-f="${id}" data-k="${side}" type="number" inputmode="decimal" step="any" value="${esc(v[side] ?? "")}" aria-label="${esc(f.label)} ${side === "L" ? "left" : "right"}">`
      : `<select id="i_${id}_${side}" data-f="${id}" data-k="${side}" aria-label="${esc(f.label)} ${side === "L" ? "left" : "right"}"><option value="">–</option>${f.opts.map(o => `<option ${v[side] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    return `<div class="lrrow"><span>${esc(f.label)}${f.normal != null ? `<small>Normal ${f.normal}${esc(f.unit)}</small>` : f.unit ? `<small>${esc(f.unit)}</small>` : ""}</span>${ctl("L")}${ctl("R")}</div>`;
  }
  if (f.t === "text") return `<div class="item"><label class="ilabel" for="i_${id}">${esc(f.label)}</label><input id="i_${id}" data-f="${id}" value="${esc(x ?? "")}"></div>`;
  if (f.t === "area") return `<div class="item"><label class="ilabel" for="i_${id}">${esc(f.label)}</label><textarea id="i_${id}" data-f="${id}" rows="3">${esc(x ?? "")}</textarea></div>`;
  return "";
}
const isLR = f => f && (f.t === "lrnum" || f.t === "lrsel");
function formFields(t, v) { return t.fields.map((f, i) => (isLR(f) && !isLR(t.fields[i - 1]) ? `<div class="lrrow lrhead" aria-hidden="true"><span></span><span>Left</span><span>Right</span></div>` : "") + fieldHTML(f, v[f.id])).join(""); }
function updateLive() {
  const el = $("#live"); if (!el || !draft) return; const t = getTpl(draft), r = runScore(t, draft.values, P(draft.pid));
  el.innerHTML = `<b>${esc(r.txt)}</b><span>${r.of ? `${r.done}/${r.of} scored · ` : ""}${esc(r.band[0])}</span>`;
}
function setVal(fid, k, val) {
  const v = draft.values;
  if (k) { const o = { ...(v[fid] || {}) }; if (val === "") delete o[k]; else o[k] = val; if (Object.keys(o).length) v[fid] = o; else delete v[fid]; }
  else if (val === "" || val == null) delete v[fid]; else v[fid] = val;
  updateLive();
}

VIEWS.result = aid => {
  const a = A(aid); if (!a) return go("patients"); const t = getTpl(a), p = P(a.pid), r = runScore(t, a.values, p), c = compare(t, a, p);
  const s = series(a.pid, a.tid), rep = db.reports.find(x => x.kind === "single" && x.aids[0] === aid);
  const pv = c?.prev?.values || {};
  chrome(null, `<button data-act="editA" data-id="${aid}">Edit</button><button data-act="aiSingle" data-id="${aid}">✦ AI report</button><button class="primary" data-act="pdfA" data-id="${aid}">PDF</button>`);
  $("#app").innerHTML = `
  <header>${back("patient", `data-id="${a.pid}"`)}<h1>${esc(t.name)}</h1></header>
  <div class="stack">
    <div class="psub">${esc(p.code)} · ${fmt(a.date)}</div>
    <div class="result">
      <div class="label">Result</div>
      <div class="bigrow"><span class="big">${esc(r.txt)}</span>${chip(r.band)}</div>
      ${r.of && r.done < r.of ? `<div class="warnline">Incomplete: ${r.done} of ${r.of} items scored.</div>` : ""}
      ${r.alert ? `<div class="alert">${esc(r.lines[0])}</div>` : ""}
      ${r.lines.filter((l, i) => !(r.alert && i === 0)).map(l => `<div class="psub">${esc(l)}</div>`).join("")}
      ${c && c.d != null ? `<div class="change ${c.better === null || c.d === 0 ? "" : c.better ? "up" : "down"}">${c.d > 0 ? "+" : ""}${c.d}${t.unit ? " " + esc(t.unit) : ""} since ${fmt(c.prev.date)}${c.meaningful == null || c.d === 0 ? "" : c.meaningful ? ` · clinically meaningful (≥${t.mcid})` : ` · within measurement error (<${t.mcid})`}</div>` : ""}
    </div>
    ${s.length > 1 ? `<div class="chart">${chartSVG(s, t)}</div>` : ""}
    ${rep ? `<button class="hist" data-act="report" data-id="${rep.id}"><span class="grow"><b>AI report</b><span class="psub">Written ${fmt(rep.date)}${rep.edited ? " · edited" : ""}</span></span><span class="chip neutral">Open</span></button>` : ""}
    <h2 class="sec">Item scores</h2>
    <div class="tablewrap"><table><thead><tr><th>Item</th><th class="n">${c ? fmtShort(a.date) : "Score"}</th>${c ? `<th class="n">${fmtShort(c.prev.date)}</th>` : ""}</tr></thead><tbody>
    ${t.fields.map(f => f.t === "head" ? `<tr class="trh"><td colspan="${c ? 3 : 2}">${esc(f.label)}</td></tr>` : (has(a.values[f.id]) || has(pv[f.id])) ? `<tr><td>${esc(f.label)}</td><td class="n">${esc(fmtVal(f, a.values[f.id]))}</td>${c ? `<td class="n muted">${esc(fmtVal(f, pv[f.id]))}</td>` : ""}</tr>` : "").join("")}
    </tbody></table></div>
    ${a.notes ? `<h2 class="sec">Clinical notes</h2><p class="notes">${esc(a.notes)}</p>` : ""}
    <div class="danger"><button class="link-danger" data-act="delA" data-id="${aid}">Delete this assessment</button></div>
  </div>`;
};

/* ---------- AI reports ---------- */
const REPORT_RULES = `You are a senior rehabilitation clinician writing a professional clinical report for a rehabilitation clinic (physiotherapy, occupational therapy, speech and language therapy, behavioural and sensory services). The report must read like one written by an experienced specialist: precise, evidence-based, and easy to follow for referrers, the treating team and families.

Rules:
- Use only the data provided. Never invent results, history, diagnoses or test names. If key information is missing, say what should be assessed next.
- The patient is identified only by a code. Never add or guess a name.
- Interpret every score against the published cut-offs, norms and bands given in the data. State whether change between dates is clinically meaningful when a threshold is given.
- Link impairments to activity and participation (ICF framework) and to safety risks such as falls, aspiration or self-harm where the data supports it. Flag any urgent safety item first.
- Write in clear professional English. Short paragraphs and bullet points. No filler.
- Format: plain text. Section headings are lines starting with "## ". Bullets are lines starting with "- ". Use **double asterisks** for key figures. No tables, no other markdown.

Sections, in this order:
## Summary
## Assessment findings
## Clinical interpretation
## Functional impact and risks
## Goals
(2–3 short-term goals for the next 2–4 weeks and 1–2 long-term goals; all SMART and measurable with the tests used)
## Recommendations and plan
(intervention focus, frequency, home programme, onward referrals, when to reassess)
## Summary for the patient and family
(3–5 sentences in plain words, no jargon)

End with this exact line: Clinician review required before release.`;

function patientBlock(p) { return `Patient code: ${p.code}\nAge: ${p.age} years\nSex: ${p.sex}\nDiagnosis / reason for referral: ${p.dx || "not recorded"}\nReferred by: ${p.ref || "not recorded"}${p.notes ? `\nBackground: ${p.notes}` : ""}`; }
function assessmentBlock(a, p) {
  const t = getTpl(a), r = runScore(t, a.values, p), c = compare(t, a, p);
  const items = t.fields.filter(f => f.t !== "head" && has(a.values[f.id])).map(f => `- ${f.label}: ${fmtVal(f, a.values[f.id])}`).join("\n");
  return `### ${t.name}${t.short ? ` (${t.short})` : ""}, ${a.date}
Result: ${r.txt}. Band: ${r.band[0]}.${r.of && r.done < r.of ? ` Incomplete: ${r.done}/${r.of} items scored.` : ""}
${r.lines.join("\n")}
${t.mcid ? `Clinically meaningful change threshold (MCID/MDC): ${t.mcid}${t.unit ? " " + t.unit : ""}. Higher is ${t.hb ? "better" : "worse"}.` : t.hb !== undefined ? `Higher is ${t.hb ? "better" : "worse"}.` : ""}
${c && c.d != null ? `Change since ${c.prev.date}: ${c.d > 0 ? "+" : ""}${c.d}.` : ""}
${t.lic ? `Note: ${t.lic}` : ""}
Items:
${items || "- none recorded"}
${a.notes ? `Clinician notes: ${a.notes}` : ""}`.replace(/\n{2,}/g, "\n");
}
function reportPrompt(rep) {
  const p = P(rep.pid), list = rep.aids.map(A).filter(Boolean).sort(byDate);
  const s = db.settings;
  let data = list.map(a => assessmentBlock(a, p)).join("\n\n");
  if (data.length > 120000) data = data.slice(-120000);
  return `${REPORT_RULES}

Report type: ${rep.kind === "progress" ? "Progress report across all assessments on file. Compare the earliest and latest results for each test and describe the trend." : "Single assessment report."}
Clinic: ${s.clinic || "MotionPlus Physio"}${s.therapist ? `\nAssessing clinician: ${s.therapist}` : ""}
Report date: ${today()}

PATIENT
${patientBlock(p)}

ASSESSMENT DATA
${data}`;
}
let aiCtl = null, streaming = null;
function startReport(pid, aids, kind) {
  const old = kind === "single" && db.reports.find(r => r.kind === "single" && r.aids[0] === aids[0]);
  if (old) return go("report", old.id);
  const rep = { id: uid(), pid, aids, kind, date: today(), text: "" };
  db.reports.push(rep); save(); go("report", rep.id); generate(rep);
}
async function generate(rep) {
  if (!AI) { toast("AI isn't available in this view. Open the app in Claude while signed in."); render(); return; }
  aiCtl?.abort(); aiCtl = new AbortController(); streaming = { id: rep.id, text: "" }; render();
  try {
    const { text, truncated } = await AI(reportPrompt(rep), { signal: aiCtl.signal, cache: false, modelTier: "default",
      onText: ({ text }) => { streaming.text = text; const el = $("#repbody"); if (el && view.args?.[0] === rep.id) el.innerHTML = md(text); } });
    rep.text = text + (truncated ? "\n\n(The report was cut short. Regenerate or shorten the notes.)" : ""); rep.date = today(); rep.edited = false; save();
  } catch (e) {
    if (e.code !== "cancelled") toast(aiMsg(e));
    if (e.text && e.code !== "refused") { rep.text = e.text; save(); }
  }
  streaming = null; if (view.name === "report") render();
}
function md(s) {
  return s.split("\n").map(l => {
    const e = esc(l).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (/^#{1,3}\s/.test(l)) return `<h3>${e.replace(/^#{1,3}\s/, "")}</h3>`;
    if (/^\s*[-•]\s/.test(l)) return `<li>${e.replace(/^\s*[-•]\s/, "")}</li>`;
    return l.trim() ? `<p>${e}</p>` : "";
  }).join("").replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`);
}
let editingReport = false;
VIEWS.report = rid => {
  const rep = db.reports.find(r => r.id === rid); if (!rep) return go("patients"); const p = P(rep.pid), s = db.settings;
  const live = streaming?.id === rid;
  chrome(null, live ? `<div class="score"><b>Writing…</b><span>Claude is drafting the report</span></div><button data-act="stopAI">Stop</button>`
    : editingReport ? `<button data-act="cancelEdit">Cancel</button><button class="primary" data-act="saveEdit" data-id="${rid}">Save text</button>`
    : `<button data-act="copyRep" data-id="${rid}">Copy</button><button data-act="editRep">Edit</button><button class="primary" data-act="pdfRep" data-id="${rid}">PDF</button>`);
  $("#app").innerHTML = `
  <header>${back("patient", `data-id="${rep.pid}"`)}<h1>${rep.kind === "progress" ? "Progress report" : "Assessment report"}</h1></header>
  <div class="stack">
    <div class="rephead"><img src="${s.logo || MP_LOGO}" alt="${s.logo ? "Clinic logo" : "MotionPlus Physio"}"><div><b>${esc(s.clinic || "MotionPlus Physio")}</b><div class="psub">${esc(p.code)} · ${rep.aids.length} assessment${rep.aids.length > 1 ? "s" : ""} · ${fmt(rep.date)}</div></div></div>
    <p class="note lic">AI-written draft. Check every statement against your findings and edit before sharing.</p>
    ${editingReport ? `<textarea id="repedit" rows="24" aria-label="Report text">${esc(rep.text)}</textarea><p class="note">Use “## ” for headings and “- ” for bullet points.</p>`
      : `<article class="repbody" id="repbody">${live ? (streaming.text ? md(streaming.text) : `<p class="thinking">Thinking… a full report usually takes under a minute.</p>`) : rep.text ? md(rep.text) : `<p class="empty">No report yet.</p>`}</article>`}
    ${!live && !editingReport ? `<button class="ghost" data-act="regen" data-id="${rid}">↻ ${rep.text ? "Regenerate" : "Write report"} with AI</button>` : ""}
    <div class="watermark" aria-hidden="true"><img src="${MP_LOGO}" alt=""></div>
  </div>`;
};

/* ---------- Template builder ---------- */
let tdraft = null, tplAiBusy = false;
const ITEM_TYPES = [["score", "Scored item"], ["choice", "Single choice (not scored)"], ["checklist", "Checklist"], ["number", "Number"], ["lrnumber", "Left / right number"], ["lrchoice", "Left / right choice"], ["text", "Short text"], ["longtext", "Long text"], ["heading", "Section heading"]];
function openBuilder(tid, pid) {
  upFiles = []; tplStatus = null; tplAiBusy = false;
  const ex = tid && db.templates.find(t => t.id === tid);
  tdraft = ex ? JSON.parse(JSON.stringify({ ...ex, pid })) : { id: "c_" + uid(), custom: true, name: "", disc: ["General"], desc: "", hb: true, items: [{ type: "score", label: "", opts: "0 = Unable\n1 = With help\n2 = Independent", unit: "" }], bandsText: "", pid };
  go("builder");
}
VIEWS.builder = () => {
  const d = tdraft, exists = db.templates.some(t => t.id === d.id);
  chrome(null, `<button data-act="previewTpl">Preview</button><button class="primary" data-act="saveTpl">Save template</button>`);
  $("#app").innerHTML = `
  <header>${back("library", `data-pid="${d.pid || ""}"`)}<h1>${exists ? "Edit template" : "New template"}</h1></header>
  <div class="stack">
    <section class="aibox">
      <div class="label">✦ Digitise a paper form</div>
      <p class="note">Upload a photo, scan, PDF or Word file of your assessment form, or paste its text. It becomes a digital assessment you can check below and save.</p>
      <label class="filebtn"><input id="tplfile" type="file" multiple accept="image/*,.heic,.heif,application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"><span>${IC.cam} Upload photo, PDF or Word</span></label>
      ${upFiles.length ? `<div class="chips">${upFiles.map((f, i) => `<span class="upchip">${esc(f.name)}<button class="ghost" data-act="rmUp" data-i="${i}" aria-label="Remove ${esc(f.name)}">✕</button></span>`).join("")}</div>` : ""}
      <textarea id="tplaitext" rows="3" placeholder="Or paste the form's text, or describe it, e.g. Handwriting assessment: pencil grasp, letter formation, spacing, speed, each rated 0–3">${esc(d.aiText || "")}</textarea>
      <button class="primary" data-act="aiTpl" ${tplAiBusy ? "disabled" : ""}>${tplAiBusy ? "Converting…" : "Convert to digital assessment"}</button>
      ${tplStatus ? `<div class="upstatus ${tplStatus[1]}" role="status">${esc(tplStatus[0])}</div>` : ""}
      <p class="note">${AI ? "Claude reads the form and keeps its wording, scoring and sections." : "AI isn't available in this view, so photos can't be read. Word files, text PDFs and pasted text still convert. Open the app from its claude.ai link while signed in to read photos."}</p>
    </section>
    <div class="field"><label class="label" for="tname">Template name</label><input id="tname" data-t="name" value="${esc(d.name)}" placeholder="e.g. Shoulder assessment"></div>
    <div class="row2"><div class="field"><label class="label" for="tdisc">Discipline</label><select id="tdisc" data-t="disc">${DISCS.map(x => `<option value="${x}" ${d.disc[0] === x ? "selected" : ""}>${esc(DISC_NAME[x])}</option>`).join("")}</select></div>
      <div class="field"><label class="label" for="thb">A higher score is</label><select id="thb" data-t="hb"><option value="1" ${d.hb ? "selected" : ""}>Better</option><option value="0" ${d.hb ? "" : "selected"}>Worse</option></select></div></div>
    <div class="field"><label class="label" for="tdesc">Description</label><input id="tdesc" data-t="desc" value="${esc(d.desc)}" placeholder="What it measures, in one sentence"></div>
    <h2 class="sec">Items</h2>
    <div class="stack" id="titems">${d.items.map((it, i) => itemCard(it, i, d.items.length)).join("")}</div>
    <div class="actions"><button data-act="addItem" data-type="score">+ Scored item</button><button data-act="addItem" data-type="choice">+ Choice</button><button data-act="addItem" data-type="number">+ Number</button><button data-act="addItem" data-type="longtext">+ Text</button><button data-act="addItem" data-type="heading">+ Heading</button></div>
    <div class="field"><label class="label" for="tbands">Score interpretation (optional)</label><textarea id="tbands" data-t="bandsText" rows="3" placeholder="0-10 = Severe limitation&#10;11-20 = Moderate limitation&#10;21-30 = Mild or none">${esc(d.bandsText)}</textarea>
      <span class="note">One range per line. Scored items are added up for the total.</span></div>
    ${exists ? `<div class="danger"><button class="link-danger" data-act="delTpl">Delete this template</button></div>` : ""}
  </div>`;
};
function itemCard(it, i, n) {
  const needsOpts = ["score", "choice", "checklist", "lrchoice"].includes(it.type), needsUnit = ["number", "lrnumber"].includes(it.type);
  return `<div class="icard">
    <div class="icard-top"><select data-ti="${i}" data-tk="type" aria-label="Item type">${ITEM_TYPES.map(([v, l]) => `<option value="${v}" ${it.type === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <span class="iorder"><button class="ghost" data-act="moveItem" data-i="${i}" data-d="-1" ${i ? "" : "disabled"} aria-label="Move up">↑</button><button class="ghost" data-act="moveItem" data-i="${i}" data-d="1" ${i < n - 1 ? "" : "disabled"} aria-label="Move down">↓</button><button class="ghost danger-txt" data-act="delItem" data-i="${i}" aria-label="Remove item">✕</button></span></div>
    <input data-ti="${i}" data-tk="label" value="${esc(it.label)}" placeholder="${it.type === "heading" ? "Section title" : "Question or item"}" aria-label="Item label">
    ${needsOpts ? `<textarea data-ti="${i}" data-tk="opts" rows="${Math.min(10, Math.max(3, (it.opts || "").split("\n").length))}" aria-label="Options" placeholder="${it.type === "score" ? "0 = Unable&#10;1 = Partial&#10;2 = Full" : "One option per line"}">${esc(it.opts)}</textarea><span class="note">${it.type === "score" ? "One per line as value = description." : "One option per line."}</span>` : ""}
    ${needsUnit ? `<input data-ti="${i}" data-tk="unit" value="${esc(it.unit)}" placeholder="Unit, e.g. cm, s, kg, °" aria-label="Unit">` : ""}
  </div>`;
}
function compileTpl(d) {
  const fields = d.items.filter(it => it.label.trim()).map(it => {
    const lines = (it.opts || "").split("\n").map(s => s.trim()).filter(Boolean), L = it.label.trim();
    switch (it.type) {
      case "score": return { t: "scale", label: L, opts: lines.map((l, j) => { const m = l.match(/^(-?\d+(?:\.\d+)?)\s*[=:–-]\s*(.+)$/); return m ? [+m[1], m[2]] : [j, l]; }) };
      case "choice": return { t: "sel", label: L, opts: lines };
      case "checklist": return { t: "check", label: L, opts: lines };
      case "number": return { t: "num", label: L, unit: it.unit || "" };
      case "lrnumber": return { t: "lrnum", label: L, unit: it.unit || "" };
      case "lrchoice": return { t: "lrsel", label: L, opts: lines };
      case "text": return { t: "text", label: L };
      case "longtext": return { t: "area", label: L };
      default: return { t: "head", label: L };
    }
  }).filter(f => !f.opts || f.opts.length);
  const bands = (d.bandsText || "").split("\n").map(l => l.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)\s*[=:]\s*(.+)$/)).filter(Boolean).map(m => ({ min: +m[1], max: +m[2], label: m[3].trim() }));
  return { id: d.id, custom: true, v: Date.now(), name: d.name.trim() || "Untitled template", short: (d.name.trim() || "Custom").slice(0, 18), disc: d.disc, cat: "Custom", desc: d.desc.trim() || "Custom clinic template.", hb: d.hb, fields, bands, items: d.items, bandsText: d.bandsText };
}
const TPL_AI_PROMPT = `Convert this rehabilitation assessment into a digital template for a clinic app. Reply with only one JSON object in this shape:
{"name": string, "discipline": "PT"|"OT"|"Speech"|"Behavioural"|"Sensory"|"Neuro"|"Paeds"|"Cardio"|"General", "description": string (one sentence), "higherIsBetter": boolean,
 "fields": [{"type": "heading"|"score"|"choice"|"checklist"|"number"|"left-right-number"|"left-right-choice"|"text"|"long-text", "label": string, "options": [...], "unit": string}],
 "bands": [{"min": number, "max": number, "label": string}]}
Rules: use "score" for items that add up to a total, with "options" as [{"value": number, "label": string}] using the values printed on the form. Use "choice", "checklist" and "left-right-choice" with "options" as an array of strings. Use "unit" only for number types. Keep the form's own item wording and order, and use "heading" for its sections. Include "bands" only when the form gives score interpretation, otherwise []. Leave out patient name, address, date of birth, signature and other identifying fields, because the app identifies patients by code. If the source is a description rather than a form, design a clinically sound template for it.`;
function fromAI(j) {
  const T2 = { score: "score", choice: "choice", checklist: "checklist", number: "number", "left-right-number": "lrnumber", "left-right-choice": "lrchoice", text: "text", "long-text": "longtext", heading: "heading" };
  const items = (Array.isArray(j.fields) ? j.fields : []).map(f => {
    const type = T2[f.type] || "text", o = Array.isArray(f.options) ? f.options : [];
    return { type, label: String(f.label || ""), unit: String(f.unit || ""), opts: type === "score" ? o.map((x, k) => typeof x === "object" ? `${x.value ?? k} = ${x.label ?? ""}` : `${k} = ${x}`).join("\n") : o.map(x => typeof x === "object" ? x.label ?? x.value : x).join("\n") };
  });
  return { name: String(j.name || ""), disc: [DISCS.includes(j.discipline) ? j.discipline : "General"], desc: String(j.description || ""), hb: j.higherIsBetter !== false, items: items.length ? items : tdraft.items,
    bandsText: (Array.isArray(j.bands) ? j.bands : []).filter(b => b && b.label != null).map(b => `${b.min}-${b.max} = ${b.label}`).join("\n") };
}
let upFiles = [], tplStatus = null;
const LIBS = { pdf: ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"], docx: ["https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"] };
function loadScript(src) { return new Promise((res, rej) => { const ex = document.querySelector(`script[src="${src}"]`); if (ex?.dataset.ok) return res(); const s = ex || document.createElement("script"); s.addEventListener("load", () => { s.dataset.ok = 1; res(); }); s.addEventListener("error", () => rej(new Error("load"))); if (!ex) { s.src = src; document.head.appendChild(s); } }); }
async function need(k) { for (const src of LIBS[k]) await loadScript(src); }
const kindOf = f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name) ? "image" : /pdf$/.test(f.type) || /\.pdf$/i.test(f.name) ? "pdf" : /\.docx$/i.test(f.name) ? "docx" : /^text\//.test(f.type) || /\.txt$/i.test(f.name) ? "text" : /\.doc$/i.test(f.name) ? "doc" : "other";
async function toJpeg(blob, max = 1800) {
  let src, w, h, url;
  try { src = await createImageBitmap(blob); w = src.width; h = src.height; }
  catch (e) { url = URL.createObjectURL(blob); src = new Image(); src.src = url; await src.decode(); w = src.naturalWidth; h = src.naturalHeight; }
  const k = Math.min(1, max / Math.max(w, h)), c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height); if (url) URL.revokeObjectURL(url);
  return new Promise((r, j) => c.toBlob(b => b ? r(b) : j(new Error("encode")), "image/jpeg", 0.86));
}
async function readPdf(file, maxImgs) {
  await need("pdf");
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; let text = ""; const imgs = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
    const pg = await pdf.getPage(i), tc = await pg.getTextContent();
    text += tc.items.map(t => t.str + (t.hasEOL ? "\n" : " ")).join("") + "\n";
    if (imgs.length < maxImgs) { const vp = pg.getViewport({ scale: 1.7 }), c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: g, viewport: vp }).promise; imgs.push(await new Promise(r => c.toBlob(r, "image/jpeg", 0.86))); }
  }
  return { text: text.trim(), imgs, pages: pdf.numPages };
}
async function readDocx(file) { await need("docx"); return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value.trim(); }
function setStatus(msg, kind = "") { tplStatus = msg ? [msg, kind] : null; const el = document.querySelector(".upstatus"); if (el && msg) { el.textContent = msg; el.className = "upstatus " + kind; } else if (view.name === "builder") render(); }
// Offline conversion of form text into items: headings, numbered options under an item, everything else a question.
function parseFormText(text) {
  const lines = text.split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean), items = []; let cur = null, name = "";
  for (const l of lines) {
    const m = l.match(/^\(?(\d{1,2})\)?\s*([=:.\-–)]|points?\b|pts?\b)?\s+(.{2,})$/i);
    if (m && cur && cur.type !== "heading") { const v = +m[1], opts = cur._o, numbered = m[2] === "." || m[2] === ")";
      if ((!opts.length && v <= 1) || (opts.length && !numbered && Math.abs(v - opts.at(-1)[0]) === 1)) { opts.push([v, m[3]]); continue; } }
    const letters = l.replace(/[^A-Za-z]/g, "");
    if ((letters.length >= 3 && letters === letters.toUpperCase() && l.length <= 60) || (/:$/.test(l) && l.length <= 60)) {
      if (!name && !items.length) { name = l.replace(/:$/, ""); continue; }
      cur = { type: "heading", label: l.replace(/:$/, ""), _o: [] }; items.push(cur); continue;
    }
    cur = { type: "text", label: l.replace(/^(\d{1,2}|[a-z])[.)]\s+/i, ""), _o: [] }; items.push(cur);
  }
  const out = items.map(it => it._o.length >= 2 ? { type: "score", label: it.label, opts: it._o.map(([v, t]) => `${v} = ${t}`).join("\n"), unit: "" } : { type: it.type, label: it.label, opts: "", unit: "" });
  return { name: name || lines[0]?.slice(0, 60) || "", items: out };
}
async function aiTemplate() {
  syncBuilder(); const text = tdraft.aiText = ($("#tplaitext").value || "").trim();
  if (!text && !upFiles.length) { setStatus("Upload a file or paste the form's text first.", "bad"); return; }
  tplAiBusy = true; tplStatus = ["Reading your files…", ""]; render();
  const maxImgs = AI_IMG?.maxCount || 0; let imgs = [], texts = [], raw = [], skipped = [];
  try {
    for (const f of upFiles) {
      const k = kindOf(f);
      if (k === "image") { if (imgs.length < Math.max(maxImgs, 1)) imgs.push(await toJpeg(f).catch(() => { skipped.push(f.name + " (couldn't open this image)"); return null; })); else skipped.push(f.name + " (too many images)"); }
      else if (k === "pdf") { setStatus(`Reading ${f.name}…`); const r = await readPdf(f, Math.max(0, maxImgs - imgs.length)); if (r.text) { texts.push(`From ${f.name}:\n${r.text}`); raw.push(r.text); } imgs.push(...r.imgs); }
      else if (k === "docx") { setStatus(`Reading ${f.name}…`); const t = await readDocx(f); texts.push(`From ${f.name}:\n${t}`); raw.push(t); }
      else if (k === "text") { const t = await f.text(); texts.push(`From ${f.name}:\n${t}`); raw.push(t); }
      else skipped.push(f.name + (k === "doc" ? " (old .doc format: save it as .docx or PDF)" : " (file type not supported)"));
    }
  } catch (e) { tplAiBusy = false; setStatus("A file couldn't be read. Check your internet connection, or try a photo or PDF of the form instead.", "bad"); return; }
  imgs = imgs.filter(Boolean);
  const allText = [text, ...texts].filter(Boolean).join("\n\n").slice(0, 100000);
  const note = skipped.length ? ` Skipped: ${skipped.join("; ")}.` : "";
  if (AI && (allText || (imgs.length && AI_IMG))) {
    setStatus(`Claude is reading the form${imgs.length ? ` (${imgs.length} page${imgs.length > 1 ? "s" : ""})` : ""}. This can take up to a minute…`);
    try {
      const sendImgs = AI_IMG ? imgs.slice(0, AI_IMG.maxCount) : [];
      const j = await AI.json(`${TPL_AI_PROMPT}\n\n${sendImgs.length ? `The form is shown in the ${sendImgs.length} attached image(s).` : ""}${allText ? `\nSource text or description:\n${allText}` : ""}`, { modelTier: "default", ...(sendImgs.length ? { images: sendImgs } : {}) });
      Object.assign(tdraft, fromAI(j)); upFiles = []; tplAiBusy = false;
      tplStatus = [`Converted ${tdraft.items.length} items. Check them below, then tap Save template.${note}`, "good"]; render(); return;
    } catch (e) { if (e.code === "cancelled") { tplAiBusy = false; setStatus(null); return; }
      if (!allText) { tplAiBusy = false; setStatus(aiMsg(e) + note, "bad"); return; }
      tplStatus = [aiMsg(e) + " Converting the text without AI instead.", "warn"]; }
  }
  if (allText) {
    const r = parseFormText([text, ...raw].filter(Boolean).join("\n")); tplAiBusy = false;
    if (!r.items.length) { setStatus("No form items were found in that text." + note, "bad"); return; }
    if (!tdraft.name.trim()) tdraft.name = r.name; tdraft.items = r.items; upFiles = [];
    tplStatus = [`Converted ${r.items.length} items without AI. Check the item types and scores below, then tap Save template.${note}`, "warn"]; render(); return;
  }
  tplAiBusy = false;
  setStatus(imgs.length ? "Reading photos needs AI, which isn't available in this view. Open the app from its claude.ai link while signed in, or upload a Word file or text PDF." + note : "Nothing could be read from those files." + note, "bad");
}
function syncBuilder() {
  if (view.name !== "builder" || !tdraft) return;
  document.querySelectorAll("[data-t]").forEach(el => { const k = el.dataset.t; tdraft[k] = k === "disc" ? [el.value] : k === "hb" ? el.value === "1" : el.value; });
  document.querySelectorAll("[data-ti]").forEach(el => { tdraft.items[+el.dataset.ti][el.dataset.tk] = el.value; });
  const at = $("#tplaitext"); if (at) tdraft.aiText = at.value;
}

/* ---------- Settings, backup ---------- */
VIEWS.settings = () => {
  const s = db.settings, ex = db.patients.filter(p => p.ex).length;
  chrome("settings");
  $("#app").innerHTML = `
  ${topHead("Settings")}
  <div class="stack">
    <h2 class="sec">Clinic</h2>
    <div class="field"><label class="label" for="sclinic">Clinic name (shown on reports)</label><input id="sclinic" data-s="clinic" value="${esc(s.clinic)}" placeholder="e.g. Sunrise Rehab Centre"></div>
    <div class="row2"><div class="field"><label class="label" for="sbranch">Branch</label><input id="sbranch" data-s="branch" value="${esc(s.branch)}"></div>
      <div class="field"><label class="label" for="sther">Clinician name</label><input id="sther" data-s="therapist" value="${esc(s.therapist)}" placeholder="Shown as assessor"></div></div>
    <div class="logo-row">${s.logo ? `<img src="${s.logo}" alt="Clinic logo" class="logo-prev">` : `<div class="logo-prev empty-logo">No logo</div>`}
      <div class="stack tight"><label class="filebtn"><input id="slogo" type="file" accept="image/png,image/jpeg,image/webp"><span>${s.logo ? "Change logo" : "Upload clinic logo"}</span></label>${s.logo ? `<button class="ghost" data-act="rmLogo">Remove logo</button>` : ""}</div></div>
    <p class="note">Reports always carry the MotionPlus Physio watermark. Your logo appears in the report header.</p>
    <div class="field"><label class="label" for="sprefix">Patient code prefix</label><input id="sprefix" data-s="prefix" value="${esc(s.prefix)}" maxlength="10"><span class="note">Next code: ${esc(nextCodePreview())}. Use a branch prefix like MP-B2 to keep codes unique across branches.</span></div>

    <h2 class="sec">Backup and transfer</h2>
    <p class="note">Records stay on this device only. Save an encrypted backup file to keep a copy or move patients to another branch's device.</p>
    <div class="field"><label class="label" for="bscope">What to include</label><select id="bscope"><option value="">All patients (${db.patients.length})</option>${db.patients.map(p => `<option value="${p.id}" ${transferPid === p.id ? "selected" : ""}>${esc(p.code)} only</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="bpw">Backup password</label><input id="bpw" type="password" autocomplete="new-password" placeholder="At least 6 characters"></div>
    <button data-act="backup">Save backup file</button>
    <div class="field"><label class="label" for="rfile">Restore or import a backup</label><input id="rfile" type="file" accept=".json,application/json"></div>
    <div class="field"><label class="label" for="rpw">Password for that file</label><input id="rpw" type="password" autocomplete="off"></div>
    <button data-act="restore">Import records</button>
    <p class="note">Importing adds patients and assessments. It never deletes what's already here.</p>

    <h2 class="sec">Data on this device</h2>
    <p class="note">${db.patients.length} patients, ${db.assessments.length} assessments, ${db.reports.length} reports, ${db.templates.length} custom templates.</p>
    ${ex ? `<button data-act="clearEx">Remove ${ex} example patients</button>` : ""}
    <button class="link-danger" data-act="wipe">Delete all data on this device</button>
  </div>`;
};
let transferPid = "";
const b64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function keyFrom(pw, salt) { const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); }
async function doBackup() {
  const pw = $("#bpw").value, pid = $("#bscope").value; if (pw.length < 6) { toast("Choose a password of at least 6 characters."); return; }
  const pids = pid ? [pid] : db.patients.map(p => p.id);
  const as = db.assessments.filter(a => pids.includes(a.pid)), tids = new Set(as.map(a => a.tid));
  const data = { patients: db.patients.filter(p => pids.includes(p.id)), assessments: as, reports: db.reports.filter(r => pids.includes(r.pid)), templates: pid ? db.templates.filter(t => tids.has(t.id)) : db.templates, settings: pid ? undefined : { ...db.settings } };
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(pw, salt), new TextEncoder().encode(JSON.stringify(data))));
  const file = JSON.stringify({ app: "MotionPlus Assess", format: 1, created: new Date().toISOString(), salt: b64(salt), iv: b64(iv), data: b64(ct) });
  const name = pid ? `motionplus-${P(pid).code}-${today()}.json` : `motionplus-backup-${today()}.json`;
  if (await saveFile(name, file)) $("#bpw").value = "";
}
async function doRestore() {
  const f = $("#rfile").files?.[0], pw = $("#rpw").value; if (!f) { toast("Choose a backup file first."); return; }
  let data;
  try { const j = JSON.parse(await f.text()); if (j.app !== "MotionPlus Assess") throw 0;
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(j.iv) }, await keyFrom(pw, unb64(j.salt)), unb64(j.data)); data = JSON.parse(new TextDecoder().decode(pt)); }
  catch (e) { toast("That password doesn't open this file, or it isn't a MotionPlus backup."); return; }
  const ids = k => new Set(db[k].map(x => x.id)); let np = 0, na = 0;
  const pIds = ids("patients"), aIds = ids("assessments"), rIds = ids("reports"), tIds = ids("templates");
  for (const p of data.patients || []) if (!pIds.has(p.id)) { db.patients.push(p); np++; }
  for (const a of data.assessments || []) if (!aIds.has(a.id)) { db.assessments.push(a); na++; }
  for (const r of data.reports || []) if (!rIds.has(r.id)) db.reports.push(r);
  for (const t of data.templates || []) if (!tIds.has(t.id)) db.templates.push(t);
  if (data.settings && !db.settings.clinic) Object.assign(db.settings, { ...data.settings, next: Math.max(db.settings.next, data.settings.next || 0) });
  if (save()) { toast(`Imported ${np} patients and ${na} assessments.`); render(); }
}
function setLogo(file) {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => { const k = Math.min(1, 480 / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); db.settings.logo = c.toDataURL("image/png"); db.settings.logoAR = c.width / c.height; URL.revokeObjectURL(url); if (save()) { toast("Logo saved"); render(); } };
  img.onerror = () => toast("That image couldn't be opened. Try a PNG or JPG.");
  img.src = url;
}

/* ---------- PDF ---------- */
function pdfSafe(s) { return String(s ?? "").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/→/g, "->").replace(/₂/g, "2").replace(/✦/g, "").replace(/[^\x00-\xFF–—‘’“”•…]/g, ""); }
async function makePdf({ pid, aids, report, title }) {
  if (!window.jspdf) { toast("The PDF tool didn't load. Check the internet connection and reopen the app."); return; }
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" }), p = P(pid), s = db.settings;
  const W = 210, M = 16, CW = W - 2 * M, INK = [22, 21, 15], MUTED = [104, 100, 88], ACC = [22, 21, 15], YEL = [255, 214, 10], GOLD = [168, 132, 0];
  const LV = { good: [31, 122, 58], warn: [190, 95, 0], bad: [200, 38, 30], neutral: GOLD };
  let y = 0;
  const wm = () => { doc.saveGraphicsState(); try { doc.setGState(new doc.GState({ opacity: 0.07 })); } catch (e) {} doc.setFont("helvetica", "bold"); doc.setFontSize(54); doc.setTextColor(...GOLD);
    doc.text("MotionPlus Physio", 34, 230, { angle: 40 }); doc.restoreGraphicsState(); };
  const newPage = () => { doc.addPage(); wm(); y = 18; };
  const ensure = h => { if (y + h > 280) newPage(); };
  const text = (str, { size = 10, style = "normal", color = INK, x = M, w = CW, lh = 1.3 } = {}) => {
    doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color);
    for (const ln of doc.splitTextToSize(pdfSafe(str), w)) { ensure(size * 0.36 * lh); doc.text(ln, x, y + size * 0.3); y += size * 0.36 * lh; }
  };
  const rule = (c = [217, 226, 223]) => { doc.setDrawColor(...c); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); };
  wm();
  // Header
  doc.setFillColor(...YEL); doc.rect(0, 0, W, 4, "F");
  y = 12; let hx = M;
  if (s.logo) { const h = 16, w = Math.min(44, h * (s.logoAR || 1)); try { doc.addImage(s.logo, "PNG", M, y, w, w / (s.logoAR || 1)); hx = M + w + 5; } catch (e) {} }
  else { try { doc.addImage(MP_LOGO, "JPEG", M, y - 1, 16, 17.8); hx = M + 21; } catch (e) {} }
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(...INK); doc.text(pdfSafe(s.clinic || "MotionPlus Physio"), hx, y + 6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text(pdfSafe([s.branch, s.therapist && "Clinician: " + s.therapist].filter(Boolean).join("  ·  ")), hx, y + 11.5);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...INK); doc.text(pdfSafe(title.toUpperCase()), W - M, y + 6, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text(fmt(today()), W - M, y + 11.5, { align: "right" });
  y = 34; doc.setFillColor(...YEL); doc.rect(M, y, CW, 1.2, "F"); y += 6;
  // Patient box
  const list = aids.map(A).filter(Boolean).sort(byDate);
  doc.setFillColor(255, 248, 214); doc.roundedRect(M, y, CW, 17, 2, 2, "F");
  const cell = (lbl, val, x, yy) => { doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...MUTED); doc.text(lbl.toUpperCase(), x, yy); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(pdfSafe(val), 80)[0], x, yy + 4.6); };
  cell("Patient code", p.code, M + 4, y + 5.5); cell("Age / sex", `${p.age} yrs / ${p.sex}`, M + 46, y + 5.5);
  cell("Assessment dates", list.length ? (list[0].date === list.at(-1).date ? fmt(list[0].date) : `${fmt(list[0].date)} to ${fmt(list.at(-1).date)}`) : "-", M + 82, y + 5.5);
  y += 21; text(`Diagnosis: ${p.dx || "not recorded"}${p.ref ? `   ·   Referred by: ${p.ref}` : ""}`, { size: 9, color: MUTED }); y += 3;
  // Report
  if (report) {
    for (const raw of report.split("\n")) {
      const l = raw.replace(/\*\*/g, "");
      if (/^#{1,3}\s/.test(l)) { y += 3; ensure(14); doc.setFillColor(...YEL); doc.rect(M, y + 0.4, 2.2, 4.6, "F"); text(l.replace(/^#{1,3}\s/, "").toUpperCase(), { size: 10.5, style: "bold", color: INK, x: M + 4.5 }); y += 1; }
      else if (/^\s*[-•]\s/.test(l)) { ensure(5); doc.setFillColor(...GOLD); doc.circle(M + 1.5, y + 1.9, 0.7, "F"); text(l.replace(/^\s*[-•]\s/, ""), { size: 9.5, x: M + 5, w: CW - 5 }); }
      else if (l.trim()) { text(l, { size: 9.5, style: /^Clinician review required/.test(l) ? "italic" : "normal", color: /^Clinician review required/.test(l) ? MUTED : INK }); y += 1; }
    }
    y += 3;
  }
  // Results
  ensure(14); y += 2; text(report ? "Appendix: assessment results" : "Assessment results", { size: 12.5, style: "bold" }); y += 1; rule(); y += 4;
  const charted = new Set();
  for (const a of list) {
    const t = getTpl(a), r = runScore(t, a.values, p), c = compare(t, a, p);
    ensure(22);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...INK); doc.text(pdfSafe(t.name), M, y + 3.5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text(fmt(a.date), W - M, y + 3.5, { align: "right" }); y += 7;
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(...INK); doc.text(pdfSafe(r.txt), M, y + 5);
    const tw = doc.getTextWidth(pdfSafe(r.txt)); doc.setFontSize(9.5); doc.setTextColor(...(LV[r.band[1]] || ACC)); doc.text(pdfSafe(r.band[0]), M + tw + 4, y + 5); y += 8.5;
    if (c && c.d != null) text(`${c.d > 0 ? "+" : ""}${c.d}${t.unit ? " " + t.unit : ""} since ${fmt(c.prev.date)}${c.meaningful == null || c.d === 0 ? "" : c.meaningful ? " (clinically meaningful)" : " (within measurement error)"}`, { size: 9, color: c.better ? LV.good : c.better === false ? LV.bad : MUTED });
    for (const l of r.lines) text(l, { size: 9, color: MUTED });
    const sr = series(pid, a.tid).filter(x => list.some(b => b.tid === a.tid && b.date === x.date));
    if (sr.length > 1 && !charted.has(a.tid) && a === list.filter(b => b.tid === a.tid).at(-1)) { charted.add(a.tid); y += 2; ensure(42); pdfChart(doc, M, y, CW, 36, sr, t, { INK, MUTED, GOLD }); y += 41; }
    // item table
    const rows = t.fields.filter(f => f.t !== "head" && has(a.values[f.id]) && !(typeof a.values[f.id] === "object" && !Array.isArray(a.values[f.id]) && !Object.keys(a.values[f.id]).length));
    if (rows.length) { y += 1.5;
      for (const f of rows) { doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
        const L = doc.splitTextToSize(pdfSafe(f.label), CW * 0.55), V = doc.splitTextToSize(pdfSafe(fmtVal(f, a.values[f.id])), CW * 0.42), h = Math.max(L.length, V.length) * 3.6 + 1.6;
        ensure(h); doc.setTextColor(...INK); doc.text(L, M, y + 3); doc.setTextColor(...MUTED); doc.text(V, W - M, y + 3, { align: "right" }); y += h; doc.setDrawColor(235, 240, 238); doc.line(M, y - 0.6, W - M, y - 0.6); } }
    if (a.notes) { y += 1.5; text("Notes: " + a.notes, { size: 9, style: "italic", color: MUTED }); }
    y += 5;
  }
  // Footer
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor(217, 226, 223); doc.line(M, 287, W - M, 287); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    doc.text(pdfSafe(`MotionPlus Physio  ·  ${p.code}  ·  Confidential clinical record`), M, 291); doc.text(`Page ${i} of ${n}`, W - M, 291, { align: "right" }); }
  await saveFile(`${p.code}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${today()}.pdf`, doc.output("blob"));
}
function pdfChart(doc, x, y, w, h, s, t, C) {
  const vs = s.map(p => p.val); let hi = t.max ?? Math.max(...vs) * 1.15, lo = t.max != null ? (t.id === "gcs" ? 3 : 0) : Math.min(0, ...vs); if (hi === lo) hi = lo + 1;
  const L = x + 10, R = x + w - 4, T = y + 3, B = y + h - 6;
  const px = i => L + (s.length === 1 ? 0 : i * (R - L) / (s.length - 1)), py = v => T + (hi - v) * (B - T) / (hi - lo);
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.MUTED); doc.setDrawColor(225, 232, 230); doc.setLineWidth(0.2);
  for (const v of [lo, (lo + hi) / 2, hi]) { doc.line(L, py(v), R, py(v)); doc.text(String(Math.round(v * 10) / 10), L - 2, py(v) + 1, { align: "right" }); }
  doc.setDrawColor(...C.GOLD); doc.setLineWidth(0.8);
  for (let i = 1; i < s.length; i++) doc.line(px(i - 1), py(s[i - 1].val), px(i), py(s[i].val));
  doc.setFillColor(...C.GOLD);
  s.forEach((p, i) => { doc.circle(px(i), py(p.val), i === s.length - 1 ? 1.2 : 0.8, "F"); doc.setTextColor(...C.MUTED); doc.text(fmtShort(p.date), px(i), B + 4.5, { align: i === 0 ? "left" : i === s.length - 1 ? "right" : "center" }); });
  doc.setFont("helvetica", "bold"); doc.setTextColor(...C.INK); doc.text(String(s.at(-1).val), px(s.length - 1) - 2, py(s.at(-1).val) - 2, { align: "right" });
}

/* ---------- Events ---------- */
const confirmArm = {};
function armed(key, btn, label) { if (confirmArm[key] && Date.now() - confirmArm[key] < 4000) return true; confirmArm[key] = Date.now(); btn.textContent = label; return false; }
const ACT = {
  tab: d => go(d.tab),
  patient: d => go("patient", d.id),
  newPatient: d => go("editPatient", null, d.then),
  editPatient: d => go("editPatient", d.id),
  savePatient: d => {
    const code = $("#pcode").value.trim(); if (!code) { toast("Enter a patient code."); return; }
    if (db.patients.some(p => p.code === code && p.id !== d.id)) { toast("That code is already in use."); return; }
    const vals = { code, age: $("#page").value, sex: $("#psex").value, dx: $("#pdx").value.trim(), ref: $("#pref").value.trim(), branch: $("#pbr").value.trim(), notes: $("#pnotes").value.trim() };
    let p; if (d.id) { p = P(d.id); Object.assign(p, vals); } else { p = { id: uid(), created: Date.now(), ...vals }; if (code === nextCodePreview()) nextCode(); db.patients.unshift(p); }
    if (!save()) return; toast(d.id ? "Changes saved" : "Patient added"); d.then ? startForm(p.id, d.then) : go("patient", p.id);
  },
  delPatient: (d, b) => { if (!armed("dp" + d.id, b, "Tap again to delete permanently")) return;
    db.assessments = db.assessments.filter(a => a.pid !== d.id); db.reports = db.reports.filter(r => r.pid !== d.id); db.patients = db.patients.filter(p => p.id !== d.id); save(); toast("Patient deleted"); go("patients"); },
  library: d => go("library", d.pid || null),
  disc: d => { libDisc = d.d; document.querySelectorAll("[data-act=disc]").forEach(b => b.setAttribute("aria-pressed", b.dataset.d === libDisc)); listTemplates(view.args?.[0]); },
  startForm: d => d.pid ? startForm(d.pid, d.tid) : db.patients.length ? go("pickPatient", d.tid) : go("editPatient", null, d.tid),
  pick: (d, b) => { const t = getTpl(draft), f = t.fields.find(x => x.id === d.f), v = f.t === "scale" ? +d.v : d.v;
    const same = String(draft.values[d.f]) === String(v); setVal(d.f, null, same ? "" : v);
    b.parentNode.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", !same && x === b)); },
  toggle: (d, b) => { const cur = draft.values[d.f] || [], on = cur.includes(d.v); const nx = on ? cur.filter(x => x !== d.v) : [...cur, d.v]; setVal(d.f, null, nx.length ? nx : ""); b.setAttribute("aria-pressed", !on); },
  saveA: () => { draft.date = $("#adate").value || today(); draft.notes = $("#anotes").value.trim();
    if (!Object.keys(draft.values).length && !draft.notes) { toast("Record at least one item before saving."); return; }
    const i = db.assessments.findIndex(a => a.id === draft.id); if (i >= 0) db.assessments[i] = draft; else db.assessments.push(draft);
    if (!save()) return; toast("Assessment saved"); const id = draft.id; draft = null; go("result", id); },
  result: d => go("result", d.id),
  editA: d => startForm(null, null, d.id),
  delA: (d, b) => { if (!armed("da" + d.id, b, "Tap again to delete")) return; const a = A(d.id); db.assessments = db.assessments.filter(x => x.id !== d.id); db.reports = db.reports.filter(r => !r.aids.includes(d.id) || r.kind === "progress"); save(); toast("Assessment deleted"); go("patient", a.pid); },
  aiSingle: d => startReport(A(d.id).pid, [d.id], "single"),
  aiProgress: d => startReport(d.id, db.assessments.filter(a => a.pid === d.id).sort(byDate).map(a => a.id), "progress"),
  report: d => { editingReport = false; go("report", d.id); },
  regen: d => generate(db.reports.find(r => r.id === d.id)),
  stopAI: () => aiCtl?.abort(),
  editRep: () => { editingReport = true; render(); },
  cancelEdit: () => { editingReport = false; render(); },
  saveEdit: d => { const r = db.reports.find(x => x.id === d.id); r.text = $("#repedit").value; r.edited = true; editingReport = false; save(); toast("Report saved"); render(); },
  copyRep: d => { const r = db.reports.find(x => x.id === d.id), txt = r.text.replace(/\*\*/g, "").replace(/^## /gm, "");
    navigator.clipboard.writeText(txt).then(() => toast("Report copied"), () => { const rg = document.createRange(); rg.selectNodeContents($("#repbody")); getSelection().removeAllRanges(); getSelection().addRange(rg); toast("Text selected. Copy it from the menu."); }); },
  pdfRep: d => { const r = db.reports.find(x => x.id === d.id); makePdf({ pid: r.pid, aids: r.aids, report: r.text, title: r.kind === "progress" ? "Progress Report" : "Assessment Report" }); },
  pdfA: d => { const a = A(d.id), rep = db.reports.find(x => x.kind === "single" && x.aids[0] === d.id); makePdf({ pid: a.pid, aids: [d.id], report: rep?.text, title: "Assessment Report" }); },
  pdfPatient: d => makePdf({ pid: d.id, aids: db.assessments.filter(a => a.pid === d.id).map(a => a.id), title: "Assessment Summary" }),
  transfer: d => { transferPid = d.id; go("settings"); setTimeout(() => $("#bpw")?.scrollIntoView({ block: "center" }), 50); },
  builder: d => openBuilder(d.tid, d.pid),
  addItem: d => { syncBuilder(); tdraft.items.push({ type: d.type, label: "", opts: d.type === "score" ? "0 = Unable\n1 = Partial\n2 = Full" : d.type === "choice" ? "Option A\nOption B" : "", unit: "" }); render(); setTimeout(() => document.querySelectorAll("#titems .icard")[tdraft.items.length - 1]?.querySelector("input")?.focus(), 30); },
  delItem: d => { syncBuilder(); tdraft.items.splice(+d.i, 1); render(); },
  moveItem: d => { syncBuilder(); const i = +d.i, j = i + +d.d; [tdraft.items[i], tdraft.items[j]] = [tdraft.items[j], tdraft.items[i]]; render(); },
  aiTpl: () => aiTemplate(),
  rmUp: d => { syncBuilder(); upFiles.splice(+d.i, 1); render(); },
  previewTpl: () => { syncBuilder(); const c = compileTpl(tdraft); if (!c.fields.length) { toast("Add at least one item with a label."); return; } previewTpl = hydrate({ ...c, id: "preview", v: Date.now() }); go("preview"); },
  saveTpl: () => { syncBuilder(); const c = compileTpl(tdraft); if (!tdraft.name.trim()) { toast("Give the template a name."); $("#tname").focus(); return; } if (!c.fields.length) { toast("Add at least one item with a label."); return; }
    const i = db.templates.findIndex(t => t.id === c.id); if (i >= 0) db.templates[i] = c; else db.templates.push(c); if (!save()) return; hydCache.clear(); libDisc = "Custom";
    if (tdraft.pid && P(tdraft.pid)) { toast("Template saved. Starting the assessment."); startForm(tdraft.pid, c.id); } else { toast("Template saved. Find it under Custom."); go("library", null); } },
  delTpl: (d, b) => { if (!armed("dt", b, "Tap again to delete template")) return; db.templates = db.templates.filter(t => t.id !== tdraft.id); save(); toast("Template deleted. Past assessments keep their copy."); go("library", tdraft.pid || null); },
  backToBuilder: () => go("builder"),
  rmLogo: () => { db.settings.logo = null; save(); render(); },
  backup: () => doBackup(),
  restore: () => doRestore(),
  clearEx: (d, b) => { if (!armed("cx", b, "Tap again to remove examples")) return; const ids = new Set(db.patients.filter(p => p.ex).map(p => p.id));
    db.patients = db.patients.filter(p => !ids.has(p.id)); db.assessments = db.assessments.filter(a => !ids.has(a.pid)); db.reports = db.reports.filter(r => !ids.has(r.pid)); save(); toast("Examples removed"); render(); },
  wipe: (d, b) => { if (!armed("wipe", b, "Tap again to erase everything on this device")) return; db = { ...seed(), patients: [], assessments: [] }; db.settings.next = 1; save(); toast("All data deleted"); go("patients"); },
};
let previewTpl = null;
VIEWS.preview = () => {
  const t = previewTpl; chrome(null, `<button class="primary wide" data-act="backToBuilder">Back to editing</button>`);
  $("#app").innerHTML = `<header>${back("backToBuilder")}<h1>${esc(t.name)}</h1></header><p class="note">Preview only. Taps here aren't saved.</p><div class="form">${formFields(t, {})}</div>`;
};

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  if (view.name === "preview" && (b.dataset.act === "pick" || b.dataset.act === "toggle")) { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); return; }
  const fn = ACT[b.dataset.act]; if (fn) { e.preventDefault(); fn(b.dataset, b, e); }
});
document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "q") { q = el.value; listPatients(); return; }
  if (el.id === "libq") { libQ = el.value; listTemplates(view.args?.[0]); return; }
  if (el.dataset.f && draft && view.name === "form") { setVal(el.dataset.f, el.dataset.k, el.value); return; }
  if (el.dataset.s) { db.settings[el.dataset.s] = el.value.trim(); clearTimeout(save.t); save.t = setTimeout(save, 400); return; }
  if (el.id === "adate" && draft) draft.date = el.value;
  if (el.id === "anotes" && draft) draft.notes = el.value;
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.f && draft && view.name === "form") setVal(el.dataset.f, el.dataset.k, el.value);
  if (el.id === "slogo" && el.files[0]) setLogo(el.files[0]);
  if (el.id === "tplfile" && el.files.length) { syncBuilder(); upFiles.push(...el.files); tplStatus = null; render(); }
  if (el.dataset.tk === "type") { syncBuilder(); render(); }
  if (el.id === "sprefix") render();
});

go("patients");
