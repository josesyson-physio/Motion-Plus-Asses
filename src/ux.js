/* ---------- Native feel ----------
   Brand mark, haptics, bottom sheets, screen transitions, back gestures, count-ups, the save tick and the update prompt.
   Motion follows the phone's Reduce Motion setting. Haptics are short single pulses at moments that matter (save, warning,
   a timer event), never on every tap, and only on phones that support them (Android); iPhone gets the visual feedback alone. */
const RP_MARK = (cls = "rpmark") => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 50V12M50 50V88M50 50H12M50 50H88" stroke="currentColor" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M72.33 44.43A23 23 0 0 0 55.57 27.67" fill="none" stroke="url(#rpGold)" stroke-width="6.5" stroke-linecap="round"/><circle cx="50" cy="50" r="7" fill="url(#rpGold)"/></svg>`;
// The mark drawn stroke by stroke: four arms grow from the centre, then the angle arc sweeps open.
const RP_DRAW = `<svg class="rpdraw" viewBox="0 0 100 100" aria-hidden="true"><g stroke="currentColor" stroke-width="11" stroke-linecap="round" fill="none">${["M50 50V12", "M50 50H88", "M50 50V88", "M50 50H12"].map((d, i) => `<path d="${d}" pathLength="1" style="--i:${i}"/>`).join("")}</g><path class="arc" d="M55.57 27.67A23 23 0 0 1 72.33 44.43" pathLength="1" fill="none" stroke="url(#rpGold)" stroke-width="6.5" stroke-linecap="round"/><circle class="dot" cx="50" cy="50" r="7" fill="url(#rpGold)"/></svg>`;
const WORDMARK = `<div class="wordmark"><b>Motion<span>Plus</span></b><span class="pro-chip">PRO</span></div>`;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const HZ = { tap: 8, tick: 5, success: [12, 70, 20], warn: [26, 60, 26] };
function hz(kind) { if (db?.settings?.haptics === false) return; try { navigator.vibrate?.(HZ[kind] || 8); } catch (e) {} }

function applyPrefs() {
  const s = db.settings || {};
  document.documentElement.style.setProperty("--z", String(s.textSize || 1));
  document.documentElement.dataset.mode = s.mode || "";
}

/* Bottom sheets: used for the + menu and for any pick-one list, so nothing opens a browser drop-down. */
let sheetEl = null, sheetReturn = null;
const sitem = (icon, label, sub, attrs) => `<button class="sitem" ${attrs}><span class="sic">${icon}</span><span class="grow"><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span><span class="chev" aria-hidden="true">›</span></button>`;
function openSheet(title, body) {
  closeSheet(true); sheetReturn = document.activeElement;
  const w = document.createElement("div"); w.className = "sheet-wrap";
  w.innerHTML = `<div class="sheet-bg" data-close></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetT"><div class="grab" aria-hidden="true"></div><h2 class="sheet-t" id="sheetT">${esc(title)}</h2><div class="sheet-body">${body}</div></div>`;
  document.body.append(w); sheetEl = w; document.body.classList.add("sheet-open");
  requestAnimationFrame(() => w.classList.add("open"));
  setTimeout(() => (w.querySelector("[aria-pressed=true]") || w.querySelector(".sheet-body button,.sheet-body input,.sheet-body label"))?.focus({ preventScroll: true }), 40);
  dragToClose(w.querySelector(".sheet"));
}
function closeSheet(now) {
  const w = sheetEl; if (!w) return; sheetEl = null; document.body.classList.remove("sheet-open");
  if (now === true || reduced()) w.remove(); else { w.classList.remove("open"); setTimeout(() => w.remove(), 280); }
  if (sheetReturn?.isConnected) sheetReturn.focus({ preventScroll: true }); sheetReturn = null;
}
function dragToClose(sh) {
  let y0 = null, dy = 0;
  sh.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" || sh.querySelector(".sheet-body").scrollTop > 0 || e.target.closest("input,textarea")) return; y0 = e.clientY; dy = 0; });
  sh.addEventListener("pointermove", e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); if (dy > 6) { sh.style.transition = "none"; sh.style.transform = `translateY(${dy}px)`; } });
  const end = () => { if (y0 == null) return; y0 = null; sh.style.transition = ""; sh.style.transform = ""; if (dy > 90) closeSheet(); };
  sh.addEventListener("pointerup", end); sh.addEventListener("pointercancel", end);
}
document.addEventListener("keydown", e => {
  if (!sheetEl) return;
  if (e.key === "Escape") { e.preventDefault(); closeSheet(); return; }
  if (e.key !== "Tab") return;
  const f = [...sheetEl.querySelectorAll("button,input,label.sitem,[tabindex='0']")].filter(x => !x.disabled && x.offsetParent);
  if (!f.length) return; const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
});
function plusSheet() {
  const T = TOOLS, pro = '<span class="pro-chip">PRO</span>';
  openSheet("Start something", `
    ${sitem(IC.clock, "Start a session", "Plan the visit, then test one page at a time", 'data-act="newSession"')}
    ${sitem(IC.clip, "Single test", "Choose from the test library", 'data-act="library" data-pid=""')}
    ${sitem(IC.user, "New patient", "Add a patient by code", 'data-act="newPatient"')}
    <div class="sgrid">${Object.values(T).map(k => `<button class="stool" data-act="startForm" data-tid="${k.id}">${k.icon}<b>${k.name.split(" ")[0]}</b>${pro}</button>`).join("")}</div>
    ${sitem(IC.cam, "Upload your own form", "Photo, PDF or Word becomes an assessment", 'data-act="builder" data-pid="" data-up="1"')}
    <label class="sitem">${`<span class="sic">${IC.up}</span>`}<span class="grow"><b>Upload an old report</b><small>A MotionPlus PDF, to compare</small></span><span class="chev" aria-hidden="true">›</span><input type="file" class="oldrep" accept="application/pdf,.pdf" aria-label="Upload an old MotionPlus PDF report"></label>
    ${sitem(IC.msg, "Send feedback", "Something broke, confusing, or an idea", 'data-act="feedback"')}`);
}

