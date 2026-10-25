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
await p.click("[data-act=pick] >> nth=3"); await p.waitForTimeout(400);
if (!(await p.evaluate(() => !!db.draft))) fail("answers autosave as a draft");
await p.click("#bar button:has-text('Save')"); await at("result", "save assessment");
if ((await p.evaluate(() => db.assessments.length)) !== before + 1) fail("assessment was saved");
if (await p.evaluate(() => !!db.draft)) fail("draft cleared after save");
await p.click("text=Delete this assessment"); await at("patient", "delete returns to patient");
await p.click("#toast .tbtn"); if ((await p.evaluate(() => db.assessments.length)) !== before + 1) fail("undo restores the assessment"); else console.log("ok undo");
await p.evaluate(() => go("settings")); await noHScroll("settings");
for (const v of ["tools", "library", "today"]) { await p.evaluate(n => go(n), v); await noHScroll(v); }
await b.close();
if (errors.length) fail("page errors: " + errors.join(" | "));
if (!process.exitCode) console.log("All smoke checks passed");
