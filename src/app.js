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
/* PIN lock: when a PIN is set, records are stored only encrypted (AES-GCM, key derived from the PIN) under LOCK, and the
   decrypted copy lives in memory until the app locks. Without a PIN, records are stored as plain JSON under STORE. */
const LOCK = STORE + "-lock", TRIES = STORE + "-tries";
let pinKey = null, pinSalt = null, locked = !!localStorage.getItem(LOCK), encQueue = Promise.resolve();
const emptyDb = () => ({ ...seed(), patients: [], assessments: [] });
function load() { if (locked) return emptyDb(); try { const d = JSON.parse(localStorage.getItem(STORE)); if (d && d.patients) return d; } catch (e) {} return seed(); }
let db = load();
const FULL = "This device's storage is full. Save a backup, then delete old records.";
function save() {
  if (locked) return false;
  if (pinKey) { const json = JSON.stringify(db); encQueue = encQueue.then(() => encWrite(json)); return true; }
  try { localStorage.setItem(STORE, JSON.stringify(db)); return true; } catch (e) { toast(FULL); return false; }
}
async function encWrite(json) {
  const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, pinKey, new TextEncoder().encode(json)));
  try { localStorage.setItem(LOCK, JSON.stringify({ v: 1, salt: b64(pinSalt), iv: b64(iv), data: b64(ct) })); } catch (e) { toast(FULL); }
}
async function openLock(pin) { const j = JSON.parse(localStorage.getItem(LOCK)), salt = unb64(j.salt), key = await keyFrom(pin, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(j.iv) }, key, unb64(j.data)); return { key, salt, data: JSON.parse(new TextDecoder().decode(pt)) }; }

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = d => new Date(d + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const fmtShort = d => new Date(d + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
const byDate = (a, b) => a.date.localeCompare(b.date) || (a.created || 0) - (b.created || 0);
const P = id => db.patients.find(p => p.id === id);
const A = id => db.assessments.find(a => a.id === id);
function toast(m, action) { const t = $("#toast"); t.textContent = m; toast.fn = action?.fn || null;
  if (action) { const b = document.createElement("button"); b.className = "tbtn"; b.dataset.act = "toastAct"; b.textContent = action.label; t.append(b); }
  t.classList.toggle("act", !!action); t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; toast.fn = null; }, action ? 5000 : 2600); }

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
function series(pid, tid) { const p = P(pid); return db.assessments.filter(a => a.pid === pid && a.tid === tid).sort(byDate).map(a => { const r = runScore(getTpl(a), a.values, p); return { date: a.date, val: r.val, max: r.max }; }).filter(x => x.val != null); }
function chip(b) { return `<span class="chip ${b[1]}">${esc(b[0])}</span>`; }
function nextCode() { const s = db.settings; let c; do { c = `${s.prefix || "MP"}-${String(s.next++).padStart(4, "0")}`; } while (db.patients.some(p => p.code === c)); return c; }

/* ---------- Claude capabilities ---------- */
let AI = null, DL = null, AI_IMG = null, aiState = window.claude?.use ? "pending" : "outside";
const aiReady = window.claude?.use ? claude.use("sample").then(s => { AI = s; aiState = s ? "ready" : "blocked"; if (s) s.limits().then(l => { AI_IMG = l.images || null; if (view.name === "builder") render(); }).catch(() => {}); if (view.name) render(); return s; }).catch(() => { aiState = "blocked"; return null; }) : Promise.resolve(null);
const dlReady = window.claude?.use ? claude.use("downloads").then(d => (DL = d)).catch(() => null) : Promise.resolve(null);
async function getDL() { return DL || Promise.race([dlReady, new Promise(r => setTimeout(() => r(null), 12000))]); }
// Waits for the viewer to answer (it can take a few seconds on phones) instead of failing on an early tap.
async function getAI() { if (AI || aiState !== "pending") return AI; return Promise.race([aiReady, new Promise(r => setTimeout(() => r(null), 12000))]); }
const aiWhy = () => aiState === "outside" ? "this copy of the app isn't running inside Claude" : "Claude didn't turn on AI for this page in this browser (privacy shields, such as Brave Shields, can block it)";
const AI_ERR = { not_granted: "AI is turned off for this app on your account. You can still write the report yourself.", sampling_disabled: "AI isn't available for this account.", rate_limited: "Claude is busy or your usage limit is reached. Try again in a few minutes.", session_expired: "Sign in to Claude again, then try again.", refused: "Claude couldn't write this. Check the notes for unusual content and try again.", image_rejected: "That photo couldn't be read. Try a clearer JPG or PNG.", images_unavailable: "Photos can't be sent from this view. Paste the form's text instead.", invalid_json: "The template came back in the wrong shape. Try again." };
const aiMsg = e => AI_ERR[e?.code] || "It stopped before finishing. Try again.";
async function saveFile(filename, data) {
  toast("Preparing " + filename + "…");
  const dl = await getDL();
  if (dl) {
    try { await dl.save({ filename, data }); toast("Saved " + filename); return true; }
    catch (e) { if (e.code === "declined") return false; if (e.code === "rate_limited") { toast("A save is already waiting for you."); return false; } }
  }
  if (/\.pdf$/.test(filename)) return previewPdf(filename, data);
  toast("This browser doesn't allow saving files from the app. Open the link in Chrome or the Claude app."); return false;
}
// When the browser blocks file saving, show the PDF pages as images that can be long-pressed and saved or shared.
let pdfPreview = null;
async function previewPdf(filename, blob) {
  try {
    await need("pdf");
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise, pages = [];
    for (let i = 1; i <= pdf.numPages; i++) { const pg = await pdf.getPage(i), vp = pg.getViewport({ scale: 2 }), c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
      await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; pages.push(c.toDataURL("image/jpeg", 0.9)); }
    pdfPreview = { filename, pages, back: { ...view } }; go("pdfview"); return false;
  } catch (e) { toast("This browser doesn't allow saving files from the app. Open the link in Chrome or the Claude app."); return false; }
}

/* ---------- Chrome ---------- */
let view = {};
function go(name, ...args) { if (name !== "tool") { document.body.classList.remove("toolmode"); toolCtx = null; } if (name !== "gonio") gzStop(); if (name !== "explain") document.body.classList.remove("lightpage"); closeSheet(true); tmStop();
  const was = navKey(); if (was) navScroll[was] = scrollY; const dir = navDir(name);
  view = { name, args }; render(); window.scrollTo(0, dir === "back" ? navScroll[navKey()] || 0 : 0); animateNav(dir); const h = $("#app h1")?.textContent.trim(); document.title = h && h !== "Home" ? `${h} · MotionPlus Pro` : "MotionPlus Pro"; }
