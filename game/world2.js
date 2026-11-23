// Новые локации после дела в поезде: Безвременный вокзал и пароход «Святая Марфа» (1926).
// Геометрия строится кодом. Локации стоят далеко от поезда по оси X (вокзал x≈300, пароход x≈600),
// поэтому поезд можно просто спрятать. Палубы парохода — уровни P.lv (−1, 0, 1) с высотой пола P.fy.
(function () {
  const SX = 300, BX = 600;
  const DY = { '-1': -2.4, '0': 0, '1': 2.6 };
  window.WORLD = { cur: 'train' };
  const LOC = {}; WORLD.LOC = LOC;
  let saved = null;

  // ---------- материалы и текстуры ----------
  const lin = c => new THREE.Color(c).convertSRGBToLinear();
  const MC = {};
  function M(color, o) {
    o = o || {}; const key = color + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
    if (MC[key]) return MC[key];
    const m = new THREE.MeshStandardMaterial({ color: lin(color), roughness: o.r ?? .8, metalness: o.m ?? 0, transparent: !!o.op, opacity: o.op ?? 1 });
    if (o.e) { m.emissive = lin(o.e); m.emissiveIntensity = o.ei ?? 1; }
    if (o.map) m.map = o.map;
    if (o.side) m.side = THREE.DoubleSide;
    return (MC[key] = m);
  }
  function canvasTex(w, h, draw, rx, ry) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); }
    return t;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  // ---------- текстуры из файлов (1024 px: цвет, нормали, шероховатость) ----------
  const TL = new THREE.TextureLoader(), TXC = {};
  function tex(file, color) {
    if (TXC[file]) return TXC[file];
    const t = TL.load('tex/' + file); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (color) t.encoding = THREE.sRGBEncoding;
    return (TXC[file] = t);
  }
  const HAS_R = { stone: 1, deck: 1, deckdark: 1, panel: 1, cabin: 1, damask: 1, plaster: 1, iron: 1, hullwhite: 1, hullred: 1 };
  // материал с текстурой; tile — сколько метров занимает одна текстура (UV пересчитываются по мировым координатам)
  function MT(name, tile, o) {
    o = o || {}; const key = 'T' + name + tile + JSON.stringify(o);
    if (MC[key]) return MC[key];
    const m = new THREE.MeshStandardMaterial({ map: tex(name + '.jpg', true), normalMap: tex(name + '_n.jpg'), roughness: o.r ?? 1, metalness: o.m ?? 0, color: lin(o.c || '#ffffff') });
    if (HAS_R[name]) m.roughnessMap = tex(name + '_r.jpg');
    m.normalScale = new THREE.Vector2(o.ns ?? .9, o.ns ?? .9);
    m.userData.tile = tile;
    return (MC[key] = m);
  }
  // мировые UV: каждая грань получает координаты по своей плоскости, текстура не растягивается
  function worldUV(root) {
    const v = new THREE.Vector3(), nrm = new THREE.Vector3(), nm = new THREE.Matrix3();
    root.updateMatrixWorld(true);
    root.traverse(m => {
      const mm = Array.isArray(m.material) ? m.material.find(x => x.userData && x.userData.tile) : m.material;
      if (!m.isMesh || !mm || !mm.userData || !mm.userData.tile) return;
      const g = m.geometry; if (!g.attributes.uv || !g.attributes.normal || g.userData.wuv) return;
      g.userData.wuv = true;
      const tile = mm.userData.tile, pos = g.attributes.position, no = g.attributes.normal, uv = g.attributes.uv;
      nm.getNormalMatrix(m.matrixWorld);
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        nrm.fromBufferAttribute(no, i).applyMatrix3(nm).normalize();
        const ax = Math.abs(nrm.x), ay = Math.abs(nrm.y), az = Math.abs(nrm.z);
        if (ay >= ax && ay >= az) uv.setXY(i, v.x / tile, v.z / tile);
        else if (ax >= az) uv.setXY(i, v.z / tile, v.y / tile);
        else uv.setXY(i, v.x / tile, v.y / tile);
      }
      uv.needsUpdate = true;
    });
  }
  function noise(g, w, h, n, a) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},${a * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, rnd(1, 3), rnd(1, 3)); } }
  const T = {};
  function texStone(rx, ry) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#6e6a64'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 96 + Math.random() * 30; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
      noise(g, w, h, 3000, .12); g.strokeStyle = '#3a3834'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    }, rx, ry);
  }
  function texPlanks(base, rx, ry, dark) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .18})`; g.fillRect(0, i * 32, w, 32); g.fillStyle = `rgba(0,0,0,${dark || .5})`; g.fillRect(0, i * 32, w, 2); const o = Math.random() * w; g.fillRect(o, i * 32, 2, 32); }
      for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(0,0,0,${Math.random() * .12})`; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + rnd(-4, 4), w * .6, y + rnd(-4, 4), w, y + rnd(-3, 3)); g.stroke(); }
      noise(g, w, h, 1200, .08);
    }, rx, ry);
  }
  function texPanel(base, trim, rx, ry) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.strokeStyle = trim; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h * .55); g.strokeRect(14, h * .66, w - 28, h * .3);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, h * .6, w, 4); noise(g, w, h, 900, .07);
    }, rx, ry);
  }
  function texPaper(base, gold, rx, ry) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.fillStyle = gold; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 64 + (y % 2) * 32 + 16, cy = y * 64 + 32; g.beginPath(); g.moveTo(cx, cy - 10); g.quadraticCurveTo(cx + 8, cy, cx, cy + 10); g.quadraticCurveTo(cx - 8, cy, cx, cy - 10); g.fill(); }
      noise(g, w, h, 800, .06);
    }, rx, ry);
  }
  function texSign(text, sub, o) {
    o = o || {};
    return canvasTex(512, 160, (g, w, h) => {
      g.fillStyle = o.bg || '#1c2a3a'; g.fillRect(0, 0, w, h);
      g.strokeStyle = o.fg || '#e6d29a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = o.fg || '#e6d29a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `bold ${o.size || 50}px Georgia, serif`; g.fillText(text, w / 2, sub ? h * .4 : h / 2);
      if (sub) { g.font = '28px Georgia, serif'; g.globalAlpha = .85; g.fillText(sub, w / 2, h * .74); }
    });
  }

  // ---------- конструктор ----------
  function box(grp, w, h, d, mat, x, y, z, ry) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; grp.add(m); return m; }
  function cyl(grp, r1, r2, h, mat, x, y, z, seg) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 20), mat); m.position.set(x, y, z); grp.add(m); return m; }
  // стена вдоль Z (плоскость x = const) с проёмами [z0, z1]
  function wallX(grp, x, z0, z1, y, h, mat, gaps, th) {
    th = th || .08; let a = z0; (gaps || []).concat([[z1, z1]]).forEach(([g0, g1]) => { if (g0 > a) box(grp, th, h, g0 - a, mat, x, y + h / 2, (a + g0) / 2); if (g1 < z1 && g0 < z1) box(grp, th, h - 2.05, g1 - g0, mat, x, y + 2.05 + (h - 2.05) / 2, (g0 + g1) / 2); a = g1; });
  }
  function wallZ(grp, z, x0, x1, y, h, mat, gaps, th) {
    th = th || .08; let a = x0; (gaps || []).concat([[x1, x1]]).forEach(([g0, g1]) => { if (g0 > a) box(grp, g0 - a, h, th, mat, (a + g0) / 2, y + h / 2, z); if (g1 < x1 && g0 < x1) box(grp, g1 - g0, h - 2.05, th, mat, (g0 + g1) / 2, y + 2.05 + (h - 2.05) / 2, z); a = g1; });
  }
  function lamp(L, grp, x, y, z, o) {
    o = o || {};
    const glow = M('#ffe3b0', { e: o.c || '#ffd590', ei: 1.4, r: .4 });
    if (o.post) { cyl(grp, .05, .07, y, M('#1e1e22', { m: .6, r: .5 }), x, y / 2, z, 10); }
    if (o.hang) cyl(grp, .01, .01, o.hang, M('#1e1e22', { m: .6, r: .5 }), x, y + o.hang / 2 + .1, z, 6);
    const s = new THREE.Mesh(new THREE.SphereGeometry(o.r || .12, 16, 12), glow); s.position.set(x, y, z); grp.add(s);
    L.lamps.push({ p: new THREE.Vector3(x, y - .05, z), i: o.i ?? .9, d: o.d ?? 7, c: o.hex ?? 0xffd9a8 });
  }
  function railing(grp, x0, x1, z, y, mat) {
    box(grp, x1 - x0, .05, .05, mat, (x0 + x1) / 2, y + 1.0, z);
    box(grp, x1 - x0, .03, .03, mat, (x0 + x1) / 2, y + .55, z);
    for (let x = x0; x <= x1 + .01; x += .9) box(grp, .04, 1.0, .04, mat, x, y + .5, z);
  }
  function railingX(grp, x, z0, z1, y, mat) {
    box(grp, .05, .05, z1 - z0, mat, x, y + 1.0, (z0 + z1) / 2);
    box(grp, .03, .03, z1 - z0, mat, x, y + .55, (z0 + z1) / 2);
    for (let z = z0; z <= z1 + .01; z += .9) box(grp, .04, 1.0, .04, mat, x, y + .5, z);
  }
  function crowMesh() {
    const g = new THREE.Group(), k = M('#121216', { r: .5 }), b = M('#3a3428', { r: .6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 10), k); body.scale.set(.8, .8, 1.4); g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.04, 10, 8), k); head.position.set(0, .05, .07); g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(.012, .05, 8), b); beak.rotation.x = Math.PI / 2; beak.position.set(0, .045, .12); g.add(beak);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(.05, .01, .08), k); tail.position.set(0, -.01, -.1); tail.rotation.x = -.3; g.add(tail);
    const eyeM = M('#e8c040', { e: '#a08020', ei: .6 }); [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.008, 6, 6), eyeM); e.position.set(s * .025, .06, .095); g.add(e); });
    return g;
  }
  function sandMotes(grp, cx, cz, w, d, y0, y1, color, n) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = cx + rnd(-w / 2, w / 2); pos[i * 3 + 1] = rnd(y0, y1); pos[i * 3 + 2] = cz + rnd(-d / 2, d / 2); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dot = canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: .03, map: dot, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.userData.motes = { y0, y1 }; grp.add(pts); return pts;
  }

  // плита с прямоугольными вырезами (проёмы под лестницы): holes [[x0, x1, z0, z1]]
  function slab(grp, x0, x1, z0, z1, yTop, th, mat, holes) {
    const xs = [x0, x1]; (holes || []).forEach(h => xs.push(h[0], h[1]));
    const X = [...new Set(xs)].filter(v => v >= x0 && v <= x1).sort((a, b) => a - b);
    for (let i = 0; i < X.length - 1; i++) {
      const a = X[i], b = X[i + 1], mx = (a + b) / 2; if (b - a < 1e-3) continue;
      const hz = (holes || []).filter(h => h[0] < mx && h[1] > mx).map(h => [h[2], h[3]]).sort((p, q) => p[0] - q[0]);
      let z = z0; for (const [za, zb] of hz.concat([[z1, z1]])) { if (za > z + 1e-3) box(grp, b - a, th, za - z, mat, mx, yTop - th / 2, (z + za) / 2); z = Math.max(z, zb); }
    }
  }
  // стена вдоль X с окнами: wins [[x0, x1]], окно от sill до top
  function wallZw(grp, z, x0, x1, y, h, mat, wins, sill, top, th) {
    th = th || .08; let a = x0;
    (wins || []).concat([[x1, x1]]).forEach(([w0, w1]) => {
      if (w0 > a) box(grp, w0 - a, h, th, mat, (a + w0) / 2, y + h / 2, z);
      if (w1 > w0) { box(grp, w1 - w0, sill, th, mat, (w0 + w1) / 2, y + sill / 2, z); box(grp, w1 - w0, h - top, th, mat, (w0 + w1) / 2, y + top + (h - top) / 2, z); }
      a = Math.max(a, w1);
    });
  }
  // наклонная лестница вдоль X: от (xa, ya) до (xb, yb), у борта z, ширина w
  function stair(grp, xa, xb, z, ya, yb, w, o) {
    const run = xb - xa, rise = yb - ya, n = Math.max(6, Math.round(rise / .2)), L = Math.hypot(run, rise), ang = Math.atan2(rise, run);
    for (let k = 0; k < n; k++) {
      const u = (k + .5) / n; box(grp, Math.abs(run) / n + .05, .045, w, o.tread, xa + run * u, ya + rise * (k + 1) / n - .02, z);
      if (o.riser) box(grp, .02, rise / n, w - .02, o.riser, xa + run * (k + 1) / n - run / n / 2 - Math.sign(run) * Math.abs(run) / n / 2, ya + rise * (k + .5) / n, z);
    }
    for (const s of [-1, 1]) {
      const st = box(grp, L + .1, .24, .05, o.side, xa + run / 2, ya + rise / 2 - .06, z + s * (w / 2 + .025)); st.rotation.z = ang;
      if (o.rail) {
        const hr = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, L + .2, 8), o.rail); hr.position.set(xa + run / 2, ya + rise / 2 + .88, z + s * (w / 2 + .03)); hr.rotation.z = ang - Math.PI / 2; grp.add(hr);
        for (let k = 1; k <= 3; k++) { const u = k / 4; cyl(grp, .015, .015, .88, o.rail, xa + run * u, ya + rise * u + .44, z + s * (w / 2 + .03), 6); }
      }
    }
  }
  // склейка неподвижных деталей одного материала в одну сетку: сотни вызовов отрисовки → десятки (картинка та же)
  function mergeStatic(G, L, extra) {
    const allow = new Set(Object.values(MC)); (extra || []).forEach(m => m && allow.add(m));
    const keep = new Set(); const mark = o => { if (o && o.isObject3D) o.traverse(c => keep.add(c)); };
    for (const k in L) { const v = L[k]; if (v === G) continue; if (Array.isArray(v)) v.forEach(mark); else if (v && !v.isObject3D && typeof v === "object") Object.values(v).forEach(x => x && x.st ? mark(x.st.root) : mark(x)); else mark(v); }
    G.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(G.matrixWorld).invert();
    const by = new Map();
    G.children.slice().forEach(m => {
      if (!m.isMesh || m.isSkinnedMesh || Array.isArray(m.material) || !allow.has(m.material) || keep.has(m) || m.material.transparent || m.renderOrder || m.children.length) return;
      const g = m.geometry; if (!g.attributes.position || !g.attributes.normal || !g.attributes.uv) return;
      if (!by.has(m.material)) by.set(m.material, []); by.get(m.material).push(m);
    });
    let before = 0, after = 0; const v = new THREE.Vector3(), nm = new THREE.Matrix3(), Mx = new THREE.Matrix4();
    for (const [mat, list] of by) {
      before += list.length; if (list.length < 2) { after++; continue; }
      let nv = 0, ni = 0; list.forEach(m => { const g = m.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni); let vo = 0, io = 0;
      list.forEach(m => {
        const g = m.geometry; Mx.multiplyMatrices(inv, m.matrixWorld); nm.getNormalMatrix(Mx);
        const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
        for (let i = 0; i < P.count; i++) {
          v.fromBufferAttribute(P, i).applyMatrix4(Mx); pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
          v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
          uv[(vo + i) * 2] = U.getX(i); uv[(vo + i) * 2 + 1] = U.getY(i);
        }
        if (g.index) { const I = g.index.array; for (let i = 0; i < I.length; i++) idx[io + i] = I[i] + vo; io += I.length; } else { for (let i = 0; i < P.count; i++) idx[io + i] = vo + i; io += P.count; }
        vo += P.count; G.remove(m);
      });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
      const mm = new THREE.Mesh(geo, mat); mm.name = 'merged'; G.add(mm); after++;
    }
    return [before, after];
  }
  // ---------- переходы ----------
  const fade = document.createElement('div');
  fade.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .35s;z-index:35';
  document.body.appendChild(fade);
  function withFade(f) { fade.style.opacity = 1; setTimeout(() => { try { f(); } finally { setTimeout(() => { fade.style.opacity = 0; }, 80); } }, 380); }

  window.setHeroFormsNow = () => setHeroForms(WORLD.cur);
  function setHeroForms(loc) {
    const F = STORY.heroForms && STORY.heroForms[loc]; if (!F) return;
    for (const h in F) { if (STORY.heroes[h]) STORY.heroes[h].role = F[h]; if (STORY.cast[h]) STORY.cast[h].role = F[h]; }
  }

  window.enterLoc = function (id) {
    withFade(() => {
      if (WORLD.cur === 'train' && !saved) saved = { walk, zones, condRects, doors: doors.slice(), blockers: blockers.slice(), lamps: lampList.slice(), fog: scene.fog, bg: scene.background };
      if (window.TRAIN_ROOT) TRAIN_ROOT.visible = id === 'train';
      Object.values(PROPS).forEach(o => { if (o && o.root) o.root.visible = id === 'train'; else if (o && o.isObject3D) o.visible = id === 'train'; });
      if (CHASE.st) CHASE.st.root.visible = false; if (PATROL.st) PATROL.st.root.visible = false;
      document.getElementById('eye').style.display = 'none';
      for (const k in LOC) if (LOC[k].group) LOC[k].group.visible = k === id;
      WORLD.cur = id;
      document.getElementById('jump').style.visibility = id === 'train' ? '' : 'hidden';
      if (id === 'train') {
        walk = saved.walk; zones = saved.zones; condRects = saved.condRects;
        doors.length = 0; saved.doors.forEach(d => doors.push(d)); blockers.length = 0; saved.blockers.forEach(b => blockers.push(b));
        lampList.length = 0; saved.lamps.forEach(l => lampList.push(l)); scene.fog = saved.fog; scene.background = saved.bg; P.lv = 0; P.fy = 0;
        setHeroForms('train'); updateQuest(); updateInv(); return;
      }
      status.style.display = 'none';
      const L = LOC[id]; if (!L.group) L.build(L);
      walk = L.walk; zones = L.zones; condRects = [];
      doors.length = 0; blockers.length = 0; L.blockers.forEach(b => blockers.push(b));
      lampList.length = 0; L.lamps.forEach(l => lampList.push(l));
      scene.fog = new THREE.Fog(L.fog[0], L.fog[1], L.fog[2]); scene.background = new THREE.Color(L.fog[0]);
      setHeroForms(id);
      gameOn = true; S.f.solved = true; // поезд позади: его события (засада, рассвет) больше не срабатывают
      L.enter(L);
      updateQuest(); updateInv();
    });
  };
  function place(x, z, yaw, lv) { P.x = x; P.z = z; P.yaw = yaw; P.pitch = 0; P.lv = lv || 0; P.fy = DY[String(P.lv)] || 0; }

  // блокировка проходов в новых локациях
  const trainBlock = window.walkBlock;
  window.walkBlock = (x, z) => {
    if (WORLD.cur === 'train') return trainBlock ? trainBlock(x, z) : false;
    const L = LOC[WORLD.cur]; return !!(L && L.block && L.block(x, z));
  };
  // цифры 1–7, 0 переносят по поезду — вне поезда отключаем
  document.getElementById('jump').addEventListener('click', e => { if (WORLD.cur !== 'train') { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  // ======================================================================
  //                        БЕЗВРЕМЕННЫЙ ВОКЗАЛ
  // ======================================================================
  const HERO_LOOK = {
    rowen: { coat: '#34363b', vest: '#55585e', pants: '#26272b', boots: true, belt: '#1e1a16', hat: 'greathelm', hair: 'none', skin: '#deb08f', heavy: true, armPose: 'knees', gloves: '#2a2b2e' },
    miron: { coat: '#2e241c', pants: '#3a2c20', boots: true, hat: 'fedora', hatC: '#5a3e26', hair: 'none', skin: '#bfa074', beard: 'long', beardC: '#d8d0c0', prop: 'shovel', armPose: 'knees', eyeC: '#0c0805' },
    agata: { female: true, coat: '#141216', skirt: '#141216', collar: '#f2eee6', hat: 'nunveil', hair: 'none', skin: '#e9e1d8', lips: '#b8a0a0', prop: 'book', stockings: '#101012', eyeC: '#2e1c16' },
    tibo: { coat: '#0e0e10', vest: '#1a1a1e', shirtFront: true, lapels: true, tie: '#0a0a0c', collar: '#f4f0ea', pants: '#0e0e10', hat: 'top', hatC: '#0c0c0e', mask: 'harlequin', hair: '#24180f', hairStyle: 'slick', skin: '#c8a084', prop: 'cane', armPose: 'crossed', eyeC: '#6a4a22' }
  };
  LOC.station = {
    fog: [0x5a6470, 8, 34], walk: [], zones: [], lamps: [], blockers: [],
    build(L) {
      const G = L.group = new THREE.Group(); scene.add(G);
      G.add(new THREE.HemisphereLight(0xc8d4e8, 0x2a2620, .55));
      const dl = new THREE.DirectionalLight(0xdfe6f0, .35); dl.position.set(SX - 10, 20, -10); G.add(dl);
      const stone = MT('stone', 2.2), iron = M('#1c1e22', { m: .6, r: .45 }), wallM = MT('plaster', 3.2);
      // платформа, край, пути
      box(G, 28.4, .5, 7.8, stone, SX, -.25, 3.5);
      box(G, 28.4, .06, .35, M('#c9b468', { r: .7 }), SX, .01, -.2);
      box(G, 60, .3, 6, M('#2a2622', { r: 1 }), SX, -1.35, -3.4);
      const sleeper = M('#3a2c22', { r: 1 }), railM = M('#8a8a8e', { m: .8, r: .35 });
      for (let x = SX - 30; x < SX + 30; x += .75) box(G, .22, .12, 2.4, sleeper, x, -1.15, -3.2);
      [-2.5, -3.9].forEach(z => box(G, 60, .1, .07, railM, SX, -1.04, z));
      // отделка: тёмное дерево, латунь, стеновые панели понизу и пояс над дверями
      const trim = M('#3a2416', { r: .5 }), brassD = M('#c9a050', { m: .85, r: .3 });
      function doorTex() {
        if (L.doorTex) return L.doorTex;
        return (L.doorTex = canvasTex(256, 768, (g, w, h) => {
          g.fillStyle = '#4a2c18'; g.fillRect(0, 0, w, h);
          for (let i = 0; i < 260; i++) { g.strokeStyle = 'rgba(' + (Math.random() < .5 ? '20,10,4' : '110,70,40') + ',' + (.05 + Math.random() * .12) + ')'; g.lineWidth = 1 + Math.random() * 2; const x0 = Math.random() * w; g.beginPath(); g.moveTo(x0, 0); g.bezierCurveTo(x0 + rnd(-8, 8), h * .3, x0 + rnd(-8, 8), h * .7, x0 + rnd(-6, 6), h); g.stroke(); }
          const panel = (x, y, pw, ph, glass) => {
            if (glass) {
              const gr = g.createLinearGradient(x, y, x + pw, y + ph); gr.addColorStop(0, '#5a4630'); gr.addColorStop(.45, '#2a2018'); gr.addColorStop(.5, '#6a5236'); gr.addColorStop(1, '#1a140e');
              g.fillStyle = gr; g.fillRect(x, y, pw, ph);
              g.fillStyle = 'rgba(255,214,150,.18)'; g.fillRect(x + 4, y + 4, pw * .35, ph - 8);
              g.strokeStyle = '#2a180c'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + pw / 2, y); g.lineTo(x + pw / 2, y + ph); g.moveTo(x, y + ph / 2); g.lineTo(x + pw, y + ph / 2); g.stroke();
            } else {
              g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y, pw, ph);
              g.fillStyle = 'rgba(255,200,150,.08)'; g.fillRect(x + 10, y + 10, pw - 20, ph - 20);
            }
            g.lineWidth = 6; g.strokeStyle = 'rgba(255,210,160,.22)'; g.beginPath(); g.moveTo(x, y + ph); g.lineTo(x, y); g.lineTo(x + pw, y); g.stroke();
            g.strokeStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.moveTo(x + pw, y); g.lineTo(x + pw, y + ph); g.lineTo(x, y + ph); g.stroke();
          };
          panel(30, 34, w - 60, 300, true);
          panel(30, 370, w - 60, 160); panel(30, 560, w - 60, 170);
          g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
        }));
      }
      // здание вокзала и навес
      box(G, 28.4, 6.4, .5, wallM, SX, 3.2, 7.65);
      box(G, 28.4, 1.1, .05, MT('panel', 1.2, { c: '#9a7656' }), SX, .55, 7.385);
      box(G, 28.4, .07, .08, trim, SX, 1.12, 7.37); box(G, 28.4, .14, .06, trim, SX, .07, 7.37);
      box(G, 28.4, .22, .12, M('#c8bfac', { r: .8 }), SX, 3.95, 7.38); box(G, 28.4, .06, .16, M('#a8a090', { r: .8 }), SX, 3.82, 7.37);
      for (let i = -3; i <= 3; i++) {
        const x = SX + i * 3.8;
        if (i !== 0) {
          // двустворчатая дверь: филёнки, стекло сверху, наличник, латунные ручки, порог
          const dm = M('#ffffff', { map: doorTex(), r: .42 });
          for (const sd of [-1, 1]) box(G, .88, 2.74, .07, dm, x + sd * .45, 1.39, 7.37);
          box(G, .025, 2.74, .09, trim, x, 1.39, 7.36);
          [[-1, 0], [1, 0]].forEach(([sd]) => { box(G, .12, 3.0, .12, trim, x + sd * .98, 1.5, 7.36); });
          box(G, 2.2, .16, .14, trim, x, 2.93, 7.35); box(G, 2.32, .05, .17, trim, x, 3.03, 7.34);
          box(G, 2.1, .05, .5, M('#6a6660', { r: .6 }), x, .025, 7.15);
          for (const sd of [-1, 1]) { cyl(G, .012, .012, .22, brassD, x + sd * .1, 1.15, 7.31, 8); box(G, .05, .09, .015, brassD, x + sd * .1, 1.15, 7.33); }
          // окно-фрамуга с переплётом
          box(G, 1.5, 1.2, .06, M('#ffd9a0', { e: '#ffc070', ei: .55, r: .3 }), x, 3.5, 7.37);
          box(G, 1.66, .08, .1, trim, x, 4.12, 7.35); box(G, 1.66, .08, .1, trim, x, 2.88 + .0, 7.35);
          for (const dx of [-.79, -.26, .26, .79]) box(G, .05, 1.2, .08, trim, x + dx, 3.5, 7.35);
          box(G, 1.5, .04, .08, trim, x, 3.5, 7.35);
        }
        // пилястра: база, ствол, капитель
        box(G, .5, 6.4, .7, M('#b8af9c', { r: .9 }), x + 1.9, 3.2, 7.4);
        box(G, .62, .35, .8, M('#a39a88', { r: .85 }), x + 1.9, .175, 7.4); box(G, .66, .1, .84, M('#c8bfac', { r: .8 }), x + 1.9, .4, 7.4);
        box(G, .64, .14, .82, M('#c8bfac', { r: .8 }), x + 1.9, 4.05, 7.4);
      }
      box(G, 28.6, .18, 4.9, M('#2a2e34', { m: .3, r: .6 }), SX, 4.2, 5.2);
      for (let x = SX - 12; x <= SX + 12; x += 6) { cyl(G, .08, .1, 4.2, iron, x, 2.1, 3.0, 12); box(G, .5, .1, .5, iron, x, .05, 3.0); L.blockers.push({ x, z: 3.0 }); }
      // табло без названия и часы без цифр
      box(G, 6.2, .9, .12, M('#ffffff', { map: texSign('', '', { bg: '#1e2833' }) }), SX, 5.0, 7.33);
      const face = canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = '#ece6d6'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 8; g.stroke();
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = '#c8c0b0'; g.beginPath(); g.arc(128 + Math.sin(a) * 98, 128 - Math.cos(a) * 98, 5, 0, 7); g.fill(); }
        g.strokeStyle = '#1a1a1a'; g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 52); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(128, 128); g.lineTo(186, 150); g.stroke();
      });
      const clk = new THREE.Mesh(new THREE.CircleGeometry(.75, 40), M('#ffffff', { map: face, r: .5 })); clk.position.set(SX, 6.15, 7.38); clk.rotation.y = Math.PI; G.add(clk);
      // ---------- небо в тумане, вторая платформа за путями, фермы навеса, деревянный подзор ----------
      {
        const skyT = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9aa6b4'); gr.addColorStop(.35, '#7a8592'); gr.addColorStop(.5, '#5a6470'); gr.addColorStop(1, '#3a4048'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
        const sky = L.sky = new THREE.Mesh(new THREE.SphereGeometry(27, 24, 12), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false }));
        sky.renderOrder = -10; G.add(sky);
        // второй путь и платформа напротив — тают в тумане
        box(G, 60, .3, 4.6, M('#2a2622', { r: 1 }), SX, -1.35, -8.6);
        const sleeper = M('#3a2c22', { r: 1 }), railM = M('#8a8a8e', { m: .8, r: .35 });
        for (let x = SX - 30; x < SX + 30; x += .75) box(G, .22, .12, 2.4, sleeper, x, -1.15, -8.2);
        [-7.5, -8.9].forEach(z => box(G, 60, .1, .07, railM, SX, -1.04, z));
        const stone2 = MT('stone', 2.2);
        box(G, 40, 1.3, 4.5, stone2, SX, -.65, -12.6); box(G, 40, .06, .3, M('#c9b468', { r: .7 }), SX, .01, -10.5);
        const postM = M('#1c1e22', { m: .6, r: .45 }), glowM = M('#ffe3b0', { e: '#ffd590', ei: 1.6, r: .4 });
        for (let x = SX - 18; x <= SX + 18; x += 6) {
          cyl(G, .06, .08, 3.6, postM, x, 1.8, -12.2, 8); box(G, .5, .05, .05, postM, x + .2, 3.55, -12.2);
          const lmp = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), glowM); lmp.position.set(x + .42, 3.38, -12.2); G.add(lmp);
          if ((x - SX) % 12 === 0) { box(G, 1.6, .07, .45, M('#5a3a22', { r: .7 }), x + 2.5, .45, -13.3); box(G, 1.6, .45, .06, M('#5a3a22', { r: .7 }), x + 2.5, .75, -13.55); for (const d of [-.7, .7]) box(G, .06, .45, .4, postM, x + 2.5 + d, .22, -13.3); }
        }
        // телеграфные столбы с проводами вдоль дальнего пути
        const poleM = M('#3a3028', { r: .9 }), wireM = M('#1a1a1a', { r: .8 });
        for (let x = SX - 28; x <= SX + 28; x += 14) { cyl(G, .1, .13, 7, poleM, x, 2.2, -15.5, 8); box(G, 1.4, .08, .08, poleM, x, 5.3, -15.5); box(G, 1.0, .08, .08, poleM, x, 4.9, -15.5); }
        for (const [dz, yy] of [[-.6, 5.38], [.6, 5.38], [-.4, 4.98], [.4, 4.98]]) box(G, 60, .015, .015, wireM, SX, yy - .15, -15.5 + dz * .01 + dz * 0);
        // фермы под навесом и кронштейны на колоннах
        const trussM = M('#22252a', { m: .55, r: .5 });
        for (let x = SX - 13.5; x <= SX + 13.5; x += 3) { box(G, .08, .16, 4.8, trussM, x, 4.03, 5.2); }
        box(G, 28.6, .12, .08, trussM, SX, 4.05, 3.0); box(G, 28.6, .12, .08, trussM, SX, 4.05, 5.6);
        for (let x = SX - 12; x <= SX + 12; x += 6) for (const s of [-1, 1]) { const br = box(G, .06, .9, .06, trussM, x + s * .38, 3.65, 3.0); br.rotation.z = s * .75; const br2 = box(G, .06, .9, .06, trussM, x, 3.65, 3.0 + s * .38); br2.rotation.x = -s * .75; }
        for (let x = SX - 12; x <= SX + 12; x += 6) { const cap = cyl(G, .16, .1, .25, trussM, x, 4.0, 3.0, 12); }
        // деревянный подзор по краю навеса (резные зубцы)
        const valT = canvasTex(256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#4a3020'; g.fillRect(0, 0, w, 22); for (let i = 0; i < 8; i++) { const x0 = i * 32; g.beginPath(); g.moveTo(x0, 22); g.lineTo(x0 + 32, 22); g.lineTo(x0 + 16, 58); g.fill(); g.fillStyle = 'rgba(0,0,0,0)'; g.fillStyle = '#4a3020'; } g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * 32 + 16, 30, 5, 0, 7); g.fill(); } }, 1, 1);
        valT.repeat.set(28.6 / 1.2, 1);
        const valM = new THREE.MeshStandardMaterial({ map: valT, alphaTest: .5, side: THREE.DoubleSide, roughness: .8 });
        const val = new THREE.Mesh(new THREE.PlaneGeometry(28.6, .34), valM); val.position.set(SX, 3.95, 2.74); G.add(val);
      }
      const hand = box(G, .04, .55, .02, M('#111', {}), SX, 6.15 + .27, 7.36); L.hand = hand; hand.geometry.translate(0, -.27, 0); hand.position.y = 6.15;
      // лавка, стол с самоваром
      const wood = MT('panel', 1.2, { c: '#c8a888' });
      box(G, 3.6, .07, .5, wood, SX, .45, 6.75); box(G, 3.6, .5, .06, wood, SX, .78, 7.05);
      [-1.6, 0, 1.6].forEach(dx => { box(G, .06, .45, .45, iron, SX + dx, .22, 6.75); });
      cyl(G, .55, .55, .05, wood, SX + 2.8, .75, 6.3, 28); cyl(G, .06, .1, .72, iron, SX + 2.8, .37, 6.3, 10);
      const brass = M('#c9a050', { m: .85, r: .28 });
      const sam = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.13, 0], [.14, .05], [.1, .1], [.16, .2], [.17, .34], [.12, .42], [.06, .46], [.07, .52], [0, .54]].map(p => new THREE.Vector2(p[0], p[1])), 24), brass);
      sam.position.set(SX + 2.75, .78, 6.35); G.add(sam);
      cyl(G, .012, .012, .12, brass, SX + 2.6, 1.02, 6.35, 6).rotation.z = 1.2;
      [[.25, .1], [-.2, .2], [.15, -.25]].forEach(([dx, dz]) => { cyl(G, .04, .035, .07, M('#e8e4dc', { r: .3 }), SX + 2.8 + dx, .815, 6.3 + dz, 12); });
      for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.04, .015, 6, 14), M('#c08848', { r: .7 })); t.rotation.x = Math.PI / 2; t.position.set(SX + 3.0 + (i % 3) * .07, .79 + Math.floor(i / 3) * .02, 6.05 + (i % 2) * .05); G.add(t); }
      L.blockers.push({ x: SX + 2.8, z: 6.3 }, { x: SX + 2.4, z: 6.3 }, { x: SX + 3.2, z: 6.3 });
      // доска дел
      const board = canvasTex(512, 320, (g, w, h) => {
        g.fillStyle = '#23342a'; g.fillRect(0, 0, w, h); noise(g, w, h, 4000, .08);
        g.fillStyle = 'rgba(230,230,220,.07)'; g.font = '40px Georgia'; for (let i = 0; i < 18; i++) g.fillText(String(80 + Math.floor(Math.random() * 20)), Math.random() * w, Math.random() * h);
        g.fillStyle = '#ece8dc'; g.textAlign = 'center'; g.font = 'bold 44px Georgia'; g.fillText('ДЕЛА', w / 2, 56);
        g.font = 'bold 72px Georgia'; g.fillText(S.f.act1done ? '2 из 100' : '1 из 100', w / 2, 140);
        g.textAlign = 'left'; g.font = '26px Georgia'; g.fillText('№1  «Тамбур», 2008 — раскрыто', 40, 210); if (S.f.act1done) g.fillText('№2  «Святая Марфа», 1926 — раскрыто', 40, 250);
      });
      L.boardMesh = box(G, 2.4, 1.5, .06, M('#ffffff', { map: board, r: .9 }), SX, 2.45, 7.36); // на стене над лавкой, между дверями
      box(G, 2.56, 1.66, .04, M('#5a3a22', { r: .7 }), SX, 2.45, 7.39);
      // таблички платформ
      const signs = [['plat1', SX - 11.5, '1 · 2008', 'Поезд · раскрыто', '#1e2a3a'], ['plat3', SX - 7, '3 · 1640-е', 'не время', '#2a2a2e'], ['plat5', SX, '—', '', '#e8e4da'], ['plat4', SX + 7, '4 · 1968', 'не время', '#2a2a2e'], ['plat2', SX + 11.5, '2 · 1926', '«Святая Марфа»', '#3a2a14']];
      signs.forEach(([id, x, t, sub, bg]) => {
        cyl(G, .05, .06, 2.6, iron, x, 1.3, .7, 10);
        // табличка поперёк платформы: читается, когда идёшь вдоль путей (с обеих сторон)
        const sm = M('#ffffff', { map: texSign(t, sub, { bg, fg: bg === '#e8e4da' ? '#8a8478' : '#e6d29a', size: 46 }), e: id === 'plat2' ? '#3a2a10' : '#000000', ei: .6 });
        [1, -1].forEach(sd => { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .48), sm); pl.position.set(x + sd * .03, 2.45, .7); pl.rotation.y = sd * Math.PI / 2; G.add(pl); });
        box(G, .05, .52, 1.54, iron, x, 2.45, .7);
        L.blockers.push({ x, z: .7 });
        INSPECT.push({ id, x, z: 1.1, r: 1.35, loc: 'station' });
      });
      INSPECT.push({ id: 'plat2done', x: SX + 11.5, z: 1.1, r: 1.35, loc: 'station' });
      INSPECT.push({ id: 'board', x: SX, z: 5.3, r: .75, loc: 'station' }); // перед лавкой, дальше героев — не мешает с ними говорить
      INSPECT.push({ id: 'clockS', x: SX - 1.6, z: 5.6, r: .8, loc: 'station' });
      // туман над путями у второй платформы светится
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      glow.position.set(SX + 11.5, 1.5, -3); G.add(glow); L.glow = glow;
      // фонари
      for (let x = SX - 12; x <= SX + 12; x += 6) lamp(L, G, x + 3, 3.65, 5.2, { hang: .4, i: .8, d: 7 });
      for (let x = SX - 13; x <= SX + 13; x += 13) { lamp(L, G, x, 3.1, 1.5, { post: true, i: .9, d: 8 }); L.blockers.push({ x, z: 1.5 }); }
      L.motes = sandMotes(G, SX, 3, 28, 12, 0, 5, 0xffd890, 380);
      // собеседники: Смотритель и трое героев на лавке
      const sm = addNPC('smotritel', standAt(SX + 3.6, 5.7, '-z'), { coat: '#f4f1ea', pants: '#e8e4da', buttons: true, belt: '#c9a35a', stole: '#d9b46a', hair: '#ece8e2', hairStyle: 'side', beard: 'trim', beardC: '#efebe5', glasses: true, skin: '#f1d0b8', eyeC: '#5d7488', handsBehind: true }, { loc: 'station' });
      L.blockers.push({ x: sm.x, z: sm.z });
      // все четверо сидят на лавке; тот, за кого играешь, на ней не виден
      L.bench = ['rowen', 'miron', 'agata', 'tibo'].map(h => {
        const n = addNPC('b_' + h, { x: SX, z: 6.72, face: '-z', seatY: .45, pose: 'sit' }, HERO_LOOK[h], { loc: 'station', name: STORY.cast[h].name });
        if (h === 'miron') { const c = crowMesh(); c.position.set(.2, .55, -.02); c.rotation.y = .4; n.st.torso.add(c); L.crow = c; }
        return n;
      });
      // играешь секретным героем — на лавке все четверо, садятся теснее
      window.rebuildBench = () => { let k = 0; const four = !L.bench.some(n => n.id === 'b_' + S.hero), x0 = four ? -1.62 : -1.15, dx = four ? 1.08 : 1.15; L.bench.forEach(n => { const me = n.id === 'b_' + S.hero; n.hidden = me; if (!me) { n.x = SX + x0 + (k++) * dx; n.st.root.position.x = n.x; } }); };
      rebuildBench();
      if (window.Heroes3D) Heroes3D.station(L, sm); // 3D-модели героев и Смотрителя
      [-1.6, -.5, .5, 1.6].forEach(dx => L.blockers.push({ x: SX + dx, z: 6.75 }));
      // мелькнувшая в тумане Зоя
      L.zoya = addNPC('zoyaG', standAt(SX - 13, 2.2, '+x'), LOOK.zoya, { loc: 'station', name: 'Девушка в фартуке', bark: 'station' });
      worldUV(G); L.merged = mergeStatic(G, L);
      L.walk = [[SX - 13.7, SX + 13.7, .45, 6.95]];
      L.zones = [[SX - 15, SX + 15, 'Безвременный вокзал']];
    },
    enter(L) {
      place(SX - 9, 3.6, -Math.PI / 2, 0);
      if (S.f.act1done && !L.board2) { L.board2 = true; L.boardMesh.material = M('#ffffff', { map: canvasTex(512, 320, (g, w, h) => {
        g.fillStyle = '#23342a'; g.fillRect(0, 0, w, h); noise(g, w, h, 4000, .08);
        g.fillStyle = '#ece8dc'; g.textAlign = 'center'; g.font = 'bold 44px Georgia'; g.fillText('ДЕЛА', w / 2, 56); g.font = 'bold 72px Georgia'; g.fillText('2 из 100', w / 2, 140);
        g.textAlign = 'left'; g.font = '26px Georgia'; g.fillText('№1  «Тамбур», 2008 — раскрыто', 40, 210); g.fillText('№2  «Святая Марфа», 1926 — раскрыто', 40, 250); }), r: .9 }); }
      L.zoya.hidden = !!S.f.zoyaSeen;
      // лилии: за каждые три — фраза Смотрителя
      S.f.lily3 = S.clues.filter(c => STORY.clues[c].lily).length >= 3;
      if (S.f.act1done && !S.f.konfDone) setTimeout(() => startScene('konfiskat'), 500);
      else if (!S.f.lavkaDone) setTimeout(() => startScene('lavka'), 500);
    },
    tick(L, dt) {
      L.hand.rotation.z = Math.sin(performance.now() / 300) * .03 - 1.2;
      const p = L.motes.geometry.attributes.position, t = performance.now() / 1000;
      for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt * (.05 + (i % 7) * .01); if (y > 5) y = 0; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t + i) * dt * .03); }
      p.needsUpdate = true;
      L.glow.material.opacity = S.f.act1done ? .03 : .1 + Math.sin(t * 1.3) * .04;
      if (L.crow) L.crow.rotation.y = .4 + Math.sin(t * .7) * .5;
      if (!S.f.zoyaSeen && !L.zoya.hidden && Math.hypot(P.x - L.zoya.x, P.z - L.zoya.z) < 6.5) {
        L.zoya.hidden = true; S.f.zoyaSeen = true; toastMsg = 'Девушка в фартуке оглядывается — и растворяется в тумане.'; toastT = 3.5;
      }
    }
  };

  // ======================================================================
  //                   ПАРОХОД «СВЯТАЯ МАРФА», 1926
  // ======================================================================
  LOC.boat = {
    fog: [0x1c2a40, 16, 150], walk: [], zones: [], lamps: [], blockers: [],
    build(L) {
      const G = L.group = new THREE.Group(); scene.add(G);
      let curLv = -1; const BL = (...a) => a.forEach(b => L.blockers.push(Object.assign({ lv: curLv }, b)));
      G.add(new THREE.HemisphereLight(0x7088b4, 0x1c1610, .2));
      // ---------- ночь над рекой: небо со звёздами, луна, живая вода ----------
      {
        const SKY = L.sky = new THREE.Group(); G.add(SKY);
        const skyT = canvasTex(8, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#02040a'); gr.addColorStop(.3, '#071020'); gr.addColorStop(.44, '#142238'); gr.addColorStop(.5, '#1c2a40'); gr.addColorStop(.56, '#121c2a'); gr.addColorStop(1, '#070a10'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
        { const sm = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false })); sm.renderOrder = -10; SKY.add(sm); }
        const sp = [], sc = []; for (let i = 0; i < 900; i++) { const a = Math.random() * Math.PI * 2, e = Math.asin(Math.pow(Math.random(), .7)) * .98 + .03; sp.push(Math.cos(a) * Math.cos(e) * 112, Math.sin(e) * 112, Math.sin(a) * Math.cos(e) * 112); const b = .4 + Math.random() * .6; sc.push(b, b, b * (.9 + Math.random() * .2)); }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
        SKY.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true, opacity: .9 })));
        const MOON = new THREE.Vector3(-.55, .32, -.77).normalize(); L.moonDir = MOON;
        const moonT = canvasTex(256, 256, (g, w) => { const c = w / 2; const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(255,250,230,1)'); gr.addColorStop(.12, 'rgba(250,244,222,1)'); gr.addColorStop(.135, 'rgba(200,210,235,.5)'); gr.addColorStop(.3, 'rgba(120,140,190,.16)'); gr.addColorStop(1, 'rgba(60,80,130,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
          g.fillStyle = 'rgba(190,180,160,.35)'; [[.47, .47, .025], [.53, .52, .018], [.5, .55, .012]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x * w, y * w, r * w, 0, 7); g.fill(); }); });
        const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonT, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
        moon.scale.set(44, 44, 1); moon.position.copy(MOON).multiplyScalar(105); SKY.add(moon);
        // вода: три слоя ряби, отражение неба по Френелю и лунная дорожка
        const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const cx = cv.getContext('2d'), im = cx.createImageData(S, S), H = new Float32Array(S * S);
        const WV = [[3, 1, .5, 0], [1, 4, .35, 1.3], [5, -2, .25, 2.1], [-3, 6, .18, .7], [9, 3, .1, 4], [2, 11, .08, 5.2], [13, -7, .06, 1.1], [-17, 5, .04, 2.6]];
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let h = 0; for (const [a, b, am, ph] of WV) h += am * Math.sin((a * x + b * y) / S * Math.PI * 2 + ph); H[y * S + x] = h; }
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = H[y * S + (x + 1) % S] - H[y * S + (x + S - 1) % S], dy = H[((y + 1) % S) * S + x] - H[((y + S - 1) % S) * S + x]; const nx = -dx * 2.4, ny = -dy * 2.4, l = Math.hypot(nx, ny, 1), i = (y * S + x) * 4; im.data[i] = (nx / l * .5 + .5) * 255; im.data[i + 1] = (ny / l * .5 + .5) * 255; im.data[i + 2] = (1 / l * .5 + .5) * 255; im.data[i + 3] = 255; }
        cx.putImageData(im, 0, 0); const nT = new THREE.CanvasTexture(cv); nT.wrapS = nT.wrapT = THREE.RepeatWrapping;
        L.seaMat = new THREE.ShaderMaterial({
          fog: true,
          uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tN: { value: null }, time: { value: 0 }, moon: { value: MOON }, deep: { value: lin('#03080e') }, hor: { value: lin('#1c2a40') }, zen: { value: lin('#071020') } }]),
          vertexShader: [
            'varying vec3 vW; varying vec2 vUv;',
            '#include <fog_pars_vertex>',
            'void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vUv = w.xz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;',
            '#include <fog_vertex>',
            '}'].join('\n'),
          fragmentShader: [
            'uniform sampler2D tN; uniform float time; uniform vec3 moon, deep, hor, zen; varying vec3 vW; varying vec2 vUv;',
            '#include <fog_pars_fragment>',
            'void main(){',
            ' vec3 a = texture2D(tN, vUv * .045 + vec2(time * .011, time * .006)).xyz * 2. - 1.;',
            ' vec3 b = texture2D(tN, vUv * .13 + vec2(-time * .017, time * .013)).xyz * 2. - 1.;',
            ' vec3 c = texture2D(tN, vUv * .4 + vec2(time * .03, -time * .021)).xyz * 2. - 1.;',
            ' vec3 n = normalize(vec3(a.x + b.x * .7 + c.x * .35, 3.2, a.y + b.y * .7 + c.y * .35));',
            ' vec3 V = normalize(cameraPosition - vW); vec3 R = reflect(-V, n); R.y = abs(R.y);',
            ' float fr = .02 + .98 * pow(1. - max(dot(V, n), 0.), 5.);',
            ' vec3 sky = mix(hor, zen, clamp(R.y * 2.2, 0., 1.));',
            ' float sp = pow(max(dot(R, moon), 0.), 420.) * 9. + pow(max(dot(R, moon), 0.), 40.) * .35;',
            ' vec3 col = mix(deep, sky, clamp(fr, 0., 1.)) + vec3(.95, .93, .85) * sp;',
            ' gl_FragColor = vec4(col, 1.);',
            '#include <fog_fragment>',
            '}'].join('\n')
        });
        L.seaMat.uniforms.tN.value = nT;
      }
      const deck = MT('deck', 3.2), deckDark = MT('deckdark', 3.2);
      const paneling = MT('panel', 2.4, { ns: .45 }), white = MT('hullwhite', 3), iron = M('#26241f', { m: .55, r: .5 });
      const salonW = MT('damask', 1.1), cabinW = MT('cabin', 2.4, { ns: .45, c: '#a8845f' });
      const sootW = MT('iron', 2.5), brass = M('#c9a050', { m: .85, r: .3 }), red = M('#7a1e1a', { r: .6 }), hullRed = MT('hullred', 3);
      // вода
      // вода с вырезом под корпус, чтобы не плескалась внутри трюма
      const ws = new THREE.Shape(); ws.moveTo(-170, -170); ws.lineTo(170, -170); ws.lineTo(170, 170); ws.lineTo(-170, 170); ws.lineTo(-170, -170);
      const hole = new THREE.Path(); hole.moveTo(-17.5, -3.2); hole.lineTo(12.5, -3.2); hole.quadraticCurveTo(16.9, -2.5, 18.7, 0); hole.quadraticCurveTo(16.9, 2.5, 12.5, 3.2); hole.lineTo(-17.5, 3.2); hole.quadraticCurveTo(-18.5, 0, -17.5, -3.2); ws.holes.push(hole);
      const wg = new THREE.ShapeGeometry(ws, 16); wg.rotateX(-Math.PI / 2);
      const water = new THREE.Mesh(wg, L.seaMat); water.position.set(BX, -1.4, 0); G.add(water);
      // корпус: контур в плане, выдавленный по высоте
      const hull = (y0, y1, mat, grow) => {
        const s = new THREE.Shape(), g = grow || 0;
        s.moveTo(-17.6 - g, -3.3 - g); s.lineTo(12.5, -3.3 - g); s.quadraticCurveTo(17, -2.6, 18.8 + g, 0); s.quadraticCurveTo(17, 2.6, 12.5, 3.3 + g); s.lineTo(-17.6 - g, 3.3 + g); s.quadraticCurveTo(-18.6 - g, 0, -17.6 - g, -3.3 - g);
        const geo = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false, curveSegments: 16 }); geo.rotateX(-Math.PI / 2);
        // крышки экструзии не рисуем — иначе они перекрывают палубы изнутри
        const m = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({ visible: false }), mat]); m.position.set(BX, y0, 0); G.add(m); return m;
      };
      hull(-3.5, -1.3, hullRed); hull(-1.3, -.21, white, .02);
      // фальшборт: невысокий белый борт по краю палубы
      for (const sd of [-1, 1]) box(G, 31, .25, .06, white, BX - 2.5, .1, sd * 3.33);
      // палубы
      box(G, 30, .2, 6.2, deckDark, BX, DY['-1'] - .1, 0);
      // проёмы под лестницы: A корма (−1↔0), B служебный трап в кочегарку, C парадная лестница в салон, D трап на мостик
      const HA = [BX - 13.95, BX - 12.15, 2.2, 3.05], HB = [BX + 1.1, BX + 1.9, -3.02, -2.35], HC = [BX - 9.75, BX - 7.55, 2.2, 3.05], HD = [BX + 7.55, BX + 9.6, 2.2, 3.05];
      slab(G, BX - 17.6, BX + 12.5, -3.3, 3.3, 0, .2, deck, [HA, HB]);
      { // нос и корма палубы повторяют обводы корпуса, а не торчат прямоугольником над водой
        const cap = s => { const g = new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: false, curveSegments: 14 }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, deck); m.position.set(BX, -.2, 0); G.add(m); };
        const a = new THREE.Shape(); a.moveTo(-17.6, -3.3); a.quadraticCurveTo(-18.6, 0, -17.6, 3.3); a.lineTo(-17.6, -3.3); cap(a);
        const b = new THREE.Shape(); b.moveTo(12.5, 3.3); b.quadraticCurveTo(17, 2.6, 18.8, 0); b.quadraticCurveTo(17, -2.6, 12.5, -3.3); b.lineTo(12.5, 3.3); cap(b);
      }
      slab(G, BX - 10.5, BX + 10.5, -3.3, 3.3, DY['1'], .2, deck, [HC, HD]);
      box(G, 3.7, .2, 6.6, deck, BX - 12.35, 2.5, 0); // крыша буфета там, где над ним нет верхней палубы
      box(G, 21.4, .2, 6.8, M('#3a3a40', { r: .7 }), BX, 5.2, 0);
      // потолки: крашеная вагонка, балки; в кочегарке — закопчённое железо, в трюме — тёмные доски
      const paintT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#cdbfa6'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(80,60,40,.22)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 2, 0, 1, h); } noise(g, w, h, 900, .05); }, 1, 1);
      const paintM = new THREE.MeshStandardMaterial({ map: paintT, roughness: .9, color: lin('#ddd4c4') }); paintM.userData.tile = 1.6;
      const beamM = M('#d8cfbc', { r: .7 }), sootC = M('#1c1a18', { r: .85, m: .3 });
      L.paintM = paintM;
      slab(G, BX - 15, BX - 5, -3.1, 3.1, -.22, .02, paintM, [HA]); slab(G, BX - 5, BX + 5, -3.1, 3.1, -.22, .02, sootC, [HB]); slab(G, BX + 5, BX + 15, -3.1, 3.1, -.22, .02, deckDark);
      for (let x = -14.4; x <= 14.4; x += 1.2) { if (x > -14 && x < -12.1) continue; box(G, .12, .12, 6.1, x < -5 ? beamM : x < 5 ? sootC : deckDark, BX + x, -.3, 0); }
      slab(G, BX - 14, BX + 7, -3.07, 3.07, 2.395, .015, paintM, [HC, HD]);
      slab(G, BX - 10.1, BX + 10.1, -3.15, 3.15, 5.095, .015, paintM);
      for (let x = -9.5; x <= 9.5; x += 1.6) box(G, .14, .14, 6.2, beamM, BX + x, 5.02, 0);
      // ===== нижняя палуба (−1): третий класс, кочегарка, трюм =====
      const y = DY['-1'];
      wallX(G, BX - 15, -3.1, 3.1, y, 2.3, sootW); wallX(G, BX + 15, -3.1, 3.1, y, 2.3, sootW);
      wallZ(G, -3.1, BX - 15, BX + 15, y, 2.3, sootW); wallZ(G, 3.1, BX - 15, BX + 15, y, 2.3, sootW);
      wallX(G, BX - 5, -3.1, 3.1, y, 2.3, sootW, [[-.5, .5]]); wallX(G, BX + 5, -3.1, 3.1, y, 2.3, sootW, [[-.5, .5]]);
      for (const sz of [-1, 1]) { const x0 = sz > 0 ? -11.9 : -14.7, w = -5.3 - x0, cx = BX + (x0 - 5.3) / 2; box(G, w, .08, .5, deckDark, cx, y + .45, sz * 2.6); box(G, w, .5, .06, deckDark, cx, y + .75, sz * 2.88); for (let x = x0 + .3; x < -5.4; x += 1.6) box(G, .06, .45, .45, deckDark, BX + x, y + .22, sz * 2.6); }
      {
        const green = M('#2e4a3c', { r: .7 }), cream = L.paintM;
        for (const sz of [-1, 1]) { box(G, 10, 1.0, .02, green, BX - 10, y + .5, sz * 3.05); box(G, 10, 1.3, .02, cream, BX - 10, y + 1.65, sz * 3.05); box(G, 10, .05, .03, M('#1e2a22', {}), BX - 10, y + 1.0, sz * 3.04); }
        box(G, .02, 1.0, 6.1, green, BX - 14.95, y + .5, 0); box(G, .02, 1.3, 6.1, cream, BX - 14.95, y + 1.65, 0);
        for (const sz of [-1, 1]) box(G, 10, 2.3, .02, deckDark, BX + 10, y + 1.15, sz * 3.05);
        const glassN = M('#1a2a40', { e: '#2a4060', ei: .5, r: .1, m: .3 }), ring = M('#9a7a3a', { m: .85, r: .35 });
        for (let x = -14; x <= 14; x += 2) { if (x > -5.5 && x < 5.5) continue; for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(.16, 18), glassN); c.position.set(BX + x, y + 1.55, sz * 3.035); c.rotation.y = sz > 0 ? Math.PI : 0; G.add(c); const r = new THREE.Mesh(new THREE.TorusGeometry(.17, .025, 6, 20), ring); r.position.copy(c.position); r.rotation.y = c.rotation.y; G.add(r); } }
      }
      // котёл и топка
      const boiler = cyl(G, 1.1, 1.1, 4, M('#6a5e54', { map: tex('iron.jpg', true), m: .55, r: .5 }), BX + 1.5, y + 1.15, 0, 28); boiler.rotation.z = Math.PI / 2;
      // бандажи с заклёпками, лицевая плита, манометр и трубы
      const bandM = M('#2a2622', { m: .7, r: .4 });
      for (let bx = -.35; bx <= 3.4; bx += .75) { const band = new THREE.Mesh(new THREE.TorusGeometry(1.115, .035, 6, 40), bandM); band.rotation.y = Math.PI / 2; band.position.set(BX + bx, y + 1.15, 0); G.add(band); }
      { const face = cyl(G, 1.13, 1.13, .08, bandM, BX - .5, y + 1.15, 0, 32); face.rotation.z = Math.PI / 2;
        for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const rv = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 4), bandM); rv.position.set(BX - .55, y + 1.15 + Math.sin(a) * 1.02, Math.cos(a) * 1.02); G.add(rv); }
        box(G, .06, .66, .86, M('#1a1714', { m: .6, r: .45 }), BX - .54, y + .7, 0);
        const g1 = cyl(G, .13, .13, .05, brass, BX - .6, y + 1.75, .45, 20); g1.rotation.z = Math.PI / 2;
        const gf = new THREE.Mesh(new THREE.CircleGeometry(.11, 20), M('#f0e8d4', { r: .4 })); gf.position.set(BX - .63, y + 1.75, .45); gf.rotation.y = -Math.PI / 2; G.add(gf);
        const nd = box(G, .01, .09, .012, M('#1a1a1a', {}), BX - .64, y + 1.77, .46); nd.rotation.x = .6;
        [[.45, 1.75], [-.45, 1.9]].forEach(([dz, hy]) => { cyl(G, .035, .035, 1.3, brass, BX - .2, y + hy + .65, dz, 10); });
      }
      L.fire = box(G, .05, .5, .7, M('#ff7a2a', { e: '#ff6a1a', ei: 2 }), BX - .53, y + .7, 0);
      L.lamps.push({ p: new THREE.Vector3(BX - 1, y + .8, 0), i: 1.2, d: 5, c: 0xff8a3a });
      cyl(G, .25, .25, 2.5, iron, BX + 2.5, y + 3.2, 0, 14);
      for (let i = 0; i < 26; i++) { const r = rnd(.12, .3), c = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), M('#141414', { r: .7, m: .2 })); c.position.set(BX - 3.6 + rnd(-.9, .9), y + r * .6 + rnd(0, .25), 2.3 + rnd(-.6, .6)); c.rotation.set(rnd(0, 3), rnd(0, 3), 0); G.add(c); }
      box(G, .9, .05, .9, iron, BX + 4.2, y + .02, -2.3);
      L.holdDoor = box(G, .06, 2.0, 1.0, M('#4a3a2a', { r: .8 }), BX + 5, y + 1, 0);
      box(G, .1, .14, .1, iron, BX + 4.95, y + 1.05, -.3);
      // трюм: ящики
      const crateM = MT('crate', .9);
      const lilyM = MT('cratelily', 0);
      [[7, -2.2], [7.8, -2.2], [7, 2.2], [9.5, 2.3], [13.5, -2], [13.5, -1.1], [13.5, 1.6], [14, 2.3], [8.4, 2.3]].forEach(([dx, dz], i) => { const s = rnd(.6, .8); box(G, s, s, s, crateM, BX + dx, y + s / 2, dz, rnd(-.2, .2)); if (i % 2) box(G, s * .8, s * .8, s * .8, crateM, BX + dx, y + s + s * .4, dz, rnd(-.3, .3)); BL({ x: BX + dx, z: dz }); });
      L.crates = [];
      [[11, -.9], [11, 0], [11, .9], [11.8, -.45], [11.8, .45]].forEach(([dx, dz]) => { const c = box(G, .7, .6, .6, lilyM, BX + dx, y + .3, dz, Math.PI / 2); L.crates.push(c); BL({ x: BX + dx, z: dz }); });
      // ===== средняя палуба (0) =====
      curLv = 0;
      const y0 = 0;
      wallX(G, BX - 14, -3.1, 3.1, y0, 2.4, paneling, [[-.55, .55]]); wallX(G, BX - 7, -3.1, 3.1, y0, 2.4, paneling, [[-.55, .55]]);
      wallX(G, BX + 7, -3.1, 3.1, y0, 2.4, paneling, [[-.55, .55]]);
      const bufW = [-13, -11.5, -10, -8.5].map(x => [BX + x - .4, BX + x + .4]);
      for (const sz of [-1, 1]) {
        wallZw(G, sz * 3.15, BX - 14, BX - 7, y0, 2.4, white, bufW, .9, 1.95); wallZ(G, sz * 3.15, BX - 7, BX + 7, y0, 2.4, white);
        wallZw(G, sz * 3.07, BX - 14, BX - 7, y0, 2.4, paneling, bufW, .9, 1.95); wallZ(G, sz * 3.07, BX - 7, BX + 7, y0, 2.4, cabinW);
      }
      L.winGlass = new THREE.MeshStandardMaterial({ color: lin('#6a8aa8'), roughness: .05, metalness: .2, transparent: true, opacity: .14, depthWrite: false });
      const winFrame = (x, z, yy, sill, top, mat) => { const w = .8; box(G, w + .1, .06, .2, mat, x, yy + sill, z); box(G, w + .1, .06, .12, mat, x, yy + top, z); for (const d of [-1, 1]) box(G, .06, top - sill, .12, mat, x + d * w / 2, yy + (sill + top) / 2, z); box(G, .03, top - sill, .05, mat, x, yy + (sill + top) / 2, z); const g = box(G, w, top - sill, .01, L.winGlass, x, yy + (sill + top) / 2, z); g.renderOrder = 2; };
      for (const sz of [-1, 1]) [-13, -11.5, -10, -8.5].forEach(x => winFrame(BX + x, sz * 3.11, y0, .9, 1.95, M('#3a2214', { r: .45 })));
      const cabX = [-7, -3.5, 0, 3.5];
      wallZ(G, -.75, BX - 7, BX + 7, y0, 2.4, L.paintM, cabX.map(x => [BX + x + 1.35, BX + x + 2.15]));
      wallZ(G, .75, BX - 7, BX + 7, y0, 2.4, L.paintM, cabX.map(x => [BX + x + 1.35, BX + x + 2.15]));
      wallX(G, BX - 14.06, -3.15, 3.15, y0, 2.4, white, [[-.55, .55]], .03); wallX(G, BX + 7.06, -3.15, 3.15, y0, 2.4, white, [[-.55, .55]], .03);
      cabX.slice(1).forEach(x => { wallX(G, BX + x, -3.1, -.75, y0, 2.4, cabinW); wallX(G, BX + x, .75, 3.1, y0, 2.4, cabinW); });
      // коридор кают: ковровая дорожка, плинтус и поручень между дверями, наличники, балки
      {
        const runner = canvasTex(512, 64, (g, w, h) => {
          g.fillStyle = '#5a1416'; g.fillRect(0, 0, w, h);
          g.fillStyle = '#7a2420'; for (let xx = 0; xx < w; xx += 32) { g.beginPath(); g.moveTo(xx + 4, h / 2); g.lineTo(xx + 16, h - 14); g.lineTo(xx + 28, h / 2); g.lineTo(xx + 16, 14); g.fill(); }
          g.fillStyle = '#b08a3c'; g.fillRect(0, 3, w, 3); g.fillRect(0, h - 6, w, 3); g.fillStyle = '#2a0a0a'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2);
        }, 8, 1);
        box(G, 14, .012, .95, M('#ffffff', { map: runner, r: .95 }), BX, y0 + .006, 0);
        const trimC = M('#3a2214', { r: .45 });
        const gaps = cabX.map(x => [BX + x + 1.35, BX + x + 2.15]);
        const segs = []; let x0 = BX - 7;
        gaps.forEach(([a, b]) => { segs.push([x0, a]); x0 = b; }); segs.push([x0, BX + 7]);
        for (const sz of [-1, 1]) {
          const zf = sz * .72;
          segs.forEach(([a, b]) => { if (b - a < .05) return; const cx = (a + b) / 2, w = b - a; for (const s2 of [1, -1]) box(G, w, .82, .02, paneling, cx, y0 + .54, sz * (.75 - s2 * .05)); box(G, w, .14, .03, trimC, cx, y0 + .07, zf); box(G, w, .05, .05, trimC, cx, y0 + .95, zf); box(G, w, .08, .03, trimC, cx, y0 + 2.32, zf); });
          gaps.forEach(([a, b]) => { box(G, .08, 2.15, .06, trimC, a - .04, y0 + 1.07, zf); box(G, .08, 2.15, .06, trimC, b + .04, y0 + 1.07, zf); box(G, b - a + .24, .1, .06, trimC, (a + b) / 2, y0 + 2.18, zf); });
        }
        for (let bx = -6.5; bx <= 6.5; bx += 1.75) box(G, .12, .1, 1.52, trimC, BX + bx, y0 + 2.36, 0);
      }
      // окна-иллюминаторы: тусклое свечение снаружи
      for (let x = -13; x <= 6; x += 1.75) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(.17, 16), M('#ffe2a8', { e: '#ffc870', ei: .7 })); w.position.set(BX + x, y0 + 1.5, sz * 3.2); w.rotation.y = sz > 0 ? 0 : Math.PI; G.add(w); }
      // каюты: койки и столики
      cabX.forEach(x => [-1, 1].forEach(sz => {
        if (!(x === 0 && sz < 0)) { box(G, 1.9, .45, .7, M('#5a3a22', { r: .7 }), BX + x + 1.75, y0 + .22, sz * 2.7);
        box(G, 1.8, .12, .62, M('#d8d0c0', { r: .9 }), BX + x + 1.75, y0 + .5, sz * 2.7); }
        box(G, .5, .04, .4, M('#5a3a22', { r: .6 }), BX + x + .45, y0 + .7, sz * 2.75);
        lamp(L, G, BX + x + 1.75, y0 + 2.15, sz * 1.9, { r: .07, i: .45, d: 3.2 });
      }));
      // буфет
      for (const [dx, dz] of [[-12, -1.5], [-12, 1.5], [-9.5, -1.6], [-9.5, 1.6]]) { cyl(G, .5, .5, .05, M('#5a3a22', { r: .5 }), BX + dx, y0 + .74, dz, 20); cyl(G, .05, .08, .72, iron, BX + dx, y0 + .36, dz, 8); cyl(G, .05, .05, .02, M('#f4f0e8', {}), BX + dx + .2, y0 + .78, dz, 10); BL({ x: BX + dx, z: dz }); }
      box(G, .6, 1.0, 2.2, M('#4a2c18', { r: .6 }), BX - 13.4, y0 + .5, -1.9);
      lamp(L, G, BX - 10.5, y0 + 2.2, 0, { r: .12, i: .9, d: 6 }); lamp(L, G, BX - 3.5, y0 + 2.2, 0, { r: .08, i: .6, d: 4 }); lamp(L, G, BX + 3.5, y0 + 2.2, 0, { r: .08, i: .6, d: 4 });
      // корма и нос: леера, бухты, кнехты, якорь
      {
        const capM = M('#7a5030', { r: .5 }), postM = M('#e8e2d4', { r: .6 });
        const rl = (ax, az, bx, bz) => { const L2 = Math.hypot(bx - ax, bz - az), a = Math.atan2(bz - az, bx - ax); const c = box(G, L2 + .08, .07, .12, capM, (ax + bx) / 2, y0 + 1.0, (az + bz) / 2); c.rotation.y = -a; for (const hh of [.35, .65]) { const w = box(G, L2, .025, .025, postM, (ax + bx) / 2, y0 + hh, (az + bz) / 2); w.rotation.y = -a; } const n = Math.max(1, Math.round(L2 / 1.1)); for (let k = 0; k <= n; k++) cyl(G, .03, .035, 1.0, postM, ax + (bx - ax) * k / n, y0 + .5, az + (bz - az) * k / n, 8); };
        // корма — по скруглённому контуру, нос — сходится к форштевню
        const sternP = [[-14, 3.2], [-17.5, 3.2], [-17.85, 1.6], [-17.98, 0], [-17.85, -1.6], [-17.5, -3.2], [-14, -3.2]];
        for (let i = 0; i < sternP.length - 1; i++) rl(BX + sternP[i][0], sternP[i][1], BX + sternP[i + 1][0], sternP[i + 1][1]);
        const bowP = [[7, 3.2], [12.5, 3.2], [14.5, 2.74], [16.7, 2.05], [17.5, 1.1], [18.55, 0], [17.5, -1.1], [16.7, -2.05], [14.5, -2.74], [12.5, -3.2], [7, -3.2]];
        for (let i = 0; i < bowP.length - 1; i++) rl(BX + bowP[i][0], bowP[i][1], BX + bowP[i + 1][0], bowP[i + 1][1]);
        // спасательные круги
        const lifeT = canvasTex(128, 8, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f2eee4' : '#b8261c'; g.fillRect(i * w / 8, 0, w / 8, h); } });
        const lifeM = new THREE.MeshStandardMaterial({ map: lifeT, roughness: .7 });
        [[-16.4, 3.12, 0], [-16.4, -3.12, Math.PI], [11, 3.12, 0], [11, -3.12, Math.PI]].forEach(([x, z, r]) => { const lr = new THREE.Mesh(new THREE.TorusGeometry(.3, .07, 10, 24), lifeM); lr.position.set(BX + x, y0 + .7, z + (z > 0 ? .1 : -.1)); lr.rotation.y = r; G.add(lr); });
      }
      lamp(L, G, BX - 15.6, 2.2, 0, { post: true, i: .8, d: 6 }); lamp(L, G, BX + 11, 2.2, 0, { post: true, i: .7, d: 6 });
      const rope = new THREE.Mesh(new THREE.TorusGeometry(.32, .08, 8, 20), M('#a08a60', { r: 1 })); rope.rotation.x = Math.PI / 2; rope.position.set(BX - 16.2, y0 + .08, 2.2); G.add(rope);
      cyl(G, .35, .45, .7, iron, BX + 10, y0 + .35, 0, 16); BL({ x: BX + 10, z: 0 });
      // гребные колёса по бортам
      for (const sz of [-1, 1]) {
        const wh = new THREE.Group(); wh.position.set(BX, .6, sz * 3.75); G.add(wh);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(2.1, .06, 6, 30), red); wh.add(rim);
        for (let i = 0; i < 10; i++) { const p = box(wh, .12, 2.1, .5, M('#5a3a22', {}), 0, 0, 0); p.rotation.z = i / 10 * Math.PI * 2; p.geometry.translate(0, 1.05, 0); }
        box(G, 4.8, 2.6, .9, white, BX, 1.3, sz * 3.85).scale.set(1, 1, 1);
        (L.wheels = L.wheels || []).push(wh);
      }
      // ===== верхняя палуба (1): салон, каюта капитана, мостик =====
      curLv = 1;
      const y1 = DY['1'];
      wallX(G, BX - 10, -3.1, 3.1, y1, 2.5, salonW); wallX(G, BX + 1, -3.1, 3.1, y1, 2.5, salonW, [[-.55, .55]]);
      wallX(G, BX + 6, -3.1, 3.1, y1, 2.5, paneling, [[-.55, .55]]);
      const upX = [-9, -7.5, -6, -4.5, -3, -1.5, 0, 2.5, 4, 5.3], upW = upX.map(x => [BX + x - .4, BX + x + .4]).concat([[BX + 6.9, BX + 9.6]]);
      for (const sz of [-1, 1]) {
        wallZw(G, sz * 3.1, BX - 10, BX + 1, y1, 2.5, salonW, upW.filter(w => w[1] <= BX + 1), .85, 2.05);
        wallZw(G, sz * 3.1, BX + 1, BX + 10, y1, 2.5, paneling, upW.filter(w => w[0] >= BX + 1), .85, 2.05);
        wallZw(G, sz * 3.17, BX - 10.1, BX + 10.1, y1, 2.5, white, upW, .85, 2.05);
      }
      wallX(G, BX - 10.1, -3.17, 3.17, y1, 2.5, white);
      // лоб рубки: внизу глухо, выше — сплошное остекление мостика
      box(G, .08, 1.15, 6.34, white, BX + 10.1, y1 + .575, 0); box(G, .08, .28, 6.34, white, BX + 10.1, y1 + 2.36, 0);
      for (const sz of [-1, 1]) { upX.forEach(x => winFrame(BX + x, sz * 3.135, y1, .85, 2.05, x < 1 ? M('#4a2616', { r: .45 }) : M('#3a2214', { r: .45 }))); box(G, 2.7, .06, .2, M('#3a2214', { r: .45 }), BX + 8.25, y1 + .85, sz * 3.135); box(G, 2.7, .06, .12, M('#3a2214', { r: .45 }), BX + 8.25, y1 + 2.05, sz * 3.135); }
      // салон: рояль, карточный стол, диваны, люстра
      box(G, 1.4, .25, 1.1, M('#141012', { r: .3, m: .2 }), BX - 8.8, y1 + .8, -2.3); box(G, 1.4, .7, .25, M('#141012', { r: .3 }), BX - 8.8, y1 + .35, -2.8);
      box(G, 1.2, .05, .2, M('#efe8d8', {}), BX - 8.8, y1 + .94, -1.85);
      INSPECT.push({ id: 'piano', x: BX - 8.8, z: -1.5, r: .9, loc: 'boat', lv: 1 }); BL({ x: BX - 8.8, z: -2.3 }, { x: BX - 8.3, z: -2.3 }, { x: BX - 9.3, z: -2.3 });
      cyl(G, .55, .55, .05, M('#2a5a3a', { r: .9 }), BX - 5, y1 + .74, -1, 24); cyl(G, .06, .1, .72, M('#3a2414', {}), BX - 5, y1 + .36, -1, 8); BL({ x: BX - 5, z: -1 });
      for (let i = 0; i < 8; i++) box(G, .05, .005, .08, M('#f4f0e8', {}), BX - 5 + rnd(-.3, .3), y1 + .775, -1 + rnd(-.3, .3), rnd(0, 3));
      for (const sz of [-1, 1]) box(G, 2.2, .45, .7, M('#6a1e24', { r: .9 }), BX - 2.5, y1 + .22, sz * 2.6);
      lamp(L, G, BX - 5, y1 + 2.15, -.5, { r: .18, i: 1.1, d: 7, hang: .2 });
      lamp(L, G, BX - 1.5, y1 + 2.15, 1.5, { r: .1, i: .6, d: 5 });
      // каюта капитана: стол, сейф, койка
      box(G, 1.4, .75, .7, M('#4a2c18', { r: .55 }), BX + 3, y1 + .375, 2.5); box(G, .4, .03, .3, M('#ece4d0', {}), BX + 3.2, y1 + .765, 2.45);
      BL({ x: BX + 2.6, z: 2.5 }, { x: BX + 3.4, z: 2.5 });
      const safe = box(G, .6, .8, .55, M('#2f3b33', { m: .6, r: .45 }), BX + 5.4, y1 + .4, -2.6); cyl(G, .07, .07, .03, brass, BX + 5.4, y1 + .55, -2.31, 16).rotation.x = Math.PI / 2;
      BL({ x: BX + 5.4, z: -2.6 });
      box(G, 2, .45, .8, M('#5a3a22', {}), BX + 2.2, y1 + .22, -2.6);
      lamp(L, G, BX + 3.5, y1 + 2.15, 0, { r: .09, i: .7, d: 4.5 });
      // мостик: штурвал, нактоуз, журнал
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(.45, .04, 8, 24), M('#5a3a22', { r: .5 })); wheel.position.set(BX + 9.2, y1 + 1.2, 0); wheel.rotation.y = Math.PI / 2; G.add(wheel);
      for (let i = 0; i < 8; i++) { const sp = box(G, .03, .95, .03, M('#5a3a22', {}), BX + 9.2, y1 + 1.2, 0); sp.rotation.x = i / 8 * Math.PI; }
      cyl(G, .12, .16, 1, M('#5a3a22', {}), BX + 9.4, y1 + .5, 0, 10); BL({ x: BX + 9.3, z: 0 });
      cyl(G, .18, .22, 1.1, brass, BX + 8.2, y1 + .55, -1.4, 14); BL({ x: BX + 8.2, z: -1.4 });
      box(G, .5, 1.05, .4, M('#4a2c18', {}), BX + 7, y1 + .52, 2.2); box(G, .42, .04, .32, M('#e8e0c8', {}), BX + 7, y1 + 1.07, 2.2); BL({ x: BX + 7, z: 2.2 });
      lamp(L, G, BX + 8, y1 + 2.15, 0, { r: .08, i: .45, d: 4, c: '#9ad0ff', hex: 0xa8c8e8 });
      // окна мостика: нижняя панель, стёкла в рамах с туманом за ними
      box(G, .06, 1.15, 6.1, paneling, BX + 9.94, y1 + .58, 0);
      const glass = L.winGlass;
      box(G, .03, 1.0, 6.1, glass, BX + 9.95, y1 + 1.7, 0);
      for (let z = -3; z <= 3.01; z += 1) box(G, .07, 1.05, .06, paneling, BX + 9.92, y1 + 1.7, z);
      box(G, .07, .08, 6.1, paneling, BX + 9.92, y1 + 2.22, 0); box(G, .07, .08, 6.1, paneling, BX + 9.92, y1 + 1.18, 0);
      for (const sd of [-1, 1]) { box(G, 2.6, 1.0, .03, glass, BX + 8.2, y1 + 1.7, sd * 3.04); }
      // трубы и мачта
      for (const dx of [-3, .8]) { cyl(G, .55, .6, 4.2, M('#1a1a1a', { r: .6 }), BX + dx, 7.3, 0, 22); cyl(G, .62, .62, .4, red, BX + dx, 8.9, 0, 22); }
      cyl(G, .07, .09, 9, M('#3a2a1a', {}), BX + 13, 4.5, 0, 8); lamp(L, G, BX + 13, 8.6, 0, { r: .12, i: .3, d: 4 });
      {
        const ropeM = M('#2a2420', { r: .9 }), wood = M('#4a3220', { r: .6 });
        const line = (a, b, r) => { const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz), m = new THREE.Mesh(new THREE.CylinderGeometry(r || .012, r || .012, l, 4), ropeM); m.position.set(a[0] + dx / 2, a[1] + dy / 2, a[2] + dz / 2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / l, dy / l, dz / l)); G.add(m); };
        const V3 = (x, yy, z) => [BX + x, yy, z];
        // кормовая мачта, ванты к бортам, штаги между мачтами и к форштевню
        cyl(G, .06, .08, 8.5, M('#3a2a1a', {}), BX - 12, 6.6, 0, 8); box(G, .05, .05, 2.2, wood, BX - 12, 8.6, 0); box(G, .05, .05, 2.6, wood, BX + 13, 7.4, 0);
        for (const sz of [-1, 1]) { line(V3(13, 8.4, 0), V3(12.4, 1.0, sz * 3.15)); line(V3(13, 8.4, 0), V3(13.8, 1.0, sz * 3.0)); line(V3(-12, 10.4, 0), V3(-12.6, 5.3, sz * 3.3)); line(V3(-12, 10.4, 0), V3(-11.4, 5.3, sz * 3.3)); }
        line(V3(13, 8.9, 0), V3(18.4, 1.0, 0)); line(V3(13, 8.9, 0), V3(-12, 10.8, 0)); line(V3(-12, 10.8, 0), V3(-17.9, 1.0, 0));
        // ходовые огни: красный слева, зелёный справа, белый на мачте
        for (const [sz, c] of [[-1, '#ff2a1a'], [1, '#2aff6a']]) { box(G, .25, .3, .2, M('#1a1a1a', { m: .5, r: .5 }), BX + 9.9, 3.9, sz * 3.3); const s = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), M(c, { e: c, ei: 3 })); s.position.set(BX + 10.02, 3.9, sz * 3.3); G.add(s); }
        // шлюпки на шлюпбалках по бортам верхней палубы
        const boatW = M('#ece6da', { r: .6 }), cover = M('#a89a7a', { r: .95 }), davit = M('#d8d2c4', { r: .55, m: .2 });
        const hullG = new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), topG = new THREE.SphereGeometry(1, 20, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        for (const sz of [-1, 1]) for (const bx of [-6.5, -1.5, 4]) {
          const hb = new THREE.Mesh(hullG, boatW); hb.scale.set(2.1, .42, .62); hb.position.set(BX + bx, 6.05, sz * 3.0); G.add(hb);
          const tp = new THREE.Mesh(topG, cover); tp.scale.set(2.05, .14, .6); tp.position.set(BX + bx, 6.05, sz * 3.0); G.add(tp);
          for (const dx of [-1.7, 1.7]) { cyl(G, .045, .05, 1.5, davit, BX + bx + dx, 6.05, sz * 2.6, 8); const arm = cyl(G, .04, .04, .55, davit, BX + bx + dx, 6.8, sz * 2.82, 8); arm.rotation.x = sz * Math.PI / 2; line(V3(bx + dx, 6.8, sz * 3.08), V3(bx + dx * .85, 6.2, sz * 3.0), .008); }
          for (const dz of [-1, 1]) box(G, .12, .55, .1, davit, BX + bx + dz * 1.2, 5.55, sz * 3.0);
        }
        // название на кожухах гребных колёс
        const nameT = canvasTex(512, 96, (g, w, h) => { g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a2436'; g.font = 'bold 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('СВЯТАЯ МАРФА', w / 2, h / 2 + 2); g.strokeStyle = '#b08a3c'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12); });
        for (const sz of [-1, 1]) { const nm = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .6), new THREE.MeshStandardMaterial({ map: nameT, roughness: .6 })); nm.position.set(BX, 2.1, sz * 4.31); nm.rotation.y = sz > 0 ? 0 : Math.PI; G.add(nm); }
        // колокол на носу
        const bell = new THREE.Mesh(new THREE.CylinderGeometry(.09, .17, .26, 16, 1, true), M('#c9a050', { m: .85, r: .3 })); bell.position.set(BX + 13.3, 2.0, 0); bell.material.side = THREE.DoubleSide; G.add(bell);
        box(G, .5, .05, .05, M('#3a2a1a', {}), BX + 13.3, 2.18, 0);
        // дым из труб
        const smokeT = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(.5, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
        L.smoke = [];
        for (const dx of [-3, .8]) for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, color: 0x3a3c44, transparent: true, depthWrite: false, opacity: 0 })); s.userData = { x: BX + dx, ph: i / 14 }; G.add(s); L.smoke.push(s); }
      }
      // трапы и лестницы
      {
        const grate = M('#3a3632', { m: .6, r: .55 }), teak = M('#6a4426', { r: .55 }), mahog = M('#4a2616', { r: .45 });
        // A: корма, трап из третьего класса в буфет
        stair(G, BX - 13.9, BX - 12.2, 2.65, y, 0, .78, { tread: grate, side: iron, rail: iron });
        // C: парадная лестница из буфета в салон — красное дерево, ковёр, латунные поручни
        stair(G, BX - 9.7, BX - 7.6, 2.65, y0, DY['1'], .8, { tread: mahog, riser: M('#5a1416', { r: .9 }), side: mahog, rail: brass });
        // D: трап с носовой палубы на мостик
        stair(G, BX + 7.6, BX + 9.5, 2.65, y0, DY['1'], .78, { tread: teak, side: teak, rail: iron });
        // ограждения проёмов наверху: со стороны прохода и с торца, где не сходят
        const well = (h, yy, mat, cap) => {
          const [x0, x1, z0] = h; box(G, x1 - x0, .05, .05, cap || mat, (x0 + x1) / 2, yy + 1.0, z0 + .03); box(G, x1 - x0, .03, .03, mat, (x0 + x1) / 2, yy + .5, z0 + .03);
          const n = Math.round((x1 - x0) / .25); for (let k = 0; k <= n; k++) cyl(G, .018, .022, 1.0, mat, x0 + (x1 - x0) * k / n, yy + .5, z0 + .03, 6);
          box(G, x1 - x0 + .06, .1, .06, mat, (x0 + x1) / 2, yy + .05, z0 + .01);
          box(G, .05, 1.0, .85, mat, x0 + .03, yy + .5, 2.62);
        };
        well(HA, 0, iron); well(HC, DY['1'], mahog, brass); well(HD, DY['1'], iron);
        // B: служебный трап в кочегарку — вертикальная железная лестница и люк в полу каюты
        for (const dx of [-.3, .3]) box(G, .05, 2.6, .05, iron, BX + 1.5 + dx, y + 1.3, -2.85);
        for (let k = 0; k < 8; k++) cyl(G, .016, .016, .6, iron, BX + 1.5, y + .3 + k * .29, -2.85, 6).rotation.z = Math.PI / 2;
        box(G, .9, .08, .08, iron, BX + 1.5, y0 + .04, -2.32); box(G, .08, .08, .7, iron, BX + 1.07, y0 + .04, -2.68); box(G, .08, .08, .7, iron, BX + 1.93, y0 + .04, -2.68);
        const lid = box(G, .8, .04, .66, M('#2e2a26', { m: .5, r: .5 }), BX + 1.5, y0 + .3, -2.05); lid.rotation.x = -1.15;
        // блокеры вдоль проёмов и под лестницами
        for (let x = -13.8; x <= -12.15; x += .4) BL({ x: BX + x, z: 2.62, lv: 0 });
        for (let x = -9.6; x <= -7.55; x += .4) { BL({ x: BX + x, z: 2.62, lv: 0 }); BL({ x: BX + x, z: 2.62, lv: 1 }); }
        for (let x = 7.7; x <= 9.55; x += .4) { BL({ x: BX + x, z: 2.62, lv: 0 }); BL({ x: BX + x, z: 2.62, lv: 1 }); }
      }
      const I = (id, x, z, lv, r) => INSPECT.push({ id, x, z, r: r || 1.1, loc: 'boat', lv });
      I('ladderUp_1', BX - 14.1, 1.9, -1); I('ladderDown0', BX - 13.2, 2.3, 0);
      I('ladderStoker', BX + 1.5, -2.0, -1); I('ladderK0', BX + 1.5, -1.7, 0, .8);
      I('stairsUp0', BX - 9.6, 2.1, 0); I('stairsDown1', BX - 7.9, 2.1, 1);
      I('bowUp0', BX + 7.9, 2.1, 0); I('bowDown1', BX + 9.2, 2.0, 1);
      I('safeB', BX + 5.3, -2.0, 1, 1.0); I('safeLocked', BX + 5.3, -2.0, 1, 1.0); I('safeDoor', BX + 4.9, -2.1, 1, 1.0);
      I('manifest', BX + 3.1, 1.9, 1, 1.0); I('vahta', BX + 7, 1.7, 1, 1.0); I('karrB', BX + 5.5, .4, 1, 1.0);
      I('coalPit', BX + 4.2, -2.2, -1, 1.0); I('holdDoor', BX + 4.6, 0, -1, .9); I('crates', BX + 10.3, 0, -1, 1.4);
      I('stern', BX - 16.6, -1.8, 0, 1.2);
      // ---------- люди ----------
      const N = (id, place, look, lv, opt) => addNPC(id, place, look, Object.assign({ loc: 'boat', lv, fy: DY[String(lv)] }, opt || {}));
      const sit = (x, z, face, sy) => ({ x, z, face, seatY: sy || .45, pose: 'sit' });
      const chair = (x, z, ry, yy) => { box(G, .42, .05, .42, M('#5a3a22', { r: .6 }), x, yy + .43, z); box(G, .42, .45, .05, M('#5a3a22', { r: .6 }), x - Math.sin(ry) * .2, yy + .68, z - Math.cos(ry) * .2); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(G, .04, .43, .04, M('#3a2414', {}), x + a * .18, yy + .21, z + b * .18)); };
      chair(BX - 5.62, -1, Math.PI / 2, DY['1']); chair(BX - 4.38, -1, -Math.PI / 2, DY['1']); chair(BX - 5, -1.62, 0, DY['1']); chair(BX - 5, -.38, Math.PI, DY['1']); chair(BX - 9.5, -2.1, 0, 0);
      const LK = {
        lykov: { coat: '#1a2436', pants: '#1a2436', buttons: true, belt: '#1a1a1a', hat: 'clerk', hatC: '#18202e', beard: 'full', beardC: '#c8c2b6', hair: '#bdb6aa', skin: '#e2b08e', heavy: true, boots: true, eyeC: '#46586a' },
        stepan: { coat: '#3a3430', coatTex: 'sack', pants: '#2a2622', boots: true, hair: '#2a1e16', hairStyle: 'messy', skin: '#b88a66', prop: 'shovel' },
        okunev: { coat: '#5a4a3a', vest: '#4a3a2a', shirtFront: true, lapels: true, tie: '#6a2a2a', collar: '#ece6da', pants: '#3a3028', hair: '#3a2a1c', hairStyle: 'slick', beard: 'moust', beardC: '#3a2a1c', skin: '#efc6a6', heavy: true, eyeC: '#5a4a32' },
        bragin: { coat: '#2a2626', pants: '#2a2626', belt: '#4a2a1a', boots: true, hat: 'cap', hatC: '#262222', hair: '#2a2420', skin: '#e0b090', eyeC: '#3a3a3a' },
        lidia: { female: true, coat: '#3a1a3a', skirt: '#3a1a3a', stole: '#e8e0d0', hair: '#141010', hairStyle: 'bob', skin: '#f4d6c4', lips: '#a8242c', stockings: '#1a1418', eyeC: '#3a5a4a' },
        koch: { coat: '#3a3a40', vest: '#2a2a30', shirtFront: true, collar: '#ece6da', pants: '#2a2a30', hair: '#e2ded6', hairStyle: 'side', glasses: true, skin: '#efd0ba', prop: 'book', eyeC: '#5a5a4a' }
      };
      L.np = {
        lykovA: N('lykov', sit(BX + 3, 1.75, '+z'), Object.assign({ armPose: 'lap' }, LK.lykov), 1),
        lykovB: N('lykov', standAt(BX + 8.6, .9, '+x'), Object.assign({ handsBehind: true }, LK.lykov), 1),
        stepanA: N('stepan', standAt(BX - 1.5, 0, '+x'), LK.stepan, -1),
        stepanC: N('stepan', standAt(BX + .4, -1.4, '-x'), Object.assign({}, LK.stepan, { prop: 'bag' }), 1),
        okunevA: N('okunev', sit(BX - 5.25, -2.5, '+z', .56), LK.okunev, 0),
        okunevB: N('okunev', standAt(BX - 16.1, 0, '+x'), Object.assign({ handsBehind: true }, LK.okunev), 0),
        braginA: N('bragin', sit(BX - 5, -1.62, '+z'), Object.assign({ armPose: 'lap' }, LK.bragin), 1),
        braginB: N('bragin', standAt(BX - 15.1, 1.3, '-x'), Object.assign({ handsBehind: true }, LK.bragin), 0),
        lidia: N('lidia', standAt(BX - 8.1, -1.25, '+x'), LK.lidia, 1),
        koch: N('koch', sit(BX - 1.75, -2.5, '+z', .56), LK.koch, 0)
      };
      L.np.lykovB.hidden = true; L.np.stepanC.hidden = true; L.np.okunevB.hidden = true; L.np.braginB.hidden = true;
      [['lidia', BX - 8.1, -1.25, 1], ['lykovB', BX + 8.6, .9, 1], ['stepanA', BX - 1.5, 0, -1]].forEach(([k, x, z, lv]) => BL({ x, z, k, lv }));
      let sd = 300;
      const X = (place, look, lv, bark, name) => N('x' + (sd++), place, look, lv, { bark, name });
      X(sit(BX - 5.62, -1, '+x'), richM(sd, { prop: 'paper' }), 1, 'card1926', 'Игрок в преферанс');
      X(sit(BX - 4.38, -1, '-x'), richM(sd, { beard: 'full' }), 1, 'card1926', 'Игрок в преферанс');
      X(sit(BX - 5, -.38, '-z'), richM(sd), 1, 'card1926', 'Игрок в преферанс');
      X(sit(BX - 2.7, 2.5, '-z'), richF(sd), 1, 'richF', 'Дама в салоне');
      X(sit(BX - 12.6, -2.45, '+z'), peasantM(sd, { prop: 'bread' }), -1, 'third', 'Пассажир третьего класса');
      X(sit(BX - 10.4, -2.45, '+z'), peasantF(sd), -1, 'third', 'Пассажирка');
      X(sit(BX - 8.2, 2.45, '-z'), peasantM(sd, { sleep: true }), -1, 'sleeper', 'Спящий');
      X(sit(BX - 11.4, 2.45, '-z'), peasantF(sd), -1, 'third', 'Пассажирка');
      X(sit(BX - 6.6, -2.45, '+z'), peasantM(sd), -1, 'third', 'Пассажир');
      X(standAt(BX - 13.1, -2.4, '+x'), { coat: '#f2efe8', pants: '#2a2a2a', apron: true, hair: '#3a2a20', beard: 'moust', skin: '#e8b996' }, 0, 'buffet', 'Буфетчик');
      X(sit(BX - 9.5, -2.1, '+z'), richM(sd, { prop: 'cup' }), 0, 'rich', 'Пассажир в буфете');
      X(standAt(BX + 12.2, 1.8, '-x'), { coat: '#1e2a3e', pants: '#1e2a3e', hat: 'cap', hatC: '#1e2a3e', beard: 'trim', skin: '#d8a47c' }, 0, 'sailor', 'Матрос');
      X(sit(BX + 5.25, 2.5, '-z', .56), peasantM(sd, { sleep: true }), 0, 'sleeper', 'Спящий пассажир');
      // ---------- проходимые области ----------
      const W = [];
      // нижняя палуба
      W.push([BX - 14.75, BX - 5.2, -2.2, 2.2, -1], [BX - 5.35, BX - 4.65, -.45, .45, -1]);
      W.push([BX - 4.8, BX - .75, -2.8, 2.8, -1], [BX - .75, BX + 4.8, -2.8, -1.25, -1], [BX - .75, BX + 4.8, 1.25, 2.8, -1], [BX + 3.6, BX + 4.8, -2.8, 2.8, -1]);
      W.push([BX + 4.65, BX + 5.35, -.45, .45, -1], [BX + 5.2, BX + 14.75, -2.8, 2.8, -1]);
      // средняя палуба
      W.push([BX - 17.1, BX - 14.15, -2.95, 2.95, 0], [BX - 14.4, BX - 13.6, -.48, .48, 0], [BX - 13.85, BX - 7.15, -2.85, 2.85, 0], [BX - 7.4, BX - 6.6, -.48, .48, 0]);
      W.push([BX - 6.85, BX + 6.85, -.6, .6, 0], [BX + 6.6, BX + 7.4, -.48, .48, 0], [BX + 7.15, BX + 13.6, -2.95, 2.95, 0], [BX + 13.6, BX + 16.5, -1.6, 1.6, 0]);
      cabX.forEach(x => { W.push([BX + x + .18, BX + x + 3.32, -2.25, -.9, 0], [BX + x + .18, BX + x + 3.32, .9, 2.25, 0], [BX + x + 1.38, BX + x + 2.12, -1.0, -.5, 0], [BX + x + 1.38, BX + x + 2.12, .5, 1.0, 0]); });
      // верхняя палуба
      W.push([BX - 9.8, BX + .85, -2.85, 2.85, 1], [BX + .7, BX + 1.3, -.48, .48, 1], [BX + 1.15, BX + 5.85, -2.85, 2.85, 1], [BX + 5.7, BX + 6.3, -.48, .48, 1], [BX + 6.15, BX + 9.75, -2.7, 2.7, 1]);
      worldUV(G); L.merged = mergeStatic(G, L, [L.paintM]);
      L.walk = W;
      L.zones = [
        [BX - 16, BX - 5, 'Третий класс', -1], [BX - 5, BX + 5, 'Кочегарка', -1], [BX + 5, BX + 16, 'Трюм', -1],
        [BX - 18, BX - 14, 'Корма', 0], [BX - 14, BX - 7, 'Буфет', 0], [BX - 7, BX + 7, 'Средняя палуба, каюты', 0], [BX + 7, BX + 19, 'Носовая палуба', 0],
        [BX - 10, BX + 1, 'Салон первого класса', 1], [BX + 1, BX + 6, 'Каюта капитана', 1], [BX + 6, BX + 11, 'Мостик', 1]
      ];
    },
    block(x, z) {
      // дверь в трюм заперта, пока не добыт ключ или не пролез через яму
      if ((P.lv || 0) === -1 && !S.f.b_holdOpen && x > BX + 4.6 && x < BX + 5.4 && Math.abs(z) < .5) return true;
      return false;
    },
    enter(L) {
      if (!S.f.b_started) { S.f.b_started = true; S.time = -120; resetBoat(L); place(BX - 1.75, 1.9, 0, 0); setTimeout(() => startScene('boatIntro'), 500); }
      else place(BX - 1.75, 1.9, 0, 0);
    },
    tick(L, dt) {
      const busy = D.on || endEl.classList.contains('on') || noteEl.classList.contains('on') || sandOn || ['fight', 'cards', 'band', 'keypad'].some(id => document.getElementById(id).classList.contains('on'));
      const t = performance.now() / 1000;
      (L.wheels || []).forEach(w => { w.rotation.z = Math.sin(t * .2) * .05; });
      if (L.seaMat) L.seaMat.uniforms.time.value = t;
      if (L.sky) L.sky.position.copy(camera.position);
      (L.smoke || []).forEach(s => { const u = (t * .07 + s.userData.ph) % 1; s.position.set(s.userData.x - u * 9, 9.3 + u * 4.5, Math.sin(u * 6 + s.userData.ph * 20) * .4 * u); const k = .9 + u * 4.2; s.scale.set(k, k, 1); s.material.opacity = Math.min(1, u * 6) * (1 - u) * .55; });
      L.fire.material.emissiveIntensity = 1.6 + Math.sin(t * 9) * .3 + Math.sin(t * 23) * .2;
      L.holdDoor.visible = !S.f.b_holdOpen;
      L.crates.forEach(c => { c.visible = !S.f.b_sand; });
      if (S.f.b_solved) { document.getElementById('eye').style.display = 'none'; return; }
      if (!busy) S.time += dt / 3;
      const np = L.np, tm = S.time;
      // 22:50 капитан уходит на мостик
      const gone = tm >= -70; if (gone !== !!S.f.b_lykovGone) { S.f.b_lykovGone = gone; derive(); }
      np.lykovA.hidden = gone; np.lykovB.hidden = !gone;
      // 22:30–22:50 Степан таскает золото из каюты капитана
      const carry = tm >= -90 && tm < -70;
      np.stepanC.hidden = !carry; np.stepanA.hidden = carry;
      if (carry && (P.lv || 0) === 1 && !S.f.sawStepan && Math.hypot(P.x - np.stepanC.x, P.z - np.stepanC.z) < 5) { addClue('sawStepan'); toastMsg = 'Кочегар Степан тащит из каюты капитана тяжёлый ящик!'; toastT = 3.5; }
      // 01:00 скандал, 01:15 арест
      if (tm >= 60 && !S.f.b_scandal) { S.f.b_scandal = true; toastMsg = 'Из салона доносится шум: Окунев требует своё золото!'; toastT = 3.5; }
      if (tm >= 75 && !S.f.b_arrest && !busy) startScene('boatArrest');
      const arr = !!S.f.b_arrest;
      np.okunevA.hidden = arr; np.okunevB.hidden = !arr; np.braginA.hidden = tm >= 60; np.braginB.hidden = !arr;
      // рассвет — выстрел на корме
      if (tm >= (S.f.b_extra ? 360 : 300) && !busy) startScene('boatDawn');
      // Степан у топки: то кидает уголь (спиной к яме), то оглядывается
      const ph = (t % 9) < 4.6; L.stokerBusy = ph;
      const st = np.stepanA.st;
      if (!np.stepanA.hidden) {
        st.root.rotation.y += ((ph ? FACE['+x'] : FACE['-x']) - st.root.rotation.y) * Math.min(1, dt * 5);
        if (ph) st.arms.forEach((a, i) => { a.sh.rotation.x = -.8 + Math.sin(t * 4) * .5; a.el.rotation.x = -.6; });
      }
      const eye = document.getElementById('eye');
      if ((P.lv || 0) === -1 && P.x > BX - 5 && P.x < BX + 5 && !np.stepanA.hidden && !S.f.b_holdOpen) {
        headW.set(np.stepanA.x, DY['-1'] + 2.15, np.stepanA.z); headW.project(camera);
        if (headW.z < 1) { eye.style.display = 'flex'; eye.style.left = ((headW.x + 1) / 2 * innerWidth) + 'px'; eye.style.top = ((1 - headW.y) / 2 * innerHeight) + 'px'; eye.firstChild.style.width = ph ? '12%' : '100%'; eye.className = ph ? '' : 'red'; }
        else eye.style.display = 'none';
      } else eye.style.display = 'none';
    }
  };
  function resetBoat(L) {
    for (const k in S.f) if (k.startsWith('b_') && !['b_solved', 'b_started', 'b_stampSeen'].includes(k)) delete S.f[k];
    S.f.b_started = true;
    NPCS.forEach(n => { if (n.loc === 'boat') delete S.f['met_' + n.id]; });
    inv.clear();
    derive();
  }
  window.deriveLoc = function () {
    const f = S.f;
    f.b_ready = !!((f.fakeCoins || f.acid || f.coinsTibo) && (f.stampNew || f.stampCoal) && f.holdGold && (!f['hero:tibo'] || f.coalDust || f.lidiaSaw || f.sawStepan || f.stepanBoxes || f.karrBoat));
  };
  window.tickLocation = function (dt) { const L = LOC[WORLD.cur]; if (L && L.sky && L.group) L.sky.position.copy(camera.position); if (L && L.tick && L.group) L.tick(L, dt); };

  // действия из сцен и осмотров
  window.locAction = function (a, def) {
    if (a === 'toBoat') { startScene('toBoat'); return true; }
    if (a === 'goBoat') { closeDialog(); enterLoc('boat'); return true; }
    if (a === 'boatFinale') { startScene('boatFinale'); return true; }
    if (a === 'boatRollback') {
      closeDialog(); sandOn = true; sandEl.classList.add('on'); window.SFX && SFX.play('sand');
      setTimeout(() => {
        S.loops++; resetBoat(LOC.boat); S.time = -120; place(BX - 1.75, 1.9, 0, 0);
        sandEl.classList.remove('on'); sandOn = false; updateQuest(); updateInv(); startScene('boatLoop');
      }, 2600);
      return true;
    }
    if (a.startsWith('deck:')) {
      const [, lv, tid] = a.split(':'); const i = INSPECT.find(q => q.id === tid && q.loc === WORLD.cur);
      withFade(() => { place(i.x + (i.x > BX ? -.6 : .6), i.z - Math.sign(i.z || 1) * .5, P.yaw, +lv); window.SFX && SFX.play('door'); });
      return true;
    }
    if (a === 'coalPit') {
      const L = LOC.boat, st = L.np.stepanA;
      const watching = !st.hidden && !L.stokerBusy && Math.hypot(P.x - st.x, P.z - st.z) < 7;
      if (watching) { window.SFX && SFX.play('alarm'); openDlg(); D.npc = st; D.solo = null; D.dlg = STORY.dialogs.stepan; runNode('caught'); return true; }
      startSolo([[null, null, 'Пока Степан кидает уголь в топку, ты ныряешь в угольную яму и ползёшь в темноте.'], [null, null, 'Пыль скрипит на зубах. Впереди — щель под переборкой. Трюм.']], () => {
        S.f.b_holdOpen = true; withFade(() => place(BX + 6.2, -1.8, -Math.PI / 2, -1)); updateQuest();
      });
      return true;
    }
    return false;
  };
  // кнопка «Завершить дело» на пароходе
  window.finishLocation = function () {
    if (WORLD.cur !== 'boat' || S.f.b_solved) { toastMsg = 'Здесь нечего завершать.'; toastT = 2.5; return; }
    ['fight', 'cards', 'band', 'keypad'].forEach(id => document.getElementById(id).classList.remove('on'));
    if (D.on) closeDialog();
    const ids = ['fakeCoins', 'acid', 'stampNew', 'stampCoal', 'coalDust', 'lidiaSaw', 'logbook', 'manifest', 'holdGold', 'bragAlibi', 'lidiaBrooch'];
    const hx = { tibo: ['coinsTibo'], miron: ['stepanBoxes', 'karrBoat'], agata: ['lidiaLie'], rowen: [] }[S.hero] || [];
    ids.concat(hx).forEach(id => { S.f[id] = true; if (!S.clues.includes(id)) S.clues.push(id); });
    if (S.time < 80) S.time = 80;
    ['b_arrest', 'b_scandal', 'b_holdOpen', 'b_coin', 'b_stampSeen', 'b_lykovGone'].forEach(k => S.f[k] = true);
    derive(); updateQuest();
    const L = LOC.boat; L.tick(L, 0);
    const lk = L.np.lykovB; place(lk.x - 1.1, lk.z - .2, Math.PI / 2 * -1 + Math.PI, 1);
    P.yaw = Math.atan2(-(lk.x - P.x), -(lk.z - P.z));
    showBuff('Все улики собраны — обвини капитана Лыкова', false, S.hero);
    setTimeout(() => { if (!D.on) startDialog(lk); }, 450);
  };
  // помечаем, что ящики осыпались, когда показана концовка парохода
  const endObs = new MutationObserver(() => { if (endEl.classList.contains('on') && WORLD.cur === 'boat' && S.f.b_solved) { S.f.b_sand = true; S.f.act1done = true; } });
  endObs.observe(endEl, { attributes: true, attributeFilter: ['class'] });
  // помощники для следующих локаций (world3.js — монастырь)
  WORLD.H = { M, MT, box, cyl, wallX, wallZ, wallZw, slab, stair, lamp, canvasTex, noise, worldUV, mergeStatic, texSign, place, sandMotes, lin, rnd, tex, crowMesh, withFade, DY, LOC };
})();
// тестовые клавиши: Shift+F8 — сразу на вокзал, Shift+F9 — сразу на пароход (герой по умолчанию — Мирон)
document.addEventListener('keydown', e => {
  if (!e.shiftKey || (e.code !== 'F8' && e.code !== 'F9')) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (!S.hero) { S.f['hero:miron'] = true; S.hero = 'miron'; }
  if (D.on) closeDialog();
  gameOn = true; S.f.solved = true;
  if (e.code === 'F9') { S.f.lavkaDone = true; S.f.smotrTalk = true; }
  enterLoc(e.code === 'F8' ? 'station' : 'boat');
}, true);

