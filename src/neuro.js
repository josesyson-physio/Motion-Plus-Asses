/* ---------- Brain, nerves, dermatomes, gait and posture, built from this patient's assessments ----------
   neuroOf(p) reads the diagnosis and the saved tests (strength, sensation, tone, walking and posture) and works out
   what to show: the likely area of the nervous system, the side, the nerve roots, the walking pattern and the posture,
   each with the test results it came from. Everything is worded as a possibility, never a diagnosis.
   The 3D body is one pack (assets/anatomy/body-2.bin): skin split into dermatomes, the brain split into areas,
   bones, muscle groups, heart and lungs, and the spinal cord, roots and main nerves drawn as tubes. */
ANAT.body = { file: "body-2" };
const NEURO_CREDIT = "3D anatomy: BodyParts3D, © The Database Center for Life Science (CC BY 4.0), via open-anatomy-3d";

// What each nerve root supplies, in plain words, and the muscle groups (pack ids, without the side) it powers.
const ROOTS = {
  C2: ["Back of the head", "Nodding the head", []], C3: ["Side of the neck", "Turning the head, helping you breathe", ["diaphragm"]],
  C4: ["Top of the shoulders", "Shrugging, breathing (the diaphragm)", ["diaphragm"]],
  C5: ["Outer upper arm", "Lifting the arm out to the side, bending the elbow", ["deltoid", "rotator_cuff", "upper_arm_muscles"], "Biceps"],
  C6: ["Thumb and the thumb side of the forearm", "Bending the wrist back", ["forearm_muscles"], "Forearm (brachioradialis)"],
  C7: ["Middle finger", "Straightening the elbow", ["upper_arm_muscles"], "Triceps"],
  C8: ["Little finger and the little-finger side of the hand", "Gripping, bending the fingers", ["forearm_muscles", "hand_muscles"]],
  T1: ["Inner forearm", "Spreading the fingers", ["hand_muscles"]],
  T2: ["Armpit and upper chest", "Breathing muscles between the ribs", []], T3: ["Upper chest", "Breathing muscles between the ribs", []], T4: ["Chest at nipple level", "Breathing muscles between the ribs", []],
  T5: ["Chest", "Breathing muscles between the ribs", []], T6: ["Lower chest", "Breathing and tummy muscles", []], T7: ["Lower ribs", "Breathing and tummy muscles", []],
  T8: ["Upper tummy", "Tummy muscles", []], T9: ["Tummy", "Tummy muscles", []], T10: ["Belly-button level", "Tummy muscles", []],
  T11: ["Lower tummy", "Tummy muscles", []], T12: ["Just above the groin", "Tummy muscles", []],
  L1: ["Groin", "Lifting the knee (hip)", ["iliopsoas"]], L2: ["Front of the upper thigh", "Lifting the knee, squeezing the legs together", ["iliopsoas", "adductors"]],
  L3: ["Front of the lower thigh and knee", "Straightening the knee", ["quadriceps"], "Knee"], L4: ["Inner shin and ankle", "Lifting the foot up", ["shin_muscles", "quadriceps"], "Knee"],
  L5: ["Outer shin, top of the foot and big toe", "Lifting the big toe, steadying the hip", ["shin_muscles", "foot_muscles", "gluteal"]],
  S1: ["Outer foot, heel and sole", "Standing on tiptoe", ["calf", "hamstrings", "gluteal"], "Ankle"], S2: ["Back of the thigh", "Bending the knee, gripping with the toes", ["hamstrings", "foot_muscles"]],
  S3: ["Saddle area", "Bladder, bowel and pelvic floor", []],
};
const ROOT_IDS = Object.keys(ROOTS);
const rootCss = k => `hsl(${Math.round(((ROOT_IDS.indexOf(k) * .38 + .02) % 1) * 360)}, 58%, 60%)`, rootCol = k => new THREE.Color(rootCss(k)), hexCss = n => "#" + n.toString(16).padStart(6, "0");
// Strength-test groups and the root mainly behind each one.
const MMT_ROOT = { "Neck flexors": "C3", "Shoulder flexors": "C5", "Shoulder abductors": "C5", "Shoulder external rotators": "C5", "Elbow flexors": "C5", "Elbow extensors": "C7", "Wrist extensors": "C6", Grip: "C8",
  "Trunk flexors": "T10", "Hip flexors": "L2", "Hip abductors": "L5", "Hip extensors": "S1", "Knee extensors": "L3", "Knee flexors": "S1", "Ankle dorsiflexors": "L4", "Ankle plantarflexors": "S1" };
const BRAIN_AREAS = [["Motor", "Movement", "Sends the signal to move. Each side moves the opposite side of the body."], ["Sensory", "Feeling", "Receives touch, pain and position from the opposite side of the body."],
  ["Frontal", "Planning", "Thinking, planning and starting movements."], ["Parietal", "Body sense", "Puts together where your body is in space."], ["Temporal", "Hearing and memory", "Hearing, memory and words."],
  ["Occipital", "Seeing", "Turns what the eyes see into pictures."], ["cerebellum", "Balance", "Fine-tunes movement and keeps you balanced."], ["brainstem", "Breathing and heart", "Runs breathing and heart rate, and carries every signal between brain and body."],
  ["basal", "Smooth movement", "Deep centres that start movements and keep them smooth and big."]];
const AREA_COL = { Frontal: 0x6f9fe0, Motor: 0xf2b84b, Sensory: 0x4fc7a6, Parietal: 0x9a88e0, Temporal: 0xe489aa, Occipital: 0x6fd0ea, cerebellum: 0xc49be0, brainstem: 0xd9c6a2, basal: 0xff8a5c, thalamus: 0xffd27a };