/* Screen transitions: forward slides in from the right, back from the left, tab switches cross-fade.
   Each screen's scroll position is remembered, so going back lands where you left it. */
let navNext = null; const navScroll = {};
const TAB_VIEWS = ["today", "patients", "tools", "settings", "library"];
const navKey = () => view.name ? view.name + JSON.stringify(view.args || []) : "";
function navDir(name) { const d = navNext || (TAB_VIEWS.includes(name) && TAB_VIEWS.includes(view.name) ? "fade" : "fwd"); navNext = null; return d; }
function animateNav(dir) {
  const app = $("#app"); app.classList.remove("nav-fwd", "nav-back", "nav-fade");
  if (reduced()) return; void app.offsetWidth; app.classList.add("nav-" + dir);
  countUp(app);
}
// Edge swipe to go back, like a native app. Only in the installed iPhone app: browsers and Android already have their own back gesture.
const IS_IOS = /iP(hone|ad|od)/.test(navigator.platform) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
if (IS_IOS && STANDALONE) {
  let sx = 0, sy = 0, dx = 0, t0 = 0, on = false;
  const app = () => $("#app"), reset = () => { const a = app(); a.style.transition = "transform .2s ease, opacity .2s ease"; a.style.transform = ""; a.style.opacity = ""; setTimeout(() => a.style.transition = "", 220); };
  document.addEventListener("touchstart", e => { const t = e.touches[0]; on = e.touches.length === 1 && t.clientX < 24 && !sheetEl && !!$("#app header .back") && view.name !== "gonio" && !document.body.classList.contains("toolmode"); if (on) { sx = t.clientX; sy = t.clientY; dx = 0; t0 = Date.now(); } }, { passive: true });
  document.addEventListener("touchmove", e => { if (!on) return; const t = e.touches[0]; dx = Math.max(0, t.clientX - sx); if (Math.abs(t.clientY - sy) > 40 && dx < 30) { on = false; reset(); return; } app().style.transform = `translateX(${dx}px)`; app().style.opacity = String(1 - Math.min(dx / 700, .35)); }, { passive: true });
  document.addEventListener("touchend", () => { if (!on) return; on = false; const go_ = dx > 110 || (dx > 50 && dx / (Date.now() - t0) > .45); reset(); if (go_) { hz("tick"); $("#app header .back")?.click(); } });
}
// The phone's back button and back gesture step back through the app instead of leaving it.
const OWN_HISTORY = !window.claude && window.top === window;
function backStep() {
  if (sheetEl) { closeSheet(); return true; }
  if (view.name === "lock" || view.name === "welcome" && !(view.args?.[0] > 0)) return false;
  const b = $("#app header .back"); if (b) { b.click(); return true; }
  if (view.name === "welcome") { navNext = "back"; go("welcome", view.args[0] - 1); return true; }
  if (view.name !== "today") { navNext = "back"; go("today"); return true; }
  return false;
}
if (OWN_HISTORY) {
  history.replaceState({ mp: 0 }, ""); history.pushState({ mp: 1 }, "");
  addEventListener("popstate", () => { if (backStep()) history.pushState({ mp: 1 }, ""); else history.back(); });
}

