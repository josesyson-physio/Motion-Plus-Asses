/* ---------- Consultation room ----------
   A full-screen presentation the therapist walks the patient through before any printout. Each slide
   teaches one thing the patient needs to support their own treatment, shown rather than written:
   results as rings, the real anatomy in 3D with the problem lit up, the lever behind the movement,
   how it may have started (always a possibility), a pain traffic light for exercising safely, the
   rehab plan as a timeline, and a three-question check that the patient has understood (teach-back).
   Slides can be read aloud with the device's own voice. */

// Each joint: what it is in plain words, its lever, common mechanisms of injury and a default
// four-phase rehab plan the therapist can edit.
const JOINTS = {
  knee: {
    name: "Knee", move: "Straightening the knee (sitting)", side: true,
    lever: { cls: 3, F: "Knee joint", E: "Quadriceps, through the kneecap", L: "Weight of the lower leg", pos: { F: .06, E: .21, L: .9 },
      pulley: { label: "Kneecap", gain: 1.4, note: "The kneecap lifts the tendon away from the joint like a pulley, so the quadriceps work about a third less hard." },
      story: "When you straighten your knee, the thigh muscle pulls very close to the hinge while the weight sits far out at the foot." },
    mech: [
      { id: "acl", kw: /\b(acl|cruciate)\b/i, h: "Ligament strain from a sudden stop or twist", flow: ["Landing, stopping or changing direction suddenly", "The knee drops inward and twists", "The ACL ligament inside the knee is over-stretched", "Swelling, the knee giving way"] },
      { id: "meniscus", kw: /menisc|cartilage tear/i, h: "Cartilage pinched in a twist", flow: ["Turning on a bent, weight-bearing knee", "The cartilage is caught between the bones", "The meniscus is strained or torn", "Catching, locking, pain at the joint line"] },
      { id: "pfp", kw: /patell|pfps|anterior knee|runner/i, h: "Overload behind the kneecap", flow: ["Repeated stairs, squats, running or kneeling", "Higher pressure behind the kneecap, often with weak hip and thigh muscles", "The joint behind the kneecap is irritated", "Pain at the front of the knee"] },
      { id: "oa", kw: /\boa\b|osteoarth|tkr|tka|degenerat/i, h: "Wear over time", flow: ["Load on the knee over many years, past injury or weakness", "Joint surfaces wear and the bone reacts", "Cartilage and bone of the knee change", "Stiffness and pain with activity"] },
      { id: "tendon", kw: /tendin|jumper/i, h: "Tendon overload", flow: ["A quick increase in jumping or running", "The tendon is loaded faster than it can adapt", "The tendon below the kneecap is irritated", "Pain below the kneecap when loading"] }],
    rehab: [["Ice, elevation and gentle bending within comfort", "Thigh tightening and straight-leg raises", "Walk with support if needed; avoid twisting"],
      ["Heel slides and an exercise bike to restore the bend", "Heel prop to get the knee fully straight", "Balance on both legs, then one"],
      ["Sit-to-stand, step-ups and mini squats", "Hip and hamstring strengthening", "Single-leg balance and control"],
      ["Build up walking, stairs and sport step by step", "Hop and landing practice if returning to sport", "A home programme to keep the strength"]] },
  hip: {
    name: "Hip", move: "Lifting the leg out to the side", side: true,
    lever: { cls: 1, F: "Hip joint", E: "Gluteus medius (side of the hip)", L: "Body weight", pos: { E: .1, F: .34, L: .92 },
      pulley: { label: "Bony bump of the hip", gain: 1.25, note: "The bony bump at the side of the hip holds the muscle out, giving it a longer lever." },
      story: "Standing on one leg, the hip is a see-saw: the muscles on the outside balance your whole body weight on the other side." },
    mech: [
      { id: "oa", kw: /\boa\b|osteoarth|thr|degenerat/i, h: "Wear over time", flow: ["Load on the hip over many years", "Joint surfaces wear and the bone reacts", "Cartilage of the hip joint changes", "Groin pain and stiffness"] },
      { id: "glut", kw: /glut|trochant|bursit|lateral hip/i, h: "Tendon squeezed at the side of the hip", flow: ["Lying on that side, crossing legs, standing on one leg", "The tendon is pressed against the bony bump", "Gluteal tendons are irritated", "Pain at the side of the hip, worse at night"] },
      { id: "fai", kw: /\bfai\b|impinge|labr/i, h: "Pinching at the front of the hip", flow: ["Deep bending with turning", "The bone edges meet at the front of the hip", "The rim cartilage (labrum) is pinched", "Pinching pain in the groin"] },
      { id: "fall", kw: /fractur|\bnof\b|fall/i, h: "A fall onto the side", flow: ["A fall onto the hip", "A large force through a weaker bone", "The neck of the thigh bone can break", "Pain, unable to stand"] }],
    rehab: [["Walking aid if needed; avoid lying on the sore side", "Gentle hip bends and glute squeezes", "Pillow between the knees at night"],
      ["Hip movement in all directions within comfort", "Bridges and side-lying leg lifts", "Even walking pattern practice"],
      ["Side steps with a band and step-ups", "Single-leg stance and sit-to-stand", "Core and hip strengthening"],
      ["Longer walks, stairs and hills", "Return to sport or work tasks step by step", "A home programme to keep the strength"]] },
  ankle: {
    name: "Ankle", move: "Pointing the foot (rising onto the toes)", side: true,
    lever: { cls: 2, F: "Ball of the foot", E: "Calf, through the Achilles", L: "Body weight through the ankle", pos: { F: .06, L: .6, E: .94 },
      pulley: { label: "Outer ankle bone", gain: 1, note: "The peroneal tendons wrap behind the outer ankle bone, which turns their pull under the foot like a pulley." },
      story: "Rising onto your toes is a wheelbarrow lever: the calf lifts your whole body using the long lever of the foot." },
    mech: [
      { id: "sprain", kw: /sprain|inversion|ligament|rolled/i, h: "Rolling the ankle", flow: ["The foot rolls inward with the toes pointed", "The outer ankle ligaments are over-stretched", "Ligaments on the outside of the ankle are strained", "Swelling, bruising, feeling unstable"] },
      { id: "achilles", kw: /achill/i, h: "Achilles overload", flow: ["A quick rise in running, jumping or hills", "The tendon is loaded faster than it adapts", "The Achilles tendon is irritated", "Morning stiffness and pain at the back of the heel"] },
      { id: "plantar", kw: /plantar|heel pain/i, h: "Strain under the foot", flow: ["Long standing or walking, a tight calf, a sudden rise in activity", "Repeated stretch on the sole of the foot", "The plantar fascia is irritated", "Heel pain with the first steps"] },
      { id: "fracture", kw: /fractur/i, h: "A break from a twist or fall", flow: ["A twist or fall with high force", "The bone fails under the load", "Ankle bones break", "Pain, unable to bear weight"] }],
    rehab: [["Rest, ice, compression and elevation", "Ankle circles and alphabet within comfort", "Walk with a brace or aid if needed"],
      ["Calf stretches and full ankle movement", "Balance on both feet, then one", "Even walking pattern practice"],
      ["Heel raises, then single-leg heel raises", "Balance on a cushion or with eyes closed", "Band exercises in all directions"],
      ["Jogging, hopping and changing direction step by step", "Sport or work tasks", "A home programme to keep the balance and strength"]] },
  shoulder: {
    name: "Shoulder", move: "Lifting the arm out to the side", side: true,
    lever: { cls: 3, F: "Shoulder joint", E: "Deltoid", L: "Weight of the arm", pos: { F: .06, E: .19, L: .92 },
      pulley: { label: "Top of the arm bone", gain: 1.2, note: "The round top of the arm bone holds the deltoid out, and the rotator cuff keeps the ball centred so the deltoid can lift." },
      story: "Lifting your arm, the deltoid pulls close to the joint while the weight of the arm hangs far out at the hand." },
    mech: [
      { id: "cuff", kw: /rotator|cuff|impinge|tendin|subacrom/i, h: "Tendons squeezed under the arch", flow: ["Repeated reaching overhead, often with tired shoulder-blade muscles", "The tendons are squeezed under the bony arch", "The rotator cuff tendons are irritated", "Pain lifting the arm out to the side"] },
      { id: "rigid", kw: /parkinson|rigidit/i, h: "Stiffness from moving the arm less", flow: ["Parkinson's stiffness and less arm swing", "The shoulder moves less through its full range", "The joint capsule and cuff tighten", "Pain and stiffness lifting and reaching"] },
      { id: "frozen", kw: /frozen|adhesive|capsulit/i, h: "The joint capsule tightens", flow: ["Often no injury; more common with diabetes or after not moving", "The joint lining thickens and tightens", "The shoulder capsule stiffens", "Stiffness and pain in every direction"] },
      { id: "disloc", kw: /disloc|instab|sublux/i, h: "The ball slips out of the socket", flow: ["The arm is forced back while raised to the side", "The ball is pushed out of the shallow socket", "The front of the capsule and its rim are stretched", "Pain, apprehension, the shoulder feels loose"] },
      { id: "tear", kw: /\btear\b|fall/i, h: "A tendon tear", flow: ["A fall on an outstretched arm, or wear over time", "Tendon fibres fail under the load", "The rotator cuff tendon tears", "Weakness lifting the arm"] }],
    rehab: [["Rest from painful reaching; ice or heat", "Pendulum swings and gentle assisted movement", "Shoulder-blade setting and posture"],
      ["Wall slides and stick-assisted lifting", "Stretching into the stiff directions", "Isometric cuff exercises"],
      ["Band rotation and rowing", "Lifting and pressing with light weights", "Shoulder-blade strength and control"],
      ["Overhead and work or sport tasks step by step", "Throwing or lifting practice if needed", "A home programme to keep the strength"]] },
  elbow: {
    name: "Elbow", move: "Bending the elbow", side: true,
    lever: { cls: 3, F: "Elbow joint", E: "Biceps", L: "The hand and what it holds", pos: { F: .06, E: .17, L: .92 }, pulley: null,
      story: "Bending your elbow, the biceps attach just below the hinge, so they pull many times the weight in your hand. That trade gives the hand speed and reach." },
    mech: [
      { id: "tennis", kw: /tennis|lateral epicond/i, h: "Overload of the wrist muscles' attachment", flow: ["Repeated gripping, typing or lifting with the palm down", "The tendon attachment is loaded more than it adapts", "Tendons on the outside of the elbow are irritated", "Pain when gripping and lifting"] },
      { id: "golfer", kw: /golfer|medial epicond/i, h: "Overload on the inner elbow", flow: ["Repeated gripping and bending the wrist", "The tendon attachment is overloaded", "Tendons on the inside of the elbow are irritated", "Pain on the inner elbow when gripping"] },
      { id: "fall", kw: /fractur|disloc|fall/i, h: "A fall on the hand", flow: ["A fall on an outstretched hand", "The force travels up the forearm", "Elbow bones or ligaments are injured", "Pain, swelling, loss of bend"] }],
    rehab: [["Rest from the painful grip; ice", "Gentle elbow and wrist movement", "A strap or brace if advised"],
      ["Stretches for the forearm muscles", "Pain-free grip squeezes", "Full bend and straighten practice"],
      ["Slow wrist curls with light weights", "Forearm turning with a weight", "Grip strength building"],
      ["Work, sport or lifting tasks step by step", "Check grip and tool technique", "A home programme to keep the strength"]] },
  lumbar: {
    name: "Lower back", move: "Bending forward", side: false,
    lever: { cls: 1, F: "Lowest disc of the back", E: "Back muscles", L: "Upper body and what you lift", pos: { E: .1, F: .2, L: .92 },
      pulley: null, story: "Bending forward, the back muscles sit very close to the pivot, so they pull many times the weight in front of you. Keeping a load close cuts that pull." },
    mech: [
      { id: "disc", kw: /disc|sciatica|radicul|prolapse|herniat/i, h: "Pressure on a disc", flow: ["Repeated or long bending, often lifting with a twist", "Pressure pushes the disc backward", "The disc and a nearby nerve are irritated", "Back pain, sometimes pain down the leg"] },
      { id: "strain", kw: /strain|sprain|lift/i, h: "Muscle or ligament strain", flow: ["Lifting a load far from the body, or an awkward twist", "The back muscles pull many times the load", "Muscles and ligaments of the low back are strained", "Sharp pain and muscle spasm"] },
      { id: "facet", kw: /facet|spondyl|stenosis/i, h: "Small back joints compressed", flow: ["Repeated arching back, long standing, twisting", "The small joints at the back are compressed", "Facet joints are irritated", "Pain bending backward or standing"] },
      { id: "posture", kw: /sitting|posture|desk/i, h: "Long periods in one position", flow: ["Long periods of slumped sitting", "A steady load on the same tissues", "Discs and ligaments are strained", "Stiffness and ache after sitting"] }],
    rehab: [["Keep moving gently; short walks", "Comfortable positions and pacing", "Heat and relaxed breathing"],
      ["Pelvic tilts, knee rolls and gentle bending", "Nerve gliding if there is leg pain", "Change position often when sitting"],
      ["Bridges, bird-dog and side planks", "Squat and hip-hinge lifting practice", "Gradual walking and fitness"],
      ["Lifting, work and sport tasks step by step", "Keep loads close to the body", "A home programme and an activity plan"]] },
  neck: {
    name: "Neck", move: "Nodding the head forward", side: false,
    lever: { cls: 1, F: "Top of the neck", E: "Neck muscles at the back", L: "Weight of the head", pos: { E: .12, F: .38, L: .66 },
      pulley: null, story: "Your head balances on top of the neck like a see-saw. The further it drifts forward, the harder the muscles at the back must pull." },
    mech: [
      { id: "fhp", kw: /posture|forward head|desk|text neck/i, h: "Head forward for long periods", flow: ["Hours looking down at a screen", "The head drifts forward and the lever gets longer", "Neck muscles and joints at the back are overloaded", "Neck ache and headaches"] },
      { id: "whiplash", kw: /whiplash|\brta\b|\bmva\b|car/i, h: "A sudden jolt", flow: ["A sudden jolt, such as a car accident", "The head whips back and forth", "Neck muscles, ligaments and joints are strained", "Pain, stiffness, headache"] },
      { id: "nerve", kw: /radicul|arm pain|cervical disc|spondyl/i, h: "A nerve under pressure", flow: ["Wear over years or a disc problem", "The space for the nerve narrows", "A nerve in the neck is irritated", "Pain, tingling or weakness in the arm"] }],
    rehab: [["Gentle neck movement in every direction", "Heat and relaxed breathing", "Screen at eye level, frequent breaks"],
      ["Chin tucks and shoulder-blade setting", "Stretching tight neck and chest muscles", "Nerve gliding if there is arm pain"],
      ["Deep neck flexor and upper back strength", "Rowing and shoulder strength", "Posture endurance through the day"],
      ["Work and sport tasks step by step", "A desk and sleep set-up that suits you", "A home programme to keep it going"]] },
};
const JOINT_DX = [[/\b(knee|acl|pcl|mcl|menisc\w*|patell\w*|tkr|tka)\b/i, "knee"], [/\b(ankle|achilles|foot|plantar|heel)\b/i, "ankle"], [/\b(hip|thr|femo\w*|glute\w*|trochant\w*)\b/i, "hip"],
  [/\b(shoulder|rotator|frozen|humer\w*|impinge\w*|cuff)\b/i, "shoulder"], [/\b(elbow|epicondyl\w*|tennis|golfer)\b/i, "elbow"], [/\b(neck|cervical|whiplash)\b/i, "neck"], [/\b(back|lumbar|disc|sciatica|spine|spinal|lbp)\b/i, "lumbar"]];