// Conditions, matched from the diagnosis. Each says where it sits, how the signal is affected, its usual walking and
// posture pattern, a four-step chain from cause to what the patient notices, and what treatment works on.
const NCONDS = [
  { id: "stroke", kw: /stroke|\bcva\b|hemipleg|hemipar|cerebral infarct|brain (bleed|haem|hem)/i, name: "Stroke", where: "brain", block: "brain", gait: "hemi", posture: "hemi", body: true,
    flow: ["Blood supply to part of the brain is blocked or bleeds", "Brain cells in the movement and feeling areas are injured", "Signals to the opposite side of the body are weaker", "Weakness, stiffness or numbness on one side"],
    helps: "Repeating real tasks rewires the brain around the injured area. Practice is the medicine." },
  { id: "pd", kw: /parkinson/i, name: "Parkinson's", where: "basal", block: "slow", gait: "pd", posture: "pd",
    flow: ["Cells deep in the brain make less dopamine", "The basal ganglia struggle to start and size movements", "Movements become smaller, slower and stiffer", "Short steps, less arm swing, a stooped posture, harder turns"],
    helps: "Big, deliberate movements and rhythm (counting, music) help the brain make movements full-size again." },
  { id: "ms", kw: /multiple sclerosis|\bms\b(?! ?pain)/i, name: "Multiple sclerosis", where: "patchy", block: "patchy", gait: "ataxic", posture: null,
    flow: ["The immune system attacks the coating around nerves", "Patches in the brain and spinal cord slow the signals", "Messages arrive late or patchy", "Tiredness, weakness, numbness or unsteadiness that comes and goes"],
    helps: "Paced exercise, balance work and keeping cool keep the nerves working at their best." },
  { id: "sci", kw: /spinal cord|\bsci\b|parapleg|tetrapleg|quadripleg|myelopath|cauda equina/i, name: "Spinal cord", where: "cord", block: "cord", gait: "crouch", posture: null, body: true,
    flow: ["An injury or pressure on the spinal cord", "Signals cannot pass the injured level", "Muscles and skin below that level lose their link to the brain", "Weakness or numbness below a level, bladder and bowel changes"],
    helps: "We strengthen everything still connected and train new ways to move safely." },
  { id: "radC", kw: /cervical radicul|brachialgia|cervical (disc|root|spondylo)|\bc[5-8]\b[^.]{0,30}(radic|root|nerve)/i, name: "Neck nerve root", where: "root", block: "root", lvl: "C6", gait: null, posture: "fhp", arm: true, plexus: true,
    flow: ["A disc bulge or narrowing in the neck", "The nerve root is squeezed as it leaves the spine", "That root's skin area and muscles get mixed signals", "Arm pain, pins and needles or weakness along one strip"],
    helps: "Easing pressure on the root first, then nerve gliding and strength, lets the signal flow again." },
  { id: "radL", kw: /sciatica|lumbar radicul|radiculopathy|\b[ls][1-5]\b[^.]{0,30}(radic|root|nerve)|disc (prolapse|herniation|bulge)|\bpivd\b/i, name: "Back nerve root", where: "root", block: "root", lvl: "L5", gait: "antalgic", posture: "shift",
    flow: ["A disc bulge or narrowing in the lower back", "The nerve root is squeezed as it leaves the spine", "That root's skin area and muscles get mixed signals", "Leg pain, pins and needles or weakness along one strip"],
    helps: "Positions that ease the root, then nerve gliding and strength, let the signal flow again." },
  { id: "neuro", kw: /neuropath|polyneur|diabetic foot/i, name: "Peripheral neuropathy", where: "distal", block: "distal", gait: "steppage", posture: null,
    flow: ["Long-term sugar, vitamin or other changes", "The longest nerves, to the feet and hands, are affected first", "Feeling and strength fade at the far ends", "Numb or burning feet, poor balance, tripping"],
    helps: "Balance training, foot care and strength protect you from falls and injury." },
  { id: "plexus", kw: /brachial plexus|\berb'?s\b|klumpke|plexopath/i, name: "Brachial plexus", where: "plexus", block: "root", lvl: "C5", gait: null, posture: null, arm: true, plexus: true,
    flow: ["A stretch or blow to the neck and shoulder", "The nerve network to the arm is stretched", "Signals to some arm muscles and skin are cut down", "Weakness and numbness in part of the arm"],
    helps: "Keeping joints moving while nerves recover, then retraining each muscle as it wakes up." },
  { id: "cts", kw: /carpal tunnel|\bcts\b|median nerve/i, name: "Median nerve at the wrist", where: "median", block: "distal", gait: null, posture: null, arm: true, plexus: true, nerve: "median",
    flow: ["Repeated gripping, swelling or pressure at the wrist", "The median nerve is squeezed in the carpal tunnel", "Signals to the thumb, index and middle fingers are disturbed", "Tingling, night numbness, a weaker pinch"],
    helps: "Wrist position, nerve gliding and easing repeated strain take the pressure off." },
  { id: "ulnar", kw: /ulnar (nerve|neurop)|cubital tunnel/i, name: "Ulnar nerve", where: "ulnar", block: "distal", gait: null, posture: null, arm: true, plexus: true, nerve: "ulnar",
    flow: ["Pressure on the inner elbow (the funny bone)", "The ulnar nerve is squeezed or stretched", "Signals to the little finger side of the hand are disturbed", "Tingling in the ring and little fingers, clumsy hand"],
    helps: "Avoiding long elbow bending and pressure, plus nerve gliding." },
  { id: "radialN", kw: /radial nerve|wrist drop/i, name: "Radial nerve", where: "radial", block: "distal", gait: null, posture: null, arm: true, plexus: true, nerve: "radial",
    flow: ["Pressure on the back of the upper arm", "The radial nerve is squeezed against the bone", "Signals to the muscles that lift the wrist are cut down", "The wrist and fingers drop"],
    helps: "A splint keeps the wrist up while the nerve recovers; then we retrain the muscles." },
  { id: "footdrop", kw: /foot drop|peroneal|fibular nerve/i, name: "Foot drop", where: "peroneal", block: "distal", gait: "steppage", posture: null, nerve: "peroneal",
    flow: ["Pressure on the nerve beside the knee, or a back root problem", "The peroneal nerve signal is weakened", "The muscles that lift the foot can't pull", "The toes catch and the foot slaps when walking"],
    helps: "An ankle support for safety, strengthening and nerve recovery work." },
  { id: "bell", kw: /bell'?s palsy|facial (nerve|palsy)/i, name: "Facial nerve", where: "cranial", block: "brain", gait: null, posture: null,
    flow: ["Swelling of the facial nerve", "The nerve to the face muscles is squeezed in its bony canal", "One side of the face loses its signal", "Drooping smile and eyelid on one side"],
    helps: "Gentle face exercises in a mirror as the nerve recovers." },
  { id: "ataxia", kw: /ataxi|cerebell/i, name: "Cerebellum", where: "cerebellum", block: "brain", gait: "ataxic", posture: null,
    flow: ["Damage or change in the cerebellum", "The brain's balance centre can't fine-tune movement", "Movements overshoot and wobble", "Unsteady, wide-based walking, shaky reaching"],
    helps: "Balance and coordination practice, steadily harder, retrains control." },
  { id: "cp", kw: /cerebral palsy|\bcp\b/i, name: "Cerebral palsy", where: "motorBoth", block: "brain", gait: "crouch", posture: null,
    flow: ["The movement areas of the brain developed differently", "Signals to the muscles are less controlled", "Some muscles are tight, others weak", "Stiff, bent-knee walking, harder balance"],
    helps: "Stretching tight muscles and strengthening weak ones keeps you moving well as you grow." },
  { id: "gbs", kw: /guillain|\bgbs\b|\bcidp\b/i, name: "Guillain-Barré", where: "allNerves", block: "distal", gait: "steppage", posture: null,
    flow: ["An infection triggers the immune system", "It attacks the nerves of the arms and legs", "Signals slow down all over", "Weakness that started in the feet, then spread"],
    helps: "Gentle, well-paced exercise as the nerves recover, without over-tiring." },
  { id: "tbi", kw: /head injury|\btbi\b|traumatic brain|concussion/i, name: "Brain injury", where: "frontal", block: "brain", gait: "ataxic", posture: null,
    flow: ["A blow or jolt to the head", "The brain is bruised or stretched", "Thinking, balance and movement messages are disturbed", "Headaches, dizziness, slower thinking or unsteadiness"],
    helps: "A graded return to activity, balance work and rest when needed." },
];
// Default four-stage plans when a nerve or brain condition is the main problem (the therapist edits these).
const NREHAB = {
  brain: [["Settle and stay safe", "Safe positioning and transfers", "Early sitting and standing practice", "Gentle movement of the weaker side every day"], ["Wake up movement", "Task practice: reaching, standing up, stepping", "Weight through the weaker side", "Mirror and touch work for feeling"],
    ["Build strength and control", "Strength for the weaker arm and leg", "Walking practice with less help", "Balance in standing and turning"], ["Back to daily life", "Home and community tasks", "Walking further, stairs and outdoors", "A daily practice routine to keep improving"]],
  pd: [["Know your on and off times", "Plan exercise when medication works best", "Safe home set-up to prevent falls", "Daily big-movement warm-up"], ["Move big", "Large, deliberate arm and leg movements", "Walking to a beat with long steps", "Turning practice in wide arcs"],
    ["Strength and balance", "Leg and trunk strength", "Balance with reaching and turning", "Dual tasks: walking while talking"], ["Keep it going", "A Parkinson's exercise class or brisk walking", "Regular check-ups of balance and posture", "A home programme for every day"]],
  nerve: [["Calm the nerve", "Positions that ease the nerve", "Gentle movement within comfort", "Avoid long pressure or stretch on the nerve"], ["Help the nerve glide", "Nerve gliding exercises", "Posture and movement habits", "Keep nearby joints moving"],
    ["Build strength", "Strength for the muscles that nerve powers", "Grip, foot or hip work as needed", "Control in everyday positions"], ["Back to what matters", "Work and sport tasks step by step", "Set-up that protects the nerve", "A home programme to keep it well"]],
  cord: [["Protect and set up", "Safe positioning and pressure care", "Breathing and bladder routines", "Move every joint daily"], ["Make the most of what's connected", "Strength for every working muscle", "Sitting balance and transfers", "Equipment that suits you"],
    ["Build independence", "Wheelchair or walking skills", "Standing practice if possible", "Fitness for the heart and lungs"], ["Life and community", "Home, work and travel skills", "Long-term fitness plan", "Regular reviews"]],
  balance: [["Stay safe", "Fall-proof the home", "Supportive footwear and foot checks", "Short, frequent rests"], ["Steady the base", "Standing balance with support", "Ankle and hip strength", "Eyes, feet and inner-ear practice"],
    ["Challenge balance", "Balance on soft or narrow surfaces", "Walking with turns and head movements", "Getting up from the floor"], ["Keep it up", "Daily walking", "A balance class such as Tai Chi", "A home programme to keep improving"]],
};
const nrehabKey = c => ({ stroke: "brain", tbi: "brain", cp: "brain", bell: "nerve", pd: "pd", sci: "cord", ms: "balance", ataxia: "balance", neuro: "balance", gbs: "balance" })[c.id] || "nerve";
const GAITS = {
  pd: ["Parkinson's walking", ["Smaller, slower brain signals (low dopamine)", "Short shuffling steps and little arm swing", "Bent-forward trunk shifts weight onto the toes", "Hard turns and freezing raise the fall risk"], "Big steps to a beat, heel first, arms swinging"],
  hemi: ["One-sided walking", ["Weaker, stiffer leg on one side", "The knee stays straight and the foot drops in swing", "The leg swings out in an arc to clear the floor", "Slower, uneven steps that tire you quickly"], "Knee bend, foot lift and weight onto the weaker leg"],
  trend: ["Hip-drop walking", ["Weak side hip muscles (gluteus medius)", "The pelvis drops on the other side with each step", "The trunk leans over the standing leg", "Hip, back or knee strain over time"], "Side-hip strength and single-leg balance"],
  antalgic: ["Protective walking", ["Pain when weight goes through one leg", "Less time standing on that leg", "Short, uneven steps", "Other joints work harder and stiffen"], "Calm the pain, then rebuild even, confident steps"],
  steppage: ["High-stepping walking", ["Weak muscles that lift the foot", "The toes hang down when the leg swings", "The knee lifts high to clear the floor, the foot slaps", "Tripping, especially on uneven ground"], "Foot-lift strength, an ankle support if needed, balance"],
  ataxic: ["Unsteady walking", ["The balance system can't fine-tune each step", "Feet placed wide apart, steps of varying length", "The body sways and corrects", "Falls are more likely when tired or turning"], "Balance and coordination practice, made steadily harder"],
  crouch: ["Bent-knee walking", ["Tight hamstrings and calves, weak thigh muscles", "Knees and hips stay bent through each step", "The thigh muscles work much harder", "Tiredness and knee pain"], "Stretching, thigh and hip strength"],
  cautious: ["Cautious walking", ["Less strength or confidence", "Shorter, slower steps", "Less push-off and arm swing", "Walking further becomes tiring"], "Leg strength, balance and building up walking"],
};
const POSTURES = {
  pd: ["Stooped posture", ["Stiffness in the trunk and hip muscles", "The upper back rounds and the head moves forward", "Hips and knees bend to keep balance", "Weight moves to the toes, so falls forward are more likely"], "Standing tall: chest opening, hip and back extension"],
  hemi: ["Leaning to one side", ["One side is weaker or stiffer", "The trunk shortens on that side", "Weight shifts onto the stronger leg", "The weaker side is used even less"], "Equal weight through both legs, trunk control"],
  fhp: ["Forward head", ["Long hours looking down", "The head sits in front of the shoulders", "Neck and upper back muscles carry extra load", "Neck tension, headaches, nerve irritation"], "Chin tucks, upper back strength, desk set-up"],
  shift: ["Shifted trunk", ["Pain from a back nerve root", "The trunk shifts away to ease the root", "One side of the back stays tense", "Uneven standing and walking"], "Gradual shift correction and movement"],
  flexed: ["Rounded posture", ["Weaker back muscles and stiffness", "The upper back rounds forward", "Head and shoulders move forward", "Neck and back strain"], "Upper back strength and opening the chest"],
  sway: ["Sway posture", ["Weak tummy and hip muscles", "Hips drift forward of the ankles", "The upper back leans back to balance", "Low back and hip strain"], "Core and hip control, standing re-training"],
};