function render() { (VIEWS[view.name] || VIEWS.patients)(...(view.args || [])); }
function chrome(tab, barHtml) {
  $("#tabs").hidden = !tab; $("#bar").hidden = !barHtml; $("#barIn").innerHTML = barHtml || "";
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false"));
  document.body.classList.toggle("has-bar", !!barHtml); document.body.classList.toggle("has-tabs", !!tab);
}
const back = (act, extra = "") => `<button class="back" data-act="${act}" ${extra} aria-label="Back">‹</button>`;
const brand = () => `<div class="brand">MOTIONPLUS <b class="pro">PRO</b>${db.settings.clinic ? " · " + esc(db.settings.clinic).toUpperCase() : ""}</div>`;
const LOCK_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const topHead = (title, right = "") => `<header>${RP_MARK("rpmark hm")}<div class="grow">${brand()}<h1>${title}</h1></div>${right}${pinKey ? `<button class="ghost headlock" data-act="lockNow" aria-label="Lock the app">${LOCK_IC}</button>` : ""}</header>`;
const IC = { msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4"/></svg>', up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 18v-6M9 15l3-3 3 3"/></svg>', user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c.6-3.6 3.2-5.5 6.5-5.5 1.6 0 3 .4 4.1 1.2M18 14v6M15 17h6"/></svg>', clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5V2.5h6v1M8.5 9h7M8.5 12.5h7M8.5 16h4"/></svg>', cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' };

/* ---------- Views ---------- */
const VIEWS = {};
/*UX*/
let q = "", libQ = "", libDisc = "All";

VIEWS.patients = () => {
  chrome("patients");
  $("#app").innerHTML = `
  ${topHead("Patients", `<button class="ghost" data-act="newPatient">+ New</button>`)}
  <div class="stack">
    <input id="q" type="search" placeholder="Search ${db.patients.length} patients by code or diagnosis" value="${esc(q)}" aria-label="Search patients">
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
      <div class="field"><span class="label" id="psexl">Sex</span><input type="hidden" id="psex" value="${esc(p.sex)}"><div class="segc" role="group" aria-labelledby="psexl">${[["F", "Female"], ["M", "Male"], ["Other", "Other"]].map(([v, l]) => `<button type="button" data-act="setSex" data-v="${v}" aria-pressed="${p.sex === v}">${l}</button>`).join("")}</div></div></div>
    <div class="field"><label class="label" for="pdx">Diagnosis or reason for referral</label><input id="pdx" value="${esc(p.dx)}" placeholder="e.g. Right TKR, post-op week 2"></div>
    <div class="row2"><div class="field"><label class="label" for="pref">Referred by</label><input id="pref" value="${esc(p.ref)}"></div>
      <div class="field"><label class="label" for="pbr">Branch</label><input id="pbr" value="${esc(p.branch)}"></div></div>
    <div class="field"><label class="label" for="pnotes">Background notes</label><textarea id="pnotes" rows="3" placeholder="Relevant history, precautions, goals">${esc(p.notes)}</textarea></div>
  </form>`;
};
function nextCodePreview() { const s = db.settings; let n = s.next, c; do { c = `${s.prefix || "MP"}-${String(n++).padStart(4, "0")}`; } while (db.patients.some(p => p.code === c)); return c; }

VIEWS.patient = id => {
  const p = P(id); if (!p) return go("today");
  const as = db.assessments.filter(a => a.pid === id).sort(byDate).reverse();
  const reps = db.reports.filter(r => r.pid === id).sort((a, b) => b.date.localeCompare(a.date));
  const tids = [...new Set(as.map(a => a.tid))];
  const charts = tids.map(tid => { const s = series(id, tid); if (s.length < 2) return ""; const t = getTpl(as.find(a => a.tid === tid)), d = Math.round((s.at(-1).val - s[0].val) * 100) / 100;
    const better = t.hb === undefined ? null : t.hb ? d > 0 : d < 0;
    return `<div class="chart"><div class="chead"><b>${esc(t.name)}</b><span class="chip ${better === null || d === 0 ? "neutral" : better ? "good" : "bad"}">${d > 0 ? "+" : ""}${d}${t.unit ? " " + esc(t.unit) : ""} since ${fmtShort(s[0].date)}</span></div>${chartSVG(s, t)}</div>`; }).join("");
  chrome(null, `<button data-act="library" data-pid="${id}">+ Single test</button><button class="primary wide" data-act="newSession" data-pid="${id}">${db.session?.pid === id ? "Continue session" : "Start session"}</button>`);
  $("#app").innerHTML = `
  <header>${back("tab", 'data-tab="patients"')}<h1>${esc(p.code)}</h1><button class="ghost" data-act="editPatient" data-id="${id}">Edit</button></header>
  <div class="stack">
    <div class="psub">${esc(p.age)} yrs · ${esc(p.sex)} · ${esc(p.dx)}${p.ref ? ` · Referred by ${esc(p.ref)}` : ""}${p.branch ? ` · ${esc(p.branch)}` : ""}</div>
    ${p.notes ? `<p class="note">${esc(p.notes)}</p>` : ""}
    ${p.consent?.media ? `<p class="note">Photo and video consent recorded ${fmt(p.consent.media)}.</p>` : ""}
    <div class="actions">
      <button data-act="aiProgress" data-id="${id}" ${as.length ? "" : "disabled"}>✦ AI progress report</button>
      <button data-act="pdfPatient" data-id="${id}" ${as.length ? "" : "disabled"}>PDF summary</button>
      <button data-act="transfer" data-id="${id}">Transfer</button>
      <button data-act="explain" data-pid="${id}" ${as.length ? "" : "disabled"}>Explain to patient</button>
    </div>
    <div class="ptools" role="group" aria-label="MotionPlus Tools">${Object.values(TOOLS).map(k => `<button class="ptool" data-act="startForm" data-tid="${k.id}" data-pid="${id}">${k.icon}<span><b>${k.name.split(" ")[0]}</b><small>${k.tag}</small></span><span class="pro-chip">PRO</span></button>`).join("")}</div>
    <label class="filebtn">${IC.up}<span>Upload old report to compare</span><input type="file" class="oldrep" accept="application/pdf,.pdf" aria-label="Upload an old MotionPlus PDF report"></label>
    <div class="lrow sechead"><h2 class="sec">Goals</h2><span class="grow"></span><button class="ghost" data-act="goalNew" data-pid="${id}">+ Write</button><button class="ghost" data-act="goalSuggest" data-pid="${id}">Suggest</button></div>
    ${goalsHTML(id)}
    ${reasonHTML(id)}
    ${charts ? `<h2 class="sec">Progress</h2>${charts}` : ""}
    <h2 class="sec">Timeline</h2>
    <div class="tl">${[...new Set(as.map(a => a.date))].map(d => `<section class="tlv"><h3><span>${fmt(d)}</span><small>${as.filter(a => a.date === d).length} test${as.filter(a => a.date === d).length > 1 ? "s" : ""}</small></h3>${as.filter(a => a.date === d).map(a => { const t = getTpl(a), r = runScore(t, a.values, p); return `<button class="hist" data-act="result" data-id="${a.id}">
      <span class="grow"><b>${esc(t?.name || "Assessment")}</b><span class="psub">${esc(r.txt)}</span></span>${chip(r.band)}</button>`; }).join("")}</section>`).join("") || `<div class="empty">No assessments yet. Tap Start session to begin.</div>`}</div>
    ${reps.length ? `<h2 class="sec">Reports</h2><div>${reps.map(r => `<button class="hist" data-act="report" data-id="${r.id}"><span class="grow"><b>${r.kind === "progress" ? "Progress report" : "Assessment report"}</b><span class="psub">${fmt(r.date)} · ${r.aids.length} assessment${r.aids.length > 1 ? "s" : ""}${r.edited ? " · edited" : ""}</span></span><span class="chip neutral">${r.basic ? "Standard" : "AI draft"}</span></button>`).join("")}</div>` : ""}
    <div class="danger"><button class="link-danger" data-act="delPatient" data-id="${id}">Delete patient and all records</button></div>
  </div>`;
};

// Chart scale: the test's real maximum (e.g. Berg 56) when its definition gives one, otherwise the old automatic range.
function chartRange(s, t) {
  const vs = s.map(x => x.val), ms = s.map(x => x.max).filter(m => typeof m === "number" && isFinite(m)), top = t.max ?? (ms.length ? Math.max(...ms) : null);
  if (top != null) { const lo = t.id === "gcs" ? 3 : 0; if (top > lo && vs.every(v => v >= lo && v <= top)) return [lo, top]; }
  const hi = Math.max(...vs) * 1.15, lo = Math.min(0, ...vs); return [lo, hi === lo ? lo + 1 : hi];
}
function chartSVG(s, t) {
  const W = 320, H = 150, L = 34, R = 14, Tp = 14, B = 26, vs = s.map(x => x.val);
  const [lo, hi] = chartRange(s, t);
  const x = i => L + (s.length === 1 ? 0 : i * (W - L - R) / (s.length - 1)), y = v => Tp + (hi - v) * (H - Tp - B) / (hi - lo);
  const nice = v => Math.round(v * 10) / 10;
  const grid = [lo, (lo + hi) / 2, hi].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${nice(v)}</text>`).join("");
  const pts = s.map((p, i) => [x(i), y(p.val), p]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = line + ` L${pts.at(-1)[0]},${y(lo)} L${pts[0][0]},${y(lo)} Z`;
  const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 5 : 3.5}" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>${i === 0 || i === pts.length - 1 || s.length <= 5 ? `<text x="${p[0]}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}" class="ax">${fmtShort(p[2].date)}</text>` : ""}`).join("");
  const last = pts.at(-1);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t.name)} over time">${grid}<path d="${area}" fill="var(--accent)" opacity=".1"/><path class="cline" d="${line}" pathLength="1" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${dots}<text x="${last[0] - 9}" y="${last[1] - 9}" text-anchor="end" class="ax strong">${nice(last[2].val)}</text></svg>`;
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
  const list = allTpl().filter(t => (libDisc === "All" || (libDisc === "Custom" ? t.custom : t.disc.includes(libDisc))) && (t.name + t.short + t.cat + t.desc).toLowerCase().includes(ql)).sort((a, b) => (b.tool ? 1 : 0) - (a.tool ? 1 : 0));
  $("#tlist").innerHTML = list.map(t => `<div class="tool"><button class="tool-main" data-act="startForm" data-tid="${t.id}" data-pid="${pid || ""}">
      <span class="tname">${esc(t.name)}${t.tool ? ' <span class="pro-chip">PRO</span>' : ""}</span><span class="psub">${esc(t.desc)}</span>
      <span class="tags">${(t.custom ? ["Custom"] : []).concat(t.disc).map(d => `<span class="tag">${esc(d)}</span>`).join("")}<span class="tag soft">${esc(t.cat)}</span></span></button>
      ${t.custom ? `<button class="ghost" data-act="builder" data-tid="${t.id}" data-pid="${pid || ""}" aria-label="Edit ${esc(t.name)}">Edit</button>` : ""}</div>`).join("") || `<div class="empty">No assessments match. Try another word, or create your own template.</div>`;
}

VIEWS.pickPatient = tid => {
  const t = tid === GONIO ? { name: "Goniometer", tool: GONIO } : tid === "session" ? { name: "a session" } : allTpl().find(x => x.id === tid);
  chrome(null, `<button class="primary wide" data-act="newPatient" data-then="${tid}">+ New patient</button>`);
  $("#app").innerHTML = `<header>${back("tab", `data-tab="${t.tool ? "tools" : tid === "session" ? "today" : "library"}"`)}<h1>Which patient?</h1></header>
  <div class="stack"><div class="psub">Starting ${esc(t.name)}</div>
  ${db.patients.map(p => `<button class="patient" data-act="startForm" data-tid="${tid}" data-pid="${p.id}"><span class="avatar">${esc(p.code.split("-").pop())}</span><span class="pmeta"><span class="pname">${esc(p.code)}</span><span class="psub">${esc(p.age)} · ${esc(p.sex)} · ${esc(p.dx)}</span></span></button>`).join("") || `<div class="empty">No patients yet. Add one to start.</div>`}</div>`;
};

/* ---------- MotionPlus Tools ----------
   Posture and gait analysis run in the Tools space: the posture engine (posture/index.html) opens in a same-origin frame,
   gets the patient from here, and sends back a summary plus its session (landmarks, never photos) to save as an assessment. */