const PHASES = [["Settle pain and protect", "Weeks 0–2"], ["Restore movement", "Weeks 2–6"], ["Build strength and control", "Weeks 6–12"], ["Back to what matters", "Week 12 on"]];
const jointHit = p => !!(JOINTS[p.rehab?.joint] || JOINT_DX.some(r => r[0].test(p.dx || "")));
function jointFor(p) {
  if (JOINTS[p.rehab?.joint]) return p.rehab.joint;
  const s = `${p.dx} ${p.notes}`, hit = JOINT_DX.find(r => r[0].test(s)); if (hit) return hit[1];
  return { knee: "knee", spine: "lumbar", shoulder: "shoulder", balance: "hip" }[regionFor(p, explainData(p.id))] || "knee";
}
const sideOf = p => /\bleft\b|\blt\b/i.test(p.dx) && !/\bright\b/i.test(p.dx) ? "L" : /\bright\b|\brt\b/i.test(p.dx) ? "R" : "";
// The therapist's plan for this patient, or a starting plan from the joint's defaults.
function rehabOf(p, jk) {
  const r = p.rehab, k = jk || jointFor(p), J = JOINTS[k];
  if (r && r.joint === k && Array.isArray(r.phases)) return r;
  const s = `${p.dx} ${p.notes}`, nc = !jointHit(p) && NCONDS.find(c => c.kw.test(s));
  if (nc) return { joint: k, mech: [], phases: PHASES.map(([h, wk], i) => ({ h: NREHAB[nrehabKey(nc)][i][0] || h, wk, items: NREHAB[nrehabKey(nc)][i].slice(1) })), now: 0 };
  return { joint: k, mech: J.mech.filter(m => m.kw.test(s)).map(m => m.id), phases: PHASES.map(([h, wk], i) => ({ h, wk, items: J.rehab[i].slice() })), now: 0 };
}

