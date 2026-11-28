// Акт 3: полярная станция «Полынья-4», 1968 (дело «Белая мгла»). Локация стоит по оси X около 1200.
// Пурга: снаружи видно на несколько метров, ходить можно только вдоль леера (натянутого троса) — проходимые полосы вдоль него.
// Постройки: жилой дом (коридор, кают-компания, кабинет начальника, камбуз, 4 каюты), радиорубка, дизельная, склад керна, метеоплощадка с будкой.
// Помощники — WORLD.H (world2.js). Данные сюжета — story5.js.
(function () {
  const H = WORLD.H, LOC = WORLD.LOC, PX = 1200;
  const { M, MT, box, cyl, wallX, wallZ, lamp, canvasTex, noise, worldUV, mergeStatic, place, lin, rnd, DY } = H;

  // внутренние помещения (локальные координаты): в них нет пурги и туман реже
  const IN = [
    [-10, 4, -4, 4], [4.4, 8.4, -4, 1.4], [-7, -2, 8, 12], [8, 14, 7, 12]
  ];
  const inside = (x, z) => IN.some(r => x > r[0] && x < r[1] && z > r[2] && z < r[3]);
  const FOG_OUT = [.8, 9.5], FOG_IN = [7, 34];

  LOC.polar = {
    fog: [0x2a3440, FOG_OUT[0], FOG_OUT[1]], walk: [], zones: [], lamps: [], blockers: [],
    build(L) {
      const G = L.group = new THREE.Group(); scene.add(G);
      G.add(new THREE.HemisphereLight(0x8a9cbc, 0x2a2622, .42));
      const extra = [];
      const mk = (draw, w, h, tile, o) => { const t = canvasTex(w, h, draw, 1, 1); const m = new THREE.MeshStandardMaterial(Object.assign({ map: t, roughness: .9 }, o || {})); m.userData.tile = tile; extra.push(m); return m; };
      const X = x => PX + x;
  // группу из мешей — в отдельные сетки прямо в G (чтобы mergeStatic их склеил)
  function flatten(G, grp) { G.updateMatrixWorld(true); grp.updateMatrixWorld(true); grp.traverse(o => { if (!o.isMesh) return; const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); G.add(new THREE.Mesh(g, o.material)); }); G.remove(grp); }
      // ---------- материалы ----------
      const snowM = mk((g, w, h) => { g.fillStyle = '#dfe6ee'; g.fillRect(0, 0, w, h); noise(g, w, h, 6000, .07); for (let i = 0; i < 60; i++) { g.strokeStyle = 'rgba(140,160,190,.12)'; g.lineWidth = rnd(1, 3); g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + rnd(-14, 14), w * .7, y + rnd(-14, 14), w, y + rnd(-8, 8)); g.stroke(); } }, 256, 256, 5, { color: lin('#d4dce6') });
      // наружная обшивка: вертикальные доски, тёмно-красная краска, иней понизу
      const extM = mk((g, w, h) => { const n = 10, bw = w / n; for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * bw, 0, (i + 1) * bw, 0); gr.addColorStop(0, '#4a1a14'); gr.addColorStop(.12, '#7a2e22'); gr.addColorStop(.85, '#6e281e'); gr.addColorStop(1, '#2e100c'); g.fillStyle = gr; g.fillRect(i * bw, 0, bw, h); }
        noise(g, w, h, 3000, .1); for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(220,210,200,' + rnd(.05, .18) + ')'; g.fillRect(Math.random() * w, Math.random() * h, rnd(2, 10), rnd(1, 3)); }
        const fr = g.createLinearGradient(0, h * .72, 0, h); fr.addColorStop(0, 'rgba(225,235,245,0)'); fr.addColorStop(1, 'rgba(225,235,245,.75)'); g.fillStyle = fr; g.fillRect(0, 0, w, h); }, 256, 256, 2.6);
      // внутри: лакированная фанера с рейками
      const intM = mk((g, w, h) => { const sp = h * .56; g.fillStyle = '#d6cfbd'; g.fillRect(0, 0, w, sp); g.fillStyle = '#3c584f'; g.fillRect(0, sp, w, h - sp); g.fillStyle = '#5a2a22'; g.fillRect(0, sp - 3, w, 5);
        for (let k = 0; k < 900; k++) { const y = Math.random() * h; g.fillStyle = y < sp ? 'rgba(120,110,90,' + rnd(.02, .07) + ')' : 'rgba(20,40,34,' + rnd(.03, .1) + ')'; g.fillRect(Math.random() * w, y, rnd(1, 2), rnd(6, 26)); }
        for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(30,25,20,' + rnd(.05, .15) + ')'; g.fillRect(Math.random() * w, h - rnd(4, 40), rnd(6, 30), rnd(1, 3)); }
        const gr = g.createLinearGradient(0, 0, 0, sp); gr.addColorStop(0, 'rgba(90,80,60,.12)'); gr.addColorStop(1, 'rgba(90,80,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, sp); noise(g, w, h, 1800, .04); }, 256, 256, 2.7, { roughness: .75 });
      const floorM = MT('deck', 2.4, { c: '#7a5a42' }), ceilM = mk((g, w, h) => { g.fillStyle = '#c9c3b4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(120,100,70,.25)'; g.fillRect(0, i * h / 8, w, 3); } noise(g, w, h, 2000, .05); }, 128, 128, 1.8);
      const roofM = M('#2a2a2e', { r: .8, m: .3 }), ironM = M('#2a2c30', { m: .7, r: .45 }), rust = M('#5a3a28', { r: .8, m: .3 }), woodD = M('#3a2818', { r: .7 }), woodL = M('#7a5a38', { r: .65 });
      const white = M('#e8e6e0', { r: .7 }), felt = M('#3a3430', { r: 1 }), steel = M('#8a9098', { m: .8, r: .35 }), green = M('#3a5a4a', { r: .5, m: .2 }), red = M('#9a2a22', { r: .5 }), blanket = M('#5a2a2a', { r: 1 }), blanket2 = M('#2a3a5a', { r: 1 });
      const glowY = M('#ffd890', { e: '#ffb050', ei: 1.3 }), frostG = M('#4a5c74', { e: '#141e2c', ei: .6, r: .15, m: .2 });
      // ---------- небо и земля ----------
      const skyT = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#06080c'); gr.addColorStop(.42, '#1e2630'); gr.addColorStop(.52, '#2a3440'); gr.addColorStop(1, '#1a2028'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const sky = L.sky = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 12), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; G.add(sky);
      box(G, 90, .3, 90, snowM, X(0), -.15, 2);
      // заструги и сугробы (не заходят в дома и на тропы)
      const driftG = new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
      const onPath = (x, z) => (Math.abs(x + 11.5) < 1.6 && z > -1.6 && z < 8.4) || (Math.abs(z - 6) < 1.6 && x > -13 && x < 11.2) || (Math.abs(x + 4.5) < 1.6 && z > 4 && z < 9) || (Math.abs(x - 9.6) < 1.6 && z > -2.6 && z < 7) || (Math.abs(x - 7) < 1.6 && z > 4 && z < 11);
      const inFoot = (x, z, pad) => IN.some(r => x > r[0] - pad && x < r[1] + pad && z > r[2] - pad && z < r[3] + pad) || (x > -16 && x < -8.6 && z > 7.2 && z < 14.4);
      for (let i = 0; i < 260; i++) {
        const x = rnd(-30, 30), z = rnd(-22, 26), s = rnd(.5, 2.2), sx = s * rnd(1.4, 2.6), R = Math.max(sx, s) + .4;
        if (inFoot(x, z, R) || [[0, 0], [R, 0], [-R, 0], [0, R], [0, -R]].some(([dx, dz]) => onPath(x + dx, z + dz))) continue;
        const m = new THREE.Mesh(driftG, snowM); m.scale.set(sx, s * rnd(.25, .5), s); m.rotation.y = rnd(-.4, .4) + .6; m.position.set(X(x), -.05, z); G.add(m);
      }
      // сугробы, привалившиеся к стенам с наветренной стороны
      for (const r of IN) for (let x = r[0] + .6; x < r[1] - .4; x += rnd(1, 1.8)) { if (onPath(x, r[2] - .9)) continue; const m = new THREE.Mesh(driftG, snowM); const s = rnd(.6, 1.1); m.scale.set(s * 1.3, s * .9, s * .8); m.position.set(X(x), -.05, r[2] - .55); G.add(m); }
      // торосы вдали — едва видны в мгле
      const iceM = M('#a8bccc', { r: .3, m: .1 });
      for (let i = 0; i < 26; i++) { const a = rnd(0, Math.PI * 2), r = rnd(24, 34); const t = new THREE.Mesh(new THREE.TetrahedronGeometry(rnd(1, 2.6), 0), iceM); t.position.set(X(Math.cos(a) * r), rnd(.2, .8), 2 + Math.sin(a) * r); t.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); t.scale.y = rnd(.6, 1.4); G.add(t); }

      // ---------- конструктор построек ----------
      // стена в два слоя: снаружи красная обшивка, внутри фанера (так ничего не просвечивает и не мерцает)
      function wallsX(x, z0, z1, h, gaps, inSign) { wallX(G, X(x) - inSign * .07, z0, z1, 0, h, extM, gaps, .1); wallX(G, X(x) + inSign * .05, z0 + .05, z1 - .05, 0, h - .02, intM, gaps, .04); }
      function wallsZ(z, x0, x1, h, gaps, inSign) { wallZ(G, z - inSign * .07, X(x0), X(x1), 0, h, extM, gaps && gaps.map(([a, b]) => [X(a), X(b)]), .1); wallZ(G, z + inSign * .05, X(x0 + .05), X(x1 - .05), 0, h - .02, intM, gaps && gaps.map(([a, b]) => [X(a), X(b)]), .04); }
      function inner(axis, c, a0, a1, h, gaps) { if (axis === 'x') wallX(G, X(c), a0, a1, 0, h, intM, gaps, .1); else wallZ(G, c, X(a0), X(a1), 0, h, intM, gaps && gaps.map(([a, b]) => [X(a), X(b)]), .1); }
      function roof(x0, x1, z0, z1, y, rise) {
        const w = x1 - x0 + .6, half = (z1 - z0) / 2 + .4, L2 = Math.hypot(half, rise), a = Math.atan2(rise, half), cz = (z0 + z1) / 2;
        for (const s of [-1, 1]) { const r = box(G, w, .12, L2, roofM, X((x0 + x1) / 2), y + rise / 2, cz + s * half / 2); r.rotation.x = s * a; const sn = box(G, w - .1, .14, L2 * .97, snowM, X((x0 + x1) / 2), y + rise / 2 + .12, cz + s * half / 2); sn.rotation.x = s * a; }
        const sh = new THREE.Shape(); sh.moveTo(z0 - cz - .1, 0); sh.lineTo(z1 - cz + .1, 0); sh.lineTo(0, rise); sh.lineTo(z0 - cz - .1, 0);
        for (const x of [x0, x1]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), extM); m.rotation.y = Math.PI / 2; m.position.set(X(x), y, cz); G.add(m); const m2 = m.clone(); m2.rotation.y = -Math.PI / 2; G.add(m2); }
        box(G, x1 - x0 - .1, .04, z1 - z0 - .1, ceilM, X((x0 + x1) / 2), y - .02, cz);
        box(G, x1 - x0, .06, z1 - z0, floorM, X((x0 + x1) / 2), .0, cz);
        // фундамент-сваи и завалинка
        box(G, x1 - x0 + .2, .3, z1 - z0 + .2, M('#3a3430', { r: .9 }), X((x0 + x1) / 2), -.14, cz);
      }
      // окно: снаружи тёплый свет, внутри — тёмное стекло в инее, рама, подоконник
      function win(x, z, ry, out) {
        const o = new THREE.Mesh(new THREE.PlaneGeometry(.7, .6), glowY); o.position.set(X(x) + Math.sin(ry) * out * .14, 1.55, z + Math.cos(ry) * out * .14); o.rotation.y = ry + (out < 0 ? Math.PI : 0); G.add(o);
        const i = new THREE.Mesh(new THREE.PlaneGeometry(.7, .6), frostG); i.position.set(X(x) - Math.sin(ry) * out * .085, 1.55, z - Math.cos(ry) * out * .085); i.rotation.y = ry + (out > 0 ? Math.PI : 0); G.add(i);
        const dx = Math.abs(Math.cos(ry)), dz = Math.abs(Math.sin(ry));
        for (const yy of [1.23, 1.87]) box(G, .82 * dx + .22 * dz, .07, .82 * dz + .22 * dx, woodD, X(x), yy, z);
        box(G, .05 * dx + .2 * dz, .6, .05 * dz + .2 * dx, woodD, X(x), 1.55, z);
        L.wins.push(o);
      }
      L.wins = [];
      // полотно двери (приоткрыто внутрь), обитое войлоком
      function door(x, z, alongX, w, openSign) { const d = box(G, alongX ? w - .06 : .07, 2.0, alongX ? .07 : w - .06, felt, X(x), 1.0, z); if (alongX) { d.position.set(X(x - w / 2 + .05), 1.0, z + openSign * w * .45); d.rotation.y = Math.PI / 2; } else { d.position.set(X(x + openSign * w * .45), 1.0, z - w / 2 + .05); d.rotation.y = Math.PI / 2; } }

      // ---------- жилой дом ----------
      const HH = 2.7;
      wallsZ(-4, -10, 4, HH, null, 1); wallsZ(4, -10, 4, HH, null, -1);
      wallsX(-10, -4, 4, HH, [[-.5, .5]], 1); wallsX(4, -4, 4, HH, null, -1);
      roof(-10, 4, -4, 4, HH, 1.1);
      // коридор и перегородки
      inner('z', -.8, -10, 4, HH, [[-7.8, -6.6], [-3.0, -2.2], [1.2, 2.0]]);
      inner('z', .8, -10, 4, HH, [[-8.6, -7.8], [-5.1, -4.3], [-1.6, -.8], [1.8, 2.6]]);
      inner('x', -4.5, -4, -.8, HH); inner('x', -.8, -4, -.8, HH);
      for (const x of [-6.5, -3, .5]) inner('x', x, .8, 4, HH);
      door(-10, 0, false, 1.0, 1);
      for (const [x, z, s] of [[-8.2, .8, 1], [-4.7, .8, 1], [-1.2, .8, 1], [2.2, .8, 1]]) door(x, z, true, .8, s);
      // крыльцо, козырёк, фонарь над дверью
      box(G, 1.4, .18, 1.6, woodD, X(-10.75), .02, 0); box(G, .9, .06, 1.8, roofM, X(-10.5), 2.4, 0).rotation.z = -.2;
      lamp(L, G, X(-10.6), 2.2, 0, { r: .07, i: .8, d: 6, c: '#ffc070', hex: 0xffc070 });
      for (const x of [-8.6, -6, -2.6, 1.6]) win(x, -4, 0, -1);
      for (const x of [-8.2, -4.7, -1.2, 2.2]) win(x, 4, 0, 1);
      win(-10, -2.4, Math.PI / 2, -1);
      // труба печи на крыше, искры
      box(G, .45, 1.6, .45, M('#4a4040', { r: .9 }), X(-9.2), HH + 1.2, -3.0); box(G, .55, .1, .55, ironM, X(-9.2), HH + 2.0, -3.0);
      box(G, .4, 1.4, .4, M('#4a4040', { r: .9 }), X(2.6), HH + 1.1, -3.2);
      // ---- коридор: собаки, вешалки, валенки, плакат
      for (let i = 0; i < 4; i++) { const d = new THREE.Group(); const c = i % 2 ? M('#b8b0a4', { r: 1 }) : M('#3a3430', { r: 1 }); const b = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 8), c); b.scale.set(1.3, .55, 1); d.add(b); const hd = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), c); hd.position.set(.3, .02, .05); d.add(hd); d.position.set(X(-9.6 + (i % 2) * .6), .14, -.45 + Math.floor(i / 2) * .9); d.rotation.y = rnd(0, 6); G.add(d); flatten(G, d); }
      box(G, 5.2, .06, .08, woodD, X(-5.6), 1.78, -.73);
      for (let i = 0; i < 6; i++) { const cm = [M('#2a3a2a', { r: 1 }), M('#3a3430', { r: 1 }), M('#2e3440', { r: 1 })][i % 3], x = X(-7.9 + i * .9);
        cyl(G, .012, .012, .1, woodD, x, 1.72, -.7, 6).rotation.x = Math.PI / 2;
        const c = cyl(G, .1, .16, .7, cm, x, 1.33, -.6, 12); c.scale.z = .55; c.rotation.z = rnd(-.04, .04);
        const sh = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cm); sh.scale.set(1.25, .5, .7); sh.position.set(x, 1.68, -.6); G.add(sh);
        if (i % 2 === 0) { const h = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), M('#4a3a2c', { r: 1 })); h.scale.y = .7; h.position.set(x, 1.82, -.66); G.add(h); } }
      for (let i = 0; i < 5; i++) for (const dx of [-.07, .07]) box(G, .11, .34, .26, felt, X(-7.6 + i * 1.1 + dx), .17, .6);
      { const t = canvasTex(256, 360, (g, w, h) => { g.fillStyle = '#d8c8a0'; g.fillRect(0, 0, w, h); g.fillStyle = '#a82a20'; g.fillRect(0, 0, w, 70); g.fillStyle = '#f0e0c0'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('ПОЛЯРНИК!', w / 2, 46); g.fillStyle = '#2a2a2a'; g.font = 'bold 24px sans-serif'; ['БЕЗ ЛЕЕРА', 'НИ ШАГУ', 'В ПУРГУ!'].forEach((s, i) => g.fillText(s, w / 2, 130 + i * 40)); g.fillStyle = '#1a2a4a'; g.beginPath(); g.moveTo(40, 330); g.lineTo(w / 2, 250); g.lineTo(w - 40, 330); g.fill(); noise(g, w, h, 2000, .08); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(.5, .7), M('#ffffff', { map: t, r: .8 })); p.position.set(X(.5), 1.5, .74); p.rotation.y = Math.PI; G.add(p); }
      box(G, 13.2, .012, .7, M('#5a2420', { r: 1 }), X(-3.1), .036, 0); for (const sd of [-1, 1]) box(G, 13.2, .014, .05, M('#2a4a3a', { r: 1 }), X(-3.1), .037, sd * .3);
      for (const x of [-7, -2, 2.6]) lamp(L, G, X(x), 2.45, 0, { r: .07, i: .5, d: 4.5, c: '#ffe2b8', hex: 0xffe2c0 });
      // ---- кают-компания: стол, лавки, печь, шахматы, карта, книжная полка, радиоприёмник
      box(G, 3.6, .07, 1.0, woodL, X(-7.2), .76, -2.4); for (const dx of [-1.5, 1.5]) box(G, .1, .74, .8, woodD, X(-7.2 + dx), .37, -2.4);
      for (const dz of [-.65, .65]) { box(G, 3.6, .06, .34, woodL, X(-7.2), .45, -2.4 + dz); for (const dx of [-1.5, 1.5]) box(G, .08, .44, .3, woodD, X(-7.2 + dx), .22, -2.4 + dz); }
      L.table = { x: X(-7.2), z: -2.4 };
      // кружки, чайник, хлеб на столе (после конца дела — «недопитый чай»)
      for (const [dx, dz] of [[-1.2, .2], [-.4, -.25], [.5, .2], [1.2, -.2], [.1, .3]]) { cyl(G, .045, .04, .1, white, X(-7.2 + dx), .84, -2.4 + dz, 12); cyl(G, .04, .04, .01, M('#5a2a10', { r: .2 }), X(-7.2 + dx), .885, -2.4 + dz, 12); }
      cyl(G, .12, .14, .2, steel, X(-6.6), .9, -2.5, 16);
      // чугунная печь-«буржуйка» с огнём
      cyl(G, .32, .32, .8, M('#1e1c1c', { m: .6, r: .55 }), X(-9.2), .5, -3.2, 16); cyl(G, .08, .08, 1.9, M('#1e1c1c', { m: .6, r: .55 }), X(-9.2), 1.85, -3.2, 10);
      L.fireH = box(G, .3, .2, .03, M('#ff8a3a', { e: '#ff6a1a', ei: 2 }), X(-9.2), .45, -2.87);
      box(G, 1.2, .9, .5, M('#3a3430', { r: 1 }), X(-9.2), .07, -3.2).visible = false;
      lamp(L, G, X(-9.2), .7, -2.8, { r: .01, i: .9, d: 5, c: '#ff9a4a', hex: 0xff8a3a });
      // шахматный столик с двумя полярниками
      box(G, .6, .05, .6, woodL, X(-8.9), .62, -1.55); cyl(G, .05, .05, .6, woodD, X(-8.9), .3, -1.55, 8);
      { const t = canvasTex(64, 64, (g, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#3a2818' : '#e8d8b8'; g.fillRect(i * 8, j * 8, 8, 8); } }); const b = new THREE.Mesh(new THREE.PlaneGeometry(.4, .4), M('#ffffff', { map: t, r: .5 })); b.rotation.x = -Math.PI / 2; b.position.set(X(-8.9), .652, -1.55); G.add(b); }
      for (let i = 0; i < 10; i++) cyl(G, .015, .02, .05, i % 2 ? white : M('#1a1a1a', {}), X(-8.9 + rnd(-.16, .16)), .675, -1.55 + rnd(-.16, .16), 8);
      // карта Арктики и стенгазета
      { const t = canvasTex(512, 360, (g, w, h) => { g.fillStyle = '#c8d8e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8ece8'; g.beginPath(); g.arc(w / 2, h / 2, 150, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,60,90,.35)'; for (let r = 40; r < 260; r += 40) { g.beginPath(); g.arc(w / 2, h / 2, r, 0, 7); g.stroke(); } for (let a = 0; a < 12; a++) { g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a / 12 * 6.28) * 260, h / 2 + Math.sin(a / 12 * 6.28) * 260); g.stroke(); }
          g.fillStyle = '#b8a888'; for (let i = 0; i < 9; i++) { g.beginPath(); const a = i / 9 * 6.28; g.ellipse(w / 2 + Math.cos(a) * 190, h / 2 + Math.sin(a) * 150, 60, 26, a, 0, 7); g.fill(); }
          g.strokeStyle = '#c02020'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 - 60, h / 2 + 30); g.bezierCurveTo(w / 2 - 30, h / 2 - 10, w / 2 + 10, h / 2 + 20, w / 2 + 40, h / 2 - 20); g.stroke(); g.fillStyle = '#c02020'; g.beginPath(); g.arc(w / 2 + 40, h / 2 - 20, 7, 0, 7); g.fill();
          g.fillStyle = '#1a2a4a'; g.font = 'bold 22px serif'; g.fillText('СЕВЕРНЫЙ ЛЕДОВИТЫЙ ОКЕАН', 20, 30); g.font = '18px serif'; g.fillText('«Полынья-4» — держимся', w / 2 + 50, h / 2 - 26); noise(g, w, h, 3000, .06); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), M('#ffffff', { map: t, r: .85 })); p.position.set(X(-5.6), 1.6, -3.88); G.add(p); box(G, 1.6, 1.15, .03, woodD, X(-5.6), 1.6, -3.91); }
      // книжная полка и приёмник
      box(G, 1.0, .05, .28, woodD, X(-7.4), 1.9, -3.82); for (let i = 0; i < 14; i++) box(G, .05, rnd(.18, .26), .2, [M('#6a2a20', {}), M('#2a3a5a', {}), M('#3a4a2a', {}), M('#8a7a5a', {})][i % 4], X(-7.85 + i * .065), 2.03, -3.8);
      box(G, .5, .3, .22, M('#5a3a22', { r: .4 }), X(-8.0), 1.08, -3.75); box(G, .3, .16, .01, M('#d8c080', { e: '#8a6a20', ei: .5 }), X(-8.05), 1.1, -3.635);
      lamp(L, G, X(-7.2), 2.3, -2.4, { r: .1, i: .75, d: 6, c: '#ffe2b8', hex: 0xffe2c0, hang: .25 });
      // ---- кабинет начальника: стол, сейф, лампа, бумаги (к 01:30 всё перевёрнуто)
      box(G, 1.4, .06, .7, woodL, X(-2.6), .76, -3.35); for (const dx of [-.62, .62]) box(G, .06, .74, .64, woodD, X(-2.6 + dx), .37, -3.35);
      box(G, .5, .45, .5, woodD, X(-2.6), .22, -2.7);
      box(G, .55, .7, .5, M('#3a4a3a', { m: .6, r: .4 }), X(-1.2), .35, -3.5); cyl(G, .05, .05, .04, steel, X(-1.2), .45, -3.24, 12).rotation.x = Math.PI / 2;
      cyl(G, .08, .1, .04, M('#1a3a2a', {}), X(-2.2), .8, -3.45, 12); cyl(G, .012, .012, .35, steel, X(-2.2), .97, -3.45, 6); { const sh = new THREE.Mesh(new THREE.ConeGeometry(.14, .14, 14, 1, true), M('#2a5a3a', { side: 1 })); sh.position.set(X(-2.2), 1.15, -3.45); G.add(sh); }
      lamp(L, G, X(-2.2), 1.05, -3.45, { r: .02, i: .7, d: 4, c: '#ffe0a0', hex: 0xffe0a0 });
      L.papers = new THREE.Group(); G.add(L.papers); const pap = M('#ece6d4', { r: .9 });
      for (let i = 0; i < 4; i++) box(G, .21, .005, .3, pap, X(-2.9 + i * .05), .795 + i * .006, -3.35);
      for (let i = 0; i < 22; i++) { const p = box(L.papers, .21, .005, .3, pap, X(-2.6 + rnd(-1.3, 1.3)), .035, -2.4 + rnd(-1.3, 1.0)); p.rotation.y = rnd(0, 3); }
      L.drawer = box(G, .5, .12, .5, woodD, X(-2.25), .3, -2.85);
      // ---- камбуз: плита, кастрюли, полки с банками, бак с водой
      box(G, 2.0, .85, .8, M('#2a2826', { m: .6, r: .5 }), X(1.6), .43, -3.5); box(G, 2.04, .04, .84, steel, X(1.6), .87, -3.5);
      L.fireK = box(G, .4, .14, .02, M('#ff8a3a', { e: '#ff6a1a', ei: 1.6 }), X(1.2), .35, -3.09);
      cyl(G, .2, .2, .3, steel, X(1.1), 1.04, -3.5, 16); cyl(G, .16, .16, .2, M('#7a3a22', { m: .4, r: .4 }), X(1.9), .99, -3.45, 16); cyl(G, .1, .12, .2, steel, X(2.3), .98, -3.6, 14);
      for (const y of [1.5, 1.9]) { box(G, 1.6, .04, .25, woodD, X(1.9), y, -3.85); for (let i = 0; i < 7; i++) cyl(G, .045, .045, .12, [M('#8a2a20', { m: .5, r: .4 }), steel, M('#c8a040', { m: .6, r: .4 })][i % 3], X(1.25 + i * .2), y + .08, -3.82, 10); }
      box(G, 1.2, .06, .6, woodL, X(.4), .8, -1.6); for (const dx of [-.5, .5]) box(G, .06, .78, .55, woodD, X(.4 + dx), .39, -1.6);
      cyl(G, .3, .3, .8, M('#5a6a72', { m: .5, r: .5 }), X(3.5), .4, -1.4, 14);
      lamp(L, G, X(1.6), 2.3, -2.4, { r: .08, i: .8, d: 5, c: '#ffd8a0', hex: 0xffd8a0, hang: .2 });
      // ---- каюты: двухъярусные койки, столик, фотографии
      const cabins = [[-8.25, blanket, 'bobrov'], [-4.75, blanket2, 'nina'], [-1.25, blanket, 'seva'], [2.25, blanket2, 'kuz']];
      cabins.forEach(([c, bl]) => {
        // верхняя полка на 1.62 (была 1.45): сидящий внизу не упирается в неё головой
        for (const y of [.45, 1.62]) { box(G, 2.0, .1, .75, woodD, X(c - .35), y, 3.55); box(G, 1.9, .12, .65, bl, X(c - .35), y + .1, 3.55); box(G, .35, .1, .55, white, X(c - 1.15), y + .2, 3.55); }
        for (const dx of [-1.32, .62]) box(G, .07, 1.9, .07, woodD, X(c + dx), .95, 3.2);
        box(G, .6, .05, .5, woodL, X(c + 1.15), .72, 1.4); cyl(G, .03, .03, .7, woodD, X(c + 1.15), .36, 1.4, 6);
        lamp(L, G, X(c + .6), 2.35, 2.4, { r: .06, i: .45, d: 3.6, c: '#ffcf90', hex: 0xffcf90 });
        const ph = new THREE.Mesh(new THREE.PlaneGeometry(.16, .2), M('#a8a090', { r: .6 })); ph.position.set(X(c + .9), 1.35, 3.88); ph.rotation.y = Math.PI; G.add(ph);
      });
      // у Боброва — стопки отчётов и графин; у механика — промасленная роба
      for (let i = 0; i < 3; i++) box(G, .22, .05 + i * .02, .3, pap, X(-7.2 + i * .1), .76 + i * .03, 1.35);
      cyl(G, .06, .05, .22, M('#a8c0c8', { r: .1, op: .6 }), X(-6.95), .86, 1.55, 10);
      // ---------- радиорубка (пристроена к камбузу, вход снаружи) ----------
      const RH = 2.5;
      wallsZ(-4, 4.4, 8.4, RH, null, 1); wallsZ(1.4, 4.4, 8.4, RH, null, -1); wallsX(4.4, -4, 1.4, RH, null, 1); wallsX(8.4, -4, 1.4, RH, [[-1.65, -.75]], -1);
      roof(4.4, 8.4, -4, 1.4, RH, .8); door(8.4, -1.2, false, .9, -1);
      win(6.4, 1.4, 0, 1); lamp(L, G, X(8.9), 2.1, -1.2, { r: .06, i: .7, d: 5, c: '#ffc070', hex: 0xffc070 });
      box(G, 3.2, .06, .8, woodL, X(6.4), .8, -3.5); for (const dx of [-1.5, 1.5]) box(G, .06, .78, .75, woodD, X(6.4 + dx), .39, -3.5);
      // передатчики: шкалы светятся зелёным, лампы — янтарём
      L.dials = [];
      for (const [x, w, h] of [[5.3, .8, .55], [6.3, 1.0, .7], [7.4, .8, .5]]) {
        box(G, w, h, .45, M('#3a3c3a', { m: .4, r: .5 }), X(x), .83 + h / 2, -3.7);
        const dt = canvasTex(128, 64, (g, W, Hh) => { g.fillStyle = '#0a1a10'; g.fillRect(0, 0, W, Hh); g.strokeStyle = '#8af0a8'; g.lineWidth = 2; g.beginPath(); g.arc(W * .3, Hh * .62, 22, Math.PI, 0); g.stroke(); for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI; g.beginPath(); g.moveTo(W * .3 + Math.cos(a) * 18, Hh * .62 + Math.sin(a) * 18); g.lineTo(W * .3 + Math.cos(a) * 22, Hh * .62 + Math.sin(a) * 22); g.stroke(); } g.fillStyle = '#c8f0a0'; g.fillRect(W * .58, Hh * .3, W * .32, 6); g.fillRect(W * .58, Hh * .55, W * .22, 6); });
        const d = new THREE.Mesh(new THREE.PlaneGeometry(w * .8, h * .5), M('#ffffff', { map: dt, e: '#3a8a4a', ei: .8 })); d.position.set(X(x), .83 + h * .55, -3.47); G.add(d); L.dials.push(d);
        for (let k = 0; k < 3; k++) cyl(G, .03, .03, .04, M('#d8d0c0', { m: .5, r: .3 }), X(x - w * .3 + k * w * .3), .83 + h * .18, -3.46, 10).rotation.x = Math.PI / 2;
      }
      box(G, .2, .03, .1, steel, X(6.0), .845, -3.15); cyl(G, .02, .02, .05, M('#1a1a1a', {}), X(6.05), .88, -3.15, 8);
      for (const dx of [-.09, .09]) cyl(G, .045, .045, .03, M('#1a1a1a', { r: .4 }), X(6.9 + dx), .85, -3.2, 12);
      L.journal = box(G, .3, .025, .42, M('#2a3a5a', { r: .7 }), X(5.6), .84, -3.2);
      box(G, .5, .45, .5, woodD, X(6.4), .22, -2.75);
      L.board = box(G, .9, .03, .16, M('#6a4a2a', { r: .8 }), X(5.4), .045, -.5);
      L.crowbar = cyl(G, .02, .02, .7, ironM, X(5.4), .06, -.5, 8); L.crowbar.rotation.z = Math.PI / 2;
      L.valenki = new THREE.Group(); G.add(L.valenki); for (const dz of [-.1, .1]) { box(L.valenki, .12, .4, .28, M('#2a2622', { r: 1 }), X(7.85), .2, -.4 + dz); }
      L.soot = new THREE.Group(); L.valenki.add(L.soot); for (const dz of [-.1, .1]) box(L.soot, .13, .06, .3, M('#1a1818', { r: 1 }), X(7.85), .03, -.4 + dz);
      { const t = canvasTex(256, 180, (g, w, h) => { g.fillStyle = '#e4dcc4'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.fillText('РАСПИСАНИЕ СЕАНСОВ', w / 2, 22); g.font = '13px monospace'; g.textAlign = 'left'; ['03:00  МАТЕРИК   синопт.', '09:00  МАТЕРИК   синопт.', '15:00  «ПОЛЮС»   дрейф', '21:00  МАТЕРИК   синопт.', '23:00  резерв'].forEach((s, i) => g.fillText(s, 14, 52 + i * 24)); g.strokeStyle = '#8a2a20'; g.lineWidth = 2; g.strokeRect(10, 128, 200, 26); noise(g, w, h, 1500, .06); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(.9, .63), M('#ffffff', { map: t, r: .85 })); p.position.set(X(4.53), 1.6, -1.8); p.rotation.y = Math.PI / 2; G.add(p); }
      lamp(L, G, X(6.4), 2.1, -2.6, { r: .07, i: .7, d: 4.5, c: '#ffe0b0', hex: 0xffe0b0, hang: .15 });
      // мачта антенны с оттяжками и красным огнём
      const mast = (x, z, h) => { cyl(G, .07, .1, h, ironM, X(x), h / 2, z, 8); for (let y = 1; y < h; y += 1.2) box(G, .5, .04, .04, ironM, X(x), y, z); const r = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), M('#ff3a2a', { e: '#ff2010', ei: 2.4 })); r.position.set(X(x), h + .1, z); G.add(r); L.mastLights.push(r);
        for (const [dx, dz] of [[3, 2], [-3, 2], [0, -3.4]]) { const a = new THREE.Vector3(X(x), h * .85, z), b = new THREE.Vector3(X(x + dx), 0, z + dz); const len = a.distanceTo(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, len, 4), steel); c.position.copy(a).lerp(b, .5); c.lookAt(b); c.rotateX(Math.PI / 2); G.add(c); } };
      L.mastLights = []; mast(10.5, -3.2, 9); mast(-14, -3, 7);
      // провод антенны между мачтами
      { const a = new THREE.Vector3(X(10.5), 8.6, -3.2), b = new THREE.Vector3(X(-14), 6.7, -3); const c = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, a.distanceTo(b), 4), M('#1a1a1a', {})); c.position.copy(a).lerp(b, .5); c.lookAt(b); c.rotateX(Math.PI / 2); G.add(c); }
      // ---------- дизельная ----------
      const DH = 2.6;
      wallsZ(8, -7, -2, DH, [[-5, -4]], 1); wallsZ(12, -7, -2, DH, null, -1); wallsX(-7, 8, 12, DH, null, 1); wallsX(-2, 8, 12, DH, null, -1);
      roof(-7, -2, 8, 12, DH, .8); door(-4.5, 8, true, 1.0, 1);
      win(-3, 12, 0, 1); lamp(L, G, X(-4.5), 2.3, 7.6, { r: .06, i: .7, d: 5, c: '#ffc070', hex: 0xffc070 });
      // дизель: станина, цилиндры, маховик, выхлоп
      box(G, 2.6, .5, 1.1, M('#2a3a2e', { m: .5, r: .5 }), X(-5.2), .25, 10.6); box(G, 2.0, .7, .9, M('#3a5040', { m: .5, r: .45 }), X(-5.4), .85, 10.6);
      for (let i = 0; i < 4; i++) { cyl(G, .14, .14, .4, M('#4a5a4e', { m: .6, r: .4 }), X(-6.1 + i * .45), 1.4, 10.6, 12); cyl(G, .05, .05, .2, steel, X(-6.1 + i * .45), 1.68, 10.6, 8); }
      L.fly = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .12, 24), M('#2a2c2e', { m: .7, r: .4 })); L.fly.rotation.z = Math.PI / 2; L.fly.position.set(X(-3.75), .7, 10.6); G.add(L.fly);
      box(G, .1, .14, .5, M('#c8a030', { m: .3, r: .4 }), X(-3.75), 1.15, 10.6).visible = true;
      cyl(G, .1, .1, 2.0, rust, X(-6.6), 1.9, 11.6, 10);
      // выхлопная труба наружу, на запад: под ней снег в саже — рядом с будкой
      { const p = cyl(G, .1, .1, 1.6, rust, X(-7.6), 2.4, 9.6, 10); p.rotation.z = Math.PI / 2; cyl(G, .12, .1, 1.4, rust, X(-8.4), 3.0, 9.6, 10); }
      L.smoke = []; { const st = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(40,40,44,.7)'); gr.addColorStop(1, 'rgba(40,40,44,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
        for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, transparent: true, depthWrite: false, opacity: .6 })); s.position.set(X(-8.4), 3.7 + i * .3, 9.6); s.scale.set(.8, .8, 1); G.add(s); L.smoke.push(s); } }
      const sootM = M('#4a4a50', { r: 1 }); for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(rnd(.2, .5), 10), sootM); s.rotation.x = -Math.PI / 2; s.position.set(X(-9.0 + rnd(-.8, .8)), .012 + i * .0005, 10.6 + rnd(-.6, 1.2)); G.add(s); }
      // бочки, верстак с ключом, канистры
      for (let i = 0; i < 5; i++) cyl(G, .28, .28, .85, [M('#3a5a3a', { m: .4, r: .5 }), M('#7a2a20', { m: .4, r: .5 })][i % 2], X(-6.5 + (i % 3) * .62), .43, 8.6 + Math.floor(i / 3) * .62, 16);
      box(G, 1.6, .07, .6, woodD, X(-2.9), .85, 11.55); for (const dx of [-.7, .7]) box(G, .07, .83, .55, woodD, X(-2.9 + dx), .42, 11.55);
      L.wrench = box(G, .32, .03, .06, steel, X(-3.0), .9, 11.4); L.wrench.rotation.y = .4;
      box(G, .2, .02, .06, M('#5a1a10', { r: .5 }), X(-2.95), .915, 11.4).rotation.y = .4;
      lamp(L, G, X(-4.5), 2.3, 10.2, { r: .08, i: .75, d: 5.5, c: '#ffe0b0', hex: 0xffe0b0, hang: .2 });
      // ---------- склад керна ----------
      const KH = 2.8;
      wallsZ(7, 8, 14, KH, null, 1); wallsZ(12, 8, 14, KH, null, -1); wallsX(8, 7, 12, KH, [[9.0, 10.0]], 1); wallsX(14, 7, 12, KH, null, -1);
      roof(8, 14, 7, 12, KH, .9); door(8, 9.5, false, 1.0, 1);
      lamp(L, G, X(7.6), 2.3, 9.5, { r: .06, i: .7, d: 5, c: '#ffc070', hex: 0xffc070 });
      const crateT = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#9a7a52'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(60,40,20,.3)'; g.fillRect(0, i * h / 5, w, 2); } noise(g, w, h, 1500, .08); });
      const crateM = M('#ffffff', { map: crateT, r: .85 });
      // все номера ящиков — на одной текстуре (8×6 ячеек), чтобы бирки склеились в одну сетку
      const numAtlas = canvasTex(512, 192, (g, w, h) => { for (let n = 1; n <= 48; n++) { const cx = ((n - 1) % 8) * 64, cy = Math.floor((n - 1) / 8) * 32; g.fillStyle = '#ece4cc'; g.fillRect(cx + 1, cy + 1, 62, 30); g.fillStyle = '#1a1a1a'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('№' + n, cx + 32, cy + 24); } });
      const numM = M('#ffffff', { map: numAtlas, r: .8 });
      const numGeo = n => { const g = new THREE.PlaneGeometry(.22, .11), uv = g.attributes.uv, cx = ((n - 1) % 8) / 8, cy = 1 - (Math.floor((n - 1) / 8) + 1) / 6; for (let i = 0; i < uv.count; i++) uv.setXY(i, cx + uv.getX(i) / 8, cy + uv.getY(i) / 6); return g; };
      let num = 1;
      for (const [z0, face] of [[7.45, 1], [11.55, -1]]) for (let lvl = 0; lvl < 4; lvl++) {
        box(G, 5.4, .05, .55, woodD, X(11), .3 + lvl * .6, z0);
        for (let i = 0; i < 6; i++) { const x = 8.7 + i * .9, y = .3 + lvl * .6 + .2; box(G, .78, .35, .45, crateM, X(x), y, z0); const lb = new THREE.Mesh(numGeo(num), numM); lb.position.set(X(x), y, z0 + face * .23); if (face < 0) lb.rotation.y = Math.PI; G.add(lb); if (num === 17) L.box17 = { x: X(x), y, z: z0 }; num++; }
      }
      for (const x of [8.3, 13.7]) for (const z of [7.45, 11.55]) box(G, .06, 2.5, .06, woodD, X(x), 1.25, z);
      box(G, 1.0, .05, .6, woodL, X(13.2), .8, 9.5); box(G, .35, .25, .25, M('#5a5a5a', { m: .4, r: .5 }), X(13.3), .95, 9.5);
      for (let i = 0; i < 5; i++) { const c = cyl(G, .045, .045, rnd(.4, .9), M('#7a7068', { r: .7 }), X(12.8 + rnd(-.2, .2)), .85, 9.5 + rnd(-.2, .2), 10); c.rotation.z = Math.PI / 2; }
      lamp(L, G, X(11), 2.5, 9.5, { r: .09, i: .85, d: 6, c: '#ffe8c0', hex: 0xffe8c0, hang: .2 });
      // ---------- метеоплощадка ----------
      const fx0 = -15.6, fx1 = -9, fz0 = 7.5, fz1 = 14.2;
      const fence = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.1); for (let i = 0; i <= n; i++) { const u = i / n; box(G, .08, 1.1, .08, white, X(x0 + (x1 - x0) * u), .55, z0 + (z1 - z0) * u); } for (const y of [.4, .95]) { const len = Math.hypot(x1 - x0, z1 - z0); const b = box(G, len, .05, .04, white, X((x0 + x1) / 2), y, (z0 + z1) / 2); b.rotation.y = -Math.atan2(z1 - z0, x1 - x0); } };
      fence(fx0, fz0, -12.2, fz0); fence(-10.8, fz0, fx1, fz0); fence(fx0, fz1, fx1, fz1); fence(fx0, fz0, fx0, fz1); fence(fx1, fz0, fx1, fz1);
      // психрометрическая будка (жалюзи) на ножках
      { const lt = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#f0eee8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(80,90,100,.35)'; g.fillRect(0, i * 8 + 5, w, 2); } }); const lm = M('#ffffff', { map: lt, r: .7 });
        for (const [dx, dz] of [[-.3, -.25], [.3, -.25], [-.3, .25], [.3, .25]]) box(G, .06, 1.2, .06, white, X(-13.4 + dx), .6, 11.2 + dz); box(G, .8, .7, .6, lm, X(-13.4), 1.55, 11.2); box(G, .9, .06, .7, white, X(-13.4), 1.93, 11.2); }
      // флюгер и анемометр на мачте
      cyl(G, .05, .06, 5, white, X(-14.6), 2.5, 13.3, 8); L.anemo = new THREE.Group(); L.anemo.position.set(X(-14.6), 5.1, 13.3); G.add(L.anemo);
      for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const arm = new THREE.Mesh(new THREE.BoxGeometry(.45, .02, .02), steel); arm.position.set(Math.cos(a) * .22, 0, Math.sin(a) * .22); arm.rotation.y = -a; L.anemo.add(arm); const cup = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8, 0, Math.PI), steel); cup.position.set(Math.cos(a) * .45, 0, Math.sin(a) * .45); cup.rotation.y = -a; L.anemo.add(cup); }
      { const vane = box(G, .7, .2, .02, M('#c03020', { r: .5 }), X(-14.3), 4.6, 13.3); vane.rotation.y = .6; }
      // осадкомер
      cyl(G, .12, .1, .6, steel, X(-11.8), 1.2, 13.2, 14); cyl(G, .02, .02, .9, white, X(-11.8), .45, 13.2, 6);
      // будка наблюдателя — в ней найдут Решетова
      const bx0 = -11, bx1 = -9.4, bz0 = 8.6, bz1 = 10.2, BH = 2.2;
      wallsZ(bz0, bx0, bx1, BH, null, 1); wallsZ(bz1, bx0, bx1, BH, [[-10.6, -9.8]], -1); wallsX(bx0, bz0, bz1, BH, null, 1); wallsX(bx1, bz0, bz1, BH, null, -1);
      roof(bx0, bx1, bz0, bz1, BH, .5); door(-10.2, bz1, true, .8, -1);
      box(G, 1.2, .05, .35, woodD, X(-10.2), .75, 8.85); box(G, .3, .02, .22, M('#2a3a5a', {}), X(-10.4), .79, 8.85);
      cyl(G, .015, .015, .3, M('#e0e0e0', { r: .2 }), X(-9.7), 1.3, 8.7, 6);
      lamp(L, G, X(-10.2), 1.9, 9.4, { r: .04, i: .35, d: 3, c: '#ffd0a0', hex: 0xffd0a0 });
      // тело: свернулся в углу будки (потом — на столе в кают-компании, под простынёй)
      const mkBody = () => { const b = new THREE.Group(); const coat = M('#2a2e34', { r: 1 }); const t = box(b, .45, .55, .3, coat, 0, .35, 0); t.rotation.x = -.35; const hd = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), M('#c8b0a0', { r: .8 })); hd.position.set(0, .7, .1); b.add(hd); const ht = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8, 0, 6.3, 0, 1.4), M('#4a3a2c', { r: 1 })); ht.position.set(0, .73, .08); b.add(ht);
        for (const sd of [-1, 1]) { const lg = box(b, .15, .14, .55, M('#2a2622', { r: 1 }), sd * .12, .08, .32); lg.rotation.x = .1; } return b; };
      L.bodyB = mkBody(); L.bodyB.position.set(X(-10.6), 0, 9.0); L.bodyB.rotation.y = .5; G.add(L.bodyB);
      L.bodyT = new THREE.Group(); G.add(L.bodyT); { const sheet = M('#dcd8ce', { r: .95 }); const s = box(L.bodyT, .55, .25, 1.8, sheet, X(-7.2), .92, -2.4); s.rotation.y = Math.PI / 2; const h = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 8), sheet); h.position.set(X(-6.25), .95, -2.4); L.bodyT.add(h); for (const sd of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), sheet); f.position.set(X(-8.1), 1.05, -2.4 + sd * .12); L.bodyT.add(f); } }
      // фонарь, который в полночь идёт от площадки к рубке
      L.lantern = new THREE.Group(); G.add(L.lantern); { const g = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), M('#ffd890', { e: '#ffb040', ei: 3 })); g.position.y = 1.0; L.lantern.add(g); const fig = box(L.lantern, .4, 1.5, .3, M('#1e1e22', { r: 1, op: .7 }), 0, .75, 0); fig.material.transparent = true; }
      L.lanternPath = [[-11.5, 10.8], [-11.5, 7.3], [-11.5, 6], [9.6, 6], [9.6, -1.2], [8.6, -1.2]];
      // ---------- леер: столбики и трос по всем тропам ----------
      const rope = M('#5a5a5a', { m: .5, r: .5 }), postM = M('#3a3a3a', { m: .4, r: .6 });
      const leer = (pts) => { for (let k = 0; k < pts.length - 1; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1]; const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 2.2));
        for (let i = 0; i <= n; i++) { const u = i / n; cyl(G, .045, .05, 1.15, postM, X(ax + (bx - ax) * u), .57, az + (bz - az) * u, 6); }
        const r = cyl(G, .018, .018, len, rope, X((ax + bx) / 2), 1.05, (az + bz) / 2, 5); r.rotation.z = Math.PI / 2; r.rotation.y = -Math.atan2(bz - az, bx - ax);
        const ic = cyl(G, .03, .03, len, M('#e8eef4', { r: .6 }), X((ax + bx) / 2), 1.09, (az + bz) / 2, 5); ic.rotation.z = Math.PI / 2; ic.rotation.y = -Math.atan2(bz - az, bx - ax); } };
      // трос идёт на 0.55 м сбоку от середины тропы
      leer([[-10.4, -.6], [-12.05, -.6], [-12.05, 7.3]]); leer([[-10.95, 5.45], [9.05, 5.45], [9.05, -.6], [8.5, -.6]]); leer([[-12.05, 6.55], [-5.05, 6.55], [-5.05, 7.9]]); leer([[-3.95, 7.9], [-3.95, 6.55], [6.45, 6.55], [6.45, 9.0], [7.9, 9.0]]); leer([[10.15, 6.55], [10.15, -1.8], [8.5, -1.8]]);
      // нарты, вездеход под снегом, бочки снаружи
      { const s = new THREE.Group(); for (const sd of [-1, 1]) { box(s, 2.2, .05, .06, woodL, 0, .08, sd * .3); } for (let i = 0; i < 5; i++) box(s, .06, .05, .7, woodL, -.9 + i * .45, .2, 0); s.position.set(X(-12.6), 0, 2.4); s.rotation.y = .3; G.add(s); flatten(G, s); }
      { const v = new THREE.Group(); box(v, 3.2, 1.3, 1.8, M('#4a5a3a', { m: .3, r: .6 }), 0, 1.0, 0); box(v, 1.4, .7, 1.7, M('#4a5a3a', { m: .3, r: .6 }), -.6, 2.0, 0); for (const sd of [-1, 1]) box(v, 3.4, .5, .4, M('#1e1e1e', { r: .9 }), 0, .3, sd * .95); const sn = new THREE.Mesh(driftG, snowM); sn.scale.set(2.4, 1.1, 1.4); sn.position.set(.6, .2, .4); v.add(sn); v.position.set(X(1.9), 0, 10.2); v.rotation.y = -.2; G.add(v); flatten(G, v); }
      for (let i = 0; i < 6; i++) cyl(G, .3, .3, .88, M('#5a3a2a', { m: .4, r: .6 }), X(11.6 + (i % 3) * .64), .44, 2.2 + Math.floor(i / 3) * .64, 14);
      // ---------- пурга ----------
      { const n = 3200, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = X(rnd(-12, 12)); pos[i * 3 + 1] = rnd(0, 6); pos[i * 3 + 2] = rnd(-12, 12); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const dot = canvasTex(32, 32, (c) => { const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); });
        L.snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xe8f0ff, size: .1, map: dot, transparent: true, opacity: .9, depthWrite: false })); G.add(L.snow);
        // полосы позёмки и летящего снега вдоль ветра
        const m = 1400, sp = new Float32Array(m * 6); for (let i = 0; i < m; i++) { const x = X(rnd(-10, 10)), y = i % 3 === 0 ? rnd(0, .5) : rnd(0, 5), z = rnd(-10, 10), l = rnd(.3, .9); sp.set([x, y, z, x + l * .9, y + l * .08, z - l * .4], i * 6); }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
        L.streaks = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xdfe8f4, transparent: true, opacity: .32, depthWrite: false })); G.add(L.streaks); }
      // ---------- точки осмотра ----------
      const I = (id, x, z, r) => INSPECT.push({ id, x: X(x), z, r: r || 1.1, loc: 'polar', lv: 0 });
      I('body', -10.2, 10.8, 1.2); I('kiset', -10.2, 10.8, 1.2); I('bodyT', -7.2, -1.5, 1.3); I('kisetT', -7.2, -1.5, 1.3);
      I('journal', 5.6, -2.9, .9); I('radioSet', 7.0, -3.0, .9); I('floor', 5.4, -.6, .9); I('valenki', 7.7, -.4, .8);
      I('box17', 10.8, 8.2, 1.3); I('dieselKey', -2.9, 11.0, 1.0); I('dieselKeyM', -2.9, 11.0, 1.0); I('cabinet', -2.6, -2.5, 1.0);
      I('karrMess', -7.2, 0, 1.0); I('bobrovDesk', -7.3, 1.8, .9); I('leer', -11.5, 3, 1.0); I('stoveH', -9.0, -2.6, .9); I('mapP', -5.6, -3.3, 1.0); I('dogs', -9.3, 0, .9); I('anemo', -14.2, 12.6, 1.4);
      // ---------- люди ----------
      const N = (id, place, look, opt) => addNPC(id, place, look, Object.assign({ loc: 'polar', lv: 0, fy: 0 }, opt || {}));
      const sit = (x, z, face, sy) => ({ x: X(x), z, face, seatY: sy || .45, pose: 'sit' });
      const stand = (x, z, face) => standAt(X(x), z, face);
      const polar = o => Object.assign({ coat: '#3a3e44', pants: '#2a2a2e', boots: true, coatTex: 'sack' }, o);
      const LK = {
        reshetov: polar({ coat: '#3a3e44', beard: 'trim', beardC: '#9a948a', hair: '#8a847a', skin: '#d8a888', eyeC: '#4a5a6a', hairStyle: 'short' }),
        tkach: polar({ coat: '#2e3a36', vest: true, hair: '#2a2622', hairStyle: 'side', skin: '#e8c0a0', eyeC: '#3a4a3a', glasses: true }),
        nina: { female: true, coat: '#f0f0ea', skirt: '#3a3a44', hair: '#3a2a1e', hairStyle: 'bun', skin: '#f2d0b9', lips: '#b0605e', armPose: 'lap' },
        seva: polar({ coat: '#2a3a5a', hat: 'ushanka', hatC: '#5a4a3a', hair: '#a87a4a', hairStyle: 'messy', skin: '#f0c8a8', glasses: true }),
        taras: { coat: '#eae6dc', apron: true, pants: '#3a3a3a', beard: 'moust', beardC: '#3a2a20', hair: '#3a2a20', skin: '#e8b090', heavy: true },
        kuzmich: polar({ coat: '#3a3a30', hat: 'cap', hatC: '#2a2a28', hair: '#6a6258', hairStyle: 'messy', beard: 'trim', beardC: '#7a7268', skin: '#c89070', heavy: true }),
        vera: { female: true, coat: '#5a4a3a', skirt: '#2a2a30', hair: '#c8a060', hairStyle: 'bob', skin: '#f0c8b0', lips: '#b0605e' },
        bobrov: { coat: '#3a3a3e', lapels: true, tie: true, pants: '#2a2a2e', hair: '#4a4038', hairStyle: 'side', skin: '#e8b898', heavy: true, shoes: true }
      };
      L.np = {
        reshetov: N('reshetov', sit(-2.6, -2.75, '-z'), LK.reshetov),
        reshetovW: N('reshetov', stand(10.4, 8.5, '-z'), LK.reshetov),
        tkach: N('tkach', sit(6.4, -2.8, '-z'), LK.tkach),
        tkachM: N('tkach', stand(-5.2, -2.0, '-x'), LK.tkach),
        nina: N('nina', sit(-4.6, 3.42, '-z', .6), LK.nina),
        ninaM: N('nina', stand(-7.0, -1.45, '-z'), LK.nina),
        seva: N('seva', sit(-1.0, 3.42, '-z', .6), LK.seva),
        sevaP: N('seva', stand(-12.6, 11.2, '-x'), LK.seva),
        taras: N('taras', stand(1.6, -2.85, '-z'), LK.taras),
        kuzmich: N('kuzmich', stand(-3.3, 10.4, '-x'), LK.kuzmich),
        kuzmichL: N('kuzmich', sit(2.5, 3.42, '-z', .6), LK.kuzmich),
        vera: N('vera', stand(11.6, 10.6, '-z'), LK.vera),
        veraM: N('vera', sit(-6.0, -1.75, '-z'), LK.vera),
        bobrov: N('bobrov', sit(-7.7, 1.85, '+x'), Object.assign({ prop: 'paper' }, LK.bobrov)),
        bobrovM: N('bobrov', stand(-8.4, -1.5, '+z'), LK.bobrov)
      };
      // ещё двое зимовщиков — шахматы в кают-компании
      let sd = 800; const XN = (place, look, name) => N('x' + (sd++), place, look, { bark: 'polar', name });
      L.extras = [XN(sit(-9.3, -1.55, '+x'), polar({ coat: '#4a4a3a', beard: 'full', beardC: '#5a4a3a', hair: '#5a4a3a', skin: '#e0b090' }), 'Гидролог Саша'), XN(sit(-8.5, -1.55, '-x'), polar({ coat: '#3a4a5a', hair: '#2a2a2a', hairStyle: 'buzz', skin: '#e8c0a0' }), 'Аэролог Митя')];
      Object.values(L.np).forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: 0 }));
      L.extras.forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: 0 }));
      // мебель-препятствия
      [[-7.2, -2.4], [-8.3, -2.4], [-6.1, -2.4], [-9.2, -3.2], [-8.9, -1.55], [-2.6, -3.35], [1.6, -3.5], [.4, -1.6], [3.5, -1.4], [6.4, -3.5], [-5.2, 10.6], [-4.2, 10.6], [-6.2, 10.6], [-6.5, 8.6], [-5.9, 8.6], [-5.3, 8.6], [13.2, 9.5], [-13.4, 11.2], [-14.6, 13.3], [-11.8, 13.2]].forEach(([x, z]) => L.blockers.push({ x: X(x), z, lv: 0 }));
      L.lamps.forEach(l => { l.i0 = l.i; });
      worldUV(G); L.merged = mergeStatic(G, L, extra);
      // ---------- проходимые области ----------
      const W = [
        // дом
        [-9.85, 3.85, -.65, .65], [-10.35, -9.6, -.45, .45],
        [-9.85, -4.65, -3.85, -.95], [-7.75, -6.65, -1.05, -.5], [-4.35, -.95, -3.85, -.95], [-2.95, -2.25, -1.05, -.5], [-.65, 3.85, -3.85, -.95], [1.25, 1.95, -1.05, -.5],
        [-9.85, -6.65, .95, 3.85], [-6.35, -3.15, .95, 3.85], [-2.85, .35, .95, 3.85], [.65, 3.85, .95, 3.85],
        [-8.55, -7.85, .5, 1.05], [-5.05, -4.35, .5, 1.05], [-1.55, -.85, .5, 1.05], [1.85, 2.55, .5, 1.05],
        // радиорубка
        [4.6, 8.25, -3.85, 1.25], [8.15, 8.75, -1.6, -.8],
        // дизельная и склад
        [-6.85, -2.15, 8.15, 11.85], [-4.95, -4.05, 7.75, 8.3],
        [8.15, 13.85, 7.6, 11.4], [7.75, 8.3, 9.05, 9.95],
        // тропы вдоль леера
        [-12.2, -10.3, -.55, .55], [-12.0, -10.95, -.55, 8.0], [-11.95, 9.95, 5.55, 6.45], [-5.0, -4.0, 6.0, 8.0], [9.1, 9.95, -1.6, 6.45], [8.6, 9.95, -1.6, -.8], [6.5, 7.6, 6.0, 9.95], [6.5, 8.0, 9.05, 9.95],
        // метеоплощадка (кроме будки)
        [-15.3, -11.15, 7.8, 13.9], [-11.15, -9.3, 10.45, 13.9], [-12.0, -10.95, 7.0, 8.0]
      ];
      L.walk = W.map(r => [X(r[0]), X(r[1]), r[2], r[3], 0]);
      L.zones = [[X(-16), X(-9), 'Метеоплощадка', 0], [X(-9), X(4.2), 'Станция «Полынья-4»', 0], [X(4.2), X(16), 'Радиорубка и склад керна', 0]];
    },
    enter(L) {
      if (!S.f.p_started) { S.f.p_started = true; S.time = -240; resetPolar(L); startPos(); setTimeout(() => startScene('polIntro'), 500); }
      else startPos();
    },
    tick(L, dt) {
      const busy = D.on || endEl.classList.contains('on') || noteEl.classList.contains('on') || sandOn || ['fight', 'cards', 'band', 'keypad'].some(id => document.getElementById(id).classList.contains('on'));
      const t = performance.now() / 1000, f = S.f, lx = P.x - PX, ins = inside(lx, P.z);
      // туман: в пурге видно несколько метров, в доме — комнату целиком
      if (scene.fog) { const k = Math.min(1, dt * 3), tn = f.p_solved && !f.p_sab ? [4, 40] : ins ? FOG_IN : FOG_OUT; scene.fog.near += (tn[0] - scene.fog.near) * k; scene.fog.far += (tn[1] - scene.fog.far) * k; }
      // пурга несётся с северо-востока вокруг камеры
      { const p = L.snow.geometry.attributes.position, cx = camera.position.x, cz = camera.position.z, cy = camera.position.y, calm = f.p_solved ? .15 : 1;
        for (let i = 0; i < p.count; i++) { let x = p.getX(i) - dt * (9 + (i % 7)) * calm, y = p.getY(i) - dt * (1.2 + Math.sin(t * 2 + i) * .8), z = p.getZ(i) + dt * (4 + Math.sin(t * .9 + i * .7) * 2.5) * calm;
          if (y < 0) y += 6; if (y > cy + 4) y -= 6; if (x < cx - 12) x += 24; if (x > cx + 12) x -= 24; if (z > cz + 12) z -= 24; if (z < cz - 12) z += 24; p.setXYZ(i, x, y, z); }
        p.needsUpdate = true; L.snow.visible = !ins;
        const q = L.streaks.geometry.attributes.position; L.streaks.visible = !ins;
        if (!ins) for (let i = 0; i < q.count; i += 2) { const sx = dt * (13 + (i % 9)) * calm, sz = dt * 5.5 * calm; let x0 = q.getX(i) - sx, z0 = q.getZ(i) + sz, x1 = q.getX(i + 1) - sx, z1 = q.getZ(i + 1) + sz, y0 = q.getY(i), y1 = q.getY(i + 1);
          if (x0 < cx - 10) { x0 += 20; x1 += 20; } if (x0 > cx + 10) { x0 -= 20; x1 -= 20; } if (z0 > cz + 10) { z0 -= 20; z1 -= 20; } if (z0 < cz - 10) { z0 += 20; z1 += 20; } q.setXYZ(i, x0, y0, z0); q.setXYZ(i + 1, x1, y1, z1); }
        q.needsUpdate = true; }
      L.anemo.rotation.y += dt * (f.p_solved ? 2 : 14);
      L.fly.rotation.x += dt * (L.stall > 0 ? 2 : 11);
      L.smoke.forEach((s, i) => { s.position.y += dt * .5; s.position.x -= dt * 1.6; if (s.position.y > 6.5) { s.position.set(PX - 8.4, 3.7, 9.6); } s.material.opacity = .55 * (1 - (s.position.y - 3.7) / 3); });
      L.mastLights.forEach((m, i) => { m.material.emissiveIntensity = (Math.sin(t * 2.2 + i) > 0 ? 2.6 : .3); });
      L.fireH.material.emissiveIntensity = 1.6 + Math.sin(t * 9) * .4; L.fireK.material.emissiveIntensity = 1.4 + Math.sin(t * 7 + 1) * .3;
      // дизель захлёбывается: свет мигает по всей станции
      if (L.stall > 0) { L.stall -= dt; const on = Math.sin(t * 37) > -.2 && Math.random() > .25; L.lamps.forEach((l, i) => { l.i = on ? l.i0 : l.i0 * .15; }); L.wins.forEach(w => { w.material.emissiveIntensity = on ? 1.3 : .2; }); if (L.stall <= 0) { L.lamps.forEach(l => { l.i = l.i0; }); L.wins.forEach(w => { w.material.emissiveIntensity = 1.3; }); } }
      if (f.p_solved) { if (!f.p_sab) { L.wins.forEach(w => { w.material.emissiveIntensity = .15; }); } return; }
      if (!busy) S.time += dt / 3;
      const tm = S.time, np = L.np;
      const set = (k, v) => { if (!!f[k] !== v) { if (v) f[k] = true; else delete f[k]; derive(); updateQuest(); } };
      set('p_quarrel', tm >= -178); set('p_boxGiven', tm >= -140); set('p_seva', tm >= 5); set('p_torn', tm >= 20); set('p_ransack', tm >= 90);
      if (tm >= 40 && tm < 80 && !f.p_tkVera) set('p_tkVera', true);
      if (tm >= -30 && !f.p_gust && !busy) { L.stall = 5; startScene('polGust'); }
      if (!f.p_alarm && !busy && (tm >= 180 || (f.p_selfFound && L.alarmAt && performance.now() > L.alarmAt))) { startScene('polAlarm'); }
      // кто где
      const R = (a, b) => tm >= a && tm < b;
      np.reshetov.hidden = !(tm < -165 || R(-140, -40));
      np.reshetovW.hidden = !R(-165, -140);
      np.tkach.hidden = R(-40, -6) || R(40, 70) || R(85, 100) || !!f.p_solved;
      np.tkachM.hidden = !R(40, 70);
      np.vera.hidden = tm >= -100; np.veraM.hidden = tm < -100;
      np.seva.hidden = R(-10, 15) || R(175, 185); np.sevaP.hidden = !R(-10, 15);
      np.kuzmich.hidden = !!f.p_arrest; np.kuzmichL.hidden = !f.p_arrest;
      np.bobrov.hidden = !!f.p_alarm; np.bobrovM.hidden = !f.p_alarm;
      np.nina.hidden = !!f.p_alarm; np.ninaM.hidden = !f.p_alarm;
      L.bodyB.visible = tm >= -30 && !f.p_alarm; L.bodyT.visible = !!f.p_alarm;
      L.papers.visible = tm >= 90; L.drawer.position.z = tm >= 90 ? -2.55 : -2.85;
      L.crowbar.visible = tm >= 20 && !f.crowbar; L.board.position.y = tm >= 20 && f.crowbar ? .12 : .045;
      L.soot.visible = tm >= -6;
      // фонарь в пурге — с 23:52 до 00:08 идёт от площадки к рубке
      { const u = (tm + 8) / 16, show = u >= 0 && u <= 1; L.lantern.visible = show; if (show) { const pts = L.lanternPath, segs = []; let tot = 0; for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(d); tot += d; } let s = u * tot, i = 0; while (i < segs.length - 1 && s > segs[i]) { s -= segs[i]; i++; } const a = pts[i], b = pts[i + 1], k = Math.min(1, s / segs[i]); L.lantern.position.set(PX + a[0] + (b[0] - a[0]) * k, 0, a[1] + (b[1] - a[1]) * k); L.lantern.rotation.y = Math.sin(t * 6) * .2; } }
      // 06:00 — самолёт; дело не раскрыто — петля переворачивается
      if (tm >= 360 && !f.p_solved && !busy) startScene('polPlane');
    }
  };
  function startPos() { place(PX - 9.0, 0, -Math.PI / 2, 0); }
  function resetPolar(L) {
    for (const k in S.f) if (k.startsWith('p_') && !['p_solved', 'p_started', 'p_sab'].includes(k)) delete S.f[k];
    S.f.p_started = true;
    NPCS.forEach(n => { if (n.loc === 'polar') delete S.f['met_' + n.id]; });
    if (L && L.lamps) L.lamps.forEach(l => { if (l.i0 === undefined) l.i0 = l.i; l.i = l.i0; });
    if (L) { L.stall = 0; L.alarmAt = 0; }
    derive();
  }

  // ---------- вычисляемые флаги ----------
  const d0 = window.deriveLoc;
  window.deriveLoc = function () {
    d0 && d0();
    const f = S.f;
    const murder = f.bodyBlow || f.ninaConf;
    const radio = f.journalTorn || f.journalEntry || f.tiboPage || f.tarasHeard;
    const platform = f.sevaLight || f.sootValenki || f.crowbar;
    f.p_ready = !!(murder && radio && platform);
  };

  // ---------- действия ----------
  const la0 = window.locAction;
  window.locAction = function (a, def) {
    const tm = S.time, f = S.f, L = LOC.polar;
    const done = () => { derive(); updateQuest(); };
    if (a === 'toPolar') { startScene('toPolar'); return true; }
    if (a === 'goPolar') { closeDialog(); enterLoc('polar'); return true; }
    if (a === 'polFinale') { S.f.act3done = true; S.f.act3truth = true; startScene('polFinale'); return true; }
    if (a === 'polSabFinale') { S.f.act3done = true; S.f.act3sab = true; startScene('polSabFinale'); return true; }
    if (a === 'polBody') {
      if (tm < -30 && !f.p_alarm) { startSolo([[null, null, 'Тесная будка наблюдателя. Журнал, термометры, огарок свечи. Пусто и холодно.']]); S.time += 2; return true; }
      const atTable = !!f.p_alarm, Ls = [];
      Ls.push([null, null, atTable ? 'Ты откидываешь край простыни. Решетов лежит на столе кают-компании, лицо серое, борода в инее.' : 'В углу будки, поджав колени, сидит человек. Борода в инее, глаза приоткрыты. Глеб Решетов.']);
      Ls.push([null, null, 'Затылок проломлен: вмятина под волосами, кровь замёрзла чёрной коркой. Рукавицы аккуратно сложены в кармане — замерзающий так не делает, он тянет их на пальцы до последнего.']);
      Ls.push([null, null, 'Левый рукав задрался. На запястье — выжженное клеймо: лилия с глазом.']);
      if (S.hero === 'miron') Ls.push(['det', null, 'Удар сзади, тяжёлым, по-деловому. И цветочек на руке — как у чиновников на моих кладбищах. Снова они убирают своих.']);
      else Ls.push(['det', null, 'Это не холод. Его убили — и он был человеком Палаты.']);
      startSolo(Ls, () => { addClue('bodyBlow'); addClue('lilyReshetov'); if (S.hero === 'miron') showBuff('Мирон: глаз могильщика'); if (!f.p_alarm && !f.p_selfFound) { f.p_selfFound = true; L.alarmAt = performance.now() + 4000; } done(); });
      S.time += 3; return true;
    }
    if (a === 'polJournal') {
      if (tm < -178) { startSolo([[null, null, 'Радиожурнал. Позывные, время, «связи нет», «связи нет». Последняя запись — 19:40.']]); S.time += 1; return true; }
      if (tm < 20) { startSolo([[null, null, 'Радиожурнал. Запись почерком Ткача: «21:00 — сеанс с материком, прерван. Неисправность».'], ['det', null, 'Он говорит — связи весь вечер не было. А тут сеанс. Прерван.']], () => { addClue('journalEntry'); done(); }); S.time += 2; return true; }
      const Ls = [[null, null, 'Радиожурнал. Страница с записями за вечер вырвана — неровно, торопливо. На следующем листе остался продавленный оттиск карандаша.']];
      if (S.hero === 'tibo') Ls.push(['det', null, 'Мягкий графит, лист под углом к лампе — и буквы встают сами. Я так векселя читал сквозь конверт.'], [null, null, '«21:00. Материк, срочно. Говорит Решетов. Прошу борт. Везу бумаги, касающиеся всех нас…» Дальше обрыв.']);
      startSolo(Ls, () => { addClue('journalTorn'); if (S.hero === 'tibo') { addClue('tiboPage'); showBuff('Тибо читает оттиск'); } done(); });
      S.time += 2; return true;
    }
    if (a === 'polFloor') {
      if (tm < 20 || f.crowbar) { startSolo([[null, null, 'Крашеные половицы. Одна чуть выше соседних — и всё.']]); S.time += 1; return true; }
      startSolo([[null, null, 'Половица под ногой пружинит. Ты поддеваешь её ножом — под ней ломик для льда.'], [null, null, 'На конце — бурая корка и прилипшие седые волосы.']], () => { addClue('crowbar'); done(); });
      S.time += 2; return true;
    }
    if (a === 'polValenki') {
      if (tm < -6) { startSolo([[null, null, 'Валенки радиста у двери. Сухие.']]); S.time += 1; return true; }
      startSolo([[null, null, 'Валенки радиста ещё не просохли. На подошвах и голенищах — снег, перемешанный с сажей. Чёрный.'], ['det', null, 'Такой снег лежит только в одном месте — у будки на площадке, под выхлопной трубой дизельной.']], () => { addClue('sootValenki'); done(); });
      S.time += 2; return true;
    }
    if (a === 'polBox') {
      if (f.listFound) { startSolo([[null, null, 'Ящик № 17 пуст. Папку ты забрал.']]); return true; }
      if (!f.kisetNote && !f.veraBox) { startSolo([[null, null, 'Стеллажи до потолка. Ящики с керном, сотни номеров. Без подсказки тут можно рыться до весны.']]); S.time += 2; return true; }
      if (tm < -140) { startSolo([[null, null, 'Ящик № 17 на месте. Пустой: в нём ещё ничего нет.']]); S.time += 1; return true; }
      startScene('polList'); S.time += 4; return true;
    }
    if (a === 'polCabinet') {
      if (tm < 90) startSolo([[null, null, 'Стол начальника: аккуратные стопки сводок, пепельница, фото жены в рамке. В ящике — пачка «Беломора».']]);
      else startSolo([[null, null, 'Кабинет перевёрнут. Ящики выдвинуты, сводки на полу, рамка с фото разбита. Кто-то искал — и, судя по злости, не нашёл.']], () => { S.f.p_cabSeen = true; });
      S.time += 2; return true;
    }
    if (a === 'polRollback') {
      closeDialog(); sandOn = true; sandEl.classList.add('on'); window.SFX && SFX.play('sand');
      setTimeout(() => { S.loops++; resetPolar(LOC.polar); S.time = -240; startPos(); sandEl.classList.remove('on'); sandOn = false; updateQuest(); updateInv(); startScene('polLoop'); }, 2600);
      return true;
    }
    return la0 ? la0(a, def) : false;
  };

  // кнопка «Завершить дело» для станции
  const fin0 = window.finishLocation;
  window.finishLocation = function () {
    if (WORLD.cur !== 'polar') return fin0 && fin0();
    if (S.f.p_solved) { toastMsg = 'Здесь нечего завершать.'; toastT = 2.5; return; }
    if (D.on) closeDialog();
    ['bodyBlow', 'lilyReshetov', 'journalTorn', 'tarasHeard', 'sevaLight', 'crowbar', 'kisetNote', 'veraBox', 'tkachLily'].forEach(id => { S.f[id] = true; if (!S.clues.includes(id)) S.clues.push(id); });
    if (S.time < 200) S.time = 200;
    S.f.p_dead = S.f.p_gust = S.f.p_alarm = true; derive(); updateQuest();
    const L = LOC.polar; L.tick(L, 0);
    const tk = L.np.tkach; place(tk.x, tk.z + 1.0, 0, 0);
    P.yaw = Math.atan2(-(tk.x - P.x), -(tk.z - P.z));
    showBuff('Все улики собраны — обвини радиста Ткача', false, S.hero);
    setTimeout(() => { if (!D.on) startDialog(tk); }, 450);
  };

  // ---------- вокзал: четвёртая платформа, Гордей, «Голосование» ----------
  const SX = 300, ST = STORY.locs.station;
  ST.quests = [['act3done&!golosDone', 'Вернись к лавке. Герои ждут.'], ['act3done', 'Четвёртое дело закрыто. Дальше — Ясноземье.'], ['act2done&letDone', 'Платформа 4: полярная станция, 1968. Смотритель выдаст досье.']].concat(ST.quests);
  ST.leads.unshift(['act2done&letDone&!act3done', 'Платформа 4 — полярная станция, 1968.', 'insp:plat4'], ['letDone&!g_invited', 'Палач у выхода впервые смотрит на тебя.', 'npc:gordey']);
  Object.assign(STORY.inspect, {
    plat4: { label: 'платформа 4 · 1968 · полярная станция', if: 'act2done&letDone&!act3done', lines: [], go: 'toPolar' },
    plat4wait: { label: 'платформа 4 · 1968', if: '!act2done|!letDone', lines: [[null, null, 'Платформа 4. 1968. Из тумана тянет ледяным ветром. Табло: «Не время».']] },
    plat4done: { label: 'платформа 4 · 1968', if: 'act3done', lines: [[null, null, 'Платформа 4. 1968. Табло мигает: «Раскрыто»… «Не раскрыто»… «Раскрыто». Ветер пахнет соляркой.']] }
  });
  INSPECT.push({ id: 'plat4', x: SX + 7, z: 1.1, r: 1.35, loc: 'station' }, { id: 'plat4wait', x: SX + 7, z: 1.1, r: 1.35, loc: 'station' }, { id: 'plat4done', x: SX + 7, z: 1.1, r: 1.35, loc: 'station' });
  const smD = STORY.dialogs.smotritel;
  smD.nodes.menu.choices.unshift({ t: 'Я готов к следующему делу.', go: 'next3', if: 'act2done&letDone&!act3done&!sm_next3' });
  smD.nodes.next3 = { set: ['sm_next3'], lines: [['smotritel', 'neutral', 'Четвёртая платформа. Полярная станция, тысяча девятьсот шестьдесят восьмой. Пурга.'], ['smotritel', 'smile', 'Там холодно. Хотя вы, кажется, уже привыкли к холоду. Особенно к моему чаю — он сегодня остыл.']], go: 'menu' };
  Object.assign(STORY.scenes, {
    golos: { start: 'g1', nodes: {
      g1: { bg: 'none', lines: [
        [null, null, 'Герои сидят на лавке. На коленях у Мирона — машинописный лист из ящика № 17. Список. Их имена.'],
        ['miron', 'neutral', '«Сброс: назначен». Красивое слово — «сброс». Как будто нас и не было.'],
        ['tibo', 'neutral', 'Сто дел. Я сразу говорил: круглым цифрам не верят.'],
        ['agata', 'neutral', 'Правды здесь нет. Ни в счётчике, ни в чае.'],
        ['rowen', 'neutral', 'Тогда хватит играть по их правилам.'],
        ['miron', 'neutral', 'Голосуем. Играем дальше, как велит Палата, — или по-своему. Ты последний.']], route: [['act3sab', 'g2s'], ['', 'g2t']] },
      g2t: { lines: [['agata', 'neutral', 'Я помолюсь за людей со станции. Они исчезли, потому что мы сказали правду.'], ['rowen', 'neutral', 'Правда тоже стоит дорого.']], go: 'g3' },
      g2s: { lines: [[null, null, 'Тибо подмигивает тебе через лавку.'], [null, null, 'Смотритель проходит мимо самовара и впервые не предлагает вам чаю.']], go: 'g3' },
      g3: { lines: [], choices: [
        { t: 'Дальше — по-своему. Как Ровен.', go: 'vR' },
        { t: 'Дальше — по-своему. Как Тибо: хитро.', go: 'vT' },
        { t: 'Дальше — по-своему. Как Агата: по совести.', go: 'vA' },
        { t: 'Дальше — по-своему. Как Мирон: копаем до дна.', go: 'vM' }] },
      vR: { set: ['vote_rowen'], lines: [['rowen', 'neutral', 'Тогда я буду рядом, когда начнём ломать их порядок.']], go: 'g4' },
      vT: { set: ['vote_tibo'], lines: [['tibo', 'neutral', 'Наконец-то. Саботаж — это искусство. Я научу.']], go: 'g4' },
      vA: { set: ['vote_agata'], lines: [['agata', 'neutral', 'Хорошо. Только без лишней крови.']], go: 'g4' },
      vM: { set: ['vote_miron'], lines: [['miron', 'neutral', 'Копаем. Тут кладбище побольше любого, а я по кладбищам мастер.']], go: 'g4' },
      g4: { lines: [[null, null, 'Решено единогласно: «Дальше — по своим». С этого дня Палата получает от вас то, что вы сами решите ей отдать.'], [null, null, 'Счётчик на доске тихо щёлкает.']], set: ['golosDone'], end: true } } }
  });
  const stL = LOC.station, stEnter = stL.enter, stTick = stL.tick;
  const drawBoard = (L, n, rows) => { L.boardMesh.material = M('#ffffff', { map: canvasTex(512, 360, (g, w, h) => {
    g.fillStyle = '#23342a'; g.fillRect(0, 0, w, h); noise(g, w, h, 4000, .08);
    g.fillStyle = '#ece8dc'; g.textAlign = 'center'; g.font = 'bold 44px Georgia'; g.fillText('ДЕЛА', w / 2, 52); g.font = 'bold 66px Georgia'; g.fillText(n + ' из 100', w / 2, 122);
    g.textAlign = 'left'; g.font = '22px Georgia'; rows.forEach((r, i) => g.fillText(r, 34, 172 + i * 34)); }), r: .9 }); };
  stL.enter = function (L) {
    stEnter.call(this, L);
    if (!L.gordey) {
      L.gordey = addNPC('gordey', standAt(SX + 12.9, 6.2, '-x'), { coat: '#141214', pants: '#141214', hat: 'hood', hatC: '#0e0c0e', boots: true, belt: '#2a2420', hair: '#1a1614', skin: '#c8a088', handsBehind: true }, { loc: 'station' });
      L.blockers.push({ x: L.gordey.x, z: L.gordey.z, k: L.gordey }); blockers.push({ x: L.gordey.x, z: L.gordey.z, k: L.gordey });
    }
    // счётчик: перед актом 3 он один раз тихо уменьшается
    const rows = ['№1  «Тамбур», 2008 — раскрыто', '№2  «Святая Марфа», 1926 — раскрыто', '№3  «Следы в снегу», 1640-е — раскрыто'];
    if (S.f.act3done) drawBoard(L, 3, rows.concat([S.f.act3sab ? '№4  «Белая мгла», 1968 — не раскрыто' : '№4  «Белая мгла», 1968 — раскрыто']));
    else if (S.f.act2done) drawBoard(L, 2, rows);
    if (S.f.act3done && !S.f.golosDone) setTimeout(() => startScene('golos'), 600);
  };
  stL.tick = function (L, dt) {
    stTick.call(this, L, dt);
  };


  // Shift+F7 — сразу на полярную станцию (для проверки)
  document.addEventListener('keydown', e => {
    if (!e.shiftKey || e.code !== 'F7') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!S.hero) { S.f['hero:miron'] = true; S.hero = 'miron'; }
    if (D.on) closeDialog();
    gameOn = true; S.f.solved = true; S.f.act1done = true; S.f.konfDone = true; S.f.act2done = true; S.f.letDone = true; S.f.letSeen = true; S.f.evseyOpen = true;
    enterLoc('polar');
  }, true);
})();
