/* ---------- Goniometer (MotionPlus Tools) ----------
   Joint angles two ways: Camera (three points on a photo, found on the device and adjustable by hand) and Phone tilt
   (the motion sensor, zeroed at the start position). Each movement opens on the method that measures it best.
   Readings go into the patient's Range of Motion assessment for the day. Photos and video are never stored. */
const GONIO = "goniometer";
const isGonio = a => a?.tid === "rom" && typeof a.values?.gonio === "string";
// MediaPipe pose landmarks for the patient's left side; the right side is the next index. "ohip" is the opposite hip.
const GZ_PT = { sh: 11, el: 13, wr: 15, kn: 19, hip: 23, knee: 25, ank: 27, toe: 31 };
const gzIdx = (n, side) => n === "ohip" ? (side === "L" ? 24 : 23) : GZ_PT[n] + (side === "R" ? 1 : 0);
// How the angle at the middle point becomes the clinical value.
const GZ_READ = { flex: a => 180 - a, raw: a => a, df: a => 90 - a, pf: a => a - 90, abd: a => a - 90, ext: a => a - 180 };
const gcam = (p, n, r, view) => ({ p, n, r, view });
const LEG = ["Greater trochanter", "Lateral knee", "Lateral malleolus"];
const GZ_SPEC = {
  "Cervical flexion": { m: "tilt", mid: true, why: "The head has no clear joint points for a photo, so the phone reads the tilt of the head itself.", tilt: "Sitting upright. Hold the phone flat on the side of the head, just above the ear. Zero with the head level, then bring the chin to the chest." },
  "Cervical extension": { m: "tilt", mid: true, why: "The head has no clear joint points for a photo, so the phone reads the tilt of the head itself.", tilt: "Sitting upright. Hold the phone flat on the side of the head, just above the ear. Zero with the head level, then look up to the ceiling." },
  "Cervical rotation": { m: "tilt", why: "Rotation turns away from the camera. Lying down lets the phone feel it through gravity.", tilt: "Lying on the back. Phone flat on the forehead. Zero facing the ceiling, then turn the head to the side being measured." },
  "Shoulder flexion": { m: "cam", why: "Trunk and arm are both in view from the side, so the camera reads the true angle between them.", cam: gcam(["hip", "sh", "el"], ["Greater trochanter", "Acromion", "Lateral epicondyle"], "raw", "Side view, camera at shoulder height."), tilt: "Phone on the outside of the upper arm. Zero with the arm by the side, then raise it forward." },
  "Shoulder extension": { m: "cam", why: "Trunk and arm are both in view from the side, so the camera reads the true angle between them.", cam: gcam(["hip", "sh", "el"], ["Greater trochanter", "Acromion", "Lateral epicondyle"], "raw", "Side view, camera at shoulder height, arm moving back."), tilt: "Phone on the outside of the upper arm. Zero with the arm by the side, then move it backward." },
  "Shoulder abduction": { m: "cam", why: "From the front or back the trunk and arm are in one plane, so the camera reads the angle directly.", cam: gcam(["hip", "sh", "el"], ["Side of trunk (hip)", "Acromion", "Elbow"], "raw", "Front or back view, camera at shoulder height."), tilt: "Phone on the outside of the upper arm. Zero with the arm by the side, then raise it out to the side." },
  "Shoulder external rotation": { m: "tilt", why: "Rotation moves toward and away from the camera, so the phone on the forearm reads it better.", tilt: "Lying on the back, shoulder out to 90° and elbow bent to 90°. Phone on the forearm. Zero with the forearm pointing up, then rotate the hand back toward the bed." },
  "Shoulder internal rotation": { m: "tilt", why: "Rotation moves toward and away from the camera, so the phone on the forearm reads it better.", tilt: "Lying on the back, shoulder out to 90° and elbow bent to 90°. Phone on the forearm. Zero with the forearm pointing up, then rotate the hand forward toward the feet." },
  "Elbow flexion": { m: "cam", why: "Three clear bony points in one plane, the same ones a hand goniometer uses.", cam: gcam(["sh", "el", "wr"], ["Acromion", "Lateral epicondyle", "Wrist (styloid)"], "flex", "Side view of the arm."), tilt: "Upper arm resting on the bed. Phone on the forearm. Zero with the elbow straight, then bend it." },
  "Forearm supination": { m: "tilt", why: "The forearm turns around its own length, which a photo cannot show. The phone turns with the hand.", tilt: "Elbow at the side, bent to 90°. The patient holds the phone upright in the fist. Zero with the thumb up, then turn the palm up." },
  "Forearm pronation": { m: "tilt", why: "The forearm turns around its own length, which a photo cannot show. The phone turns with the hand.", tilt: "Elbow at the side, bent to 90°. The patient holds the phone upright in the fist. Zero with the thumb up, then turn the palm down." },
  "Wrist flexion": { m: "cam", why: "Forearm and hand are in one plane from the side.", cam: gcam(["el", "wr", "kn"], ["Lateral epicondyle", "Wrist (styloid)", "Knuckles (5th MCP)"], "flex", "Side view of the forearm and hand."), tilt: "Forearm resting on a table. Phone on the back of the hand. Zero with the wrist straight, then bend it down." },
  "Wrist extension": { m: "cam", why: "Forearm and hand are in one plane from the side.", cam: gcam(["el", "wr", "kn"], ["Lateral epicondyle", "Wrist (styloid)", "Knuckles (5th MCP)"], "flex", "Side view of the forearm and hand."), tilt: "Forearm resting on a table. Phone on the back of the hand. Zero with the wrist straight, then bend it up." },
  "Lumbar flexion": { m: "tilt", mid: true, two: true, why: "A photo cannot separate the lower back from the hips. Two phone readings, at T12 and at the sacrum, take the hips out (dual inclinometer method).", tilt: "Standing. Reading 1: phone on the spine at T12, zero upright, bend forward fully. Reading 2: phone on the sacrum, zero upright, bend forward again. Lumbar flexion is reading 1 minus reading 2." },
  "Hip flexion": { m: "cam", why: "Trunk and thigh are both in view from the side.", cam: gcam(["sh", "hip", "knee"], ["Shoulder", "Greater trochanter", "Lateral knee"], "flex", "Side view, lying on the back with the knee bent."), tilt: "Lying on the back. Phone on the front of the thigh. Zero lying flat, then bring the knee toward the chest." },
  "Hip extension": { m: "cam", why: "Trunk and thigh are both in view from the side.", cam: gcam(["sh", "hip", "knee"], ["Shoulder", "Greater trochanter", "Lateral knee"], "flex", "Side view, lying face down with the leg lifted."), tilt: "Lying face down. Phone on the back of the thigh. Zero lying flat, then lift the leg." },
  "Hip abduction": { m: "cam", why: "Seen from above, the line across the pelvis and the thigh give the angle directly.", cam: gcam(["ohip", "hip", "knee"], ["Opposite ASIS", "ASIS", "Knee (patella)"], "abd", "Camera above the patient, lying on the back."), tilt: "Lying on the other side. Phone on the outer thigh. Zero with the legs together, then lift the leg." },
  "Hip internal rotation": { m: "tilt", why: "Hip rotation shows as the shin swinging sideways, which the phone measures directly.", tilt: "Sitting at the edge of the bed, knee at 90°. Phone on the front of the shin. Zero with the shin straight down, then swing the foot outward." },
  "Hip external rotation": { m: "tilt", why: "Hip rotation shows as the shin swinging sideways, which the phone measures directly.", tilt: "Sitting at the edge of the bed, knee at 90°. Phone on the front of the shin. Zero with the shin straight down, then swing the foot inward." },
  "Knee flexion": { m: "cam", why: "The classic goniometer landmarks, all in one plane from the side.", cam: gcam(["hip", "knee", "ank"], LEG, "flex", "Side view of the leg."), tilt: "Lying face down. Phone on the back of the lower leg. Zero with the knee straight, then bend it." },
  "Knee extension": { m: "cam", why: "A straight knee is read best from the three leg points. A shortfall from straight shows as a minus value.", cam: gcam(["hip", "knee", "ank"], LEG, "ext", "Side view, lying on the back with the knee pressed straight.") },
  "Ankle dorsiflexion": { m: "cam", why: "Shin and foot are both in view from the side.", cam: gcam(["knee", "ank", "toe"], ["Fibular head", "Lateral malleolus", "5th metatarsal"], "df", "Side view of the lower leg and foot."), tilt: "Phone held along the sole of the foot. Zero with the ankle at 90°, then pull the foot up." },
  "Ankle plantarflexion": { m: "cam", why: "Shin and foot are both in view from the side.", cam: gcam(["knee", "ank", "toe"], ["Fibular head", "Lateral malleolus", "5th metatarsal"], "pf", "Side view of the lower leg and foot."), tilt: "Phone held along the sole of the foot. Zero with the ankle at 90°, then point the foot down." },
};
const GZ_JOINTS = [
  ["Neck", ["Cervical"], '<circle cx="12" cy="6" r="3"/><path d="M12 9v6M8 21l4-6 4 6"/>'],
  ["Shoulder", ["Shoulder"], '<circle cx="8" cy="7" r="2.5"/><path d="M10 9l8 6M8 10v10"/>'],
  ["Elbow", ["Elbow", "Forearm"], '<path d="M5 18l7-7 7 4"/><circle cx="12" cy="11" r="2"/>'],
  ["Wrist", ["Wrist"], '<path d="M3 14h9l6-5"/><circle cx="12" cy="14" r="2"/>'],
  ["Back", ["Lumbar"], '<path d="M12 3v8l-3 10M12 11l4 9"/><path d="M8 7h8" opacity=".5"/>'],
  ["Hip", ["Hip"], '<circle cx="9" cy="7" r="2.5"/><path d="M9 9.5v5l7 6"/>'],
  ["Knee", ["Knee"], '<path d="M8 3l3 9-6 8"/><circle cx="11" cy="12" r="2"/>'],
  ["Ankle", ["Ankle"], '<path d="M10 3v14h9"/><circle cx="10" cy="17" r="2"/>'],
];
const gzLabel = i => `${ROM_LIST[i][0]} ${ROM_LIST[i][1]}`;
const gzSpec = i => GZ_SPEC[gzLabel(i)];
const gzField = i => TPLMAP.rom.fields[i].id;
const gzJoint = i => GZ_JOINTS.find(j => j[1].includes(ROM_LIST[i][0]));
const gzCap = s => s[0].toUpperCase() + s.slice(1);
const gzRecToday = pid => db.assessments.find(a => a.pid === pid && a.tid === "rom" && a.date === today());
const gzMeth = m => m === "cam" ? "Camera" : "Phone tilt";