/* ---------- Reading the patient ---------- */
const latestA = (pid, tid) => db.assessments.filter(a => a.pid === pid && a.tid === tid).sort(byDate).at(-1);
function neuroOf(p) {
  const dx = `${p.dx || ""} ${p.notes || ""}`, cond = NCONDS.find(c => c.kw.test(dx)) || null, ev = [];
  // Strength: weak groups by side, and the roots they point to.
  const mm = latestA(p.id, "mmt"), weak = { L: [], R: [] }, roots = new Set();
  if (mm) MMT_GROUPS.forEach((g, i) => { const x = lr(mm.values, "f" + i); for (const s of ["L", "R"]) if (has(x[s]) && mmtNum(x[s]) < 4) { weak[s].push(g); ev.push(`${g} ${s === "L" ? "left" : "right"} ${x[s]}/5`); } });
  const sx = latestA(p.id, "senscreen"), sens = { L: 0, R: 0 };
  if (sx) { getTpl(sx).fields.forEach(f => { if (f.t !== "lrsel") return; const x = lr(sx.values, f.id); for (const s of ["L", "R"]) if (has(x[s]) && !["Intact", "Not tested"].includes(x[s])) sens[s]++; });
    if (sens.L + sens.R) ev.push(`Sensation changed${sens.L && sens.R ? " both sides" : sens.L ? " on the left" : " on the right"}`); }
  const ms = latestA(p.id, "mas"), tone = ms && Object.values(ms.values).some(x => x && ((x.L && x.L !== "0") || (x.R && x.R !== "0")));
  if (tone) ev.push("Increased muscle stiffness (tone)");
  // Roots named in the diagnosis or the sensory exam, then the roots behind weak muscles.
  const named = [...`${dx} ${sx?.values.area || ""}`.matchAll(/\b([CTLS])([1-9]|1[0-2])\b/gi)].map(m => m[1].toUpperCase() + m[2]).filter(r => ROOTS[r]);
  named.forEach(r => roots.add(r));
  // Side: the diagnosis first, then the side with more weakness or sensory change.
  // The body side: words like "left hemiparesis" first, then a named brain side (which affects the other side), then a lone left or right.
  const bodyM = /\b(left|right)\b[\s-]*(sided\s+)?(hemipar\w*|hemipleg\w*|weakness|arm|leg|hand|foot|side|l[1-5]|s[1-3]|c[2-8])/i.exec(p.dx || ""), brainM = /\b(left|right)\b\s+(mca|aca|pca|hemisphere\w*|cerebr\w*|parietal|frontal|temporal|basal|capsul\w*|thalam\w*)/i.exec(p.dx || "");
  const lone = /\bleft\b|\blt\b/i.test(p.dx) && !/\bright\b/i.test(p.dx) ? "L" : /\bright\b|\brt\b/i.test(p.dx) && !/\bleft\b/i.test(p.dx) ? "R" : "";
  const dxSide = bodyM ? bodyM[1][0].toUpperCase() : brainM ? (/left/i.test(brainM[1]) ? "R" : "L") : lone;
  const wS = weak.L.length + sens.L > weak.R.length + sens.R ? "L" : weak.R.length + sens.R > weak.L.length + sens.L ? "R" : "";
  let side = dxSide || wS || "R";
  if (!roots.size && weak[side].length && (!cond || ["root", "plexus"].includes(cond.where) || !cond)) weak[side].forEach(g => roots.add(MMT_ROOT[g]));
  const lvl = named[0] || (cond?.where === "root" || cond?.where === "plexus" ? cond.lvl : cond?.where === "cord" ? "T10" : null) || [...roots][0] || null;
  // Pattern in today's tests when the diagnosis names no nerve condition.
  let pattern = null;
  if (!cond) { const armW = g => /Shoulder|Elbow|Wrist|Grip/.test(g), legW = g => /Hip|Knee|Ankle/.test(g);
    if (weak[side].some(armW) && weak[side].some(legW) && !weak[side === "L" ? "R" : "L"].length) pattern = tone ? "brain" : "oneSide";
    else if (weak.L.some(legW) && weak.R.some(legW) && !weak.L.some(armW) && !weak.R.some(armW)) pattern = "legsBoth";
    else if (roots.size && roots.size <= 2) pattern = "root"; }
  const gait = gaitOf(p, cond, side, ev), posture = postureOf(p, cond, side);
  return { cond, side, weak, sens, tone, roots: [...roots], lvl, pattern, ev, gait, posture, neuro: !!(cond || pattern) };
}
function gaitOf(p, cond, side, ev) {
  const tug = latestA(p.id, "tug"), mw = latestA(p.id, "mwt10"), gt = latestA(p.id, "gait"), obs = tug?.values.obs || [];
  const speed = mw && +mw.values.time ? (+mw.values.dist || 6) / +mw.values.time : null, tugT = tug && +tug.values.time || null;
  const f = `${obs.join(" ")} ${gt?.values.findings || ""} ${gt?.values.measures || ""}`.toLowerCase();
  let pat = cond?.gait || null;
  if (!pat) pat = /shuffl/.test(f) ? "pd" : /pelvic drop|trendelenburg/.test(f) ? "trend" : /foot (drop|slap)|steppage/.test(f) ? "steppage" : /asymmetr|uneven|antalgic|limp/.test(f) ? "antalgic"
    : /wide|unsteady|sway|loss of balance/.test(f) ? "ataxic" : (speed && speed < 1) || (tugT && tugT > 12) ? "cautious" : null;
  if (!pat) return null;
  const num = [];
  if (speed) num.push(["Walking speed", `${speed.toFixed(2)} m/s`, "about 1.3 m/s", speed / 1.3]);
  if (tugT) num.push(["Up and go", `${tugT} s`, "under 10 s", 10 / tugT]);
  const m = /step length[^:]*:\s*([\d.]+)\s*(cm|m)/i.exec(gt?.values.measures || ""); if (m) num.push(["Step length", `${m[1]} ${m[2]}`, "", null]);
  obs.forEach(o => ev.includes(o) || ev.push(o));
  const amp = Math.max(.35, Math.min(1, speed ? speed / 1.3 : tugT ? 10 / tugT : .8));
  return { pat, amp, num, side, from: [tug && "Timed Up and Go", mw && "10-metre walk", gt && "Gait analysis"].filter(Boolean) };
}
// Posture: the measures from the posture tool if there is one, otherwise the pattern the condition usually brings.
function postureOf(p, cond, side) {
  const pa = latestA(p.id, "posture"), lines = String(pa?.values.measures || "").split("\n"), num = {}, rows = [];
  for (const l of lines) { const m = /^(.+?):\s*(-?[\d.]+)\s*([°%a-z]*)\s*\((.+)\)/i.exec(l.trim()); if (!m) continue; const k = m[1].toLowerCase(), v = +m[2];
    const key = /forward head/.test(k) ? "fwdHead" : /kyphosis/.test(k) ? "kyph" : /lordosis/.test(k) ? "lord" : /pelvic tilt/.test(k) ? "pTilt" : /shoulder level/.test(k) ? "shLevel" : /pelvic level/.test(k) ? "pLevel"
      : /trunk inclination/.test(k) ? "trunk" : /head tilt/.test(k) ? "hTilt" : /knee sagittal/.test(k) ? "knee" : null;
    if (key) { num[key] = v; if (!/normal|good|within/i.test(m[4])) rows.push([m[1], `${m[2]}${m[3]}`, m[4]]); } }
  const has = Object.keys(num).length;
  let pat = cond?.posture || null;
  if (has && !pat) pat = (num.kyph > 50 && num.fwdHead > 20) ? "flexed" : num.fwdHead > 20 ? "fhp" : Math.abs(num.shLevel || 0) > 4 || Math.abs(num.pLevel || 0) > 4 ? "hemi" : num.trunk < -6 ? "sway" : num.kyph > 50 ? "flexed" : null;
  if (!pat) return null;
  const base = { pd: { fwdHead: 32, kyph: 58, knee: 14, trunk: 12, lord: 30 }, hemi: { shLevel: 5, pLevel: 3, trunkSide: 6 }, fhp: { fwdHead: 28, kyph: 48 }, shift: { trunkSide: 7 }, flexed: { fwdHead: 24, kyph: 56 }, sway: { trunk: -6, lord: 30, kyph: 50 } }[pat];
  return { pat, v: { ...base, ...num }, rows, side, measured: !!has };
}

/* ---------- The 3D body: nervous system and dermatome views ---------- */
let NV = null;
function nvStop() { if (!NV) return; cancelAnimationFrame(NV.raf); NV.ro?.disconnect(); try { NV.renderer.dispose(); NV.renderer.forceContextLoss?.(); } catch (e) {} NV.renderer.domElement.remove(); NV = null; }
const NV_VIEWS = { body: [[0, 880, 0], 1900], head: [[0, 1640, -18], 300], neck: [[0, 1480, -30], 360], trunk: [[0, 1200, 0], 760], low: [[0, 1010, -40], 560],
  armR: [[-210, 1100, 0], 820], armL: [[210, 1100, 0], 820], legR: [[-90, 470, 0], 1000], legL: [[90, 470, 0], 1000], footR: [[-100, 160, 20], 520], footL: [[100, 160, 20], 520] };