/* Numbers count up when a screen opens. The final value is in the page from the start, for screen readers and Reduce Motion. */
function countUp(root) {
  if (reduced()) return;
  root.querySelectorAll("[data-count]").forEach(el => {
    const end = +el.dataset.count; if (!isFinite(end) || end === 0) return;
    const dec = (el.dataset.count.split(".")[1] || "").length, pre = el.dataset.pre || "", suf = el.dataset.suf || "", t0 = performance.now(), D = 750;
    const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + (end * e).toFixed(dec) + suf; if (k < 1) requestAnimationFrame(step); };
    el.textContent = pre + (0).toFixed(dec) + suf; requestAnimationFrame(step);
  });
}
const cnum = (n, cls = "", pre = "", suf = "") => `<b class="${cls}" data-count="${n}" data-pre="${esc(pre)}" data-suf="${esc(suf)}">${esc(pre)}${n}${esc(suf)}</b>`;

/* The save tick: a gold circle draws a check, with one short success pulse. It sits over the next screen and never blocks taps. */
function celebrate(msg) {
  hz("success");
  const d = document.createElement("div"); d.className = "done"; d.setAttribute("aria-hidden", "true");
  d.innerHTML = `<div class="done-card"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" pathLength="1"/><path d="M20 33l8 8 16-17" pathLength="1"/></svg><b>${esc(msg)}</b></div>`;
  document.body.append(d); setTimeout(() => d.remove(), reduced() ? 900 : 1300);
}

/* Undo: deletes happen at once and can be taken back for a few seconds. */
function undoable(msg, restore) { hz("warn"); toast(msg, { label: "Undo", fn: () => { restore(); save(); hz("tap"); toast("Restored"); render(); } }); }