let GZ = null, gzLM = null;   // GZ: this visit's state; gzLM: the pose model, kept loaded between visits
let GZS = {};                 // live hardware: camera stream, sensor listener, animation frame

// Value already measured for a movement and side: this visit first, then today's saved ROM record.
function gzVal(i, s) {
  const r = GZ.readings.findLast(x => x.mi === i && x.side === s); if (r) return r.val;
  const v = gzRecToday(GZ.pid)?.values[gzField(i)]?.[s]; return has(v) && isFinite(v) ? +v : null;
}
function gzStatus(val, norm) {
  if (val == null) return null;
  if (!norm) return val <= -5 ? [`${-val}° short of straight`, "warn"] : ["Full extension", "good"];
  const pc = Math.round(100 * val / norm);
  return [`${pc}% of normal`, pc >= 80 ? "good" : pc >= 50 ? "warn" : "bad"];
}
function gzStop() {
  cancelAnimationFrame(GZS.raf); clearInterval(GZS.det);
  GZS.stream?.getTracks().forEach(t => t.stop());
  if (GZS.or) removeEventListener("deviceorientation", GZS.or);
  GZS = {};
}
function gzModel() {
  return gzLM ||= (async () => {
    const m = await import("./posture/vision_bundle.mjs");
    const fs = await m.FilesetResolver.forVisionTasks(new URL("posture/wasm", location.href).href);
    return m.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: new URL("posture/models/pose_landmarker.wasm", location.href).href, delegate: "CPU" }, runningMode: "IMAGE", numPoses: 1, minPoseDetectionConfidence: 0.4 });
  })().catch(() => (gzLM = null));
}