function nvRootView(r, s) { const g = r[0], n = +r.slice(1); return g === "C" ? (n <= 4 ? "neck" : "arm" + s) : g === "T" ? (n === 1 ? "arm" + s : "trunk") : g === "L" ? (n <= 3 ? "leg" + s : "leg" + s) : (n === 1 ? "leg" + s : "low"); }
async function nvStart(host, o) {
  nvStop(); const stage = host.querySelector(".anstage"), out = host.querySelector(".c3msg"), tok = nvStart.tok = (nvStart.tok || 0) + 1;
  try { await need("three"); } catch (e) { out.textContent = "The 3D body needs an internet connection the first time it opens."; return; }
  let data; try { data = await anatLoad("body"); } catch (e) { out.textContent = "The 3D body could not load."; return; }
  if (!host.isConnected || tok !== nvStart.tok) return; // a newer start has taken over
  nvStop(); const T = THREE; let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { out.textContent = "This device can't show 3D."; return; }
  out.textContent = ""; renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  stage.prepend(renderer.domElement);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(28, 1, 20, 20000);
  scene.add(new T.HemisphereLight(0xfff4e6, 0x1a2030, .55));
  const k1 = new T.DirectionalLight(0xfff1df, 1.05); k1.position.set(-800, 1800, 2400); scene.add(k1);
  const k2 = new T.DirectionalLight(0x8fc4ff, .9); k2.position.set(900, 900, -2400); scene.add(k2);
  const k3 = new T.DirectionalLight(0xbfd8ff, .4); k3.position.set(2000, 600, 800); scene.add(k3);
  const root = new T.Group(); scene.add(root);
  const parts = [], byId = {}, N = o.N, isDerm = o.mode === "derm";
  const add = (id, kind, geo, col) => { geo.computeBoundingBox(); const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: col, roughness: kind === "brain" ? .55 : kind === "skin" ? .6 : .45, transparent: true, opacity: 0, depthWrite: false }));
    root.add(m); const p = { id, kind, m, c: geo.boundingBox.getCenter(new T.Vector3()), base: new T.Color(col), op: 0 }; parts.push(p); byId[id] = p; return p; };
  for (const q of data.parts) {
    const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(q.pos, 3)); geo.setIndex(new T.BufferAttribute(q.idx, 1)); geo.computeVertexNormals();
    const area = q.kind === "brain" ? (q.id.match(/^b(\w+?)[RL]$/)?.[1] || q.id) : null;
    const col = q.kind === "skin" ? (isDerm ? rootCol(q.id.slice(1)) : new T.Color(0xe9c3a8)) : q.kind === "brain" ? AREA_COL[area] : q.kind === "muscle" ? 0x9a2a20 : q.kind === "organ" ? (CV_COL[q.id] ?? 0xd99a9a) : q.kind === "nerve" ? 0xf2c94c : 0xe6d8bd;
    const p = add(q.id, q.kind, geo, col); p.area = area; if (q.kind === "skin") p.root = q.id.slice(1);
  }
  const tube = (pts, r) => new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(a => new T.Vector3(...a))), Math.max(16, pts.length * 10), r, 8, false);
  for (const [id, l] of Object.entries(data.lines)) { const p = add(id, "nerve", tube(l.p, l.r * (isDerm ? 1 : 1.25)), 0xf2c94c); p.m.material.emissive = new T.Color(0x6a4d00); p.line = l.p; }
  for (const [id, b] of Object.entries(data.blobs)) { const g = new T.SphereGeometry(1, 32, 20); g.scale(...b.s); g.translate(...b.c); const p = add(id, "brain", g, AREA_COL[id.startsWith("basal") ? "basal" : "thalamus"]); p.area = id.startsWith("basal") ? "basal" : "thalamus"; }
  const L = data.land, V = a => new T.Vector3(...a);
  NV = { renderer, scene, cam, host, parts, byId, root, N, mode: o.mode, az: 0, el: 6, at: V(NV_VIEWS.body[0]), atTo: V(NV_VIEWS.body[0]), h: NV_VIEWS.body[1], hTo: NV_VIEWS.body[1], hot: new Set(), focus: false, brainFull: false,
    pulses: [], raf: 0, visible: true, t0: performance.now(), story: 0, stage: -1, spin: false, sel: o.root || null, L };
  // Paths for the travelling signal: brain → spinal cord → root → nerve, or back the other way.
  const lineP = id => (data.lines[id]?.p || []).map(V), opp = s => s === "R" ? "L" : "R";
  NV.path = (kind, s, lvl) => {
    const hemi = opp(s), sg = s === "R" ? -1 : 1, hsg = -sg, cx = V(L.cortex[hemi]), arm = /^C|^T1$/.test(lvl), lv = L.levels[lvl] ?? L.levels[arm ? "C6" : "L5"];
    const brain = [cx, cx.clone().add(new T.Vector3(-hsg * 8, -30, -4)), V(L.brain).add(new T.Vector3(hsg * 14, -26, -6)), new T.Vector3(hsg * 6, 1595, -28), new T.Vector3(sg * 3, 1565, -32)];
    const cord = [...lineP("cord"), ...lineP("cauda")].filter(v => v.y < 1560 && v.y >= lv);
    const rootP = lineP(`r${lvl}${s}`), nerve = arm ? [...lineP(`p${/C5|C6|C7|C8|T1/.test(lvl) ? lvl : "C6"}${s}`), ...lineP(`median${s}`)] : /^T/.test(lvl) ? lineP(`ic${Math.max(2, +lvl.slice(1))}${s}`)
      : [...lineP(`${/L2|L3/.test(lvl) ? "p" : "q"}${/L2|L3|L4|L5|S1|S2|S3/.test(lvl) ? lvl : "L5"}${s}`), ...(/L2|L3/.test(lvl) ? lineP(`femoral${s}`) : [...lineP(`sciatic${s}`), ...lineP(`peroneal${s}`)])];
    const all = [...brain, ...cord, ...rootP, ...nerve]; if (kind === "sensory") { all.reverse(); all[all.length - 1] = cx.clone().add(new T.Vector3(0, -8, -18)); }
    return new T.CatmullRomCurve3(all.filter((v, i, a) => !i || v.distanceTo(a[i - 1]) > 2));
  };
  NV.pulseMesh = (col, plain) => { const g = new T.Group(); for (let i = 0; i < 6; i++) { const s = new T.Mesh(new T.SphereGeometry(1, 16, 10), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 - i * .15, depthWrite: false, depthTest: false, blending: plain ? T.NormalBlending : T.AdditiveBlending })); g.add(s); } scene.add(g); return g; };
  NV.halo = new T.Mesh(new T.SphereGeometry(1, 32, 20), new T.MeshBasicMaterial({ color: 0xff6a55, transparent: true, opacity: .2, depthWrite: false, blending: T.AdditiveBlending })); scene.add(NV.halo); NV.halo.visible = false;
  if (o.mode === "cardio") { cvSetup(data); const [at, h] = NV_VIEWS.chest; NV.at.set(...at); NV.atTo.set(...at); NV.h = NV.hTo = h; }
  nvSetHot(o.hot || []); if (o.root) nvRoot(o.root, true); if (o.story) nvStory(); nvSync();
  const resize = () => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  NV.ro = new ResizeObserver(resize); NV.ro.observe(stage); resize();
  const cv = renderer.domElement, fingers = new Map(); let drag = null, pinch = null;
  const gap = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  cv.addEventListener("pointerdown", e => { nvStory(false); NV.spin = false; fingers.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId);
    if (fingers.size === 2) { drag = null; pinch = { d: gap(), h: NV.hTo }; } else drag = { x: e.clientX, y: e.clientY, az: NV.az, el: NV.el }; });
  cv.addEventListener("pointermove", e => { if (!NV || !fingers.has(e.pointerId)) return; fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && fingers.size === 2) { NV.hTo = NV.h = Math.max(160, Math.min(2400, pinch.h * pinch.d / Math.max(20, gap()))); return; }
    if (drag) { NV.az = drag.az - (e.clientX - drag.x) * .45; NV.el = Math.max(-60, Math.min(70, drag.el + (e.clientY - drag.y) * .3)); } });
  const up = e => { fingers.delete(e.pointerId); drag = null; if (fingers.size < 2) pinch = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => { e.preventDefault(); nvStory(false); NV.hTo = NV.h = Math.max(160, Math.min(2400, NV.h * (e.deltaY > 0 ? 1.1 : .91))); }, { passive: false });
  const labels = host.querySelector(".anlabels"), v3 = new T.Vector3(), smooth = (a, b, k) => a + (b - a) * k;
  const frame = t => {
    if (!NV || NV.renderer !== renderer) return; if (!host.isConnected) return nvStop(); NV.raf = requestAnimationFrame(frame); if (!NV.visible) return;
    const s = (t - NV.t0) / 1000, dt = Math.min(.25, (t - (NV.tl || t)) / 1000), k = 1 - Math.exp(-dt * 5); NV.tl = t;
    const cv = NV.mode === "cardio"; if (NV.story) (cv ? cvStep : nvStep)(s - NV.story); if (cv) cvAnimate(s); if (NV.spin) NV.az += 8 * dt;
    NV.at.lerp(NV.atTo, k * .8); NV.h = smooth(NV.h, NV.hTo, k * .8);
    const pulse = .5 + .5 * Math.sin(s * 3.4), sel = NV.sel, derm = NV.mode === "derm", headView = NV.h < 420;
    for (const p of NV.parts) {
      const m = p.m.material, hot = NV.hot.has(p.id); let want = cv ? cvWant(p, hot) : null;
      if (want != null) { /* the chest view chose already */ }
      else if (p.kind === "skin") want = derm ? (sel ? (p.root === sel ? .97 : .42) : .93) : headView ? .05 : .12;
      else if (p.kind === "bone") want = derm ? 0 : headView ? .1 : .2;
      else if (p.kind === "muscle") want = hot ? .95 : 0;
      else if (p.kind === "organ") want = NV.organs ? .55 : 0;
      else if (p.kind === "brain") want = derm ? 0 : NV.focus && !hot ? .25 : 1;
      else want = derm ? (hot ? 1 : p.id === "cord" || p.id === "cauda" ? .5 : 0) : NV.focus && !hot ? .22 : 1;
      if (p.kind === "skin" && derm && !hot) { m.color.copy(p.base); if (sel) m.color.lerp(new T.Color(0x5b6675), .75); }
      if (Math.abs(p.op - want) > .003) { p.op = smooth(p.op, want, k * 1.4); if (Math.abs(p.op - want) < .01) p.op = want; m.opacity = p.op; m.transparent = p.op < 1; m.depthWrite = p.op >= 1 || (p.kind === "skin" && derm && p.op > .9); }
      p.m.visible = p.op > .01;
      if (p.kind === "brain" && !hot) { const full = NV.brainFull || NV.focus; m.color.copy(p.base); if (!full) m.color.lerp(new T.Color(0xe7b3ae), .55); }
      if (hot) { m.color.set(p.kind === "skin" ? p.base : 0xff5f4c); m.emissive = m.emissive || new T.Color(); m.emissive.copy(p.kind === "skin" ? p.base : new T.Color(0xff3a26)); m.emissiveIntensity = (p.kind === "skin" ? .15 : .25) + (p.kind === "skin" ? .3 : .55) * pulse; }
      else if (p.kind !== "nerve" && m.emissive) m.emissiveIntensity = 0;
    }
    if (NV.hotC && !derm) { NV.halo.visible = true; NV.halo.position.copy(NV.hotC); NV.halo.scale.setScalar(NV.hotR * (1 + .5 * pulse)); NV.halo.material.opacity = .05 + .12 * (1 - pulse); } else NV.halo.visible = false;
    // Travelling signals.
    for (const q of NV.pulses) { q.t += dt / q.dur * (q.slow ? .5 + .25 * Math.sin(s * 9) : 1); const stop = q.block != null ? q.block : 1, u = Math.min(stop, q.t), size = NV.h / (q.small ? 90 : 55);
      q.g.children.forEach((b, i) => { const uu = Math.max(0, u - i * .012); b.position.copy(q.curve.getPointAt(uu)); b.scale.setScalar(size * (1 - i * .12) * (q.block != null && q.t > stop ? (i ? 0 : 1 + 1.2 * Math.min(1, (q.t - stop) * 3)) : 1)); b.material.color.set(q.block != null && q.t > stop ? 0xff4a3a : q.col); b.material.opacity = (1 - i * .15) * (q.t > stop + .35 ? Math.max(0, 1 - (q.t - stop - .35) * 3) : 1); });
      if (q.t > stop + .7) { q.loop ? (q.t = 0) : (scene.remove(q.g), q.done = true); } }
    NV.pulses = NV.pulses.filter(q => !q.done);
    const W = stage.clientWidth, H = stage.clientHeight, fov = cam.fov * Math.PI / 360, d = Math.max(NV.h / 2 / Math.tan(fov), NV.h * .55 / 2 / Math.tan(fov) / Math.max(.3, cam.aspect)) * 1.05;
    const az = NV.az * Math.PI / 180, el = NV.el * Math.PI / 180;
    cam.position.set(NV.at.x + d * Math.sin(az) * Math.cos(el), NV.at.y + d * Math.sin(el), NV.at.z + d * Math.cos(az) * Math.cos(el)); cam.near = d / 20; cam.far = d * 6; cam.updateProjectionMatrix(); cam.lookAt(NV.at);
    renderer.render(scene, cam);
    const spots = [];
    for (const el2 of labels.children) { const p = NV.byId[el2.dataset.id]; if (!p || !p.m.visible || p.op < .3) { el2.hidden = true; continue; } el2.hidden = false;
      v3.copy(p.c).project(cam); if (v3.z > 1) { el2.hidden = true; continue; } spots.push({ el: el2, x: (v3.x * .5 + .5) * W, y: (-v3.y * .5 + .5) * H }); }
    spots.sort((a, b) => a.y - b.y); spots.forEach((q, i) => { for (let j = 0; j < i; j++) { const r = spots[j]; if (Math.abs(q.y - r.y) < 22 && q.x < r.x + r.el.offsetWidth && r.x < q.x + q.el.offsetWidth) q.y = r.y + 22; } q.el.style.transform = `translate(${q.x}px, ${q.y}px)`; });
  };
  NV.raf = requestAnimationFrame(frame);
}
const NV_NAME = id => { const a = BRAIN_AREAS.find(b => id === b[0] || id.startsWith("b" + b[0]) || (b[0] === "basal" && id.startsWith("basal"))); if (a) return a[1];
  if (id === "thalamus") return "Relay centre"; if (id === "cord") return "Spinal cord"; if (id === "cauda") return "Nerve roots"; if (id === "cranialNerves") return "Face and head nerves";
  const m = /^(r|p|q)([CTLS]\d+)[RL]$/.exec(id); if (m) return `${m[2]} root`; const n = /^(median|ulnar|radial|musculo|axillary|femoral|saphenous|sciatic|tibial|peroneal)[RL]$/.exec(id);
  if (n) return { musculo: "Musculocutaneous", axillary: "Axillary", median: "Median", ulnar: "Ulnar", radial: "Radial", femoral: "Femoral", saphenous: "Saphenous", sciatic: "Sciatic", tibial: "Tibial", peroneal: "Peroneal" }[n[1]] + " nerve";
  if (CV_NAME[id]) return CV_NAME[id]; if (/^ic\d+/.test(id)) return `T${id.match(/\d+/)[0]} nerve`; if (id.startsWith("d")) return `${id.slice(1)} skin area`; const mu = { deltoid: "Deltoid", upper_arm_muscles: "Upper arm muscles", forearm_muscles: "Forearm muscles", hand_muscles: "Hand muscles", rotator_cuff: "Rotator cuff", iliopsoas: "Hip flexor (iliopsoas)",
    quadriceps: "Quadriceps", hamstrings: "Hamstrings", gluteal: "Buttock muscles", adductors: "Inner thigh muscles", shin_muscles: "Shin muscles", calf: "Calf", foot_muscles: "Foot muscles", diaphragm: "Diaphragm" };
  return mu[id.replace(/_[lr]$/, "")] || id.replace(/_[lr]$/, "").replace(/_/g, " "); };