/* Updates: when a new version has installed in the background, offer a restart. Answers in progress are autosaved first. */
function watchUpdates(reg) {
  let had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!had) { had = true; return; } showUpdate(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
}
function showUpdate() {
  if ($("#update")) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="update" id="update" role="status">${RP_MARK("rpmark sm")}<span>A new version of MotionPlus is ready.</span><button class="sm primary" data-act="reload">Restart</button></div>`);
}

/* Autosave: every answer in an open assessment is kept, so a call, a lock or a closed tab never loses work. */
function keepDraft() { if (!draft || view.name !== "form") return; db.draft = draft; clearTimeout(keepDraft.t); keepDraft.t = setTimeout(save, 300); }
function draftInfo() {
  const d = db.draft, p = d && P(d.pid), t = d && getTpl(d); if (!p || !t) return null;
  const r = runScore(t, d.values, p), n = Object.keys(d.values).length, of = t.fields.filter(f => f.t !== "head").length;
  return { d, p, t, pct: Math.round(100 * Math.min(1, (r.of ? r.done / r.of : n / Math.max(1, of)))), editing: !!A(d.id) };
}

/* Splash: the mark draws itself once per launch. */
function splash() {
  const s = $("#splash"); if (!s) return;
  let seen = false; try { seen = sessionStorage.getItem("mp-splash") === "1"; sessionStorage.setItem("mp-splash", "1"); } catch (e) {}
  if (seen || reduced() || window.claude) { s.remove(); return; }
  s.hidden = false; setTimeout(() => s.classList.add("out"), 1150); setTimeout(() => s.remove(), 1500);
}

/* ---------- Welcome ----------
   Three short screens on first open: how the app will be used (clinic or individual), the privacy promise, and the details for reports. */
VIEWS.welcome = (step = 0) => {
  const s = db.settings, mode = s.mode || "clinic", dots = `<div class="wdots" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i === step ? "on" : ""}"></i>`).join("")}</div>`;
  const backBtn = step ? `<header class="whead">${back("welcome", `data-step="${step - 1}"`)}<span class="grow"></span><span class="label">Step ${step + 1} of 3</span></header>` : "";
  if (step === 0) {
    chrome(null, `<button class="primary wide" data-act="welcome" data-step="1">Continue</button>`);
    $("#app").innerHTML = `<div class="welcome"><div class="wglow" aria-hidden="true"></div>
      <div class="wbrand">${RP_DRAW}${WORDMARK}<div class="tagline">Measure what moves</div></div>
      <h1 class="wq">How will you use MotionPlus?</h1>
      <div class="choices" role="radiogroup" aria-label="How you will use MotionPlus">
        ${[["clinic", "Clinic", "Several therapists or branches. The clinic name and logo go on reports, and each therapist adds their name."], ["solo", "Individual practitioner", "Just you. Your own name and practice go on reports, with a simpler home screen."]].map(([v, h, p]) =>
          `<button class="choice" role="radio" aria-checked="${mode === v}" data-act="setMode" data-v="${v}"><span class="radio" aria-hidden="true"></span><span><b>${h}</b><small>${p}</small></span></button>`).join("")}
      </div>${dots}</div>`;
    if (!s.mode) s.mode = mode;
  } else if (step === 1) {
    chrome(null, `<button class="primary wide" data-act="welcome" data-step="2">I understand</button>`);
    $("#app").innerHTML = `${backBtn}<div class="welcome">
      <h1 class="wq left">Built for clinical trust</h1>
      <div class="promise">
        ${[[LOCK_IC, "Records stay on this device", "Nothing is sent to a server. Turn on a PIN and every record is encrypted."],
           [IC.cam, "Photos and video are never kept", "They are analysed on the phone, then discarded. Only the measurements are saved."],
           [IC.clip, "It informs, you decide", "Findings are worded as what may be contributing. Diagnosis and treatment stay your clinical call."],
           [IC.up, "Works offline", "After the first visit the app opens and saves without a connection."]].map(([i, h, p], k) => `<div class="prom" style="--k:${k}"><span class="sic">${i}</span><span><b>${h}</b><small>${p}</small></span></div>`).join("")}
      </div>${dots}</div>`;
  } else {
    const solo = mode === "solo";
    chrome(null, `<button class="primary wide" data-act="welcomeDone">Start using MotionPlus</button>`);
    $("#app").innerHTML = `${backBtn}<div class="welcome">
      <h1 class="wq left">${solo ? "Your details for reports" : "Your clinic on every report"}</h1>
      <p class="note">${solo ? "These print on the PDF reports you share with patients and referrers." : "The clinic name prints on every PDF report. Add your logo later in Settings."} You can change them any time in Settings.</p>
      <div class="stack">
        ${solo ? "" : `<div class="field"><label class="label" for="wclinic">Clinic name</label><input id="wclinic" data-s="clinic" value="${esc(s.clinic)}" placeholder="e.g. Sunrise Rehab Centre" autocomplete="organization"></div>
        <div class="field"><label class="label" for="wbranch">Branch</label><input id="wbranch" data-s="branch" value="${esc(s.branch)}" placeholder="e.g. Main branch"></div>`}
        <div class="field"><label class="label" for="wther">Your name, as the assessor</label><input id="wther" data-s="therapist" value="${esc(s.therapist)}" placeholder="e.g. PT, MSc Sports Physiotherapy" autocomplete="name"></div>
        ${solo ? `<div class="field"><label class="label" for="wclinic">Practice name (optional)</label><input id="wclinic" data-s="clinic" value="${esc(s.clinic)}" placeholder="Leave empty to show only your name"></div>` : ""}
      </div>${dots}</div>`;
  }
};