VIEWS.gonio = pid => {
  const p = P(pid); if (!p) return go("tools");
  chrome(null);
  if (window.claude?.use) { $("#app").innerHTML = `<header>${back("patient", `data-id="${pid}"`)}<div class="grow"><div class="brand">MOTIONPLUS <b class="pro">PRO</b> · TOOLS</div><h1>Goniometer</h1></div></header><div class="empty">The goniometer needs the camera and motion sensor, which the Claude viewer blocks. Open MotionPlus Pro from its web address to use it.</div>`; return; }
  if (!GZ || GZ.pid !== pid) GZ = { pid, mi: 19, side: "R", method: null, readings: [], screen: "setup" };
  gzRender();
};
function gzRender() {
  gzStop();
  const sc = GZ.screen;
  $("#app").innerHTML = sc === "cam" ? gzCamHTML() : sc === "tilt" ? gzTiltHTML() : sc === "review" ? gzReviewHTML() : gzSetupHTML();
  if (sc === "cam") gzCamStart(); else if (sc === "tilt") gzTiltStart();
  window.scrollTo(0, 0);
}
const gzHead = (title, sub) => `<header>${`<button class="back" data-act="gzBack" aria-label="Back">‹</button>`}<div class="grow"><div class="brand">${sub}</div><h1>${title}</h1></div><span class="tpat">${esc(P(GZ.pid).code)}</span></header>`;

function gzSetupHTML() {
  const i = GZ.mi, [, mv, norm] = ROM_LIST[i], sp = gzSpec(i), jt = gzJoint(i);
  const meth = sp[GZ.method] ? GZ.method : sp.m, moves = ROM_LIST.map((r, k) => k).filter(k => jt[1].includes(ROM_LIST[k][0]));
  const other = s => { const v = gzVal(i, s); return v == null ? "" : ` <small>${v}°</small>`; };
  const n = GZ.readings.length;
  chrome(null, `${n ? `<button data-act="gzReview">Today (${n})</button>` : ""}<button class="primary wide" data-act="gzStart">Start measuring</button>`);
  return `${gzHead("Goniometer", 'MOTIONPLUS <b class="pro">PRO</b> · TOOLS')}
  <div class="stack gz">
    <div class="label">Joint</div>
    <div class="gz-joints">${GZ_JOINTS.map(j => `<button class="gz-joint" data-act="gzJoint" data-j="${j[0]}" aria-pressed="${j === jt}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">${j[2]}</svg>${j[0]}</button>`).join("")}</div>
    <div class="label">Movement</div>
    <div class="gz-chips">${moves.map(k => `<button class="gz-chip" data-act="gzMove" data-i="${k}" aria-pressed="${k === i}">${gzCap(ROM_LIST[k][0] === "Forearm" ? ROM_LIST[k][1] : ROM_LIST[k][1])}</button>`).join("")}</div>
    ${sp.mid ? `<div class="gz-norm"><span class="grow">Midline movement, one value<br><small>Saved in the record's left column</small></span><b>${gzVal(i, "L") ?? "–"}${gzVal(i, "L") != null ? "°" : ""}</b></div>` : `
    <div class="label">Side</div>
    <div class="gz-side">${["L", "R"].map(s => `<button data-act="gzSide" data-s="${s}" aria-pressed="${GZ.side === s}">${s === "L" ? "Left" : "Right"}${other(s)}</button>`).join("")}</div>`}
    <div class="label">Method</div>
    <div class="gz-seg">${["cam", "tilt"].map(m => `<button data-act="gzMethod" data-m="${m}" aria-pressed="${meth === m}" ${sp[m] ? "" : "disabled"}>${gzMeth(m)}<small>${!sp[m] ? "Not suited to this movement" : m === sp.m ? "★ Best for this movement" : m === "cam" ? "Photo, three points" : "Phone on the limb"}</small></button>`).join("")}</div>
    <div class="gz-why"><b>${meth === sp.m ? "Why " + gzMeth(meth).toLowerCase() : "Tip"}</b> ${meth === sp.m ? esc(sp.why) : `${gzMeth(sp.m)} is usually more reliable here. ${esc(sp.why)}`}</div>
    <div class="gz-how"><span class="label">Set up</span><p>${esc(meth === "cam" ? sp.cam.view + " Points: " + sp.cam.n.join(", ") + "." : sp.tilt)}</p></div>
    <div class="gz-norm"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span class="grow">Normal ${esc(gzLabel(i).toLowerCase())}<br><small>Reference active range</small></span><b>${norm ? "0–" + norm : "0"}°</b></div>
  </div>`;
}

