// Акт 4: крепость ордена в Ясноземье, ночь перед пожаром (дело «Ночь перед пеплом»). Локация стоит по оси X около 1800.
// Уровни: 0 — двор и постройки, −1 — подвал с пленниками под двором. Данные сюжета — story7.js.
(function () {
  const H = WORLD.H, LOC = WORLD.LOC, FX = 1800;
  const { M, MT, box, cyl, wallX, wallZ, lamp, canvasTex, noise, worldUV, mergeStatic, place, lin, rnd, DY } = H;
  const X = x => FX + x;
  // группу из мешей — в отдельные сетки прямо в G (чтобы mergeStatic их склеил)
  function flatten(G, grp) { G.updateMatrixWorld(true); grp.updateMatrixWorld(true); grp.traverse(o => { if (!o.isMesh) return; const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); G.add(new THREE.Mesh(g, o.material)); }); G.remove(grp); }
  const yb = DY['-1'];

  LOC.fort = {
    fog: [0x141a24, 10, 60], walk: [], zones: [], lamps: [], blockers: [],
    build(L) {
      const G = L.group = new THREE.Group(); scene.add(G);
      G.add(new THREE.HemisphereLight(0x5a6a90, 0x2a2018, .34));
      const extra = [];
      const mk = (draw, w, h, tile, o) => { const t = canvasTex(w, h, draw, 1, 1); const m = new THREE.MeshStandardMaterial(Object.assign({ map: t, roughness: .9 }, o || {})); m.userData.tile = tile; extra.push(m); return m; };
      // ---------- материалы ----------
      const stone = MT('stone', 1.8, { c: '#8a8478' }), stoneD = MT('stone', 1.4, { c: '#5a564e' }), plank = MT('deckdark', 2.2), floorW = MT('deck', 2.2, { c: '#7a5a3a' });
      const paving = mk((g, w, h) => { g.fillStyle = '#3a3630'; g.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) { let x = (r % 2) * -16; while (x < w) { const bw = rnd(26, 46); g.fillStyle = ['#6a645a', '#5e584e', '#72695c', '#585248'][Math.floor(Math.random() * 4)]; g.fillRect(x + 2, r * 32 + 2, bw - 4, 28); x += bw; } } noise(g, w, h, 5000, .1);
        for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(40,60,30,' + rnd(.1, .3) + ')'; g.fillRect(Math.random() * w, Math.random() * h, rnd(2, 8), rnd(2, 8)); } }, 256, 256, 3);
      const iron = M('#2a2826', { m: .7, r: .45 }), woodD = M('#3a2818', { r: .7 }), woodL = M('#6a4a2e', { r: .65 }), cloth = M('#4a4a52', { r: 1 }), banner = M('#8a8a90', { r: .9, side: 1 }), straw = M('#b8984a', { r: 1 }), torchF = L.torchF = M('#ffb050', { e: '#ff8a20', ei: 2.6 });
      // ---------- небо и скала ----------
      const skyT = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070c'); gr.addColorStop(.5, '#141a26'); gr.addColorStop(.56, '#1a2230'); gr.addColorStop(1, '#0a0c10'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd(.2, .8) + ')'; g.fillRect(Math.random() * w, Math.random() * h * .5, 1.2, 1.2); }
        for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = rnd(h * .3, h * .5), r = rnd(30, 90); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(60,70,90,' + rnd(.12, .25) + ')'); gr.addColorStop(1, 'rgba(60,70,90,0)'); g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1, .25); g.translate(-x, -y); g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); } });
      const sky = L.sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; G.add(sky);
      { const mt = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(.3, 'rgba(240,225,190,1)'); gr.addColorStop(.34, 'rgba(200,190,170,.3)'); gr.addColorStop(1, 'rgba(100,100,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
        const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, fog: false, depthWrite: false, transparent: true })); moon.scale.set(10, 10, 1); moon.position.set(-30, 26, -40); sky.add(moon); }
      // скала, на которой стоит крепость, и долина внизу
      const rockM = M('#3a3630', { r: .95 });
      { const g = new THREE.CylinderGeometry(30, 40, 30, 14, 3); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 14) { p.setX(i, p.getX(i) * (1 + rnd(-.1, .1))); p.setZ(i, p.getZ(i) * (1 + rnd(-.1, .1))); } } g.computeVertexNormals(); const r = new THREE.Mesh(g, rockM); r.position.set(X(0), -15.2, 0); G.add(r); }
      const valley = M('#0e1410', { r: 1 }); box(G, 300, 1, 300, valley, X(0), -32, 0);
      for (let i = 0; i < 160; i++) { const a = rnd(0, Math.PI * 2), r = rnd(45, 110), h = rnd(6, 12); const c = new THREE.Mesh(new THREE.ConeGeometry(h * .3, h, 6), M(['#2a2414', '#3a2a14', '#1a2014'][i % 3], { r: 1 })); c.position.set(X(Math.cos(a) * r), -31.5 + h / 2, Math.sin(a) * r); G.add(c); }
      box(G, 50, .3, 50, paving, X(0), -.15, 0);
      // ---------- стены и башни крепости ----------
      const WH = 6;
      const curtain = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), a = -Math.atan2(z1 - z0, x1 - x0); const w = box(G, len, WH, 1.4, stone, X((x0 + x1) / 2), WH / 2, (z0 + z1) / 2); w.rotation.y = a;
        const n = Math.floor(len / 1.4); for (let i = 0; i < n; i++) { const u = (i + .5) / n; const m = box(G, .8, .8, 1.5, stone, X(x0 + (x1 - x0) * u), WH + .4, z0 + (z1 - z0) * u); m.rotation.y = a; } };
      curtain(-23, -22, 23, -22); curtain(23, -22, 23, 22); curtain(-23, 22, -2.5, 22); curtain(2.5, 22, 23, 22); curtain(-23, -22, -23, 22);
      for (const [x, z] of [[-23, -22], [23, -22], [-23, 22], [23, 22]]) { cyl(G, 2.6, 2.9, 10, stone, X(x), 5, z, 14); const r = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.6, 14), M('#2a2a30', { r: .7 })); r.position.set(X(x), 11.8, z); G.add(r); }
      // ворота с решёткой
      for (const s of [-1, 1]) { box(G, 2.2, 8, 3, stone, X(s * 3.6), 4, 22); }
      box(G, 7.6, 2, 3, stone, X(0), 7, 22);
      for (let x = -2.2; x <= 2.2; x += .4) box(G, .08, 5, .08, iron, X(x), 2.5, 21.6); for (let y = .5; y < 5; y += .6) box(G, 4.6, .08, .08, iron, X(0), y, 21.6);
      // ---------- постройки вокруг двора ----------
      const room = (x0, x1, z0, z1, h, wall, floor, doors, roofC) => {
        doors = doors || {}; const gp = s => (doors[s] || []).map(([c, w]) => [c - w / 2, c + w / 2]);
        wallZ(G, z0, X(x0), X(x1), 0, h, wall, gp('N').map(([a, b]) => [X(a), X(b)]), .5); wallZ(G, z1, X(x0), X(x1), 0, h, wall, gp('S').map(([a, b]) => [X(a), X(b)]), .5);
        wallX(G, X(x0), z0, z1, 0, h, wall, gp('W'), .5); wallX(G, X(x1), z0, z1, 0, h, wall, gp('E'), .5);
        box(G, x1 - x0, .06, z1 - z0, floor, X((x0 + x1) / 2), 0, (z0 + z1) / 2);
        box(G, x1 - x0, .12, z1 - z0, plank, X((x0 + x1) / 2), h - .06, (z0 + z1) / 2);
        // скат крыши
        const w = x1 - x0 + 1, d = z1 - z0 + 1, rise = Math.min(w, d) * .35, cz = (z0 + z1) / 2, cx = (x0 + x1) / 2;
        if (w >= d) { for (const s of [-1, 1]) { const L2 = Math.hypot(d / 2, rise); const r = box(G, w, .2, L2, roofC || M('#3a2e28', { r: .8 }), X(cx), h + rise / 2, cz + s * d / 4); r.rotation.x = s * Math.atan2(rise, d / 2); } }
        else { for (const s of [-1, 1]) { const L2 = Math.hypot(w / 2, rise); const r = box(G, L2, .2, d, roofC || M('#3a2e28', { r: .8 }), X(cx + s * w / 4), h + rise / 2, cz); r.rotation.z = -s * Math.atan2(rise, w / 2); } }
      };
      const torch = (x, y, z, ry) => { const b = box(G, .08, .5, .08, woodD, x, y, z); b.rotation.x = .3; b.rotation.y = ry || 0; const f = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), torchF); f.scale.y = 1.6; f.position.set(x + Math.sin(ry || 0) * .08, y + .32, z + Math.cos(ry || 0) * .08); G.add(f); lamp(L, G, x, y + .45, z, { r: .01, i: .8, d: 7, c: '#ff9a4a', hex: 0xff9040 }); };
      L.flames = [];
      // пиршественный зал (север)
      room(-12, 4, -20, -10, 5, stone, floorW, { S: [[-3, 1.8]] });
      box(G, 11, .1, 1.2, woodL, X(-4), .8, -15.5); box(G, 11, .1, 1.2, woodL, X(-4), .8, -12.6);
      for (const z of [-15.5, -12.6]) { for (const dz of [-.9, .9]) box(G, 11, .08, .4, woodD, X(-4), .45, z + dz); for (const x of [-9, -4, 1]) box(G, .12, .76, 1.0, woodD, X(x), .38, z); }
      // высокий стол на помосте
      box(G, 8, .3, 2.4, woodD, X(-4), .15, -18.6); box(G, 6, .1, 1.0, woodL, X(-4), 1.1, -18.6); for (const x of [-6.8, -1.2]) box(G, .12, .8, .9, woodD, X(x), .7, -18.6);
      L.gobletR = cyl(G, .05, .04, .16, M('#c9a050', { m: .85, r: .3 }), X(-4.6), 1.23, -18.3, 12); L.gobletH = cyl(G, .05, .04, .16, M('#b8b8c0', { m: .85, r: .3 }), X(-3.2), 1.23, -18.3, 12);
      for (let i = 0; i < 14; i++) { cyl(G, .14, .12, .03, M('#8a8a90', { m: .6, r: .4 }), X(-9 + i * .8), .87, -15.5 + (i % 2 ? .3 : -.3), 14); cyl(G, .04, .035, .12, M('#7a6a5a', { m: .5, r: .4 }), X(-8.7 + i * .8), .92, -12.6 + (i % 2 ? .3 : -.3), 10); }
      for (const x of [-7, -1]) { const lf = new THREE.Mesh(new THREE.SphereGeometry(.2, 14, 10), M('#8a5a2a', { r: .7 })); lf.scale.set(1.6, .6, .9); lf.position.set(X(x), .95, -15.5); G.add(lf); cyl(G, .24, .26, .03, woodD, X(x), .87, -15.5, 16); const jug = cyl(G, .07, .09, .26, M('#7a5a3a', { r: .5 }), X(x + .5), 1.0, -15.4, 12); }
      // знамёна
      const banT = canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#5a5a62'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e4dc'; g.fillRect(w / 2 - 6, 30, 12, 150); g.fillRect(w / 2 - 30, 60, 60, 10); g.beginPath(); g.moveTo(w / 2 - 6, 180); g.lineTo(w / 2, 200); g.lineTo(w / 2 + 6, 180); g.fill(); g.fillStyle = '#3a3a40'; g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, h - 30); g.lineTo(w, h); g.fill(); noise(g, w, h, 1500, .1); });
      for (const x of [-10, -6, -2, 2]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.2), M('#ffffff', { map: banT, r: .9, side: 1 })); b.position.set(X(x), 3.3, -19.72); G.add(b); box(G, 1.2, .06, .06, woodD, X(x), 4.42, -19.7); }
      box(G, 2.6, 2.2, .8, stoneD, X(3.4), 1.1, -15); L.fireH = box(G, .06, .6, 1.4, M('#ff8a3a', { e: '#ff6a1a', ei: 2.4 }), X(2.98), .5, -15); lamp(L, G, X(2.6), .9, -15, { r: .01, i: 1.0, d: 8, c: '#ff9a4a', hex: 0xff8a3a });
      for (const x of [-9, -4, 1]) lamp(L, G, X(x), 3.6, -14, { r: .12, i: .7, d: 7, c: '#ffc070', hex: 0xffb860, hang: .5 });
      // часовня (северо-восток): витраж с глазом, алтарь, скамьи
      room(5, 13, -20, -10, 6, stone, MT('stone', 1.2, { c: '#a8a49c' }), { S: [[8.5, 1.4]] }, M('#2a2a32', { r: .7 }));
      const glassT = canvasTex(256, 384, (g, w, h) => { g.fillStyle = '#0a0a14'; g.fillRect(0, 0, w, h); const cols = ['#2a4a8a', '#8a2a2a', '#c9a040', '#2a6a4a', '#5a2a6a']; for (let i = 0; i < 60; i++) { g.fillStyle = cols[i % 5]; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); g.lineTo(x + rnd(-40, 40), y + rnd(-40, 40)); g.lineTo(x + rnd(-40, 40), y + rnd(-40, 40)); g.fill(); }
        g.fillStyle = '#e8e0c8'; g.beginPath(); g.ellipse(w / 2, h * .45, 60, 34, 0, 0, 7); g.fill(); g.fillStyle = '#2a4a9a'; g.beginPath(); g.arc(w / 2, h * .45, 24, 0, 7); g.fill(); g.fillStyle = '#0a0a14'; g.beginPath(); g.arc(w / 2, h * .45, 10, 0, 7); g.fill();
        g.strokeStyle = '#141414'; g.lineWidth = 4; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(Math.random() * w, 0); g.lineTo(Math.random() * w, h); g.stroke(); } });
      { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.7), M('#ffffff', { map: glassT, e: '#3a3a5a', ei: .9, r: .2 })); p.position.set(X(9), 3.4, -19.73); G.add(p); }
      box(G, 2.2, 1.0, .9, MT('stone', 1, { c: '#d8d0c4' }), X(9), .5, -18.8); box(G, 2.4, .08, 1.0, M('#e8e0d0', { r: .8 }), X(9), 1.04, -18.8);
      L.chapelCandles = []; for (let i = 0; i < 7; i++) { const x = X(8.1 + i * .3); cyl(G, .03, .03, .25, M('#efe6d0', { r: .6 }), x, 1.2, -18.7, 6); const f = new THREE.Mesh(new THREE.SphereGeometry(.02, 6, 5), torchF); f.scale.y = 1.8; f.position.set(x, 1.36, -18.7); G.add(f); }
      lamp(L, G, X(9), 1.8, -18.2, { r: .01, i: .8, d: 7, c: '#ffd080', hex: 0xffc870 });
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { box(G, 2.4, .08, .5, woodD, X(9 + s * 2), .45, -16.4 + k * 1.4); box(G, 2.4, .6, .06, woodD, X(9 + s * 2), .75, -16.15 + k * 1.4); }
      // лекарская (запад)
      room(-21, -13, -10, -3, 3.4, stone, floorW, { E: [[-6.5, 1.2]] });
      const jarsT = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) { g.fillStyle = '#4a3020'; g.fillRect(0, r * 64 + 58, w, 6); let x = 6; while (x < w - 20) { const jw = rnd(16, 30), jh = rnd(26, 46); g.fillStyle = ['#3a6a4a', '#8a6a3a', '#5a3a2a', '#c8c0a8', '#2a4a6a', '#6a2a2a'][Math.floor(Math.random() * 6)]; g.beginPath(); g.ellipse(x + jw / 2, r * 64 + 58 - jh / 2, jw / 2, jh / 2, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 4, r * 64 + 58 - jh + 8, 3, jh - 14); x += jw + rnd(2, 8); } }
        g.fillStyle = '#6a8a4a'; for (let i = 0; i < 20; i++) g.fillRect(rnd(0, w), 0, 3, rnd(20, 50)); });
      { const p = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.6), M('#ffffff', { map: jarsT, r: .6 })); p.position.set(X(-17), 1.5, -9.7); p.rotation.y = 0; G.add(p); }
      L.shelfGap = box(G, .25, .3, .2, M('#5a3a2a', { r: .4 }), X(-16), 2.38, -9.6);
      box(G, 2.0, .5, .9, woodL, X(-19.6), .3, -5); box(G, 2.0, .12, .85, M('#d8d0c0', { r: .9 }), X(-19.6), .6, -5);
      box(G, 1.6, .08, .8, woodD, X(-16), .82, -6.5); for (let i = 0; i < 5; i++) cyl(G, .06, .07, .14, M(['#3a6a4a', '#8a6a3a', '#c8c0a8'][i % 3], { r: .3, m: .1 }), X(-16.5 + i * .25), .93, -6.5, 10);
      lamp(L, G, X(-17), 2.6, -6.5, { r: .06, i: .6, d: 5.5, c: '#ffc070', hex: 0xffb860, hang: .3 });
      // кельи рыцарей (запад, юг от лекарской)
      room(-21, -13, -2, 9, 3.2, stone, floorW, { E: [[3, 1.2]] });
      wallZ(G, 2, X(-21), X(-15), 0, 3.2, stone, null, .4); wallX(G, X(-15), -2, 2, 0, 3.2, stone, [[-.6, .6]], .4); wallX(G, X(-15), 4.2, 9, 0, 3.2, stone, [[5.9, 7.1]], .4); wallZ(G, 4.2, X(-21), X(-15), 0, 3.2, stone, null, .4);
      for (const [cz, id] of [[0, 'rowenCell'], [6.5, 'cell2']]) { box(G, 2.0, .4, .9, woodD, X(-19.6), .25, cz); box(G, 1.9, .12, .85, cloth, X(-19.6), .5, cz); box(G, .5, .6, .4, woodL, X(-17.8), .3, cz + 1.2); torch(X(-15.3), 1.9, cz - 1.3, -Math.PI / 2); }
      box(G, .1, 1.2, .5, iron, X(-20.8), 1.3, -1.2); box(G, .3, .9, .1, M('#8a8a90', { m: .8, r: .3 }), X(-20.7), 1.0, 1.4);
      // конюшня (восток)
      room(14, 21, -8, 8, 4, MT('deckdark', 1.8, { c: '#a08060' }), M('#4a3a28', { r: 1 }), { W: [[0, 2.2]] });
      const horse = (x, z, c) => { const h = new THREE.Group(); const m = M(c, { r: .6 }), dark = M('#1a1410', { r: 1 });
        const e = (r, sx, sy, sz, px, py, pz, rz) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); s.scale.set(sx, sy, sz); s.position.set(px, py, pz); if (rz) s.rotation.z = rz; h.add(s); return s; };
        e(.42, 1.75, .95, .85, 0, 1.3, 0); e(.36, 1, 1, 1, -.55, 1.33, 0); e(.36, 1, 1, 1, .58, 1.36, 0);
        const nk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .24, .85, 10), m); nk.position.set(-.85, 1.78, 0); nk.rotation.z = .75; h.add(nk);
        const hd = e(.16, 2.1, .9, .8, -1.2, 2.08, 0, -.55);
        for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(.04, .14, 6), m); ear.position.set(-1.0, 2.3, s * .07); h.add(ear); }
        for (const dx of [-.55, .55]) for (const dz of [-.17, .17]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.065, .045, 1.05, 8), m); l.position.set(dx, .55, dz); h.add(l); const hf = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .08, 8), dark); hf.position.set(dx, .04, dz); h.add(hf); }
        const mane = new THREE.Mesh(new THREE.BoxGeometry(.75, .14, .05), dark); mane.position.set(-.78, 1.98, 0); mane.rotation.z = .75; h.add(mane);
        const tl = new THREE.Mesh(new THREE.ConeGeometry(.09, .9, 6), dark); tl.position.set(.95, 1.0, 0); tl.rotation.z = -.25; h.add(tl);
        h.position.set(X(x), 0, z); h.rotation.y = Math.PI; G.add(h); flatten(G, h); };
      L.horses = [];
      for (let k = 0; k < 4; k++) { const z = -6 + k * 3.4; box(G, 3.4, 1.3, .12, woodD, X(19), .65, z - 1.7); horse(19, z, ['#5a3a22', '#2a2018', '#8a6a4a', '#e8e0d0'][k]); L.blockers.push({ x: X(18.6), z, lv: 0 }, { x: X(19.6), z, lv: 0 }); box(G, 1.2, .8, .8, straw, X(20.5), .4, z); }
      for (let i = 0; i < 8; i++) box(G, rnd(.8, 1.4), rnd(.3, .6), rnd(.6, 1), straw, X(15 + rnd(0, 1.5)), .2, rnd(-7, 7));
      box(G, .7, .5, .4, M('#5a3a22', { r: .6 }), X(15.2), 1.2, -7.6); L.saddle = box(G, .4, .3, .2, M('#3a2a1a', { r: .7 }), X(15.2), 1.0, -7.5);
      box(G, .6, .6, .6, stoneD, X(15.4), .3, 6.8); cyl(G, .28, .28, .1, M('#8a8278', { r: .8 }), X(15.4), .65, 6.8, 14);
      torch(X(14.3), 2.2, -3, Math.PI / 2); torch(X(14.3), 2.2, 4, Math.PI / 2);
      // гостевая башня (юго-восток): ларец герольда
      for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; if (Math.sin(a) < -.93) continue; const s = box(G, 1.55, 9, .6, stone, X(14 + Math.cos(a) * 4.2), 4.5, 15 + Math.sin(a) * 4.2); s.rotation.y = -a + Math.PI / 2; }
      box(G, 2.2, 6, .6, stone, X(14), 6.0, 10.8); box(G, 8.6, .2, 8.6, plank, X(14), 3.1, 15); const tr = new THREE.Mesh(new THREE.ConeGeometry(4.8, 4, 16), M('#2a2a32', { r: .7 })); tr.position.set(X(14), 11, 15); G.add(tr);
      // внутри — комната башни (видна через дверь)
      L.chestM = box(G, .9, .55, .6, M('#4a2a1a', { r: .5 }), X(16.4), .3, 15); box(G, .92, .08, .62, M('#c9a050', { m: .8, r: .3 }), X(16.4), .6, 15);
      box(G, 1.8, .5, 2.0, woodD, X(13), .3, 17.4); box(G, 1.7, .12, 1.9, M('#6a2a2a', { r: 1 }), X(13), .6, 17.4);
      box(G, 1.0, .06, .7, woodL, X(12.2), .8, 12.8);
      lamp(L, G, X(14), 2.6, 15, { r: .06, i: .7, d: 6, c: '#ffc070', hex: 0xffb860 });
      // внутренность башни — пол и тёмная стена изнутри
      { const fl = new THREE.Mesh(new THREE.CircleGeometry(4.0, 20), floorW); fl.rotation.x = -Math.PI / 2; fl.position.set(X(14), .035, 15); G.add(fl); }
      // ---------- двор ----------
      cyl(G, 1.0, 1.1, .9, stoneD, X(-2), .45, 2, 16); for (const dx of [-.8, .8]) box(G, .14, 2, .14, woodD, X(-2 + dx), 1.5, 2); box(G, 1.8, .12, .14, woodD, X(-2), 2.5, 2); L.blockers.push({ x: X(-2), z: 2, lv: 0, r: 1.2 }, { x: X(-2.7), z: 2, lv: 0 }, { x: X(-1.3), z: 2, lv: 0 });
      for (const [x, z] of [[-8, -8], [5, -8], [-8, 8], [5, 8], [10, 0]]) { cyl(G, .07, .1, 3, woodD, X(x), 1.5, z, 8); const f = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), torchF); f.scale.y = 1.6; f.position.set(X(x), 3.2, z); G.add(f); lamp(L, G, X(x), 3.3, z, { r: .01, i: .95, d: 9, c: '#ff9a4a', hex: 0xff9040 }); L.blockers.push({ x: X(x), z, lv: 0 }); }
      // телеги, бочки, сено у стены
      for (let i = 0; i < 5; i++) cyl(G, .35, .35, .9, M('#5a3a22', { r: .7 }), X(-10 + i * .8), .45, 18.6, 12);
      { const c = new THREE.Group(); box(c, 2.6, .5, 1.4, woodL, 0, .8, 0); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.5, .07, 6, 14), woodD); w.position.set(0, .5, s * .75); c.add(w); } box(c, 1.8, .4, .6, straw, -.2, 1.25, 0); c.position.set(X(8), 0, 18); c.rotation.y = .4; G.add(c); flatten(G, c); L.blockers.push({ x: X(8), z: 18, lv: 0, r: 1.4 }, { x: X(7), z: 17.6, lv: 0 }, { x: X(9), z: 18.4, lv: 0 }); }
      // вход в подвал во дворе
      box(G, 2.2, .3, 2.2, stoneD, X(-8), .1, 13); L.cellarDoor = box(G, 1.4, .08, 1.4, woodD, X(-8), .28, 13); box(G, .16, .12, .3, iron, X(-8), .34, 13);
      // палые листья по двору (и в воздухе — ветер)
      const leafT = canvasTex(32, 32, (g) => { g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#c8682a'; g.beginPath(); g.ellipse(16, 16, 12, 6, .6, 0, 7); g.fill(); g.strokeStyle = '#6a3014'; g.beginPath(); g.moveTo(6, 22); g.lineTo(26, 10); g.stroke(); });
      // палые листья — одна сетка на все 260 штук
      { const lm = new THREE.MeshStandardMaterial({ map: leafT, alphaTest: .4, side: THREE.DoubleSide, roughness: 1 }); const n = 260, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = [];
        for (let i = 0; i < n; i++) { const cx = X(rnd(-12, 12)), cz = rnd(-9, 21), a = rnd(0, 6), s = .09, y = .025 + i * .00005; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([u, v], k) => { const dx = (u * Math.cos(a) - v * Math.sin(a)) * s, dz = (u * Math.sin(a) + v * Math.cos(a)) * s; pos.set([cx + dx, y, cz + dz], i * 12 + k * 3); uv.set([(u + 1) / 2, (v + 1) / 2], i * 8 + k * 2); }); idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); G.add(new THREE.Mesh(g, lm)); }
      { const n = 140, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = X(rnd(-15, 15)); pos[i * 3 + 1] = rnd(0, 8); pos[i * 3 + 2] = rnd(-15, 15); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        L.leaves = new THREE.Points(g, new THREE.PointsMaterial({ map: leafT, size: .22, transparent: true, alphaTest: .4, depthWrite: false })); G.add(L.leaves); }
      // ---------- подвал с пленниками (уровень −1) ----------
      box(G, 14, .2, 9, stoneD, X(-8), yb - .1, 15.5); box(G, 14, .2, 9, stoneD, X(-8), yb + 2.15, 15.5);
      wallZ(G, 11, X(-15), X(-1), yb, 2.4, stoneD, null, .4); wallZ(G, 20, X(-15), X(-1), yb, 2.4, stoneD, null, .4); wallX(G, X(-15), 11, 20, yb, 2.4, stoneD, null, .4); wallX(G, X(-1), 11, 20, yb, 2.4, stoneD, null, .4);
      for (let k = 0; k < 8; k++) box(G, 1.3, .06, .3, woodD, X(-8), yb + .3 + k * .3, 12.2 + k * .02);
      // решётки камер вдоль южной стены
      for (let c = 0; c < 4; c++) { const cx = -13 + c * 3.2; for (let x = -1.3; x <= 1.3; x += .26) box(G, .05, 2.4, .05, iron, X(cx + x), yb + 1.2, 17.2); box(G, .4, 2.4, .2, stoneD, X(cx + 1.6), yb + 1.2, 18.6); box(G, 1, .1, 1.6, straw, X(cx), yb + .05, 19); }
      for (const x of [-12, -6, -3]) { const f = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), torchF); f.scale.y = 1.6; f.position.set(X(x), yb + 1.9, 11.3); G.add(f); lamp(L, G, X(x), yb + 2.0, 11.8, { r: .01, i: .7, d: 6, c: '#ff9a4a', hex: 0xff9040 }); }
      // ---------- пламя финала ----------
      L.fire = new THREE.Group(); G.add(L.fire); L.fire.visible = false;
      { const ft = canvasTex(64, 128, (g) => { const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,200,80,1)'); gr.addColorStop(.4, 'rgba(255,110,30,.8)'); gr.addColorStop(1, 'rgba(120,20,0,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(32, 0); g.quadraticCurveTo(64, 80, 32, 128); g.quadraticCurveTo(0, 80, 32, 0); g.fill(); });
        for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set(X(rnd(-18, 18)), rnd(3, 8), rnd(-18, 12)); s.scale.set(rnd(2, 4), rnd(4, 8), 1); L.fire.add(s); } }
      // ---------- точки осмотра ----------
      const I = (id, x, z, lv, r) => INSPECT.push({ id, x: X(x), z, r: r || 1.1, loc: 'fort', lv: lv || 0 });
      I('goblet', -4.4, -17.2, 0, 1.0); I('heraldCup', -3.2, -17.2, 0, .9); I('chapelDoor', 8.5, -9.2, 0, 1.0); I('karrChapel', 7.0, -9.4, 0, 1.0);
      I('saddle', 15.4, -7.0, 0, .9); I('stableHone', 15.6, 6.2, 0, 1.0); I('chest', 15.6, 15, 0, 1.0); I('cellarGate', -8, 13, 0, 1.3); I('fCellarUp', -8, 12.4, -1, 1.1);
      I('gateF', 0, 20.6, 0, 1.6); I('bannerF', -6, -19, 0, 1.2); I('wellF', -2, 3.3, 0, 1.2); I('shelvesU', -17, -9.0, 0, 1.2);
      // ---------- люди ----------
      const N = (id, place, look, lv, opt) => addNPC(id, place, look, Object.assign({ loc: 'fort', lv: lv || 0, fy: DY[String(lv || 0)] }, opt || {}));
      const sit = (x, z, face, sy) => ({ x: X(x), z, face, seatY: sy || .45, pose: 'sit' });
      const stand = (x, z, face) => standAt(X(x), z, face);
      const LK = {
        rowenP: { coat: '#4a4c52', vest: '#6a6c72', pants: '#2a2a2e', boots: true, belt: '#3a2a1a', hair: '#5a4a3a', hairStyle: 'short', beard: 'trim', beardC: '#5a4a3a', skin: '#deb08f', heavy: true },
        lukash: { coat: '#5a4a32', pants: '#3a3028', boots: true, belt: '#2a1a12', hair: '#8a6a3a', hairStyle: 'messy', skin: '#f0c8a8', coatTex: 'sack' },
        herald: { coat: '#efe8d8', pants: '#e0d8c8', boots: true, buttons: true, belt: '#c9a050', hat: 'top', hatC: '#efe8d8', hair: '#c8b890', hairStyle: 'side', skin: '#f0d0b8', handsBehind: true },
        gervasiy: { coat: '#2a2a32', skirt: '#2a2a32', pants: '#2a2a32', hat: 'hood', hatC: '#1a1a20', beard: 'long', beardC: '#d8d4cc', hair: '#d8d4cc', skin: '#e8c4a8', boots: true },
        varlam: { coat: '#3a3028', pants: '#2a2420', boots: true, belt: '#1a1410', hair: '#4a3a2a', hairStyle: 'messy', beard: 'full', beardC: '#4a3a2a', skin: '#d8a080', heavy: true, coatTex: 'sack' },
        ulyana: { female: true, coat: '#e8e4dc', skirt: '#3a3a44', hat: 'nunveil', hair: 'none', skin: '#f0d0b8', apron: true },
        zoyaF: Object.assign({}, LOOK.zoya, { coat: '#4a4a52', apron: false }),
        sevaF: { coat: '#2a3a5a', pants: '#2a2a2e', boots: true, coatTex: 'sack', hair: '#a87a4a', hairStyle: 'messy', skin: '#e8c0a0', glasses: true },
        margaretP: { female: true, coat: '#1a0e12', skirt: '#140a0e', hair: '#141012', hairStyle: 'bun', skin: '#f4e4e0', lips: '#8a1420', armPose: 'lap' },
        knight: { coat: '#4a4c52', vest: '#6a6c72', pants: '#2a2a2e', boots: true, belt: '#3a2a1a', hairStyle: 'short', skin: '#dca888' }
      };
      L.np = {
        rowenP: N('rowenP', sit(-4.6, -17.9, '+z', .5), LK.rowenP),
        rowenC: N('rowenP', sit(-19.6, .3, '+x', .55), LK.rowenP),
        rowenS: N('rowenP', stand(-8, 10.6, '+z'), LK.rowenP),
        lukash: N('lukash', stand(16.2, -1.0, '-x'), LK.lukash),
        lukashC: N('lukash', stand(-6.0, -10.6, '+z'), LK.lukash),
        lukashF: N('lukash', stand(-5.6, -18.6, '+z'), LK.lukash),
        lukashH: N('lukash', sit(15.6, 6.0, '-x', .45), LK.lukash),
        lukashB: N('lukash', sit(-3, 5, '+x', .45), LK.lukash),
        herald: N('herald', stand(13, 13.4, '+z'), LK.herald),
        heraldC: N('herald', stand(9.6, -17.0, '-x'), LK.herald),
        heraldF: N('herald', sit(-3.2, -17.9, '+z', .5), LK.herald),
        heraldS: N('herald', sit(13, 17.0, '-z', .62), Object.assign({ sleep: true }, LK.herald)),
        gervasiy: N('gervasiy', stand(9, -17.6, '-z'), LK.gervasiy),
        gervasiyF: N('gervasiy', sit(-4, -17.9, '+z', .5), LK.gervasiy),
        varlam: N('varlam', stand(-6.6, 12.4, '+x'), LK.varlam),
        ulyana: N('ulyana', stand(-16.5, -7.6, '-z'), LK.ulyana),
        zoyaF: N('zoyaF', sit(-13, 17.75, '-z', .25), LK.zoyaF, -1),
        sevaF: N('sevaF', sit(-9.8, 17.75, '-z', .25), LK.sevaF, -1),
        margaretP: N('margaretP', sit(-3.4, 17.75, '-z', .25), LK.margaretP, -1)
      };
      let sd = 1000; const XN = (place, look, bark, name, lv) => N('x' + (sd++), place, look, lv, { bark, name });
      L.extras = [XN(sit(-7, -15.0, '+z'), Object.assign({}, LK.knight, { hair: '#3a2a1a' }), 'knight', 'Рыцарь ордена'), XN(sit(-2, -15.0, '+z'), Object.assign({}, LK.knight, { hair: '#8a7a6a', beard: 'full', beardC: '#8a7a6a' }), 'knight', 'Рыцарь ордена'),
        XN(sit(-5, -13.1, '-z'), Object.assign({}, LK.knight, { hair: '#5a3a1a' }), 'knight', 'Рыцарь ордена'), XN(sit(0, -13.1, '-z'), Object.assign({}, LK.knight, { hair: '#2a2a2a', beard: 'moust', beardC: '#2a2a2a' }), 'knight', 'Рыцарь ордена'),
        XN(stand(-1.6, 20.4, '-z'), Object.assign({}, LK.knight, { hat: 'greathelm', hair: 'none' }), 'guardF', 'Стражник'), XN(stand(1.6, 20.4, '-z'), Object.assign({}, LK.knight, { hat: 'greathelm', hair: 'none' }), 'guardF', 'Стражник'),
        XN(sit(-6.6, 17.75, '-z', .25), { coat: '#5a4a3a', pants: '#3a3028', hair: '#2a2a2a', hairStyle: 'messy', beard: 'full', beardC: '#2a2a2a', skin: '#c8a080', coatTex: 'sack' }, 'prisoner', 'Пленник', -1)];
      Object.values(L.np).forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: n.lv || 0 }));
      L.extras.forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: n.lv || 0 }));
      [[-9, -15.5], [-6.5, -15.5], [-4, -15.5], [-1.5, -15.5], [1, -15.5], [-9, -12.6], [-6.5, -12.6], [-4, -12.6], [-1.5, -12.6], [1, -12.6], [3.2, -15], [9, -18.8], [-19.6, -5], [-16, -6.5], [-19.6, 0], [-19.6, 6.5], [16.4, 15], [13, 17.4]].forEach(([x, z]) => L.blockers.push({ x: X(x), z, lv: 0 }));
      L.lamps.forEach(l => { l.i0 = l.i; });
      worldUV(G); L.merged = mergeStatic(G, L, extra);
      // ---------- проходимые области ----------
      const W = [
        [-12.5, 9.4, -9.6, 21.2], [9.4, 12.5, -9.6, 10.2], [12.5, 14.0, -1.1, 1.1], [-12.9, -12.5, -7.1, -5.9], [-12.9, -12.5, 2.4, 3.6],
        // зал, часовня, лекарская, кельи, конюшня, башня
        [-11.7, 3.7, -19.7, -10.3], [-3.9, -2.1, -10.4, -9.5], [5.3, 12.7, -19.7, -10.3], [7.8, 9.2, -10.4, -9.5],
        [-20.7, -13.3, -9.7, -3.3], [-13.4, -12.8, -7.1, -5.9],
        [-20.7, -15.3, -1.7, 1.7], [-15.4, -13.3, -.5, .5], [-15.3, -13.3, -1.7, 8.7], [-20.7, -15.3, 4.5, 8.7], [-15.6, -15.2, 5.9, 7.1], [-13.4, -12.8, 2.4, 3.6],
        [14.3, 18.0, -7.7, 7.7],
        [11.3, 16.9, 12.2, 17.9], [13.3, 14.7, 10.0, 12.4], [9.4, 14.7, 9.6, 10.2],
        // подвал
        [-14.6, -1.4, 11.4, 16.9, -1]
      ];
      L.walk = W.map(r => [X(r[0]), X(r[1]), r[2], r[3], r[4] || 0]);
      L.zones = [[X(-22), X(-12.5), 'Кельи и лекарская', 0], [X(-12.5), X(13), 'Двор крепости', 0], [X(13), X(22), 'Конюшня и башня', 0], [X(-22), X(22), 'Подвал', -1]];
    },
    enter(L) {
      if (!S.f.r_started) { S.f.r_started = true; S.time = -240; resetFort(L); startPos(); setTimeout(() => startScene('fortIntro'), 500); }
      else startPos();
    },
    tick(L, dt) {
      const busy = D.on || endEl.classList.contains('on') || noteEl.classList.contains('on') || sandOn || ['fight', 'cards', 'band', 'keypad'].some(id => document.getElementById(id).classList.contains('on'));
      const t = performance.now() / 1000, f = S.f;
      L.torchF.emissiveIntensity = 2.4 + Math.sin(t * 11) * .4 + Math.sin(t * 6.1) * .3;
      L.fireH.material.emissiveIntensity = 2 + Math.sin(t * 8) * .5;
      { const p = L.leaves.geometry.attributes.position, cx = camera.position.x, cz = camera.position.z; for (let i = 0; i < p.count; i++) { let x = p.getX(i) + dt * (2.2 + Math.sin(t + i) * .8), y = p.getY(i) - dt * (.6 + (i % 4) * .2), z = p.getZ(i) + Math.sin(t * 1.3 + i) * dt * .8; if (y < 0) y += 8; if (x > cx + 15) x -= 30; if (z > cz + 15) z -= 30; if (z < cz - 15) z += 30; p.setXYZ(i, x, y, z); } p.needsUpdate = true; L.leaves.visible = (P.lv || 0) === 0; }
      
      if (L.fire.visible) L.fire.children.forEach((s, i) => { s.scale.y = 5 + Math.sin(t * 6 + i) * 1.5; s.material.opacity = .7 + Math.sin(t * 9 + i) * .3; });
      if (f.r_solved) return;
      if (!busy) S.time += dt / 3;
      const tm = S.time, np = L.np, R = (a, b) => tm >= a && tm < b;
      const set = (k, v) => { if (!!f[k] !== v) { if (v) f[k] = true; else delete f[k]; derive(); updateQuest(); } };
      set('r_t1', tm >= -150); set('r_chapel', R(-158, -138)); set('r_stolen', tm >= -105); set('r_poured', tm >= -70); set('r_hone', R(30, 56));
      if (tm >= -55 && !f.r_drunk && !busy) startScene('fortFeast');
      if (tm >= -30 && f.r_heraldDrug) set('r_heraldAsleep', true);
      if (tm >= 60 && !f.r_caught && !f.r_stabbed && !busy) { f.r_stabbed = true; startScene('fortStab'); }
      if (tm >= 240 && !busy && !f.r_burn) { f.r_burn = true; startScene('fortBurn'); }
      // кто где
      const atFeast = R(-100, -50);
      const rowenAlive = !(f.r_stabbed && f.r_drugged);
      np.rowenP.hidden = !atFeast; np.rowenC.hidden = atFeast || !rowenAlive; np.rowenS.hidden = true;
      const lukFree = !f.r_caught && !f.r_lukashFled;
      np.lukash.hidden = !(lukFree && (tm < -160 || R(-138, -110) || R(-48, 30) || R(56, 60)));
      np.lukashC.hidden = !(lukFree && R(-160, -138)); np.lukashF.hidden = !(lukFree && R(-100, -48)); np.lukashH.hidden = !(lukFree && R(30, 56)); np.lukashB.hidden = !f.r_caught;
      if (lukFree && R(-110, -100)) np.lukash.hidden = true;
      const hAsleep = !!f.r_heraldAsleep;
      np.herald.hidden = !(tm < -165 || R(-138, -100) || (tm >= -50 && !hAsleep)); np.heraldC.hidden = !R(-165, -138); np.heraldF.hidden = !R(-100, -50); np.heraldS.hidden = !hAsleep;
      np.gervasiy.hidden = atFeast; np.gervasiyF.hidden = !atFeast;
      np.margaretP.hidden = !(f.margCaptive && !f.margFreed);
      np.sevaF.hidden = !f.act3truth;
      L.gobletR.material = L.gobletR.material; L.shelfGap.visible = tm < -105;
      L.cellarDoor.rotation.x = f.r_open ? -1.4 : 0;
    }
  };
  function startPos() { place(FX - 1, 18, 0, 0); }
  function resetFort(L) {
    for (const k in S.f) if (k.startsWith('r_') && !['r_solved', 'r_started'].includes(k)) delete S.f[k];
    if (S.f.fortLoops) S.f.r_loop1 = true;
    S.f.r_started = true;
    NPCS.forEach(n => { if (n.loc === 'fort') delete S.f['met_' + n.id]; });
    derive();
  }

  // ---------- вычисляемые флаги ----------
  const d0 = window.deriveLoc;
  window.deriveLoc = function () {
    d0 && d0();
    const f = S.f;
    f.r_ready = !!((f.chapelHeard || f.letterLily) && (f.potionGone || f.gobletSmell || f.misericord || f.varlamSaw) && !f.r_caught && (S.time < 60));
    f.r_order = !!f.orderSeal;
    f.r_open = !!(f.r_caught && (!f.r_wounded || f.r_cellarOpened));
  };

  // ---------- действия ----------
  const la0 = window.locAction;
  window.locAction = function (a, def) {
    const tm = S.time, f = S.f;
    const done = () => { derive(); updateQuest(); };
    if (a === 'toFort') { startScene('toFort'); return true; }
    if (a === 'goFort') { closeDialog(); enterLoc('fort'); return true; }
    if (a === 'fortFinale') { S.f.r_solved = true; S.f.act4done = true; S.f.zoyaSaved = true; const L = LOC.fort; L.fire.visible = true; L.lamps.forEach(l => { l.i = l.i0 * 1.6; }); startScene('fortFinale'); return true; }
    if (a === 'fortGoblet') {
      if (f.r_drunk) { startSolo([[null, null, 'Кубок сэра Ровена пуст. На дне — тёмный осадок.']]); return true; }
      if (tm < -70) {
        if (f.potionGone && !f.r_swapped) { startSolo([[null, null, 'Золочёный кубок сэра Ровена ждёт пира. Пустой.'], ['det', null, 'Пропал сонный отвар. Кому, как не оруженосцу, наливать рыцарю вино? Поставлю ему другой кубок.'], [null, null, 'Ты меняешь кубок на такой же с соседнего прибора.']], () => { f.r_swapped = true; done(); }); S.time += 2; return true; }
        startSolo([[null, null, 'Золочёный кубок сэра Ровена ждёт пира. Пустой.']]); S.time += 1; return true;
      }
      startSolo([[null, null, 'Кубок уже налит. Вино тёмное, и от него тянет полынью.'], ['det', null, 'Сонный отвар Ульяны. Ровен уснёт как убитый.']].concat(f.r_swapped ? [] : [[null, null, 'Ты выплёскиваешь вино в камыш на полу и наливаешь заново из общего кувшина.']]), () => { addClue('gobletSmell'); f.r_swapped = true; done(); });
      S.time += 2; return true;
    }
    if (a === 'fortChapel') {
      startSolo([[null, null, 'Ты прижимаешься к двери часовни. Внутри — два голоса, шёпотом.'], [null, null, '«Ровен не должен дожить до рассвета». — «Тихо сделаю». — «Сделаешь — получишь шпоры».'], ['det', null, 'Герольд Палаты. И Лукаш, оруженосец.']], () => { addClue('chapelHeard'); done(); });
      S.time += 3; return true;
    }
    if (a === 'fortSaddle') {
      if (tm < -150) { startSolo([[null, null, 'Седельная сумка оруженосца: скребница, ремни, сухари. Ничего особенного.']]); S.time += 1; return true; }
      startSolo([[null, null, 'В седельной сумке, под скребницей — свёрнутое письмо. Печать: лилия с глазом.'], [null, null, '«Устранить. До рассвета. Тихо. Палата не забудет».']], () => { addClue('letterLily'); done(); });
      S.time += 2; return true;
    }
    if (a === 'fortHone') {
      if (tm >= 30 && tm < 56) { startSolo([[null, null, 'В углу конюшни Лукаш водит по камню узким клинком. Мизерикордия — кинжал, которым добивают раненых.'], [null, null, 'Увидев тебя, он прячет кинжал за голенище.']], () => { addClue('misericord'); done(); }); S.time += 2; return true; }
      startSolo([[null, null, 'Точильный камень на колоде. Свежая стальная пыль.']]); S.time += 1; return true;
    }
    if (a === 'fortChest') {
      if (f.orderSeal) { startSolo([[null, null, 'Ларец пуст. Приказ у тебя.']]); return true; }
      if (!f.r_heraldAsleep && !f.r_magHelp) { startSolo([[null, null, 'Окованный ларец с гербом Палаты. Заперт. Ключ — на поясе у герольда.']]); S.time += 1; return true; }
      const Ls = [[null, null, f.r_magHelp ? 'Магистр отпирает ларец своим ключом и отворачивается, будто ничего не видит.' : 'Ты снимаешь ключ с пояса спящего герольда. Ларец открывается без скрипа.'], [null, null, 'Внутри — пергамент с тяжёлой печатью. Личная печать Короля-Благодетеля: «Пленников сжечь на рассвете».']];
      if (S.hero === 'tibo') Ls.push(['det', null, 'Пять минут — и в ларце лежит копия. Печать сниму горячим ножом с черновика. В истории приказ «сгорит», и никто не заметит подмены.']);
      startSolo(Ls, () => { addClue('orderSeal'); if (S.hero === 'tibo') { addClue('orderCopy'); showBuff('Тибо подменяет приказ'); } done(); });
      S.time += 3; return true;
    }
    if (a === 'fortCellar') {
      if (f.r_keys || f.r_cellarOpened) { f.r_cellarOpened = true; done(); locAction('deck:-1:fCellarUp'); return true; }
      startSolo([[null, null, 'Тяжёлая дверь в подвал, окована железом. Заперта. Из-под неё тянет сыростью и слышен чей-то плач.'], ['det', null, 'Ключи — у тюремщика Варлама.']]);
      return true;
    }
    if (a === 'fortRollback') {
      closeDialog(); sandOn = true; sandEl.classList.add('on'); window.SFX && SFX.play('sand');
      setTimeout(() => { S.loops++; S.f.fortLoops = (S.f.fortLoops || 0) + 1; resetFort(LOC.fort); LOC.fort.fire.visible = false; S.time = -240; startPos(); sandEl.classList.remove('on'); sandOn = false; updateQuest(); updateInv(); startScene('fortLoop'); }, 2600);
      return true;
    }
    return la0 ? la0(a, def) : false;
  };

  const fin0 = window.finishLocation;
  window.finishLocation = function () {
    if (WORLD.cur !== 'fort') return fin0 && fin0();
    if (S.f.r_solved) { toastMsg = 'Здесь нечего завершать.'; toastT = 2.5; return; }
    if (D.on) closeDialog();
    ['chapelHeard', 'letterLily', 'potionGone', 'gobletSmell', 'misericord'].forEach(id => { S.f[id] = true; if (!S.clues.includes(id)) S.clues.push(id); });
    S.f.r_swapped = true; S.f.r_drunk = true; if (S.time < 35) S.time = 35; derive(); updateQuest();
    const L = LOC.fort; L.tick(L, 0);
    const lk = L.np.lukashH.hidden ? L.np.lukash : L.np.lukashH; place(lk.x - 1.1, lk.z, -Math.PI / 2, 0);
    P.yaw = Math.atan2(-(lk.x - P.x), -(lk.z - P.z));
    showBuff('Улики собраны — обвини Лукаша, потом забери приказ', false, S.hero);
    setTimeout(() => { if (!D.on) startDialog(lk); }, 450);
  };

  // ---------- вокзал: пятая платформа и «Пора» ----------
  const SX = 300, ST = STORY.locs.station;
  ST.quests = [['act4done&!poraDone', 'Положи приказ на стол Смотрителя.'], ['act4done', 'Туман за последней платформой рассеялся. Белая дорога ведёт к Замку Белого Полдня.'], ['golosDone&!act4done', 'Платформа 5: Ясноземье. Крепость ордена.']].concat(ST.quests);
  ST.leads.unshift(['golosDone&!act4done', 'Пятая платформа — Ясноземье.', 'insp:plat5']);
  Object.assign(STORY.inspect, {
    plat5: { label: 'платформа 5 · Ясноземье · крепость ордена', if: 'golosDone&!act4done', lines: [], go: 'toFort' },
    plat5wait: { label: 'платформа 5', if: '!golosDone', lines: [[null, null, 'Платформа без номера. Табло пустое. Туман за ней белый, как молоко, и пахнет солнцем.']] },
    plat5done: { label: 'платформа 5 · Ясноземье', if: 'act4done', lines: [[null, null, 'Платформа 5. Ясноземье. Табло: «Пепел». Из тумана тянет гарью — едва-едва.']] }
  });
  const smD = STORY.dialogs.smotritel;
  smD.nodes.menu.choices.unshift({ t: 'Я готов к следующему делу.', go: 'next4', if: 'golosDone&!act4done&!sm_next4' });
  smD.nodes.next4 = { set: ['sm_next4'], lines: [['smotritel', 'sad', 'Пятая платформа. Ясноземье. Я надеялся, что до неё вы не дойдёте.'], ['smotritel', 'neutral', 'Крепость ордена. Ночь перед пожаром. Вы знаете, о какой ночи речь, сэр Ровен.']], go: 'menu' };
  const stL = LOC.station, stEnter = stL.enter;
  stL.enter = function (L) {
    stEnter.call(this, L);
    if (!L.plat5in) { L.plat5in = true; INSPECT.push({ id: 'plat5wait', x: SX, z: 1.1, r: 1.35, loc: 'station' }, { id: 'plat5done', x: SX, z: 1.1, r: 1.35, loc: 'station' }); }
    S.f.sus_low = (S.sus || 0) < 20;
    if (S.f.act4done && !S.f.poraDone) setTimeout(() => startScene('pora'), 800);
  };

  // Shift+F5 — сразу в крепость (для проверки)
  document.addEventListener('keydown', e => {
    if (!e.shiftKey || e.code !== 'F5') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!S.hero) { S.f['hero:rowen'] = true; S.hero = 'rowen'; }
    if (D.on) closeDialog();
    gameOn = true; Object.assign(S.f, { solved: true, act1done: true, konfDone: true, act2done: true, letDone: true, letSeen: true, act3done: true, act3truth: true, golosDone: true });
    enterLoc('fort');
  }, true);
})();
