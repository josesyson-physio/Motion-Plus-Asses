/* ---------- Consultation room ----------
   A full-screen presentation the therapist walks the patient through before any printout:
   results as pictures, a body map, the joint in 3D with its lever and pulley, possible ways
   the problem came about (a flow chart, always worded as a possibility), goals and an
   editable rehab plan. The 3D view loads three.js on first use and is cached for offline use. */

// Each joint: what it is in plain words, its lever, a 3D rig (bones, muscles, the moving segment),
// common mechanisms of injury and a default four-phase rehab plan the therapist can edit.
// Rig coordinates are in cm with the joint at the origin: "p" parts stay still, "d" parts turn
// about `axis`; `grav` is which way is down for the pictured position.
const JOINTS = {
  knee: {
    name: "Knee", move: "Straightening the knee (sitting)", side: true,
    lever: { cls: 3, F: "Knee joint", E: "Quadriceps, through the kneecap", L: "Weight of the lower leg", pos: { F: .06, E: .21, L: .9 },
      pulley: { label: "Kneecap", gain: 1.4, note: "The kneecap lifts the tendon away from the joint like a pulley, so the quadriceps work about a third less hard." },
      story: "When you straighten your knee, the thigh muscle pulls very close to the hinge while the weight sits far out at the foot." },
    rig: { grav: [0, 0, -1], axis: [1, 0, 0], range: [0, 95], start: 55, view: [90, 12], what: "flexion",
      parts: [["c", "p", [0, 42, 0], [0, 4, 0], 2.6], ["s", "p", [-2.3, 1.2, -.6], 3.1], ["s", "p", [2.3, 1.2, -.6], 3.1],
        ["s", "d", [0, -2.4, 0], 4.2, [1, .45, .95]], ["c", "d", [0, -3, .3], [0, -38, -.3], 2.3], ["s", "d", [0, -7, 2.3], 1.3], ["c", "d", [3.3, -4.5, -1.4], [3.1, -37, -1], .9],
        ["s", "d", [-1.6, -39.5, 0], 1.6], ["s", "d", [3.2, -40, -1], 1.3], ["c", "d", [0, -41.5, -1.5], [0, -43, 13], 2], ["s", "pat", [0, 0, 0], 1.9, [1.25, 1.35, .7]]],
      muscles: [{ n: "Quadriceps", e: 1, r: 2.5, b: [0, .82], pts: [["p", 0, 34, 3], ["p", 0, 18, 4], ["p", 0, 8, 4.3], ["pat"], ["d", 0, -7, 2.7]] },
        { n: "Hamstrings", r: 2, b: [.05, .8], pts: [["p", 0, 38, -2.6], ["p", -.8, 14, -3.8], ["p", -1.5, 2, -3.9], ["d", -2.6, -6, -2.4]] },
        { n: "Calf", r: 2, b: [.1, .62], pts: [["p", -2, 3.5, -3], ["d", -1.5, -12, -4.6], ["d", 0, -26, -3.4], ["d", 0, -41, -3.6]] }],
      eline: [["pat"], ["d", 0, -7, 2.7]], load: ["d", 0, -40, 0], pulleyAt: ["pat"],
      pat: th => { const a = th * Math.PI / 180, bz = 1 + Math.cos(a), by = -Math.sin(a), n = Math.hypot(by, bz) || 1; return [0, 5.6 * by / n + 1.2, 5.6 * bz / n]; } },
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
    rig: { grav: [0, -1, 0], axis: [0, 0, 1], range: [0, 35], start: 15, view: [8, 6], what: "abduction",
      parts: [["s", "p", [3, 11, -1], 5.5, [.95, 1.15, .32]], ["c", "p", [0, 3, 0], [3, 9, -1], 2.4], ["c", "p", [-1, -3, 2], [-12, -5, 3], 1.4], ["c", "p", [-1, -3, -1], [-3, -8, -2], 1.6], ["s", "p", [-12, 5, -2.5], 3, [.9, 1.4, .55]], ["c", "p", [-12, -5, 3], [-12, -1, 1], 1.4],
        ["s", "d", [0, 0, 0], 2.6], ["c", "d", [.6, -.4, 0], [5.5, -3.5, 0], 1.6], ["s", "d", [6.6, -2.4, -.4], 1.9], ["c", "d", [6, -4.5, 0], [3.2, -40, .6], 2.2], ["s", "d", [3, -42, .8], 3.2, [1.25, .8, 1]]],
      muscles: [{ n: "Gluteus medius", e: 1, r: 3.2, b: [0, .8], pts: [["p", 3, 15, -.6], ["p", 7.6, 8, -.2], ["d", 7.8, -1.4, 0]] },
        { n: "Adductors", r: 2, b: [.05, .85], pts: [["p", -6, -5.5, 2.4], ["d", 1.5, -18, 1], ["d", 3.3, -30, .6]] }],
      eline: [["p", 7.6, 8, -.2], ["d", 7.8, -1.4, 0]], load: ["d", 3, -20, .5], pulleyAt: ["d", 6.6, -2.4, -.4] },
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
    rig: { grav: [0, -1, 0], axis: [1, 0, 0], range: [-15, 40], start: 10, view: [90, 10], what: "plantarflexion",
      parts: [["c", "p", [0, 3, .3], [0, 40, 0], 2.2], ["c", "p", [2.6, 2.2, -1], [2.4, 36, -1], .9], ["s", "p", [-2.2, 1.3, .2], 1.4], ["s", "p", [2.8, .4, -.8], 1.4],
        ["s", "d", [0, 0, .3], 2.6, [1, .8, 1.2]], ["c", "d", [0, -2.2, -1.5], [0, -3, -6.2], 2.3], ["c", "d", [0, -1.5, 2], [0, -3, 9], 1.9], ["c", "d", [-1, -3, 8], [-1.4, -4.2, 14], 1.1], ["c", "d", [1.2, -3, 8], [1.8, -4.2, 13.5], 1], ["c", "d", [-1.4, -4.3, 14], [-1.4, -4.5, 17], .9]],
      muscles: [{ n: "Calf and Achilles", e: 1, r: 2.9, b: [0, .62], pts: [["p", 0, 32, -2.8], ["p", 0, 20, -4.3], ["p", 0, 8, -3.2], ["d", 0, -2.8, -6.8]] },
        { n: "Tibialis anterior", r: 1.3, b: [.05, .6], pts: [["p", 1.4, 30, 2.4], ["p", .8, 6, 2.6], ["d", -.6, -1, 4.4]] },
        { n: "Peroneus longus", r: 1, b: [.05, .55], pts: [["p", 3.2, 30, -1], ["p", 3.4, 4, -2.2], ["p", 3.4, -.4, -2.1], ["d", 2.2, -3.5, 6]] }],
      eline: [["p", 0, 8, -3.2], ["d", 0, -2.8, -6.8]], load: ["d", 0, -2.5, 5], pulleyAt: ["p", 2.8, .4, -.8] },
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
    rig: { grav: [0, -1, 0], axis: [0, 0, 1], range: [0, 150], start: 60, view: [8, 8], what: "abduction", focus: .3, zoom: .78,
      parts: [["c", "p", [-15, 4.5, 4], [1, 5, .8], 1.1], ["c", "p", [1, 5, .8], [3.5, 5.2, -2.5], 1.4], ["s", "p", [-6, -5, -6], 7, [.8, 1.2, .2]], ["c", "p", [-10, 1, -6.5], [2.5, 4.8, -2.5], .9], ["s", "p", [-1.4, 0, -.3], 1.8, [.6, 1.2, 1]],
        ["s", "d", [.6, 0, 0], 2.7], ["s", "d", [2.6, .4, .6], 1.3], ["c", "d", [1.2, -2, 0], [1.2, -30, 0], 1.7], ["s", "d", [1.2, -31, 0], 2, [1.6, .7, 1]], ["c", "d", [1.2, -32, .3], [1.2, -55, .8], 1.4], ["s", "d", [1.2, -58, .8], 2.2, [.8, 1.5, .5]]],
      muscles: [{ n: "Deltoid", e: 1, r: 3.6, b: [0, .9], pts: [["p", 3.2, 5.6, -.4], ["d", 5, -1, .4], ["d", 4.2, -8, .5], ["d", 2.9, -15, .6]] },
        { n: "Rotator cuff", r: 1.3, b: [0, .7], pts: [["p", -9, 3.2, -5.5], ["p", -1, 4, -2], ["d", 2.4, 1.8, .6]] }],
      eline: [["d", 4.2, -8, .5], ["d", 2.9, -15, .6]], load: ["d", 1.2, -42, .6], pulleyAt: ["d", 2.6, .4, .6] },
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
    rig: { grav: [0, -1, 0], axis: [-1, 0, 0], range: [0, 135], start: 70, view: [90, 8], what: "flexion",
      parts: [["c", "p", [0, 3, 0], [0, 32, 0], 1.9], ["s", "p", [0, 33, -.5], 2.8], ["s", "p", [-2.3, .8, 0], 1.6], ["s", "p", [2.3, .8, 0], 1.6],
        ["c", "d", [0, -.5, -1], [.2, -25, 0], 1.2], ["s", "d", [0, 1, -2.2], 1.5], ["c", "d", [2, -1, .6], [1.9, -24.5, 1.2], 1.1], ["s", "d", [2, -.8, .6], 1.3], ["s", "d", [1, -29.5, 1], 3, [.9, 1.5, .45]]],
      muscles: [{ n: "Biceps", e: 1, r: 2.3, b: [.1, .8], pts: [["p", .8, 31, 2.2], ["p", .8, 18, 3.7], ["p", 1.2, 6, 3], ["d", 1.8, -4, 1.6]] },
        { n: "Brachialis", r: 1.6, b: [0, .85], pts: [["p", 0, 15, 1.4], ["p", 0, 5, 2.4], ["d", .4, -3.6, .8]] },
        { n: "Triceps", r: 2.3, b: [.05, .8], pts: [["p", 0, 30, -2.4], ["p", 0, 14, -3.4], ["p", 0, 3, -3.2], ["d", 0, 1.6, -3.2]] }],
      eline: [["p", 1.2, 6, 3], ["d", 1.8, -4, 1.6]], load: ["d", 1, -30, 1] },
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
    rig: { grav: [0, -1, 0], axis: [1, 0, 0], range: [0, 60], start: 25, view: [90, 10], what: "flexion",
      parts: [["s", "p", [0, -4, -1.6], 3, [1, 1.6, .7]], ["s", "p", [-8, -3, 0], 5, [.5, 1.2, 1]], ["s", "p", [8, -3, 0], 5, [.5, 1.2, 1]], ["c", "p", [-8, -10, 1.5], [-8, -36, 2.5], 2], ["c", "p", [8, -10, 1.5], [8, -36, 2.5], 2], ["c", "p", [-4, -9, 5], [4, -9, 5], 1.3],
        ...[0, 1, 2, 3, 4].flatMap(i => { const y = 2.2 + i * 4.3; return [["s", "d", [0, y, .6], 2.6, [1.15, .62, .95]], ["s", "d", [0, y + 2.15, .6], 2.3, [1.2, .3, 1], "disc"], ["c", "d", [0, y, -1.6], [0, y - .6, -4.6], .8]]; }),
        ["s", "d", [0, 0, .6], 2.3, [1.2, .32, 1], "disc"], ["c", "d", [0, 23, .2], [0, 48, -2.5], 2.2], ["s", "d", [0, 38, 3], 9, [1.1, 1.25, .75], "glass"], ["c", "d", [0, 49, -1.6], [0, 56, 0], 1.6], ["s", "d", [0, 62, 1], 6.5, [.9, 1.05, 1]]],
      muscles: [{ n: "Back muscles", e: 1, r: 1.9, b: [0, 1], pts: [["p", 1.8, -6, -4], ["d", 1.8, 6, -4.6], ["d", 1.8, 18, -4.4], ["d", 1.8, 30, -4.6]] },
        { n: "", e: 2, r: 1.9, b: [0, 1], pts: [["p", -1.8, -6, -4], ["d", -1.8, 6, -4.6], ["d", -1.8, 18, -4.4], ["d", -1.8, 30, -4.6]] },
        { n: "Tummy muscles", r: 1.5, b: [.1, .9], pts: [["p", 0, -8, 5.4], ["d", 0, 10, 7], ["d", 0, 26, 9]] }],
      eline: [["p", 1.8, -6, -4], ["d", 1.8, 6, -4.6]], load: ["d", 0, 36, 3] },
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
    rig: { grav: [0, -1, 0], axis: [1, 0, 0], range: [-30, 45], start: 10, view: [90, 6], what: "flexion",
      parts: [...[0, 1, 2, 3, 4, 5, 6].flatMap(i => { const y = -2.2 - i * 3.1; return [["s", "p", [0, y, .8], 1.7, [1.2, .6, 1]], ["s", "p", [0, y + 1.55, .8], 1.5, [1.2, .3, 1], "disc"], ["c", "p", [0, y, -1], [0, y - .6, -3.2 - .25 * i], .55]]; }),
        ["c", "p", [-16, -24, -1.5], [16, -24, -1.5], 2.6], ["c", "p", [0, -23, -.5], [0, -36, -2.5], 2.2],
        ["s", "d", [0, 8, 2.2], 8, [.85, .95, 1.1]], ["s", "d", [0, .6, 8.4], 1.8, [1.6, 1, 1]], ["s", "d", [0, 6.5, 10.3], 1, [.7, 1.2, 1]], ["s", "d", [-2.6, 9, 9.2], .8, [1, 1, .5], "eye"], ["s", "d", [2.6, 9, 9.2], .8, [1, 1, .5], "eye"]],
      muscles: [{ n: "Neck muscles", e: 1, r: 1.5, b: [0, .9], pts: [["p", 1.6, -20, -3.8], ["p", 1.6, -8, -3.6], ["d", 1.8, 3.2, -5]] },
        { n: "", e: 2, r: 1.5, b: [0, .9], pts: [["p", -1.6, -20, -3.8], ["p", -1.6, -8, -3.6], ["d", -1.8, 3.2, -5]] },
        { n: "Front neck muscles", r: 1, b: [.05, .9], pts: [["p", 2, -22, 3.5], ["p", 3.2, -10, 2.6], ["d", 4.8, 4, -1.6]] }],
      eline: [["p", 1.6, -8, -3.6], ["d", 1.8, 3.2, -5]], load: ["d", 0, 7, 2.5] },
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
  const s = `${p.dx} ${p.notes}`;
  return { joint: k, mech: J.mech.filter(m => m.kw.test(s)).map(m => m.id), phases: PHASES.map(([h, wk], i) => ({ h, wk, items: J.rehab[i].slice() })), now: 0 };
}

/* ---------- The joint in 3D: three.js, drawn from the rig above ---------- */
let C3 = null;
function c3Stop() { if (!C3) return; cancelAnimationFrame(C3.raf); C3.ro?.disconnect(); try { C3.renderer.dispose(); C3.renderer.forceContextLoss?.(); } catch (e) {} C3.renderer.domElement.remove(); C3 = null; }
function c3Capsule(a, b, r, mat) {
  const g = new THREE.Group(), A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .92, len, 18, 1, true), mat);
  cyl.position.copy(A).addScaledVector(d, .5); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(r * 1.18, 18, 12), mat), s2 = s1.clone(); s1.position.copy(A); s2.position.copy(B); s2.scale.setScalar(.95);
  g.add(cyl, s1, s2); return g;
}
// A muscle: a tube along its path whose radius swells in the belly and thins to tendon at the ends.
function c3MuscleGeo(pts, r, b, col, tendonCol) {
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), seg = 30, rad = 12, g = new THREE.TubeGeometry(curve, seg, r, rad, false);
  const pos = g.attributes.position, cols = new Float32Array(pos.count * 3), v = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg, w = Math.max(0, Math.min(1, (u - b[0]) / Math.max(.01, b[1] - b[0]))), belly = u < b[0] || u > b[1] ? 0 : Math.pow(Math.sin(Math.PI * w), .6), k = .26 + .74 * belly, ctr = curve.getPointAt(u);
    c.copy(tendonCol).lerp(col, Math.min(1, belly * 1.6));
    for (let j = 0; j <= rad; j++) { const ix = i * (rad + 1) + j; v.fromBufferAttribute(pos, ix).sub(ctr).multiplyScalar(k).add(ctr); pos.setXYZ(ix, v.x, v.y, v.z); cols[ix * 3] = c.r; cols[ix * 3 + 1] = c.g; cols[ix * 3 + 2] = c.b; }
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
}
async function c3Start(host, key) {
  c3Stop(); const out = host.querySelector(".c3msg");
  try { await need("three"); } catch (e) { out.textContent = "The 3D model needs an internet connection the first time it opens. The lever on the next slide works offline."; return; }
  const J = JOINTS[key], rig = J.rig, T = THREE;
  let renderer; try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { out.textContent = "This device can't show 3D. The lever on the next slide shows the same idea."; return; }
  out.textContent = "";
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputEncoding = T.sRGBEncoding;
  host.querySelector(".c3stage").prepend(renderer.domElement);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 1, 2000);
  scene.add(new T.HemisphereLight(0xfff6e8, 0x1b2333, .85)); const key1 = new T.DirectionalLight(0xffffff, 1.05); key1.position.set(40, 70, 60); scene.add(key1);
  const rim = new T.DirectionalLight(0x9cc8ff, .55); rim.position.set(-60, 20, -50); scene.add(rim);
  const M = { bone: new T.MeshStandardMaterial({ color: 0xeee6d2, roughness: .6 }), disc: new T.MeshStandardMaterial({ color: 0x6fb4d6, roughness: .4 }), eye: new T.MeshStandardMaterial({ color: 0x2b2b2b, roughness: .3 }),
    glass: new T.MeshStandardMaterial({ color: 0xeee6d2, roughness: .6, transparent: true, opacity: .14, depthWrite: false }) };
  const root = new T.Group(), dist = new T.Group(); root.add(dist); scene.add(root);
  root.quaternion.setFromUnitVectors(new T.Vector3(...rig.grav).normalize(), new T.Vector3(0, -1, 0));
  let patMesh = null;
  for (const [kind, seg, a, b, c, d] of rig.parts) {
    const mat = M[d || "bone"] || M.bone, m = kind === "c" ? c3Capsule(a, b, c, mat) : new T.Mesh(new T.SphereGeometry(b, 24, 16), mat);
    if (kind === "s") { m.position.set(...a); if (c) m.scale.set(...c); }
    if (seg === "pat") { patMesh = m; root.add(m); } else (seg === "d" ? dist : root).add(m);
  }
  const axis = new T.Vector3(...rig.axis).normalize(), q = new T.Quaternion(), grav = new T.Vector3(...rig.grav).normalize();
  const tendon = new T.Color(0xf1e9d6), effortC = new T.Color(0xd8463c), otherC = new T.Color(0x9a6158);
  const muscles = rig.muscles.map(m => { const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, transparent: !m.e, opacity: m.e ? 1 : .6 }), mesh = new T.Mesh(new T.BufferGeometry(), mat); root.add(mesh); return { ...m, mesh }; });
  const gold = 0xf3c623, blue = 0x5aa9e6;
  const ring = new T.Mesh(new T.TorusGeometry(3.4, .32, 10, 48), new T.MeshBasicMaterial({ color: gold })); ring.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), axis); root.add(ring);
  const eArrow = new T.ArrowHelper(new T.Vector3(0, 1, 0), new T.Vector3(), 10, gold, 2.6, 1.8), lArrow = new T.ArrowHelper(new T.Vector3(0, -1, 0), new T.Vector3(), 10, blue, 2.6, 1.8);
  const lineOf = col => { const l = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineBasicMaterial({ color: col })); root.add(l); return l; };
  const eLine = lineOf(gold), lLine = lineOf(blue); root.add(eArrow, lArrow);
  const P = (spec, th) => spec[0] === "pat" ? new T.Vector3(...rig.pat(th)) : spec[0] === "d" ? new T.Vector3(spec[1], spec[2], spec[3]).applyQuaternion(q) : new T.Vector3(spec[1], spec[2], spec[3]);
  const flat = v => v.clone().addScaledVector(axis, -v.dot(axis));
  // Shortest distance from the joint axis to a line through p along d, and where it meets.
  const armTo = (p, d) => { const pp = flat(p), dd = flat(d); if (dd.lengthSq() < 1e-6) return { arm: pp.length(), foot: pp }; dd.normalize(); const foot = pp.clone().addScaledVector(dd, -pp.dot(dd)); return { arm: foot.length(), foot }; };
  const box = new T.Box3(), b1 = new T.Box3(); for (const f of [0, .5, 1]) { q.setFromAxisAngle(axis, (rig.range[0] + f * (rig.range[1] - rig.range[0])) * Math.PI / 180); dist.quaternion.copy(q); root.updateMatrixWorld(true); box.union(b1.setFromObject(root)); }
  const target = box.getCenter(new T.Vector3()).multiplyScalar(1 - (rig.focus || 0)), size = box.getSize(new T.Vector3()).length() * (rig.zoom || 1);
  C3 = { renderer, scene, cam, host, key, rig, th: rig.start, play: true, lever: true, az: rig.view[0], el: rig.view[1], zoom: 1, target, size, raf: 0, visible: true, t0: performance.now(), last: "" };
  const labels = host.querySelector(".c3labels"), slider = host.querySelector(".c3angle"), read = host.querySelector(".c3read"), eName = rig.muscles.find(m => m.e === 1).n;
  const tags = { piv: "Pivot", eff: eName, load: "Load", ...(rig.pulleyAt && J.lever.pulley ? { pul: J.lever.pulley.label } : {}) };
  labels.innerHTML = Object.entries(tags).map(([k, t]) => `<span class="c3tag ${k}" data-k="${k}">${esc(t)}</span>`).join("");
  const resize = () => { const w = host.querySelector(".c3stage").clientWidth, h = host.querySelector(".c3stage").clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  C3.ro = new ResizeObserver(resize); C3.ro.observe(host.querySelector(".c3stage")); resize();
  const cv = renderer.domElement; let drag = null;
  // One finger turns the model, two fingers pinch to zoom.
  const fingers = new Map(), gap = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); }; let pinch = null;
  cv.addEventListener("pointerdown", e => { fingers.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId);
    if (fingers.size === 2) { drag = null; pinch = { d: gap(), z: C3.zoom }; } else drag = { x: e.clientX, y: e.clientY, az: C3.az, el: C3.el }; });
  cv.addEventListener("pointermove", e => { if (!C3 || !fingers.has(e.pointerId)) return; fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && fingers.size === 2) { C3.zoom = Math.max(.45, Math.min(1.8, pinch.z * pinch.d / Math.max(20, gap()))); return; }
    if (drag) { C3.az = drag.az - (e.clientX - drag.x) * .45; C3.el = Math.max(-60, Math.min(70, drag.el + (e.clientY - drag.y) * .35)); } });
  const up = e => { fingers.delete(e.pointerId); drag = null; if (fingers.size < 2) pinch = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => { e.preventDefault(); C3.zoom = Math.max(.45, Math.min(1.8, C3.zoom * (e.deltaY > 0 ? 1.08 : .93))); }, { passive: false });
  const effM = rig.muscles.find(m => m.e === 1), effBelly = th => { const pts = effM.pts.map(s => P(s, th)); return new T.CatmullRomCurve3(pts).getPointAt((effM.b[0] + effM.b[1]) / 2); };
  const v3 = new T.Vector3(), place = (k, p) => { const el = labels.querySelector(`[data-k="${k}"]`); if (!el) return; v3.copy(p).applyMatrix4(root.matrixWorld).project(cam); el.hidden = !C3.lever || v3.z > 1; spots.push({ el, x: (v3.x * .5 + .5) * labels.clientWidth, y: (-v3.y * .5 + .5) * labels.clientHeight }); }, spots = [];
  // Nudge tags apart when two land on top of each other (pivot and pulley sit close together).
  const lay = () => { spots.sort((a, b) => a.y - b.y); spots.forEach((s, i) => { for (let j = 0; j < i; j++) { const o = spots[j]; if (Math.abs(s.y - o.y) < 24 && s.x < o.x + o.el.offsetWidth && o.x < s.x + s.el.offsetWidth) s.y = o.y + 24; } s.el.style.transform = `translate(${s.x}px, ${s.y}px)`; }); spots.length = 0; };
  const frame = t => {
    if (!C3 || !host.isConnected) return c3Stop(); C3.raf = requestAnimationFrame(frame); if (!C3.visible) return;
    const [lo, hi] = rig.range;
    if (C3.play) { C3.th = lo + (hi - lo) * (.5 - .5 * Math.cos((t - C3.t0) / 1000 * .85)); slider.value = Math.round(C3.th); }
    const th = C3.th; q.setFromAxisAngle(axis, th * Math.PI / 180); dist.quaternion.copy(q);
    if (patMesh) patMesh.position.copy(P(["pat"], th));
    const lp = P(rig.load, th), la = armTo(lp, grav), e0 = P(rig.eline[0], th), e1 = P(rig.eline[1], th), ea = armTo(e1, e1.clone().sub(e0)), act = Math.min(1, la.arm / (size * .3));
    muscles.forEach(m => { m.mesh.geometry.dispose(); m.mesh.geometry = c3MuscleGeo(m.pts.map(s => P(s, th)), m.r, m.b, m.e ? otherC.clone().lerp(effortC, .45 + .55 * act) : otherC, tendon); });
    eArrow.position.copy(e1); eArrow.setDirection(e0.clone().sub(e1).normalize()); eArrow.setLength(6 + 9 * act, 2.4, 1.7);
    lArrow.position.copy(lp); lArrow.setDirection(grav); lArrow.setLength(9, 2.4, 1.7);
    eLine.geometry.setFromPoints([new T.Vector3(), ea.foot]); lLine.geometry.setFromPoints([new T.Vector3(), la.foot]);
    [ring, eArrow, lArrow, eLine, lLine].forEach(o => o.visible = C3.lever);
    const az = C3.az * Math.PI / 180, el = C3.el * Math.PI / 180, vf = cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * cam.aspect), d = C3.size * .5 / Math.sin(Math.min(vf, hf)) * .92 * C3.zoom;
    cam.position.set(target.x + d * Math.sin(az) * Math.cos(el), target.y + d * Math.sin(el), target.z + d * Math.cos(az) * Math.cos(el)); cam.lookAt(target);
    renderer.render(scene, cam); root.updateMatrixWorld();
    place("piv", new T.Vector3()); place("eff", effBelly(th)); place("load", lp); if (tags.pul) place("pul", P(rig.pulleyAt, th)); lay();
    const ratio = la.arm / Math.max(.3, ea.arm), txt = `${Math.round(th)}° ${rig.what}|${ea.arm.toFixed(1)}|${la.arm.toFixed(0)}|${ratio.toFixed(1)}`;
    if (txt !== C3.last) { C3.last = txt; read.innerHTML = `<span><b>${Math.round(th)}°</b> ${esc(rig.what)}</span><span><i class="dot g"></i>Muscle lever <b>${ea.arm.toFixed(1)} cm</b></span><span><i class="dot b"></i>Load lever <b>${la.arm.toFixed(0)} cm</b></span><p class="c3say">${la.arm < .8 ? "The weight sits right over the pivot here, so very little effort is needed." : `The ${esc(eName.toLowerCase())} ${/s$/.test(eName) ? "pull" : "pulls"} about <b>${ratio.toFixed(1)}×</b> the weight${ratio > 1 ? ", because the muscle's lever is shorter" : ""}.`}</p>`; }
  };
  C3.raf = requestAnimationFrame(frame);
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
const FIG_SPOTS = { neck: [[100, 64]], lumbar: [[100, 196]], shoulder: { R: [62, 96], L: [138, 96] }, elbow: { R: [48, 162], L: [152, 162] }, hip: { R: [82, 214], L: [118, 214] }, knee: { R: [84, 306], L: [116, 306] }, ankle: { R: [86, 388], L: [114, 388] } };
function figureSVG(key, side) {
  const sp = FIG_SPOTS[key], pts = Array.isArray(sp) ? sp : side ? [sp[side]] : [sp.R, sp.L];
  return `<svg viewBox="0 0 200 420" class="figsvg" role="img" aria-label="Body map: ${esc(JOINTS[key].name)}${side ? side === "L" ? ", left side" : ", right side" : ""}">
    <circle cx="100" cy="34" r="22" class="fig"/><path d="M88 56h24v12H88z" class="fig"/>
    <path d="M62 74q38-12 76 0l6 70q-2 34-8 66H64q-6-32-8-66z" class="fig"/>
    <path d="M62 80 46 164l-6 64M138 80l16 84 6 64" class="limb"/><path d="M80 210l4 96 2 92M120 210l-4 96-2 92" class="limb"/>
    ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" class="spotglow"/><circle cx="${x}" cy="${y}" r="7" class="spot"/>`).join("")}
    <text x="34" y="414" class="figlr">Right</text><text x="166" y="414" class="figlr">Left</text>
  </svg>`;
}
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
  const head = (k, h, sub) => `<div class="chead2"><span class="ckick">${esc(k)}</span><h2>${esc(h)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div>`;
  const S = [];
  S.push({ id: "cover", html: `<div class="ccover"><div class="cmark">${RP_MARK("rpmark")}</div><span class="ckick">${esc(db.settings.clinic || "MotionPlus Pro")}</span><h1>Your ${esc(J.name.toLowerCase())} today</h1><p>${fmt(today())} · ${esc(p.code)}</p><p class="cmuted">We'll look at what we measured, how your ${esc(J.name.toLowerCase())} works, and the plan to get you better.</p><span class="cswipe">Swipe to begin</span></div>` });
  if (items.length) S.push({ id: "results", html: `${head("What we measured", "Today's results", "Each circle shows where you are on that test. Fuller is better.")}<div class="cres">${items.map(x => `<div class="cresc ${x.band}">${ring(x.frac, x.val || "✓")}<div><b>${esc(x.name)}</b><span class="pill ${x.ch[1]}">${esc(x.ch[0])}</span><small>${esc(x.word)}</small></div></div>`).join("")}</div>` });
  if (charts.length) S.push({ id: "progress", html: `${head("Over time", "Your progress", "Each point is a visit.")}<div class="ccharts">${charts.join("")}</div>` });
  S.push({ id: "body", html: `<div class="csplit">${figureSVG(key, side)}<div>${head("Where", `${side ? side === "L" ? "Left " : "Right " : ""}${J.name.toLowerCase()}`, J.lever.story)}<div class="cjoints" role="group" aria-label="Choose the joint">${Object.entries(JOINTS).map(([k, j]) => `<button class="fchip" data-act="cJoint" data-k="${k}" aria-pressed="${k === key}">${esc(j.name)}</button>`).join("")}</div></div></div>` });
  S.push({ id: "model", html: `${head("How it works", `Inside your ${J.name.toLowerCase()}`, `${J.move}. Drag to turn it, pinch to zoom. The gold ring is the pivot.`)}<div class="c3" data-k="${key}"><div class="c3stage"><div class="c3labels"></div><p class="c3msg">Loading the 3D model…</p></div>
    <div class="c3ctl"><button class="ghost c3play" data-act="c3Play" aria-label="Play or pause the movement"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14l11-7z" class="pl"/><path d="M8 5h3v14H8zM13 5h3v14h-3z" class="pa"/></svg></button><input class="c3angle" type="range" min="${J.rig.range[0]}" max="${J.rig.range[1]}" value="${J.rig.start}" aria-label="Joint angle"><button class="ghost" data-act="c3Lever" aria-pressed="true">Lever lines</button></div><div class="c3read"></div></div>` });
  const L = J.lever, LC = LEVER_CLS[L.cls];
  S.push({ id: "lever", html: `${head("The mechanics", LC[0], LC[1])}<div class="lv"><div class="lvbox"></div><div class="lvread"></div>
    <label class="lvs"><span>Load closer</span><input class="lvload" type="range" min="0.6" max="1.4" step="0.05" value="1" aria-label="Move the load closer or further"><span>Further</span></label>
    ${L.pulley && L.pulley.gain > 1 ? `<div class="segc" role="group" aria-label="${esc(L.pulley.label)}"><button data-act="lvPul" data-v="1" aria-pressed="true">With ${esc(L.pulley.label.toLowerCase())}</button><button data-act="lvPul" data-v="0" aria-pressed="false">Without</button></div>` : ""}
    <dl class="lvkey"><div><dt class="k-f">Pivot</dt><dd>${esc(L.F)}</dd></div><div><dt class="k-e">Effort</dt><dd>${esc(L.E)}</dd></div><div><dt class="k-l">Load</dt><dd>${esc(L.L)}</dd></div></dl>
    ${L.pulley ? `<p class="cmuted">${esc(L.pulley.note)}</p>` : ""}</div>` });
  const flow = m => `<div class="cflow">${m.flow.map((s, i) => `<div class="cnode n${i}" style="--i:${i}"><small>${["What happened", "What it does", "What it affects", "What you feel"][i]}</small><b>${esc(s)}</b></div>`).join(`<span class="carrow" aria-hidden="true"></span>`)}</div>`;
  S.push({ id: "why", html: mech.length ? `${head("How it may have started", mech.length === 1 ? mech[0].h : "Possible ways this started", "A likely chain of events. Your history and examination confirm which fits.")}${mech.slice(0, 2).map(m => `${mech.length > 1 ? `<h3 class="cfh">${esc(m.h)}</h3>` : ""}${flow(m)}`).join("")}`
    : `${head("How it may have started", `Common ways the ${J.name.toLowerCase()} gets sore`, "Your therapist will talk you through which of these fits.")}<div class="cmechs">${J.mech.map(m => `<div class="cmech"><b>${esc(m.h)}</b><small>${esc(m.flow[0])} → ${esc(m.flow[3].toLowerCase())}</small></div>`).join("")}</div>` });
  if (why.length) S.push({ id: "factors", html: `${head("Putting it together", "What today's tests suggest", "Possibilities to work on, not a diagnosis.")}<div class="cfacts">${why.slice(0, 3).map(w => `<div class="cfact"><div class="cev">${w.why.slice(0, 3).map(e => `<span>${esc(e)}</span>`).join("")}</div><span class="carrow" aria-hidden="true"></span><b>${esc(w.h)}</b></div>`).join("")}</div>` });
  if (goals.length) S.push({ id: "goals", html: `${head("Where we're heading", "Your goals")}<div class="cgoals">${goals.slice(0, 4).map(g => { const pr = goalProgress(p.id, g); return `<div class="cgoal"><b>${esc(g.text)}</b>${g.tid ? `<div class="lbar"><i style="--w:${Math.round(100 * Math.max(.04, pr.pct))}%"></i></div>` : ""}<small>By ${fmt(g.by)}</small></div>`; }).join("")}</div>` });
  S.push({ id: "plan", html: `${head("The plan", "Your rehab plan", `Four stages. We are in stage ${(plan.now || 0) + 1}.`)}<ol class="cplan">${plan.phases.map((ph, i) => `<li class="${i === (plan.now || 0) ? "cp-now" : i < (plan.now || 0) ? "cp-done" : ""}" style="--i:${i}"><span class="cpn">${i + 1}</span><div><small>${esc(ph.wk)}</small><b>${esc(ph.h)}</b><ul>${ph.items.filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></li>`).join("")}</ol>` });
  S.push({ id: "next", html: `<div class="ccover">${head("Next", "Questions?", "Take a moment to ask anything. Then we'll print or send your report.")}<div class="cnext"><button class="primary" data-act="pdfPatient" data-id="${p.id}">PDF report</button><button data-act="explain" data-pid="${p.id}">Send a summary to the patient</button><button data-act="cEdit">Edit the plan</button><button class="ghost" data-act="cExit">Close</button></div></div>` });
  return S;
}
function consultLeave() {
  c3Stop(); if (LV) { cancelAnimationFrame(LV.raf); LV = null; } document.body.classList.remove("consult");
  if (CS.fs && document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); CS.fs = false;
}
VIEWS.consult = pid => {
  const p = P(pid); if (!p) return go("today");
  CS.pid = pid; const key = CS.joint || jointFor(p), slides = consultSlides(p); CS.i = Math.min(CS.i, slides.length - 1);
  document.body.classList.add("consult"); chrome(null, "");
  $("#app").innerHTML = `<div class="cdeck">
    <div class="ctop"><button class="cx" data-act="cExit" aria-label="Close the consultation room">✕</button><span class="grow ctitle">${esc(p.code)} · Consultation room</span><button class="ghost" data-act="cEdit">Edit plan</button></div>
    <div class="ctrack" id="ctrack" tabindex="0" aria-roledescription="slides">${slides.map((s, i) => `<section class="cslide s-${s.id}" aria-label="Slide ${i + 1} of ${slides.length}" data-id="${s.id}"><div class="cin">${s.html}</div></section>`).join("")}</div>
    <div class="cfoot"><button class="cnav" data-act="cNav" data-v="-1" aria-label="Previous slide">‹</button><div class="cdots">${slides.map((s, i) => `<button data-act="cDot" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join("")}</div><button class="cnav" data-act="cNav" data-v="1" aria-label="Next slide">›</button></div>
  </div>`;
  const tr = $("#ctrack"), model = tr.querySelector(".c3"), lever = tr.querySelector(".s-lever");
  const sync = () => { const i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); if (i === CS.shown) return; CS.shown = i; CS.i = i;
    tr.querySelectorAll(".cslide").forEach((s, j) => s.classList.toggle("on", j === i)); $$(".cdots button").forEach((b, j) => b.setAttribute("aria-current", j === i ? "step" : "false"));
    const id = slides[i].id;
    if (id === "model") { if (!C3 || C3.host !== model || C3.key !== key) c3Start(model, key); else C3.visible = true; } else if (C3) C3.visible = false;
    if (id === "lever") { if (!LV || LV.host !== lever) leverStart(lever, key); else LV.visible = true; } else if (LV) LV.visible = false; };
  CS.shown = -1; tr.addEventListener("scroll", () => { clearTimeout(sync.t); sync.t = setTimeout(sync, 60); }, { passive: true });
  model.querySelector(".c3angle").addEventListener("input", e => { if (C3) { C3.play = false; C3.th = +e.target.value; } });
  lever.querySelector(".lvload").addEventListener("input", e => { if (LV) LV.s = +e.target.value; });
  requestAnimationFrame(() => { tr.scrollLeft = CS.i * tr.clientWidth; sync(); });
};
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
  cJoint: d => { CS.joint = d.k; c3Stop(); render(); },
  c3Play: (d, b) => { if (C3) { b.classList.toggle("paused", C3.play); C3.play = !C3.play; C3.t0 = performance.now() - Math.acos(Math.max(-1, Math.min(1, 1 - 2 * (C3.th - C3.rig.range[0]) / (C3.rig.range[1] - C3.rig.range[0])))) / .85 * 1000; } },
  c3Lever: (d, b) => { if (C3) { C3.lever = !C3.lever; b.setAttribute("aria-pressed", C3.lever); } },
  lvPul: (d, b) => { if (!LV) return; LV.pul = d.v === "1"; b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); hz("tap"); },
  cEdit: () => { cpDraft = null; go("cplan", CS.pid); },
  cpJoint: d => { cpSync(); const p = P(view.args[0]); CS.joint = d.k; const fresh = rehabOf({ ...p, rehab: null }, d.k); cpDraft = d.k === p.rehab?.joint ? JSON.parse(JSON.stringify(p.rehab)) : fresh; render(); },
  cpMech: d => { cpSync(); const m = cpDraft.mech; cpDraft.mech = m.includes(d.id) ? m.filter(x => x !== d.id) : [...m, d.id]; render(); },
  cpNow: d => { cpSync(); cpDraft.now = +d.i; render(); },
  cpReset: () => { const p = P(view.args[0]); cpDraft = rehabOf({ ...p, rehab: null }, cpDraft.joint); render(); toast("Suggested plan restored. Save to keep it."); },
  cpSave: () => { cpSync(); const p = P(view.args[0]); p.rehab = { ...cpDraft, updated: today() }; CS.joint = cpDraft.joint; cpDraft = null; save(); navNext = "back"; go("consult", p.id); celebrate("Plan saved"); },
  cpBack: () => { cpDraft = null; navNext = "back"; go("consult", view.args[0]); },
};