/* ----- Camera: three points on a live frame or photo ----- */
function gzCamHTML() {
  const i = GZ.mi, sp = gzSpec(i).cam;
  chrome(null, `<button data-act="gzKeep" id="gzKeep">Keep as trial</button><button class="primary wide" data-act="gzUse" id="gzUse" disabled>Use reading</button>`);
  return `${gzHead("Camera angle", `${esc(gzLabel(i).toUpperCase())}${gzSpec(i).mid ? "" : " · " + (GZ.side === "L" ? "LEFT" : "RIGHT")}`)}
  <div class="stack gz">
    <div class="gz-stage" id="gzStage">
      <video id="gzVid" playsinline muted hidden></video><canvas id="gzCan" hidden></canvas>
      <svg id="gzSvg" preserveAspectRatio="xMidYMid meet" hidden></svg>
      <div class="gz-start" id="gzStart"><b>${esc(sp.view)}</b><span>Points: ${esc(sp.n.join(" · "))}</span>
        <div class="gz-row"><button class="primary" data-act="gzLive">${IC.cam} Use camera</button><label class="filebtn">Upload photo<input type="file" accept="image/*" id="gzFile" hidden></label></div></div>
      <div class="gz-hud top"><span class="glass gold" id="gzSrc" hidden></span><span class="glass" id="gzFound" hidden></span></div>
      <div class="gz-hud bot"><span class="glass" id="gzLevel" hidden></span><span class="glass" id="gzDragHint" hidden>Drag a point to adjust</span></div>
    </div>
    <div class="gz-read"><div><div class="label">${esc(gzLabel(i))}${gzSpec(i).mid ? "" : ", " + (GZ.side === "L" ? "left" : "right")}</div><div class="gz-big" id="gzBig">–<small>°</small></div></div><div class="gz-cmp" id="gzCmp"></div></div>
    <div class="gz-tools" id="gzTools" hidden><button data-act="gzFreeze" id="gzFreeze">Freeze frame</button><button data-act="gzAuto">Auto-detect points</button><label class="filebtn">New photo<input type="file" accept="image/*" id="gzFile2" hidden></label></div>
    <div class="gz-trials" id="gzTrials"></div>
    <p class="note">Keep the camera square to the joint and at its height. Photos are analysed on this device and never saved.</p>
  </div>`;
}
function gzCamStart() {
  GZS.mode = "cam"; GZS.trials = [];
  if (!GZS.levelOff && typeof DeviceOrientationEvent !== "undefined" && (typeof DeviceOrientationEvent.requestPermission !== "function" || GZ.sensorOk)) gzListen();
  gzModel();
  for (const id of ["gzFile", "gzFile2"]) $("#" + id)?.addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; if (f) gzPhoto(f); });
  const svg = $("#gzSvg");
  svg.addEventListener("pointerdown", e => {
    if (!GZS.pts) return; const pt = gzSvgPt(e), R = Math.max(GZS.W, GZS.H) * 0.09;
    let best = -1, bd = R; GZS.pts.forEach((p, k) => { const d = Math.hypot(p[0] - pt[0], p[1] - pt[1]); if (d < bd) { bd = d; best = k; } });
    if (best < 0) return; GZS.drag = best; GZS.auto = false; svg.setPointerCapture(e.pointerId); e.preventDefault();
  });
  svg.addEventListener("pointermove", e => { if (GZS.drag == null) return; const pt = gzSvgPt(e); GZS.pts[GZS.drag] = [Math.max(0, Math.min(GZS.W, pt[0])), Math.max(0, Math.min(GZS.H, pt[1]))]; gzDraw(); });
  const up = () => { GZS.drag = null; }; svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
  gzTrials();
}
function gzSvgPt(e) { const svg = $("#gzSvg"), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; }
function gzMedia(w, h) {
  GZS.W = w; GZS.H = h; const svg = $("#gzSvg"); svg.setAttribute("viewBox", `0 0 ${w} ${h}`); svg.removeAttribute("hidden");
  $("#gzStage").style.aspectRatio = `${w} / ${h}`; $("#gzStart").hidden = true; $("#gzTools").hidden = false; $("#gzDragHint").hidden = false;
  if (!GZS.pts) GZS.pts = [[w * .22, h * .42], [w * .5, h * .55], [w * .76, h * .45]];
}
async function gzLiveStart() {
  if (!navigator.mediaDevices?.getUserMedia) { toast("This browser has no camera access. Upload a photo instead."); return; }
  try {
    GZS.stream?.getTracks().forEach(t => t.stop());
    GZS.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1280 } } });
  } catch (e) { toast(e?.name === "NotAllowedError" ? "Camera access was blocked. Allow it in the browser settings, or upload a photo." : "The camera could not start. Upload a photo instead."); return; }
  if (GZ.screen !== "cam") return gzStop();
  const v = $("#gzVid"); v.srcObject = GZS.stream; v.hidden = false; $("#gzCan").hidden = true; await v.play().catch(() => {});
  await new Promise(r => v.videoWidth ? r() : v.addEventListener("loadedmetadata", r, { once: true }));
  GZS.live = true; GZS.auto = true; gzMedia(v.videoWidth, v.videoHeight);
  $("#gzSrc").hidden = false; $("#gzSrc").textContent = "● Live camera"; $("#gzFreeze").textContent = "Freeze frame";
  const loop = () => { if (!GZS.live) return; gzDraw(); GZS.raf = requestAnimationFrame(loop); }; loop();
  // Pose detection runs a few times a second; the points follow the body until the clinician drags one.
  GZS.det = setInterval(async () => { if (!GZS.live || !GZS.auto || GZS.busy) return; GZS.busy = true; await gzDetect(v, true); GZS.busy = false; }, 140);
}
function gzFreeze() {
  const v = $("#gzVid"), c = $("#gzCan");
  if (!GZS.live) return gzLiveStart();
  c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0);
  GZS.live = false; clearInterval(GZS.det); cancelAnimationFrame(GZS.raf); GZS.stream?.getTracks().forEach(t => t.stop()); GZS.stream = null;
  v.hidden = true; c.hidden = false; $("#gzSrc").textContent = "Frozen frame"; $("#gzFreeze").textContent = "Back to live";
  gzDraw();
}
async function gzPhoto(f) {
  if (!/^image\//.test(f.type)) { toast("Choose a photo file."); return; }
  let bmp; try { bmp = await createImageBitmap(f, { imageOrientation: "from-image" }); } catch { toast("That photo could not be opened."); return; }
  GZS.live = false; clearInterval(GZS.det); cancelAnimationFrame(GZS.raf); GZS.stream?.getTracks().forEach(t => t.stop()); GZS.stream = null;
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = $("#gzCan"), v = $("#gzVid");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
  v.hidden = true; c.hidden = false; GZS.pts = null; gzMedia(c.width, c.height);
  $("#gzSrc").hidden = false; $("#gzSrc").textContent = "Photo"; $("#gzFreeze").textContent = "Use camera";
  gzDraw(); GZS.auto = true; await gzDetect(c, false); gzDraw();
}
async function gzDetect(src, quiet) {
  const found = $("#gzFound"), lm = await gzModel();
  if (!lm) { if (!quiet) toast("The pose model could not load. Drag the three points by hand."); if (found) { found.hidden = false; found.textContent = "Place points by hand"; } return; }
  let L; try { L = lm.detect(src).landmarks?.[0]; } catch { return; }
  if (!found || GZ.screen !== "cam") return;
  found.hidden = false;
  if (!L) { found.textContent = "No body found · drag points"; return; }
  const ids = gzSpec(GZ.mi).cam.p.map(n => gzIdx(n, GZ.side)), ok = ids.every(k => (L[k].visibility ?? 1) > 0.35);
  const next = ids.map(k => [L[k].x * GZS.W, L[k].y * GZS.H]);
  // Light smoothing while live so the angle does not flicker.
  GZS.pts = GZS.pts && quiet ? GZS.pts.map((p, k) => [p[0] + .5 * (next[k][0] - p[0]), p[1] + .5 * (next[k][1] - p[1])]) : next;
  found.textContent = ok ? "✓ 3 points found" : "Check the points";
  if (!GZS.live) gzDraw();
}
function gzAngle([a, b, c]) {
  const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]], d = Math.hypot(...u) * Math.hypot(...v);
  return d ? Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / d))) * 180 / Math.PI : 0;
}
function gzDraw() {
  const svg = $("#gzSvg"); if (!svg || !GZS.pts) return;
  const sp = gzSpec(GZ.mi).cam, [a, b, c] = GZS.pts, ang = gzAngle(GZS.pts), val = Math.round(GZ_READ[sp.r](ang));
  const u = Math.max(GZS.W, GZS.H) / 400, la = Math.hypot(a[0] - b[0], a[1] - b[1]), lc = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const r = Math.max(14 * u, Math.min(la, lc) * .38), ua = [(a[0] - b[0]) / (la || 1), (a[1] - b[1]) / (la || 1)], uc = [(c[0] - b[0]) / (lc || 1), (c[1] - b[1]) / (lc || 1)];
  const s = [b[0] + ua[0] * r, b[1] + ua[1] * r], e = [b[0] + uc[0] * r, b[1] + uc[1] * r], sweep = ua[0] * uc[1] - ua[1] * uc[0] > 0 ? 1 : 0;
  let bi = [ua[0] + uc[0], ua[1] + uc[1]]; const bl = Math.hypot(...bi); bi = bl > .01 ? [bi[0] / bl, bi[1] / bl] : [-ua[1], ua[0]];
  const lx = b[0] + bi[0] * (r + 30 * u), ly = b[1] + bi[1] * (r + 30 * u), f = n => n.toFixed(1);
  const txt = `${val}°`, bw = (txt.length * 10 + 16) * u;
  svg.innerHTML = `<g stroke="#ffd60a" stroke-linecap="round" fill="none">
      <line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke-width="${3 * u}"/><line x1="${f(b[0])}" y1="${f(b[1])}" x2="${f(c[0])}" y2="${f(c[1])}" stroke-width="${3 * u}"/>
      <path d="M${f(b[0])} ${f(b[1])} L${f(s[0])} ${f(s[1])} A${f(r)} ${f(r)} 0 0 ${sweep} ${f(e[0])} ${f(e[1])} Z" fill="#ffd60a" fill-opacity=".16" stroke="none"/>
      <path d="M${f(s[0])} ${f(s[1])} A${f(r)} ${f(r)} 0 0 ${sweep} ${f(e[0])} ${f(e[1])}" stroke-width="${3 * u}"/></g>
    <g fill="#0a0a0a" stroke="#ffd60a" stroke-width="${3 * u}">${GZS.pts.map((p, k) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${(k === 1 ? 11 : 9) * u}"/>`).join("")}</g>
    <g font-family="IBM Plex Mono,monospace" font-size="${11 * u}" fill="#f6f4ec" paint-order="stroke" stroke="#0a0a0a" stroke-width="${3 * u}">${GZS.pts.map((p, k) => `<text x="${f(p[0] + 14 * u)}" y="${f(p[1] - 12 * u)}">${esc(sp.n[k])}</text>`).join("")}</g>
    <rect x="${f(lx - bw / 2)}" y="${f(ly - 15 * u)}" width="${f(bw)}" height="${30 * u}" rx="${8 * u}" fill="#0a0a0a" stroke="#ffd60a" stroke-width="${1.5 * u}"/>
    <text x="${f(lx)}" y="${f(ly + 6 * u)}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-weight="600" font-size="${16 * u}" fill="#ffd60a">${txt}</text>`;
  GZS.val = val; gzReadout(val);
}
function gzReadout(val) {
  const i = GZ.mi, norm = ROM_LIST[i][2], st = gzStatus(val, norm), big = $("#gzBig"); if (!big) return;
  big.innerHTML = `${val ?? "–"}<small>°</small>`;
  const os = GZ.side === "L" ? "R" : "L", ov = gzSpec(i).mid ? null : gzVal(i, os);
  $("#gzCmp").innerHTML = `${st ? chip(st) : ""}${ov != null && val != null ? `<div class="psub">${os === "L" ? "Left" : "Right"} ${ov}° · ${Math.abs(ov - val)}° ${val < ov ? "less" : val > ov ? "more" : "same"}</div>` : ""}`;
  const k = $("#gzKeep"); if (k) { k.disabled = val == null; k.textContent = val == null ? "Keep as trial" : `Keep ${val}° as trial ${Math.min(GZS.trials.length + 1, 3)}`; }
}
function gzTrials() {
  const t = GZS.trials || [], box = $("#gzTrials"); if (!box) return;
  const best = t.length ? Math.max(...t) : null, bi = t.indexOf(best);
  box.innerHTML = t.length ? t.map((v, k) => `<div class="gz-trial${k === bi ? " best" : ""}"><span>Trial ${k + 1}${k === bi && t.length > 1 ? " · best" : ""}</span><b>${v}°</b></div>`).join("") : `<div class="psub">Take up to 3 trials. The best one is used.</div>`;
  const u = $("#gzUse"); if (u) { u.disabled = !t.length; u.textContent = t.length ? `Use ${best}°${t.length > 1 ? ` (best of ${t.length})` : ""}` : "Use reading"; }
}
function gzKeep(v) {
  if (v == null || !isFinite(v)) return;
  GZS.trials.push(Math.round(v)); if (GZS.trials.length > 3) GZS.trials.shift();
  gzTrials(); if (GZS.mode === "cam") gzReadout(GZS.val); else gzDial();
}
function gzUse() {
  const t = GZS.trials || []; if (!t.length) return;
  const i = GZ.mi, mid = !!gzSpec(i).mid, side = mid ? "L" : GZ.side;
  GZ.readings = GZ.readings.filter(r => !(r.mi === i && r.side === side));
  GZ.readings.push({ mi: i, side, mid, val: Math.max(...t), n: t.length, method: GZS.mode });
  GZ.screen = "review"; gzRender();
}

