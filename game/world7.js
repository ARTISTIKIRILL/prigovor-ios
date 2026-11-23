// Финал: Замок Белого Полдня (дело «Двенадцать ударов»). Локация стоит по оси X около 2100.
// Уровень 0: прихожая, тронный зал, галерея портретов, библиотека Летописи, казна, башня-мастерская. Уровень −1: усыпальница и зал Часов.
// Вечный полдень: солнце в зените, теней нет. Данные — story8.js.
(function () {
  const H = WORLD.H, LOC = WORLD.LOC, NX = 2100;
  const { M, MT, box, cyl, wallX, wallZ, lamp, canvasTex, noise, worldUV, mergeStatic, place, lin, rnd, DY } = H;
  const X = x => NX + x, yb = DY['-1'];
  const TOWER = [8, 20, -2, 8];

  LOC.noon = {
    fog: [0xdfe8f2, 18, 90], walk: [], zones: [], lamps: [], blockers: [],
    build(L) {
      const G = L.group = new THREE.Group(); scene.add(G);
      G.add(new THREE.HemisphereLight(0xffffff, 0x5a5448, .5));
      const sun = new THREE.DirectionalLight(0xfff6e0, .45); sun.position.set(0, 1, 0); G.add(sun); G.add(sun.target); sun.target.position.set(0, 0, 0);
      const extra = [];
      const mk = (draw, w, h, tile, o) => { const t = canvasTex(w, h, draw, 1, 1); const m = new THREE.MeshStandardMaterial(Object.assign({ map: t, roughness: .5 }, o || {})); m.userData.tile = tile; extra.push(m); return m; };
      // ---------- материалы ----------
      const marble = mk((g, w, h) => { g.fillStyle = '#dcd8ce'; g.fillRect(0, 0, w, h); for (let k = 0; k < 18; k++) { g.strokeStyle = 'rgba(170,160,150,' + rnd(.08, .25) + ')'; g.lineWidth = rnd(.6, 2.2); g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += rnd(-20, 20); y += rnd(10, 30); g.lineTo(x, y); } g.stroke(); } noise(g, w, h, 2000, .03); }, 512, 512, 3, { roughness: .25 });
      const floorM = mk((g, w, h) => { const s = w / 4; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#c8c2b4' : '#e2ded4'; g.fillRect(i * s, j * s, s, s); } g.strokeStyle = 'rgba(200,170,100,.7)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); } g.fillStyle = 'rgba(200,170,100,.6)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(i * s + s / 2, j * s + s / 2, 6, 0, 7); g.fill(); } noise(g, w, h, 2500, .03); }, 512, 512, 3.2, { roughness: .12, metalness: .05 });
      const gold = M('#d8b060', { m: .9, r: .25 }), white = M('#f6f4ee', { r: .4 }), whiteCloth = M('#f8f6f0', { r: .9, side: 1 }), stoneD = MT('stone', 1.4, { c: '#6a6460' }), woodW = M('#e8dcc4', { r: .5 });
      // ---------- небо: белый полдень ----------
      const skyT = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ec4ec'); gr.addColorStop(.45, '#d8e8f6'); gr.addColorStop(.52, '#f2f6fa'); gr.addColorStop(1, '#e8e4dc'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const sky = L.sky = new THREE.Mesh(new THREE.SphereGeometry(80, 24, 12), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; G.add(sky);
      { const st = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,250,1)'); gr.addColorStop(.25, 'rgba(255,250,230,1)'); gr.addColorStop(.5, 'rgba(255,245,210,.35)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, fog: false, depthWrite: false, transparent: true })); s.scale.set(24, 24, 1); s.position.set(0, 70, -10); sky.add(s); }
      box(G, 200, .02, 200, M('#f0ece2', { r: .6 }), X(0), -.035, 0); // тонкая: под ней потолок усыпальницы
      // белый город внизу и дорога
      for (let i = 0; i < 70; i++) { const a = rnd(0, Math.PI * 2), r = rnd(40, 75); const w = rnd(3, 8), h = rnd(3, 12); box(G, w, h, w, white, X(Math.cos(a) * r), h / 2 - 2, Math.sin(a) * r); if (i % 4 === 0) { const d = new THREE.Mesh(new THREE.SphereGeometry(w * .45, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold); d.position.set(X(Math.cos(a) * r), h - 2, Math.sin(a) * r); G.add(d); } }
      box(G, 4, .04, 40, M('#ffffff', { r: .3, e: '#ffffff', ei: .15 }), X(0), .03, 40);
      // ---------- помощники ----------
      const room = (x0, x1, z0, z1, h, wall, floor, doors, skip, y0) => {
        doors = doors || {}; skip = skip || ''; y0 = y0 || 0; const gp = s => (doors[s] || []).map(([c, w]) => [c - w / 2, c + w / 2]);
        if (!skip.includes('N')) wallZ(G, z0, X(x0), X(x1), y0, h, wall, gp('N').map(([a, b]) => [X(a), X(b)]), .4);
        if (!skip.includes('S')) wallZ(G, z1, X(x0), X(x1), y0, h, wall, gp('S').map(([a, b]) => [X(a), X(b)]), .4);
        if (!skip.includes('W')) wallX(G, X(x0), z0, z1, y0, h, wall, gp('W'), .4);
        if (!skip.includes('E')) wallX(G, X(x1), z0, z1, y0, h, wall, gp('E'), .4);
        box(G, x1 - x0, .06, z1 - z0, floor, X((x0 + x1) / 2), y0, (z0 + z1) / 2);
        box(G, x1 - x0, .2, z1 - z0, white, X((x0 + x1) / 2), y0 + h + .1, (z0 + z1) / 2);
      };
      const lilyT = canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#f8f6f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8b060'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
        g.fillStyle = '#f0e6c8'; g.beginPath(); g.moveTo(w / 2, 50); g.quadraticCurveTo(w / 2 + 34, 110, w / 2, 170); g.quadraticCurveTo(w / 2 - 34, 110, w / 2, 50); g.fill(); g.strokeStyle = '#c8a050'; g.lineWidth = 3; g.stroke();
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(w / 2, 110, 18, 11, 0, 0, 7); g.fill(); g.fillStyle = '#3a6aa8'; g.beginPath(); g.arc(w / 2, 110, 8, 0, 7); g.fill(); g.fillStyle = '#101820'; g.beginPath(); g.arc(w / 2, 110, 3.5, 0, 7); g.fill();
        g.fillStyle = '#d8b060'; g.beginPath(); g.moveTo(0, h - 10); g.lineTo(w / 2, h - 40); g.lineTo(w, h - 10); g.fill(); });
      const lilyM = M('#ffffff', { map: lilyT, r: .9, side: 1 });
      const banner = (x, y, z, ry) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), lilyM); b.position.set(x, y, z); b.rotation.y = ry; G.add(b); };
      const column = (x, z, h) => { cyl(G, .38, .42, h, white, X(x), h / 2, z, 20); cyl(G, .52, .52, .3, gold, X(x), h - .15, z, 20); cyl(G, .55, .55, .3, white, X(x), .15, z, 20); L.blockers.push({ x: X(x), z, lv: 0, r: .55 }); };
      // световые столбы из окон (аддитивные плоскости)
      const shaftT = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,250,230,.5)'); gr.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const shaftM = new THREE.MeshBasicMaterial({ map: shaftT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: .22 });
      const shaft = (x, z, h, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, h), shaftM); p.position.set(X(x), h / 2, z); p.rotation.y = ry || 0; p.renderOrder = 3; G.add(p); };
      // ---------- прихожая ----------
      room(-4, 4, 8, 14, 5, marble, floorM, { S: [[0, 3]], N: [[0, 3]] });
      for (const s of [-1, 1]) { box(G, 1.2, 6, 1.2, white, X(s * 2.4), 3, 14.6); banner(X(s * 3.6), 3, 13.78, Math.PI); }
      box(G, 6, .8, 1.4, white, X(0), 6.2, 14.6); box(G, 6.2, .14, 1.5, gold, X(0), 6.66, 14.6);
      // ---------- тронный зал ----------
      const TH = 10;
      room(-8, 8, -12, 8, TH, marble, floorM, { S: [[0, 3]], W: [[-7, 2], [3, 2]], E: [[-7, 2], [3, 2]] }, 'S');
      for (let z = -9; z <= 5; z += 3.5) for (const s of [-1, 1]) column(s * 5, z, TH);
      // высокие окна над боковыми крыльями (свет — белый)
      const winM = M('#ffffff', { e: '#fff4dc', ei: .55, r: .2 });
      for (let z = -9; z <= 5; z += 3.5) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2), winM); w.position.set(X(s * 7.78), 7.4, z); w.rotation.y = -s * Math.PI / 2; G.add(w); box(G, .1, 3.4, 1.8, gold, X(s * 7.82), 7.4, z); shaft(s * 6.2, z, 7, Math.PI / 2); }
      // помост и трон
      box(G, 8, .4, 3.4, white, X(0), .2, -10.2); box(G, 6, .4, 2.4, white, X(0), .6, -10.6); box(G, 8.1, .06, 3.5, gold, X(0), .41, -10.2);
      box(G, 1.8, .5, 1.2, gold, X(0), 1.05, -11.0); box(G, 1.8, 3.4, .3, gold, X(0), 2.5, -11.55); box(G, 1.2, 2.6, .05, M('#f4f0e6', { r: .8 }), X(0), 2.4, -11.38);
      { const sun = new THREE.Mesh(new THREE.TorusGeometry(1.1, .07, 8, 40), gold); sun.position.set(X(0), 4.6, -11.6); G.add(sun); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const r = box(G, .06, .6, .04, gold, X(Math.cos(a) * 1.5), 4.6 + Math.sin(a) * 1.5, -11.62); r.rotation.z = a - Math.PI / 2; } }
      banner(X(-3.2), 5, -11.75, 0); banner(X(3.2), 5, -11.75, 0);
      // длинная дорожка к трону
      box(G, 2.4, .02, 17, M('#f4f0e6', { r: .9 }), X(0), .035, -1.5); for (const s of [-1, 1]) box(G, .1, .025, 17, gold, X(s * 1.15), .04, -1.5);
      // люстры-солнца
      for (const z of [-6, 1]) { const c = new THREE.Group(); c.position.set(X(0), 8, z); G.add(c); const r = new THREE.Mesh(new THREE.TorusGeometry(1.2, .06, 8, 40), gold); r.rotation.x = Math.PI / 2; c.add(r); for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), M('#fffaf0', { e: '#fff6e0', ei: 2 })); b.position.set(Math.cos(a) * 1.2, .05, Math.sin(a) * 1.2); c.add(b); } lamp(L, G, X(0), 7.6, z, { r: .01, i: .6, d: 12, c: '#fffaf0', hex: 0xfff8ee }); }
      // лестница в усыпальницу (запад) и дверь в зал Часов (восток) — у помоста
      box(G, 1.6, .05, 1.6, stoneD, X(-6.4), .04, -10); for (let k = 0; k < 4; k++) box(G, 1.4, .1, .3, white, X(-6.4), .02 - k * .05, -10.4 + k * .3);
      { const d = box(G, 1.8, 3.0, .2, gold, X(6.6), 1.5, -11.7); const lk = new THREE.Mesh(new THREE.CircleGeometry(.25, 20), M('#3a3a40', { m: .8 })); lk.position.set(X(6.6), 1.5, -11.58); G.add(lk); L.clockDoorM = d; }
      // ---------- галерея портретов (запад) ----------
      room(-20, -8, -12, -2, 6, marble, floorM, {}, 'E');
      const eras = [['1690', '#6a1a2a', 'парик'], ['1740', '#1a2a5a', 'треуголка'], ['1790', '#2a4a2a', 'корона'], ['1850', '#3a3a3a', 'мундир'], ['1910', '#5a4a2a', 'фрак'], ['1960', '#e8e4dc', 'белое']];
      eras.forEach(([yr, col, kind], i) => { const t = canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#2a2018'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h * .4, 10, w / 2, h * .4, w * .7); gr.addColorStop(0, '#4a3a2a'); gr.addColorStop(1, '#1a120a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
          g.fillStyle = col; g.beginPath(); g.moveTo(w / 2 - 90, h); g.quadraticCurveTo(w / 2, h * .5, w / 2 + 90, h); g.fill();
          g.fillStyle = '#ead4bc'; g.beginPath(); g.ellipse(w / 2, h * .36, 36, 46, 0, 0, 7); g.fill(); const fy = h * .36; const sh = g.createRadialGradient(w / 2 + 12, fy + 8, 4, w / 2, fy, 50); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(90,50,30,.35)'); g.fillStyle = sh; g.beginPath(); g.ellipse(w / 2, fy, 36, 46, 0, 0, 7); g.fill();
          for (const s of [-1, 1]) { g.fillStyle = '#f4ece0'; g.beginPath(); g.ellipse(w / 2 + s * 13, fy - 6, 7, 3.6, 0, 0, 7); g.fill(); g.fillStyle = '#4a6a8a'; g.beginPath(); g.arc(w / 2 + s * 13, fy - 6, 2.8, 0, 7); g.fill(); g.strokeStyle = '#5a3a28'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 + s * 6, fy - 13); g.lineTo(w / 2 + s * 20, fy - 14); g.stroke(); }
          g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(w / 2 + 22, fy - 15, 1.8, 0, 7); g.fill();
          g.strokeStyle = 'rgba(120,70,50,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 - 1, fy - 2); g.lineTo(w / 2 - 4, fy + 12); g.lineTo(w / 2 + 3, fy + 13); g.stroke();
          g.fillStyle = '#c8b8a0'; g.beginPath(); g.ellipse(w / 2, fy + 32, 22, 12, 0, 0, Math.PI); g.fill(); g.strokeStyle = '#8a4a3a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(w / 2 - 9, fy + 22); g.quadraticCurveTo(w / 2, fy + 25, w / 2 + 9, fy + 22); g.stroke();
          g.fillStyle = '#c8b898'; if (kind === 'парик') { g.beginPath(); g.ellipse(w / 2, h * .3, 54, 60, 0, Math.PI, 0); g.fill(); g.fillRect(w / 2 - 54, h * .3, 20, 70); g.fillRect(w / 2 + 34, h * .3, 20, 70); } else if (kind === 'треуголка') { g.fillStyle = '#1a1a1a'; g.beginPath(); g.moveTo(w / 2 - 60, h * .25); g.lineTo(w / 2, h * .14); g.lineTo(w / 2 + 60, h * .25); g.fill(); } else if (kind === 'корона') { g.fillStyle = '#d8b060'; g.fillRect(w / 2 - 34, h * .19, 68, 14); for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(w / 2 - 34 + k * 17, h * .19); g.lineTo(w / 2 - 26 + k * 17, h * .13); g.lineTo(w / 2 - 18 + k * 17, h * .19); g.fill(); } } else { g.fillStyle = '#e8e4dc'; g.beginPath(); g.ellipse(w / 2, h * .27, 38, 22, 0, Math.PI, 0); g.fill(); }
          g.fillStyle = '#d8b060'; g.font = 'italic 20px Georgia'; g.textAlign = 'center'; g.fillText('Государь, ' + yr, w / 2, h - 16); noise(g, w, h, 3000, .07); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.73), M('#ffffff', { map: t, r: .7 })); const x = -18.5 + i * 1.95; p.position.set(X(x), 2.6, -11.77); G.add(p); box(G, 1.5, 1.93, .08, gold, X(x), 2.6, -11.83); });
      for (let x = -18; x <= -10; x += 4) lamp(L, G, X(x), 4.8, -7, { r: .06, i: .5, d: 8, c: '#fffaf0', hex: 0xfff8ee });
      for (let k = 0; k < 4; k++) { box(G, 1.4, .5, .5, M('#c8b8a0', { r: .8 }), X(-18 + k * 3), .3, -4); }
      // ---------- библиотека Летописи (запад) ----------
      room(-20, -8, -2, 8, 6, marble, floorM, {}, 'EN');
      const booksT = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) { let x = 4; g.fillStyle = '#c8a860'; g.fillRect(0, r * 64 + 58, w, 6); while (x < w - 6) { const bw = rnd(10, 22), bh = rnd(40, 54); g.fillStyle = ['#f4f0e6', '#e8dcc4', '#d8c8a8', '#f8f4ea'][Math.floor(Math.random() * 4)]; g.fillRect(x, r * 64 + 58 - bh, bw - 1, bh); g.fillStyle = 'rgba(200,160,80,.8)'; g.fillRect(x + 2, r * 64 + 58 - bh + 8, bw - 5, 2); g.fillRect(x + 2, r * 64 + 58 - 12, bw - 5, 2); x += bw; } } });
      const bM = M('#ffffff', { map: booksT, r: .8 });
      for (const z of [-1.7, 7.7]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 4), bM); b.position.set(X(-14), 2.1, z); b.rotation.y = z > 0 ? Math.PI : 0; G.add(b); }
      { const b = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 4), bM); b.position.set(X(-19.7), 2.1, 3); b.rotation.y = Math.PI / 2; G.add(b); }
      box(G, .8, 1.1, .6, woodW, X(-14), .55, 3); const bk = box(G, 1.0, .12, .7, M('#f8f4ea', { r: .7 }), X(-14), 1.2, 3); bk.rotation.x = -.25; box(G, 1.05, .04, .74, gold, X(-14), 1.14, 3);
      L.blockers.push({ x: X(-14), z: 3, lv: 0 });
      box(G, 2.4, .08, 1.0, woodW, X(-11), .82, 5.6); for (let i = 0; i < 10; i++) { const p = box(G, .22, .005, .3, M('#f2ead8', { r: .9 }), X(-11.9 + rnd(0, 1.8)), .865 + i * .004, 5.6 + rnd(-.3, .3)); p.rotation.y = rnd(-.4, .4); }
      lamp(L, G, X(-14), 4.6, 3, { r: .06, i: .55, d: 9, c: '#fffaf0', hex: 0xfff8ee });
      // ---------- казна (восток) ----------
      room(8, 20, -12, -2, 6, marble, floorM, {}, 'W');
      const coinM = M('#d8b060', { m: .9, r: .3 }), silverM = M('#c8ccd4', { m: .9, r: .3 }), copperM = M('#b8743a', { m: .8, r: .35 });
      for (let k = 0; k < 6; k++) { const x = 10 + (k % 3) * 3.8, z = -10 + Math.floor(k / 3) * 5.5; box(G, 1.4, .8, .9, M('#5a3a22', { r: .6 }), X(x), .4, z); box(G, 1.44, .08, .94, gold, X(x), .82, z);
        const heap = new THREE.Mesh(new THREE.SphereGeometry(.65, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), [coinM, silverM, copperM][k % 3]); heap.scale.y = .5; heap.position.set(X(x), .84, z); G.add(heap); L.blockers.push({ x: X(x), z, lv: 0, r: .9 });
        for (let i = 0; i < 14; i++) { const c = cyl(G, .05, .05, .01, [coinM, silverM, copperM][i % 3], X(x + rnd(-1.2, 1.2)), .015, z + rnd(.6, 1.3), 10); c.rotation.x = rnd(-.2, .2); } }
      lamp(L, G, X(14), 4.6, -7, { r: .06, i: .55, d: 9, c: '#fffaf0', hex: 0xfff8ee });
      // ---------- башня-мастерская (восток) ----------
      room(8, 20, -2, 8, 6, MT('plaster', 2.2, { c: '#d8d0c4' }), MT('deck', 2, { c: '#a08060' }), {}, 'WN');
      wallX(G, X(8), -2, 8, 0, 6, marble, [[2.4, 3.6]], .4);
      L.towerDoorM = box(G, .12, 2.05, 1.2, M('#8a6a3a', { r: .5 }), X(8), 1.02, 3);
      { const t = canvasTex(512, 360, (g, w, h) => { g.fillStyle = '#1e3a6a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(220,230,255,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 - 80, 40); g.lineTo(w / 2 + 80, 40); g.lineTo(w / 2 + 10, h / 2); g.lineTo(w / 2 + 80, h - 40); g.lineTo(w / 2 - 80, h - 40); g.lineTo(w / 2 - 10, h / 2); g.closePath(); g.stroke();
          for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(70 + i * 15, 80 + i * 40, 20 + i * 3, 0, 7); g.stroke(); } g.fillStyle = 'rgba(220,230,255,.8)'; g.font = '14px monospace'; ['R = 1.618', 'песок: 1/3 часа', 'ось Ока', 'винт №7 — ?'].forEach((s, i) => g.fillText(s, w - 150, 70 + i * 24));
          g.strokeStyle = '#ffcf70'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2 + 10, h / 2, 12, 0, 7); g.stroke(); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), M('#ffffff', { map: t, r: .8 })); p.rotation.x = -Math.PI / 2 + .1; p.position.set(X(14), .9, 3); G.add(p); box(G, 2.0, .08, 1.4, woodW, X(14), .84, 3); for (const [dx, dz] of [[-.9, -.6], [.9, -.6], [-.9, .6], [.9, .6]]) box(G, .08, .8, .08, M('#6a4a2a', {}), X(14 + dx), .4, 3 + dz); L.blockers.push({ x: X(14), z: 3, lv: 0, r: 1 }); }
      L.gears = [];
      for (const [x, y, z, r] of [[19.7, 3.4, 0, .8], [19.7, 2.3, 1.5, .5], [19.7, 4.2, 2.2, .45], [19.7, 2.8, 5, .9]]) { const g = new THREE.Group(); g.position.set(X(x), y, z); g.rotation.y = Math.PI / 2; G.add(g); const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * .12, 6, 28), M('#b8903c', { m: .85, r: .35 })); g.add(ring); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const tth = new THREE.Mesh(new THREE.BoxGeometry(r * .2, r * .22, r * .15), ring.material); tth.position.set(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12, 0); tth.rotation.z = a; g.add(tth); } L.gears.push([g, r]); }
      { const hg = new THREE.Group(); hg.position.set(X(10.5), 0, 6.6); G.add(hg); const gl = new THREE.MeshStandardMaterial({ color: lin('#e8f0ff'), transparent: true, opacity: .3, roughness: .05, metalness: .2, depthWrite: false }); for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(.35, .7, 16, 1, true), gl); c.position.y = .9 + s * .35; c.rotation.x = s > 0 ? Math.PI : 0; hg.add(c); } const sd = new THREE.Mesh(new THREE.ConeGeometry(.25, .3, 16), M('#e8c070', { e: '#a07020', ei: .5 })); sd.position.y = .7; hg.add(sd); for (const y of [.18, 1.62]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .06, 16), gold); d.position.y = y; hg.add(d); } L.blockers.push({ x: X(10.5), z: 6.6, lv: 0 }); }
      lamp(L, G, X(14), 4.6, 3, { r: .06, i: .55, d: 9, c: '#fff0d0', hex: 0xfff0d0 });
      // ---------- уровень −1: усыпальница и зал Часов ----------
      const CH = 2.25; box(G, 22, .2, 14, stoneD, X(1), yb - .1, -6); box(G, 22, .14, 14, MT('stone', 1.2, { c: '#3a3632' }), X(1), yb + CH + .02, -6);
      wallZ(G, -13, X(-10), X(12), yb, CH, stoneD, null, .4); wallZ(G, 1, X(-10), X(12), yb, CH, stoneD, null, .4); wallX(G, X(-10), -13, 1, yb, CH, stoneD, null, .4); wallX(G, X(12), -13, 1, yb, CH, stoneD, null, .4);
      wallX(G, X(0), -13, 1, yb, CH, stoneD, null, .4);
      for (let k = 0; k < 6; k++) box(G, 1.4, .1, .32, stoneD, X(-6.4), yb + .3 + k * .33, -8.3 - k * .3);
      // саркофаги
      L.sarcLid = null;
      [[-7.5, -4], [-4.5, -4], [-6, -11]].forEach(([x, z], i) => { box(G, 1.2, 1.0, 2.4, MT('stone', 1, { c: '#b8b0a4' }), X(x), yb + .5, z); const lid = box(G, 1.3, .2, 2.5, MT('stone', 1, { c: '#c8c0b4' }), X(x), yb + 1.1, z); if (i === 2) { L.sarcLid = lid; box(G, .6, .06, .6, gold, X(x), yb + 1.22, z - .4); } L.blockers.push({ x: X(x), z, lv: -1, r: 1 }, { x: X(x), z: z - .9, lv: -1 }, { x: X(x), z: z + .9, lv: -1 }); });
      for (const [x, z] of [[-2, -2], [-2, -11], [-9, -7]]) { cyl(G, .12, .14, 1.2, gold, X(x), yb + .6, z, 10); const f = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), M('#ffcf70', { e: '#ffaa30', ei: 3 })); f.scale.y = 1.7; f.position.set(X(x), yb + 1.32, z); G.add(f); lamp(L, G, X(x), yb + 1.4, z, { r: .01, i: .45, d: 5, c: '#ffb050', hex: 0xffa040 }); }
      // зал Часов: огромные песочные часы
      { const hg = new THREE.Group(); hg.position.set(X(6), yb, -6); hg.scale.setScalar(.62); G.add(hg); L.hourglass = hg;
        const gl = new THREE.MeshStandardMaterial({ color: lin('#e8f4ff'), transparent: true, opacity: .22, roughness: .02, metalness: .3, depthWrite: false, side: THREE.DoubleSide });
        for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.6, 32, 1, true), gl); c.position.y = 1.8 + s * .8; c.rotation.x = s > 0 ? Math.PI : 0; hg.add(c); }
        const sandM = M('#f0c860', { e: '#e0a020', ei: 1.2 }); const top = new THREE.Mesh(new THREE.ConeGeometry(1.1, .8, 32), sandM); top.position.y = 2.25; top.rotation.x = Math.PI; hg.add(top); L.sandTop = top;
        const bot = new THREE.Mesh(new THREE.ConeGeometry(1.4, .9, 32), sandM); bot.position.y = .65; hg.add(bot); const stream = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.2, 8), sandM); stream.position.y = 1.3; hg.add(stream);
        for (const y of [.15, 3.45]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, .2, 32), gold); d.position.y = y; hg.add(d); }
        for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .8; const p = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 3.3, 10), gold); p.position.set(Math.cos(a) * 1.75, 1.8, Math.sin(a) * 1.75); hg.add(p); }
        lamp(L, G, X(6), yb + 1.3, -6, { r: .01, i: .75, d: 7, c: '#ffd070', hex: 0xffc860 }); L.blockers.push({ x: X(6), z: -6, lv: -1, r: 2.2 }, { x: X(6), z: -4.2, lv: -1 }, { x: X(6), z: -7.8, lv: -1 }, { x: X(4.2), z: -6, lv: -1 }, { x: X(7.8), z: -6, lv: -1 }); }
      L.motes = H.sandMotes(G, X(6), -6, 10, 12, yb, yb + 2.1, 0xffd890, 300);
      // ---------- точки осмотра ----------
      const I = (id, x, z, lv, r) => INSPECT.push({ id, x: X(x), z, r: r || 1.1, loc: 'noon', lv: lv || 0 });
      I('gallery', -14, -10.6, 0, 2.2); I('pageL', -11, 4.8, 0, 1.0); I('treasury', 13.8, -8.6, 0, 1.6); I('towerDoor', 7.2, 3, 0, 1.0); I('plans', 14, 1.9, 0, 1.0);
      I('clockDoor', 6.6, -10.9, 0, 1.0); I('crypt', -6.4, -9.2, 0, 1.0); I('cryptUp', -6.4, -7.6, -1, 1.0); I('sarcoph', -6, -9.9, -1, 1.1); I('heroSwap', 0, 12.5, 0, 1.2); I('hourglass', 6, -3.4, -1, 1.6); I('clockUp', 6, -1, -1, 1.0);
      // ---------- люди ----------
      const N = (id, place, look, lv, opt) => addNPC(id, place, look, Object.assign({ loc: 'noon', lv: lv || 0, fy: DY[String(lv || 0)] }, opt || {}));
      const sit = (x, z, face, sy) => ({ x: X(x), z, face, seatY: sy || .45, pose: 'sit' });
      const stand = (x, z, face) => standAt(X(x), z, face);
      const whiteG = { coat: '#f4f2ec', pants: '#e8e4dc', boots: true, buttons: true, belt: '#d8b060', hat: 'greathelm', hair: 'none', skin: '#e8c8a8', handsBehind: true };
      L.np = {
        king: N('king', sit(0, -10.75, '+z', 1.3), { coat: '#f8f6f0', skirt: '#f8f6f0', pants: '#f8f6f0', shoes: true, belt: '#d8b060', stole: '#d8b060', hat: 'crown', hatC: '#d8b060', hair: '#d8d0c0', hairStyle: 'side', beard: 'trim', beardC: '#d8d0c0', skin: '#f0dcc8', eyeC: '#6a8aa8' }),
        whiteCap: N('whiteCap', stand(2.6, 9, '-x'), Object.assign({}, whiteG, { hat: null, hair: '#6a6258', hairStyle: 'buzz', beard: 'moust', beardC: '#6a6258' })),
        medic: N('medic', stand(-11, 6, '+x'), { coat: '#2a2a32', lapels: true, pants: '#2a2a2a', shoes: true, hair: '#8a8478', hairStyle: 'side', skin: '#e8c8b0', glasses: true }),
        smotritelN: N('smotritelN', stand(-10.5, -9, '-x'), { coat: '#f4f1ea', pants: '#e8e4da', buttons: true, belt: '#c9a35a', stole: '#d9b46a', hair: '#ece8e2', hairStyle: 'side', beard: 'trim', beardC: '#efebe5', glasses: true, skin: '#f1d0b8', handsBehind: true }),
        margaretN: N('margaretN', stand(-2.6, 11.8, '+x'), { female: true, coat: '#1a0e12', skirt: '#140a0e', hair: '#141012', hairStyle: 'bun', skin: '#f8eeec', lips: '#8a1420' })
      };
      let sd = 1100; const XN = (place, look, bark, name) => N('x' + (sd++), place, look, 0, { bark, name });
      L.extras = [XN(stand(-3.2, -8.4, '+z'), whiteG, 'white', 'Гвардеец «Белых»'), XN(stand(3.2, -8.4, '+z'), whiteG, 'white', 'Гвардеец «Белых»'), XN(stand(-3.4, 13.4, '+z'), whiteG, 'white', 'Гвардеец «Белых»'), XN(stand(3.4, 13.4, '+z'), whiteG, 'white', 'Гвардеец «Белых»'),
        XN(stand(-6.4, 0, '+x'), { female: true, coat: '#f0ece0', skirt: '#e8e0d0', hair: '#c8a870', hairStyle: 'bun', skin: '#f4dccc' }, 'courtier', 'Придворная дама'), XN(stand(6.4, -2, '-x'), { coat: '#f0ece0', lapels: true, pants: '#e8e0d0', shoes: true, hair: '#8a7a5a', hairStyle: 'side', skin: '#f0d0b8' }, 'courtier', 'Придворный'),
        XN(stand(-6.2, 4.6, '+x'), { coat: '#e8e4dc', lapels: true, pants: '#d8d4cc', shoes: true, hair: '#2a2a2a', hairStyle: 'side', skin: '#e8c4a8' }, 'courtier', 'Придворный')];
      Object.values(L.np).forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: n.lv || 0 }));
      L.extras.forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: 0 }));
      L.blockers.push({ x: X(0), z: -10.4, lv: 0, r: 1.6 }, { x: X(-1.2), z: -10.4, lv: 0 }, { x: X(1.2), z: -10.4, lv: 0 });
      L.lamps.forEach(l => { l.i0 = l.i; });
      worldUV(G); L.merged = mergeStatic(G, L, extra);
      // ---------- проходимые области ----------
      const W = [
        [-2.0, 2.0, 13.6, 30], [-3.7, 3.7, 8.3, 13.7], [-1.5, 1.5, 7.6, 8.4],
        [-7.7, 7.7, -11.7, 7.7], [-8.4, -7.6, -8, -6], [-8.4, -7.6, 2, 4], [7.6, 8.4, -8, -6], [7.6, 8.4, 2.4, 3.6],
        [-19.7, -8.3, -11.7, -2.3], [-19.7, -8.3, -1.7, 7.7], [8.3, 19.7, -11.7, -2.3], [8.3, 19.7, -1.7, 7.7],
        [-9.7, -.3, -12.7, .7, -1], [.3, 11.7, -12.7, .7, -1]
      ];
      L.walk = W.map(r => [X(r[0]), X(r[1]), r[2], r[3], r[4] || 0]);
      L.zones = [[X(-21), X(-8), 'Галерея и библиотека', 0], [X(-8), X(8), 'Тронный зал', 0], [X(8), X(21), 'Казна и башня-мастерская', 0], [X(-11), X(0), 'Королевская усыпальница', -1], [X(0), X(13), 'Зал Часов', -1]];
    },
    // башня заперта, пока нет ключа; зал Часов закрыт без приказа
    block(x, z) {
      const lx = x - NX, lv = P.lv || 0;
      if (lv === 0 && !S.f.n_towerOpen && lx > TOWER[0] - .1 && lx < TOWER[1] && z > TOWER[2] && z < TOWER[3]) return true;
      return false;
    },
    enter(L) {
      if (!S.f.n_started) { S.f.n_started = true; S.time = 720; resetNoon(L); startPos(); setTimeout(() => startScene('noonIntro'), 500); }
      else startPos();
    },
    tick(L, dt) {
      const busy = D.on || endEl.classList.contains('on') || noteEl.classList.contains('on') || sandOn || ['fight', 'cards', 'band', 'keypad'].some(id => document.getElementById(id).classList.contains('on'));
      const t = performance.now() / 1000, f = S.f;
      L.gears.forEach(([g, r], i) => { g.rotation.z += dt * (i % 2 ? -.4 : .4) / r; });
      if (L.hourglass) { L.hourglass.rotation.y += dt * .05; L.sandTop.scale.y = .8 + Math.sin(t * .1) * .05; }
      { const p = L.motes.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * .15; if (y < DY['-1']) y += 2.1; p.setY(i, y); } p.needsUpdate = true; }
      if (L.sarcLid) L.sarcLid.position.x = NX - 6 + (f.q2Sand ? .9 : 0);
      L.towerDoorM.rotation.y = f.n_towerOpen ? -1.3 : 0;
      if (f.n_solved) return;
      if (!busy) S.time += dt / 3;
      const strike = Math.min(12, Math.floor((S.time - 720) / 10) + 1);
      if (strike !== L.strike) { L.strike = strike; toastMsg = 'Полуденный колокол: удар ' + strike + ' из 12.'; toastT = 2.6; window.SFX && SFX.play && SFX.play('bell'); }
      if (S.time >= 840 && !busy) startScene('noonSeize');
      L.np.margaretN.hidden = !(f.margOpen || f.margFreed);
    }
  };
  function startPos() { place(NX, 16, 0, 0); }
  function resetNoon(L) {
    for (const k in S.f) if (k.startsWith('n_') && !['n_solved', 'n_started'].includes(k)) delete S.f[k];
    S.f.n_started = true; if (L) L.strike = 0;
    NPCS.forEach(n => { if (n.loc === 'noon') delete S.f['met_' + n.id]; });
    // запертые герои: подозрение Смотрителя
    const sus = S.sus || 0, others = ['tibo', 'miron', 'agata', 'rowen'].filter(h => h !== S.hero);
    const lock = sus >= 45 ? 2 : sus >= 20 ? 1 : 0;
    others.forEach((h, i) => { if (i < lock) S.f['n_lock_' + h] = true; });
    if (lock) S.f.n_locked = true;
    S.f.sus_low = sus < 20;
    // то, что уже известно из прошлых дел
    if (S.f.listFound && !S.f.q3List) { S.f.q3List = true; if (!S.clues.includes('q3List')) S.clues.push('q3List'); }
    if (S.f.notebook && !S.f.q3Sketch) { S.f.q3Sketch = true; if (!S.clues.includes('q3Sketch')) S.clues.push('q3Sketch'); }
    derive();
  }

  const d0 = window.deriveLoc;
  window.deriveLoc = function () {
    d0 && d0();
    const f = S.f;
    f.n_q1 = !!(f.q1Plans || f.q1Conf || f.q1Marg); f.n_q2 = !!(f.q2Sand || f.q2Page); f.n_q3 = !!(f.q3Gallery || f.q3List || f.q3Sketch || f.q3Pulse);
    f.n_ready = f.n_q1 && f.n_q2 && f.n_q3;
    f.n_trueOk = !!(f.orderSeal && f.act1done && f.act2done && f.act3done && f.act4done && f.evseyOpen && f.zoyaSaved && (f.margOpen || f.margFreed));
  };

  const la0 = window.locAction;
  window.locAction = function (a, def) {
    const f = S.f, done = () => { derive(); updateQuest(); };
    if (a === 'toNoon') { startScene('toNoon'); return true; }
    if (a === 'goNoon') { closeDialog(); enterLoc('noon'); return true; }
    if (a.startsWith('noonEnd:')) { S.f.gameDone = true; startScene(a.slice(8)); return true; }
    if (a === 'noonGallery') {
      const Ls = [[null, null, 'Шесть портретов, шесть государей: 1690, 1740, 1790, 1850, 1910, 1960. Парик, треуголка, корона, мундир, фрак, белое.'], [null, null, 'И одно лицо. Одни глаза, одна родинка у брови. Ни морщиной старше.']];
      Ls.push(['det', null, 'Это не династия. Это один человек — триста лет.']);
      startSolo(Ls, () => { addClue('q3Gallery'); done(); }); S.time += 4; return true;
    }
    if (a === 'noonSarc') {
      if (f.q2Sand) { startSolo([[null, null, 'Саркофаг открыт. Горсть песка в костяном кулаке.']]); return true; }
      const miron = S.hero === 'miron';
      const Ls = [[null, null, 'Саркофаг прежнего короля. Тяжёлая крышка с золотой короной.']];
      if (miron) Ls.push(['det', null, 'Вот и всё, с чего я начинал. Могила знатного. Карр, отойди. Тут я один справлюсь.'], [null, null, 'Мирон поддевает крышку ломом, как сотни раз до этого. Камень сдвигается с первого раза.']);
      else Ls.push([null, null, 'Крышка поддаётся с трудом. Время уходит — колокол бьёт.']);
      Ls.push([null, null, 'Внутри скелет в истлевшем золоте. Висок проломлен. Пальцы правой руки сжаты в кулак — между костей сыплется золотой песок.'], ['det', null, 'Его убили. Триста лет назад. И песок — из Часов.']);
      startSolo(Ls, () => { addClue('q2Sand'); if (miron) showBuff('Мирон: закончить там, где начал'); done(); }); S.time += miron ? 3 : 12; return true;
    }
    if (a === 'noonPage') {
      startSolo([[null, null, 'Стол завален черновиками Летописи. На одних — чистовые строки. На других — правки красными чернилами.'], [null, null, 'Ты долго перебираешь листы, пока не находишь неправленый: «Государь скончался внезапно. Новый государь, бывший узник, взошёл в тот же полдень».']], () => { addClue('q2Page'); done(); });
      S.time += 10; return true;
    }
    if (a === 'noonTower') {
      if (f.n_towerOpen) { startSolo([[null, null, 'Дверь башни-мастерской открыта.']]); return true; }
      if (S.hero === 'tibo') { startSolo([[null, null, 'На двери башни — замок с королевской печатью.'], ['det', null, 'Королевская печать. Ну, это моя специальность. Воск, нож, пять минут.'], [null, null, 'Тибо прикладывает поддельную печать — и замок щёлкает, будто узнал хозяина.']], () => { f.n_towerOpen = true; showBuff('Тибо: поддельная печать Короля'); done(); }); S.time += 5; return true; }
      startSolo([[null, null, 'Тяжёлая дверь башни-мастерской. Замок с королевской печатью.'], ['det', null, 'Ключ — у того, кто служит здесь дольше всех. Или печать — у того, кто умеет её подделать.']]);
      return true;
    }
    if (a === 'noonPlans') {
      const Ls = [[null, null, 'Стол мастера: чертежи на синей бумаге, циркули, обломки стекла. Расчёты песка, оси, винты.'], [null, null, 'На полях рукой мастера: «По заказу государя. Чтобы жил вечно». И ниже, другим нажимом: «Я не знал, кто сядет у них после».']];
      if (S.hero === 'agata') Ls.push([null, null, 'Под чертежами — тетрадь. Агата узнаёт почерк.'], ['det', null, 'Вторая половина его исповеди. Он записал её сам — то, что не успел сказать мне. Теперь тайны больше нет: он отпустил её сам.']);
      startSolo(Ls, () => { addClue('q1Plans'); if (S.hero === 'agata') { addClue('q1Conf'); showBuff('Агата: вторая половина исповеди'); } done(); }); S.time += 4; return true;
    }
    if (a === 'noonClockDoor') {
      if (!f.orderSeal) { startSolo([[null, null, 'Золотая дверь без ручки. В центре — паз под печать.'], ['det', null, 'Его открывает только королевская печать. Приказ из крепости.']]); return true; }
      startSolo([[null, null, 'Ты вкладываешь в паз сургуч с печатью Короля. Дверь беззвучно уходит в стену. Вниз ведёт лестница — и снизу идёт золотой свет.']], () => { P.lv = -1; P.fy = DY['-1']; P.x = NX + 6; P.z = -.2; P.yaw = 0; });
      return true;
    }
    if (a === 'noonSwap') {
      const hs = ['rowen', 'miron', 'agata', 'tibo'].concat(window.secretHeroes ? secretHeroes() : []).filter(h => h !== S.hero && !f['n_lock_' + h]);
      STORY.scenes.noonSwapSc = { start: 's', nodes: { s: { many: true, lines: [[null, null, 'Кому передать дело? Блокнот у каждого свой.']], choices: hs.map(h => ({ t: STORY.cast[h].name, go: 'h_' + h })).concat([{ t: 'Остаться', exit: true }]) } } };
      hs.forEach(h => { STORY.scenes.noonSwapSc.nodes['h_' + h] = { lines: [], do: 'noonHero:' + h }; });
      startScene('noonSwapSc'); return true;
    }
    if (a.startsWith('noonHero:')) {
      const h = a.slice(9); closeDialog();
      for (const k in S.f) if (k.startsWith('hero:')) delete S.f[k];
      S.f['hero:' + h] = true; S.hero = h; window.setHeroFormsNow && setHeroFormsNow();
      showBuff('Дело ведёт ' + STORY.cast[h].name, false, h); toastMsg = 'Теперь ты играешь за: ' + STORY.cast[h].name + '.'; toastT = 3; S.time += 2; done(); return true;
    }
    if (a === 'noonRollback') {
      closeDialog(); sandOn = true; sandEl.classList.add('on'); window.SFX && SFX.play('sand');
      setTimeout(() => { S.loops++; resetNoon(LOC.noon); S.time = 720; startPos(); sandEl.classList.remove('on'); sandOn = false; updateQuest(); updateInv(); startScene('noonLoop'); }, 2600);
      return true;
    }
    return la0 ? la0(a, def) : false;
  };
  // вечный полдень слепит: на время финала — ниже экспозиция и порог свечения
  const tl0 = window.tickLocation;
  window.tickLocation = function (dt) {
    const noon = WORLD.cur === 'noon', fx = window.GameFX;
    renderer.toneMappingExposure = noon ? .82 : 1.1;
    if (fx && fx.bloom) fx.bloom.threshold = noon ? .97 : .82;
    return tl0(dt);
  };
  STORY.inspect.clockUp = { label: 'лестница наверх — тронный зал', lines: [], go: 'deck:0:clockDoor' };

  const fin0 = window.finishLocation;
  window.finishLocation = function () {
    if (WORLD.cur !== 'noon') return fin0 && fin0();
    if (S.f.n_solved) { toastMsg = 'Здесь нечего завершать.'; toastT = 2.5; return; }
    if (D.on) closeDialog();
    ['q1Plans', 'q2Sand', 'q3Gallery'].forEach(id => { S.f[id] = true; if (!S.clues.includes(id)) S.clues.push(id); });
    derive(); updateQuest();
    const k = LOC.noon.np.king; place(k.x, k.z + 3.2, 0, 0); P.yaw = 0;
    showBuff('Ответы собраны — иди к Королю', false, S.hero);
    setTimeout(() => { if (!D.on) startDialog(k); }, 450);
  };

  // ---------- вокзал: белая дорога ----------
  const SX = 300, ST = STORY.locs.station;
  ST.leads.unshift(['poraDone&!gameDone', 'Белая дорога за последней платформой ведёт к Замку Белого Полдня.', 'insp:whiteRoad']);
  STORY.inspect.whiteRoad = { label: 'белая дорога · Замок Белого Полдня', if: 'poraDone&!gameDone', lines: [], go: 'toNoon' };
  INSPECT.push({ id: 'whiteRoad', x: SX + 13.0, z: 3.6, r: 1.6, loc: 'station' });
  const stL = LOC.station, stEnter = stL.enter, stTick = stL.tick;
  stL.enter = function (L) {
    stEnter.call(this, L);
    if (!L.road) { L.road = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ color: 0xfffaf0, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); L.road.position.set(SX + 13.4, 2, 3.6); L.road.rotation.y = Math.PI / 2; L.group.add(L.road); }
  };
  stL.tick = function (L, dt) { stTick.call(this, L, dt); if (L.road) { L.road.visible = !!(S.f.poraDone && !S.f.gameDone); if (L.road.visible) L.road.material.opacity = .55 + Math.sin(performance.now() / 600) * .25; } };

  // Shift+F4 — сразу в финал (для проверки)
  document.addEventListener('keydown', e => {
    if (!e.shiftKey || e.code !== 'F4') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!S.hero) { S.f['hero:rowen'] = true; S.hero = 'rowen'; }
    if (D.on) closeDialog();
    gameOn = true; Object.assign(S.f, { solved: true, act1done: true, konfDone: true, act2done: true, letDone: true, letSeen: true, act3done: true, golosDone: true, act4done: true, poraDone: true, orderSeal: true, zoyaSaved: true, evseyOpen: true, margOpen: true });
    enterLoc('noon');
  }, true);
})();
