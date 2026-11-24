// Обстановка новых локаций: кельи, трапезная и ледник монастыря, галерея гостевого крыла на балу,
// усыпальница и зал Часов в финале. Только украшения вдоль стен — проходы и точки осмотра не трогаем.
// Вызывается сразу после build() локации (обёртка над LOC[id].build); новые сетки склеиваются по материалам.
(function () {
  const H = WORLD.H, LOC = WORLD.LOC;
  const { M, box, cyl, canvasTex, lamp } = H;
  const MX = 900, CX = 1500, NX = 2100, YB = -2.4;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- материалы ----------
  const mat = {
    wood: M('#5a3c26', { r: .8 }), woodL: M('#8a6440', { r: .75 }), woodD: M('#3a281a', { r: .8 }),
    iron: M('#2a2a2e', { m: .6, r: .45 }), brass: M('#b08a3a', { m: .8, r: .35 }), gold: M('#c9a24a', { m: .85, r: .3 }),
    linen: M('#d8cfb8', { r: .95 }), wool: M('#7a5a40', { r: 1 }), sack: M('#a08a64', { r: 1 }),
    clay: M('#9a5a36', { r: .7 }), clayD: M('#6a4a34', { r: .75 }), wax: M('#efe6cf', { r: .6 }),
    flame: M('#ffd27a', { e: '#ffb040', ei: 3, r: .3 }), bread: M('#b98a4e', { r: .9 }),
    stone: M('#8a847a', { r: .95 }), stoneD: M('#4a4640', { r: .95 }), black: M('#151414', { r: .7 }),
    white: M('#ece6da', { r: .7 }), velvetR: M('#5a1418', { r: .9 }), green: M('#2a4a34', { r: .9 })
  };
  const bookCols = ['#5a1a14', '#2a3a5a', '#3a4a2a', '#6a4a1a', '#4a2a4a', '#2a2a2a', '#7a5a2a'].map(c => M(c, { r: .8 }));
  const rug = (() => {
    const t = canvasTex(128, 192, (g, w, h) => {
      g.fillStyle = '#6a2a20'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8a060'; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = '#5a1e18'; g.fillRect(12, 12, w - 24, h - 24);
      g.strokeStyle = '#c8a060'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w / 2, 30 + i * 36); g.lineTo(w - 26, 48 + i * 36); g.lineTo(w / 2, 66 + i * 36); g.lineTo(26, 48 + i * 36); g.closePath(); g.stroke(); }
    });
    return M('#ffffff', { map: t, r: 1 });
  })();
  const runner = (() => { const t = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#4a1014'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8903a'; g.fillRect(4, 0, 3, h); g.fillRect(w - 7, 0, 3, h); for (let y = 16; y < h; y += 32) { g.beginPath(); g.arc(w / 2, y, 6, 0, 7); g.fill(); } }, 1, 4); return M('#ffffff', { map: t, r: 1 }); })();
  const portraitM = (seed) => { const t = canvasTex(96, 128, (g, w, h) => {
    const hue = [20, 200, 30, 280, 120][seed % 5]; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `hsl(${hue},25%,22%)`); gr.addColorStop(1, `hsl(${hue},20%,8%)`); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = `hsl(${hue},20%,30%)`; g.beginPath(); g.ellipse(w / 2, h * .95, w * .42, h * .38, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#c8a084'; g.beginPath(); g.ellipse(w / 2, h * .42, w * .17, h * .15, 0, 0, 7); g.fill();
    g.fillStyle = ['#2a1a10', '#d8d0c0', '#5a3a1a', '#1a1a1a', '#8a6a3a'][seed % 5]; g.beginPath(); g.ellipse(w / 2, h * .33, w * .19, h * .09, 0, Math.PI, 0); g.fill(); });
    return M('#ffffff', { map: t, r: .7 }); };

  // ---------- предметы ----------
  function flame(G, x, y, z, s) { s = s || 1; const f = new THREE.Mesh(new THREE.SphereGeometry(.018 * s, 7, 5), mat.flame); f.scale.y = 1.9; f.position.set(x, y, z); G.add(f); }
  function candle(G, x, y, z, s) { s = s || 1; cyl(G, .02 * s, .022 * s, .16 * s, mat.wax, x, y + .08 * s, z, 8); flame(G, x, y + .19 * s, z, s); }
  function candlestick(G, x, y, z) { cyl(G, .06, .07, .03, mat.brass, x, y + .015, z, 10); cyl(G, .012, .012, .16, mat.brass, x, y + .1, z, 6); candle(G, x, y + .18, z); }
  function book(G, x, y, z, ry, i) { const w = .03 + (i % 3) * .008, h = .2 + (i % 4) * .025; box(G, w, h, .14, bookCols[i % bookCols.length], x, y + h / 2, z, ry); return w; }
  // полка на стене: along — вдоль какой оси (x/z), n — нормаль от стены (+1/-1)
  function shelf(G, x, y, z, along, len, n, fill) {
    const alongX = along === 'x';
    box(G, alongX ? len : .24, .03, alongX ? .24 : len, mat.wood, x + (alongX ? 0 : n * .12), y, z + (alongX ? n * .12 : 0));
    for (const s of [-1, 1]) box(G, alongX ? .03 : .2, .14, alongX ? .2 : .03, mat.woodD, x + (alongX ? s * (len / 2 - .1) : n * .1), y - .08, z + (alongX ? n * .1 : s * (len / 2 - .1)));
    let t = -len / 2 + .06, i = Math.floor(rnd(0, 7));
    while (t < len / 2 - .08) {
      const px = x + (alongX ? t : n * .12), pz = z + (alongX ? n * .12 : t);
      if (fill === 'jars' && i % 3 === 0) { cyl(G, .045, .05, .13, i % 2 ? mat.clay : mat.clayD, px, y + .08, pz, 10); t += .12; }
      else { const w = book(G, px, y + .015, pz, alongX ? 0 : Math.PI / 2, i); t += w + .006; }
      i++; if (rnd(0, 1) < .08) t += .1;
    }
  }
  function cross(G, x, y, z, ry) { box(G, .04, .34, .03, mat.wood, x, y, z, ry); box(G, .2, .04, .03, mat.wood, x, y + .07, z, ry); }
  function barrel(G, x, y, z, r, h) { r = r || .3; h = h || .8; cyl(G, r * .92, r * .92, h, mat.woodL, x, y + h / 2, z, 14); for (const k of [.12, .88]) cyl(G, r * .95, r * .95, .04, mat.iron, x, y + h * k, z, 14); cyl(G, r * .99, r * .99, .05, mat.iron, x, y + h / 2, z, 14); }
  function sack(G, x, y, z, s) { s = s || 1; const m = new THREE.Mesh(new THREE.SphereGeometry(.26 * s, 10, 8), mat.sack); m.scale.set(1, 1.25, .85); m.position.set(x, y + .3 * s, z); m.rotation.y = rnd(0, 3); G.add(m); cyl(G, .06 * s, .1 * s, .12 * s, mat.sack, x, y + .66 * s, z, 8); }
  function chest(G, x, y, z, ry, w) { w = w || .8; box(G, w, .42, .44, mat.wood, x, y + .21, z, ry); box(G, w + .02, .1, .46, mat.woodD, x, y + .46, z, ry); for (const s of [-1, 1]) box(G, .04, .5, .47, mat.iron, x + Math.cos(ry || 0) * s * w * .35, y + .25, z - Math.sin(ry || 0) * s * w * .35, ry); }
  function stool(G, x, y, z) { cyl(G, .17, .17, .04, mat.woodL, x, y + .44, z, 12); for (let a = 0; a < 3; a++) { const l = cyl(G, .018, .018, .44, mat.woodD, x + Math.cos(a * 2.1) * .11, y + .22, z + Math.sin(a * 2.1) * .11, 6); l.rotation.z = Math.cos(a * 2.1) * .1; l.rotation.x = -Math.sin(a * 2.1) * .1; } }
  function robe(G, x, y, z, ry) { cyl(G, .015, .015, .1, mat.woodD, x, y, z, 6).rotation.x = Math.PI / 2; const r = new THREE.Mesh(new THREE.CylinderGeometry(.12, .22, 1.0, 10, 1, true), M('#1c1a1a', { r: 1, side: 1 })); r.position.set(x + Math.sin(ry) * .1, y - .52, z + Math.cos(ry) * .1); G.add(r); }
  function bowl(G, x, y, z) { cyl(G, .07, .045, .04, mat.clay, x, y + .02, z, 10); }
  function bread(G, x, y, z) { const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 7), mat.bread); b.scale.set(1.3, .6, 1); b.position.set(x, y + .04, z); G.add(b); }
  function frame(G, x, y, z, ry, w, h, m) { box(G, w + .1, h + .1, .05, mat.gold, x, y, z, ry); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x + Math.sin(ry) * .03, y, z + Math.cos(ry) * .03); p.rotation.y = ry; G.add(p); }
  function torch(L, G, x, y, z, ry, light) {
    box(G, .06, .2, .06, mat.iron, x, y, z, ry); const h = cyl(G, .03, .02, .32, mat.woodD, x + Math.sin(ry) * .1, y + .1, z + Math.cos(ry) * .1, 6); h.rotation.x = Math.cos(ry) * .35; h.rotation.z = -Math.sin(ry) * .35;
    const f = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), mat.flame); f.scale.y = 1.8; f.position.set(x + Math.sin(ry) * .17, y + .3, z + Math.cos(ry) * .17); G.add(f);
    if (light) { lamp(L, G, x + Math.sin(ry) * .3, y + .3, z + Math.cos(ry) * .3, { r: .001, i: .55, d: 5, c: '#ffb060', hex: 0xffa050 }); const l = L.lamps[L.lamps.length - 1]; l.i0 = l.i; }
  }
  function column(G, x, y, z, h, m) { cyl(G, .2, .2, h - .3, m, x, y + h / 2, z, 14); box(G, .52, .15, .52, m, x, y + .075, z); box(G, .52, .15, .52, m, x, y + h - .075, z); }
  function gear(G, x, y, z, r, ry) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, r * .14, 6, 24), mat.brass); t.position.set(x, y, z); t.rotation.y = ry; G.add(t);
    const n = Math.max(8, Math.round(r * 22));
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); const tooth = box(G, r * .14, r * .16, r * .14, mat.brass, 0, 0, 0); const lx = c * r * 1.13, ly = s * r * 1.13; tooth.position.set(x + Math.cos(ry) * lx, y + ly, z - Math.sin(ry) * lx); tooth.rotation.set(0, ry, a); }
    for (let i = 0; i < 3; i++) { const sp = box(G, r * 1.9, r * .08, r * .06, mat.brass, x, y, z, 0); sp.rotation.set(0, ry, i * Math.PI / 3); }
    cyl(G, r * .14, r * .14, r * .2, mat.brass, x, y, z, 10).rotation.set(Math.PI / 2, 0, ry);
  }

  // ---------- монастырь ----------
  function monast(L, G) {
    const X = x => MX + x;
    // кельи: четыре комнаты 3×4 (x c±1.5, z 1…5), дверь на севере посередине, кровать у южной стены
    [-12.5, -9.5, -6.5, -3.5].forEach((c, k) => {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), rug); r.rotation.x = -Math.PI / 2; r.position.set(X(c - .1), .035, 3.2); G.add(r);
      shelf(G, X(c - 1.42), 1.45, 3.3, 'z', 1.1, 1, k % 2 ? 'jars' : 'books');
      cross(G, X(c), 1.75, 4.86, Math.PI);
      candlestick(G, X(c + .9), .71, 1.6);
      robe(G, X(c + 1.44), 1.75, 3.6, -Math.PI / 2);
      if (k === 0) return; // келья настоятеля: у западной стены киот (точка осмотра) — столик не ставим
      stool(G, X(c - 1.0), 0, 2.2);
      box(G, .5, .04, .4, mat.woodL, X(c - 1.05), .72, 2.2 + 0); for (const dx of [-.2, .2]) for (const dz of [-.15, .15]) box(G, .04, .7, .04, mat.woodD, X(c - 1.05 + dx), .35, 2.2 + dz);
      candlestick(G, X(c - 1.15), .74, 2.1);
      book(G, X(c - .95), .74, 2.25, .4, k);
      L.blockers.push({ x: X(c - 1.05), z: 2.2, lv: 0, r: .3 });
    });
    // трапезная: хлеб и миски на столе, иконы и полки у стен, бочка с квасом
    for (let i = 0; i < 9; i++) { const x = X(-11.3 + i * .68); bowl(G, x, .82, -6.5 + (i % 2 ? .28 : -.28)); if (i % 3 === 1) bread(G, x + .2, .82, -6.5); }
    for (const x of [-12, -10.5]) shelf(G, X(x), 1.5, -9.85, 'x', 1.2, 1, 'jars');
    barrel(G, X(-12.3), 0, -4.0); barrel(G, X(-12.3), 0, -4.65, .26, .7); L.blockers.push({ x: X(-12.3), z: -4.3, lv: 0, r: .4 });
    for (const x of [-11.5, -8.5, -5.5]) torch(L, G, X(x), 1.9, -3.12, Math.PI, false);
    // ледник: бочки и мешки вдоль стен
    for (let i = 0; i < 4; i++) barrel(G, X(-7.0), YB, -9.2 + i * .75, .28, .75);
    for (let i = 0; i < 5; i++) sack(G, X(-12.4 + i * .55), YB, -3.6, rnd(.85, 1.05));
    L.blockers.push({ x: X(-7.0), z: -8.1, lv: -1, r: .5 }, { x: X(-11.3), z: -3.6, lv: -1, r: .5 });
  }

  // ---------- бал: галерея гостевого крыла (x −11…−8, z −6…6) ----------
  function ball(L, G) {
    const X = x => CX + x;
    const r = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 11.2), runner); r.rotation.x = -Math.PI / 2; r.position.set(X(-9.5), .035, 0); G.add(r);
    // консоли с вазами и свечами у восточной (внутренней) стены, портреты над ними
    [-4.6, -1.5, 1.5, 4.6].forEach((z, i) => {
      box(G, .34, .05, .9, mat.woodD, X(-8.32), .82, z); for (const dz of [-.38, .38]) { const l = box(G, .04, .8, .04, mat.gold, X(-8.32), .4, z + dz); l.rotation.x = dz > 0 ? .08 : -.08; }
      const v = cyl(G, .06, .1, .32, i % 2 ? M('#2a4a6a', { r: .3, m: .1 }) : M('#e8e0d0', { r: .3 }), X(-8.32), 1.0, z - .2, 12);
      for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), M(['#8a1a2a', '#c8a050', '#5a1a3a'][k % 3], { r: .8 })); s.position.set(X(-8.32) + rnd(-.06, .06), 1.2 + rnd(0, .08), z - .2 + rnd(-.06, .06)); G.add(s); }
      candlestick(G, X(-8.32), .845, z + .25);
      frame(G, X(-8.13), 1.85, z, -Math.PI / 2, .55, .72, portraitM(i + 2));
      L.blockers.push({ x: X(-8.35), z, lv: 0, r: .3 });
    });
    // кресла у западной стены между дверями
    for (const z of [-5.2, 0, 5.2]) { box(G, .55, .42, .5, mat.velvetR, X(-10.55), .21, z); box(G, .55, .6, .12, mat.velvetR, X(-10.78), .62, z); for (const s of [-1, 1]) box(G, .5, .12, .08, mat.gold, X(-10.55), .48, z + s * .27); L.blockers.push({ x: X(-10.55), z, lv: 0, r: .32 }); }
  }

  // ---------- финал: усыпальница (x −10…0) и зал Часов (x 0…12), z −13…1 ----------
  function noon(L, G) {
    const X = x => NX + x, y = YB, colM = M('#6a645a', { r: .95 });
    for (const z of [-11.5, -7.5, -3.5, -.2]) for (const x of [-9.5, -.5]) column(G, X(x), y, z, 2.25, colM);
    // ниши с табличками прежних правителей — по западной стене
    for (const z of [-10, -6, -2]) {
      box(G, .1, 1.1, .8, mat.stoneD, X(-9.75), y + 1.1, z);
      const t = canvasTex(96, 48, (g, w, h) => { g.fillStyle = '#2a2622'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a24a'; g.font = 'italic 13px Georgia'; g.textAlign = 'center'; g.fillText('Rex', w / 2, 20); g.fillText('✝', w / 2, 38); });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(.5, .25), M('#ffffff', { map: t, r: .6 })); p.position.set(X(-9.69), y + .85, z); p.rotation.y = Math.PI / 2; G.add(p);
      candle(G, X(-9.6), y + .55, z - .25); candle(G, X(-9.6), y + .55, z + .25);
    }
    for (const z of [-12, -5]) torch(L, G, X(-.25), y + 1.4, z, -Math.PI / 2, true);
    torch(L, G, X(-5), y + 1.4, .75, Math.PI, true);
    // зал Часов: латунные шестерни по стенам и трубы под потолком
    gear(G, X(11.7), y + 1.3, -9.5, .6, -Math.PI / 2); gear(G, X(11.7), y + .9, -8.3, .35, -Math.PI / 2); gear(G, X(11.7), y + 1.2, -3.0, .5, -Math.PI / 2);
    gear(G, X(3), y + 1.3, -12.7, .55, 0); gear(G, X(4.1), y + 1.0, -12.7, .3, 0); gear(G, X(9), y + 1.4, -12.7, .45, 0);
    for (const z of [-12.2, -.2]) { const p = cyl(G, .07, .07, 11.4, mat.brass, X(6), y + 2.0, z, 10); p.rotation.z = Math.PI / 2; }
    for (const x of [1, 11]) { const p = cyl(G, .07, .07, 12, mat.brass, X(x), y + 2.05, -6.2, 10); p.rotation.x = Math.PI / 2; }
  }

  const ADD = { monast, ball, noon };
  for (const id in ADD) {
    const Lc = LOC[id]; if (!Lc || !Lc.build) continue;
    const b0 = Lc.build;
    Lc.build = function (L) {
      b0.call(this, L);
      try {
        const G = L.group; const n0 = G.children.length;
        ADD[id](L, G);
        if (H.worldUV) H.worldUV(G);
        if (H.mergeStatic && G.children.length > n0) H.mergeStatic(G, L);
      } catch (e) { console.warn('decor', id, e); }
    };
  }
})();