/* ----- Phone tilt: the angle between the phone's "up" now and at zero ----- */
function gzTiltHTML() {
  const i = GZ.mi, sp = gzSpec(i);
  chrome(null, `<button data-act="gzZero" id="gzZeroB">Zero here</button><button class="primary wide" data-act="gzUse" id="gzUse" disabled>Use reading</button>`);
  return `${gzHead("Phone tilt", `${esc(gzLabel(i).toUpperCase())}${sp.mid ? "" : " · " + (GZ.side === "L" ? "LEFT" : "RIGHT")}`)}
  <div class="stack gz">
    <div class="gz-how"><span class="label" id="gzStep">${sp.two ? "Reading 1 of 2 · phone at T12" : "Set up"}</span><p>${esc(sp.tilt)}</p></div>
    <div class="gz-dialwrap"><svg id="gzDial" viewBox="0 0 300 300" role="img" aria-label="Angle dial"></svg></div>
    <div class="gz-trials" id="gzTrials"></div>
    <div class="gz-tools"><button data-act="gzAutoCap" id="gzAutoCap" aria-pressed="true">Auto-capture when still</button><button data-act="gzSound" id="gzSoundB" aria-pressed="${GZ.sound !== false}">Sound</button><button data-act="gzCapture">Capture now</button></div>
    <p class="note" id="gzTiltMsg">Place the phone, hold the start position and tap <b>Zero here</b>.</p>
  </div>`;
}
function gzTiltStart() { GZS.mode = "tilt"; GZS.trials = []; GZS.autoCap = true; GZS.step = 1; gzTrials(); gzDial(); }
function gzListen() {
  if (GZS.or) return;
  GZS.or = e => {
    if (e.beta == null || e.gamma == null) return;
    const b = e.beta * Math.PI / 180, g = e.gamma * Math.PI / 180;
    GZS.u = [-Math.sin(g) * Math.cos(b), Math.sin(b), Math.cos(g) * Math.cos(b)]; GZS.got = true;
    GZS.mode === "tilt" ? gzTiltTick() : gzLevel();
  };
  addEventListener("deviceorientation", GZS.or);
}
// iOS asks once for motion access, and only from a tap.
async function gzSensorPermit() {
  if (typeof DeviceOrientationEvent === "undefined") return false;
  if (typeof DeviceOrientationEvent.requestPermission === "function" && !GZ.sensorOk) {
    try { GZ.sensorOk = (await DeviceOrientationEvent.requestPermission()) === "granted"; } catch { GZ.sensorOk = false; }
    return GZ.sensorOk;
  }
  return true;
}
function gzLevel() {
  const el = $("#gzLevel"); if (!el || !GZS.u) return;
  const dev = Math.round(Math.min(Math.acos(Math.min(1, Math.abs(GZS.u[1]))), Math.acos(Math.min(1, Math.abs(GZS.u[2])))) * 180 / Math.PI);
  el.hidden = false; el.textContent = dev <= 5 ? "✓ Camera square" : `Tilt the phone ${dev}° to square it`; el.classList.toggle("gold", dev <= 5);
}
function gzTiltTick() {
  if (GZS.zeroNext) { GZS.u0 = GZS.u; GZS.zeroNext = false; GZS.ang = 0; GZS.hist = []; GZS.armed = true; gzMsg(GZ_SPEC_TWO() && GZS.step === 2 ? "Zeroed on the sacrum. Bend forward fully and hold still." : "Zeroed. Move to the end of the range and hold still."); }
  if (!GZS.u0) return;
  const d = GZS.u[0] * GZS.u0[0] + GZS.u[1] * GZS.u0[1] + GZS.u[2] * GZS.u0[2], raw = Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI;
  GZS.ang = GZS.ang == null ? raw : GZS.ang + .35 * (raw - GZS.ang);
  const t = performance.now(); GZS.hist.push([t, GZS.ang]); while (GZS.hist.length && t - GZS.hist[0][0] > 1000) GZS.hist.shift();
  const vals = GZS.hist.map(h => h[1]); GZS.steady = GZS.hist.length > 5 && t - GZS.hist[0][0] > 850 && Math.max(...vals) - Math.min(...vals) <= 1.5;
  if (!GZS.armed && GZS.ang < 5) { GZS.armed = true; gzMsg("Ready for the next trial."); }
  if (GZS.autoCap && GZS.armed && GZS.steady && GZS.ang >= 8) gzCapture();
  if (!GZS.drawQ) { GZS.drawQ = true; requestAnimationFrame(() => { GZS.drawQ = false; gzDial(); }); }
}
const GZ_SPEC_TWO = () => !!gzSpec(GZ.mi).two;
function gzMsg(m) { const el = $("#gzTiltMsg"); if (el) el.textContent = m; }
function gzBeep() {
  navigator.vibrate?.(60); if (GZ.sound === false) return;
  try { const ac = GZS.ac ||= new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; g.gain.value = .12; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .12); } catch {}
}
function gzCapture() {
  if (!GZS.u0 || GZS.ang == null) { gzMsg("Tap Zero here first, with the phone in the start position."); return; }
  const v = Math.round(GZS.ang); GZS.armed = false; gzBeep();
  if (GZ_SPEC_TWO()) {
    if (GZS.step === 1) { GZS.first = v; GZS.step = 2; GZS.u0 = null; $("#gzStep").textContent = "Reading 2 of 2 · phone on the sacrum"; gzMsg(`Reading 1: ${v}°. Move the phone to the sacrum, stand upright and tap Zero here.`); gzDial(); return; }
    const lum = Math.max(0, GZS.first - v); GZS.step = 1; GZS.u0 = null; $("#gzStep").textContent = "Reading 1 of 2 · phone at T12";
    gzKeep(lum); gzMsg(`T12 ${GZS.first}° − sacrum ${v}° = ${lum}° lumbar flexion. For another trial, move the phone back to T12 and zero.`); return;
  }
  gzKeep(v); gzMsg(`Captured ${v}°. Return to the start position for the next trial.`);
}
function gzDial() {
  const svg = $("#gzDial"); if (!svg) return;
  const norm = ROM_LIST[GZ.mi][2], a = GZS.u0 && GZS.ang != null ? Math.min(GZS.ang, 359) : null, pt = (deg, r) => [150 + r * Math.sin(deg * Math.PI / 180), 150 - r * Math.cos(deg * Math.PI / 180)];
  const arc = (deg, r) => { const [x, y] = pt(deg, r); return `M150 ${150 - r} A${r} ${r} 0 ${deg > 180 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`; };
  const ticks = Array.from({ length: 12 }, (_, k) => { const [x1, y1] = pt(k * 30, 126), [x2, y2] = pt(k * 30, 114); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }).join("");
  const [nx, ny] = pt(norm || 0, 146), [hx, hy] = pt(a ?? 0, 120), [gx, gy] = pt(a ?? 0, 84);
  const status = !GZS.u0 ? (GZS.got ? "Tap Zero here" : "Waiting for the sensor") : GZS.steady && GZS.ang >= 8 ? "● Steady" : "Hold still at the end";
  svg.innerHTML = `<defs><linearGradient id="gzArc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe866"/><stop offset="1" stop-color="#ff9f43"/></linearGradient></defs>
    <circle cx="150" cy="150" r="128" fill="#111" stroke="#2a2925" stroke-width="2"/><g stroke="#3a3833" stroke-width="2">${ticks}</g>
    ${norm ? `<path d="${arc(norm, 138)}" fill="none" stroke="#5bd38b" stroke-width="2" opacity=".6"/><text x="${nx.toFixed(0)}" y="${ny.toFixed(0)}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11" fill="#5bd38b">${norm}°</text>` : ""}
    ${a > .5 ? `<path d="${arc(a, 120)}" fill="none" stroke="url(#gzArc)" stroke-width="12" stroke-linecap="round"/>` : ""}
    <line x1="150" y1="58" x2="150" y2="22" stroke="#f6f4ec" stroke-width="2" stroke-dasharray="4 5" opacity=".45"/>
    <line x1="${gx.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#ffd60a" stroke-width="4" stroke-linecap="round"/><circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="7" fill="#ffd60a"/>
    <text x="150" y="74" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10" fill="#a19d90">ZERO</text>
    <text x="150" y="162" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-weight="600" font-size="54" fill="#f6f4ec">${a != null ? Math.round(a) + "°" : "–"}</text>
    <text x="150" y="198" text-anchor="middle" font-family="Archivo,sans-serif" font-size="13" fill="${GZS.steady && a >= 8 ? "#5bd38b" : "#a19d90"}">${status}</text>`;
}
async function gzZero() {
  if (!(await gzSensorPermit())) { gzMsg("Motion access was not allowed. Allow Motion & Orientation for this site in the browser settings, then try again."); return; }
  gzListen(); GZS.zeroNext = true;
  setTimeout(() => { if (GZ?.screen === "tilt" && !GZS.got) gzMsg("No motion sensor found. Phone tilt needs a phone or tablet; use Camera on a computer."); }, 1500);
}