const TOOL_ART = {
  posture: `<svg viewBox="0 0 120 150" class="tart" aria-hidden="true"><defs><linearGradient id="tgp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd60a"/><stop offset="1" stop-color="#ff9f43"/></linearGradient></defs>
    <g stroke="#2e2b22" stroke-width="1">${[20, 40, 60, 80, 100, 120, 140].map(y => `<line x1="8" x2="112" y1="${y}" y2="${y}"/>`).join("")}</g>
    <line class="plumb" x1="62" x2="62" y1="6" y2="146" stroke="url(#tgp)" stroke-width="1.6" stroke-dasharray="4 4"/>
    <g fill="none" stroke="#f6f4ec" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="66" cy="22" r="9"/><path d="M64 31 Q58 52 60 74 L62 104 L60 140"/><path d="M62 104 L66 140"/><path d="M61 42 L70 64 L72 80"/></g>
    <g fill="#ffd60a">${[[66, 22], [61, 42], [60, 74], [62, 104], [61, 140]].map(([x, y]) => `<circle class="dot" cx="${x}" cy="${y}" r="3.2"/>`).join("")}</g></svg>`,
  gait: `<svg viewBox="0 0 150 150" class="tart" aria-hidden="true"><defs><linearGradient id="tgg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd60a" stop-opacity="0"/><stop offset="1" stop-color="#ffd60a"/></linearGradient></defs>
    <line x1="6" x2="144" y1="140" y2="140" stroke="#2e2b22" stroke-width="2"/>
    <g class="ghost g1" fill="none" stroke="#f6f4ec" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"><circle cx="40" cy="24" r="9"/><path d="M40 33 L42 78 L30 108 L26 138 M42 78 L52 108 L60 138 M41 44 L30 66 M41 44 L52 64"/></g>
    <g class="ghost g2" fill="none" stroke="#f6f4ec" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"><circle cx="70" cy="24" r="9"/><path d="M70 33 L72 78 L66 108 L64 138 M72 78 L76 108 L80 138 M71 44 L64 66 M71 44 L78 64"/></g>
    <g fill="none" stroke="#f6f4ec" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="24" r="9"/><path d="M100 33 L102 78 L114 106 L122 138 M102 78 L92 108 L84 138 M101 44 L112 66 M101 44 L90 64"/></g>
    <path d="M8 120 Q60 112 112 106" stroke="url(#tgg)" stroke-width="2" fill="none"/>
    <g fill="#ffd60a"><circle cx="102" cy="78" r="3.2"/><circle cx="114" cy="106" r="3.2"/><circle cx="92" cy="108" r="3.2"/></g></svg>`,
  goniometer: `<svg viewBox="0 0 150 150" class="tart" aria-hidden="true"><defs><linearGradient id="tgn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe866"/><stop offset="1" stop-color="#ff9f43"/></linearGradient></defs>
    <g stroke="#2e2b22" stroke-width="1.5">${[0, 30, 60, 90, 120, 150, 180].map(d => { const r = d * Math.PI / 180; return `<line x1="${(75 - 58 * Math.cos(r)).toFixed(1)}" y1="${(118 - 58 * Math.sin(r)).toFixed(1)}" x2="${(75 - 66 * Math.cos(r)).toFixed(1)}" y2="${(118 - 66 * Math.sin(r)).toFixed(1)}"/>`; }).join("")}</g>
    <path d="M17 118 A58 58 0 0 1 133 118" fill="none" stroke="#2e2b22" stroke-width="6"/>
    <path class="gsweep" d="M17 118 A58 58 0 0 1 106 69" fill="none" stroke="url(#tgn)" stroke-width="6" stroke-linecap="round" pathLength="100"/>
    <line x1="75" y1="118" x2="12" y2="118" stroke="#f6f4ec" stroke-width="4" stroke-linecap="round"/>
    <g class="garm"><line x1="75" y1="118" x2="112" y2="62" stroke="#f6f4ec" stroke-width="4" stroke-linecap="round"/><circle cx="112" cy="62" r="4" fill="#ffd60a"/></g>
    <circle cx="75" cy="118" r="7" fill="#ffd60a"/><text x="75" y="142" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="13" font-weight="600" fill="#ffd60a">0–180°</text></svg>`,
};
const TOOLS = {
  posture: { id: "posture", name: "Posture Analysis", tag: "Photo analysis", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v7l-1 7M12 14l1.5 7M12 9l3 3"/><path d="M5 3v18" stroke-dasharray="2 2.5"/></svg>',
    blurb: "Front, side and back photos. Landmarks are found on the device, then checked against the plumb line, spine curves and left-right balance.",
    feats: ["Plumb line", "Spine curves", "Body map", "Exercises"] },
  gait: { id: "gait", name: "Gait Analysis", tag: "Video analysis", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="13" cy="4.5" r="2"/><path d="M13 7l-1 6-3 3-1 5M12 13l3 3 1 5M12.5 9l-3 2M12.5 9l3 2"/><path d="M3 21h18" opacity=".5"/></svg>',
    blurb: "A short side and back walking video. Knee and hip motion through each stride, pelvic drop, cadence and step symmetry.",
    feats: ["Gait cycle", "Pelvic drop", "Cadence", "L/R symmetry"] },
  goniometer: { id: "goniometer", name: "Goniometer", tag: "Camera + tilt", cta: "Measure joint angles", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 19h15M5 19l9-12"/><path d="M10 19a5 5 0 0 0-2-4"/><circle cx="5" cy="19" r="1.4" fill="currentColor"/></svg>',
    blurb: "Any major joint, two ways: three points on a photo, or the phone's tilt sensor on the limb. Each movement opens on the method that measures it best.",
    feats: ["Camera angle", "Phone tilt", "Best of 3", "Saves to ROM"] },
};
const isTool = a => !!TPLMAP[a?.tid]?.tool;
function toolsPromo() {
  const n = db.assessments.filter(a => isTool(a) || isGonio(a)).length;
  return `<button class="promo" data-act="tab" data-tab="tools"><span class="promo-art">${TOOL_ART.posture}</span><span class="promo-txt"><span class="pro-chip">PRO</span><b>MotionPlus Tools</b><span>Posture, gait and joint angles${n ? ` · ${n} saved` : ""}</span></span><span class="promo-go" aria-hidden="true">›</span></button>`;
}
// Warm the posture engine while the clinician reads the Tools page, so the first analysis opens quickly.
function warmTools() { if (window.claude || document.getElementById("warmTools")) return;
  for (const [i, href] of ["posture/", "posture/vision_bundle.mjs"].entries()) document.head.insertAdjacentHTML("beforeend", `<link rel="prefetch" href="${href}"${i ? "" : ' id="warmTools"'}>`); }
VIEWS.tools = () => {
  chrome("tools"); warmTools();
  const recs = db.assessments.filter(a => isTool(a) || isGonio(a)).sort(byDate).reverse(), pts = new Set(recs.map(a => a.pid)).size;
  const count = k => recs.filter(a => k === GONIO ? isGonio(a) : a.tid === k).length;
  $("#app").innerHTML = `
  ${topHead("Tools")}
  <div class="stack">
    <section class="thero"><div class="thero-glow" aria-hidden="true"></div>
      <span class="pro-chip big">MOTIONPLUS PRO</span>
      <h2>Movement analysis, <em>on this device.</em></h2>
      <p class="note">Analyse posture and walking from photos and video, and measure joint angles with the camera or the phone's tilt sensor. Each result is saved straight into the patient's assessments, next to Berg, LEFS and the rest.</p>
      <div class="tstats"><div><b>${count("posture")}</b><span>Posture</span></div><div><b>${count("gait")}</b><span>Gait</span></div><div><b>${count(GONIO)}</b><span>Goniometer</span></div><div><b>${pts}</b><span>Patients</span></div></div>
    </section>
    <div class="tcards">${Object.values(TOOLS).map(k => `
      <article class="tcard">
        <div class="tcard-art">${TOOL_ART[k.id]}</div>
        <div class="tcard-body"><h3>${k.name}</h3><p class="note">${k.blurb}</p>
          <div class="tfeats">${k.feats.map(f => `<span>${f}</span>`).join("")}</div>
          <button class="primary" data-act="startForm" data-tid="${k.id}">${k.cta || `Start ${k.name.split(" ")[0].toLowerCase()} analysis`}</button></div>
      </article>`).join("")}</div>
    <h2 class="sec">Recent analyses</h2>
    <div>${recs.slice(0, 8).map(a => { const p = P(a.pid), t = getTpl(a), r = runScore(t, a.values, p); return `<button class="hist" data-act="result" data-id="${a.id}"><span class="trec">${TOOLS[isGonio(a) ? GONIO : t.tool].icon}</span><span class="grow"><b>${isGonio(a) ? "Goniometer" : esc(t.name)} · ${esc(p?.code || "")}</b><span class="psub">${fmt(a.date)} · ${esc(r.txt)}</span></span>${chip(r.band)}</button>`; }).join("") || `<div class="empty">No analyses yet. Start one above, or from a patient's page.</div>`}</div>
    <div class="privacy">${LOCK_IC}<p>Photos and videos are analysed on this phone or tablet and are never saved. Only scores, body landmarks and your notes are kept${pinKey ? ", encrypted with your PIN" : ". Set a PIN in Settings to encrypt them"}.</p></div>
  </div>`;
};
let toolCtx = null;
VIEWS.tool = (kind, pid, aid) => {
  const p = P(pid), k = TOOLS[kind]; if (!p || !k) return go("tools");
  chrome(null); document.body.classList.add("toolmode");
  toolCtx = { kind, pid, aid, shown: false };
  const inClaude = !!window.claude?.use;
  $("#app").innerHTML = `
  <header class="thead">${back(aid ? "result" : "patient", `data-id="${aid || pid}"`)}<div class="grow"><div class="brand">MOTIONPLUS <b class="pro">PRO</b> · TOOLS</div><h1>${k.name}</h1></div><span class="tpat">${esc(p.code)}</span></header>
  ${inClaude ? `<div class="stack tool-out"><div class="empty">Tools need the camera and the on-device analysis engine, which the Claude viewer blocks. Open MotionPlus Pro from its web address to use them.</div></div>`
    : `<div class="tframe-wrap"><div class="tload" id="tload"><div class="tload-art">${TOOL_ART[kind]}</div><b>Preparing ${k.name.toLowerCase()}</b><span>Loading the on-device engine…</span><i class="tbar"></i></div>
       <iframe id="toolFrame" class="tframe" title="${k.name} for ${esc(p.code)}" src="posture/?embed=${kind}" allow="camera; fullscreen"></iframe></div>`}`;
};
function toolInit() {
  const { kind, pid, aid } = toolCtx, p = P(pid), s = db.settings;
  const history = db.assessments.filter(a => a.pid === pid && isTool(a) && a.id !== aid && typeof a.values.session === "string").sort(byDate).map(a => ({ kind: a.tid, date: a.date, session: a.values.session }));
  return { type: "mp-init", mode: kind, patient: { code: p.code, age: p.age, sex: p.sex, dx: p.dx }, assessor: s.therapist || "",
    clinic: { name: s.clinic || "", logo: s.logo || "", phone: s.phone || "", email: s.email || "", address: s.address || "" },
    store: db.toolStore || {}, history, session: aid ? A(aid)?.values.session || null : null };
}
const toolLines = (x, n = 30) => Array.isArray(x) ? x.filter(v => typeof v === "string").slice(0, n).map(v => v.slice(0, 300)).join("\n") : "";
function toolSaved(m) {
  const { kind, pid, aid } = toolCtx, sm = m.summary || {}, n = Number(sm.score);
  if (m.kind !== kind || !(n >= 0 && n <= 100) || typeof m.session !== "string" || m.session.length > 3e6) { toast("That result could not be read. Try saving again."); return; }
  const values = { score: String(Math.round(n)), rating: typeof sm.rating === "string" ? sm.rating.slice(0, 80) : "", findings: toolLines(sm.findings), focus: toolLines(sm.focus), measures: toolLines(sm.measures, 40), session: m.session };
  const old = aid && A(aid), date = okDate(m.date) && m.date <= today() ? m.date : today();
  const rec = old ? { ...old, values, date } : { id: uid(), pid, tid: kind, date, values, notes: "", created: Date.now(), ...(db.settings.therapist ? { by: db.settings.therapist } : {}) };
  if (old) db.assessments[db.assessments.indexOf(old)] = rec; else db.assessments.push(rec);
  if (!save()) return; checkGoals(pid);
  toast(`${TOOLS[kind].name} saved to ${P(pid).code}`); if (!sessNote(kind, pid, rec.id)) go("result", rec.id);
}
addEventListener("message", e => {
  const f = $("#toolFrame"); if (!f || !toolCtx || e.source !== f.contentWindow) return;
  if (location.origin !== "null" && e.origin !== location.origin) return;
  const m = e.data || {}, to = location.origin === "null" ? "*" : location.origin;
  if (m.type === "mp-ready") f.contentWindow.postMessage(toolInit(), to);
  else if (m.type === "mp-shown") { toolCtx.shown = true; $("#tload")?.classList.add("done"); }
  else if (m.type === "mp-store" && (m.key === "mp.norms" || m.key === "mp.gaitNorms") && typeof m.value === "string" && m.value.length < 50000) { db.toolStore = { ...(db.toolStore || {}), [m.key]: m.value }; save(); }
  else if (m.type === "mp-result") toolSaved(m);
});

/*GONIO*/
/*SESSION*/
/*REASON*/
/*PILOT*/

/* ---------- Assessment form ---------- */
let draft = null;
function startForm(pid, tid, aid) {
  if (tid === "session") return go("plan", pid);
  if (!aid && (tid === GONIO || TPLMAP[tid]?.tool) && needConsent(pid, () => startForm(pid, tid))) return;
  if (tid === GONIO) return go("gonio", pid);
  const tt = TPLMAP[aid ? A(aid)?.tid : tid];
  if (tt?.tool) return go("tool", tt.tool, aid ? A(aid).pid : pid, aid || null);
  if (aid) { const a = A(aid); draft = JSON.parse(JSON.stringify(a)); }
  else { const t = allTpl().find(x => x.id === tid); draft = { id: uid(), pid, tid, date: today(), values: {}, notes: "", created: Date.now() };
    if (t.custom) draft.tpl = db.templates.find(x => x.id === tid);
    t.fields.forEach(f => { if (f.def != null) draft.values[f.id] = String(f.def); }); }
  if (db.settings.formMode !== "list") draft.g = aid ? gSteps(getTpl(draft)).length - 1 : 0; else draft.g = null;
  go("form");
}
VIEWS.form = () => {
  if (draft.g != null) return VIEWS.gform();
  const t = getTpl(draft), p = P(draft.pid);
  chrome(null, `<div class="score" id="live" aria-live="polite" aria-atomic="true"></div><button class="primary" data-act="saveA">Save</button>`);
  $("#app").innerHTML = `
  <header>${back(draft.created && A(draft.id) ? "result" : "library", A(draft.id) ? `data-id="${draft.id}"` : `data-pid="${draft.pid}"`)}<h1>${esc(t.name)}</h1><button class="ghost" data-act="gPaged">One per page</button></header>
  <div class="stack">
    <div class="psub">${esc(p.code)} · ${esc(p.age)} yrs · ${esc(p.sex)}</div>
    ${t.lic ? `<p class="note lic">${esc(t.lic)}</p>` : ""}
    <div class="field"><span class="label" id="adatel">Assessment date</span><div class="segc dates" role="group" aria-labelledby="adatel">${[[today(), "Today"], [daysAgo(1), "Yesterday"]].map(([v, l]) => `<button type="button" data-act="pickDate" data-v="${v}" aria-pressed="${draft.date === v}">${l}</button>`).join("")}
      <label id="adatelab" class="${[today(), daysAgo(1)].includes(draft.date) ? "" : "on"}"><span>${[today(), daysAgo(1)].includes(draft.date) ? "Earlier…" : fmtShort(draft.date)}</span><input id="adate" type="date" value="${draft.date}" max="${today()}" aria-label="Choose an earlier date"></label></div></div>
    <p class="note">${esc(t.desc)} Pick an earlier date to enter a paper form later. Every answer is saved as you go.</p>
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
      : `<button type="button" class="lrbtn${v[side] ? " set" : ""}" id="i_${id}_${side}" data-act="lrPick" data-f="${id}" data-k="${side}" aria-label="${esc(f.label)} ${side === "L" ? "left" : "right"}">${esc(v[side] || "–")}</button>`;
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
  const gb = $("#gbig"); if (gb) { gb.textContent = r.txt; $("#gband").innerHTML = chip(r.band); }
  el.innerHTML = `<b>${esc(r.txt)}</b><span>${r.of ? `${r.done}/${r.of} scored` : ""}${r.of && !r.done ? "" : `${r.of ? " · " : ""}${esc(r.band?.[0] || "")}`}</span>`;
}
function setVal(fid, k, val) {
  const v = draft.values;
  if (k) { const o = { ...(v[fid] || {}) }; if (val === "") delete o[k]; else o[k] = val; if (Object.keys(o).length) v[fid] = o; else delete v[fid]; }
  else if (val === "" || val == null) delete v[fid]; else v[fid] = val;
  updateLive(); keepDraft();
}