// тестовая клавиша Shift+F10: облёт точек обзора текущей локации (для проверки картинки)
(function () {
  const SX = 300, BX = 600;
  const SPOTS = {
    station: [[SX - 9, 3.6, -Math.PI / 2, 0], [SX + 1, 3.2, 0, 0], [SX - 6, 2.2, -2.4, 0], [SX + 10, 2.5, Math.PI / 2 + .3, 0]],
    boat: [[BX - 1.75, 1.9, 0, 0], [BX - 4.2, 1.8, -Math.PI / 2 + .3, -1], [BX + 6.2, -.5, -Math.PI / 2, -1], [BX - 6, 0, Math.PI / 2, -1], [BX - 6.4, 0, -Math.PI / 2, 0],
      [BX - 3, 1.5, -Math.PI / 2 - .6, 1], [BX + 2, 1.5, -2.2, 1], [BX + 6.6, .8, -1.4, 1], [BX - 10.5, 1.5, -1.9, 0], [BX + 12, -1, Math.PI / 2, 0]]
  };
  let k = 0;
  document.addEventListener('keydown', e => {
    if (!e.shiftKey || e.code !== 'F10') return; e.preventDefault(); e.stopImmediatePropagation();
    const L = SPOTS[WORLD.cur]; if (!L) return; const sp = L[k++ % L.length];
    if (D.on) closeDialog();
    P.x = sp[0]; P.z = sp[1]; P.yaw = sp[2]; P.pitch = 0; P.lv = sp[3]; P.fy = { '-1': -2.4, '0': 0, '1': 2.6 }[String(sp[3])];
  }, true);
})();