/* ---------- The lever, drawn flat: pivot, effort and load, with the pulley on or off ---------- */
const LEVER_CLS = { 1: ["First-class lever", "A see-saw: the pivot sits between the muscle and the load."], 2: ["Second-class lever", "A wheelbarrow: the load sits between the pivot and the muscle, so the muscle has the longer arm and wins on force."], 3: ["Third-class lever", "Like a fishing rod: the muscle pulls between the pivot and the load. Built for speed and range, not force."] };
function leverMath(L, s, pul) {
  const g = L.pulley && pul === false ? L.pulley.gain : 1, F = L.pos.F, E = F + (L.pos.E - F) / g, Lo = Math.max(.02, Math.min(.98, F + (L.pos.L - F) * s));
  return { F, E, Lo, ratio: Math.abs(Lo - F) / Math.max(.01, Math.abs(E - F)) };
}
function leverSVG(L, s, pul, tilt) {
  const W = 360, x0 = 24, x1 = 336, cy = 132, m = leverMath(L, s, pul), X = f => x0 + f * (x1 - x0), fx = X(m.F), a = tilt * Math.PI / 180;
  const R = (x, y) => [fx + (x - fx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - fx) * Math.sin(a) + (y - cy) * Math.cos(a)];
  const [ex, ey] = R(X(m.E), cy - 6), [lx, ly] = R(X(m.Lo), cy - 6), [ax0, ay0] = R(x0, cy), [ax1, ay1] = R(x1, cy), up = L.cls !== 1, sw = Math.max(3, Math.min(13, 2 + m.ratio * 1.6));
  const arrow = (x, y, dy, col, w, cls) => `<g class="${cls}"><line x1="${x}" y1="${y}" x2="${x}" y2="${y + dy}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x - 7 - w / 2} ${y + dy + (dy < 0 ? 4 : -4)} L${x} ${y + dy + (dy < 0 ? -8 : 8)} L${x + 7 + w / 2} ${y + dy + (dy < 0 ? 4 : -4)}z" fill="${col}"/></g>`;
  const showPul = L.pulley && L.pulley.gain > 1 && pul !== false, [px, py] = R((X(m.F) + X(m.E)) / 2 - 2, cy - 22);
  return `<svg viewBox="0 0 ${W} 230" class="leversvg" role="img" aria-label="${esc(LEVER_CLS[L.cls][0])}: pivot, muscle and load">
    <path d="M${ax0} ${ay0}L${ax1} ${ay1}" class="beam"/>
    ${L.cls === 2 ? `<path d="M${fx - 18} ${cy + 22}h36" class="ground"/>` : ""}<path d="M${fx} ${cy + 6}l-14 22h28z" class="fulc"/>
    ${showPul ? `<circle cx="${px}" cy="${py}" r="11" class="pulley"/><path d="M${ex} ${ey} Q${px} ${py - 22} ${px - 70} ${py - 70}" class="tendon"/>` : up ? `<path d="M${ex} ${ey} L${ex - 26} ${ey - 80}" class="tendon"/>` : ""}
    ${arrow(ex, ey - (up ? 4 : -10), up ? -54 : 54, "var(--accent)", sw, "earrow")}
    ${arrow(lx, ly + 2, 50, "#5aa9e6", 4, "larrow")}
    <text x="${fx}" y="${cy + 46}" class="lt">Pivot</text><text x="${ex}" y="${up ? ey - 72 : ey + 84}" class="lt e">Muscle</text><text x="${lx}" y="${ly + 74}" class="lt l">Load</text>
    ${showPul ? `<text x="${ex + sw / 2 + 12}" y="${py + 4}" class="lt p">${esc(L.pulley.label)}</text>` : ""}
  </svg>`;
}
let LV = null;
function leverStart(host, key) {
  LV && cancelAnimationFrame(LV.raf); const L = JOINTS[key].lever, box = host.querySelector(".lvbox"), read = host.querySelector(".lvread");
  LV = { host, key, s: 1, pul: true, raf: 0, last: "" };
  const frame = t => { if (!LV || !host.isConnected) return; LV.raf = requestAnimationFrame(frame); if (!LV.visible) return;
    box.innerHTML = leverSVG(L, LV.s, LV.pul, -4 * Math.sin(t / 700));
    const m = leverMath(L, LV.s, LV.pul), k = `${m.ratio.toFixed(1)}|${LV.pul}`;
    if (k !== LV.last) { LV.last = k; read.innerHTML = m.ratio >= 1 ? `The muscle pulls about <b>${m.ratio.toFixed(1)}×</b> the load.` : `The muscle needs only about <b>${m.ratio.toFixed(2)}×</b> the load: a strong lever.`; } };
  LV.visible = true; LV.raf = requestAnimationFrame(frame);
}

