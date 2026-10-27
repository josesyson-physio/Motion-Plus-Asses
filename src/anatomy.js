/* ---------- Real anatomy: BodyParts3D bones and muscles, with the soft tissues drawn around them ----------
   Each joint pack (assets/anatomy/<joint>-<v>.bin) holds the right-side meshes in millimetres, centred on the joint,
   in three.js axes (x to the patient's left, y up, z to the front), plus landmarks for placing the soft tissues.
   BodyParts3D, © The Database Center for Life Science, CC BY 4.0. */
const ANAT_CREDIT = "3D anatomy: BodyParts3D, © The Database Center for Life Science (CC BY 4.0)";
const ANAT_LAYERS = [["fascia", "Fascia"], ["muscle", "Muscle"], ["lig", "Ligament"], ["cart", "Cartilage"], ["bone", "Bone"], ["nerve", "Nerve"]];
const ANAT_COL = { bone: 0xd9c7a3, muscle: 0x8e241b, tendon: 0xeee6d6, cart: 0x8fcbea, lig: 0xd9d2ec, bursa: 0xf3a9b8, nerve: 0xf2c94c, fascia: 0xf4efe8, disc: 0x7fb4d6 };
const ANAT = {
  shoulder: { file: "shoulder-1", view: [-28, 12], dist: 560, at: [12, -30, 0],
    // Explode directions: m = toward the middle of the body, l = away from it, a = front, p = back, u = up, d = down.
    parts: { scapula: ["Scapula", "bone", { m: 70 }], clavicle: ["Clavicle", "bone", { m: 50, u: 70 }], humerus: ["Humerus", "bone", { l: 70, d: 14 }],
      headCart: ["Articular cartilage", "cart", { l: 40, d: 8 }], glenCart: ["Glenoid cartilage", "cart", { m: 14 }], capsule: ["Joint capsule", "lig", { m: 50, d: 6, p: 10 }],
      subscapularis: ["Subscapularis", "muscle", { a: 80, m: 30 }], supraspinatus: ["Supraspinatus", "muscle", { u: 70, m: 16 }], infraspinatus: ["Infraspinatus", "muscle", { p: 80, m: 24 }],
      teresminor: ["Teres minor", "muscle", { p: 76, d: 30 }], deltoid: ["Deltoid", "muscle", { l: 130, a: 50, u: 10 }],
      labrum: ["Glenoid labrum", "lig", { m: 30 }], bursa: ["Subacromial bursa", "bursa", { u: 100, l: 20 }], biceps: ["Biceps tendon (long head)", "tendon", { a: 34, l: 10 }],
      axNerve: ["Axillary nerve", "nerve", { d: 30, p: 10 }], ssNerve: ["Suprascapular nerve", "nerve", { u: 20, m: 20 }] },
    // What to light up for each possible mechanism.
    problem: { cuff: ["supraspinatus", "bursa"], frozen: ["capsule"], rigid: ["capsule", "glenCart"], disloc: ["labrum", "capsule"], tear: ["supraspinatus"] } },
  knee: { file: "knee-1", view: [-30, 10], dist: 620, at: [0, 0, 0],
    parts: { femur: ["Femur", "bone", { u: 80 }], tibia: ["Tibia", "bone", { d: 70 }], fibula: ["Fibula", "bone", { d: 70, l: 40 }], patella: ["Kneecap", "bone", { a: 90, u: 10 }],
      femCart: ["Cartilage", "cart", { u: 40 }], tibCart: ["Cartilage", "cart", { d: 28 }], patCart: ["Kneecap cartilage", "cart", { a: 62, u: 10 }],
      quadriceps: ["Quadriceps", "muscle", { a: 90, u: 60 }], hamstrings: ["Hamstrings", "muscle", { p: 100, u: 50 }], gastroc: ["Calf (gastrocnemius)", "muscle", { p: 100, d: 60 }], popliteus: ["Popliteus", "muscle", { p: 60, d: 20 }],
      acl: ["ACL", "lig", { a: 8 }], pcl: ["PCL", "lig", { p: 8 }], mcl: ["MCL", "lig", { m: 50 }], lcl: ["LCL", "lig", { l: 60 }], patTendon: ["Patellar tendon", "tendon", { a: 70, d: 10 }],
      medMen: ["Medial meniscus", "cart", { m: 18, d: 10 }], latMen: ["Lateral meniscus", "cart", { l: 18, d: 10 }],
      peroneal: ["Peroneal nerve", "nerve", { l: 60, p: 30 }], tibialN: ["Tibial nerve", "nerve", { p: 70 }], prepat: ["Prepatellar bursa", "bursa", { a: 130 }] },
    problem: { acl: ["acl"], meniscus: ["medMen"], pfp: ["patCart", "femCart"], oa: ["femCart", "tibCart", "medMen"], tendon: ["patTendon"] } },
  hip: { file: "hip-1", view: [-35, 8], dist: 620, at: [10, 10, 0],
    parts: { pelvis: ["Pelvis", "bone", { m: 70, u: 20 }], sacrum: ["Sacrum", "bone", { m: 110, u: 30 }], femur: ["Femur", "bone", { l: 70, d: 40 }],
      headCart: ["Cartilage", "cart", { l: 40, d: 20 }], acetCart: ["Socket cartilage", "cart", { m: 20 }], capsule: ["Joint capsule", "lig", { m: 6, d: 4 }], labrum: ["Labrum", "lig", { m: 34 }],
      gmed: ["Gluteus medius", "muscle", { l: 60, u: 70 }], gmin: ["Gluteus minimus", "muscle", { l: 40, u: 40 }], gmax: ["Gluteus maximus", "muscle", { p: 110 }],
      iliopsoas: ["Iliopsoas", "muscle", { a: 100, m: 30 }], piriformis: ["Piriformis", "muscle", { p: 70, d: 10 }],
      sciatic: ["Sciatic nerve", "nerve", { p: 90 }], troch: ["Trochanteric bursa", "bursa", { l: 110 }] },
    problem: { oa: ["headCart", "acetCart"], glut: ["gmed", "troch"], fai: ["labrum", "headCart"], fall: ["femur"] } },
  ankle: { file: "ankle-1", view: [-50, 10], dist: 720, at: [0, -10, 20],
    parts: { tibia: ["Tibia", "bone", { u: 70 }], fibula: ["Fibula", "bone", { u: 60, l: 50 }], talus: ["Talus", "bone", {}], calcaneus: ["Heel bone", "bone", { d: 50, p: 30 }], foot: ["Foot bones", "bone", { a: 70, d: 20 }],
      dome: ["Cartilage", "cart", { u: 18 }], plafond: ["Cartilage", "cart", { u: 45 }], achilles: ["Achilles tendon", "tendon", { p: 90 }], plantarLig: ["Long plantar ligament", "lig", { d: 60 }],
      calf: ["Calf muscles", "muscle", { p: 130, u: 40 }], tibAnt: ["Tibialis anterior", "muscle", { a: 100, u: 30 }], peroneals: ["Peroneal muscles", "muscle", { l: 110, u: 20 }], tibPost: ["Tibialis posterior", "muscle", { m: 90, u: 20, p: 20 }],
      atfl: ["ATFL", "lig", { l: 30, a: 10 }], cfl: ["CFL", "lig", { l: 36, d: 10 }], deltoid: ["Deltoid ligament", "lig", { m: 34 }], deltoidA: ["Deltoid ligament", "lig", { m: 34 }],
      fascia: ["Plantar fascia", "lig", { d: 80 }], tibialN: ["Tibial nerve", "nerve", { m: 60, p: 20 }] },
    problem: { sprain: ["atfl", "cfl"], achilles: ["achilles"], plantar: ["fascia"], fracture: ["fibula"] } },
  elbow: { file: "elbow-1", view: [-20, 8], dist: 700, at: [0, 0, 0],
    parts: { humerus: ["Humerus", "bone", { u: 70 }], ulna: ["Ulna", "bone", { d: 60, m: 20 }], radius: ["Radius", "bone", { d: 60, l: 30 }],
      humCart: ["Cartilage", "cart", { u: 30 }], ulnCart: ["Cartilage", "cart", { d: 26, m: 10 }], radCart: ["Cartilage", "cart", { d: 26, l: 14 }],
      biceps: ["Biceps", "muscle", { a: 90, u: 40 }], triceps: ["Triceps", "muscle", { p: 100, u: 40 }], extensors: ["Wrist extensors", "muscle", { l: 100, d: 30 }], flexors: ["Wrist flexors", "muscle", { m: 100, d: 30 }], supinator: ["Supinator", "muscle", { l: 60, a: 30, d: 20 }],
      ucl: ["Ulnar collateral ligament", "lig", { m: 40 }], lclE: ["Lateral ligament", "lig", { l: 46 }], annular: ["Annular ligament", "lig", { l: 30, d: 30 }],
      ulnarN: ["Ulnar nerve", "nerve", { m: 70, p: 20 }], radialN: ["Radial nerve", "nerve", { l: 70, a: 20 }] },
    problem: { tennis: ["extensors", "lclE"], golfer: ["flexors", "ucl"], fall: ["radius", "radCart"] } },
  lumbar: { file: "lumbar-1", view: [-130, 8], dist: 720, at: [0, -10, 10], spine: true,
    parts: { t12: ["T12", "bone", { u: 100 }], l1: ["L1", "bone", { u: 70 }], l2: ["L2", "bone", { u: 40 }], l3: ["L3", "bone", { u: 10 }], l4: ["L4", "bone", { d: 20 }], l5: ["L5", "bone", { d: 50 }],
      sacrum: ["Sacrum", "bone", { d: 90 }], pelvisR: ["Pelvis", "bone", { d: 90, l: 70 }], pelvisL: ["Pelvis", "bone", { d: 90, m: 70 }],
      d12: ["Disc", "disc", { u: 85, a: 40 }], d1: ["Disc", "disc", { u: 55, a: 40 }], d2: ["Disc", "disc", { u: 25, a: 40 }], d3: ["Disc", "disc", { d: 5, a: 40 }], d4: ["L4–L5 disc", "disc", { d: 35, a: 40 }], d5: ["L5–S1 disc", "disc", { d: 70, a: 40 }],
      erector: ["Back muscles", "muscle", { p: 130 }], psoas: ["Psoas", "muscle", { a: 120 }], cauda: ["Spinal nerves", "nerve", { p: 30 }],
      rootL3R: ["Nerve root", "nerve", { p: 30, l: 20 }], rootL3L: ["Nerve root", "nerve", { p: 30, m: 20 }], rootL4R: ["L4 nerve root", "nerve", { p: 30, l: 20, d: 20 }], rootL4L: ["Nerve root", "nerve", { p: 30, m: 20, d: 20 }],
      rootL5R: ["L5 nerve root", "nerve", { p: 30, l: 20, d: 50 }], rootL5L: ["Nerve root", "nerve", { p: 30, m: 20, d: 50 }], facetR: ["Facet joint", "lig", { p: 60, l: 20, d: 30 }], facetL: ["Facet joint", "lig", { p: 60, m: 20, d: 30 }] },
    problem: { disc: ["d4", "rootL4R"], strain: ["erector"], facet: ["facetR", "facetL"], posture: ["erector", "d4", "d5"] } },
  neck: { file: "neck-1", view: [-40, 6], dist: 620, at: [0, 10, 0], spine: true,
    parts: { occiput: ["Skull base", "bone", { u: 110 }], c1: ["C1", "bone", { u: 85 }], c2: ["C2", "bone", { u: 62 }], c3: ["C3", "bone", { u: 40 }], c4: ["C4", "bone", { u: 18 }], c5: ["C5", "bone", {}], c6: ["C6", "bone", { d: 20 }], c7: ["C7", "bone", { d: 42 }], t1: ["T1", "bone", { d: 66 }],
      d2: ["Disc", "disc", { u: 52, a: 34 }], d3: ["Disc", "disc", { u: 30, a: 34 }], d4: ["Disc", "disc", { u: 8, a: 34 }], d5: ["C5–C6 disc", "disc", { d: 10, a: 34 }], d6: ["C6–C7 disc", "disc", { d: 32, a: 34 }], d7: ["Disc", "disc", { d: 54, a: 34 }], dT1: ["Disc", "disc", { d: 76, a: 34 }],
      scm: ["Sternocleidomastoid", "muscle", { a: 110 }], levator: ["Levator scapulae", "muscle", { p: 60, d: 30 }], deepNeck: ["Deep neck muscles", "muscle", { p: 110 }], trapezius: ["Trapezius", "muscle", { p: 150, d: 20 }],
      cord: ["Spinal cord", "nerve", { p: 24 }], rootC5R: ["Nerve root", "nerve", { p: 20, l: 30 }], rootC5L: ["Nerve root", "nerve", { p: 20, m: 30 }], rootC6R: ["C6 nerve root", "nerve", { p: 20, l: 30, d: 20 }], rootC6L: ["Nerve root", "nerve", { p: 20, m: 30, d: 20 }],
      rootC7R: ["Nerve root", "nerve", { p: 20, l: 30, d: 40 }], rootC7L: ["Nerve root", "nerve", { p: 20, m: 30, d: 40 }] },
    problem: { fhp: ["deepNeck", "levator"], whiplash: ["deepNeck", "scm", "d5"], nerve: ["d6", "rootC6R"] } },
};
const ANAT_CACHE = {};
async function anatLoad(key) {
  if (ANAT_CACHE[key]) return ANAT_CACHE[key];
  const buf = await (await fetch(`assets/anatomy/${ANAT[key].file}.bin`)).arrayBuffer(), dv = new DataView(buf);
  if (new TextDecoder().decode(new Uint8Array(buf, 0, 4)) !== "MPA1") throw new Error("Bad anatomy pack");
  const n = dv.getUint32(4, true), head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, n))), base = 8 + n;
  const parts = head.parts.map(p => { const at = base + p.off, q = new Int16Array(buf, at, p.v * 3), pos = new Float32Array(p.v * 3); for (let i = 0; i < pos.length; i++) pos[i] = q[i] * .01;
    const ia = at + p.v * 6, idx = p.v < 65536 ? new Uint16Array(buf, ia, p.i) : new Uint32Array(buf, ia, p.i); return { ...p, pos, idx }; });
  return (ANAT_CACHE[key] = { land: head.land, lines: head.lines || {}, blobs: head.blobs || {}, parts });
}