/* ----- Review and save ----- */
function gzReviewHTML() {
  const rows = [...new Set(GZ.readings.map(r => r.mi))];
  chrome(null, `<button data-act="gzAnother">+ Another</button><button class="primary wide" data-act="gzSave" ${GZ.readings.length ? "" : "disabled"}>Save ${GZ.readings.length} to record</button>`);
  const cell = (i, s) => { const v = gzVal(i, s), st = gzStatus(v, ROM_LIST[i][2]); return `<span class="v ${st ? st[1] : ""}">${v == null ? "–" : v + "°"}</span>`; };
  const last = GZ.readings.at(-1), lv = last && !last.mid ? [gzVal(last.mi, "L"), gzVal(last.mi, "R")] : null;
  const bar = (s, v) => { const n = ROM_LIST[last.mi][2], pc = n ? Math.max(4, Math.min(100, 100 * v / n)) : v <= -5 ? 60 : 100, st = gzStatus(v, n); return `<div class="gz-bar"><span>${s}</span><i><b class="${st[1]}" style="width:${pc.toFixed(0)}%"></b></i><em>${v}°</em></div>`; };
  return `${gzHead("Today's measures", 'MOTIONPLUS <b class="pro">PRO</b> · GONIOMETER')}
  <div class="stack gz">
    <div class="gz-tbl"><div class="tr h"><span>Movement</span><span>Left</span><span>Right</span><span></span></div>
    ${rows.map(i => { const r = GZ.readings.filter(x => x.mi === i), sp = gzSpec(i); return `<div class="tr"><span>${esc(gzLabel(i))}<small>Normal ${ROM_LIST[i][2]}° · ${[...new Set(r.map(x => gzMeth(x.method).toLowerCase()))].join(" + ")}</small></span>${sp.mid ? `<span class="v mid">${cell(i, "L")}</span><span></span>` : `${cell(i, "L")}${cell(i, "R")}`}<button class="gz-del" data-act="gzDel" data-i="${i}" aria-label="Remove ${esc(gzLabel(i))}">✕</button></div>`; }).join("") || `<div class="empty">No readings yet.</div>`}</div>
    ${lv && lv[0] != null && lv[1] != null ? `<div class="gz-lr"><div class="gz-lrh"><span>Left vs right, ${esc(gzLabel(last.mi).toLowerCase())}</span><b>${lv[0] === lv[1] ? "Equal" : `${Math.abs(lv[0] - lv[1])}° difference`}</b></div>${bar("L", lv[0])}${bar("R", lv[1])}</div>` : ""}
    <p class="note">Saves into <b>Range of Motion (Goniometry)</b> for today${gzRecToday(GZ.pid) ? ", adding to the one already started" : ""}. It then charts over time, flags anything under 80% of normal, and appears in PDFs and AI reports. Fingers and toes: use a hand goniometer and type them into the form.</p>
  </div>`;
}
function gzSave() {
  if (!GZ?.readings.length) return;
  const old = gzRecToday(GZ.pid), rec = old ? JSON.parse(JSON.stringify(old)) : { id: uid(), pid: GZ.pid, tid: "rom", date: today(), values: {}, notes: "", created: Date.now(), ...(db.settings.therapist ? { by: db.settings.therapist } : {}) };
  const meth = new Map((rec.values.gonio || "").split(";").filter(Boolean).map(x => x.split(":"))), lines = [];
  for (const r of GZ.readings) {
    const id = gzField(r.mi), cur = rec.values[id] && typeof rec.values[id] === "object" ? rec.values[id] : {};
    rec.values[id] = { ...cur, [r.side]: String(r.val) }; meth.set(id + r.side, r.method);
    lines.push(`${gzLabel(r.mi)}${r.mid ? "" : " " + r.side} ${r.val}° (${gzMeth(r.method).toLowerCase()}${r.n > 1 ? `, best of ${r.n}` : ""})`);
  }
  rec.values.gonio = [...meth].map(x => x.join(":")).join(";");
  rec.notes = (rec.notes ? rec.notes + "\n" : "") + "Goniometer: " + lines.join("; ") + ".";
  if (old) db.assessments[db.assessments.indexOf(old)] = rec; else db.assessments.push(rec);
  if (!save()) return; checkGoals(rec.pid);
  const n = GZ.readings.length; GZ = null; toast(`${n} movement${n > 1 ? "s" : ""} saved to ${P(rec.pid).code}`); if (!sessNote(GONIO, rec.pid, rec.id)) go("result", rec.id);
}