// Light up parts; the labels follow the lit parts.
function nvSetHot(ids, view) {
  if (!NV) return; const T = THREE; NV.hot = new Set(ids.filter(i => NV.byId[i])); const hp = [...NV.hot].map(i => NV.byId[i]);
  NV.hotC = hp.length ? hp.reduce((c, p) => c.add(p.c), new T.Vector3()).divideScalar(hp.length) : null; NV.hotR = hp.length && hp[0].kind === "brain" ? 28 : 40;
  const lab = NV.host.querySelector(".anlabels"), names = [...new Set(hp.filter(p => p.kind !== "muscle" || true).map(p => p.id))];
  const seen = new Set(); lab.innerHTML = names.filter(i => { const n = NV_NAME(i); if (seen.has(n)) return false; seen.add(n); return true; }).slice(0, 8).map(i => `<span class="antag hot" data-id="${i}">${esc(NV_NAME(i))}</span>`).join("");
  if (view) nvView(view);
}
function nvView(v) { if (!NV) return; const [at, h] = NV_VIEWS[v] || NV_VIEWS.body; NV.atTo.set(...at); NV.hTo = h; NV.az = ((NV.az % 360) + 540) % 360 - 180; NV.azTo = 0; }
// The hot parts for this patient: where the condition sits, on the right side.
function nvHotFor(N) {
  const c = N.cond, s = N.side, o = s === "R" ? "L" : "R", lvl = N.lvl;
  const w = c?.where || ({ brain: "brain", oneSide: "brain", legsBoth: "cord", root: "root" }[N.pattern]);
  if (!w) return { ids: [], view: "body", block: null };
  if (w === "brain") return c?.id === "bell" ? { ids: ["cranialNerves"], view: "head", block: .08 } : { ids: [`bMotor${o}`, `bSensory${o}`], view: "head", block: .03, cap: `${o === "L" ? "Left" : "Right"} brain: movement and feeling` };
  if (w === "basal") return { ids: ["basalR", "basalL"], view: "head", block: null, slow: true };
  if (w === "patchy") return { ids: ["bFrontalR", "bParietalL", "cord"], view: "body", block: null, slow: true };
  if (w === "cord") return { ids: ["cord", "cauda"], view: lvl && /^C/.test(lvl) ? "neck" : "trunk", block: .32 };
  if (w === "root") return { ids: [`r${lvl}${s}`, `d${lvl}`, ...(ROOTS[lvl]?.[2] || []).map(m => `${m}_${s.toLowerCase()}`)], view: nvRootView(lvl, s), block: .5 };
  if (w === "plexus") return { ids: ["C5", "C6", "C7", "C8", "T1"].map(r => `p${r}${s}`), view: "neck", block: .55 };
  if (w === "distal") return { ids: [`tibial${s}`, `peroneal${s}`, `tibial${o}`, `peroneal${o}`], view: "body", block: .9 };
  if (w === "allNerves") return { ids: ["median", "ulnar", "radial", "sciatic", "tibial", "peroneal", "femoral"].flatMap(n => [n + "R", n + "L"]), view: "body", block: .75, slow: true };
  if (w === "cranial") return { ids: ["cranialNerves"], view: "head", block: .08 };
  if (w === "cerebellum") return { ids: ["cerebellum"], view: "head", block: null, slow: true };
  if (w === "motorBoth") return { ids: ["bMotorR", "bMotorL"], view: "head", block: null, slow: true };
  if (w === "frontal") return { ids: ["bFrontalR", "bFrontalL"], view: "head", block: null };
  return { ids: [`${w}${s}`], view: c?.arm ? "arm" + s : "leg" + s, block: .85 };
}
function nvPulse(kind, opt = {}) {
  if (!NV) return; const s = opt.side || NV.N.side, lvl = opt.lvl || (NV.N.cond?.arm || /^C|^T1$/.test(NV.N.lvl || "") ? (NV.N.lvl && /^C[5-8]|^T1$/.test(NV.N.lvl) ? NV.N.lvl : "C6") : NV.N.lvl && /^[LS]/.test(NV.N.lvl) ? NV.N.lvl : "L5");
  const curve = NV.path(kind, s, lvl), q = { curve, t: 0, dur: opt.dur || 3.2, col: kind === "sensory" ? 0x5fe0c0 : 0xffc94a, g: NV.pulseMesh(kind === "sensory" ? 0x5fe0c0 : 0xffc94a), block: opt.block ?? null, slow: opt.slow, loop: opt.loop };
  if (q.block != null && kind === "sensory") q.block = 1 - q.block; NV.pulses.push(q);
}
function nvCap(t) { const c = NV?.host.querySelector(".ancap"); if (!c || c.dataset.t === (t || "")) return; c.dataset.t = t || ""; c.classList.remove("in"); if (t) { c.textContent = t; void c.offsetWidth; c.classList.add("in"); } }
function nvStory(on = true) { if (!NV) return; if (!on) { if (NV.story) { NV.story = 0; NV.stage = -1; nvCap(""); nvSync(); } return; } NV.story = (performance.now() - NV.t0) / 1000; NV.stage = -1; nvSync(); }
function nvStep(t) {
  const N = NV.N, H = nvHotFor(N), has = H.ids.length, stops = [0, 3, 6.5, 10.5, has ? 14.5 : 10.5, has ? 20 : 14.5], st = stops.findLastIndex(x => t >= x); if (st === NV.stage) return; NV.stage = st;
  if (st === 0) { nvSetHot([]); NV.focus = false; NV.brainFull = false; nvView("body"); NV.spin = true; nvCap("Your brain and nerves"); }
  if (st === 1) { NV.spin = false; NV.brainFull = true; nvView("head"); NV.az = -35; nvSetHot([`bMotor${N.side === "R" ? "L" : "R"}`, `bSensory${N.side === "R" ? "L" : "R"}`]); NV.focus = false; nvCap("Movement and feeling areas"); }
  if (st === 2) { nvSetHot([]); nvView("body"); NV.az = 0; nvPulse("motor"); nvCap("Moving: brain → spinal cord → muscle"); }
  if (st === 3) { nvPulse("sensory"); nvCap("Feeling: skin → spinal cord → brain"); }
  if (st === 4 && has) { nvSetHot(H.ids, H.view); NV.focus = true; NV.brainFull = true; nvPulse("motor", { block: H.block, slow: H.slow, dur: 3.6 }); nvCap(H.cap || (N.cond ? `${N.cond.name}: where it affects you` : "Where today's tests point")); hz("tap"); }
  if (st === 5) { NV.story = 0; NV.toured = true; nvCap(""); }
  nvSync();
}
function nvRoot(r, quiet) {
  if (!NV) return; NV.sel = r; const s = NV.N.side; NV.mode = "derm";
  nvSetHot(r ? [`d${r}`, `r${r}R`, `r${r}L`, ...(/^T([2-9]|1[0-2])$/.test(r) ? [`ic${r.slice(1)}${s}`] : []), ...(ROOTS[r]?.[2] || []).flatMap(m => m === "diaphragm" ? [m] : [`${m}_r`, `${m}_l`])] : [], r ? nvRootView(r, s) : "body");
  NV.az = r && /^S[12]$|^S3$/.test(r) ? 180 : r && /^C[23]$/.test(r) ? -40 : 0;
  const info = NV.host.closest(".cin")?.querySelector(".nvinfo"); if (info) info.innerHTML = r ? nvRootInfo(r, NV.N) : "";
  NV.host.closest(".cin")?.querySelectorAll("[data-act=nvRoot]").forEach(b => b.setAttribute("aria-pressed", b.dataset.r === r)); if (!quiet) hz("tap");
}
function nvRootInfo(r, N) {
  const [feel, move, , refl] = ROOTS[r], mine = N.ev.filter(e => Object.entries(MMT_ROOT).some(([g, rr]) => rr === r && e.startsWith(g)));
  return `<b class="nvr" style="--c:${rootCss(r)}">${r}</b><div><span><i>Feels</i>${esc(feel)}</span><span><i>Moves</i>${esc(move)}</span>${refl ? `<span><i>Reflex</i>${esc(refl)}</span>` : ""}${mine.length ? `<span class="nvmine"><i>Your test</i>${esc(mine.join(", "))}</span>` : ""}</div>`;
}
function nvSync() { if (!NV) return; NV.host.querySelector("[data-act=nvPlay]")?.setAttribute("aria-pressed", !!NV.story); NV.host.querySelectorAll("[data-act=nvArea]").forEach(b => b.setAttribute("aria-pressed", NV.area === b.dataset.a)); }

