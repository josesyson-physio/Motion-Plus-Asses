/* Pilot kit: in-app feedback for a real-phone pilot. Feedback stays on this device until the
   therapist chooses to send it, and it never includes patient codes, names or results. */
const APP_V = "2026-10-25d";
const FB_KINDS = [["problem", "Something broke"], ["confusing", "Confusing"], ["idea", "Idea"], ["like", "I like this"]];
let fbDraft = null;
const fbList = () => (db.feedback ||= []);
const pilotDay = () => { const s = db.settings.pilotStart; return s ? Math.min(99, Math.floor((Date.parse(today()) - Date.parse(s)) / 864e5) + 1) : 0; };
// What we attach to each note: the screen and phone, nothing about patients.
function fbContext(screen) {
  const ua = navigator.userAgent, os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Other",
    br = /CriOS|Chrome/.test(ua) ? "Chrome" : /FxiOS|Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Other";
  return { screen, v: APP_V, os, browser: br, size: `${innerWidth}×${innerHeight}`, installed: matchMedia("(display-mode: standalone)").matches || navigator.standalone === true, mode: db.settings.mode || "clinic", day: pilotDay() };
}
function fbText(list) {
  return `MotionPlus pilot feedback (${list.length})\n\n` + list.map(f => `${f.date} · ${FB_KINDS.find(k => k[0] === f.kind)?.[1] || { rating: "Session rating", error: "App error" }[f.kind] || f.kind}${f.rate ? ` · ${f.rate}/5` : ""}${f.text ? `\n${f.text}` : ""}\nScreen: ${f.ctx.screen} · ${f.ctx.os} ${f.ctx.browser} ${f.ctx.size}${f.ctx.installed ? " · installed" : ""} · v${f.ctx.v}${f.ctx.day ? ` · pilot day ${f.ctx.day}` : ""}`).join("\n\n");
}
async function fbSend() {
  const list = fbList().filter(f => !f.sent); if (!list.length) { toast("Nothing new to send"); return; }
  const text = fbText(list), to = (db.settings.pilotTo || "").trim(), mark = () => { list.forEach(f => f.sent = today()); save(); render(); };
  try { if (navigator.share) { await navigator.share({ title: "MotionPlus feedback", text }); mark(); return; } } catch (e) { if (e.name === "AbortError") return; }
  if (to) { location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent("MotionPlus pilot feedback")}&body=${encodeURIComponent(text)}`; mark(); return; }
  try { await navigator.clipboard.writeText(text); mark(); toast("Copied. Paste it into a message to the pilot lead."); } catch (e) { downloadFile("motionplus-feedback.txt", text, "text/plain"); mark(); }
}
VIEWS.feedback = () => {
  const f = fbDraft || (fbDraft = { kind: "problem", rate: 0, text: "", screen: "today" });
  chrome(null, `<button class="primary wide" data-act="fbSave">Save feedback</button>`);
  $("#app").innerHTML = `
  <header>${back(f.screen === "settings" ? "settings" : "today")}<div class="grow"><div class="psub">${db.settings.pilot ? `Pilot${pilotDay() ? ` · day ${pilotDay()}` : ""}` : "MotionPlus"}</div><h1>Send feedback</h1></div></header>
  <div class="stack">
    <div class="field"><span class="label" id="fbk">What is it about?</span>
      <div class="chips" role="group" aria-labelledby="fbk">${FB_KINDS.map(([v, l]) => `<button class="fchip" data-act="fbKind" data-v="${v}" aria-pressed="${f.kind === v}">${l}</button>`).join("")}</div></div>
    <div class="field"><label class="label" for="fbtext">Tell us more</label><textarea id="fbtext" rows="5" placeholder="${f.kind === "problem" ? "What were you doing, and what happened?" : f.kind === "idea" ? "What would make this better for you?" : "What did you notice?"}">${esc(f.text)}</textarea>
      <span class="note">Please don't type patient names or details.</span></div>
    <div class="field"><span class="label" id="fbr">How was MotionPlus today? (optional)</span>
      <div class="segc" role="group" aria-labelledby="fbr">${[1, 2, 3, 4, 5].map(n => `<button data-act="fbRate" data-v="${n}" aria-pressed="${f.rate === n}" aria-label="${n} out of 5">${n}</button>`).join("")}</div>
      <span class="note">1 is frustrating, 5 is excellent.</span></div>
    <p class="note">Added for us: the screen you came from (${esc(f.screen)}), your phone type and screen size, and the app version. Feedback stays on this phone until you send it.</p>
  </div>`;
};
const fbSync = () => { if (fbDraft && $("#fbtext")) fbDraft.text = $("#fbtext").value; };
function openFeedback(kind) { fbDraft = { kind: kind || "problem", rate: 0, text: "", screen: view.name || "today" }; closeSheet(true); go("feedback"); }
// After a session, ask once a day for a one-tap rating while the pilot runs.
function pilotAsk() {
  if (!db.settings.pilot || db.settings.fbAsked === today()) return; db.settings.fbAsked = today(); save();
  setTimeout(() => openSheet("How did that session go?", `<p class="note">One tap helps the pilot. 1 is frustrating, 5 is excellent.</p><div class="segc" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map(n => `<button data-act="fbQuick" data-v="${n}">${n}</button>`).join("")}</div><button data-act="feedback">Write more</button>`), 700);
}
// While the pilot runs, unexpected errors are noted (message and screen only) so they can be sent with the feedback.
addEventListener("error", e => { if (!db?.settings?.pilot) return; const l = fbList(); if (l.filter(f => f.kind === "error").length >= 20) return;
  l.push({ id: uid(), kind: "error", date: today(), text: String(e.message || "Error").slice(0, 200), ctx: fbContext(view.name) }); save(); });
const PILOT_ACT = {
  feedback: d => openFeedback(d.v),
  fbKind: d => { fbSync(); fbDraft.kind = d.v; render(); },
  fbRate: d => { fbSync(); fbDraft.rate = fbDraft.rate === +d.v ? 0 : +d.v; render(); },
  fbSave: () => { fbSync(); const f = fbDraft;
    if (!f.text.trim() && !f.rate) { toast("Write a few words or pick a rating."); $("#fbtext")?.focus(); return; }
    fbList().push({ id: uid(), kind: f.kind, rate: f.rate || undefined, text: f.text.trim().slice(0, 2000), date: today(), ctx: fbContext(f.screen) });
    save(); fbDraft = null; navNext = "back"; go(f.screen === "settings" ? "settings" : "today"); celebrate("Thank you"); toast("Saved on this phone", { label: "Send now", fn: fbSend }); },
  fbQuick: d => { fbList().push({ id: uid(), kind: "rating", rate: +d.v, text: "", date: today(), ctx: fbContext("session") }); save(); hz("tap"); toast("Thanks for rating", +d.v <= 2 ? { label: "Say why", fn: () => openFeedback("problem") } : null); },
  fbSend: () => fbSend(),
  fbExport: () => downloadFile(`motionplus-feedback-${today()}.txt`, fbText(fbList()), "text/plain"),
  pilot: d => { const on = d.v === "on"; db.settings.pilot = on; if (on && !db.settings.pilotStart) db.settings.pilotStart = today(); save(); if (on) hz("success"); render(); },
  pilotReset: () => { db.settings.pilotStart = today(); save(); toast("Pilot restarted from today"); render(); },
};
function pilotSettingsHTML() {
  const s = db.settings, l = fbList(), unsent = l.filter(f => !f.sent).length;
  return `<h2 class="sec">Pilot and feedback</h2>
    <div class="card list">
      <div class="srow"><span class="grow"><b>Pilot mode</b><small>${s.pilot ? `On${pilotDay() ? `, day ${pilotDay()}` : ""}. A feedback button shows on Today, and you're asked for a one-tap rating after your first session each day.` : "Turn on while you're trying MotionPlus with a group of physios."}</small></span>
        <button class="switch" role="switch" aria-checked="${!!s.pilot}" data-act="pilot" data-v="${s.pilot ? "off" : "on"}" aria-label="Pilot mode"><i></i></button></div>
    </div>
    ${s.pilot ? `<div class="field"><label class="label" for="spto">Send feedback to (optional)</label><input id="spto" data-s="pilotTo" type="email" autocomplete="off" value="${esc(s.pilotTo || "")}" placeholder="The pilot lead's email"><span class="note">Used when this phone can't share directly. Feedback never leaves the phone until you tap Send.</span></div>` : ""}
    <button data-act="feedback" data-v="problem">Send feedback</button>
    ${l.length ? `<div class="actions"><button data-act="fbSend">${unsent ? `Send ${unsent} new` : "All sent"}</button><button data-act="fbExport">Save all as a file (${l.length})</button></div>` : ""}
    ${s.pilot && pilotDay() > 1 ? `<button class="ghost" data-act="pilotReset">Restart the pilot from today</button>` : ""}`;
}
