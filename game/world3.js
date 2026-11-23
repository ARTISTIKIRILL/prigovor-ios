// Акт 2: монастырь в метель, 1640-е (дело «Следы в снегу»). Локация стоит по оси X около 900.
// Уровни: 0 — двор и постройки, −1 — ледник под трапезной и подземный ход из ризницы.
// Помощники берутся из world2.js (WORLD.H). Данные сюжета — story4.js.
(function () {
  const H = WORLD.H, LOC = WORLD.LOC, MX = 900;
  const { M, MT, box, cyl, wallX, wallZ, slab, lamp, canvasTex, noise, worldUV, mergeStatic, place, lin, rnd, DY } = H;
  const T = (a, b) => S.time >= a && (b === undefined || S.time < b);

  // постройки: [x0, x1, z0, z1] в координатах от MX; комнаты — проходимые прямоугольники внутри
  const FP = {
    ref: [-13, -4, -10, -3], church: [5, 13.5, -10, -2], cells: [-14, -2, 1, 5], treas: [5, 9, 2, 6], guest: [-14, -8, 7, 10.5], well: [-.9, .9, -1.9, -.1]
  };
  const ROOMS = [
    [-12.7, -4.3, -9.7, -3.3], [5.3, 13.2, -9.7, -4.8], [9.8, 13.2, -4.2, -2.3],
    [-13.7, -11.3, 1.3, 4.7], [-10.7, -8.3, 1.3, 4.7], [-7.7, -5.3, 1.3, 4.7], [-4.7, -2.3, 1.3, 4.7],
    [5.3, 8.7, 2.3, 5.7], [-13.7, -11.3, 7.3, 10.2], [-10.7, -8.3, 7.3, 10.2],
    // дверные проёмы
    [-8.9, -8.1, -3.6, -2.4], [4.4, 5.6, -7.7, -6.7], [10.9, 11.5, -4.9, -4.1], [4.4, 5.6, 3.65, 4.35],
    [-12.9, -12.1, .4, 1.6], [-9.9, -9.1, .4, 1.6], [-6.9, -6.1, .4, 1.6], [-3.9, -3.1, .4, 1.6], [-12.9, -12.1, 6.4, 7.6], [-9.9, -9.1, 6.4, 7.6]
  ];
  const inR = (r, x, z) => x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3];

  LOC.monast = {
    fog: [0x2a3240, 3, 26], walk: [], zones: [], lamps: [], blockers: [],
    build(L) {
      const G = L.group = new THREE.Group(); scene.add(G);
      G.add(new THREE.HemisphereLight(0x8a9ab8, 0x2a2420, .32));
      const extra = [];
      const mk = (draw, w, h, tile, o) => { const t = canvasTex(w, h, draw, 1, 1); const m = new THREE.MeshStandardMaterial(Object.assign({ map: t, roughness: .9 }, o || {})); m.userData.tile = tile; extra.push(m); return m; };
      // ---------- материалы ----------
      const snowM = mk((g, w, h) => { g.fillStyle = '#e6ecf2'; g.fillRect(0, 0, w, h); noise(g, w, h, 5000, .06); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(150,170,195,.08)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, rnd(10, 40), rnd(4, 12), Math.random() * 3, 0, 7); g.fill(); } }, 256, 256, 4, { color: lin('#dfe6ee') });
      const logM = mk((g, w, h) => { const n = 8, lh = h / n; for (let i = 0; i < n; i++) { const y = i * lh; const gr = g.createLinearGradient(0, y, 0, y + lh); gr.addColorStop(0, '#3a2a1c'); gr.addColorStop(.18, '#7a5a3c'); gr.addColorStop(.5, '#8c6a48'); gr.addColorStop(.85, '#5a4028'); gr.addColorStop(1, '#2a1c12'); g.fillStyle = gr; g.fillRect(0, y, w, lh); for (let k = 0; k < 30; k++) { g.strokeStyle = 'rgba(40,25,12,' + rnd(.05, .2) + ')'; g.beginPath(); const yy = y + rnd(3, lh - 3); g.moveTo(0, yy); g.bezierCurveTo(w * .3, yy + rnd(-2, 2), w * .6, yy + rnd(-2, 2), w, yy); g.stroke(); } } noise(g, w, h, 1500, .06); }, 256, 256, 2.0);
      const plankM = MT('deckdark', 2.2), floorM = MT('deck', 2.4, { c: '#b89878' }), plasterM = MT('plaster', 2.6, { c: '#f0ece4' });
      const stoneM = MT('stone', 1.6, { c: '#8a9098' }), ironM = M('#2a2622', { m: .6, r: .5 }), woodD = M('#3a2818', { r: .7 }), woodL = M('#6a4a2e', { r: .7 });
      const gold = M('#c9a050', { m: .85, r: .3 }), domeM = M('#24403a', { m: .5, r: .45 }), whiteM = M('#eceae4', { r: .85 });
      // ---------- небо, земля, снег ----------
      const skyT = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0c1018'); gr.addColorStop(.42, '#232a36'); gr.addColorStop(.5, '#2a3240'); gr.addColorStop(1, '#1a1e26'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const sky = L.sky = new THREE.Mesh(new THREE.SphereGeometry(24, 24, 12), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; G.add(sky);
      box(G, 60, .3, 60, snowM, MX, -.15, 0);
      // утоптанные тропинки к дверям
      const pathM = M('#b8c2cc', { r: .95 });
      [[-8.5, -2.6, 0, 6], [0, 0, -2.6, 10.6], [-14, 4.6, 2.2, 2.2], [5, -1, -6.9, -6.9], [-1, 4.6, 4, 4], [-12.5, -9.5, 6.2, 6.2]].forEach(([x0, x1, z0, z1]) => {
        const w = Math.max(.9, Math.abs(x1 - x0)), d = Math.max(.9, Math.abs(z1 - z0)); box(G, w, .02, d, pathM, MX + (x0 + x1) / 2, .01, (z0 + z1) / 2);
      });
      // сугробы у стен
      const driftG = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      for (let i = 0; i < 46; i++) { const side = i % 4, u = rnd(-14, 14); const m = new THREE.Mesh(driftG, snowM); const s = rnd(.8, 1.8);
        m.scale.set(s * 1.6, s * .45, s); const p = side === 0 ? [u, -10.6] : side === 1 ? [u, 10.6] : side === 2 ? [-14.6, u * .7] : [14.6, u * .7];
        if (side === 1 && Math.abs(u) < 2.4) continue; if (Object.values(FP).some(f => p[0] > f[0] - 2.6 && p[0] < f[1] + 2.6 && p[1] > f[2] - 2 && p[1] < f[3] + 2)) continue; m.position.set(MX + p[0], 0, p[1]); G.add(m); }
      // ---------- стена с воротами ----------
      const wallH = 3.6;
      for (const [x0, x1, z] of [[-15, 15, -11], [-15, -1.6, 11], [1.6, 15, 11]]) { box(G, x1 - x0, wallH, .8, plasterM, MX + (x0 + x1) / 2, wallH / 2, z); box(G, x1 - x0 + .3, .25, 1.3, plankM, MX + (x0 + x1) / 2, wallH + .1, z); box(G, x1 - x0 + .3, .12, 1.2, snowM, MX + (x0 + x1) / 2, wallH + .28, z); }
      for (const x of [-15, 15]) { box(G, .8, wallH, 22.8, plasterM, MX + x, wallH / 2, 0); box(G, 1.3, .25, 23, plankM, MX + x, wallH + .1, 0); box(G, 1.2, .12, 23, snowM, MX + x, wallH + .28, 0); }
      // зубцы-бойницы и угловые башни
      for (const [x, z] of [[-15, -11], [15, -11], [-15, 11], [15, 11]]) { box(G, 2.4, 5.2, 2.4, plasterM, MX + x, 2.6, z); const r = new THREE.Mesh(new THREE.ConeGeometry(2.1, 2.4, 4), plankM); r.position.set(MX + x, 6.4, z); r.rotation.y = Math.PI / 4; G.add(r); const sc = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.1, 4), snowM); sc.position.set(MX + x, 7.0, z); sc.rotation.y = Math.PI / 4; G.add(sc); }
      // надвратная арка и ворота
      box(G, 4.4, 1.4, 1.2, plasterM, MX, wallH + .3, 11); const gr = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.8, 4), plankM); gr.position.set(MX, wallH + 1.9, 11); gr.rotation.y = Math.PI / 4; gr.scale.z = .45; G.add(gr);
      const gateM = M('#4a3220', { r: .8 });
      for (const sd of [-1, 1]) { box(G, 1.55, 3.0, .14, gateM, MX + sd * .8, 1.5, 11.05); for (const yy of [.6, 1.5, 2.4]) box(G, 1.5, .1, .05, ironM, MX + sd * .8, yy, 10.95); }
      L.bolt = box(G, 3.2, .16, .14, M('#5a3a20', { r: .7 }), MX, 1.45, 10.86);
      L.boltOpen = box(G, .16, .16, 1.1, M('#5a3a20', { r: .7 }), MX + 1.85, 1.45, 10.4);
      for (const sd of [-1, 1]) box(G, .12, .3, .2, ironM, MX + sd * 1.4, 1.45, 10.86);
      // следы в снегу от келий к воротам (видны с 23:40 до часу ночи)
      L.tracks = new THREE.Group(); G.add(L.tracks);
      const stepM = M('#9aa6b4', { r: 1 });
      for (let i = 0; i < 22; i++) { const u = i / 21, x = -9.5 + (0 - -9.5) * u + Math.sin(u * 7) * .3, z = 1.0 + (10.5 - 1.0) * u; for (const sd of [-1, 1]) { const s = new THREE.Mesh(new THREE.CircleGeometry(.09, 10), stepM); s.scale.set(1, 1.7, 1); s.rotation.x = -Math.PI / 2; s.position.set(MX + x + sd * .13 + (i % 2) * .05, .025, z + sd * .2); L.tracks.add(s); } }
      // ---------- постройки ----------
      function gable(x0, x1, z0, z1, y, rise, mat) {
        const w = x1 - x0 + .7, half = (z1 - z0) / 2 + .45, L2 = Math.hypot(half, rise), a = Math.atan2(rise, half), cz = (z0 + z1) / 2;
        for (const s of [-1, 1]) {
          const r = box(G, w, .14, L2, mat, MX + (x0 + x1) / 2, y + rise / 2, cz + s * half / 2); r.rotation.x = s * a;
          const sn = box(G, w - .1, .1, L2 * .96, snowM, MX + (x0 + x1) / 2, y + rise / 2 + .12, cz + s * half / 2); sn.rotation.x = s * a;
        }
        const sh = new THREE.Shape(); sh.moveTo(z0 - cz, 0); sh.lineTo(z1 - cz, 0); sh.lineTo(0, rise); sh.lineTo(z0 - cz, 0);
        for (const x of [x0, x1]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), logM); m.rotation.y = Math.PI / 2; m.position.set(MX + x, y, cz); m.material.side = THREE.DoubleSide; G.add(m); }
      }
      function house(fp, h, mat, doors, opts) {
        const [x0, x1, z0, z1] = fp; opts = opts || {};
        const gaps = { N: [], S: [], W: [], E: [] }; (doors || []).forEach(([s, c, w]) => gaps[s].push([c - w / 2, c + w / 2]));
        wallZ(G, z0, MX + x0, MX + x1, 0, h, mat, gaps.N.map(([a, b]) => [MX + a, MX + b]), .22);
        wallZ(G, z1, MX + x0, MX + x1, 0, h, mat, gaps.S.map(([a, b]) => [MX + a, MX + b]), .22);
        wallX(G, MX + x0, z0, z1, 0, h, mat, gaps.W, .22); wallX(G, MX + x1, z0, z1, 0, h, mat, gaps.E, .22);
        box(G, x1 - x0, .06, z1 - z0, opts.floor || floorM, MX + (x0 + x1) / 2, 0, (z0 + z1) / 2);
        box(G, x1 - x0, .06, z1 - z0, opts.ceil || plankM, MX + (x0 + x1) / 2, h - .03, (z0 + z1) / 2);
        if (!opts.noRoof) gable(x0, x1, z0, z1, h, opts.rise || 1.6, plankM);
        // двери-полотна, приоткрытые внутрь
        (doors || []).forEach(([s, c, w]) => {
          const d = box(G, w - .05, 2.0, .06, M('#4a3220', { r: .8 }), 0, 1.0, 0);
          if (s === 'N' || s === 'S') { const z = s === 'N' ? z0 : z1, dz = s === 'N' ? 1 : -1; d.position.set(MX + c - w / 2 + .05, 1.0, z + dz * w * .45); d.rotation.y = Math.PI / 2; }
          else { const x = s === 'W' ? x0 : x1, dx = s === 'W' ? 1 : -1; d.position.set(MX + x + dx * w * .45, 1.0, c - w / 2 + .05); }
          box(G, s === 'N' || s === 'S' ? w + .3 : .3, .2, s === 'N' || s === 'S' ? .3 : w + .3, woodD, s === 'W' ? MX + x0 : s === 'E' ? MX + x1 : MX + c, 2.12, s === 'N' ? z0 : s === 'S' ? z1 : c);
        });
      }
      const win = (x, y, z, ry, c) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(.5, .6), M(c || '#c88a48', { e: c || '#e8903a', ei: .55, r: .3 })); w.position.set(MX + x, y, z); w.rotation.y = ry; G.add(w); box(G, .62, .08, .1, woodD, MX + x, y - .34, z); };
      // трапезная
      house(FP.ref, 3.0, logM, [['S', -8.5, .9]]);
      for (const x of [-11.5, -9.5, -7.5, -5.5]) win(x, 1.6, -10.12, Math.PI); for (const x of [-11.5, -6.5]) win(x, 1.6, -2.88, 0);
      box(G, 6.2, .08, 1.0, woodL, MX - 8.5, .78, -6.5); for (const dz of [-.85, .85]) box(G, 6.2, .06, .32, woodL, MX - 8.5, .45, -6.5 + dz);
      for (const x of [-11.2, -8.5, -5.8]) { box(G, .1, .74, .8, woodD, MX + x, .37, -6.5); }
      box(G, 1.6, 2.2, 1.6, whiteM, MX - 5.1, 1.1, -8.9); box(G, 1.1, .3, 1.1, M('#d8d2c8', { r: .9 }), MX - 5.1, 2.35, -8.9); cyl(G, .18, .2, .9, whiteM, MX - 5.1, 2.9, -8.9, 10);
      L.refFire = box(G, .5, .4, .05, M('#ff8a3a', { e: '#ff6a1a', ei: 2 }), MX - 5.1, .55, -8.08);
      // люк в ледник
      box(G, 1.2, .05, 1.0, M('#3a2818', { r: .7 }), MX - 11, .045, -7.8); box(G, 1.3, .07, .1, ironM, MX - 11, .05, -7.3); box(G, 1.3, .07, .1, ironM, MX - 11, .05, -8.3);
      L.padlock = box(G, .14, .16, .08, ironM, MX - 11, .12, -7.25);
      const iconCorner = (x, z, ry) => { const ic = canvasTex(64, 80, (g, w, h) => { g.fillStyle = '#c9a050'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a2418'; g.fillRect(8, 10, w - 16, h - 18); g.fillStyle = '#e8c070'; g.beginPath(); g.arc(w / 2, 30, 13, 0, 7); g.fill(); g.fillStyle = '#c89878'; g.beginPath(); g.arc(w / 2, 31, 8, 0, 7); g.fill(); g.fillStyle = '#5a1a14'; g.fillRect(w / 2 - 11, 42, 22, 26); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(.32, .4), M('#ffffff', { map: ic, r: .5 })); p.position.set(x, 1.9, z); p.rotation.y = ry; G.add(p);
        const lp = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), M('#ff4030', { e: '#ff3020', ei: 2.5 })); lp.position.set(x + Math.sin(ry) * .12, 1.62, z + Math.cos(ry) * .12); G.add(lp); };
      iconCorner(MX - 12.8, -9.8, Math.PI / 4);
      lamp(L, G, MX - 8.5, 2.6, -6.5, { r: .1, i: .9, d: 7, hang: .3 });
      // церковь: белёная, с главкой и крестом
      house(FP.church, 4.6, plasterM, [['W', -7.2, 1.2]], { ceil: whiteM, rise: 2.2, floor: MT('stone', 1.4, { c: '#a8a49c' }) });
      wallZ(G, -4.5, MX + 5, MX + 13.5, 0, 4.6, plasterM, [[MX + 10.8, MX + 11.6]], .2);
      wallX(G, MX + 9.5, -4.5, -2, 0, 4.6, plasterM, null, .2);
      cyl(G, 1.5, 1.5, 2.2, plasterM, MX + 9.2, 7.6, -6.2, 20);
      const onion = new THREE.LatheGeometry([[0, 0], [1.1, .05], [1.55, .7], [1.45, 1.45], [.95, 2.1], [.35, 2.6], [.06, 3.0], [0, 3.1]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
      const dome = new THREE.Mesh(onion, domeM); dome.position.set(MX + 9.2, 8.7, -6.2); G.add(dome);
      const domeSnow = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 6, 0, Math.PI * 2, 0, Math.PI / 3), snowM); domeSnow.scale.set(1.35, .5, 1.35); domeSnow.position.set(MX + 9.2, 9.8, -6.2); G.add(domeSnow);
      box(G, .1, 1.6, .1, gold, MX + 9.2, 12.5, -6.2); box(G, .8, .09, .09, gold, MX + 9.2, 12.8, -6.2); box(G, .5, .08, .08, gold, MX + 9.2, 13.15, -6.2); const sl = box(G, .55, .07, .07, gold, MX + 9.2, 12.25, -6.2); sl.rotation.z = .35;
      for (const z of [-9, -7.2, -5.4]) win(13.62, 2.4, z, Math.PI / 2); for (const x of [6.5, 8, 11.5]) win(x, 2.6, -10.12, Math.PI);
      // иконостас
      const iconT = canvasTex(512, 256, (g, w, h) => {
        g.fillStyle = '#b8903c'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, .1);
        for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
          const x = 14 + i * 70, y = 14 + row * 120, iw = 56, ih = 104;
          g.fillStyle = '#2a1a12'; g.beginPath(); g.moveTo(x, y + ih); g.lineTo(x, y + 20); g.quadraticCurveTo(x + iw / 2, y - 6, x + iw, y + 20); g.lineTo(x + iw, y + ih); g.fill();
          g.fillStyle = '#e0b860'; g.beginPath(); g.arc(x + iw / 2, y + 36, 14, 0, 7); g.fill();
          g.fillStyle = '#c89470'; g.beginPath(); g.ellipse(x + iw / 2, y + 38, 8, 10, 0, 0, 7); g.fill();
          g.fillStyle = ['#6a1a18', '#1a3a5a', '#2a4a2a', '#5a2a4a'][(i + row) % 4]; g.fillRect(x + 12, y + 52, iw - 24, ih - 58);
        }
        g.strokeStyle = '#f0d080'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
      });
      box(G, .12, 3.6, 4.8, M('#ffffff', { map: iconT, r: .45, m: .3 }), MX + 13.1, 1.95, -7.25);
      box(G, .15, .9, 1.0, gold, MX + 13.0, 1.2, -7.25);
      L.flames = [];
      for (const [x, z] of [[12, -8.6], [12, -5.9], [10.5, -7.25]]) {
        cyl(G, .03, .05, 1.1, gold, MX + x, .55, z, 8); cyl(G, .22, .22, .04, gold, MX + x, 1.1, z, 14);
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; cyl(G, .012, .012, .14, whiteM, MX + x + Math.cos(a) * .13, 1.19, z + Math.sin(a) * .13, 6); const f = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 5), M('#ffcf70', { e: '#ffb040', ei: 3 })); f.scale.y = 1.8; f.position.set(MX + x + Math.cos(a) * .13, 1.29, z + Math.sin(a) * .13); G.add(f); L.flames.push(f); }
      }
      lamp(L, G, MX + 11.5, 2.4, -7.2, { r: .06, i: 1.1, d: 8, c: '#ffc070', hex: 0xffc070 });
      box(G, .5, 1.1, .4, woodD, MX + 8, .55, -7.25); box(G, .55, .05, .45, woodL, MX + 8, 1.12, -7.25);
      // ризница: сундуки, облачения, опрокинутый подсвечник, коврик над люком
      box(G, 1.2, .7, .6, woodD, MX + 10.6, .35, -2.6); box(G, 1.2, .7, .6, woodD, MX + 12.6, .35, -4.0);
      box(G, .06, 1.4, .9, M('#d8c890', { r: .7 }), MX + 13.25, 1.4, -2.9);
      L.candle = cyl(G, .05, .09, 1.0, gold, MX + 11.2, .1, -3.4, 10); L.candle.rotation.z = Math.PI / 2;
      L.blood = new THREE.Mesh(new THREE.CircleGeometry(.12, 10), M('#4a0a08', { r: .4 })); L.blood.rotation.x = -Math.PI / 2; L.blood.position.set(MX + 11.5, .04, -3.3); G.add(L.blood);
      L.rug = box(G, 1.0, .02, .8, M('#6a2a24', { r: 1 }), MX + 12.3, .04, -3.1);
      box(G, .8, .03, .7, woodD, MX + 12.4, .035, -3.2);
      lamp(L, G, MX + 11.6, 2.4, -3.3, { r: .05, i: .5, d: 4, c: '#ffc070', hex: 0xffb060 });
      // кельи: четыре комнаты в один ряд
      house(FP.cells, 2.6, logM, [-12.5, -9.5, -6.5, -3.5].map(c => ['N', c, .8]), { rise: 1.3 });
      for (const x of [-11, -8, -5]) wallX(G, MX + x, 1, 5, 0, 2.6, logM, null, .16);
      for (const c of [-12.5, -9.5, -6.5, -3.5]) { box(G, 2.3, .4, .6, woodL, MX + c, .2, 4.4); box(G, 2.1, .1, .55, M('#a89878', { r: 1 }), MX + c, .45, 4.4); box(G, .5, .7, .4, woodD, MX + c + .9, .35, 1.6); iconCorner(MX + c - 1.3, 4.88, Math.PI * .85); win(c, 1.5, 5.12, 0); lamp(L, G, MX + c, 2.2, 3, { r: .04, i: .35, d: 3.2, c: '#ffb060', hex: 0xffb060 }); }
      // киот настоятеля, сапоги у Саввы, гвоздь келаря
      box(G, .5, .7, .2, gold, MX - 13.6, 1.5, 2.3); box(G, .38, .52, .05, M('#3a2418', {}), MX - 13.5, 1.5, 2.3);
      L.boots = new THREE.Group(); G.add(L.boots); for (const dx of [-.12, .12]) { box(L.boots, .14, .32, .3, M('#1e1612', { r: .5 }), MX - 9.5 + dx, .16, 4.1); }
      L.key = box(G, .05, .22, .04, ironM, MX - 5.5, 1.3, 4.8);
      cyl(G, .015, .015, .08, ironM, MX - 5.5, 1.45, 4.86, 6).rotation.x = Math.PI / 2;
      L.bottle = cyl(G, .06, .07, .28, M('#2a4a2a', { r: .2, m: .1 }), MX - 6.9, .55, 4.5, 10); L.bottle.rotation.z = Math.PI / 2;
      // казначейская: сундук, стол, печь
      house(FP.treas, 2.6, logM, [['W', 4, .8]], { rise: 1.4 });
      box(G, 1.0, .6, .6, M('#4a2a18', { r: .6 }), MX + 8.2, .3, 5.2); for (const dx of [-.3, .3]) box(G, .06, .62, .62, ironM, MX + 8.2 + dx, .31, 5.2);
      box(G, 1.2, .75, .6, woodD, MX + 6.6, .375, 2.7); box(G, .4, .03, .3, M('#ece4cc', {}), MX + 6.5, .77, 2.7);
      box(G, 1.0, 1.5, 1.0, whiteM, MX + 8.1, .75, 2.9); L.treasFire = box(G, .4, .3, .05, M('#ff8a3a', { e: '#ff6a1a', ei: 1.6 }), MX + 7.58, .45, 2.9); L.treasFire.rotation.y = Math.PI / 2;
      cyl(G, .14, .16, 1.8, whiteM, MX + 8.1, 3.3, 2.9, 10);
      win(9.12, 1.5, 4, Math.PI / 2); lamp(L, G, MX + 7, 2.2, 4, { r: .05, i: .55, d: 4.5, c: '#ffc070', hex: 0xffb060 });
      // гостевая изба: две комнаты, стена между ними тонкая
      house(FP.guest, 2.6, logM, [['N', -12.5, .8], ['N', -9.5, .8]], { rise: 1.3 });
      wallX(G, MX - 11, 7, 10.5, 0, 2.6, logM, null, .12);
      for (const c of [-12.5, -9.5]) { box(G, 2.3, .4, .6, woodL, MX + c, .2, 10.0); box(G, 2.1, .1, .55, M('#8a6a5a', { r: 1 }), MX + c, .45, 10.0); lamp(L, G, MX + c, 2.2, 8.7, { r: .04, i: .4, d: 3.4, c: '#ffb060', hex: 0xffb060 }); }
      box(G, .1, 1.5, .1, woodD, MX - 8.4, .75, 9.9); const ber = box(G, .05, .5, .02, ironM, MX - 8.4, 1.6, 9.9); ber.rotation.z = .2;
      win(-12.5, 1.5, 6.88, Math.PI); win(-9.5, 1.5, 6.88, Math.PI);
      // колодец с шатром, поленницы, фонари во дворе
      cyl(G, .8, .85, .8, logM, MX, .4, -1, 14); for (const dx of [-.7, .7]) box(G, .12, 1.8, .12, woodD, MX + dx, 1.3, -1); const wr = new THREE.Mesh(new THREE.ConeGeometry(1.2, .9, 4), plankM); wr.position.set(MX, 2.6, -1); wr.rotation.y = Math.PI / 4; G.add(wr); const ws = new THREE.Mesh(new THREE.ConeGeometry(1.0, .5, 4), snowM); ws.position.set(MX, 2.85, -1); ws.rotation.y = Math.PI / 4; G.add(ws);
      for (const [x, z, n] of [[-3, -10.2, 6], [3, 9.9, 5], [14.1, 2, 4]]) for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { const lg = cyl(G, .12, .12, 1.2, M('#6a4a30', { r: .9 }), MX + x + i * .26 - n * .13, .13 + j * .24, z, 8); lg.rotation.x = Math.PI / 2; }
      for (const [x, z] of [[-6, 0], [3, 0], [-3, 7], [3.5, -6.5]]) { cyl(G, .06, .08, 2.8, woodD, MX + x, 1.4, z, 8); box(G, .3, .4, .3, M('#ffd890', { e: '#ffb050', ei: 1.4, op: .9 }), MX + x, 2.95, z); box(G, .38, .06, .38, ironM, MX + x, 3.18, z); lamp(L, G, MX + x, 2.95, z, { r: .01, i: .9, d: 7, c: '#ffc070', hex: 0xffc070 }); L.blockers.push({ x: MX + x, z, lv: 0 }); }
      L.blockers.push({ x: MX, z: -1, lv: 0 }, { x: MX + .6, z: -1, lv: 0 }, { x: MX - .6, z: -1, lv: 0 });
      // лес за стеной
      const fir = M('#141c1a', { r: 1 }), firS = M('#c8d0d8', { r: 1 });
      for (let i = 0; i < 60; i++) { const a = rnd(0, Math.PI * 2), r = rnd(20, 30), x = Math.cos(a) * r, z = Math.sin(a) * r, h = rnd(5, 10); const c = new THREE.Mesh(new THREE.ConeGeometry(h * .28, h, 7), fir); c.position.set(MX + x, h / 2, z); G.add(c); const s = new THREE.Mesh(new THREE.ConeGeometry(h * .2, h * .35, 7), firS); s.position.set(MX + x, h * .82, z); G.add(s); }
      // ---------- подземелье (уровень −1): ледник и ход ----------
      const yb = DY['-1'];
      box(G, 7, .2, 7, stoneM, MX - 9.5, yb - .1, -6.5); slab(G, MX - 13, MX - 6, -10, -3, yb + 2.2, .2, stoneM);
      wallX(G, MX - 13, -10, -3, yb, 2.3, stoneM, null, .3); wallZ(G, -10, MX - 13, MX - 6, yb, 2.3, stoneM, null, .3); wallZ(G, -3, MX - 13, MX - 6, yb, 2.3, stoneM, [[MX - 7, MX - 6]], .3);
      wallX(G, MX - 6, -10, -3.5, yb, 2.3, stoneM, null, .3);
      const iceM = M('#6a9cbc', { r: .12, m: .25, e: '#0c1c28', ei: .4 });
      for (let i = 0; i < 16; i++) { const s = rnd(.5, .9); box(G, s * 1.2, s, s, iceM, MX - 12.4 + (i % 4) * 1.2 + rnd(-.1, .1), yb + s / 2 + Math.floor(i / 8) * .6, -9.4 + Math.floor((i % 8) / 4) * 1.2, rnd(-.2, .2)); }
      for (let i = 0; i < 12; i++) { const ic = new THREE.Mesh(new THREE.ConeGeometry(.05, rnd(.2, .45), 6), iceM); ic.rotation.x = Math.PI; ic.position.set(MX + rnd(-12.8, -6.2), yb + 2.1, rnd(-9.8, -3.2)); G.add(ic); }
      for (let k = 0; k < 7; k++) box(G, .7, .05, .2, woodD, MX - 11, yb + .3 + k * .32, -7.6 + (k * .02));
      for (const dx of [-.35, .35]) box(G, .05, 2.4, .05, woodD, MX - 11 + dx, yb + 1.2, -7.6);
      lamp(L, G, MX - 9.5, yb + 1.9, -6.2, { r: .04, i: .5, d: 6, c: '#9ac8ff', hex: 0x8ab8e8 });
      // ход из ризницы
      box(G, 19.5, .2, 1.6, stoneM, MX + 2.9, yb - .1, -1.5); slab(G, MX - 6.9, MX + 12.7, -2.3, -.7, yb + 2.0, .2, stoneM);
      wallZ(G, -2.3, MX - 6, MX + 11.2, yb, 2.0, stoneM, null, .2); wallZ(G, -.7, MX - 6.9, MX + 12.7, yb, 2.0, stoneM, null, .2);
      box(G, 1.6, .2, 3.2, stoneM, MX + 12, yb - .1, -2.6); wallX(G, MX + 12.8, -4, -.7, yb, 2.0, stoneM, null, .2); wallX(G, MX + 11.2, -4, -2.3, yb, 2.0, stoneM, null, .2); wallZ(G, -4, MX + 11.2, MX + 12.8, yb, 2.0, stoneM, null, .2);
      box(G, 1.2, .2, 2.0, stoneM, MX - 6.5, yb - .1, -2.6); wallX(G, MX - 7, -3, -.7, yb, 2.0, stoneM, null, .2);
      for (let k = 0; k < 7; k++) box(G, .6, .05, .2, woodD, MX + 12, yb + .3 + k * .3, -3.7 + k * .02);
      for (const x of [-4, 1, 6, 10.5]) lamp(L, G, MX + x, yb + 1.7, -1.5, { r: .04, i: .45, d: 5, c: '#ffb060', hex: 0xffa050 });
      // ---------- снегопад ----------
      { const n = 2600, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = MX + rnd(-14, 14); pos[i * 3 + 1] = rnd(-1, 9); pos[i * 3 + 2] = rnd(-14, 14); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const dot = canvasTex(32, 32, (c) => { const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); });
        L.snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xeef4ff, size: .07, map: dot, transparent: true, opacity: .9, depthWrite: false })); G.add(L.snow); }
      // ---------- точки осмотра ----------
      const I = (id, x, z, lv, r) => INSPECT.push({ id, x: MX + x, z, r: r || 1.1, loc: 'monast', lv: lv || 0 });
      I('gate', 0, 10.0, 0, 1.6); I('sacristy', 11.3, -3.2, 0, 1.3); I('hatchS', 12.3, -3.2, 0, .9); I('tunnelUp', 12.0, -3.4, -1, 1.0);
      I('cellarDoor', -11, -7.3, 0, 1.1); I('cellarUp', -11, -7.1, -1, 1.1); I('pimenTied', -12, -8.7, -1, 1.3);
      I('savvaBench', -10.4, 3.9, 0, .8); I('karrCell', -9.5, .2, 0, 1.0); I('feodorNail', -5.6, 4.2, 0, .9); I('feodorBed', -6.9, 3.9, 0, .9);
      I('kiot', -13.3, 1.9, 0, .7); I('kiotEarly', -13.3, 1.9, 0, .7); I('stoveT', 7.4, 2.9, 0, 1.0); I('chestT', 8.2, 4.6, 0, 1.0); I('iovDesk', 6.6, 3.2, 0, 1.0);
      I('refStove', -5.4, -8.0, 0, 1.0); I('iconostasis', 12.3, -7.25, 0, 1.4); I('well', 0, -.1, 0, 1.3);
      // ---------- люди ----------
      const N = (id, place, look, lv, opt) => addNPC(id, place, look, Object.assign({ loc: 'monast', lv, fy: DY[String(lv)] }, opt || {}));
      const sit = (x, z, face, sy) => ({ x: MX + x, z, face, seatY: sy || .45, pose: 'sit' });
      const stand = (x, z, face) => standAt(MX + x, z, face);
      const monk = (o) => Object.assign({ coat: '#17151a', skirt: '#17151a', pants: '#17151a', hat: 'hood', hatC: '#121014', boots: true, belt: '#2a2420' }, o);
      L.np = {
        iov: N('iov', stand(7.4, 4.4, '-x'), monk({ beard: 'full', beardC: '#2a2420', hair: '#2a2420', skin: '#e2b896', eyeC: '#3a3a30' }), 0),
        savva: N('savva', sit(-9.5, 4.25, '-z'), monk({ hat: null, hair: '#6a4a2a', hairStyle: 'messy', skin: '#f0c8a8', eyeC: '#4a5a3a' }), 0),
        feodor: N('feodor', sit(-6.5, 4.25, '-z'), monk({ hat: null, beard: 'full', beardC: '#7a5030', hair: '#7a5030', hairStyle: 'messy', skin: '#e8a888', heavy: true, sleep: true }), 0),
        varsonofiy: N('varsonofiy', sit(-3.5, 4.25, '-z'), monk({ beard: 'long', beardC: '#e8e4dc', hair: '#e8e4dc', skin: '#ecc8b0' }), 0),
        pimen: N('pimen', sit(-12.5, 4.25, '-z'), monk({ beard: 'long', beardC: '#c8c4bc', hair: '#c8c4bc', skin: '#ecc8b0', prop: 'book' }), 0),
        pimenC: N('pimen', sit(-12.0, -9.3, '+z', .3), monk({ beard: 'long', beardC: '#dfe8f0', hair: '#dfe8f0', skin: '#c8d0dc', sleep: true }), -1),
        pimenS: N('pimen', sit(-6.0, -8.0, '-x', .45), monk({ beard: 'long', beardC: '#c8c4bc', hair: '#c8c4bc', skin: '#ecc8b0' }), 0),
        nikifor: N('nikifor', stand(-9.5, 8.6, '-z'), { coat: '#8a2420', pants: '#3a3a30', boots: true, belt: '#c9a050', buttons: true, hat: 'cap', hatC: '#6a1a18', beard: 'full', beardC: '#5a3a20', hair: '#5a3a20', skin: '#dca07c', eyeC: '#4a3a28' }, 0),
        evdokia: N('evdokia', sit(-12.5, 9.75, '-z'), { female: true, coat: '#7a3a2a', skirt: '#3a2a4a', hat: 'kerchief', hatC: '#c9a050', hair: '#5a3a22', hairStyle: 'bun', skin: '#eebca0', heavy: true, lips: '#a04a48', armPose: 'lap' }, 0)
      };
      L.np.pimenC.talk = false; L.np.pimenC.bark = 'tied'; L.np.pimenC.name = 'Связанный человек';
      // братия в храме
      let sd = 700; const X = (place, look, bark, name) => N('x' + (sd++), place, look, 0, { bark, name });
      X(stand(10.6, -8.6, '+x'), monk({ beard: 'full', beardC: '#4a3a2a', hair: '#4a3a2a', skin: '#e2b896' }), 'monk', 'Монах на молитве');
      X(stand(10.4, -5.9, '+x'), monk({ beard: 'trim', beardC: '#3a2a20', hair: '#3a2a20', skin: '#e8b996' }), 'monk', 'Монах на молитве');
      Object.values(L.np).forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: n.lv || 0 }));
      worldUV(G); L.merged = mergeStatic(G, L, extra);
      // ---------- проходимые области ----------
      const W = [[MX - 14.5, MX + 14.5, -10.5, 10.4, 0]].concat(ROOMS.map(r => [MX + r[0], MX + r[1], r[2], r[3], 0]));
      W.push([MX - 12.7, MX - 6.3, -9.7, -3.3, -1], [MX - 7.0, MX - 6.0, -3.5, -.9, -1], [MX - 6.6, MX + 12.6, -2.1, -.9, -1], [MX + 11.3, MX + 12.6, -3.9, -.9, -1]);
      L.walk = W;
      L.zones = [[MX - 15, MX - 3, 'Трапезная и кельи', 0], [MX - 3, MX + 4, 'Монастырский двор', 0], [MX + 4, MX + 15, 'Храм и казначейская', 0], [MX - 15, MX + 15, 'Ледник и подземный ход', -1]];
    },
    // стены построек: внутрь только через двери
    block(x, z) {
      if ((P.lv || 0) !== 0) return false;
      const lx = x - MX;
      for (const k in FP) { const f = FP[k]; if (lx > f[0] - .25 && lx < f[1] + .25 && z > f[2] - .25 && z < f[3] + .25) return !ROOMS.some(r => inR(r, lx, z)); }
      return false;
    },
    enter(L) {
      if (!S.f.m_started) { S.f.m_started = true; S.time = -180; resetMon(L); startPos(); setTimeout(() => startScene('monIntro'), 500); }
      else startPos();
    },
    tick(L, dt) {
      const busy = D.on || endEl.classList.contains('on') || noteEl.classList.contains('on') || sandOn || ['fight', 'cards', 'band', 'keypad'].some(id => document.getElementById(id).classList.contains('on'));
      const t = performance.now() / 1000, f = S.f;
      // снег идёт вокруг камеры
      { const p = L.snow.geometry.attributes.position, cx = camera.position.x, cz = camera.position.z, cy = camera.position.y;
        for (let i = 0; i < p.count; i++) { let x = p.getX(i) + dt * (1.6 + Math.sin(t * .7 + i) * .5), y = p.getY(i) - dt * (1.1 + (i % 5) * .15), z = p.getZ(i) + dt * Math.sin(t * .5 + i * .3) * .4;
          if (y < cy - 2) y += 11; if (x > cx + 14) x -= 28; if (x < cx - 14) x += 28; if (z > cz + 14) z -= 28; if (z < cz - 14) z += 28; p.setXYZ(i, x, y, z); }
        p.needsUpdate = true; const lx = P.x - MX; L.snow.visible = (P.lv || 0) === 0 && !ROOMS.slice(0, 10).some(r => inR(r, lx, P.z)); }
      L.flames.forEach((fl, i) => { fl.scale.y = 1.6 + Math.sin(t * 11 + i * 1.7) * .3; });
      L.refFire.material.emissiveIntensity = 1.7 + Math.sin(t * 9) * .3;
      if (f.m_solved) return;
      if (!busy) S.time += dt / 3;
      const tm = S.time, np = L.np;
      const set = (k, v) => { if (!!f[k] !== v) { if (v) f[k] = true; else delete f[k]; derive(); updateQuest(); } };
      set('m_tracks', tm >= -20 && tm < 60); set('m_tracksGone', tm >= 60); set('m_bolted', tm >= -10); set('m_boots', tm >= -10); set('m_burnt', tm >= 30); set('m_starecTime', tm >= 10);
      if (tm >= -60 && !f.m_gone && !busy) startScene('monGone');
      np.pimen.hidden = !!f.m_gone; np.pimenC.hidden = !(f.m_gone && !f.m_saved); np.pimenS.hidden = !f.m_saved;
      np.iov.hidden = tm >= -60 && tm < 30 && !f.m_ready; np.savva.hidden = tm >= -20 && tm < -10;
      L.tracks.visible = !!f.m_tracks; L.bolt.visible = !!f.m_bolted; L.boltOpen.visible = !f.m_bolted;
      L.boots.visible = tm >= -10 && !f.savvaConf; L.key.visible = tm < -90; L.candle.visible = tm >= -60; L.blood.visible = tm >= -60; L.rug.visible = tm < -60;
      L.padlock.visible = !f.m_cellarOpen && !f.m_saved; L.treasFire.material.emissiveIntensity = (tm >= 30 && tm < 60 ? 3 : 1.4) + Math.sin(t * 8) * .3;
      // 04:00 — настоятель замерзает
      if (tm >= 240 && !f.m_saved && !busy) startScene('monDie');
    }
  };
  function startPos() { place(MX - 2.2, 6.6, -.75, 0); }
  function resetMon(L) {
    for (const k in S.f) if (k.startsWith('m_') && !['m_solved', 'm_started'].includes(k)) delete S.f[k];
    S.f.m_started = true;
    NPCS.forEach(n => { if (n.loc === 'monast') delete S.f['met_' + n.id]; });
    derive();
  }

  // ---------- вычисляемые флаги ----------
  const d0 = window.deriveLoc;
  window.deriveLoc = function () {
    d0 && d0();
    const f = S.f;
    const tracks = f.tracksFake || f.bootsSavva || f.savvaConf || f.karrSavva || f.gateLocked || f.nikiforBolt || f.palataLie || f.ruleCompline;
    const cellar = f.pimenFound || f.starecHeard || f.candleBlood || f.keyGone || f.iovKey;
    const motive = f.burntLetter || f.notebook || f.nikiforLetter;
    f.m_ready = !!(f.m_saved && tracks && cellar && motive);
    // Ложь Палаты: ворота заперты изнутри + следы не те
    if (!f.palataLie && (f.gateLocked || f.nikiforBolt) && (f.tracksFake || f.bootsSavva || f.savvaConf) && STORY.clues.palataLie) setTimeout(() => { if (!S.f.palataLie) { addClue('palataLie'); toastMsg = 'Ложь Палаты: досье врёт. Улика-опровержение — в блокноте.'; toastT = 4; } }, 900);
  };

  // ---------- действия ----------
  const la0 = window.locAction;
  window.locAction = function (a, def) {
    const tm = S.time, f = S.f;
    if (a === 'toMonast') { startScene('toMonast'); return true; }
    if (a === 'goMonast') { closeDialog(); enterLoc('monast'); return true; }
    if (a === 'monFinale') { S.f.act2done = true; startScene('monFinale'); return true; }
    if (a === 'monRescue') { startScene('monRescue'); setTimeout(() => {}, 0); return true; }
    if (a === 'monGate') {
      const L = [];
      if (tm < -20) L.push([null, null, 'Ворота на ночь прикрыты, засов отодвинут. Снег у порога нетронутый.']);
      else if (tm < 60) {
        L.push([null, null, 'От келий к воротам тянется цепочка следов. Мелкие, смазанные — будто по ним прошли дважды.']);
        if (S.hero === 'miron') L.push(['det', null, 'Шли задом, след в след. Так зверя со следа сбивают. И нога маловата для старика.']);
        else L.push(['det', null, 'Для тяжёлого старика следы слишком мелкие. И дальше ворот они не идут.']);
      } else L.push([null, null, 'Метель замела двор. Следов у ворот не осталось.']);
      if (tm >= -10) L.push([null, null, 'Засов задвинут изнутри. Тот, кто ушёл в метель, не мог запереть за собой.']);
      startSolo(L, () => { if (tm >= -20 && tm < 60) { addClue('tracksFake'); if (S.hero === 'miron') showBuff('Мирон читает следы'); } if (tm >= -10) addClue('gateLocked'); derive(); updateQuest(); });
      S.time += 2; return true;
    }
    if (a === 'monSacristy') {
      if (tm < -60) startSolo([[null, null, 'В ризнице темно и тихо. Сундуки с облачениями, полка с сосудами.']]);
      else startSolo([[null, null, 'Тяжёлый медный подсвечник лежит на боку. На нём кровь и седой волос.'], [null, null, 'Коврик сбит. Под ним — люк в подземный ход.']], () => { addClue('candleBlood'); derive(); updateQuest(); });
      S.time += 2; return true;
    }
    if (a === 'monCellar') {
      if (f.m_cellarOpen || f.m_saved) { locAction('deck:-1:cellarUp'); return true; }
      startSolo([[null, null, 'Люк в ледник под трапезной заперт на тяжёлый висячий замок. Ключ — у келаря.'], ['det', null, 'Без ключа не открыть. Нужен другой путь — или крепкое плечо.']]);
      return true;
    }
    if (a === 'monBoots') {
      if (tm >= -10) startSolo([[null, null, 'Под лавкой послушника — мокрые сапоги. Большие, не по ноге юнцу. Внутри тает снег.'], ['det', null, 'Это сапоги настоятеля.']], () => { addClue('bootsSavva'); derive(); updateQuest(); });
      else startSolo([[null, null, 'Лавка, тюфяк, псалтирь. Ничего.']]);
      S.time += 2; return true;
    }
    if (a === 'monNail') {
      if (tm >= -90) startSolo([[null, null, 'Гвоздь у изголовья келаря пуст.'], ['det', null, 'Ключа от ледника нет.']], () => { addClue('keyGone'); derive(); updateQuest(); });
      else startSolo([[null, null, 'На гвозде у изголовья висит большой ключ. На бирке углём: «ледник».']]);
      S.time += 2; return true;
    }
    if (a === 'monStove') {
      if (tm >= 30) startSolo([[null, null, 'В печи догорает бумага. Ты выхватываешь обугленный край.'], [null, null, 'Почерк настоятеля. «...Святейшему Патриарху... паломник... нестареющий...»']], () => { addClue('burntLetter'); derive(); updateQuest(); });
      else startSolo([[null, null, 'Печь топится. Дрова, зола — ничего.']]);
      S.time += 2; return true;
    }
    if (a === 'monRollback') {
      closeDialog(); sandOn = true; sandEl.classList.add('on'); window.SFX && SFX.play('sand');
      setTimeout(() => { S.loops++; resetMon(LOC.monast); S.time = -180; startPos(); sandEl.classList.remove('on'); sandOn = false; updateQuest(); updateInv(); startScene('monLoop'); }, 2600);
      return true;
    }
    return la0 ? la0(a, def) : false;
  };

  // кнопка «Завершить дело» для монастыря
  const fin0 = window.finishLocation;
  window.finishLocation = function () {
    if (WORLD.cur !== 'monast') return fin0 && fin0();
    if (S.f.m_solved) { toastMsg = 'Здесь нечего завершать.'; toastT = 2.5; return; }
    if (D.on) closeDialog();
    ['tracksFake', 'gateLocked', 'palataLie', 'candleBlood', 'pimenFound', 'burntLetter', 'notebook', 'lilyCoins', 'evdokiaPurse'].forEach(id => { S.f[id] = true; if (!S.clues.includes(id)) S.clues.push(id); });
    if (S.time < 40) S.time = 40;
    S.f.m_gone = true; S.f.m_saved = true; derive(); updateQuest();
    const L = LOC.monast; L.tick(L, 0);
    const iv = L.np.iov; place(iv.x - 1.1, iv.z, -Math.PI / 2, 0);
    P.yaw = Math.atan2(-(iv.x - P.x), -(iv.z - P.z));
    showBuff('Все улики собраны — обвини брата Иова', false, S.hero);
    setTimeout(() => { if (!D.on) startDialog(iv); }, 450);
  };

  // ---------- вокзал после парохода: третья платформа, Летопись ----------
  const SX = 300, ST = STORY.locs.station;
  ST.quests = [['act2done&!letDone', 'Смотрителя нет у самовара. На столе — раскрытая Летопись.'], ['act2done', 'Третье дело раскрыто. Платформа 4 (1968) ещё в тумане.'],
    ['act1done&!konfDone', 'Вернись к лавке.'], ['act1done', 'Платформа 3: монастырь в метель, 1640-е. Смотритель выдаст досье.']].concat(ST.quests.filter(q => !q[0].startsWith('act1done')));
  ST.leads.unshift(['act2done&!letDone', 'Летопись на столе у самовара.', 'insp:letopisT'], ['act1done&konfDone&!act2done', 'Платформа 3 — монастырь, 1640-е.', 'insp:plat3']);
  Object.assign(STORY.inspect, {
    plat3: { label: 'платформа 3 · 1640-е · монастырь', if: 'act1done&konfDone&!act2done', lines: [], go: 'toMonast' },
    plat3wait: { label: 'платформа 3 · 1640-е', if: '!act1done|!konfDone', lines: [[null, null, 'Платформа 3. 1640-е. Туман стоит стеной, в нём кружит снег. Табло: «Не время».']] },
    plat3done: { label: 'платформа 3 · 1640-е', if: 'act2done', lines: [[null, null, 'Платформа 3. 1640-е. Табло: «Раскрыто». Из тумана тянет морозом и ладаном.']] },
    letopisT: { label: 'Летопись', if: 'act2done&!letDone', lines: [
      [null, null, 'Тяжёлая книга в белом переплёте. Ровные строки, печати Палаты, номера дел.'],
      [null, null, 'Ты быстро вырываешь несколько листов и прячешь за пазуху. Самовар тихо шипит.'],
      ['det', null, 'Пусть тот, кто это писал, сам расскажет, где здесь правда.']], set: ['letDone', 'evseyOpen'] }
  });
  INSPECT.push({ id: 'plat3wait', x: SX - 7, z: 1.1, r: 1.35, loc: 'station' }, { id: 'plat3done', x: SX - 7, z: 1.1, r: 1.35, loc: 'station' }, { id: 'letopisT', x: SX + 2.8, z: 5.6, r: 1.1, loc: 'station' });
  const smD = STORY.dialogs.smotritel;
  smD.nodes.menu.choices.unshift({ t: 'Я готов к следующему делу.', go: 'next2', if: 'act1done&konfDone&!act2done&!sm_next2' });
  smD.nodes.next2 = { set: ['sm_next2'], lines: [['smotritel', 'neutral', 'Третья платформа. Монастырь, тысяча шестьсот сороковые. Там метель. Одевайтесь теплее — хотя вам, конечно, всё равно.']], go: 'menu' };
  const stL = LOC.station, stEnter = stL.enter, stTick = stL.tick;
  stL.enter = function (L) {
    stEnter.call(this, L);
    const sm = NPCS.find(n => n.id === 'smotritel'); if (sm) sm.hidden = !!(S.f.act2done && !S.f.letDone);
    if (S.f.act2done && !L.board3) { L.board3 = true; L.boardMesh.material = M('#ffffff', { map: canvasTex(512, 320, (g, w, h) => {
      g.fillStyle = '#23342a'; g.fillRect(0, 0, w, h); noise(g, w, h, 4000, .08);
      g.fillStyle = '#ece8dc'; g.textAlign = 'center'; g.font = 'bold 44px Georgia'; g.fillText('ДЕЛА', w / 2, 56); g.font = 'bold 72px Georgia'; g.fillText('3 из 100', w / 2, 136);
      g.textAlign = 'left'; g.font = '24px Georgia'; g.fillText('№1  «Тамбур», 2008 — раскрыто', 40, 196); g.fillText('№2  «Святая Марфа», 1926 — раскрыто', 40, 232); g.fillText('№3  «Следы в снегу», 1640-е — раскрыто', 40, 268); }), r: .9 }); }
    if (S.f.act2done && !S.f.letSeen && S.f.konfDone) setTimeout(() => startScene('letopis'), 600);
  };
  stL.tick = function (L, dt) {
    stTick.call(this, L, dt);
    if (S.f.letDone && !S.f.evseyToast) { S.f.evseyToast = true; toastMsg = 'Открыт секретный герой: летописец Евсей'; toastT = 4.5; const sm = NPCS.find(n => n.id === 'smotritel'); if (sm) sm.hidden = false; }
  };

  // Shift+F11 — сразу в монастырь (для проверки)
  document.addEventListener('keydown', e => {
    if (!e.shiftKey || e.code !== 'F11') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!S.hero) { S.f['hero:miron'] = true; S.hero = 'miron'; }
    if (D.on) closeDialog();
    gameOn = true; S.f.solved = true; S.f.act1done = true; S.f.konfDone = true;
    enterLoc('monast');
  }, true);
})();