/* ---------- Brachial plexus, drawn flat: roots → trunks → divisions → cords → nerves ---------- */
const PLX = { roots: { C5: 40, C6: 78, C7: 116, C8: 154, T1: 192 }, nerves: { musculo: ["Musculocutaneous", 34, ["C5", "C6", "C7"], "Bends the elbow", "Outer forearm"], axillary: ["Axillary", 80, ["C5", "C6"], "Lifts the arm out to the side", "Patch over the shoulder"],
  radial: ["Radial", 124, ["C5", "C6", "C7", "C8", "T1"], "Straightens the elbow, wrist and fingers", "Back of the hand, thumb side"], median: ["Median", 170, ["C5", "C6", "C7", "C8", "T1"], "Grips and moves the thumb", "Thumb, index and middle fingers"],
  ulnar: ["Ulnar", 214, ["C8", "T1"], "Fine finger movements, grip", "Ring and little fingers"] } };
function plexusSVG(hot = {}) {
  const tr = { U: 58, M: 116, Lo: 174 }, co = { lat: 62, post: 116, med: 172 }, X = [18, 96, 150, 206, 262, 330];
  const seg = (k, x1, y1, x2, y2, roots, nv) => `<path class="px ${hot.seg?.[k] ? "on" : ""} ${hot.cut?.[k] ? "cut" : ""}" data-n="${nv.join(" ")}" data-r="${roots.join(" ")}" d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}"/>`;
  const R = PLX.roots, N = PLX.nerves, all = ["musculo", "axillary", "radial", "median", "ulnar"];
  let s = "";
  for (const [r, y] of Object.entries(R)) { const t = ["C5", "C6"].includes(r) ? "U" : r === "C7" ? "M" : "Lo"; s += seg(`r${r}`, X[0] + 26, y, X[1], tr[t], [r], all.filter(n => N[n][2].includes(r))); }
  for (const [t, y] of Object.entries(tr)) { const rs = t === "U" ? ["C5", "C6"] : t === "M" ? ["C7"] : ["C8", "T1"], ant = t === "Lo" ? "med" : "lat";
    s += seg(`a${t}`, X[1], y, X[3], co[ant], rs, (ant === "lat" ? ["musculo", "median"] : ["median", "ulnar"]).filter(n => rs.some(r => N[n][2].includes(r))));
    s += seg(`p${t}`, X[1], y, X[3], co.post, rs, ["axillary", "radial"].filter(n => rs.some(r => N[n][2].includes(r)))); }
  const cordOf = { musculo: "lat", axillary: "post", radial: "post", median: "lat", ulnar: "med" };
  for (const [n, [, y, rs]] of Object.entries(N)) { s += seg(`n${n}`, X[3], co[cordOf[n]], X[5] - 8, y, rs, [n]); if (n === "median") s += seg("nmedian2", X[3], co.med, X[5] - 8, y, ["C8", "T1"], [n]); }
  const lab = (x, y, t, cls = "") => `<text x="${x}" y="${y}" class="pxl ${cls}">${t}</text>`;
  return `<svg viewBox="0 0 450 240" class="pxsvg" role="img" aria-label="Brachial plexus: nerve roots C5 to T1 joining into the five nerves of the arm">${s}
    ${Object.entries(R).map(([r, y]) => `<g class="pxr ${hot.roots?.includes(r) ? "on" : ""}" data-act="pxRoot" data-r="${r}"><rect x="${X[0] - 14}" y="${y - 12}" width="40" height="24" rx="12"/><text x="${X[0] + 6}" y="${y + 4}">${r}</text></g>`).join("")}
    ${lab(X[1], 230, "Trunks", "h")}${lab(X[3], 230, "Cords", "h")}${lab(X[0] + 6, 230, "Roots", "h")}
    ${Object.entries(N).map(([n, [nm, y]]) => `<g class="pxn ${hot.nerve === n ? "on" : ""}" data-act="pxNerve" data-n="${n}"><circle cx="${X[5] - 4}" cy="${y}" r="7"/><text x="${X[5] + 8}" y="${y + 4}">${nm}</text></g>`).join("")}</svg>`;
}

/* ---------- Walking: a figure built from the gait cycle, typical next to the patient ---------- */
const gbump = (p, c, w) => { let d = Math.abs(p - c); d = Math.min(d, 1 - d); return Math.exp(-(d * d) / (2 * w * w)); };
function gaitPose(p, pat, amp, aff) {
  // Sagittal angles in degrees for one leg at phase p (0 = heel strike), and the arm opposite.
  let hip = 10 + 20 * Math.cos(2 * Math.PI * (p - .02)), knee = 5 + 14 * gbump(p, .15, .07) + 55 * gbump(p, .72, .1), ank = -6 * gbump(p, .06, .04) + 9 * gbump(p, .42, .12) - 18 * gbump(p, .62, .06), abd = 0;
  const a = amp;
  hip = 10 + (hip - 10) * a; knee = knee * (.55 + .45 * a); ank = ank * a;
  if (pat === "pd") { hip = hip * .6 + 8; knee = knee * .7 + 10; ank = ank * .4; }
  if (pat === "crouch") { hip += 22; knee += 28; ank += 12; }
  if (aff) {
    if (pat === "hemi") { knee = 5 + 18 * gbump(p, .72, .12); ank = p > .55 && p < .95 ? -14 : ank * .4; abd = 14 * gbump(p, .75, .1); hip = 10 + (hip - 10) * .7; }
    if (pat === "steppage") { const sw = gbump(p, .75, .1); hip += 18 * sw; knee += 30 * sw; ank = p > .55 && p < .98 ? -22 : ank; }
    if (pat === "antalgic") { knee = knee * .8 + 6; }
  }
  return { hip, knee, ank, abd };
}
function gaitFigure(t, pat, amp, affSide, view, tint) {
  // Returns SVG for one figure at time t (s). Units: mm, ground at y = 0. view: "side" or "front".
  const cad = pat === "pd" ? 1.25 : pat === "cautious" ? .8 : pat === "ataxic" ? .85 : 1, ph = (t * .95 * cad) % 1, D = Math.PI / 180;
  const pelvisDrop = pat === "trend" ? 7 * Math.sin(2 * Math.PI * ph) : 0, lean = pat === "pd" ? 18 : pat === "crouch" ? 10 : 2, sideLean = pat === "trend" ? 5 * Math.sin(2 * Math.PI * ph) : pat === "hemi" ? 4 : pat === "ataxic" ? 4 * Math.sin(2 * Math.PI * ph * .5) : 0;
  const wide = pat === "ataxic" ? 70 : 0, legs = {}, H = 880;
  for (const s of ["R", "L"]) { const pp = (ph + (s === "L" ? .5 : 0)) % 1, aff = affSide === s || (affSide === "B"), g = gaitPose(pp, pat, amp, aff), sx = s === "R" ? -1 : 1;
    const hipJ = [sx * (95 + wide / 2), H + (s === "R" ? -1 : 1) * Math.tan(pelvisDrop * D) * 95 * (view === "front" ? 1 : 0), 0];
    const th = g.hip * D, ab = g.abd * D, kn = (g.hip - g.knee) * D, an = (g.hip - g.knee + 90 + g.ank) * D;
    const knee = [hipJ[0] + sx * Math.sin(ab) * 430, hipJ[1] - Math.cos(th) * Math.cos(ab) * 430, hipJ[2] + Math.sin(th) * 430];
    const ankle = [knee[0], knee[1] - Math.cos(kn) * 430, knee[2] + Math.sin(kn) * 430], toe = [ankle[0], ankle[1] - Math.cos(an) * 160, ankle[2] + Math.sin(an) * 160], heel = [ankle[0], ankle[1] - Math.cos(an - Math.PI) * 50 - 30, ankle[2] + Math.sin(an - Math.PI) * 50];
    legs[s] = { hipJ, knee, ankle, toe, heel, ph: pp }; }
  const low = Math.min(...["R", "L"].flatMap(s => [legs[s].toe[1], legs[s].heel[1]])), up = -low + 6; // keep the lower foot on the floor
  for (const s of ["R", "L"]) for (const k of ["hipJ", "knee", "ankle", "toe", "heel"]) legs[s][k][1] += up;
  const pel = [0, H + up, 0], sh = 360, trunk = 500, lz = Math.sin(lean * D) * trunk, ly = Math.cos(lean * D) * trunk, sx2 = Math.sin(sideLean * D) * trunk;
  const neck = [pel[0] + sx2, pel[1] + ly, pel[2] + lz], head = [neck[0] + sx2 * .3, neck[1] + 120 - (pat === "pd" ? 20 : 0), neck[2] + (pat === "pd" ? 90 : 25)];
  const arms = {};
  for (const s of ["R", "L"]) { const legPh = legs[s === "R" ? "L" : "R"].ph, swing = (pat === "pd" ? .15 : pat === "hemi" && affSide === s ? 0 : 1) * amp * 22 * Math.cos(2 * Math.PI * (legPh - .02)), sx = s === "R" ? -1 : 1;
    const shJ = [neck[0] + sx * (sh / 2) * Math.cos(sideLean * D), neck[1] - 30 + sx * Math.sin(sideLean * D) * 40, neck[2] - 10];
    const held = (pat === "hemi" && affSide === s), elbF = held ? 95 : pat === "pd" ? 45 : 18 + 10 * Math.max(0, Math.sin(swing * D * 3)), shF = held ? 10 : swing + (pat === "pd" ? 10 : 0), abd = pat === "ataxic" ? 18 : held ? 6 : 4;
    const elb = [shJ[0] + sx * Math.sin(abd * D) * 290, shJ[1] - Math.cos(shF * D) * 290, shJ[2] + Math.sin(shF * D) * 290];
    const wr = [elb[0] + sx * (held ? -40 : 10), elb[1] - Math.cos((shF + elbF) * D) * 250, elb[2] + Math.sin((shF + elbF) * D) * 250]; arms[s] = { shJ, elb, wr }; }
  // Project: side view looks at the patient's right side (front to the right); front view faces the patient.
  const P = v => view === "side" ? [v[2], v[1]] : [-v[0], v[1]], near = view === "side" ? "R" : null;
  const ln = (a, b, w, cls) => { const [x1, y1] = P(a), [x2, y2] = P(b); return `<line x1="${x1.toFixed(1)}" y1="${(-y1).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(-y2).toFixed(1)}" stroke-width="${w}" class="${cls}"/>`; };
  const limb = (s, cls) => { const g = legs[s], a = arms[s]; return ln(g.hipJ, g.knee, 70, cls) + ln(g.knee, g.ankle, 56, cls) + ln(g.heel, g.toe, 34, cls); };
  const arm = (s, cls) => { const a = arms[s]; return ln(a.shJ, a.elb, 46, cls) + ln(a.elb, a.wr, 38, cls); };
  const far = view === "side" ? "L" : null, cl = s => `${tint}${s === far ? " far" : ""}${affSide === s || affSide === "B" ? " aff" : ""}`;
  const [hx, hy] = P(head), [nx, ny] = P(neck), [px, py] = P(pel), [lsx, lsy] = P(arms.L.shJ), [rsx, rsy] = P(arms.R.shJ);
  const torso = view === "side" ? `<path class="torso ${tint}" d="M${(px - 70).toFixed(1)} ${(-py + 30).toFixed(1)} Q${(px + 90).toFixed(1)} ${(-py - 20).toFixed(1)} ${(nx + 70).toFixed(1)} ${(-ny + 30).toFixed(1)} L${(nx - 60).toFixed(1)} ${(-ny + 10).toFixed(1)} Q${(px - 120).toFixed(1)} ${(-(py + ny) / 2).toFixed(1)} ${(px - 70).toFixed(1)} ${(-py + 30).toFixed(1)}Z"/>`
    : `<path class="torso ${tint}" d="M${(lsx).toFixed(1)} ${(-lsy - 10).toFixed(1)} L${(rsx).toFixed(1)} ${(-rsy - 10).toFixed(1)} L${(P(legs.R.hipJ)[0] - 30).toFixed(1)} ${(-P(legs.R.hipJ)[1] + 40).toFixed(1)} L${(P(legs.L.hipJ)[0] + 30).toFixed(1)} ${(-P(legs.L.hipJ)[1] + 40).toFixed(1)}Z"/>`;
  const order = view === "side" ? [limb("L", cl("L")), arm("L", cl("L")), torso, limb("R", cl("R")), arm("R", cl("R"))] : [limb("R", cl("R")), limb("L", cl("L")), torso, arm("R", cl("R")), arm("L", cl("L"))];
  return { svg: `${order.join("")}<circle cx="${hx.toFixed(1)}" cy="${(-hy - 40).toFixed(1)}" r="100" class="headc ${tint}"/>`, legs, P };
}

