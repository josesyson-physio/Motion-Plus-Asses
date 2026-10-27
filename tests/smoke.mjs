// Smoke test: opens the built app in a phone-sized Chromium and walks the main path.
// Fails on any page error, a horizontal scroll, or a step that doesn't land where it should.
// Run: python3 build.py && python3 -m http.server 8765 & node tests/smoke.mjs
import { chromium } from "playwright";
const URL = process.env.APP_URL || "http://localhost:8765/";
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" })).newPage();
const errors = []; p.on("pageerror", e => errors.push(e.message));
const fail = m => { console.error("FAIL:", m); process.exitCode = 1; };
const at = async (name, step) => { const v = await p.evaluate(() => view.name); if (v !== name) fail(`${step}: expected ${name}, got ${v}`); else console.log("ok", step); };
const noHScroll = async step => { if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail(`${step}: page scrolls sideways`); };

await p.goto(URL); await at("welcome", "first open shows welcome");
await p.click("[data-act=setMode][data-v=solo]"); await p.click("text=Continue"); await p.click("text=I understand");
await p.fill("#wther", "Test assessor"); await p.click("text=Start using MotionPlus"); await at("today", "welcome finishes on Today"); await noHScroll("today");
await p.click(".tabs .fab"); if (!(await p.$(".sheet"))) fail("+ opens the sheet"); await p.keyboard.press("Escape");
await p.click(".tabs [data-tab=patients]"); await at("patients", "patients tab"); await p.click(".patient >> nth=0"); await at("patient", "open patient");
const before = await p.evaluate(() => db.assessments.length);
await p.click("#bar button"); await p.fill("#libq", "pain"); await p.click(".tool-main >> nth=0"); await at("form", "start assessment");
await p.click("[data-act=pick] >> nth=3"); await p.waitForTimeout(600); await p.click(".gdots button >> nth=-1");
if (!(await p.evaluate(() => !!db.draft))) fail("answers autosave as a draft");
await p.click("#bar button:has-text('Save')"); await at("result", "save assessment");
if ((await p.evaluate(() => db.assessments.length)) !== before + 1) fail("assessment was saved");
if (await p.evaluate(() => !!db.draft)) fail("draft cleared after save");
await p.click("text=Delete this assessment"); await at("patient", "delete returns to patient");
await p.click("#toast .tbtn"); if ((await p.evaluate(() => db.assessments.length)) !== before + 1) fail("undo restores the assessment"); else console.log("ok undo");
// Guided session: plan, one page per question with auto-advance, summary, explain page
await p.evaluate(() => { db.session = null; go("plan", db.patients[0].id); }); await at("plan", "session plan");
await p.click("#bar .primary"); await at("sess", "session hub");
const first = await p.evaluate(() => sessNext()); await p.click("#bar .primary");
if (first === "goniometer" || first === "posture" || first === "gait") await p.evaluate(() => go("sess")); else {
  await at("form", "first test opens"); if ((await p.evaluate(() => draft.g)) !== 0) fail("test opens one question per page");
  if (await p.$(".gpage.single [data-act=pick]")) { await p.click(".gpage.single [data-act=pick] >> nth=1"); await p.waitForTimeout(600); if ((await p.evaluate(() => draft.g)) !== 1) fail("choosing an answer moves to the next page"); else console.log("ok auto-advance"); }
  await p.click(".gdots button >> nth=-1"); await p.click("#bar button:has-text('Save')"); await at("sess", "saving returns to the session"); }