/* ---------- The presentation ---------- */
let CS = { pid: null, i: 0, joint: null, fs: false };
function ring(frac, label) {
  const C = 2 * Math.PI * 34, f = frac == null ? 0 : Math.max(.03, Math.min(1, frac));
  return `<svg viewBox="0 0 84 84" class="cring" aria-hidden="true"><circle cx="42" cy="42" r="34" class="rbg"/><circle cx="42" cy="42" r="34" class="rfg" style="--d:${C};--o:${C * (1 - f)}" transform="rotate(-90 42 42)"/><text x="42" y="47">${esc(label)}</text></svg>`;
}
// Range and strength have no single score: show the measured movements as a share of normal (range) or of 5/5 (strength),
// compared over the same movements as last time.
function lrPct(t, a, keys) {
  if (a.tid !== "rom" && a.tid !== "mmt") return null; const ks = [], fs = [];
  for (const f of t.fields) { const x = lr(a.values, f.id); for (const s of ["L", "R"]) { const k = f.id + s; if (!has(x[s]) || (keys && !keys.includes(k))) continue;
    const n = a.tid === "rom" ? (f.normal ? Math.min(1, Math.max(0, +x[s] / f.normal)) : null) : mmtNum(x[s]) / 5; if (n != null && isFinite(n)) { ks.push(k); fs.push(n); } } }
  return fs.length ? { now: fs.reduce((s, n) => s + n, 0) / fs.length, keys: ks } : null;
}
// Small line icons (24-unit paths) for the flow chart, the plan stages and the takeaways.
const icon = (d, cls = "") => `<svg viewBox="0 0 24 24" class="cic ${cls}" aria-hidden="true"><path d="${d}"/></svg>`;
const FLOW_IC = ["M13 3 5 14h6l-1 7 8-11h-6z", "M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4", "M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6", "M3 12h4l2-5 4 10 2-5h6"];
const PHASE_IC = ["M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z", "M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4", "M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12", "M5 21V4M5 4h11l-2 4 2 4H5"];
const TAKE_IC = "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z";
// The pain traffic light for exercise (pain-monitoring model): 0–2 safe, 3–5 acceptable if it settles by the next morning, 6+ too much.
const PAIN_ZONES = [[2, "g", "Safe. Keep going."], [5, "a", "Fine, if it settles by the next morning."], [10, "r", "Too much. Ease off and tell your physio."]];
const painZone = v => PAIN_ZONES.find(z => v <= z[0]);
function painGauge() {
  const cx = 130, cy = 128, r = 100, pt = v => { const a = Math.PI * (1 - v / 10); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; }, arc = (a, b, c) => { const [x0, y0] = pt(a), [x1, y1] = pt(b); return `<path d="M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}" class="pga ${c}"/>`; };
  return `<svg viewBox="0 0 260 150" class="pgsvg" aria-hidden="true">${arc(0, 2.5, "g")}${arc(2.6, 5.5, "a")}${arc(5.6, 10, "r")}
    ${[0, 5, 10].map(v => { const [x, y] = pt(v); return `<text x="${x + (v === 0 ? 4 : v === 10 ? -4 : 0)}" y="${y + (v === 5 ? -14 : 22)}" class="pgt">${v}</text>`; }).join("")}
    <g class="pgneedle"><line x1="${cx}" y1="${cy}" x2="${cx - 78}" y2="${cy}"/><circle cx="${cx}" cy="${cy}" r="9"/></g><text x="${cx}" y="${cy - 26}" class="pgv">3</text></svg>`;
}
function consultSlides(p) {
  const key = CS.joint || jointFor(p), J = JOINTS[key], side = J.side ? sideOf(p) : "", plan = rehabOf(p, key), as = explainData(p.id);
  const items = as.map(a => { const t = getTpl(a), r = runScore(t, a.values, p), c = compare(t, a, p), lr = lrPct(t, a);
    let frac = r.max && r.val != null ? (t.hb === false ? 1 - r.val / r.max : r.val / r.max) : null, band = r.band?.[1] || "neutral";
    let ch = !c || c.d == null ? ["First time measured", "n"] : c.d === 0 || c.better === null ? ["About the same", "a"] : c.better ? ["Better than last time", "g"] : ["A little harder than last time", "a"];
    if (lr) { frac = lr.now; const prev = db.assessments.filter(b => b.pid === a.pid && b.tid === a.tid && b.date < a.date).sort((x, y) => y.date.localeCompare(x.date))[0], was = prev && lrPct(t, prev, lr.keys);
      ch = !was ? ["First time measured", "n"] : Math.abs(lr.now - was.now) < .02 ? ["About the same", "a"] : lr.now > was.now ? ["Better than last time", "g"] : ["A little harder than last time", "a"]; }
    return { name: PLAIN[a.tid] || t.name.replace(/\s*\(.*\)/, ""), val: r.val != null ? `${Math.round(r.val * 10) / 10}${r.max ? "" : t.unit ? " " + t.unit : ""}` : lr ? `${Math.round(lr.now * 100)}%` : "", frac, band, ch, word: { good: "Looking good", warn: "Room to improve", bad: "Our focus", neutral: "Recorded" }[band] || "Recorded" }; });
  const charts = [...new Set(as.map(a => a.tid))].map(tid => { const s = series(p.id, tid); if (s.length < 2) return ""; const t = getTpl(as.find(a => a.tid === tid)); return `<div class="cchart"><b>${esc(PLAIN[tid] || t.name)}</b>${chartSVG(s, t)}</div>`; }).filter(Boolean).slice(0, 4);
  const mech = plan.mech.map(id => J.mech.find(m => m.id === id)).filter(Boolean), why = reasoning(p.id), goals = (p.goals || []).filter(g => !g.met);
  const now = plan.now || 0, hot = [...new Set((plan.mech || []).flatMap(m => ANAT[key]?.problem[m] || []))], hotNames = hot.map(h => ANAT[key].parts[h]?.[0]).filter(Boolean);
  const take = t => `<p class="ctake">${icon(TAKE_IC)}<span>${esc(t)}</span></p>`, list = a => a.length > 1 ? `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}` : a[0] || "";
  const head = (k, h, sub) => `<div class="chead2"><span class="ckick">${esc(k)}</span><h2>${esc(h)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div>`;
  const S = [];
  S.push({ id: "cover", html: `<div class="ccover"><div class="cmark">${RP_MARK("rpmark")}</div><span class="ckick">${esc(db.settings.clinic || "MotionPlus Pro")}</span><h1>Your ${esc(J.name.toLowerCase())} today</h1><p>${fmt(today())} · ${esc(p.code)}</p><span class="cswipe">Swipe to begin</span></div>`,
    say: `This is your ${J.name.toLowerCase()} presentation from today's measurements. Your physiotherapist will go through it with you.` });
  if (items.length) S.push({ id: "results", html: `${head("What we measured", "Today's results")}<div class="cres">${items.map(x => `<div class="cresc ${x.band}">${ring(x.frac, x.val || "✓")}<div><b>${esc(x.name)}</b><span class="pill ${x.ch[1]}">${esc(x.ch[0])}</span><small>${esc(x.word)}</small></div></div>`).join("")}</div>${take("Fuller rings mean closer to normal. We measure again at each visit, so you can see your exercises working.")}`,
    say: `Today's results. ${items.map(x => `${x.name}: ${x.word.toLowerCase()}, ${x.ch[0].toLowerCase()}.`).join(" ")} Fuller rings mean closer to normal.` });
  if (charts.length) S.push({ id: "progress", html: `${head("Over time", "Your progress")}<div class="ccharts">${charts.join("")}</div>`, say: "These charts show how your results have changed from visit to visit." });
  const flowHTML = f => `<div class="cflow">${f.map((s, i) => `<div class="cnode n${i}" style="--i:${i}">${icon(FLOW_IC[i], "cnic")}<small>${["What happened", "What it does", "What it affects", "What you feel"][i]}</small><b>${esc(s)}</b></div>`).join(`<span class="carrow" aria-hidden="true"></span>`)}</div>`, flow = m => flowHTML(m.flow);
  // A patient seen for a nerve or brain condition with no joint named gets the nervous-system slides instead of the joint ones.
  const N = neuroOf(p), showJoint = !N.cond || jointHit(p);
  if (showJoint) {
  const layerIcon = { muscle: "M4 18c4-1 6-5 8-12 2 7 4 11 8 12", lig: "M5 12h14M5 8l14 8M5 16l14-8", cart: "M4 15a8 8 0 0 1 16 0", bone: "M7 5a2 2 0 1 0-1 3l11 9a2 2 0 1 0 2 1 2 2 0 1 0-1-3L7 6", nerve: "M4 12c3-6 5 6 8 0s5 6 8 0", fascia: "M4 7h16M4 12h16M4 17h16" };
  S.push({ id: "anat", html: `<div class="an" data-k="${key}"><div class="anstage"><div class="anlabels"></div><span class="ancap" aria-live="polite"></span><p class="c3msg">Loading the anatomy…</p></div>
    <div class="anctl"><button class="anbtn" data-act="anStory" aria-label="Play the guided tour"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
      <button class="anbtn" data-act="anEx" aria-label="Pull the parts apart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 14h6v6h-6zM10 10l4 4M14 4h6v6M4 14v6h6"/></svg></button>
      ${ANAT[key] && (plan.mech || []).some(m => ANAT[key].problem[m]) ? `<button class="anbtn hotb" data-act="anFocus" aria-label="Show the problem"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/></svg></button>` : ""}
      <span class="ansep"></span>${ANAT_LAYERS.map(([l, n]) => `<button class="anbtn lay" data-act="anLayer" data-l="${l}" aria-label="${n}" title="${n}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${layerIcon[l]}"/></svg><small>${n}</small></button>`).join("")}</div>
    <div class="cjoints" role="group" aria-label="Choose the joint">${Object.entries(JOINTS).map(([k, j]) => `<button class="fchip" data-act="cJoint" data-k="${k}" aria-pressed="${k === key}">${esc(j.name)}</button>`).join("")}</div>
    <p class="ancredit">${esc(ANAT_CREDIT)}</p></div>`,
    say: `This is your ${J.name.toLowerCase()} in 3D, built from real anatomy. Each layer, from muscle down to bone, can be lifted away${hotNames.length ? `. The part glowing red, the ${list(hotNames).toLowerCase()}, is where we will focus` : ""}. Knowing exactly what we are treating helps you understand why each exercise matters.` });
  const L = J.lever, LC = LEVER_CLS[L.cls];
  S.push({ id: "lever", html: `${head(J.move, LC[0], LC[1])}<div class="lv"><div class="lvbox"></div><div class="lvread"></div>
    <label class="lvs"><span>Load closer</span><input class="lvload" type="range" min="0.6" max="1.4" step="0.05" value="1" aria-label="Move the load closer or further"><span>Further</span></label>
    ${L.pulley && L.pulley.gain > 1 ? `<div class="segc" role="group" aria-label="${esc(L.pulley.label)}"><button data-act="lvPul" data-v="1" aria-pressed="true">With ${esc(L.pulley.label.toLowerCase())}</button><button data-act="lvPul" data-v="0" aria-pressed="false">Without</button></div>` : ""}
    <dl class="lvkey"><div><dt class="k-f">Pivot</dt><dd>${esc(L.F)}</dd></div><div><dt class="k-e">Effort</dt><dd>${esc(L.E)}</dd></div><div><dt class="k-l">Load</dt><dd>${esc(L.L)}</dd></div></dl>
    ${L.pulley ? `<p class="cmuted">${esc(L.pulley.note)}</p>` : ""}</div>${take("A stronger muscle handles the same load more easily. That is why strength work is part of your plan.")}`,
    say: `${L.story} ${LC[1]} ${L.pulley ? L.pulley.note : ""} A stronger muscle handles the same load more easily, which is why strength work is part of your plan.` });
  S.push({ id: "why", html: mech.length ? `${head("How it may have started", mech.length === 1 ? mech[0].h : "Possible ways this started", "Possible, not a diagnosis")}${mech.slice(0, 2).map(m => `${mech.length > 1 ? `<h3 class="cfh">${esc(m.h)}</h3>` : ""}${flow(m)}`).join("")}${take("Knowing how it may have started helps you avoid setting it off again.")}`
    : `${head("How it may have started", `Common ways the ${J.name.toLowerCase()} gets sore`, "Your therapist will talk you through which of these fits.")}<div class="cmechs">${J.mech.map(m => `<div class="cmech"><b>${esc(m.h)}</b><small>${esc(m.flow[0])} → ${esc(m.flow[3].toLowerCase())}</small></div>`).join("")}</div>`,
    say: mech.length ? `How it may have started. This is a possibility, not a diagnosis. ${mech.slice(0, 2).map(m => m.flow.join(". ")).join(". Or: ")}. Knowing this helps you avoid setting it off again.` : `Here are common ways the ${J.name.toLowerCase()} gets sore. Your physiotherapist will tell you which fits.` });
  }
  S.push(...neuroSlides(p, N, { head, take, flowHTML }));
  if (why.length) S.push({ id: "factors", html: `${head("Putting it together", "What today's tests suggest", "Possibilities to work on, not a diagnosis.")}<div class="cfacts">${why.slice(0, 3).map(w => `<div class="cfact"><div class="cev">${w.why.slice(0, 3).map(e => `<span>${esc(e)}</span>`).join("")}</div><span class="carrow" aria-hidden="true"></span><b>${esc(w.h)}</b></div>`).join("")}</div>`, say: `Putting it together, today's tests suggest: ${why.slice(0, 3).map(w => w.h).join(". ")}.` });
  if (goals.length) S.push({ id: "goals", html: `${head("Where we're heading", "Your goals")}<div class="cgoals">${goals.slice(0, 4).map(g => { const pr = goalProgress(p.id, g); return `<div class="cgoal"><b>${esc(g.text)}</b>${g.tid ? `<div class="lbar"><i style="--w:${Math.round(100 * Math.max(.04, pr.pct))}%"></i></div>` : ""}<small>By ${fmt(g.by)}</small></div>`; }).join("")}</div>`, say: `Your goals: ${goals.slice(0, 4).map(g => g.text).join(". ")}.` });
  S.push({ id: "plan", html: `${head("The plan", "Your road back")}<div class="cpt" style="--now:${now}"><span class="cptrail" aria-hidden="true"><i></i></span>${plan.phases.map((ph, i) => `<button class="cpstep ${i === now ? "cp-now" : i < now ? "cp-done" : ""}" style="--i:${i}" data-act="cPhase" data-i="${i}" aria-pressed="${i === now}"><span class="cpic">${icon(PHASE_IC[i])}${i === now ? `<em>You are here</em>` : ""}</span><b>${esc(ph.h)}</b><small>${esc(ph.wk)}</small></button>`).join("")}</div>
    ${plan.phases.map((ph, i) => `<div class="cpitems" data-i="${i}" ${i === now ? "" : "hidden"}>${ph.items.filter(Boolean).map((x, j) => `<span style="--i:${j}">${esc(x)}</span>`).join("")}</div>`).join("")}${take("Your exercises between visits are what move you from one stage to the next.")}`,
    say: `Your rehab plan has four stages. You are in stage ${now + 1}: ${plan.phases[now].h}. ${plan.phases[now].items.filter(Boolean).join(". ")}. Your exercises between visits are what move you to the next stage.` });
  S.push({ id: "pain", html: `${head("While you exercise", "Your pain traffic light")}<div class="pg"><div class="pgdial">${painGauge()}<span class="pgsay" aria-live="polite"></span></div>
    <label class="pgin"><span>No pain</span><input type="range" min="0" max="10" step="1" value="3" aria-label="Pain out of 10 while exercising"><span>Worst</span></label>
    <div class="pgrules">${[["M12 6v6l4 2M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20", "During", "5 or less"], ["M4 14a8 8 0 0 0 16 0M12 3v8M8 7l4 4 4-4", "After", "Settles within an hour"], ["M4 18h16M6 18a6 6 0 0 1 12 0M12 6V3M5 9 3 7M19 9l2-2", "Next morning", "No worse than before"]].map(([d, h, t], i) => `<div style="--i:${i}">${icon(d)}<b>${h}</b><small>${t}</small></div>`).join("")}</div></div>
    ${take("Some discomfort is normal and safe while you rebuild. Use the colours to pace yourself at home.")}`,
    say: "Your pain traffic light. While exercising, pain of 0 to 2 out of 10 is green: safe, keep going. 3 to 5 is amber: fine, as long as it settles by the next morning. 6 or more is red: ease off and tell your physio. Some discomfort is normal and safe while you rebuild." });
  // Teach-back: three taps to check the patient has understood the key points.
  const rot = (a, n) => a.slice(n % a.length).concat(a.slice(0, n % a.length)), qs = [];
  if (hot.length && ANAT[key]) { const others = Object.entries(ANAT[key].parts).filter(([id, v]) => !hot.includes(id) && v[1] !== "fascia").map(([, v]) => v[0]), pick = [others[1], others[Math.floor(others.length / 2)]].filter(Boolean);
    qs.push({ q: "Which part are we focusing on?", o: rot([{ h: esc(hotNames[0]), ok: 1 }, ...pick.map(h => ({ h: esc(h) }))], 1) }); }
  else if (N.neuro) { const H = nvHotFor(N), nm = [...new Set(H.ids.map(NV_NAME))][0];
    if (nm) { const others = ["Balance", "Seeing", "Spinal cord", "Sciatic nerve", "Median nerve", "Hearing and memory", "Movement"].filter(x => x !== nm).slice(0, 2); qs.push({ q: "Where is the signal affected?", o: rot([{ h: esc(nm), ok: 1 }, ...others.map(h => ({ h: esc(h) }))], 2) }); } }
  qs.push({ q: "Exercising with pain of 4 out of 10 that settles by the next morning is…", o: [{ h: `<i class="pdot g"></i>Safe, keep going` }, { h: `<i class="pdot a"></i>Fine, keep an eye on it`, ok: 1 }, { h: `<i class="pdot r"></i>Stop the exercises` }] });
  qs.push({ q: "Which stage are you in now?", o: plan.phases.map((ph, i) => ({ h: `${icon(PHASE_IC[i])}${esc(ph.h)}`, ok: i === now ? 1 : 0 })) });
  S.push({ id: "check", html: `${head("Quick check", "Got it?")}<div class="cq">${qs.map((q, i) => `<div class="cqi" style="--i:${i}"><p>${esc(q.q)}</p><div class="cqo">${q.o.map(o => `<button data-act="cAns" data-ok="${o.ok ? 1 : 0}">${o.h}</button>`).join("")}</div></div>`).join("")}<p class="cqscore" aria-live="polite"></p></div>`,
    say: "A quick check. Tap the answer you think is right for each question." });
  S.push({ id: "next", html: `<div class="ccover">${head("Next", "Questions?")}<div class="cnext"><button class="primary" data-act="pdfPatient" data-id="${p.id}">PDF report</button><button data-act="explain" data-pid="${p.id}">Send a summary to the patient</button><button data-act="cEdit">Edit the plan</button><button class="ghost" data-act="cExit">Close</button></div></div>`, say: "Any questions? Your physiotherapist will now go through your written report." });
  return S;
}
function consultLeave() {
  anatStop(); nvStop(); if (GT) { cancelAnimationFrame(GT.raf); GT = null; } speechSynthesis?.cancel(); if (LV) { cancelAnimationFrame(LV.raf); LV = null; } document.body.classList.remove("consult");
  if (CS.fs && document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); CS.fs = false;
}
VIEWS.consult = pid => {
  const p = P(pid); if (!p) return go("today");
  CS.pid = pid; const key = CS.joint || jointFor(p), slides = consultSlides(p); CS.i = Math.min(CS.i, slides.length - 1);
  document.body.classList.add("consult"); chrome(null, "");
  $("#app").innerHTML = `<div class="cdeck">
    <div class="ctop"><button class="cx" data-act="cExit" aria-label="Close the consultation room">✕</button><span class="grow ctitle">${esc(p.code)} · Consultation room</span>${"speechSynthesis" in window ? `<button class="ghost cvoice" data-act="cVoice" aria-pressed="${!!CS.voice}" aria-label="Read each slide aloud">${icon("M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11")}</button>` : ""}<button class="ghost" data-act="cEdit">Edit plan</button></div>
    <div class="ctrack" id="ctrack" tabindex="0" aria-roledescription="slides">${slides.map((s, i) => `<section class="cslide s-${s.id}" aria-label="Slide ${i + 1} of ${slides.length}" data-id="${s.id}"><div class="cin">${s.html}</div></section>`).join("")}</div>
    <div class="cfoot"><button class="cnav" data-act="cNav" data-v="-1" aria-label="Previous slide">‹</button><div class="cdots">${slides.map((s, i) => `<button data-act="cDot" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join("")}</div><button class="cnav" data-act="cNav" data-v="1" aria-label="Next slide">›</button></div>
  </div>`;
  const tr = $("#ctrack"), N = neuroOf(P(pid)), lever = tr.querySelector(".s-lever"), anat = tr.querySelector(".an"), p0 = P(pid), plan = rehabOf(p0, key), side = JOINTS[key].side ? sideOf(p0) : "", J = JOINTS[key], pain = tr.querySelector(".pg");
  const sync = () => { const i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); if (i === CS.shown) return; CS.shown = i; CS.i = i;
    tr.querySelectorAll(".cslide").forEach((s, j) => s.classList.toggle("on", j === i)); $$(".cdots button").forEach((b, j) => b.setAttribute("aria-current", j === i ? "step" : "false"));
    const id = slides[i].id; CS.say = slides[i].say; if (CS.voice) consultSpeak(CS.say);
    if (id === "anat") { if (!AN || AN.host !== anat || AN.key !== key) anatStart(anat, key, { side, name: J.name, problem: [...new Set((plan.mech || []).flatMap(m => ANAT[key]?.problem[m] || []))], story: !CS.voice }); else { AN.visible = true; if (!AN.toured && !AN.story && !CS.voice) anatStory(); } } else if (AN) { AN.visible = false; anatStory(false); }
    const nvs = slides[i].nv, host = tr.children[i].querySelector(".nv");
    if (nvs) { if (!NV || NV.host !== host) nvStart(host, { ...nvs, N, hot: [], story: nvs.story && !CS.voice }); else { NV.visible = true; if (nvs.story && !NV.toured && !NV.story && !CS.voice) nvStory(); } } else if (NV) { NV.visible = false; nvStory(false); }
    if (id === "gait") { const g = tr.querySelector(".gt"); if (!GT || GT.host !== g) gtStart(g); else GT.visible = true; } else if (GT) GT.visible = false;
    if (id === "lever") { if (!LV || LV.host !== lever) leverStart(lever, key); else LV.visible = true; } else if (LV) LV.visible = false; };
  CS.shown = -1; tr.addEventListener("scroll", () => { clearTimeout(sync.t); sync.t = setTimeout(sync, 60); }, { passive: true });
  const painSet = v => { const z = painZone(v); pain.dataset.z = z[1]; pain.querySelector(".pgneedle").style.transform = `rotate(${v * 18}deg)`; pain.querySelector(".pgv").textContent = v; pain.querySelector(".pgsay").textContent = z[2]; };
  pain.querySelector("input").addEventListener("input", e => { const v = +e.target.value, z = painZone(v); if (z[1] !== pain.dataset.z) hz(z[1] === "r" ? "warn" : "tick"); painSet(v); }); painSet(3);
  tr.querySelectorAll(".pxw").forEach(x => pxShow(x, { n: x.dataset.n, r: x.dataset.r.split(" ")[0] }));
  lever?.querySelector(".lvload").addEventListener("input", e => { if (LV) LV.s = +e.target.value; });
  requestAnimationFrame(() => { tr.scrollLeft = CS.i * tr.clientWidth; sync(); });
};
// Read a slide aloud with the device's own voice (nothing leaves the device).
function consultSpeak(t) { try { speechSynthesis.cancel(); if (!t) return; const u = new SpeechSynthesisUtterance(t); u.rate = .95; u.lang = document.documentElement.lang || "en-GB"; speechSynthesis.speak(u); } catch (e) {} }
const $$ = s => [...document.querySelectorAll(s)];
function consultTo(i) { const tr = $("#ctrack"); if (!tr) return; const n = tr.children.length; i = Math.max(0, Math.min(n - 1, i)); tr.scrollTo({ left: i * tr.clientWidth, behavior: reduced() ? "auto" : "smooth" }); hz("tap"); }
document.addEventListener("keydown", e => { if (view.name !== "consult" || e.target.closest("input,textarea") || sheetEl) return;
  if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); consultTo(CS.i + 1); } else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); consultTo(CS.i - 1); } else if (e.key === "Escape" && !document.fullscreenElement) ACT.cExit(); });

/* ---------- Editing the plan: joint, likely mechanism, the four phases and where the patient is now ---------- */
let cpDraft = null;
function cpSync() { const d = cpDraft; if (!d || !$("#cph0")) return; d.phases.forEach((ph, i) => { ph.h = $(`#cph${i}`).value; ph.wk = $(`#cpw${i}`).value; ph.items = $(`#cpi${i}`).value.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 8); }); }
VIEWS.cplan = pid => {
  const p = P(pid); if (!p) return go("today");
  const d = cpDraft || (cpDraft = JSON.parse(JSON.stringify(rehabOf(p, CS.joint || jointFor(p))))), J = JOINTS[d.joint];
  chrome(null, `<button data-act="cpReset">Suggested plan</button><button class="primary wide" data-act="cpSave">Save plan</button>`);
  $("#app").innerHTML = `
  <header>${back("cpBack")}<div class="grow"><div class="psub">${esc(p.code)} · Consultation room</div><h1>Rehab plan</h1></div></header>
  <div class="stack">
    <div class="field"><span class="label" id="cpj">Joint shown</span><div class="chips" role="group" aria-labelledby="cpj">${Object.entries(JOINTS).map(([k, j]) => `<button class="fchip" data-act="cpJoint" data-k="${k}" aria-pressed="${k === d.joint}">${esc(j.name)}</button>`).join("")}</div></div>
    <div class="field"><span class="label" id="cpm">How it may have started (pick any that fit)</span><div class="chips" role="group" aria-labelledby="cpm">${J.mech.map(m => `<button class="fchip" data-act="cpMech" data-id="${m.id}" aria-pressed="${d.mech.includes(m.id)}">${esc(m.h)}</button>`).join("")}</div>
      <span class="note">Shown to the patient as a possible chain of events, never a diagnosis. Leave all off to show common causes instead.</span></div>
    <div class="field"><span class="label" id="cpn">Stage the patient is in now</span><div class="segc" role="group" aria-labelledby="cpn">${d.phases.map((ph, i) => `<button data-act="cpNow" data-i="${i}" aria-pressed="${(d.now || 0) === i}">${i + 1}</button>`).join("")}</div></div>
    ${d.phases.map((ph, i) => `<div class="card cpcard"><div class="row2"><div class="field"><label class="label" for="cph${i}">Stage ${i + 1}</label><input id="cph${i}" value="${esc(ph.h)}" maxlength="60"></div><div class="field"><label class="label" for="cpw${i}">When</label><input id="cpw${i}" value="${esc(ph.wk)}" maxlength="30"></div></div>
      <div class="field"><label class="label" for="cpi${i}">Exercises and advice (one per line)</label><textarea id="cpi${i}" rows="4">${esc(ph.items.join("\n"))}</textarea></div></div>`).join("")}
  </div>`;
};
const CONSULT_ACT = {
  consult: d => { CS = { pid: d.pid, i: 0, joint: null, fs: false }; const el = document.documentElement;
    if (el.requestFullscreen && matchMedia("(pointer:coarse)").matches) el.requestFullscreen().then(() => CS.fs = true).catch(() => {}); go("consult", d.pid); },
  cExit: () => { const pid = CS.pid; navNext = "back"; db.session?.pid === pid ? go("summary") : go("patient", pid); },
  cNav: d => consultTo(CS.i + +d.v),
  cDot: d => consultTo(+d.i),
  cJoint: d => { CS.joint = d.k; anatStop(); nvStop(); render(); },
  cVoice: (d, b) => { CS.voice = !CS.voice; b.setAttribute("aria-pressed", CS.voice); if (CS.voice) { anatStory(false); consultSpeak(CS.say); } else speechSynthesis.cancel(); hz("tap"); },
  cPhase: (d, b) => { const host = b.closest(".cin"); host.querySelectorAll(".cpstep").forEach(x => x.setAttribute("aria-pressed", x === b)); host.querySelectorAll(".cpitems").forEach(x => x.hidden = x.dataset.i !== d.i); hz("tap"); },
  cAns: (d, b) => { const q = b.closest(".cqi"); if (q.classList.contains("done")) return; q.classList.add("done"); b.classList.add(d.ok === "1" ? "ok" : "no"); q.querySelector('[data-ok="1"]').classList.add("ok");
    hz(d.ok === "1" ? "success" : "warn"); const all = [...b.closest(".cq").querySelectorAll(".cqi")], done = all.filter(x => x.classList.contains("done"));
    if (done.length === all.length) { const n = all.filter(x => x.querySelector("button.ok:not([data-ok='0'])") && !x.querySelector(".no")).length; b.closest(".cq").querySelector(".cqscore").textContent = n === all.length ? `${n} of ${n}. You know your plan. That makes you part of the team.` : `${n} of ${all.length}. Your physio will go over the rest with you.`; } },
  lvPul: (d, b) => { if (!LV) return; LV.pul = d.v === "1"; b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); hz("tap"); },
  cEdit: () => { cpDraft = null; go("cplan", CS.pid); },
  cpJoint: d => { cpSync(); const p = P(view.args[0]); CS.joint = d.k; const fresh = rehabOf({ ...p, rehab: null }, d.k); cpDraft = d.k === p.rehab?.joint ? JSON.parse(JSON.stringify(p.rehab)) : fresh; render(); },
  cpMech: d => { cpSync(); const m = cpDraft.mech; cpDraft.mech = m.includes(d.id) ? m.filter(x => x !== d.id) : [...m, d.id]; render(); },
  cpNow: d => { cpSync(); cpDraft.now = +d.i; render(); },
  cpReset: () => { const p = P(view.args[0]); cpDraft = rehabOf({ ...p, rehab: null }, cpDraft.joint); render(); toast("Suggested plan restored. Save to keep it."); },
  cpSave: () => { cpSync(); const p = P(view.args[0]); p.rehab = { ...cpDraft, updated: today() }; CS.joint = cpDraft.joint; cpDraft = null; save(); navNext = "back"; go("consult", p.id); celebrate("Plan saved"); },
  cpBack: () => { cpDraft = null; navNext = "back"; go("consult", view.args[0]); },
};