const GZ_ACT = {
  gzJoint: d => { const j = GZ_JOINTS.find(x => x[0] === d.j); GZ.mi = ROM_LIST.findIndex(r => j[1].includes(r[0])); GZ.method = null; gzRender(); },
  gzMove: d => { GZ.mi = +d.i; GZ.method = null; gzRender(); },
  gzSide: d => { GZ.side = d.s; gzRender(); },
  gzMethod: d => { GZ.method = d.m; gzRender(); },
  gzStart: async () => {
    const sp = gzSpec(GZ.mi), m = sp[GZ.method] ? GZ.method : sp.m;
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function" && GZ.sensorOk == null) await gzSensorPermit();
    GZ.screen = m; gzRender();
  },
  gzLive: () => gzLiveStart(),
  gzFreeze: () => gzFreeze(),
  gzAuto: async () => { GZS.auto = true; const src = GZS.live ? $("#gzVid") : $("#gzCan"); if (src && GZS.W) { $("#gzFound").hidden = false; $("#gzFound").textContent = "Finding points…"; await gzDetect(src, false); } },
  gzKeep: () => gzKeep(GZS.val),
  gzUse: () => gzUse(),
  gzZero: () => gzZero(),
  gzCapture: () => gzCapture(),
  gzAutoCap: (d, b) => { GZS.autoCap = !GZS.autoCap; b.setAttribute("aria-pressed", GZS.autoCap); },
  gzSound: (d, b) => { GZ.sound = GZ.sound === false; b.setAttribute("aria-pressed", GZ.sound !== false); },
  gzReview: () => { GZ.screen = "review"; gzRender(); },
  gzAnother: () => { GZ.screen = "setup"; gzRender(); },
  gzDel: d => { GZ.readings = GZ.readings.filter(r => r.mi !== +d.i); gzRender(); },
  gzSave: () => gzSave(),
  gzBack: () => {
    if (GZ.screen !== "setup") { GZ.screen = "setup"; return gzRender(); }
    if (GZ.readings.length && !confirm(`Leave without saving ${GZ.readings.length} reading${GZ.readings.length > 1 ? "s" : ""}?`)) return;
    const pid = GZ.pid; GZ = null; go("patient", pid);
  },
};