/* ---------- Posture: plumb line, typical next to the patient's measures ---------- */
function postureFigure(v, view, tint, side) {
  // v: fwdHead (°), kyph (°), lord (°), pTilt (°), knee (° flexed), trunk (° forward), shLevel (°), pLevel (°), trunkSide (°). Units mm.
  const D = Math.PI / 180, kneeF = (v.knee || 0) * D, trunk = (v.trunk || 0) * D, sgS = side === "L" ? 1 : -1;
  if (view === "side") {
    const ank = [0, 80], kn = [ank[0] + Math.sin(kneeF) * 430 * .5, ank[1] + 430], hip = [kn[0] - Math.sin(kneeF) * 430, kn[1] + Math.cos(kneeF) * 430], k = Math.max(0, (v.kyph || 35) - 35) * D, fh = Math.max(0, (v.fwdHead || 8) - 8) * D;
    const lumb = [hip[0] + Math.sin(trunk) * 200 - 10, hip[1] + 200], thor = [lumb[0] + Math.sin(trunk + k * .6) * 300, lumb[1] + Math.cos(trunk + k * .6) * 300], neck = [thor[0] + Math.sin(trunk + k * 1.4 + fh * .7) * 120, thor[1] + Math.cos(trunk + k) * 120];
    const head = [neck[0] + Math.sin(fh * 1.6) * 120 + 30, neck[1] + 110], sh = [thor[0] + 10 + Math.sin(k) * 40, thor[1] - 20];
    const spine = `M${hip[0]} ${-hip[1]} Q${lumb[0] - 40 * (v.lord || 45) / 45} ${-lumb[1]} ${(lumb[0] + thor[0]) / 2} ${-(lumb[1] + thor[1]) / 2} Q${thor[0] - 60 * (v.kyph || 35) / 35} ${-thor[1] + 40} ${neck[0]} ${-neck[1]}`;
    const pts = { Ear: head, Shoulder: sh, Hip: hip, Knee: kn, Ankle: ank };
    return { svg: `<path d="${spine}" class="pspine ${tint}"/><line x1="${hip[0]}" y1="${-hip[1]}" x2="${kn[0]}" y2="${-kn[1]}" class="pseg ${tint}" stroke-width="64"/><line x1="${kn[0]}" y1="${-kn[1]}" x2="${ank[0]}" y2="${-ank[1]}" class="pseg ${tint}" stroke-width="52"/>
      <line x1="${ank[0] - 50}" y1="${-30}" x2="${ank[0] + 150}" y2="${-30}" class="pseg ${tint}" stroke-width="34"/><line x1="${sh[0]}" y1="${-sh[1]}" x2="${sh[0] + 20}" y2="${-sh[1] + 300}" class="pseg ${tint}" stroke-width="44"/>
      <circle cx="${head[0]}" cy="${-head[1] - 40}" r="100" class="headc ${tint}"/>`, pts };
  }
  const sh = (v.shLevel || 0) * D * sgS, pl = (v.pLevel || 0) * D * sgS, ts = (v.trunkSide || 0) * D * sgS, hipY = 900;
  const hipL = [95, hipY + Math.tan(pl) * 95], hipR = [-95, hipY - Math.tan(pl) * 95], mid = [0, hipY], c7 = [Math.sin(ts) * 520, hipY + Math.cos(ts) * 520];
  const shL = [c7[0] + 180, c7[1] - 30 + Math.tan(sh) * 180], shR = [c7[0] - 180, c7[1] - 30 - Math.tan(sh) * 180], head = [c7[0] + Math.sin(ts) * 60, c7[1] + 150];
  const leg = (h, s) => `<line x1="${h[0]}" y1="${-h[1]}" x2="${h[0] * .9}" y2="${-470}" class="pseg ${tint}" stroke-width="66"/><line x1="${h[0] * .9}" y1="${-470}" x2="${h[0] * .85}" y2="${-60}" class="pseg ${tint}" stroke-width="52"/>`;
  return { svg: `${leg(hipL)}${leg(hipR)}<path d="M${shL[0]} ${-shL[1]} L${shR[0]} ${-shR[1]} L${hipR[0] - 20} ${-hipR[1] + 30} L${hipL[0] + 20} ${-hipL[1] + 30}Z" class="torso ${tint}"/>
    <line x1="${shL[0]}" y1="${-shL[1]}" x2="${shL[0] + 30}" y2="${-shL[1] + 540}" class="pseg ${tint}" stroke-width="42"/><line x1="${shR[0]}" y1="${-shR[1]}" x2="${shR[0] - 30}" y2="${-shR[1] + 540}" class="pseg ${tint}" stroke-width="42"/>
    <circle cx="${head[0]}" cy="${-head[1] - 40}" r="100" class="headc ${tint}"/>`, pts: { Shoulders: [(shL[0] + shR[0]) / 2, (shL[1] + shR[1]) / 2], Pelvis: mid }, lines: [shL, shR, hipL, hipR] };
}