/* ---------- Today ----------
   The day comes first: the assessment in progress, who is due for a re-test, and what changed recently. */
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
function retestsDue() {
  const last = new Map();
  for (const a of db.assessments) { if (!P(a.pid)) continue; const k = a.pid + "|" + a.tid; if (!last.has(k) || byDate(last.get(k), a) < 0) last.set(k, a); }
  return [...last.values()].filter(a => a.date <= daysAgo(28)).sort(byDate).slice(0, 6);
}
function improving() {
  let up = 0, n = 0;
  for (const p of db.patients) { const as = db.assessments.filter(a => a.pid === p.id).sort(byDate), a = as.at(-1); if (!a) continue;
    const t = getTpl(a), c = t && compare(t, a, p); if (!c || c.d == null || c.better === null) continue; n++; if (c.better && c.d !== 0) up++; }
  return { up, n };
}
VIEWS.today = () => {
  chrome("today");
  const s = db.settings, ss = db.session, sx = ss && P(ss.pid) ? { s: ss, p: P(ss.pid), n: Object.keys(ss.done).length, of: ss.plan.length } : null, di = draftInfo(), due = retestsDue(), imp = improving(), wk = db.assessments.filter(a => a.date >= daysAgo(6)).length;
  const recent = db.assessments.filter(a => P(a.pid)).sort(byDate).reverse().slice(0, 4);
  const where = [s.mode === "solo" ? s.therapist : s.clinic, s.mode === "solo" ? "" : s.branch, new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })].filter(Boolean).map(esc).join(" · ");
  $("#app").innerHTML = `
  <header class="thead">${RP_MARK("rpmark hm")}<div class="grow"><div class="psub">${where}${navigator.onLine === false ? ' <span class="offl">Offline · saving on this device</span>' : ""}</div><h1>${greet()}</h1></div>${pinKey ? `<button class="ghost headlock" data-act="lockNow" aria-label="Lock the app">${LOCK_IC}</button>` : ""}</header>
  <div class="stack">
    ${s.pilot ? `<button class="pilotbar" data-act="feedback">${IC.msg}<span class="grow"><small>Pilot${pilotDay() ? ` · day ${pilotDay()} of 7` : ""}</small><b>Tell us what to fix</b></span><span class="chev" aria-hidden="true">›</span></button>` : ""}
    ${s.mode !== "solo" && (s.team || "").trim() ? `<button class="assessor" data-act="assessor">${IC.user}<span class="grow"><small>Assessing now</small><b>${esc(s.therapist || "Choose")}</b></span><span class="chev" aria-hidden="true">›</span></button>` : ""}
    ${sx ? `<section class="cont">
      <div class="crow"><span class="label gold">Session in progress</span><span class="psub">${sx.n} of ${sx.of} tests</span></div>
      <b class="ctitle">${esc(sx.p.code)}${sx.p.dx ? ` · ${esc(sx.p.dx.slice(0, 40))}` : ""}</b>
      <div class="pbar" aria-hidden="true"><i style="--w:${Math.round(100 * sx.n / sx.of)}%"></i></div>
      <div class="chips">${sx.s.plan.map(x => `<span class="chip ${sx.s.done[x] ? "neutral" : ""} soft">${sx.s.done[x] ? "✓ " : ""}${esc(planShort(x))}</span>`).join("")}</div>
      <div class="actions"><button class="primary" data-act="resumeSess">Continue session</button></div>
    </section>` : ""}
    ${di ? `<section class="cont">
      <div class="crow"><span class="label gold">${di.editing ? "Continue editing" : "Continue assessment"}</span><span class="psub">${di.pct}% done</span></div>
      <b class="ctitle">${esc(di.p.code)} · ${esc(di.t.name)}</b>
      <div class="pbar" role="progressbar" aria-valuenow="${di.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progress"><i style="--w:${di.pct}%"></i></div>
      <div class="actions"><button class="primary" data-act="resume">Continue</button><button data-act="discardDraft">Discard</button></div>
    </section>` : sx ? "" : `<section class="cont idle">
      <span class="label gold">Ready when you are</span><b class="ctitle">Start a session</b>
      <div class="actions"><button class="primary" data-act="newSession">Start session</button><button data-act="tab" data-tab="patients">Patients</button></div>
    </section>`}
    <section class="alib">
      <div class="crow"><span class="label gold">Your assessments</span><button class="ghost sm" data-act="libManage">Manage</button></div>
      <button class="alib-main" data-act="library" data-pid=""><span class="sic">${IC.clip}</span><span class="grow"><b>Assessment library</b><small>${shownTpl().length} in your list${db.templates.length ? ` · ${db.templates.length} of your own` : ""}</small></span><span class="chev" aria-hidden="true">›</span></button>
      <div class="alib-row">
        <button data-act="builder" data-pid=""><b>+ Create your own</b><small>Item by item</small></button>
        <button data-act="builder" data-pid="" data-up="1">${IC.up}<b>Upload a form</b><small>Photo, PDF or Word</small></button>
      </div>
    </section>
    <div class="stats">
      <div class="stat">${cnum(wk)}<span>Tests this week</span></div>
      <div class="stat">${cnum(due.length, due.length ? "warnnum" : "")}<span>Re-tests due</span></div>
      <div class="stat">${imp.n ? `<b class="goodnum"><i data-count="${imp.up}">${imp.up}</i><small>/${imp.n}</small></b>` : "<b>–</b>"}<span>Patients improving</span></div>
    </div>
    ${due.length ? `<h2 class="sec">Re-tests due</h2><div class="card list">${due.map(a => { const p = P(a.pid), t = getTpl(a), wks = Math.round((Date.now() - new Date(a.date + "T00:00")) / 6048e5);
      return `<div class="trow"><span class="sic">${IC.clock}</span><span class="grow"><b>${esc(p.code)}</b><small>${esc(t?.short || t?.name || "")} · last ${wks} weeks ago</small></span><button class="sm" data-act="startForm" data-tid="${a.tid}" data-pid="${a.pid}" aria-label="Re-test ${esc(p.code)} ${esc(t?.short || "")}">Start</button></div>`; }).join("")}</div>` : ""}
    ${toolsPromo()}
    <h2 class="sec">Recent</h2>
    <div class="card list">${recent.map(a => { const p = P(a.pid), t = getTpl(a), r = runScore(t, a.values, p);
      return `<button class="trow" data-act="result" data-id="${a.id}"><span class="avatar sm">${esc(p.code.split("-").pop())}</span><span class="grow"><b>${esc(t?.short || t?.name || "")} · ${esc(p.code)}</b><small>${fmtShort(a.date)} · ${esc(r.txt)}</small></span>${chip(r.band)}</button>`; }).join("") || `<div class="empty">Assessments you save show up here.</div>`}</div>
  </div>`;
};