// ночь за окнами поезда: вместо неподвижной картинки — пейзаж с параллаксом (небо, холмы, лес, огни деревень, телеграфные столбы)
(function () {
  const vs = ['varying vec3 vW;', 'void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }'].join('\n');
  const fs = [
    'uniform float time; varying vec3 vW;',
    'float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }',
    'float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), f); }',
    'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'void main(){',
    ' float u = vW.x, v = (vW.y - .6) / 1.7;',
    ' vec3 col = mix(vec3(.007, .010, .019), vec3(.0008, .0015, .005), smoothstep(.35, 1., v));',
    // звёзды — почти неподвижны
    ' vec2 sc = vec2(u * 9. + time * .02, v * 9.); vec2 ci = floor(sc); float st = h2(ci); vec2 sf = fract(sc) - .5 - (vec2(h2(ci + 3.1), h2(ci + 7.7)) - .5) * .7;',
    ' col += vec3(.75, .78, .9) * step(.93, st) * smoothstep(.06, .0, length(sf)) * (.5 + .5 * sin(time * 2. + st * 40.)) * smoothstep(.45, .7, v);',
    // луна над дальними холмами
    ' float mx = mod(u - 18., 46.) - 23.; float md = length(vec2(mx, (v - .8) * 1.7));',
    ' col += vec3(.95, .92, .8) * smoothstep(.2, .17, md) + vec3(.25, .3, .45) * .12 * smoothstep(1.4, .1, md);',
    // дальние холмы и огни деревень на них
    ' float xh = u * .25 + time * .03; float hh = .36 + .1 * n1(xh) + .05 * n1(xh * 2.7 + 5.);',
    ' if (v < hh) { col = vec3(.003, .0045, .008); vec2 lc = vec2(xh * 14., v * 30.); vec2 li = floor(lc); float lh = h2(li); if (v < hh - .03 && lh > .985) col += vec3(1., .7, .35) * smoothstep(.35, .0, length(fract(lc) - .5)) * (.8 + .2 * sin(time * 3. + lh * 50.)); }',
    // лес ближе — едет быстрее, зубчатые верхушки елей
    ' float xt = u * 1.6 + time * .55; float tt = .2 + .08 * n1(xt * .35) + .07 * abs(fract(xt * 1.7) - .5) * 2. * step(.35, n1(xt * .9));',
    ' if (v < tt) col = vec3(.0008, .001, .0018);',
    // ближайшая насыпь и телеграфные столбы с провисающими проводами
    ' float xp = u + time * 2.4; float pp = mod(xp, 7.); float pole = smoothstep(.05, .03, abs(pp - 3.5)) * step(v, .95);',
    ' float sag = .86 - .06 * (1. - pow(abs(pp - 3.5) / 3.5, 2.)); float wire = smoothstep(.006, .0, abs(v - sag)) + smoothstep(.006, .0, abs(v - sag + .05));',
    ' col = mix(col, vec3(.0), clamp(pole + wire * .8, 0., 1.));',
    ' if (v < .07 + .02 * n1(xp * 3.)) col = vec3(.008, .008, .01);',
    ' gl_FragColor = vec4(col, 1.);',
    '}'].join('\n');
  let mat = null;
  const t0 = performance.now();
  function hook() {
    if (!window.TRAIN_ROOT) return false;
    TRAIN_ROOT.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m && m.name === 'night') { mat = mat || new THREE.ShaderMaterial({ uniforms: { time: { value: 0 } }, vertexShader: vs, fragmentShader: fs }); mat.name = 'night'; o.material = mat; }
      if (m && (m.name === 'win_glass' || m.name === 'glass_clear')) { m.opacity = .06; m.color.set('#9ab0c8'); m.depthWrite = false; }
    });
    return !!mat;
  }
  const iv = setInterval(() => { if (hook()) clearInterval(iv); }, 500);
  (function loop() { if (mat && (!window.WORLD || WORLD.cur === 'train')) mat.uniforms.time.value = (performance.now() - t0) / 1000; requestAnimationFrame(loop); })();
})();