let AN = null;
function anatStop() { if (!AN) return; cancelAnimationFrame(AN.raf); AN.ro?.disconnect(); try { AN.renderer.dispose(); AN.renderer.forceContextLoss?.(); } catch (e) {} AN.renderer.domElement.remove(); AN = null; }
async function anatStart(host, key, o = {}) {
  anatStop(); const stage = host.querySelector(".anstage"), out = host.querySelector(".c3msg");
  try { await need("three"); } catch (e) { out.textContent = "The 3D model needs an internet connection the first time it opens."; return; }
  let data; try { data = await anatLoad(key); } catch (e) { out.textContent = "The 3D anatomy could not load."; return; }
  if (!host.isConnected) return;
  const T = THREE, cfg = ANAT[key]; let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { out.textContent = "This device can't show 3D."; return; }
  out.textContent = ""; renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95; stage.prepend(renderer.domElement);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 5, 5000);
  scene.add(new T.HemisphereLight(0xfff4e6, 0x1a2030, .45));
  const key1 = new T.DirectionalLight(0xfff1df, 1.15); key1.position.set(-120, 220, 260); scene.add(key1);
  const fill = new T.DirectionalLight(0xbfd8ff, .45); fill.position.set(220, 40, 120); scene.add(fill);
  const rim = new T.DirectionalLight(0x8fc4ff, 1.1); rim.position.set(60, 120, -300); scene.add(rim);
  const root = new T.Group(); scene.add(root); if (o.side === "L") root.scale.x = -1;
  // Directions in the right-side pack: the body's middle is +x.
  const dir = { m: [1, 0, 0], l: [-1, 0, 0], a: [0, 0, 1], p: [0, 0, -1], u: [0, 1, 0], d: [0, -1, 0] };
  const offOf = e => Object.entries(e || {}).reduce((v, [k, s]) => v.add(new T.Vector3(...dir[k]).multiplyScalar(s)), new T.Vector3());
  const mat = (kind, extra = {}) => {
    const c = ANAT_COL[kind] ?? ANAT_COL.bone, base = { color: c, roughness: kind === "bone" ? .66 : kind === "muscle" ? .48 : .32, metalness: 0, ...extra };
    if (kind === "cart" || kind === "disc") Object.assign(base, { transparent: true, opacity: .88, roughness: .18 });
    if (kind === "lig" || kind === "bursa") Object.assign(base, { transparent: true, opacity: kind === "bursa" ? .82 : .62, roughness: .3, side: T.DoubleSide, depthWrite: false });
    if (kind === "fascia") Object.assign(base, { transparent: true, opacity: .22, roughness: .2, depthWrite: false });
    if (kind === "nerve") Object.assign(base, { emissive: 0x5a4300, roughness: .35 });
    return new T.MeshStandardMaterial(base);
  };
  // Soft-tissue builders, in the pack's millimetres.
  const L = { ...data.land, v: a => new T.Vector3(...a),
    blob: (c, s) => { const g = new T.SphereGeometry(1, 40, 24); g.scale(...s); g.translate(c.x, c.y, c.z); return g; },
    tube: (pts, r, closed) => new T.TubeGeometry(new T.CatmullRomCurve3(pts, !!closed), closed ? 128 : 64, r, 12, !!closed) };
  const parts = [];
  const add = (id, name, kind, geo, ex) => { const m = new T.Mesh(geo, mat(kind)), g = new T.Group(); g.add(m); root.add(g); geo.computeBoundingBox();
    parts.push({ id, name, kind, layer: { tendon: "muscle", bursa: "lig", disc: "cart" }[kind] || kind, g, m, off: offOf(ex), c: geo.boundingBox.getCenter(new T.Vector3()) }); return m; };
  for (const p of data.parts) {
    const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(p.pos, 3)); geo.setIndex(new T.BufferAttribute(p.idx, 1)); geo.computeVertexNormals();
    const [name, kind, ex] = cfg.parts[p.id] || [p.id, p.kind, {}]; add(p.id, name, kind, geo, ex);
    if (kind === "muscle") { const f = geo.clone(), pos = f.attributes.position, nor = f.attributes.normal; for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) + nor.getX(i) * .9, pos.getY(i) + nor.getY(i) * .9, pos.getZ(i) + nor.getZ(i) * .9);
      add(p.id + "F", name + " fascia", "fascia", f, ex); }
  }
  for (const [id, l] of Object.entries(data.lines)) { const [name, kind, ex] = cfg.parts[id] || [id, "lig", {}]; add(id, name, kind, L.tube(l.p.map(L.v), l.r, l.c), ex); }
  for (const [id, b] of Object.entries(data.blobs)) { const [name, kind, ex] = cfg.parts[id] || [id, "bursa", {}]; add(id, name, kind, L.blob(L.v(b.c), b.s), ex); }
  const hot = new Set(o.problem || []);
  for (const p of parts) if (hot.has(p.id)) { p.m.material = p.m.material.clone(); p.m.material.color.set(0xff5f4c); p.m.material.emissive = new T.Color(0xff3a26); p.hot = true; }
  const center = new T.Vector3(...(cfg.at || [0, 0, 0]));
  AN = { renderer, scene, cam, host, key, parts, root, az: cfg.view[0], el: cfg.view[1], zoom: 1, zoomTo: 1, ex: 0, exTo: o.explode ? 1 : 0, focus: false, hot: hot.size, layers: new Set(ANAT_DEFAULT), spin: true, raf: 0, visible: true, t0: performance.now(),
    name: o.name || cfg.name || key, hotNames: [...new Set(parts.filter(p => p.hot).map(p => p.name))] };
  anatSync(); if (o.story !== false) anatStory();
  const stageEl = stage, labels = host.querySelector(".anlabels");
  const resize = () => { const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  AN.ro = new ResizeObserver(resize); AN.ro.observe(stageEl); resize();
  const cv = renderer.domElement, fingers = new Map(); let drag = null, pinch = null;
  const gap = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  cv.addEventListener("pointerdown", e => { AN.spin = false; anatStory(false); fingers.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId);
    if (fingers.size === 2) { drag = null; pinch = { d: gap(), z: AN.zoom }; } else drag = { x: e.clientX, y: e.clientY, az: AN.az, el: AN.el }; });
  cv.addEventListener("pointermove", e => { if (!AN || !fingers.has(e.pointerId)) return; fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && fingers.size === 2) { AN.zoom = AN.zoomTo = Math.max(.35, Math.min(1.8, pinch.z * pinch.d / Math.max(20, gap()))); return; }
    if (drag) { AN.az = drag.az - (e.clientX - drag.x) * .45; AN.el = Math.max(-70, Math.min(80, drag.el + (e.clientY - drag.y) * .35)); } });
  const up = e => { fingers.delete(e.pointerId); drag = null; if (fingers.size < 2) pinch = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => { e.preventDefault(); anatStory(false); AN.zoom = AN.zoomTo = Math.max(.35, Math.min(1.8, AN.zoom * (e.deltaY > 0 ? 1.08 : .93))); }, { passive: false });
  labels.innerHTML = parts.filter(p => p.kind !== "fascia").map((p, i) => `<span class="antag ${p.hot ? "hot" : ""}" data-i="${parts.indexOf(p)}">${esc(p.name)}</span>`).join("");
  const halo = new T.Mesh(new T.SphereGeometry(1, 32, 20), new T.MeshBasicMaterial({ color: 0xff6a55, transparent: true, opacity: .25, depthWrite: false, blending: T.AdditiveBlending }));
  const hotParts = parts.filter(p => p.hot); if (hotParts.length) root.add(halo);
  const spots = [], v3 = new T.Vector3(), smooth = (a, b, k) => a + (b - a) * k;
  const frame = t => {
    if (!AN || !host.isConnected) return anatStop(); AN.raf = requestAnimationFrame(frame); if (!AN.visible) return;
    const s = (t - AN.t0) / 1000, dt = Math.min(.25, (t - (AN.tl || t)) / 1000), k = 1 - Math.exp(-dt * 7); AN.tl = t; if (AN.spin) AN.az += 6 * dt;
    if (AN.story) anatStep(s - AN.story);
    AN.zoom = Math.abs(AN.zoom - AN.zoomTo) < .002 ? AN.zoomTo : smooth(AN.zoom, AN.zoomTo, k * .6);
    AN.ex = Math.abs(AN.ex - AN.exTo) < .002 ? AN.exTo : smooth(AN.ex, AN.exTo, k * .55); const e = AN.ex * AN.ex * (3 - 2 * AN.ex);
    const pulse = .5 + .5 * Math.sin(s * 3.2);
    for (const p of parts) {
      p.g.position.copy(p.off).multiplyScalar(e);
      const on = AN.layers.has(p.layer), m = p.m.material, dim = AN.focus && hot.size && !p.hot; p.g.visible = on || m.opacity > .02;
      if (p.hot) m.emissiveIntensity = .25 + .55 * pulse;
      const want = !on ? 0 : dim ? (p.kind === "bone" ? .32 : .14) : p.hot ? .92 : p.kind === "cart" ? .88 : p.kind === "lig" ? .62 : p.kind === "bursa" ? .82 : p.kind === "fascia" ? .22 : 1;
      if (m.opacity !== want) { m.opacity = Math.abs(m.opacity - want) < .01 ? want : smooth(m.opacity, want, k); m.transparent = m.opacity < 1; m.depthWrite = m.opacity === 1 || (p.kind === "cart" && m.opacity > .8); }
    }
    if (hotParts.length) { halo.visible = AN.ex < .3; const c = new T.Vector3(); hotParts.forEach(p => c.add(p.c.clone().add(p.g.position))); c.divideScalar(hotParts.length); halo.position.copy(c); halo.scale.setScalar(10 + 9 * pulse); halo.material.opacity = .05 + .12 * (1 - pulse); }
    const az = AN.az * Math.PI / 180, el = AN.el * Math.PI / 180, d = cfg.dist * AN.zoom * (1 + .12 * e);
    cam.position.set(center.x + d * Math.sin(az) * Math.cos(el), center.y + d * Math.sin(el), center.z + d * Math.cos(az) * Math.cos(el)); cam.lookAt(center);
    renderer.render(scene, cam); root.updateMatrixWorld();
    const W = labels.clientWidth, H = labels.clientHeight, show = AN.ex > .5 || AN.focus;
    for (const el2 of labels.children) { const p = parts[+el2.dataset.i], vis = show && p.g.visible && (AN.ex > .5 || p.hot) && !(AN.focus && !p.hot && AN.ex < .5);
      el2.hidden = !vis; if (!vis) continue; v3.copy(p.c).applyMatrix4(p.g.matrixWorld).project(cam); spots.push({ el: el2, x: (v3.x * .5 + .5) * W, y: (-v3.y * .5 + .5) * H }); }
    spots.sort((a, b) => a.y - b.y); spots.forEach((s, i) => { for (let j = 0; j < i; j++) { const q = spots[j]; if (Math.abs(s.y - q.y) < 22 && s.x < q.x + q.el.offsetWidth && q.x < s.x + s.el.offsetWidth) s.y = q.y + 22; } s.el.style.transform = `translate(${s.x}px, ${s.y}px)`; }); spots.length = 0;
  };
  AN.raf = requestAnimationFrame(frame);
}
const ANAT_DEFAULT = ["muscle", "lig", "cart", "bone", "nerve"];
// Buttons under the model follow the viewer's state.
function anatSync() {
  if (!AN) return; const h = AN.host;
  h.querySelectorAll("[data-act=anLayer]").forEach(b => b.setAttribute("aria-pressed", AN.layers.has(b.dataset.l)));
  h.querySelector("[data-act=anEx]")?.setAttribute("aria-pressed", AN.exTo === 1);
  h.querySelector("[data-act=anFocus]")?.setAttribute("aria-pressed", AN.focus);
  h.querySelector("[data-act=anStory]")?.setAttribute("aria-pressed", !!AN.story);
}
function anatCap(txt) { const c = AN?.host.querySelector(".ancap"); if (!c) return; if (c.dataset.t === (txt || "")) return; c.dataset.t = txt || ""; c.classList.remove("in"); if (txt) { c.textContent = txt; void c.offsetWidth; c.classList.add("in"); } }
// The guided tour: the whole joint, then under the muscles, then the problem glowing, then every part pulled apart.
function anatStory(on = true) {
  if (!AN) return; if (!on) { if (AN.story) { AN.story = 0; AN.stage = -1; anatCap(""); anatSync(); } return; }
  AN.story = (performance.now() - AN.t0) / 1000; AN.stage = -1; AN.spin = true; anatSync();
}
function anatStep(t) {
  const stops = [0, 2.8, 5.8, AN.hot ? 10 : 5.8, 14, 17.5], st = stops.findLastIndex(x => t >= x); if (st === AN.stage) return; AN.stage = st;
  const J = AN.name;
  if (st === 0) { AN.layers = new Set(ANAT_DEFAULT); AN.focus = false; AN.exTo = 0; AN.zoomTo = 1; anatCap(J); }
  if (st === 1) { AN.layers.delete("muscle"); anatCap("Under the muscles"); }
  if (st === 2 && AN.hot) { AN.focus = true; AN.zoomTo = .72; anatCap(AN.hotNames.join(" + ")); hz("tap"); }
  if (st === 3) { AN.focus = false; AN.layers = new Set(ANAT_DEFAULT); AN.exTo = 1; AN.zoomTo = 1; anatCap("Every part"); }
  if (st === 4) { AN.exTo = 0; AN.focus = !!AN.hot; anatCap(AN.hot ? AN.hotNames.join(" + ") : J); }
  if (st === 5) { AN.story = 0; AN.toured = true; anatCap(""); }
  anatSync();
}
const ANAT_ACT = {
  anLayer: d => { if (!AN) return; anatStory(false); AN.layers.has(d.l) ? AN.layers.delete(d.l) : AN.layers.add(d.l); anatSync(); hz("tap"); },
  anEx: () => { if (!AN) return; anatStory(false); AN.exTo = AN.exTo ? 0 : 1; anatSync(); hz("tap"); },
  anFocus: () => { if (!AN || !AN.hot) return; anatStory(false); AN.focus = !AN.focus; AN.zoomTo = AN.focus ? .75 : 1; anatSync(); hz("tap"); },
  anStory: () => { if (!AN) return; AN.story ? anatStory(false) : anatStory(); },
};