/* ---------- Slides ---------- */
function neuroSlides(p, N, ctx) {
  const { head, take, flowHTML } = ctx, S = [], c = N.cond, side = N.side === "L" ? "left" : "right", evc = N.ev.slice(0, 6).map(e => `<span>${esc(e)}</span>`).join("");
  if (N.neuro) {
    const H = nvHotFor(N);
    S.push({ id: "brain", html: `<div class="an nv" data-mode="nerve"><div class="anstage"><div class="anlabels"></div><span class="ancap" aria-live="polite"></span><p class="c3msg">Loading the body…</p></div>
      <div class="anctl"><button class="anbtn" data-act="nvPlay" aria-label="Play the guided tour"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
        <button class="anbtn sig m" data-act="nvSig" data-k="motor" aria-label="Show a movement signal">${icon("M12 3v14M7 12l5 5 5-5M5 21h14")}<small>Move</small></button><button class="anbtn sig s" data-act="nvSig" data-k="sensory" aria-label="Show a feeling signal">${icon("M12 21V7M7 12l5-5 5 5M5 3h14")}<small>Feel</small></button>
        ${H.ids.length ? `<button class="anbtn hotb" data-act="nvHot" aria-label="Show where the problem is">${icon("M12 5a7 7 0 1 0 0 14 7 7 0 1 0 0-14M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5")}</button>` : ""}<span class="ansep"></span>
        ${BRAIN_AREAS.map(([a, n]) => `<button class="nvarea" data-act="nvArea" data-a="${a}" style="--c:${hexCss(AREA_COL[a])}" aria-pressed="false"><i></i>${esc(n)}</button>`).join("")}</div>
      ${evc ? `<div class="cev nvev"><b>From today's tests</b>${evc}</div>` : ""}<p class="ancredit">${esc(NEURO_CREDIT)}</p></div>`,
      say: `This is your nervous system. The brain sends a signal down the spinal cord and out along a nerve to make a muscle move, and feeling travels back up the other way.${c ? ` With ${c.name.toLowerCase()}, ${c.flow[2].toLowerCase()}.` : ""}`, nv: { mode: "nerve", story: true } });
    if (c) S.push({ id: "ncause", html: `${head("What is happening", c.name, "Possible, not a diagnosis")}${flowHTML(c.flow)}${take(c.helps)}`, say: `${c.name}. ${c.flow.join(". ")}. ${c.helps}` });
    const showDerm = !["brain", "basal", "cerebellum", "motorBoth", "frontal", "cranial", "patchy"].includes(c?.where) && !!(N.roots.length || ["root", "cord", "plexus", "distal", "allNerves", "median", "ulnar", "radial", "peroneal"].includes(c?.where) || N.pattern === "root" || N.sens.L + N.sens.R);
    if (showDerm) { const first = N.roots[0] || N.lvl || (c?.arm ? "C6" : "L5"), mineR = new Set([...N.roots, N.lvl].filter(Boolean));
      const grp = [["Neck and arm", ["C2", "C3", "C4", "C5", "C6", "C7", "C8", "T1"]], ["Trunk", ["T2", "T4", "T6", "T8", "T10", "T12"]], ["Leg", ["L1", "L2", "L3", "L4", "L5", "S1", "S2", "S3"]]];
      S.push({ id: "derm", html: `<div class="an nv" data-mode="derm" data-root="${first}"><div class="anstage"><div class="anlabels"></div><span class="ancap" aria-live="polite"></span><p class="c3msg">Loading the body…</p></div>
        <div class="nvinfo" aria-live="polite"></div>
        <div class="nvroots">${grp.map(([g, rs]) => `<div><small>${g}</small>${rs.map(r => `<button data-act="nvRoot" data-r="${r}" class="${mineR.has(r) ? "mine" : ""}" style="--c:${rootCss(r)}" aria-pressed="${r === first}">${r}</button>`).join("")}</div>`).join("")}</div>
        <p class="ancredit">Skin areas (dermatomes) and muscles (myotomes) for each nerve root vary a little between people. ${esc(NEURO_CREDIT)}</p></div>`,
        say: `Each nerve root looks after a strip of skin, its dermatome, and a group of muscles, its myotome. ${first}: feels the ${ROOTS[first][0].toLowerCase()}, and moves by ${ROOTS[first][1].toLowerCase()}.`, nv: { mode: "derm", root: first } }); }
    if (c?.plexus || (N.roots.some(r => /^C[5-8]$|^T1$/.test(r)) && c?.where !== "brain")) { const nv = c?.nerve && PLX.nerves[c.nerve] ? c.nerve : null, rs = nv ? PLX.nerves[nv][2] : [N.lvl].filter(r => PLX.roots[r]);
      S.push({ id: "plexus", html: `${head("The arm's wiring", "Brachial plexus")}<div class="pxw" data-n="${nv || ""}" data-r="${rs.join(" ")}"><div class="pxbox">${plexusSVG()}</div><div class="pxinfo" aria-live="polite"></div></div>${take("Tap a root or a nerve to follow it. Knowing which nerve is involved explains exactly where you feel it.")}`,
        say: "Five nerve roots from the neck, C5 to T1, mix together in the armpit and come out as five nerves for the arm. Each nerve moves certain muscles and feels a certain patch of skin." }); }
  }
  const g = N.gait;
  if (g) { const G = GAITS[g.pat];
    S.push({ id: "gait", html: `${head("Your walking", G[0], g.from.length ? `From your ${g.from.join(", ").toLowerCase()}` : "The usual pattern, to compare")}<div class="gt" data-p="${g.pat}" data-a="${g.amp.toFixed(2)}" data-s="${g.pat === "hemi" || g.pat === "steppage" || g.pat === "antalgic" ? N.side : g.pat === "trend" ? N.side : ""}">
      <div class="gtstage"><svg class="gtsvg" viewBox="-1300 -1900 2600 1980" aria-label="Typical walking next to yours"><g class="gtA"></g><g class="gtB"></g><line x1="-1300" y1="0" x2="1300" y2="0" class="gtfloor"/><g class="gtticks"></g>
        <text x="-650" y="-1800" class="gtl">Typical</text><text x="650" y="-1800" class="gtl me">Yours</text></svg></div>
      <div class="segc" role="group" aria-label="View"><button data-act="gtView" data-v="side" aria-pressed="true">Side</button><button data-act="gtView" data-v="front" aria-pressed="false">Front</button><button data-act="gtView" data-v="slow" aria-pressed="false">Slow motion</button></div>
      ${g.num.length ? `<div class="gtnum">${g.num.map(([k, v, n, r]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b>${n ? `<span>Typical ${esc(n)}</span>` : ""}${r != null ? `<i style="--w:${Math.round(Math.min(1, r) * 100)}%"></i>` : ""}</div>`).join("")}</div>` : ""}</div>
      <h3 class="cfh">Root cause</h3>${flowHTML(G[1])}${take(`What we train: ${G[2]}.`)}`, say: `Your walking: ${G[0].toLowerCase()}. ${G[1].join(". ")}. What we train: ${G[2]}.` }); }
  const po = N.posture;
  if (po) { const PP = POSTURES[po.pat];
    S.push({ id: "posture", html: `${head("Your posture", PP[0], po.measured ? "From your posture analysis" : "The usual pattern, to compare")}<div class="pt" data-p="${po.pat}"><div class="ptbox">${postureSVG(po)}</div>
      ${po.rows.length ? `<div class="gtnum">${po.rows.slice(0, 4).map(([k, v, sv]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b><span>${esc(sv)}</span></div>`).join("")}</div>` : ""}</div>
      <h3 class="cfh">Root cause</h3>${flowHTML(PP[1])}${take(`What we train: ${PP[2]}.`)}`, say: `Your posture: ${PP[0].toLowerCase()}. ${PP[1].join(". ")}. What we train: ${PP[2]}.` }); }
  return S;
}
function postureSVG(po) {
  const typ = { kyph: 35, fwdHead: 8, lord: 45 }, sideV = ["pd", "fhp", "flexed", "sway"].includes(po.pat), view = sideV ? "side" : "front", ox = 650;
  const A = postureFigure(view === "side" ? typ : {}, view, "typ", po.side), B = postureFigure(po.v, view, "me", po.side);
  const plumb = x => `<line x1="${x}" y1="-1820" x2="${x}" y2="0" class="plumb"/>`;
  const dots = (f, dx) => Object.entries(f.pts).map(([k, [x, y]]) => `<circle cx="${x + dx}" cy="${-y - (k === "Ear" ? 40 : 0)}" r="22" class="pdot2"/>`).join("");
  const ref = view === "side" ? plumb(-ox + 30) + plumb(ox + 30) : plumb(-ox) + plumb(ox);
  return `<svg viewBox="-1300 -1900 2600 1980" class="ptsvg" role="img" aria-label="Typical posture next to yours, with a plumb line">${ref}
    <g transform="translate(${-ox} 0)">${A.svg}</g>${dots(A, -ox)}<g transform="translate(${ox} 0)">${B.svg}</g>${dots(B, ox)}
    ${view === "front" ? `<line x1="${-ox - 260}" y1="${-(1390)}" x2="${-ox + 260}" y2="${-(1390)}" class="plevel"/><line x1="${ox - 260}" y1="-1390" x2="${ox + 260}" y2="-1390" class="plevel"/>` : ""}
    <line x1="-1300" y1="0" x2="1300" y2="0" class="gtfloor"/><text x="${-ox}" y="-1800" class="gtl">Typical</text><text x="${ox}" y="-1800" class="gtl me">Yours</text></svg>`;
}
let GT = null;
function gtStart(host) {
  GT && cancelAnimationFrame(GT.raf); const svg = host.querySelector(".gtsvg"), pat = host.dataset.p, amp = +host.dataset.a, aff = host.dataset.s || (pat === "pd" || pat === "ataxic" || pat === "crouch" || pat === "cautious" ? "B" : "");
  GT = { host, view: "side", speed: 1, raf: 0, visible: true, t: 0, last: 0 };
  const A = svg.querySelector(".gtA"), B = svg.querySelector(".gtB"), ticks = svg.querySelector(".gtticks");
  const frame = now => { if (!GT || !host.isConnected) return; GT.raf = requestAnimationFrame(frame); if (!GT.visible) { GT.last = now; return; }
    const dt = Math.min(.05, (now - (GT.last || now)) / 1000); GT.last = now; GT.t += dt * GT.speed; if (reduced() && GT.t > .3) GT.t = .3;
    const a = gaitFigure(GT.t, "normal", 1, "", GT.view, "typ"), b = gaitFigure(GT.t, pat, amp, aff, GT.view, "me");
    A.setAttribute("transform", "translate(-650 0)"); B.setAttribute("transform", "translate(650 0)"); A.innerHTML = a.svg; B.innerHTML = b.svg;
    if (GT.view === "side") { const off = (GT.t * 1300) % 300; ticks.innerHTML = Array.from({ length: 10 }, (_, i) => `<line x1="${-1300 + i * 300 - off}" y1="0" x2="${-1300 + i * 300 - off - 40}" y2="40" class="gtick"/>`).join(""); } else ticks.innerHTML = ""; };
  GT.raf = requestAnimationFrame(frame);
}
function pxShow(host, sel) {
  const svgBox = host.querySelector(".pxbox"), info = host.querySelector(".pxinfo"), N = PLX.nerves; let hot = {};
  if (sel.n) { const [nm, , rs, mv, fl] = N[sel.n]; hot = { nerve: sel.n, roots: rs, seg: {} }; svgBox.innerHTML = plexusSVG(hot); svgBox.querySelectorAll(".px").forEach(e => e.classList.toggle("on", e.dataset.n.split(" ").includes(sel.n)));
    info.innerHTML = `<b>${esc(nm)} nerve</b><span><i>Moves</i>${esc(mv)}</span><span><i>Feels</i>${esc(fl)}</span><span><i>Roots</i>${rs.join(", ")}</span>`; }
  else if (sel.r) { hot = { roots: [sel.r] }; svgBox.innerHTML = plexusSVG(hot); svgBox.querySelectorAll(".px").forEach(e => e.classList.toggle("on", e.dataset.r.split(" ").includes(sel.r)));
    const ns = Object.entries(N).filter(([, v]) => v[2].includes(sel.r)).map(([, v]) => v[0]); info.innerHTML = `<b>${sel.r} root</b><span><i>Feels</i>${esc(ROOTS[sel.r][0])}</span><span><i>Moves</i>${esc(ROOTS[sel.r][1])}</span><span><i>Joins</i>${esc(ns.join(", "))}</span>`; }
  else { svgBox.innerHTML = plexusSVG(); info.innerHTML = ""; }
}
const NEURO_ACT = {
  nvPlay: () => { if (!NV) return; NV.story ? nvStory(false) : (NV.mode = "nerve", nvStory()); },
  nvSig: d => { if (!NV) return; nvStory(false); NV.focus = false; nvSetHot([]); nvView("body"); NV.az = 0; nvPulse(d.k); nvCap(d.k === "motor" ? "Moving: brain → spinal cord → muscle" : "Feeling: skin → spinal cord → brain"); hz("tap"); },
  nvHot: () => { if (!NV) return; nvStory(false); const H = nvHotFor(NV.N); nvSetHot(H.ids, H.view); NV.focus = true; NV.brainFull = true; nvPulse("motor", { block: H.block, slow: H.slow, dur: 3.6 }); nvCap(H.cap || (NV.N.cond ? NV.N.cond.name : "Where today's tests point")); hz("tap"); },
  nvArea: d => { if (!NV) return; nvStory(false); NV.area = NV.area === d.a ? null : d.a; NV.brainFull = true; NV.focus = !!NV.area;
    const ids = !NV.area ? [] : d.a === "basal" ? ["basalR", "basalL"] : ["cerebellum", "brainstem"].includes(d.a) ? [d.a] : [`b${d.a}R`, `b${d.a}L`]; nvSetHot(ids, "head"); NV.az = d.a === "Occipital" || d.a === "cerebellum" ? 150 : d.a === "Temporal" ? -80 : -35;
    nvCap(NV.area ? BRAIN_AREAS.find(b => b[0] === d.a)[2] : ""); nvSync(); hz("tap"); },
  nvRoot: d => nvRoot(d.r),
  gtView: (d, b) => { if (!GT) return; if (d.v === "slow") { GT.speed = GT.speed === 1 ? .35 : 1; b.setAttribute("aria-pressed", GT.speed !== 1); } else { GT.view = d.v; b.parentElement.querySelectorAll("[data-v=side],[data-v=front]").forEach(x => x.setAttribute("aria-pressed", x === b)); } hz("tap"); },
  pxRoot: (d, b) => pxShow(b.closest(".pxw"), { r: d.r }),
  pxNerve: (d, b) => pxShow(b.closest(".pxw"), { n: d.n }),
};
