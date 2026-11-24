// Дополнительное дело: замок Графини Маргарет в Чернолесье (бал-маскарад). Локация стоит по оси X около 1500.
// Помещения: бальный зал (хоры скрипача, три люстры, камин), столовая, библиотека, оранжерея (стекло), гостевое крыло, кухня изгнанников, вестибюль.
// Попасть сюда — тремя чёрными конвертами (вокзал после акта 2, станция «Полынья-4», вокзал после акта 3). Данные — story6.js.
(function () {
  const H = WORLD.H, LOC = WORLD.LOC, CX = 1500;
  const { M, MT, box, cyl, wallX, wallZ, lamp, canvasTex, noise, worldUV, mergeStatic, place, lin, rnd, texSign } = H;
  const X = x => CX + x;
  // группу из мешей — в отдельные сетки прямо в G (чтобы mergeStatic их склеил)
  function flatten(G, grp) { G.updateMatrixWorld(true); grp.updateMatrixWorld(true); grp.traverse(o => { if (!o.isMesh) return; const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); G.add(new THREE.Mesh(g, o.material)); }); G.remove(grp); }

  LOC.ball = {
    fog: [0x0c0e16, 14, 70], walk: [], zones: [], lamps: [], blockers: [],
    build(L) {
      const G = L.group = new THREE.Group(); scene.add(G);
      G.add(new THREE.HemisphereLight(0x6a6a90, 0x2a1a14, .3));
      const extra = [];
      const mk = (draw, w, h, tile, o) => { const t = canvasTex(w, h, draw, 1, 1); const m = new THREE.MeshStandardMaterial(Object.assign({ map: t, roughness: .8 }, o || {})); m.userData.tile = tile; extra.push(m); return m; };
      // ---------- материалы ----------
      const marble = mk((g, w, h) => { const n = 4, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const dark = (i + j) % 2; g.fillStyle = dark ? '#16121a' : '#e8e2d8'; g.fillRect(i * s, j * s, s, s);
          for (let k = 0; k < 6; k++) { g.strokeStyle = dark ? 'rgba(120,100,120,.25)' : 'rgba(120,110,100,.22)'; g.lineWidth = rnd(.5, 2); g.beginPath(); g.moveTo(i * s + rnd(0, s), j * s); g.bezierCurveTo(i * s + rnd(0, s), j * s + s * .3, i * s + rnd(0, s), j * s + s * .7, i * s + rnd(0, s), j * s + s); g.stroke(); } }
        g.strokeStyle = 'rgba(160,130,70,.6)'; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); } }, 512, 512, 3.2, { roughness: .18, metalness: .05 });
      const damask = MT('damask', 1.4, { c: '#8a2030' }), panelM = MT('panel', 1.6, { c: '#4a2a1a' });
      const gold = M('#c9a050', { m: .85, r: .28 }), goldD = M('#8a6a2a', { m: .8, r: .4 }), woodD = M('#2a1a12', { r: .55 }), woodR = M('#5a2a1a', { r: .45 }), velvet = M('#5a0e18', { r: .95 }), black = M('#141014', { r: .6 });
      const parquet = MT('deck', 1.6, { c: '#6a4428' }), stoneM = MT('stone', 1.6, { c: '#8a8278' }), plaster = MT('plaster', 2.4, { c: '#e2dacb' }), terra = mk((g, w, h) => { const s = w / 4; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = ['#5a3020', '#6a3a26', '#4e2a1c'][(i * 3 + j) % 3]; g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); } noise(g, w, h, 2500, .1); }, 256, 256, 1.2);
      const candleM = M('#efe6d0', { r: .6 }), flameM = L.flameM = M('#ffd890', { e: '#ffb040', ei: 3 });
      const glassM = new THREE.MeshStandardMaterial({ color: lin('#9ab8c8'), transparent: true, opacity: .14, roughness: .05, metalness: .3, depthWrite: false, side: THREE.DoubleSide });
      const ironM = M('#1e1e22', { m: .7, r: .45 });
      // ---------- небо, луна, лес, снег снаружи ----------
      const skyT = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#04050a'); gr.addColorStop(.5, '#0e1220'); gr.addColorStop(.56, '#141828'); gr.addColorStop(1, '#0a0c12'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 700; i++) { const y = Math.random() * h * .52; g.fillStyle = 'rgba(255,255,255,' + rnd(.2, .9) + ')'; g.fillRect(Math.random() * w, y, rnd(.6, 1.8), rnd(.6, 1.8)); } });
      const sky = L.sky = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; G.add(sky);
      { const mt = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(.32, 'rgba(240,235,220,1)'); gr.addColorStop(.36, 'rgba(200,210,240,.35)'); gr.addColorStop(1, 'rgba(120,140,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
        const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, fog: false, depthWrite: false, transparent: true })); moon.scale.set(12, 12, 1); moon.position.set(32, 30, -36); moon.renderOrder = -9; sky.add(moon); }
      const snowM = M('#c8d0dc', { r: .9 });
      box(G, 140, .3, 140, snowM, X(0), -.16, 0);
      const fir = M('#0a100e', { r: 1 }), firS = M('#8a94a4', { r: 1 });
      for (let i = 0; i < 140; i++) { const a = rnd(0, Math.PI * 2), r = rnd(26, 50), h = rnd(7, 16); const x = Math.cos(a) * r, z = Math.sin(a) * r; const c = new THREE.Mesh(new THREE.ConeGeometry(h * .26, h, 7), fir); c.position.set(X(x), h / 2, z); G.add(c); const s = new THREE.Mesh(new THREE.ConeGeometry(h * .18, h * .3, 7), firS); s.position.set(X(x), h * .84, z); G.add(s); }
      // ---------- помощники ----------
      // skip — стороны, которые уже нарисованы соседним помещением (общая стена); с этой стороны кладётся тонкая облицовка своим материалом
      const room = (x0, x1, z0, z1, h, wall, floor, ceil, doors, skip) => {
        doors = doors || {}; skip = skip || ''; const g = s => (doors[s] || []).map(([c, w]) => [c - w / 2, c + w / 2]);
        if (!skip.includes('N')) wallZ(G, z0, X(x0), X(x1), 0, h, wall, g('N').map(([a, b]) => [X(a), X(b)]), .2); else wallZ(G, z0 + .115, X(x0 + .1), X(x1 - .1), 0, h, wall, g('N').map(([a, b]) => [X(a), X(b)]), .02);
        if (!skip.includes('S')) wallZ(G, z1, X(x0), X(x1), 0, h, wall, g('S').map(([a, b]) => [X(a), X(b)]), .2); else wallZ(G, z1 - .115, X(x0 + .1), X(x1 - .1), 0, h, wall, g('S').map(([a, b]) => [X(a), X(b)]), .02);
        if (!skip.includes('W')) wallX(G, X(x0), z0, z1, 0, h, wall, g('W'), .2); else wallX(G, X(x0) + .115, z0 + .1, z1 - .1, 0, h, wall, g('W'), .02);
        if (!skip.includes('E')) wallX(G, X(x1), z0, z1, 0, h, wall, g('E'), .2); else wallX(G, X(x1) - .115, z0 + .1, z1 - .1, 0, h, wall, g('E'), .02);
        box(G, x1 - x0, .06, z1 - z0, floor, X((x0 + x1) / 2), 0, (z0 + z1) / 2);
        if (ceil) box(G, x1 - x0, .1, z1 - z0, ceil, X((x0 + x1) / 2), h + .05, (z0 + z1) / 2);
      };
      const candle = (x, y, z, s) => { s = s || 1; cyl(G, .018 * s, .018 * s, .16 * s, candleM, x, y + .08 * s, z, 6); const f = new THREE.Mesh(new THREE.SphereGeometry(.016 * s, 6, 5), flameM); f.scale.y = 1.9; f.position.set(x, y + .19 * s, z); G.add(f); };
      L.flames = [];
      // бра на стене: позолота + две свечи
      const sconce = (x, z, ry, y) => { y = y || 2.4; const dx = Math.sin(ry) * .12, dz = Math.cos(ry) * .12; box(G, .14, .3, .06, gold, x, y, z, ry); for (const s of [-1, 1]) { const ox = Math.cos(ry) * s * .16, oz = -Math.sin(ry) * s * .16; cyl(G, .04, .03, .04, gold, x + dx * 2 + ox, y + .12, z + dz * 2 + oz, 8); candle(x + dx * 2 + ox, y + .14, z + dz * 2 + oz); } lamp(L, G, x + dx * 3, y + .35, z + dz * 3, { r: .01, i: .45, d: 4.5, c: '#ffc070', hex: 0xffb860 }); };
      // ---------- бальный зал ----------
      const BH = 6;
      room(-8, 8, -6, 6, BH, damask, marble, plaster, { W: [[0, 1.6]], E: [[0, 2.0]], S: [[-4, 1.6], [5, 1.4]], N: [[-4, 1.0], [5, 2.0]] });
      // панели понизу, пилястры, карниз
      for (const [z, s] of [[-5.88, 1], [5.88, -1]]) { box(G, 16, 1.1, .06, panelM, X(0), .55, z); box(G, 16, .08, .1, gold, X(0), 1.12, z); box(G, 16, .3, .26, plaster, X(0), BH - .2, z + s * .05); box(G, 16, .06, .3, gold, X(0), BH - .38, z + s * .06); }
      for (const [x, s] of [[-7.88, 1], [7.88, -1]]) { box(G, .06, 1.1, 12, panelM, X(x), .55, 0); box(G, .1, .08, 12, gold, X(x), 1.12, 0); box(G, .26, .3, 12, plaster, X(x + s * .05), BH - .2, 0); }
      for (let x = -6; x <= 6; x += 3) for (const z of [-5.86, 5.86]) { if (Math.abs(x - -4) < .9 || Math.abs(x - 5) < 1.2) continue; box(G, .34, BH - .5, .12, plaster, X(x), (BH - .5) / 2, z); box(G, .4, .14, .16, gold, X(x), BH - .55, z); box(G, .4, .14, .16, gold, X(x), .1, z); }
      // верхние окна над соседними залами: ночь, лес, луна
      const winT = canvasTex(256, 384, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060812'); gr.addColorStop(1, '#1a2034'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd(.3, .9) + ')'; g.fillRect(Math.random() * w, Math.random() * h * .6, 1.4, 1.4); }
        g.fillStyle = '#04060a'; for (let i = 0; i < 9; i++) { const x = i * 32 + rnd(-8, 8), hh = rnd(80, 150); g.beginPath(); g.moveTo(x - 22, h); g.lineTo(x, h - hh); g.lineTo(x + 22, h); g.fill(); }
        g.strokeStyle = '#2a2a30'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h * .55); g.lineTo(w, h * .55); g.stroke(); });
      const winM = M('#ffffff', { map: winT, e: '#1a2040', ei: .5, r: .2 });
      for (const x of [-6, -1.5, 3.5, 7]) for (const [z, ry] of [[-5.86, 0], [5.86, Math.PI]]) { if (z < 0 && x > -2.5 && x < 3.5) continue; const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.9), winM); w.position.set(X(x), 4.35, z + (ry ? -.03 : .03)); w.rotation.y = ry; G.add(w); box(G, 1.36, .1, .14, gold, X(x), 3.36, z); box(G, 1.36, .1, .14, gold, X(x), 5.34, z); }
      // хоры для скрипача над северной стеной
      box(G, 5.6, .2, 1.5, woodR, X(.5), 1.6, -5.25); box(G, 5.6, .08, .1, gold, X(.5), 1.72, -4.5);
      for (let x = -2.1; x <= 3.1; x += .26) cyl(G, .03, .04, .7, gold, X(x), 2.05, -4.52, 8);
      box(G, 5.7, .08, .14, gold, X(.5), 2.42, -4.52);
      for (const x of [-2, 3]) cyl(G, .12, .14, 1.5, plaster, X(x), .75, -4.65, 12);
      // камин в зале (у западной стены)
      box(G, .7, 1.6, 2.2, M('#d8d0c4', { r: .4 }), X(-7.6), .8, -3.4); box(G, .5, .9, 1.3, black, X(-7.4), .5, -3.4); box(G, .9, .12, 2.5, M('#e8e2d8', { r: .3 }), X(-7.55), 1.66, -3.4);
      L.fireB = box(G, .06, .4, .9, M('#ff8a3a', { e: '#ff6a1a', ei: 2.4 }), X(-7.12), .35, -3.4);
      lamp(L, G, X(-6.9), .7, -3.4, { r: .01, i: .9, d: 5, c: '#ff9a4a', hex: 0xff8a3a });
      for (const z of [-4.2, -2.6]) candle(X(-7.5), 1.72, z, 1.5);
      // портрет графини над камином
      { const t = canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#1a0c10'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h * .38, 10, w / 2, h * .4, w * .6); gr.addColorStop(0, '#3a1a20'); gr.addColorStop(1, '#0a0608'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
          g.fillStyle = '#efe2dc'; g.beginPath(); g.ellipse(w / 2, h * .34, 38, 50, 0, 0, 7); g.fill(); g.fillStyle = '#140c0e'; g.beginPath(); g.ellipse(w / 2, h * .26, 46, 40, 0, Math.PI, 0); g.fill(); g.fillRect(w / 2 - 46, h * .26, 14, 60); g.fillRect(w / 2 + 32, h * .26, 14, 60);
          g.fillStyle = '#8a1420'; g.beginPath(); g.ellipse(w / 2, h * .42, 8, 4, 0, 0, 7); g.fill(); g.fillStyle = '#5a0e18'; g.beginPath(); g.moveTo(w / 2 - 90, h); g.quadraticCurveTo(w / 2, h * .5, w / 2 + 90, h); g.fill(); g.fillStyle = '#e8c070'; g.beginPath(); g.arc(w / 2, h * .62, 8, 0, 7); g.fill(); noise(g, w, h, 3000, .08); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.45), M('#ffffff', { map: t, r: .7 })); p.position.set(X(-7.84), 2.9, -3.4); p.rotation.y = Math.PI / 2; G.add(p); box(G, .08, 1.62, 1.28, gold, X(-7.88), 2.9, -3.4); }
      // три люстры: кольца свечей и хрустальные подвески
      L.chand = [];
      for (const x of [-5, 0, 5]) {
        // детали люстры кладём прямо в G — при склейке вся люстра станет парой сеток
        const c = { add: m => { m.position.x += X(x); m.position.y += 4.7; G.add(m); } };
        const ch = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.3, 6), gold); ch.position.y = .65; c.add(ch);
        for (const [r, y, n] of [[.9, 0, 16], [.55, .35, 10]]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .03, 6, 32), gold); ring.rotation.x = Math.PI / 2; ring.position.y = y; c.add(ring);
          for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; const cn = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .14, 6), candleM); cn.position.set(Math.cos(a) * r, y + .08, Math.sin(a) * r); c.add(cn); const f = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 5), flameM); f.scale.y = 1.9; f.position.set(Math.cos(a) * r, y + .18, Math.sin(a) * r); c.add(f);
            const cr = new THREE.Mesh(new THREE.OctahedronGeometry(.035, 0), M('#e8f0ff', { m: .3, r: .05, e: '#30384a', ei: .6 })); cr.scale.y = 1.8; cr.position.set(Math.cos(a + .2) * r, y - .12, Math.sin(a + .2) * r); c.add(cr); } }
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), gold); bowl.scale.y = .6; bowl.position.y = -.1; c.add(bowl);
        lamp(L, G, X(x), 4.5, 0, { r: .01, i: 1.05, d: 11, c: '#ffd0a0', hex: 0xffcf98 });
      }
      for (const z of [-5.6, 5.6]) for (const x of [-6.6, -2.6, 2, 6.6]) if (!(z < 0 && x > -3 && x < 3.5)) sconce(X(x), z, z < 0 ? 0 : Math.PI, 2.5);
      // кресла и диванчики вдоль южной стены
      for (const x of [-6.6, -1.5, 1.6, 7]) { box(G, .9, .45, .6, velvet, X(x), .3, 5.5); box(G, .9, .6, .12, velvet, X(x), .75, 5.78); box(G, 1.0, .06, .7, gold, X(x), .08, 5.5); }
      // ---------- столовая ----------
      room(-8, 1, 6, 12, 3.4, damask, parquet, plaster, { N: [[-4, 1.6]] }, 'N');
      box(G, 5.6, .08, 1.3, woodR, X(-3.5), .78, 9); for (const dx of [-2.6, 2.6]) for (const dz of [-.5, .5]) cyl(G, .05, .06, .76, woodD, X(-3.5 + dx), .38, 9 + dz, 8);
      box(G, 5.4, .02, 1.36, M('#ece6d8', { r: .8 }), X(-3.5), .83, 9);
      L.forkSlot = null;
      for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const x = -6 + i * .72, z = 9 + s * .48; cyl(G, .12, .1, .02, M('#f4f0e8', { r: .2 }), X(x), .85, z, 18); box(G, .02, .01, .18, M('#d8dce4', { m: .9, r: .2 }), X(x - .16), .85, z); if (!(s === -1 && i === 6)) box(G, .02, .01, .18, M('#d8dce4', { m: .9, r: .2 }), X(x + .16), .85, z);
        box(G, .44, .05, .44, woodR, X(x), .46, z + s * .55); box(G, .44, .55, .05, woodR, X(x), .75, z + s * .76); }
      for (const x of [-5, -2]) { cyl(G, .06, .1, .5, gold, X(x), 1.08, 9, 10); for (let k = -1; k <= 1; k++) candle(X(x + k * .14), 1.34, 9, 1.2); lamp(L, G, X(x), 1.7, 9, { r: .01, i: .55, d: 4.5, c: '#ffc070', hex: 0xffb860 }); }
      // мольберт с планом рассадки
      { const t = canvasTex(256, 320, (g, w, h) => { g.fillStyle = '#ece4cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a2a1a'; g.font = 'italic bold 20px Georgia'; g.textAlign = 'center'; g.fillText('Рассадка', w / 2, 30); g.strokeStyle = '#6a4a2a'; g.strokeRect(70, 50, 116, 240);
          const names = ['Гр. Маргарет', 'Г-н Мытарь', 'Кн. Веле', 'Г-жа Ольм', 'Бар. Светозарова', 'Г-н Тихон', 'Бар. Светозаров', 'Г-жа Нея']; g.font = '12px Georgia'; names.forEach((n, i) => { g.textAlign = 'right'; g.fillText(n, 66, 70 + i * 28); }); noise(g, w, h, 1500, .05); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(.55, .7), M('#ffffff', { map: t, r: .8 })); p.position.set(X(-6.6), 1.35, 6.95); p.rotation.x = -.15; G.add(p); for (const dx of [-.22, .22]) { const l = box(G, .03, 1.5, .03, woodD, X(-6.6 + dx), .75, 7.05); l.rotation.x = -.15; } }
      box(G, 1.4, 1.0, .5, woodR, X(-7.5), .5, 11.4); box(G, 1.4, .05, .55, gold, X(-7.5), 1.02, 11.4);
      // ---------- библиотека ----------
      room(1, 8, 6, 12, 3.4, panelM, parquet, plaster, { N: [[5, 1.4]] }, 'NW');
      const booksT = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#1a1008'; g.fillRect(0, 0, w, h); for (let row = 0; row < 4; row++) { let x = 4; const y0 = row * 64; g.fillStyle = '#3a2412'; g.fillRect(0, y0 + 58, w, 6); while (x < w - 6) { const bw = rnd(8, 20), bh = rnd(38, 54); g.fillStyle = ['#5a1a14', '#1a2a4a', '#2a3a1a', '#4a3a1a', '#3a1a3a', '#6a5a3a'][Math.floor(Math.random() * 6)]; g.fillRect(x, y0 + 58 - bh, bw - 1, bh); g.fillStyle = 'rgba(220,180,90,.6)'; g.fillRect(x + 2, y0 + 58 - bh + 6, bw - 5, 2); g.fillRect(x + 2, y0 + 58 - 10, bw - 5, 2); x += bw; } } noise(g, w, h, 2000, .06); });
      const booksM = M('#ffffff', { map: booksT, r: .8 });
      for (const [x, z, w, ry] of [[1.12, 9, 5.6, Math.PI / 2], [4.5, 11.88, 6.6, Math.PI]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.0), booksM); b.position.set(X(x) + (ry === Math.PI / 2 ? .12 : 0), 1.6, z - (ry === Math.PI ? .12 : 0)); b.rotation.y = ry; G.add(b); box(G, ry === Math.PI / 2 ? .26 : w, 3.1, ry === Math.PI / 2 ? w : .26, woodD, X(x) + (ry === Math.PI / 2 ? -.02 : 0), 1.55, z + (ry === Math.PI ? .02 : 0)); }
      // камин с огнём
      box(G, .8, 1.5, 2.4, stoneM, X(7.6), .75, 9); box(G, .5, .95, 1.4, black, X(7.42), .48, 9); box(G, 1.0, .14, 2.7, M('#3a2a20', { r: .5 }), X(7.55), 1.56, 9);
      L.fireL = box(G, .06, .45, 1.0, M('#ff8a3a', { e: '#ff6a1a', ei: 2.4 }), X(7.12), .35, 9);
      lamp(L, G, X(6.8), .7, 9, { r: .01, i: 1.0, d: 6, c: '#ff9a4a', hex: 0xff8a3a });
      L.page = box(G, .14, .005, .1, M('#d8c8a0', { r: .9 }), X(7.25), .1, 8.7); L.page.rotation.y = .4;
      // ковёр, кресла, стол Мытаря с книгой
      { const t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#5a1418'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a050'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 2; g.strokeRect(30, 30, w - 60, h - 60); g.fillStyle = '#2a1a3a'; g.beginPath(); g.ellipse(w / 2, h / 2, 60, 40, 0, 0, 7); g.fill(); noise(g, w, h, 3000, .1); });
        const r = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6), M('#ffffff', { map: t, r: 1 })); r.rotation.x = -Math.PI / 2; r.position.set(X(4.5), .035, 9.3); G.add(r); }
      L.blood = new THREE.Mesh(new THREE.CircleGeometry(.55, 20), M('#3a0406', { r: .25, m: .1 })); L.blood.rotation.x = -Math.PI / 2; L.blood.scale.y = .7; L.blood.position.set(X(4.2), .04, 9.6); G.add(L.blood);
      box(G, 1.3, .06, .8, woodR, X(3.0), .76, 7.4); for (const dx of [-.55, .55]) box(G, .06, .74, .7, woodD, X(3.0 + dx), .37, 7.4);
      L.ledger = box(G, .34, .06, .26, M('#3a2a1a', { r: .6 }), X(3.0), .82, 7.4);
      for (const [x, z, ry] of [[6.3, 7.4, -.6], [6.3, 10.8, -2.4]]) { const a = new THREE.Group(); box(a, .8, .45, .75, velvet, 0, .3, 0); box(a, .8, .7, .15, velvet, 0, .75, -.33); for (const s of [-1, 1]) box(a, .12, .55, .7, velvet, s * .36, .5, 0); a.position.set(X(x), 0, z); a.rotation.y = ry; G.add(a); flatten(G, a); }
      lamp(L, G, X(3.0), 1.2, 7.4, { r: .03, i: .6, d: 4, c: '#ffd890', hex: 0xffd090 }); cyl(G, .07, .09, .05, gold, X(2.75), .81, 7.25, 10); candle(X(2.75), .83, 7.25, 1.3);
      // ---------- оранжерея: стекло, пальмы, лунный свет ----------
      const OX0 = 8, OX1 = 18, OZ0 = -7, OZ1 = 7, OH = 5;
      box(G, OX1 - OX0, .06, OZ1 - OZ0, terra, X((OX0 + OX1) / 2), 0, 0);
      for (const z of [OZ0, OZ1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(OX1 - OX0, OH), glassM); p.position.set(X((OX0 + OX1) / 2), OH / 2, z); G.add(p); for (let x = OX0; x <= OX1; x += 1.25) box(G, .07, OH, .07, ironM, X(x), OH / 2, z); for (const y of [.5, 2.5, OH]) box(G, OX1 - OX0, .06, .06, ironM, X((OX0 + OX1) / 2), y, z); box(G, OX1 - OX0, .5, .2, stoneM, X((OX0 + OX1) / 2), .25, z); }
      { const p = new THREE.Mesh(new THREE.PlaneGeometry(OZ1 - OZ0, OH), glassM); p.position.set(X(OX1), OH / 2, 0); p.rotation.y = Math.PI / 2; G.add(p); for (let z = OZ0; z <= OZ1; z += 1.25) box(G, .07, OH, .07, ironM, X(OX1), OH / 2, z); for (const y of [.5, 2.5, OH]) box(G, .06, .06, OZ1 - OZ0, ironM, X(OX1), y, 0); box(G, .2, .5, OZ1 - OZ0, stoneM, X(OX1), .25, 0); }
      // стеклянная двускатная крыша
      for (const s of [-1, 1]) { const len = Math.hypot(7, 1.8), a = Math.atan2(1.8, 7); const p = new THREE.Mesh(new THREE.PlaneGeometry(OX1 - OX0, len), glassM); p.position.set(X((OX0 + OX1) / 2), OH + .9, s * 3.5); p.rotation.x = -Math.PI / 2 + s * a; G.add(p); for (let x = OX0; x <= OX1; x += 1.25) { const r = box(G, .06, .06, len, ironM, X(x), OH + .9, s * 3.5); r.rotation.x = s * a; } }
      box(G, OX1 - OX0, .1, .12, ironM, X((OX0 + OX1) / 2), OH + 1.8, 0);
      wallX(G, X(8), OZ0, -6, 0, OH, damask, null, .2); wallX(G, X(8), 6, OZ1, 0, OH, damask, null, .2); 
      // кадки с пальмами
      const leafM = M('#1e3a22', { r: .7, side: 1 }), trunkM = M('#4a3a24', { r: .9 }), tubM = M('#3a2a1a', { r: .6 });
      L.tubs = [[10, -5], [13, -5], [16.2, -4.6], [10, 4.6], [13, 4.6], [16.2, 4.2], [16.5, 0]];
      L.tubs.forEach(([x, z], i) => { cyl(G, .42, .34, .6, tubM, X(x), .3, z, 12); cyl(G, .44, .44, .05, goldD, X(x), .6, z, 12); const h = rnd(2.2, 3.4); const tr = cyl(G, .07, .11, h, trunkM, X(x), .6 + h / 2, z, 8); tr.rotation.z = rnd(-.08, .08);
        for (let k = 0; k < 14; k++) { const up = k % 2, a = k / 14 * Math.PI * 2 + rnd(-.2, .2), len = up ? 1.1 : 1.7; const lf = new THREE.Mesh(new THREE.PlaneGeometry(.3, len, 1, 4), leafM);
          const pa = lf.geometry.attributes.position; for (let v = 0; v < pa.count; v++) { const yy = pa.getY(v) / len + .5; pa.setZ(v, -yy * yy * (up ? .35 : .7)); pa.setX(v, pa.getX(v) * (1 - yy * .7)); } lf.geometry.computeVertexNormals();
          lf.geometry.translate(0, len / 2, 0); lf.rotation.order = 'YXZ'; lf.rotation.set(up ? -.5 : -1.05, -a + Math.PI / 2, 0); lf.position.set(X(x), .6 + h - .05, z); G.add(lf); }
        L.blockers.push({ x: X(x), z, lv: 0 }); });
      L.gloves = box(G, .16, .04, .12, M('#f4f0e8', { r: .8 }), X(13.1), .64, 4.45);
      // скамья и фонтанчик
      box(G, 1.6, .08, .5, M('#d8d0c4', { r: .4 }), X(13), .45, 0); for (const dx of [-.6, .6]) box(G, .12, .4, .4, M('#d8d0c4', { r: .4 }), X(13 + dx), .22, 0);
      cyl(G, .9, 1.0, .5, M('#c8c0b4', { r: .4 }), X(10.6), .25, 0, 20); cyl(G, .8, .8, .02, M('#1a2a3a', { r: .05, m: .5 }), X(10.6), .5, 0, 20); cyl(G, .1, .14, 1.0, M('#c8c0b4', { r: .4 }), X(10.6), .8, 0, 10); L.blockers.push({ x: X(10.6), z: 0, lv: 0, r: 1 }, { x: X(10.6), z: .6, lv: 0 }, { x: X(10.6), z: -.6, lv: 0 });
      for (const [x, z] of [[11.5, -3], [15, 3], [15, -3]]) lamp(L, G, X(x), 3.6, z, { r: .01, i: .55, d: 7, c: '#9ab0ff', hex: 0x8aa0e0 });
      // ---------- гостевое крыло ----------
      room(-11, -8, -6, 6, 3.2, damask, parquet, plaster, { W: [[-3, .9], [3, .9]], E: [[0, 1.6]] }, 'E');
      room(-18, -11, -6, 0, 3.2, M('#3a4a5a', { r: .8 }), parquet, plaster, { E: [[-3, .9]] }, 'E'); room(-18, -11, 0, 6, 3.2, M('#4a3a4a', { r: .8 }), parquet, plaster, { E: [[3, .9]] }, 'EN');
      for (const z of [-4.5, 0, 4.5]) sconce(X(-10.85), z, Math.PI / 2, 2.2);
      for (const z0 of [-6, 0]) { const cz = z0 + 3; box(G, 2.0, .5, 2.4, velvet, X(-16.5), .35, cz); box(G, 2.0, .3, .3, M('#efe6d8', { r: .8 }), X(-16.5), .7, cz - 1); for (const [dx, dz] of [[-.95, -1.15], [.95, -1.15], [-.95, 1.15], [.95, 1.15]]) cyl(G, .04, .04, 2.4, woodD, X(-16.5 + dx), 1.2, cz + dz, 8); box(G, 2.1, .1, 2.5, velvet, X(-16.5), 2.4, cz);
        box(G, 1.2, 2.0, .6, woodD, X(-13), 1.0, z0 + .4); lamp(L, G, X(-14.5), 2.6, cz, { r: .05, i: .5, d: 4.5, c: '#ffc070', hex: 0xffb860 }); L.blockers.push({ x: X(-16.5), z: cz, lv: 0, r: 1.2 }, { x: X(-16.5), z: cz - .8, lv: 0 }, { x: X(-16.5), z: cz + .8, lv: 0 }); }
      { const t = texSign('Светозаровы', 'барон и баронесса', { bg: '#2a1a12', fg: '#e6c27a', size: 40 }); const p = new THREE.Mesh(new THREE.PlaneGeometry(.5, .16), M('#ffffff', { map: t, r: .6 })); p.position.set(X(-10.88), 1.6, -3.7); p.rotation.y = Math.PI / 2; G.add(p); }
      // ---------- кухня изгнанников ----------
      room(-8, 1, -12, -6, 3.2, stoneM, stoneM, M('#3a3028', { r: .9 }), { S: [[-4, 1.0]] }, 'S');
      box(G, 2.4, 1.4, 1.0, M('#6a5a4a', { r: .9 }), X(-6.5), .7, -11.4); box(G, 1.4, .8, .3, black, X(-6.5), .5, -10.88);
      L.fireK = box(G, 1.0, .4, .04, M('#ff8a3a', { e: '#ff6a1a', ei: 2 }), X(-6.5), .35, -10.85);
      lamp(L, G, X(-6.5), .9, -10.4, { r: .01, i: .9, d: 6, c: '#ff9a4a', hex: 0xff8a3a });
      box(G, 3.0, .08, 1.0, M('#8a6a4a', { r: .7 }), X(-3), .82, -8.6); for (const dx of [-1.4, 1.4]) for (const dz of [-.4, .4]) box(G, .08, .8, .08, woodD, X(-3 + dx), .4, -8.6 + dz);
      for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.14, .12, .1, 14), M('#a8683a', { m: .7, r: .35 })); p.rotation.x = Math.PI / 2; p.position.set(X(-5.2 + i * .5), 1.9, -11.85); G.add(p); }
      for (const [x, z] of [[-1, -11.3], [-.3, -11.3]]) cyl(G, .32, .32, .9, woodD, X(x), .45, z, 12);
      for (let i = 0; i < 8; i++) cyl(G, .08, .1, .06, M('#d8d0c0', { r: .4 }), X(-4 + i * .3 + rnd(-.05, .05)), .87, -8.6 + rnd(-.3, .3), 12);
      lamp(L, G, X(-3), 2.6, -8.6, { r: .06, i: .6, d: 5, c: '#ffc070', hex: 0xffb860, hang: .3 });
      // ---------- вестибюль: парадная лестница, портрет мастера, двери в ночь ----------
      room(1, 8, -12, -6, 3.6, damask, marble, plaster, { S: [[5, 2.0]], N: [[4.5, 1.6]] }, 'SW');
      for (let k = 0; k < 10; k++) box(G, 2.0, .18, .34, M('#e8e2d8', { r: .3 }), X(2.4), .09 + k * .18, -6.6 - k * .34); for (let k = 0; k < 10; k++) box(G, 2.06, .02, .36, velvet, X(2.4), .19 + k * .18, -6.6 - k * .34);
      L.blockers.push({ x: X(2.0), z: -8, lv: 0 }, { x: X(2.8), z: -8, lv: 0 }, { x: X(2.0), z: -9.2, lv: 0 }, { x: X(2.8), z: -9.2, lv: 0 }, { x: X(2.0), z: -7, lv: 0 }, { x: X(2.8), z: -7, lv: 0 });
      { const t = canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#20180e'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8b898'; g.beginPath(); g.ellipse(w / 2, h * .32, 36, 46, 0, 0, 7); g.fill(); g.fillStyle = '#c8c4bc'; g.beginPath(); g.ellipse(w / 2, h * .42, 34, 30, 0, 0, Math.PI); g.fill(); g.fillStyle = '#3a2a1a'; g.beginPath(); g.moveTo(w / 2 - 90, h); g.quadraticCurveTo(w / 2, h * .48, w / 2 + 90, h); g.fill(); g.fillStyle = '#e8c070'; g.beginPath(); g.arc(w / 2, h * .66, 9, 0, 7); g.fill(); g.strokeStyle = '#c0c0c0'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * .72, h * .7); g.lineTo(w * .82, h * .95); g.moveTo(w * .72, h * .7); g.lineTo(w * .64, h * .95); g.stroke(); noise(g, w, h, 3000, .08); });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), M('#ffffff', { map: t, r: .7 })); p.position.set(X(1.14), 2.3, -9.2); p.rotation.y = Math.PI / 2; G.add(p); box(G, .06, 1.46, 1.16, gold, X(1.1), 2.3, -9.2); }
      for (const x of [3.6, 5.4]) { const d = box(G, .8, 2.4, .08, woodR, X(x), 1.2, -12.4); d.rotation.y = x < 4.5 ? .9 : -.9; d.position.x = X(x + (x < 4.5 ? -.35 : .35)); }
      lamp(L, G, X(4.5), 3.1, -9, { r: .1, i: .8, d: 7, c: '#ffd0a0', hex: 0xffcf98, hang: .3 }); sconce(X(7.85), -9, -Math.PI / 2, 2.3);
      // снаружи у дверей: карета конвоя
      { const c = new THREE.Group(); box(c, 2.2, 1.5, 1.4, black, 0, 1.3, 0); box(c, 2.3, .1, 1.5, goldD, 0, 2.1, 0); for (const s of [-1, 1]) for (const dx of [-.8, .8]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.42, .05, 6, 16), black); w.position.set(dx, .45, s * .75); c.add(w); } const lilyT = canvasTex(64, 64, (g) => { g.fillStyle = '#141014'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#efe8d8'; g.beginPath(); g.moveTo(32, 8); g.quadraticCurveTo(44, 30, 32, 54); g.quadraticCurveTo(20, 30, 32, 8); g.fill(); g.beginPath(); g.ellipse(32, 32, 8, 5, 0, 0, 7); g.fillStyle = '#1a3a6a'; g.fill(); });
        const l = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), M('#ffffff', { map: lilyT })); l.position.set(0, 1.4, .71); c.add(l); box(c, .4, .3, .02, M('#3a3a3a', { m: .6 }), .6, 1.6, .71); c.position.set(X(4.5), 0, -16.2); c.rotation.y = Math.PI; G.add(c); flatten(G, c); }
      lamp(L, G, X(4.5), 2.4, -13, { r: .06, i: .6, d: 6, c: '#ffc070', hex: 0xffb860 });
      // тело Мытаря (лежит на ковре, после 23:40)
      L.mytarBody = makeHuman({ pose: 'stand', coat: '#2a3a2a', pants: '#2a2a2a', shoes: true, lapels: true, hair: '#5a4a3a', hairStyle: 'side', skin: '#d8c0b0', beard: 'trim', beardC: '#5a4a3a' });
      L.mytarBody.sleep = true; L.mytarBody.root.rotation.order = 'YXZ'; L.mytarBody.root.rotation.set(-Math.PI / 2, 2.2, 0); L.mytarBody.root.position.set(X(4.4), .14, 9.4); G.add(L.mytarBody.root);
      // ---------- точки осмотра ----------
      const I = (id, x, z, r) => INSPECT.push({ id, x: X(x), z, r: r || 1.1, loc: 'ball', lv: 0 });
      I('bodyB', 4.0, 8.3, 1.4); I('fireplace', 6.6, 8.6, 1.0); I('palmTub', 13.0, 3.6, 1.0); I('seating', -6.6, 7.4, 1.0);
      I('karrGuest', -10.3, -3.4, .8); I('guestDoor', -10.3, -2.5, .8); I('chandelier', 0, 1.2, 1.6); I('portraitM', 1.8, -9.2, 1.1); I('forestWin', 17.2, 0, 1.4); I('cart', 4.5, -14.4, 1.4);
      // ---------- люди ----------
      const N = (id, place, look, opt) => addNPC(id, place, look, Object.assign({ loc: 'ball', lv: 0, fy: 0 }, opt || {}));
      const sit = (x, z, face, sy) => ({ x: X(x), z, face, seatY: sy || .45, pose: 'sit' });
      const stand = (x, z, face) => standAt(X(x), z, face);
      const LK = {
        margaret: { female: true, coat: '#1a0e12', skirt: '#140a0e', hair: '#141012', hairStyle: 'bun', skin: '#f4e4e0', lips: '#8a1420', eyeC: '#8a1a24', gloves: true, stockings: true },
        svetozarov: { coat: '#e8e2d4', lapels: true, vest: true, tie: true, pants: '#d8d2c4', shoes: true, hair: '#c8b890', hairStyle: 'side', beard: 'moust', beardC: '#c8b890', skin: '#eec8ae', gloves: true, mask: 'harlequin' },
        irina: { female: true, coat: '#3a4a6a', skirt: '#2a3a5a', hair: '#8a5a30', hairStyle: 'curly', skin: '#f2d4c0', lips: '#b05a5a', armPose: 'lap' },
        sedoy: { coat: '#1e1e26', pants: '#1e1e26', boots: true, buttons: true, belt: '#c9a050', hat: 'police', hatC: '#1a1a20', hair: '#c8c4bc', hairStyle: 'buzz', beard: 'moust', beardC: '#d8d4cc', skin: '#dcb090', handsBehind: true },
        marfa: { female: true, coat: '#5a4a3a', skirt: '#3a3028', apron: true, hat: 'kerchief', hatC: '#8a7a6a', hair: '#6a5a4a', skin: '#e8b898' },
        yan: { coat: '#2a1a24', vest: true, pants: '#1a1a1a', shoes: true, hair: '#2a1a12', hairStyle: 'messy', skin: '#f0d0b8' },
        mytar: { coat: '#2a3a2a', lapels: true, pants: '#2a2a2a', shoes: true, hair: '#5a4a3a', hairStyle: 'side', skin: '#e0c4b0', beard: 'trim', beardC: '#5a4a3a', glasses: true, prop: 'book' },
        convoy: { coat: '#1e1e26', pants: '#1e1e26', boots: true, buttons: true, belt: '#2a2420', hat: 'police', hatC: '#1a1a20', skin: '#e0b890', hair: '#3a2a20', handsBehind: true }
      };
      L.np = {
        margaret: N('margaret', stand(4.2, 2.4, '-x'), LK.margaret),
        margaretD: N('margaret', stand(.6, -.6, '+x'), LK.margaret),
        margaretG: N('margaret', stand(-6.6, -3.4, '+x'), LK.margaret),
        svetozarov: N('svetozarov', stand(-2.2, 3.0, '+x'), LK.svetozarov),
        svetozarovL: N('svetozarov', stand(2.4, 8.2, '+x'), LK.svetozarov),
        svetozarovO: N('svetozarov', stand(12.6, 3.4, '+z'), LK.svetozarov),
        irina: N('irina', sit(1.6, 5.35, '-z', .5), LK.irina),
        irinaR: N('irina', sit(-13.8, -1.2, '-z', .5), LK.irina),
        sedoy: N('sedoy', stand(5.6, -10.6, '-z'), LK.sedoy),
        sedoyH: N('sedoy', stand(-5.4, -2.0, '-x'), LK.sedoy),
        marfa: N('marfa', stand(-4.6, -9.4, '+z'), LK.marfa),
        yan: N('yan', stand(.5, -5.25, '+z'), LK.yan),
        mytar: N('mytar', sit(3.0, 6.75, '+z', .5), LK.mytar)
      };
      L.np.yan.st.root.position.y = 1.7;
      box(G, .5, .46, .5, woodR, X(3.0), .23, 6.75);
      // танцующие маски и прочие гости
      let sd = 900; const XN = (place, look, bark, name) => N('x' + (sd++), place, look, { bark, name });
      const masks = [['#3a1a2a', '#2a1a2a', true], ['#1a2a4a', '#1a1a2a', false], ['#4a3a1a', '#3a2a1a', true], ['#2a1a1a', '#1a1a1a', false], ['#5a1a1a', '#3a0a0a', true], ['#1a3a2a', '#1a2a1a', false]];
      L.dancers = [];
      [[-4, -1.6, '+x'], [-3.2, -1.6, '-x'], [3.6, -2.2, '+x'], [4.4, -2.2, '-x'], [-1.2, 1.8, '+x'], [-.4, 1.8, '-x']].forEach(([x, z, f], i) => { const [c, s, fem] = masks[i]; const look = fem ? { female: true, coat: c, skirt: s, hair: ['#2a1a12', '#8a5a30', '#141010'][i % 3], hairStyle: 'bun', skin: '#f0d0b8', mask: 'harlequin' } : { coat: c, lapels: true, pants: s, shoes: true, hair: '#2a2a2a', hairStyle: 'side', skin: '#e8c0a0', mask: 'harlequin' };
        const n = XN(stand(x, z, f), look, 'masked', fem ? 'Дама в маске' : 'Кавалер в маске'); n.cx = X(i % 2 ? x - .4 : x + .4); n.cz = z; n.ph = Math.floor(i / 2) * 2.1; L.dancers.push(n); });
      L.extras = [XN(stand(-2.2, -9.6, '-z'), { coat: '#4a3a2a', pants: '#3a3028', hair: '#6a5a4a', hairStyle: 'messy', beard: 'full', beardC: '#6a5a4a', skin: '#d8a888', apron: true }, 'exile', 'Изгнанник'),
        XN(sit(-1.8, -8.0, '+z'), { female: true, coat: '#5a4a3a', skirt: '#3a3028', hat: 'kerchief', hatC: '#6a5a4a', hair: '#4a3a2a', skin: '#e8b898' }, 'exile', 'Изгнанница'),
        XN(stand(3.6, -13.2, '+z'), LK.convoy, 'convoy', 'Конвойный'), XN(stand(5.4, -13.2, '+z'), LK.convoy, 'convoy', 'Конвойный')];
      L.guards = [XN(stand(-6.4, -4.4, '+x'), LK.convoy, 'convoy', 'Конвойный'), XN(stand(-6.4, -2.4, '+x'), LK.convoy, 'convoy', 'Конвойный')];
      Object.values(L.np).forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: 0 }));
      L.extras.concat(L.guards).forEach(n => L.blockers.push({ x: n.x, z: n.z, k: n, lv: 0 }));
      // мебель-препятствия
      [[-7.5, -3.4], [-7.5, -2.6], [-7.5, -4.2], [3.0, 7.4], [3.5, 7.4], [-7.5, 11.4], [-6.5, -11.2], [-3, -8.6], [-4, -8.6], [-2, -8.6], [-1, -11.3], [-.3, -11.3], [-2, -4.65], [3, -4.65], [13, 0], [12.4, 0], [13.6, 0], [-13, -5.6], [-13, .4]].forEach(([x, z]) => L.blockers.push({ x: X(x), z, lv: 0 }));
      L.lamps.forEach(l => { l.i0 = l.i; });
      worldUV(G); L.merged = mergeStatic(G, L, extra);
      // ---------- проходимые области ----------
      const W = [
        [-7.85, 7.85, -4.45, 5.75], [-7.85, -2.35, -5.85, -4.45], [3.35, 7.85, -5.85, -4.45],
        [-8.4, -7.6, -.75, .75], [7.6, 8.4, -.95, .95], [-4.75, -3.25, 5.6, 6.4], [4.35, 5.65, 5.6, 6.4], [-4.45, -3.55, -6.4, -5.6], [4.05, 5.95, -6.4, -5.6],
        [-7.85, .85, 6.15, 8.25], [-7.85, .85, 9.75, 11.85], [-7.85, -6.25, 6.15, 11.85], [-.65, .85, 6.15, 11.85],
        [1.15, 7.85, 6.15, 11.85],
        [8.15, 17.75, -6.75, 6.75],
        [-10.85, -8.15, -5.85, 5.85], [-11.4, -10.6, -3.4, -2.6], [-11.4, -10.6, 2.6, 3.4], [-17.85, -11.15, -5.85, -.15], [-17.85, -11.15, .15, 5.85],
        [-7.85, .85, -11.85, -6.15], [1.15, 7.85, -11.85, -6.15], [3.75, 5.25, -12.5, -11.6], [2.2, 6.8, -15.2, -12.3]
      ];
      L.walk = W.map(r => [X(r[0]), X(r[1]), r[2], r[3], 0]);
      L.zones = [[X(-19), X(-8), 'Гостевое крыло', 0], [X(-8), X(8), 'Замок Чернолесье', 0], [X(8), X(19), 'Оранжерея', 0]];
    },
    enter(L) {
      if (!S.f.k_started) { S.f.k_started = true; S.time = -120; resetBall(L); startPos(); setTimeout(() => startScene('ballIntro'), 500); }
      else startPos();
    },
    tick(L, dt) {
      const busy = D.on || endEl.classList.contains('on') || noteEl.classList.contains('on') || sandOn || ['fight', 'cards', 'band', 'keypad'].some(id => document.getElementById(id).classList.contains('on'));
      const t = performance.now() / 1000, f = S.f;
      L.flameM.emissiveIntensity = 2.6 + Math.sin(t * 13) * .35 + Math.sin(t * 7.3) * .25;
      L.fireB.material.emissiveIntensity = 2 + Math.sin(t * 8) * .5; L.fireL.material.emissiveIntensity = 2 + Math.sin(t * 7 + 1) * .5; L.fireK.material.emissiveIntensity = 1.8 + Math.sin(t * 9) * .4;
      
      // вальс: пары медленно кружат на месте
      const waltz = !f.k_dead || f.k_solved;
      L.dancers.forEach((n, i) => { if (!waltz) return; const a = t * .9 + n.ph, r = .4, s = i % 2 ? 1 : -1; const x = n.cx + Math.cos(a) * r * s, z = n.cz + Math.sin(a) * r * s; n.st.root.position.x = x; n.st.root.position.z = z; n.st.root.rotation.y = -a + (s > 0 ? Math.PI : 0) + Math.PI / 2; });
      if (f.k_solved) return;
      if (!busy) S.time += dt / 3;
      const tm = S.time, np = L.np, R = (a, b) => tm >= a && tm < b;
      if (tm >= 10 && !f.k_dead && !busy) startScene('ballMurder');
      // кто где
      const dance = R(-30, 10);
      np.margaret.hidden = dance || !!f.k_guard; np.margaretD.hidden = !dance; np.margaretG.hidden = !f.k_guard;
      L.guards.forEach(g => { g.hidden = !f.k_guard; });
      np.svetozarov.hidden = R(-45, -6); np.svetozarovL.hidden = !R(-45, -18); np.svetozarovO.hidden = !R(-12, -6);
      np.mytar.hidden = tm >= -20; L.mytarBody.root.visible = tm >= -20; L.blood.visible = tm >= -20; L.ledger.visible = tm < -20; L.page.visible = tm >= -20 && !f.pageDebt;
      L.gloves.visible = tm >= -10 && !f.gloveBlood;
      np.irina.hidden = tm >= 30; np.irinaR.hidden = tm < 30;
      np.sedoy.hidden = !!f.k_dead; np.sedoyH.hidden = !f.k_dead;
      if (tm >= 300 && !f.k_solved && !busy) startScene('ballDawn');
    }
  };
  function startPos() { place(CX + 4.8, -5.0, Math.PI, 0); }
  function resetBall(L) {
    for (const k in S.f) if (k.startsWith('k_') && !['k_solved', 'k_started', 'k_wrong'].includes(k)) delete S.f[k];
    S.f.k_started = true;
    NPCS.forEach(n => { if (n.loc === 'ball') delete S.f['met_' + n.id]; });
    derive();
  }

  // ---------- вычисляемые флаги ----------
  const d0 = window.deriveLoc;
  window.deriveLoc = function () {
    d0 && d0();
    const f = S.f;
    const notVamp = f.notBloodless || f.palataLieB || f.margBlood || f.woundsMetal;
    const glove = f.gloveBlood || f.margGlove || f.gloveSwap;
    const how = f.forkMarfa || f.seatPlan || f.pageDebt || f.irinaDebt || f.karrBaron;
    f.k_ready = !!(notVamp && glove && how && f.k_dead);
    if (!f.palataLieB && f.notBloodless && STORY.clues.palataLieB) setTimeout(() => { if (!S.f.palataLieB) { addClue('palataLieB'); toastMsg = 'Ложь Палаты: досье врёт. Улика-опровержение — в блокноте.'; toastT = 4; } }, 900);
  };

  // ---------- действия ----------
  const la0 = window.locAction;
  window.locAction = function (a, def) {
    const tm = S.time, f = S.f;
    const done = () => { derive(); updateQuest(); };
    if (a === 'toBall') { startScene('toBall'); return true; }
    if (a === 'goBall') { closeDialog(); enterLoc('ball'); return true; }
    if (a === 'ballFinale') { S.f.ballDone = true; S.f.margOpen = true; startScene('ballFinale'); return true; }
    if (a === 'ballWrongFinale') { S.f.ballDone = true; S.f.margCaptive = true; startScene('ballWrongFinale'); return true; }
    if (a === 'ballBody') {
      const Ls = [[null, null, 'Лукьян Мытарь лежит на ковре лицом вверх. На шее — две ранки, как от клыков.'], [null, null, 'Но под воротником и на ковре — тёмная лужа. Кровь пропитала ворс до самого паркета.']];
      if (S.hero === 'miron') Ls.push(['det', null, 'Ранки ровные, одной глубины, на одинаковом расстоянии. Так режет металл, а не зуб. И кровищи — полведра. Вампир бы не оставил.']);
      else Ls.push(['det', null, 'Обескровлен? Да тут крови больше, чем в ином живом. Досье врёт.']);
      startSolo(Ls, () => { addClue('notBloodless'); if (S.hero === 'miron') { addClue('woundsMetal'); showBuff('Мирон: глаз могильщика'); } done(); });
      S.time += 3; return true;
    }
    if (a === 'ballFire') {
      if (tm < -20 || f.pageDebt) { startSolo([[null, null, 'В камине трещат берёзовые поленья. Тепло и пахнет смолой.']]); S.time += 1; return true; }
      const Ls = [[null, null, 'В золе — обугленные листы толстой книги. Один угол уцелел: столбцы цифр, обрывки фамилий.']];
      if (S.hero === 'tibo') Ls.push(['det', null, 'Долговая книга. «…зарову А.» — Светозарову. Сорок тысяч крон, пени, «к взысканию с лишением титула». Хорошая сумма. Я бы за такую тоже кого-нибудь… нет, не я.']);
      else Ls.push([null, null, 'Читается: «…зарову А. … сорок тысяч крон … к взысканию с лишением титула».']);
      startSolo(Ls, () => { addClue('pageDebt'); if (S.hero === 'tibo') showBuff('Тибо читает долги'); done(); });
      S.time += 2; return true;
    }
    if (a === 'ballTub') {
      if (tm < -10 || f.gloveBlood) { startSolo([[null, null, 'Кадка с пальмой. Влажная земля, опавший лист.']]); S.time += 1; return true; }
      startSolo([[null, null, 'Земля в кадке разрыта и наспех примята. Под ней — белые перчатки с вышитым гербом.'], [null, null, 'Герб Светозаровых. На правой перчатке, у большого пальца, — тёмная капля.']], () => { addClue('gloveBlood'); done(); });
      S.time += 2; return true;
    }
    if (a === 'ballSeat') {
      startSolo([[null, null, 'План рассадки: барон Светозаров — седьмой слева.'], [null, null, 'Ты идёшь к столу. У седьмого прибора слева — нож, тарелка… и пустое место там, где лежала двузубая вилка с вензелем графини.']], () => { addClue('seatPlan'); done(); });
      S.time += 2; return true;
    }
    if (a === 'ballRollback') {
      closeDialog(); sandOn = true; sandEl.classList.add('on'); window.SFX && SFX.play('sand');
      setTimeout(() => { S.loops++; resetBall(LOC.ball); S.time = -120; startPos(); sandEl.classList.remove('on'); sandOn = false; updateQuest(); updateInv(); startScene('ballLoop'); }, 2600);
      return true;
    }
    return la0 ? la0(a, def) : false;
  };

  // кнопка «Завершить дело» для бала
  const fin0 = window.finishLocation;
  window.finishLocation = function () {
    if (WORLD.cur !== 'ball') return fin0 && fin0();
    if (S.f.k_solved) { toastMsg = 'Здесь нечего завершать.'; toastT = 2.5; return; }
    if (D.on) closeDialog();
    ['notBloodless', 'palataLieB', 'gloveBlood', 'yanSaw', 'forkMarfa', 'pageDebt', 'margDance', 'lilyConvoy'].forEach(id => { S.f[id] = true; if (!S.clues.includes(id)) S.clues.push(id); });
    if (S.time < 40) S.time = 40;
    S.f.k_dead = true; derive(); updateQuest();
    const L = LOC.ball; L.tick(L, 0);
    const sv = L.np.svetozarov; place(sv.x + 1.1, sv.z, Math.PI / 2, 0);
    P.yaw = Math.atan2(-(sv.x - P.x), -(sv.z - P.z));
    showBuff('Все улики собраны — обвини барона Светозарова', false, S.hero);
    setTimeout(() => { if (!D.on) startDialog(sv); }, 450);
  };

  // ---------- вокзал: чёрные конверты, вход в Чернолесье, «Тень на вокзале» ----------
  const SX = 300, ST = STORY.locs.station;
  const envN = () => ['env1', 'env2', 'env3'].filter(k => S.f[k]).length;
  ST.leads.unshift(['env1&env2&env3&!ballDone', 'Три чёрных конверта — приглашение. Туман в конце первой платформы почернел.', 'insp:ballGate'],
    ['act2done&letDone&!env1', 'На лавке лежит чёрный конверт.', 'insp:envB1'], ['golosDone&!env3', 'У кассы — ещё один чёрный конверт.', 'insp:envB3']);
  const envGet = (k) => () => { S.f[k] = true; const n = envN(); toastMsg = n < 3 ? 'Чёрный конверт с печатью: лилия, перечёркнутая шипом. Конвертов: ' + n + ' из 3.' : 'Третий чёрный конверт. Сургуч на трёх печатях сплавился в одну: приглашение.'; toastT = 4.5; updateQuest(); };
  Object.assign(STORY.inspect, {
    envB1: { label: 'чёрный конверт на лавке', if: 'act2done&letDone&!env1', lines: [[null, null, 'На краю лавки — чёрный конверт. Сургуч: лилия, перечёркнутая шипом. Внутри — пустая карточка с вензелем «М».']], go: 'envGet1' },
    envB3: { label: 'чёрный конверт у кассы', if: 'golosDone&!env3', lines: [[null, null, 'На подоконнике у закрытой кассы — чёрный конверт. Такой же сургуч. Кто-то знает, где тебя искать.']], go: 'envGet3' },
    envP: { label: 'мешок с почтой', if: '!env2', lines: [[null, null, 'Почтовый мешок для материка. Среди писем жёнам и сводок — чёрный конверт без адреса. Сургуч: лилия, перечёркнутая шипом.'], ['det', null, 'Как он сюда попал? Через пургу, на льдину?']], go: 'envGet2' },
    ballGate: { label: 'чёрный туман · Чернолесье', if: 'env1&env2&env3&!ballDone', lines: [], go: 'toBall' }
  });
  INSPECT.push({ id: 'envB1', x: SX + 2.2, z: 6.3, r: .9, loc: 'station' }, { id: 'envB3', x: SX + 6.2, z: 6.3, r: 1.0, loc: 'station' }, { id: 'ballGate', x: SX - 13.0, z: 3.6, r: 1.5, loc: 'station' });
  INSPECT.push({ id: 'envP', x: 1200 + 4.9, z: .8, r: .8, loc: 'polar', lv: 0 });
  const la1 = window.locAction;
  window.locAction = function (a, def) {
    if (a === 'envGet1') { envGet('env1')(); return true; }
    if (a === 'envGet2') { envGet('env2')(); return true; }
    if (a === 'envGet3') { envGet('env3')(); return true; }
    return la1(a, def);
  };
  Object.assign(STORY.scenes, {
    margTaken: { start: 'm1', nodes: { m1: { bg: 'none', lines: [['miron', 'sad', 'Я видел, как её увозили. Изгнанники бежали за каретой до самого леса.'], ['det', null, 'Её забрали Часы. Если она где-то и есть — то в Ясноземье. В подвале крепости ордена.']], set: ['takenSeen'], end: true } } }
  });
  const stL = LOC.station, stEnter = stL.enter, stTick = stL.tick;
  stL.enter = function (L) {
    stEnter.call(this, L);
    // конверты и чёрный туман
    if (!L.envMesh) {
      const envM = M('#141014', { r: .6 }), seal = M('#7a1420', { r: .4 });
      L.envMesh = [[SX + 2.2, .5, 6.72, 'env1'], [SX + 6.2, .95, 7.2, 'env3']].map(([x, y, z, k]) => { const g = new THREE.Group(); const e = new THREE.Mesh(new THREE.BoxGeometry(.24, .01, .16), envM); g.add(e); const s = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .012, 10), seal); s.position.y = .01; g.add(s); g.position.set(x, y, z); g.rotation.y = .3; L.group.add(g); g.userData.k = k; return g; });
      const ft = canvasTex(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(10,6,12,0)'); gr.addColorStop(.4, 'rgba(10,6,12,.85)'); gr.addColorStop(1, 'rgba(10,6,12,.95)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      L.blackFog = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, side: THREE.DoubleSide })); L.blackFog.position.set(SX - 13.4, 2, 3.6); L.blackFog.rotation.y = Math.PI / 2; L.group.add(L.blackFog);
    }
    if ((S.f.margOpen || S.f.margFreed) && !L.margS) { L.margS = addNPC('margaret', { x: SX + 2.35, z: 6.72, face: '-z', seatY: .45, pose: 'sit' }, { female: true, coat: '#1a0e12', skirt: '#140a0e', hair: '#141012', hairStyle: 'bun', skin: '#f4e4e0', lips: '#8a1420', armPose: 'lap' }, { loc: 'station' }); }
    if (S.f.ballDone && S.f.margOpen && !S.f.tenDone) setTimeout(() => startScene('tenShadow'), 700);
    else if (S.f.ballDone && S.f.margCaptive && !S.f.takenSeen) setTimeout(() => startScene('margTaken'), 700);
  };
  stL.tick = function (L, dt) {
    stTick.call(this, L, dt);
    if (L.envMesh) L.envMesh.forEach(g => { const k = g.userData.k; g.visible = k === 'env1' ? !!(S.f.act2done && S.f.letDone && !S.f.env1) : !!(S.f.golosDone && !S.f.env3); });
    if (L.blackFog) { const on = !!(S.f.env1 && S.f.env2 && S.f.env3 && !S.f.ballDone); L.blackFog.visible = on; if (on) L.blackFog.material.opacity = .75 + Math.sin(performance.now() / 700) * .2; }
    // «Тень на вокзале»: пока графиня на вокзале, фонари чуть тусклее
    if (S.f.margOpen && L.lamps) L.lamps.forEach(l => { if (l.i0 === undefined) l.i0 = l.i; l.i = l.i0 * .8; });
  };

  // Shift+F6 — сразу на бал (для проверки)
  document.addEventListener('keydown', e => {
    if (!e.shiftKey || e.code !== 'F6') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!S.hero) { S.f['hero:miron'] = true; S.hero = 'miron'; }
    if (D.on) closeDialog();
    gameOn = true; Object.assign(S.f, { solved: true, act1done: true, konfDone: true, act2done: true, letDone: true, letSeen: true, env1: true, env2: true, env3: true });
    enterLoc('ball');
  }, true);
})();