await p.evaluate(() => go("summary")); await at("summary", "session summary"); await noHScroll("summary");
await p.click("#bar button:has-text('Present')"); await at("consult", "present from the summary"); await p.click(".ctop [data-act=cExit]"); await at("summary", "consultation room returns to the summary");
await p.evaluate(() => ACT.explain({ pid: db.session.pid })); await at("explain", "explain to patient"); await noHScroll("explain");
await p.click("#bar button:has-text('Done')"); await p.click("#bar button:has-text('Finish')"); await at("patient", "finish session");
if (await p.evaluate(() => !!db.session)) fail("finished session is cleared");
// Consultation room: slides, the lever demo, editing the plan, and leaving cleanly
await p.evaluate(() => go("patient", db.patients[0].id)); await p.click(".consultbtn"); await at("consult", "consultation room opens");
const slides = await p.evaluate(() => [...document.querySelectorAll(".cslide")].map(s => s.dataset.id));
// The first sample patient had a stroke, so the deck shows the brain and nerve slides in place of a joint.
if (!["cover", "brain", "ncause", "plan", "pain", "check", "next"].every(id => slides.includes(id))) fail("consultation slides: " + slides.join(","));
await p.evaluate(i => consultTo(i), slides.indexOf("gait")); await p.waitForTimeout(800);
if (!(await p.$(".s-gait .gtA line"))) fail("walking figure draws"); else console.log("ok walking figure");
await p.evaluate(() => { const p0 = db.patients[0]; p0.dx = "Right knee osteoarthritis"; save(); render(); }); await p.waitForTimeout(300);
const kslides = await p.evaluate(() => [...document.querySelectorAll(".cslide")].map(s => s.dataset.id));
await p.evaluate(i => consultTo(i), kslides.indexOf("lever")); await p.waitForTimeout(800);
if (!(await p.$(".s-lever .leversvg"))) fail("lever diagram draws for a joint"); else console.log("ok lever");
// A heart patient gets the heart, oxygen, effort and breathing slides, built from their vital signs.
await p.evaluate(() => { const p0 = db.patients[0]; p0.dx = "Heart failure"; db.assessments.push({ id: uid(), pid: p0.id, tid: "vitals", date: today(), values: { hr: "84", sys: "118", dia: "72", spo2: "96" }, notes: "", created: Date.now() }); save(); render(); }); await p.waitForTimeout(300);
const hslides = await p.evaluate(() => [...document.querySelectorAll(".cslide")].map(s => s.dataset.id));
if (!["heart", "ccause", "effort", "breath"].every(id => hslides.includes(id)) || hslides.includes("lever")) fail("heart slides: " + hslides.join(","));
else if (!(await p.$eval(".s-ccause .o2svg", e => e.textContent.includes("84 beats")))) fail("oxygen loop shows the patient's heart rate"); else console.log("ok heart slides");
await p.evaluate(() => { const p0 = db.patients[0]; p0.dx = "Right knee osteoarthritis"; save(); render(); }); await p.waitForTimeout(300);
await p.click(".ctop [data-act=cEdit]"); await at("cplan", "plan editor"); await p.fill("#cpi0", "Ice 10 minutes"); await p.click("[data-act=cpSave]"); await at("consult", "plan saved");
if ((await p.evaluate(() => db.patients[0].rehab?.phases[0].items[0])) !== "Ice 10 minutes") fail("rehab plan saved"); else console.log("ok rehab plan");
await p.click(".ctop [data-act=cExit]"); await at("patient", "leave consultation room"); if (await p.evaluate(() => document.body.classList.contains("consult"))) fail("consult styling removed");
// Goals: write your own, edit it, delete and undo
await p.evaluate(() => go("patient", db.patients[0].id)); const g0 = await p.evaluate(() => (db.patients[0].goals || []).length);
await p.click("[data-act=goalNew]"); await at("goal", "goal editor"); await p.fill("#gtext", "Walk to the shops"); await p.click("[data-act=goalSave]"); await at("patient", "goal added");
await p.click(".goal >> nth=-1"); await p.fill("#gtext", "Walk to the shops and back"); await p.click("[data-act=goalSave]");
if ((await p.evaluate(() => db.patients[0].goals.at(-1).text)) !== "Walk to the shops and back") fail("goal edits save"); else console.log("ok goal edit");
await p.click(".goal >> nth=-1"); await p.click("[data-act=goalDel]"); await p.click("#toast .tbtn");
if ((await p.evaluate(() => db.patients[0].goals.length)) !== g0 + 1) fail("goal delete undoes"); else console.log("ok goal undo");
// Pilot feedback: saved on the phone with screen and phone info, never patient data
await p.evaluate(() => { ACT.pilot({ v: "on" }); go("today"); }); await p.click(".pilotbar"); await at("feedback", "feedback form");
await p.fill("#fbtext", "Test note"); await p.click("[data-act=fbSave]"); await at("today", "feedback saved");
const fb = await p.evaluate(() => db.feedback?.at(-1)); if (!fb || fb.text !== "Test note" || !fb.ctx?.v || JSON.stringify(fb).includes("MP-")) fail("feedback saved without patient data"); else console.log("ok feedback");
await p.evaluate(() => go("settings")); await noHScroll("settings");
for (const v of ["tools", "library", "today"]) { await p.evaluate(n => go(n), v); await noHScroll(v); }
await b.close();
if (errors.length) fail("page errors: " + errors.join(" | "));
if (!process.exitCode) console.log("All smoke checks passed");