// Tool records read as findings, focus areas and measures instead of an item table.
function toolResult(a) {
  const ls = k => String(a.values[k] || "").split("\n").filter(Boolean), st = x => /: Treat/.test(x) ? "bad" : /: Train/.test(x) ? "warn" : /\(Normal\)/.test(x) ? "good" : "neutral";
  const f = ls("findings"), fo = ls("focus"), me = ls("measures");
  return `${f.length ? `<h2 class="sec">Key findings</h2><div class="chips">${f.map(x => `<span class="chip warn">${esc(x)}</span>`).join("")}</div>` : ""}
    ${fo.length ? `<h2 class="sec">Focus areas</h2><div class="focus">${fo.map(x => { const [head, ...rest] = x.split(" · "), [area, what] = head.split(": "); return `<div class="fcard ${st(x)}"><div><b>${esc(area)}</b><span class="chip ${st(x)}">${esc(what || "")}</span></div>${rest.length ? `<p>${esc(rest.join(" · "))}</p>` : ""}</div>`; }).join("")}</div>` : `<div class="empty">Every region is within normal range.</div>`}
    ${me.length ? `<h2 class="sec">Key measures</h2><div class="measures">${me.map(x => { const m = x.match(/^(.*?): (.*?) \((\w+)\)$/); return m ? `<div class="mrow"><span>${esc(m[1])}</span><b>${esc(m[2])}</b><i class="mdot ${st(x) === "neutral" ? (m[3] === "Treat" ? "bad" : "warn") : st(x)}" title="${esc(m[3])}"></i></div>` : `<div class="mrow"><span>${esc(x)}</span></div>`; }).join("")}</div>` : ""}`;
}
VIEWS.result = aid => {
  const a = A(aid); if (!a) return go("today"); const t = getTpl(a), p = P(a.pid), r = runScore(t, a.values, p), c = compare(t, a, p);
  const s = series(a.pid, a.tid), rep = db.reports.find(x => x.kind === "single" && x.aids[0] === aid);
  const pv = c?.prev?.values || {};
  chrome(null, `<button data-act="editA" data-id="${aid}">${t.tool ? "Open in Tools" : "Edit"}</button><button data-act="aiSingle" data-id="${aid}">✦ AI report</button><button class="primary" data-act="pdfA" data-id="${aid}">PDF</button>`);
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
    ${realityHTML(a)}
    ${s.length > 1 ? `<div class="chart">${chartSVG(s, t)}</div>` : ""}
    ${rep ? `<button class="hist" data-act="report" data-id="${rep.id}"><span class="grow"><b>AI report</b><span class="psub">Written ${fmt(rep.date)}${rep.edited ? " · edited" : ""}</span></span><span class="chip neutral">Open</span></button>` : ""}
    ${t.id === "rom" ? `<button class="ptool gz-again" data-act="startForm" data-tid="${GONIO}" data-pid="${a.pid}">${TOOLS.goniometer.icon}<span><b>Measure with Goniometer</b><small>Camera or phone tilt · adds to today's record</small></span><span class="pro-chip">PRO</span></button>` : ""}
    ${t.tool ? toolResult(a) : `<h2 class="sec">Item scores</h2>
    <div class="tablewrap" tabindex="0" role="region" aria-label="Item scores table"><table><thead><tr><th>Item</th><th class="n">${c ? fmtShort(a.date) : "Score"}</th>${c ? `<th class="n">${fmtShort(c.prev.date)}</th>` : ""}</tr></thead><tbody>
    ${t.fields.map(f => f.t === "head" ? `<tr class="trh"><td colspan="${c ? 3 : 2}">${esc(f.label)}</td></tr>` : (has(a.values[f.id]) || has(pv[f.id])) ? `<tr><td>${esc(f.label)}</td><td class="n">${esc(fmtVal(f, a.values[f.id]))}</td>${c ? `<td class="n muted">${esc(fmtVal(f, pv[f.id]))}</td>` : ""}</tr>` : "").join("")}
    </tbody></table></div>`}
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
  aiCtl?.abort(); aiCtl = new AbortController(); streaming = { id: rep.id, text: "" }; render();
  const ai = await getAI();
  if (!ai) { rep.text = basicReport(rep); rep.basic = true; rep.date = today(); rep.edited = false; save(); streaming = null;
    toast("Written without AI because " + aiWhy() + "."); if (view.name === "report") render(); return; }
  rep.basic = false;
  try {
    const { text, truncated } = await ai(reportPrompt(rep), { signal: aiCtl.signal, cache: false, modelTier: "default",
      onText: ({ text }) => { streaming.text = text; const el = $("#repbody"); if (el && view.args?.[0] === rep.id) el.innerHTML = md(text); } });
    rep.text = text + (truncated ? "\n\n(The report was cut short. Regenerate or shorten the notes.)" : ""); rep.date = today(); rep.edited = false; save();
  } catch (e) {
    if (e.text && e.code !== "refused") { rep.text = e.text; save(); }
    else if (e.code !== "cancelled" && !rep.text) { rep.text = basicReport(rep); rep.basic = true; save(); }
    if (e.code !== "cancelled") toast(aiMsg(e) + (rep.basic ? " A standard report was written instead." : ""));
  }
  streaming = null; if (view.name === "report") render();
}
// Standard report built from the scores alone, used when AI can't run.
function basicReport(rep) {
  const p = P(rep.pid), list = rep.aids.map(A).filter(Boolean).sort(byDate);
  const rows = list.map(a => { const t = getTpl(a); return { a, t, r: runScore(t, a.values, p), c: compare(t, a, p) }; });
  const latest = Object.values(rows.reduce((m, x) => (m[x.a.tid] = x, m), {}));
  const flagged = latest.filter(x => x.r.band[1] === "bad" || x.r.band[1] === "warn");
  const span = list.length ? (list[0].date === list.at(-1).date ? fmt(list[0].date) : `${fmt(list[0].date)} to ${fmt(list.at(-1).date)}`) : "";
  const L = [];
  L.push("## Summary", `${p.code} (${p.age} years, ${p.sex}; ${p.dx || "diagnosis not recorded"}) completed ${list.length} assessment${list.length === 1 ? "" : "s"} (${span}).` +
    (flagged.length ? ` Areas needing attention: ${flagged.map(x => `${x.t.short || x.t.name} (${x.r.band[0].toLowerCase()})`).join(", ")}.` : " All results are within expected ranges."));
  L.push("## Assessment findings");
  for (const { a, t, r, c } of rows) {
    L.push(`- **${t.name}** on ${fmt(a.date)}: **${r.txt}**, ${r.band[0].toLowerCase()}.${r.lines.length ? " " + r.lines.join(" ") : ""}${c && c.d != null ? ` Change since ${fmt(c.prev.date)}: ${c.d > 0 ? "+" : ""}${c.d}${t.unit ? " " + t.unit : ""}${c.meaningful == null || c.d === 0 ? "" : c.meaningful ? " (clinically meaningful)" : " (within measurement error)"}.` : ""}`);
    if (a.notes) L.push(`- Clinician notes: ${a.notes}`);
  }
  L.push("## Clinical interpretation");
  const trend = latest.filter(x => x.c && x.c.d != null && x.c.better != null && x.c.d !== 0);
  for (const x of trend) L.push(`- ${x.t.short || x.t.name} has ${x.c.better ? "improved" : "worsened"} by ${Math.abs(x.c.d)}${x.t.unit ? " " + x.t.unit : ""}${x.c.meaningful ? ", a clinically meaningful change" : x.c.meaningful === false ? ", which is within measurement error" : ""}.`);
  if (!trend.length) L.push("- This is a baseline assessment. Change can be judged at reassessment.");
  L.push("## Functional impact and risks");
  if (flagged.length) for (const x of flagged) L.push(`- ${x.t.name}: ${x.r.band[0]}.${x.r.alert ? " Urgent: " + x.r.lines[0] : ""}`);
  else L.push("- No high-risk findings on the tests completed.");
  L.push("## Goals");
  const goalable = flagged.filter(x => x.r.val != null && x.t.hb !== undefined);
  for (const x of goalable.slice(0, 3)) { const step = x.t.mcid || Math.max(1, Math.round((x.r.max || x.r.val || 10) * 0.1)), target = Math.round((x.t.hb ? x.r.val + step : Math.max(0, x.r.val - step)) * 100) / 100;
    L.push(`- Short term (4 weeks): ${x.t.short || x.t.name} ${x.t.hb ? "improves" : "reduces"} from ${x.r.txt} to ${x.t.hb ? "at least" : "no more than"} ${target}${x.t.unit && x.t.unit !== "/10" ? " " + x.t.unit : ""}.`); }
  if (!goalable.length) L.push("- Set goals with the patient based on their priorities.");
  L.push("- Long term: to be agreed with the patient and family.");
  L.push("## Recommendations and plan", `- Reassess ${latest.map(x => x.t.short || x.t.name).join(", ")} in 4 weeks to measure change.`, "- Treatment focus, frequency and home programme to be completed by the treating clinician.");
  L.push("## Summary for the patient and family", flagged.length ? `The tests show some areas where ${p.code} needs support, mainly ${flagged.slice(0, 2).map(x => (x.t.cat || x.t.name).toLowerCase()).join(" and ")}. Your therapist will explain the plan and the exercises that will help.` : "The tests show results within the expected range. Your therapist will explain how to keep progressing.");
  L.push("", "Standard report generated from scores without AI. Clinician review required before release.");
  return L.join("\n");
}
function md(s) {
  return s.split("\n").map(l => {
    const e = esc(l).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (/^#{1,3}\s/.test(l)) return `<h2>${e.replace(/^#{1,3}\s/, "")}</h2>`;
    if (/^\s*[-•]\s/.test(l)) return `<li>${e.replace(/^\s*[-•]\s/, "")}</li>`;
    return l.trim() ? `<p>${e}</p>` : "";
  }).join("").replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`);
}
let editingReport = false;
VIEWS.report = rid => {
  const rep = db.reports.find(r => r.id === rid); if (!rep) return go("today"); const p = P(rep.pid), s = db.settings;
  const live = streaming?.id === rid;
  chrome(null, live ? `<div class="score"><b>Writing…</b><span>Claude is drafting the report</span></div><button data-act="stopAI">Stop</button>`
    : editingReport ? `<button data-act="cancelEdit">Cancel</button><button class="primary" data-act="saveEdit" data-id="${rid}">Save text</button>`
    : `<button data-act="copyRep" data-id="${rid}">Copy</button><button data-act="editRep">Edit</button><button class="primary" data-act="pdfRep" data-id="${rid}">PDF</button>`);
  $("#app").innerHTML = `
  <header>${back("patient", `data-id="${rep.pid}"`)}<h1>${rep.kind === "progress" ? "Progress report" : "Assessment report"}</h1></header>
  <div class="stack">
    <div class="rephead"><img src="${s.logo || MP_LOGO}" alt="${s.logo ? "Clinic logo" : "MotionPlus Physio"}"><div><b>${esc(s.clinic || "MotionPlus Physio")}</b><div class="psub">${esc(p.code)} · ${rep.aids.length} assessment${rep.aids.length > 1 ? "s" : ""} · ${fmt(rep.date)}</div></div></div>
    <p class="note lic">${rep.basic ? `Standard report built from the scores, without AI. ${AI ? "Tap Regenerate for a full AI report." : "AI isn't on here because " + aiWhy() + "."} Edit before sharing.` : "AI-written draft. Check every statement against your findings and edit before sharing."}</p>
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
const LIBS = { pdf: ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"], docx: ["https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"], jspdf: ["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"] };
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
  const ai = await getAI();
  if (ai && (allText || (imgs.length && AI_IMG))) {
    setStatus(`Claude is reading the form${imgs.length ? ` (${imgs.length} page${imgs.length > 1 ? "s" : ""})` : ""}. This can take up to a minute…`);
    try {
      const sendImgs = AI_IMG ? imgs.slice(0, AI_IMG.maxCount) : [];
      const j = await ai.json(`${TPL_AI_PROMPT}\n\n${sendImgs.length ? `The form is shown in the ${sendImgs.length} attached image(s).` : ""}${allText ? `\nSource text or description:\n${allText}` : ""}`, { modelTier: "default", ...(sendImgs.length ? { images: sendImgs } : {}) });
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
  setStatus(imgs.length ? `Reading photos needs AI, but ${aiWhy()}. Upload a Word file or text PDF, or open the link in the Claude app or Chrome.` + note : "Nothing could be read from those files." + note, "bad");
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
    <h2 class="sec">${s.mode === "solo" ? "Your practice" : "Clinic"}</h2>
    <div class="field"><label class="label" for="sclinic">${s.mode === "solo" ? "Practice name (shown on reports)" : "Clinic name (shown on reports)"}</label><input id="sclinic" data-s="clinic" value="${esc(s.clinic)}" placeholder="e.g. Sunrise Rehab Centre"></div>
    <div class="row2"><div class="field"><label class="label" for="sbranch">Branch</label><input id="sbranch" data-s="branch" value="${esc(s.branch)}"></div>
      <div class="field"><label class="label" for="sther">${s.mode === "solo" ? "Your name" : "Assessor now"}</label><input id="sther" data-s="therapist" value="${esc(s.therapist)}" placeholder="Shown as assessor"></div></div>
    ${s.mode === "solo" ? "" : `<div class="field"><label class="label" for="steam">Therapists at this clinic</label><textarea id="steam" data-s="team" rows="3" placeholder="One name per line. Switch the assessor from the Today screen.">${esc(s.team || "")}</textarea><span class="note">Each assessment records who assessed it, and the change check warns when testers differ.</span></div>`}
    <div class="logo-row">${s.logo ? `<img src="${s.logo}" alt="Clinic logo" class="logo-prev">` : `<div class="logo-prev empty-logo">No logo</div>`}
      <div class="stack tight"><label class="filebtn"><input id="slogo" type="file" accept="image/png,image/jpeg,image/webp"><span>${s.logo ? "Change logo" : "Upload clinic logo"}</span></label>${s.logo ? `<button class="ghost" data-act="rmLogo">Remove logo</button>` : ""}</div></div>
    <p class="note">Reports always carry the MotionPlus Physio watermark. Your logo appears in the report header.</p>
    <div class="row2"><div class="field"><label class="label" for="sphone">Contact phone</label><input id="sphone" data-s="phone" type="tel" autocomplete="off" value="${esc(s.phone)}"></div>
      <div class="field"><label class="label" for="semail">Contact email</label><input id="semail" data-s="email" type="email" autocomplete="off" value="${esc(s.email)}"></div></div>
    <div class="field"><label class="label" for="saddr">Clinic address</label><input id="saddr" data-s="address" autocomplete="off" value="${esc(s.address)}"></div>
    <p class="note">Phone, email and address are printed in the footer of every PDF report page. Leave them empty to keep them off.</p>
    <div class="field"><label class="label" for="sprefix">Patient code prefix</label><input id="sprefix" data-s="prefix" value="${esc(s.prefix)}" maxlength="10"><span class="note">Next code: ${esc(nextCodePreview())}. Use a branch prefix like MP-B2 to keep codes unique across branches.</span></div>

    <h2 class="sec">Experience</h2>
    <div class="card list">
      <div class="srow"><span class="grow"><b>How you use MotionPlus</b><small>${s.mode === "solo" ? "Just you: your name goes on reports." : "A clinic: the clinic name and branch go on reports."}</small></span></div>
      <div class="segc" role="group" aria-label="How you use MotionPlus">${[["clinic", "Clinic"], ["solo", "Individual"]].map(([v, l]) => `<button data-act="setMode" data-v="${v}" aria-pressed="${(s.mode || "clinic") === v}">${l}</button>`).join("")}</div>
      <div class="srow"><span class="grow"><b>Assessment style</b><small>One question per page with tips, or every question on one page.</small></span></div>
      <div class="segc" role="group" aria-label="Assessment style">${[["guided", "One per page"], ["list", "All on one page"]].map(([v, l]) => `<button data-act="formMode" data-v="${v}" aria-pressed="${(s.formMode || "guided") === v}">${l}</button>`).join("")}</div>
      <div class="srow"><span class="grow"><b>Haptics</b><small>A short pulse when something is saved or needs attention. Android phones only; iPhone browsers don't allow it.</small></span>
        <button class="switch" role="switch" aria-checked="${s.haptics !== false}" data-act="haptics" data-v="${s.haptics === false ? "on" : "off"}" aria-label="Haptics"><i></i></button></div>
      <div class="srow"><span class="grow"><b>Text size</b><small>Makes every screen larger or smaller.</small></span></div>
      <div class="segc" role="group" aria-label="Text size">${[[0.92, "Small"], [1, "Default"], [1.12, "Large"], [1.25, "Largest"]].map(([v, l]) => `<button data-act="textSize" data-v="${v}" aria-pressed="${(s.textSize || 1) === v}" style="font-size:${Math.round(14 * v)}px">${l}</button>`).join("")}</div>
    </div>

    <h2 class="sec">PIN lock</h2>
    <p class="note">${pinKey ? "On. Records on this device are encrypted and the app asks for the PIN when it opens, after 5 minutes in the background, or after 10 minutes without use." : "Off. Anyone holding this device can open the records. Turn on a PIN to encrypt them on this device."} If the PIN is forgotten, records can only come back from a backup file.</p>
    ${pinKey ? `<div class="field"><label class="label" for="pin0">Current PIN</label><input id="pin0" type="password" inputmode="numeric" autocomplete="off" maxlength="16"></div>` : ""}
    <div class="row2"><div class="field"><label class="label" for="pin1">${pinKey ? "New PIN" : "PIN (6 to 16 digits)"}</label><input id="pin1" type="password" inputmode="numeric" autocomplete="new-password" maxlength="16"></div>
      <div class="field"><label class="label" for="pin2">Repeat ${pinKey ? "new " : ""}PIN</label><input id="pin2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="16"></div></div>
    <div class="actions"><button data-act="setPin">${pinKey ? "Change PIN" : "Turn on PIN lock"}</button>${pinKey ? `<button data-act="removePin">Turn off</button><button data-act="lockNow">Lock now</button>` : ""}</div>

    <h2 class="sec">Backup and transfer</h2>
    <p class="note">Records stay on this device only. Save an encrypted backup file to keep a copy or move patients to another branch's device.</p>
    <div class="field"><label class="label" for="bscope">What to include</label><select id="bscope"><option value="">All patients (${db.patients.length})</option>${db.patients.map(p => `<option value="${p.id}" ${transferPid === p.id ? "selected" : ""}>${esc(p.code)} only</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="bpw">Backup password</label><input id="bpw" type="password" autocomplete="new-password" placeholder="At least 6 characters"></div>
    <button data-act="backup">Save backup file</button>
    <div class="field"><label class="label" for="rfile">Restore or import a backup</label><input id="rfile" type="file" accept=".json,application/json"></div>
    <div class="field"><label class="label" for="rpw">Password for that file</label><input id="rpw" type="password" autocomplete="off"></div>
    <button data-act="restore">Import records</button>
    <p class="note">Importing adds patients and assessments. It never deletes what's already here.</p>

    ${pilotSettingsHTML()}

    <h2 class="sec">About</h2>
    <button data-act="about">About Inclusive.Si and MotionPlus Physio</button>

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
function downloadFile(filename, data, type) {
  try { const url = URL.createObjectURL(new Blob([data], { type })), a = document.createElement("a"); a.href = url; a.download = filename; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); toast("Downloaded " + filename); return true; }
  catch (e) { toast("This browser doesn't allow saving files from the app. Open the link in Chrome or the Claude app."); return false; }
}
async function doBackup() {
  const pw = $("#bpw").value, pid = $("#bscope").value; if (pw.length < 6) { toast("Choose a password of at least 6 characters."); return; }
  const pids = pid ? [pid] : db.patients.map(p => p.id);
  const as = db.assessments.filter(a => pids.includes(a.pid)), tids = new Set(as.map(a => a.tid));
  const data = { patients: db.patients.filter(p => pids.includes(p.id)), assessments: as, reports: db.reports.filter(r => pids.includes(r.pid)), templates: pid ? db.templates.filter(t => tids.has(t.id)) : db.templates, settings: pid ? undefined : { ...db.settings } };
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(pw, salt), new TextEncoder().encode(JSON.stringify(data))));
  const file = JSON.stringify({ app: "MotionPlus Assess", format: 1, created: new Date().toISOString(), salt: b64(salt), iv: b64(iv), data: b64(ct) });
  const name = pid ? `motionplus-${P(pid).code}-${today()}.json` : `motionplus-backup-${today()}.json`;
  // Inside Claude the viewer saves the file; in a normal browser it downloads directly.
  if (await (window.claude?.use ? saveFile(name, file) : downloadFile(name, file, "application/json"))) $("#bpw").value = "";
}
async function doRestore() {
  const f = $("#rfile").files?.[0], pw = $("#rpw").value; if (!f) { toast("Choose a backup file first."); return; }
  let data;
  try { const j = JSON.parse(await f.text()); if (j.app !== "MotionPlus Assess") throw 0;
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(j.iv) }, await keyFrom(pw, unb64(j.salt)), unb64(j.data)); data = JSON.parse(new TextDecoder().decode(pt)); }
  catch (e) { toast("That password doesn't open this file, or it isn't a MotionPlus backup."); return; }
  if (!data || typeof data !== "object") { toast("That password doesn't open this file, or it isn't a MotionPlus backup."); return; }
  const ids = k => new Set(db[k].map(x => x.id)); let np = 0, na = 0;
  const pIds = ids("patients"), aIds = ids("assessments"), rIds = ids("reports"), tIds = ids("templates");
  const P2 = cleanList(data.patients, cleanPatient), A2 = cleanList(data.assessments, cleanAssessment), R2 = cleanList(data.reports, cleanReport), T2 = cleanList(data.templates, cleanTpl), S2 = cleanSettings(data.settings);
  for (const p of P2.out) if (!pIds.has(p.id)) { db.patients.push(p); np++; }
  for (const a of A2.out) if (!aIds.has(a.id)) { db.assessments.push(a); na++; }
  for (const r of R2.out) if (!rIds.has(r.id)) db.reports.push(r);
  for (const t of T2.out) if (!tIds.has(t.id)) db.templates.push(t);
  if (S2 && !db.settings.clinic) Object.assign(db.settings, { ...S2, next: Math.max(db.settings.next, S2.next) });
  const skipped = P2.skipped + A2.skipped + R2.skipped + T2.skipped;
  if (save()) { toast(`Imported ${np} patients and ${na} assessments.${skipped ? ` ${skipped} damaged record${skipped > 1 ? "s were" : " was"} left out.` : ""}`); render(); }
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
  if (!window.jspdf) await need("jspdf").catch(() => {});
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
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text(pdfSafe(fmt(a.date) + (a.by ? "  ·  " + a.by : "")), W - M, y + 3.5, { align: "right" }); y += 7;
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
  // Clinic contact line above the footer rule, only when at least one contact field is filled; shrinks, then shortens, to fit one line.
  const contact = pdfSafe([s.phone && "Tel " + s.phone, s.email, s.address].map(x => String(x || "").replace(/\s+/g, " ").trim()).filter(x => x && x !== "Tel").join("  ·  "));
  let cSize = 7, cLine = contact;
  if (contact) { doc.setFont("helvetica", "normal"); doc.setFontSize(cSize); while (cSize > 5.5 && doc.getTextWidth(contact) > CW) doc.setFontSize(cSize -= 0.5);
    if (doc.getTextWidth(contact) > CW) { while (cLine.length > 1 && doc.getTextWidth(cLine + "...") > CW) cLine = cLine.slice(0, -1); cLine = cLine.trimEnd() + "..."; } }
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor(217, 226, 223); doc.line(M, 287, W - M, 287); try { doc.addImage(JC_SIG, "PNG", W - 13, 289.5, 9, 5.96); } catch (e) {} doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    doc.text(pdfSafe(`MotionPlus Physio  ·  ${p.code}  ·  Confidential clinical record`), M, 291); doc.text(`Page ${i} of ${n}`, W - M, 291, { align: "right" });
    if (contact) { doc.setFontSize(cSize); doc.text(cLine, W / 2, 285, { align: "center" }); } }
  // Carry the results inside the PDF so this report can be uploaded again later for comparison (see importReport).
  const { notes, ...pd } = p, payload = { app: "MotionPlus Assess", format: 1, patient: pd, assessments: aids.map(A).filter(Boolean) };
  doc.setProperties({ title: pdfSafe(`${title} ${p.code}`), subject: "MotionPlus Pro report", creator: "MotionPlus Pro", keywords: "MPA1:" + b64(new TextEncoder().encode(JSON.stringify(payload))) });
  await saveFile(`${p.code}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${today()}.pdf`, doc.output("blob"));
}
function pdfChart(doc, x, y, w, h, s, t, C) {
  const [lo, hi] = chartRange(s, t);
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
function armed(key, btn, label) { if (confirmArm[key] && Date.now() - confirmArm[key] < 4000) return true; confirmArm[key] = Date.now(); hz("warn"); btn.textContent = label; return false; }
/* ---------- Checking imported records ---------- */
// Backup files and uploaded PDF reports can come from anywhere, so each record is checked before it is stored:
// ids and dates must be plain, text stays text, numbers stay numbers, and anything else is left out.
// This stops a doctored file from slipping page code into the app through an id, date, template field or logo.
const okId = x => typeof x === "string" && /^[\w-]{1,64}$/.test(x);
const okDate = x => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x);
const txt = x => typeof x === "string" ? x : typeof x === "number" && isFinite(x) ? String(x) : "";
const numOr = x => typeof x === "number" ? (isFinite(x) ? x : undefined) : typeof x === "string" && x.trim() !== "" && isFinite(x) ? +x : undefined;
const FIELD_TYPES = ["head", "scale", "sel", "check", "num", "lrnum", "lrsel", "text", "area"], ITEM_KINDS = ITEM_TYPES.map(x => x[0]);
function cleanVal(x) {
  if (typeof x === "string" || (typeof x === "number" && isFinite(x))) return x;
  if (Array.isArray(x)) return x.filter(v => typeof v === "string" || (typeof v === "number" && isFinite(v)));
  if (x && typeof x === "object") { const o = {}; for (const k of ["L", "R"]) if (typeof x[k] === "string" || (typeof x[k] === "number" && isFinite(x[k]))) o[k] = x[k]; return o; }
}
function cleanTpl(t) {
  if (!t || typeof t !== "object" || !okId(t.id) || !Array.isArray(t.fields)) return null;
  const fields = t.fields.filter(f => f && FIELD_TYPES.includes(f.t) && (f.id == null || okId(f.id))).map(f => {
    const o = { t: f.t, label: txt(f.label) }; if (f.id != null) o.id = f.id; if (f.noscore) o.noscore = true;
    for (const k of ["unit", "hint", "g"]) if (f[k] != null) o[k] = txt(f[k]);
    for (const k of ["normal", "max", "step", "def", "base"]) { const n = numOr(f[k]); if (n !== undefined) o[k] = n; }
    if (Array.isArray(f.opts)) o.opts = f.t === "scale" ? f.opts.map(x => Array.isArray(x) ? [numOr(x[0]) ?? 0, txt(x[1])] : txt(x)) : f.opts.map(txt);
    return o;
  }).filter(f => !["scale", "sel", "check", "lrsel"].includes(f.t) || f.opts?.length);
  const o = { id: t.id, custom: true, v: numOr(t.v) ?? 0, name: txt(t.name) || "Untitled template", short: txt(t.short), disc: (Array.isArray(t.disc) ? t.disc : []).map(txt).filter(Boolean),
    cat: txt(t.cat) || "Custom", desc: txt(t.desc), fields, bands: (Array.isArray(t.bands) ? t.bands : []).filter(b => b && numOr(b.min) !== undefined && numOr(b.max) !== undefined).map(b => ({ min: numOr(b.min), max: numOr(b.max), label: txt(b.label) })),
    items: (Array.isArray(t.items) ? t.items : []).filter(it => it && ITEM_KINDS.includes(it.type)).map(it => ({ type: it.type, label: txt(it.label), opts: txt(it.opts), unit: txt(it.unit) })), bandsText: txt(t.bandsText) };
  if (!o.disc.length) o.disc = ["General"];
  if (typeof t.hb === "boolean") o.hb = t.hb;
  for (const k of ["mcid", "max"]) { const n = numOr(t[k]); if (n !== undefined) o[k] = n; }
  for (const k of ["unit", "lic", "mcidNote"]) if (t[k] != null) o[k] = txt(t[k]);
  return fields.length ? o : null;
}
function cleanPatient(p, needId = true) {
  if (!p || typeof p !== "object" || (needId && !okId(p.id)) || !txt(p.code).trim()) return null;
  const o = { code: txt(p.code).trim(), age: typeof p.age === "number" && isFinite(p.age) ? p.age : txt(p.age), sex: txt(p.sex), dx: txt(p.dx), ref: txt(p.ref), branch: txt(p.branch), notes: txt(p.notes), created: numOr(p.created) ?? Date.now() };
  if (needId) o.id = p.id; if (p.ex === true) o.ex = true;
  if (p.consent && okDate(p.consent.media)) o.consent = { media: p.consent.media };
  if (Array.isArray(p.goals)) o.goals = p.goals.filter(g => g && txt(g.text).trim() && okDate(g.by) && okDate(g.from) && (!g.tid || (okId(g.tid) && isFinite(g.base) && isFinite(g.target)))).slice(0, 30).map(g => ({ id: okId(g.id) ? g.id : uid(), tid: g.tid ? g.tid : "", ...(okId(g.f) ? { f: g.f } : {}), ...(g.s === "L" || g.s === "R" ? { s: g.s } : {}), ...(g.tid ? { base: +g.base, target: +g.target } : {}), hb: !!g.hb, note: txt(g.note).slice(0, 200), unit: txt(g.unit).slice(0, 12), by: g.by, from: g.from, text: txt(g.text).slice(0, 160), ...(okDate(g.met) ? { met: g.met } : {}), created: numOr(g.created) ?? Date.now() }));
  return o;
}
function cleanAssessment(a) {
  if (!a || typeof a !== "object" || !okId(a.id) || !okId(a.pid) || !okId(a.tid) || !okDate(a.date)) return null;
  const values = {}; if (a.values && typeof a.values === "object") for (const [k, v] of Object.entries(a.values)) { const c = okId(k) ? cleanVal(v) : undefined; if (c !== undefined) values[k] = c; }
  const o = { id: a.id, pid: a.pid, tid: a.tid, date: a.date, values, notes: txt(a.notes), created: numOr(a.created) ?? Date.now() };
  if (txt(a.by).trim()) o.by = txt(a.by).trim().slice(0, 80);
  if (a.tpl != null) { o.tpl = cleanTpl(a.tpl); if (!o.tpl) return null; }
  return o;
}
function cleanReport(r) {
  if (!r || typeof r !== "object" || !okId(r.id) || !okId(r.pid) || !Array.isArray(r.aids) || !r.aids.length || !r.aids.every(okId) || !okDate(r.date)) return null;
  return { id: r.id, pid: r.pid, aids: r.aids.slice(), kind: r.kind === "progress" ? "progress" : "single", date: r.date, text: txt(r.text), basic: r.basic === true, edited: r.edited === true };
}
function cleanSettings(s) {
  if (!s || typeof s !== "object") return null;
  const o = {}; for (const k of ["clinic", "branch", "therapist", "prefix", "phone", "email", "address"]) if (s[k] != null) o[k] = txt(s[k]);
  if ("logo" in s) { o.logo = typeof s.logo === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(s.logo) ? s.logo : null; const ar = numOr(s.logoAR); o.logoAR = ar > 0 ? ar : 1; }
  o.next = Math.max(1, Math.floor(numOr(s.next) || 1));
  return o;
}
// Cleans a list, counting what had to be left out.
function cleanList(list, fn) { const arr = Array.isArray(list) ? list : [], out = arr.map(x => fn(x)).filter(Boolean); return { out, skipped: arr.length - out.length }; }

/* ---------- Upload an old report ---------- */
const NO_DATA = "This PDF has no MotionPlus results inside. Only reports saved from the app from 12 Oct 2026 onwards can be uploaded.";
async function importReport(file) {
  if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) { toast("Choose a PDF report saved from MotionPlus."); return; }
  try { await need("pdf"); } catch (e) { toast("The PDF reader didn't load. Check the internet connection and try again."); return; }
  let data;
  try { const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise, kw = (await pdf.getMetadata()).info?.Keywords || "";
    if (!kw.startsWith("MPA1:")) throw 0; data = JSON.parse(new TextDecoder().decode(unb64(kw.slice(5)))); if (data.app !== "MotionPlus Assess" || !data.patient?.code) throw 0; }
  catch (e) { toast(NO_DATA); return; }
  const cp = cleanPatient(data.patient, false); if (!cp) { toast(NO_DATA); return; }
  let p = db.patients.find(x => x.code === cp.code), added = 0;
  if (!p) { p = { ...cp, id: uid(), created: Date.now(), ex: false }; db.patients.unshift(p); }
  const have = new Set(db.assessments.map(a => a.id));
  // The pid check is skipped (records are moved onto this device's patient), so a missing pid is filled before cleaning.
  for (const raw of Array.isArray(data.assessments) ? data.assessments : []) { const a = cleanAssessment(raw && { ...raw, pid: p.id });
    if (a && !have.has(a.id) && (a.tpl || TPLMAP[a.tid])) { db.assessments.push(a); added++; } }
  save(); go("patient", p.id);
  toast(added ? `Added ${added} assessment${added > 1 ? "s" : ""} for ${p.code} from the old report. New results will be compared with them.` : `Everything in this report is already on this device for ${p.code}.`);
}

/* ---------- PIN lock screen ---------- */
let lockMsg = "";
VIEWS.lock = () => {
  chrome(null);
  $("#app").innerHTML = `<div class="lock">${RP_MARK("rpmark lockmark")}<h1>MotionPlus <span class="pro-word">Pro</span></h1><p class="note">Enter your PIN to open the patient records on this device.</p>
    <form id="lockform"><label class="label" for="pinin">PIN</label><input id="pinin" type="password" inputmode="numeric" autocomplete="off" maxlength="16" required>
    <p class="err" role="alert">${esc(lockMsg)}</p><button class="primary" type="submit">Unlock</button></form>
    <button class="link-danger" data-act="forgotPin">Forgot PIN?</button></div>`;
  setTimeout(() => $("#pinin")?.focus(), 50);
};
async function tryUnlock() {
  const t = JSON.parse(localStorage.getItem(TRIES) || "{}"), wait = Math.ceil(((t.until || 0) - Date.now()) / 1000);
  if (wait > 0) { lockMsg = `Too many wrong tries. Wait ${wait} seconds.`; render(); return; }
  const pin = $("#pinin").value; if (!pin) return;
  $("#lockform button").disabled = true;
  try { const o = await openLock(pin); pinKey = o.key; pinSalt = o.salt; db = o.data; locked = false; lockMsg = ""; localStorage.removeItem(TRIES);
    const pd = db.pendingDraft; delete db.pendingDraft;
    applyPrefs(); if (pd) { draft = pd; go("form"); } else home(); }
  catch (e) { const n = (t.n || 0) + 1; localStorage.setItem(TRIES, JSON.stringify({ n, until: n >= 5 ? Date.now() + 30000 * 2 ** (n - 5) : 0 }));
    lockMsg = n >= 5 ? "Wrong PIN. Too many tries, wait 30 seconds." : `Wrong PIN. ${5 - n} tr${5 - n === 1 ? "y" : "ies"} left before a short wait.`; render(); }
}
async function lockNow() {
  if (!pinKey || locked) return;
  if (view.name === "form" && draft) { db.pendingDraft = draft; save(); }
  await encQueue; db = emptyDb(); draft = null; pinKey = null; locked = true; lockMsg = ""; go("lock");
}
// Lock after 5 minutes in the background or 10 minutes without a tap. An open form is kept and reopened after unlocking.
let lastUse = Date.now(), hiddenAt = 0;
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, () => { lastUse = Date.now(); }, true));
document.addEventListener("visibilitychange", () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 5 * 60000) lockNow(); });
setInterval(() => { if (pinKey && Date.now() - lastUse > 10 * 60000) lockNow(); }, 30000);
// New PINs only (existing PINs still unlock): refuse one repeated digit, a short repeated block (121212, 123123) and runs up or down (123456, 987654).
function weakPin(pin) {
  if (/^(\d{1,3})\1+$/.test(pin)) return true;
  const d = [...pin].map(Number), up = d.every((x, i) => !i || x === (d[i - 1] + 1) % 10), down = d.every((x, i) => !i || x === (d[i - 1] + 9) % 10);
  return up || down;
}
async function setPin() {
  const cur = $("#pin0")?.value, a = $("#pin1").value, b = $("#pin2").value;
  if (pinKey) { try { await openLock(cur); } catch (e) { toast("The current PIN isn't right."); return; } }
  if (!/^\d{6,16}$/.test(a)) { toast("Use 6 to 16 digits for the PIN."); return; }
  if (weakPin(a)) { toast("That PIN is too easy to guess. Avoid repeated digits and runs like 123456."); return; }
  if (a !== b) { toast("The two PINs don't match."); return; }
  pinSalt = crypto.getRandomValues(new Uint8Array(16)); pinKey = await keyFrom(a, pinSalt);
  await encWrite(JSON.stringify(db)); if (localStorage.getItem(LOCK)) localStorage.removeItem(STORE);
  toast(cur ? "PIN changed." : "PIN lock is on. The app asks for it each time it opens."); render();
}
async function removePin() {
  try { await openLock($("#pin0").value); } catch (e) { toast("The current PIN isn't right."); return; }
  await encQueue; pinKey = null; pinSalt = null;
  if (save()) localStorage.removeItem(LOCK); toast("PIN lock is off."); render();
}

const ACT = {
  ...GZ_ACT,
  ...UX_ACT,
  ...SESS_ACT,
  ...REASON_ACT,
  ...PILOT_ACT,
  toastAct: () => { const fn = toast.fn; $("#toast").hidden = true; toast.fn = null; fn?.(); },
  about: () => go("about"),
  lockNow: () => lockNow(),
  setPin: () => setPin(),
  removePin: () => removePin(),
  forgotPin: (d, b) => { if (!armed("fp", b, "Tap again to erase this device's records and start again")) return;
    localStorage.removeItem(LOCK); localStorage.removeItem(STORE); localStorage.removeItem(TRIES); locked = false; pinKey = null; db = emptyDb(); db.settings.next = 1; save(); toast("Records erased. Restore a backup file in Settings to bring them back."); home(); },
  tab: d => go(d.tab),
  patient: d => go("patient", d.id),
  newPatient: d => go("editPatient", null, d.then),
  editPatient: d => go("editPatient", d.id),
  savePatient: d => {
    const code = $("#pcode").value.trim(); if (!code) { toast("Enter a patient code."); return; }
    if (db.patients.some(p => p.code === code && p.id !== d.id)) { toast("That code is already in use."); return; }
    const age = $("#page").value; if (age !== "" && !(+age >= 0 && +age <= 120)) { toast("Enter an age between 0 and 120 years."); $("#page").focus(); return; }
    if ($("#page").validity.badInput) { toast("Enter the age as a number."); $("#page").focus(); return; }
    const vals = { code, age: $("#page").value, sex: $("#psex").value, dx: $("#pdx").value.trim(), ref: $("#pref").value.trim(), branch: $("#pbr").value.trim(), notes: $("#pnotes").value.trim() };
    let p; if (d.id) { p = P(d.id); Object.assign(p, vals); } else { p = { id: uid(), created: Date.now(), ...vals }; if (code === nextCodePreview()) nextCode(); db.patients.unshift(p); }
    if (!save()) return; d.id ? toast("Changes saved") : celebrate("Patient added"); d.then ? startForm(p.id, d.then) : go("patient", p.id);
  },
  delPatient: d => { const snap = { p: db.patients.slice(), a: db.assessments.slice(), r: db.reports.slice(), dr: db.draft };
    db.assessments = db.assessments.filter(a => a.pid !== d.id); db.reports = db.reports.filter(r => r.pid !== d.id); db.patients = db.patients.filter(p => p.id !== d.id); if (db.draft?.pid === d.id) db.draft = null; save();
    navNext = "back"; go("patients"); undoable("Patient deleted", () => { db.patients = snap.p; db.assessments = snap.a; db.reports = snap.r; db.draft = snap.dr; }); },
  library: d => go("library", d.pid || null),
  disc: d => { libDisc = d.d; document.querySelectorAll("[data-act=disc]").forEach(b => b.setAttribute("aria-pressed", b.dataset.d === libDisc)); listTemplates(view.args?.[0]); },
  startForm: d => d.pid ? startForm(d.pid, d.tid) : db.patients.length ? go("pickPatient", d.tid) : go("editPatient", null, d.tid),
  pick: (d, b) => { const t = getTpl(draft), f = t.fields.find(x => x.id === d.f), v = f.t === "scale" ? +d.v : d.v;
    const same = String(draft.values[d.f]) === String(v); setVal(d.f, null, same ? "" : v);
    b.parentNode.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", !same && x === b));
    if (!same && draft.g != null && view.name === "form") { hz("tick"); const g = draft.g; setTimeout(() => { if (draft?.g === g && view.name === "form") gMove(g + 1); }, 280); } },
  toggle: (d, b) => { const cur = draft.values[d.f] || [], on = cur.includes(d.v); const nx = on ? cur.filter(x => x !== d.v) : [...cur, d.v]; setVal(d.f, null, nx.length ? nx : ""); b.setAttribute("aria-pressed", !on); },
  saveA: () => { draft.date = $("#adate").value || today(); if (!draft.by && db.settings.therapist) draft.by = db.settings.therapist; draft.notes = $("#anotes").value.trim();
    if (!Object.keys(draft.values).some(k => { const f = getTpl(draft).fields.find(x => x.id === k); return f?.def == null || String(draft.values[k]) !== String(f.def); }) && !draft.notes) { toast("Record at least one item before saving."); return; }
    const i = db.assessments.findIndex(a => a.id === draft.id); if (i >= 0) db.assessments[i] = draft; else db.assessments.push(draft);
    db.draft = null; if (!save()) return; celebrate("Assessment saved"); checkGoals(draft.pid); const id = draft.id, sid = draft.sid, tid = draft.tid, pid = draft.pid; draft = null; tmStop();
    if (!(sid && sessNote(tid, pid, id, sid))) go("result", id); },
  result: d => go("result", d.id),
  editA: d => startForm(null, null, d.id),
  delA: d => { const a = A(d.id), snap = { a: db.assessments.slice(), r: db.reports.slice() }; db.assessments = db.assessments.filter(x => x.id !== d.id); db.reports = db.reports.filter(r => !r.aids.includes(d.id) || r.kind === "progress"); save();
    navNext = "back"; go("patient", a.pid); undoable("Assessment deleted", () => { db.assessments = snap.a; db.reports = snap.r; }); },
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
  pdfBack: () => { const b = pdfPreview?.back; pdfPreview = null; b?.name ? go(b.name, ...(b.args || [])) : go("today"); },
  rmLogo: () => { db.settings.logo = null; save(); render(); },
  backup: () => doBackup(),
  restore: () => doRestore(),
  clearEx: (d, b) => { if (!armed("cx", b, "Tap again to remove examples")) return; const ids = new Set(db.patients.filter(p => p.ex).map(p => p.id));
    db.patients = db.patients.filter(p => !ids.has(p.id)); db.assessments = db.assessments.filter(a => !ids.has(a.pid)); db.reports = db.reports.filter(r => !ids.has(r.pid)); save(); toast("Examples removed"); render(); },
  wipe: (d, b) => { if (!armed("wipe", b, "Tap again to erase everything on this device")) return; pinKey = null; localStorage.removeItem(LOCK); db = { ...seed(), patients: [], assessments: [] }; db.settings.next = 1; save(); toast("All data deleted"); home(); },
};
let previewTpl = null;
VIEWS.about = () => {
  chrome(null);
  if (!document.getElementById("isiFonts")) document.head.insertAdjacentHTML("beforeend", '<link id="isiFonts" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap">');
  $("#app").innerHTML = `<header>${back("tab", 'data-tab="settings"')}<h1>About</h1></header>`;
  $("#app").append($("#aboutTpl").content.cloneNode(true));
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) document.querySelectorAll("#isi-about svg").forEach(s => s.pauseAnimations?.());
};
VIEWS.pdfview = () => {
  const v = pdfPreview; chrome(null, `<button class="primary wide" data-act="pdfBack">Done</button>`);
  $("#app").innerHTML = `<header>${back("pdfBack")}<h1>Report pages</h1></header>
  <div class="stack"><p class="note lic">This browser blocked saving the PDF file. Press and hold a page to save or share it as an image, or open the link in Chrome or the Claude app to save the PDF.</p>
  ${v.pages.map((src, i) => `<img class="pdfpage" src="${src}" alt="Page ${i + 1} of ${esc(v.filename)}">`).join("")}</div>`;
};
VIEWS.preview = () => {
  const t = previewTpl; chrome(null, `<button class="primary wide" data-act="backToBuilder">Back to editing</button>`);
  $("#app").innerHTML = `<header>${back("backToBuilder")}<h1>${esc(t.name)}</h1></header><p class="note">Preview only. Taps here aren't saved.</p><div class="form">${formFields(t, {})}</div>`;
};

document.addEventListener("click", e => {
  if (e.target.closest("[data-close]")) { closeSheet(); return; }
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  if (b.classList.contains("back")) navNext = "back";
  if (sheetEl && b.closest(".sheet") && b.dataset.act !== "lrPick") closeSheet();
  if (view.name === "preview" && (b.dataset.act === "pick" || b.dataset.act === "toggle")) { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); return; }
  const fn = ACT[b.dataset.act]; if (fn) { e.preventDefault(); fn(b.dataset, b, e); }
});
document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "q") { q = el.value; listPatients(); return; }
  if (el.id === "libq") { libQ = el.value; listTemplates(view.args?.[0]); return; }
  if (el.dataset.f && draft && view.name === "form") { setVal(el.dataset.f, el.dataset.k, el.value); return; }
  if (el.dataset.s) { db.settings[el.dataset.s] = el.value.trim(); clearTimeout(save.t); save.t = setTimeout(save, 400); return; }
  if (el.id === "adate" && draft && el.value) ACT.pickDate({ v: el.value > today() ? today() : el.value });
  if (el.id === "anotes" && draft) { draft.notes = el.value; keepDraft(); }
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.f && draft && view.name === "form") setVal(el.dataset.f, el.dataset.k, el.value);
  if (el.id === "slogo" && el.files[0]) setLogo(el.files[0]);
  if (el.classList.contains("oldrep") && el.files[0]) { const f = el.files[0]; el.value = ""; closeSheet(true); importReport(f); }
  if (el.id === "tplfile" && el.files.length) { syncBuilder(); upFiles.push(...el.files); tplStatus = null; render(); }
  if (el.dataset.tk === "type") { syncBuilder(); render(); }
  if (el.id === "sprefix") render();
});

document.addEventListener("submit", e => { if (e.target.id === "lockform") { e.preventDefault(); tryUnlock(); } });
document.documentElement.lang = "en";
function home() { go(db.settings.welcomed || db.patients.some(p => !p.ex) ? "today" : "welcome", 0); }
applyPrefs(); splash();
if (locked) go("lock"); else { home(); if (!db.settings.welcomed && view.name === "today") db.settings.welcomed = 1; }
// Home-screen shortcuts open straight into a task.
{ const sc = new URLSearchParams(location.search).get("go"); if (sc && !locked && view.name === "today") { if (sc === "newPatient") go("editPatient", null); else if (sc === "gonio") ACT.startForm({ tid: GONIO }); } }
// Load the PDF tool once the first screen is up, so reports still work if the connection drops later.
setTimeout(() => need("jspdf").catch(() => {}), 1500);
// Offline and fast reopen when served from the web (the Claude viewer has its own caching).
if ("serviceWorker" in navigator && !window.claude && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").then(watchUpdates).catch(() => {});