const UX_ACT = {
  fab: () => { hz("tap"); plusSheet(); },
  libManage: () => { libEdit = true; go("library", null); },
  reload: () => { if (draft && view.name === "form") { db.draft = draft; save(); } encQueue.then(() => location.reload()); },
  setMode: d => { db.settings.mode = d.v; save(); applyPrefs(); if (view.name === "settings") return render(); document.querySelectorAll("[data-act=setMode]").forEach(b => b.setAttribute("aria-checked", b.dataset.v === d.v)); },
  welcome: d => { navNext = +d.step < (view.args?.[0] || 0) ? "back" : "fwd"; go("welcome", +d.step); },
  welcomeDone: () => { db.settings.welcomed = 1; save(); celebrate("All set"); go("today"); },
  resume: () => { draft = JSON.parse(JSON.stringify(db.draft)); go("form"); },
  discardDraft: (d, b) => { const old = db.draft; db.draft = null; save(); undoable("Draft discarded", () => { db.draft = old; }); render(); },
  formMode: d => { db.settings.formMode = d.v; save(); render(); },
  textSize: d => { db.settings.textSize = +d.v; save(); applyPrefs(); render(); },
  haptics: d => { db.settings.haptics = d.v === "on"; save(); if (d.v === "on") hz("success"); render(); },
  lrPick: d => { if (view.name !== "form" || !draft) return; const t = getTpl(draft), f = t.fields.find(x => x.id === d.f), cur = (draft.values[d.f] || {})[d.k];
    openSheet(`${f.label} · ${d.k === "L" ? "Left" : "Right"}`, `<div class="sopts">${["", ...f.opts].map(o => `<button class="sopt" data-act="lrSet" data-f="${d.f}" data-k="${d.k}" data-v="${esc(o)}" aria-pressed="${(cur || "") === o}">${o ? esc(o) : "Not tested"}</button>`).join("")}</div>`); },
  lrSet: d => { setVal(d.f, d.k, d.v); const b = document.getElementById(`i_${d.f}_${d.k}`); if (b) { b.textContent = d.v || "–"; b.classList.toggle("set", !!d.v); } },
  pickDate: d => { draft.date = d.v; keepDraft(); document.querySelectorAll("[data-act=pickDate]").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === d.v)); const o = $("#adate"); if (o) o.value = d.v; $("#adatelab")?.classList.toggle("on", ![today(), daysAgo(1)].includes(d.v)); },
  setSex: d => { $("#psex").value = d.v; document.querySelectorAll("[data-act=setSex]").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === d.v)); },
};
