// 3D-пассажиры: фигуры из гладких форм, лица (глаза, веки, нос, рот, брови), причёски, одежда, позы сидя и стоя.
// Анимация: дыхание, моргание, поворот головы к игроку, жесты в разговоре, шаг и бег.
(function () {
  const matCache = {};
  let TEX = {};
  window.npcSetSceneMaterials = function (m) { TEX = m; window.__sceneMats = m; };
  function mat(color, opt) {
    opt = opt || {};
    const key = color + '|' + (opt.tex || '') + '|' + (opt.rough ?? '') + '|' + (opt.metal ?? '') + '|' + (opt.side || '');
    if (matCache[key]) return matCache[key];
    const p = { color: new THREE.Color(color).convertSRGBToLinear(), roughness: opt.rough ?? 0.88, metalness: opt.metal ?? 0 };
    const src = opt.tex && TEX[opt.tex];
    if (src && src.map) { p.map = src.map; if (src.normalMap) p.normalMap = src.normalMap; }
    if (opt.side) p.side = THREE.DoubleSide;
    const m = new THREE.MeshStandardMaterial(p); m.envMapIntensity = .35;
    return (matCache[key] = m);
  }
  const G = {};
  const cache = (k, f) => G[k] || (G[k] = f());
  const cyl = (rt, rb, h, seg) => cache(['c', rt, rb, h, seg].join(), () => { const g = new THREE.CylinderGeometry(rt, rb, h, seg || 14, 1); g.translate(0, -h / 2, 0); return g; });
  const sph = (r, ws, hs, ts, tl) => cache(['s', r, ws, hs, ts, tl].join(), () => new THREE.SphereGeometry(r, ws || 16, hs || 12, 0, Math.PI * 2, ts || 0, tl || Math.PI));
  const boxg = (w, h, d) => cache(['b', w, h, d].join(), () => new THREE.BoxGeometry(w, h, d));
  const lathe = (key, pts, seg) => cache('l' + key, () => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 20));
  function M(g, m, x, y, z, parent) { const o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); parent.add(o); return o; }

  // профиль туловища (радиус, высота) от бёдер до шеи
  const TORSO_M = [[.001, 0], [.15, 0], [.156, .06], [.145, .17], [.152, .26], [.172, .38], [.19, .47], [.17, .53], [.09, .58], [.001, .6]];
  const TORSO_F = [[.001, 0], [.158, 0], [.16, .06], [.12, .18], [.13, .27], [.162, .35], [.158, .42], [.162, .48], [.14, .53], [.08, .58], [.001, .6]];
  const SKIRT = (h, w) => [[.155 * w, h], [.17 * w, h * .8], [.24 * w, h * .35], [.33 * w, .02], [.32 * w, 0]];

  // o: pose sit|stand, female, skin, hair, hairStyle (short|side|bald|bun|curly|long|buzz|none), coat, coatTex, shirt, pants, shoes,
  //    hat, hatC, beard, beardC, skirt, stole, apron, buttons, vest, shirtFront, collar, lapels, heavy, h, seatY, prop, sleep, lean, armPose (lap|knees|crossed|window), lips, glasses
  window.makeHuman = function (o) {
    const root = new THREE.Group();
    const H = o.h || 1, W = o.heavy ? 1.16 : 1, F = !!o.female;
    const sit = o.pose === 'sit';
    const hipY = sit ? (o.seatY || .45) + .04 : .9 * H;
    const skin = mat(o.skin || '#e3b08a', { rough: .55 });
    const coatC = o.coat || '#6d5638';
    const coat = mat(coatC, { tex: o.coatTex });
    const coatDark = mat(new THREE.Color(coatC).multiplyScalar(.72).getStyle(), {});
    const pants = mat(o.pants || '#4a4640', { tex: o.pantsTex });
    const shoes = mat(o.shoes || '#1c1612', { rough: .42 });
    const hairC = (o.hair && o.hair !== 'none') ? o.hair : '#3a2a1e';
    const hairM = mat(hairC, { rough: .8 });
    const shirt = mat(o.shirt || '#e8e2d4');
    const legM = F ? mat(o.stockings || '#3a2c26', { rough: .6 }) : pants;

    // ---- ноги ----
    const legs = [];
    for (const sd of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(sd * .088 * W, hipY, 0); root.add(leg);
      M(cyl(.074 * W, .058, .44 * H, 20), legM, 0, 0, 0, leg); M(sph(.073 * W, 18, 12), legM, 0, 0, 0, leg);
      const knee = new THREE.Group(); knee.position.y = -.44 * H; leg.add(knee);
      M(sph(.06, 12, 10), legM, 0, 0, 0, knee);
      M(cyl(.056, .044, .41 * H, 14), o.boots ? shoes : legM, 0, 0, 0, knee);
      if (!F && !o.boots) M(cyl(.05, .05, .03, 14), pants, 0, -.39 * H, 0, knee);
      const shoe = M(sph(.06, 14, 10), shoes, 0, -.43 * H, .06, knee); shoe.scale.set(.85, .55, 1.9);
      M(boxg(.1, .018, .24), mat('#141010', { rough: .7 }), 0, -.455 * H, .055, knee);
      if (sit) { leg.rotation.x = -Math.PI / 2 + .07; knee.rotation.x = Math.PI / 2 - .07; leg.rotation.y = sd * .07; }
      legs.push({ leg, knee });
    }
    // ---- юбка ----
    if (F) {
      const sk = mat(o.skirt || '#5e1a2a', { tex: o.skirtTex, side: true });
      if (sit) {
        M(boxg(.36 * W, .15, .56), sk, 0, hipY + .02, .23, root);
        M(boxg(.37 * W, hipY - .04, .06), sk, 0, (hipY - .04) / 2 + .05, .5, root);
        M(boxg(.34 * W, .14, .14), sk, 0, hipY, -.04, root);
      } else M(lathe('sk' + W + hipY, SKIRT(hipY + .06, W), 22), sk, 0, 0, 0, root);
    }
    // ---- туловище ----
    const torso = new THREE.Group(); torso.position.y = hipY; root.add(torso);
    if (sit) torso.rotation.x = -(o.lean ?? .08);
    const body = M(lathe((F ? 'tf' : 'tm') + W, (F ? TORSO_F : TORSO_M).map(p => [p[0] * W, p[1]]), 32), coat, 0, 0, 0, torso); body.scale.z = .66;
    if (!F) { const belt = M(cyl(.152 * W, .152 * W, .035, 20), o.belt ? mat(o.belt, { rough: .45 }) : pants, 0, .05, 0, torso); belt.scale.z = .68; }
    // рубашка/жилет спереди, лацканы, пуговицы
    const fz = .118 * W;
    if (o.shirtFront || o.vest) M(boxg(.11, .26, .012), shirt, 0, .42, fz - .006, torso);
    if (o.tie) M(boxg(.03, .2, .01), mat(o.tie), 0, .42, fz + .002, torso);
    if (o.vest) { for (const sd of [-1, 1]) { const v = M(boxg(.08, .3, .012), mat(o.vest), sd * .055, .3, fz - .002, torso); v.rotation.z = sd * -.12; } }
    if (o.lapels || o.shirtFront) for (const sd of [-1, 1]) {
      const lg = new THREE.Shape(); lg.moveTo(0, 0); lg.lineTo(sd * .07, .02); lg.lineTo(sd * .1, .2); lg.lineTo(sd * .02, .22); lg.lineTo(0, 0);
      const lp = M(cache('lap' + sd, () => new THREE.ShapeGeometry(lg)), coatDark, sd * .03, .3, fz + .004, torso); lp.material.side = THREE.DoubleSide;
    }
    if (o.apron) M(boxg(.3 * W, sit ? .3 : .62, .012), mat('#f2efe8'), 0, sit ? .14 : -.06, fz + .01, torso);
    if (o.buttons) for (let i = 0; i < 4; i++) M(sph(.012, 8, 6), mat('#c9a35a', { rough: .3, metal: .85 }), .028, .45 - i * .1, fz + .004, torso);
    // шея и воротник
    M(cyl(.05, .056, .1, 14), skin, 0, .63, 0, torso);
    M(cyl(.066, .074, .05, 16), o.collar ? mat(o.collar) : coatDark, 0, .6, 0, torso).scale.z = .9;
    if (o.stole) { const st = M(new THREE.TorusGeometry(.15 * W, .055, 10, 24), mat(o.stole, { rough: 1 }), 0, .52, 0, torso); st.rotation.x = Math.PI / 2; st.scale.y = .76; }
    if (o.radio) { const _r0 = torso.children.length; M(boxg(.05, .09, .03), mat('#1a1c20', { rough: .4 }), .16 * W, .5, .085, torso); M(cyl(.004, .004, .07), mat('#1a1c20'), .175 * W, .62, .085, torso); for (let i = _r0; i < torso.children.length; i++) torso.children[i].userData.acc = 'torso'; }
    // ---- руки ----
    const arms = [];
    for (const sd of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(sd * .19 * W, .5, 0); torso.add(sh);
      M(sph(.056 * W, 22, 16), coat, 0, -.01, 0, sh);
      M(cyl(.052 * W, .043, .29, 22), coat, 0, 0, 0, sh);
      const el = new THREE.Group(); el.position.y = -.29; sh.add(el);
      M(sph(.042, 16, 12), coat, 0, 0, 0, el);
      M(cyl(.043, .037, .25, 18), coat, 0, 0, 0, el);
      M(cyl(.035, .035, .025, 12), o.gloves ? mat(o.gloves) : shirt, 0, -.24, 0, el);
      const hand = new THREE.Group(); hand.position.y = -.27; el.add(hand);
      const hm = o.gloves ? mat(o.gloves) : skin;
      const palm = M(sph(.033, 10, 8), hm, 0, -.025, .004, hand); palm.scale.set(.95, 1.35, .6);
      const th = M(cyl(.012, .01, .045, 8), hm, sd * -.03, -.012, .018, hand); th.rotation.z = sd * .6; th.rotation.x = -.4;
      arms.push({ sh, el, sd, hand });
    }
    // ---- голова ----
    const head = new THREE.Group(); head.position.y = .7; torso.add(head);
    const skull = M(sph(.104, 24, 18), skin, 0, .09, -.005, head); skull.scale.set(.92, 1.06, .98);
    const jaw = M(sph(.078, 18, 12), skin, 0, .045, .008, head); jaw.scale.set(.84, .74, .84);
    if (!F && o.heavy) { const ch = M(sph(.07, 12, 10), skin, 0, .02, .03, head); ch.scale.set(1.15, .7, .9); }
    // нос
    const nose = M(cyl(.006, .015, .03, 10), skin, 0, .09, .098, head); nose.rotation.x = -1.2;
    M(sph(.012, 10, 8), skin, 0, .074, .104, head);
    // глаза, веки, брови
    const lids = [];
    for (const sd of [-1, 1]) {
      const scl = M(sph(.0165, 14, 10), mat('#f6f0ea', { rough: .3 }), sd * .036, .1, .087, head); scl.scale.set(1.15, .78, .55);
      M(sph(.0088, 12, 8), mat(o.eyeC || '#3a2a20', { rough: .25 }), sd * .036, .1, .095, head);
      M(sph(.0042, 8, 6), mat('#0a0606', { rough: .2 }), sd * .036, .1, .1, head);
      const lid = M(sph(.0185, 14, 8, 0, Math.PI / 2), skin, sd * .036, .1, .086, head); lid.scale.set(1.18, .95, .7); lids.push(lid);
      const br = M(boxg(.036, o.female ? .006 : .009, .012), mat(new THREE.Color(hairC).multiplyScalar(.75).getStyle()), sd * .037, .128, .093, head);
      br.rotation.z = sd * -.14;
      const ear = M(sph(.026, 10, 8), skin, sd * .094, .085, -.008, head); ear.scale.set(.42, 1, .8);
    }
    // рот
    const mouth = M(boxg(.03, .0045, .006), mat(o.lips || '#7a3a36', { rough: .6 }), 0, .042, .096, head);
    M(boxg(.03, .004, .006), mat(new THREE.Color(o.skin || '#e3b08a').multiplyScalar(.82).getStyle(), { rough: .6 }), 0, .033, .1, head);
    // ---- волосы ----
    const style = o.hairStyle || (F ? 'bun' : (o.hair === 'none' ? 'none' : 'short'));
    if (o.hair !== 'none' && !(o.hat === 'hood')) {
      if (style === 'bald') { const ring = M(new THREE.TorusGeometry(.094, .022, 8, 24, Math.PI * 1.25), hairM, 0, .07, -.01, head); ring.rotation.set(Math.PI / 2, 0, Math.PI * 1.125); }
      else if (style === 'curly') { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; M(sph(.032, 8, 6), hairM, Math.cos(a) * .078, .16 + Math.sin(i * 1.7) * .02, Math.sin(a) * .07 - .015, head); } M(sph(.08, 12, 8, 0, Math.PI / 2), hairM, 0, .15, -.01, head); }
      else {
        const cap = M(sph(.111, 22, 14, 0, Math.PI * (style === 'buzz' ? .44 : .5)), hairM, 0, .087, -.012, head); cap.scale.set(.96, 1.06, 1.02); cap.rotation.x = -.5;
        if (style === 'short' || style === 'side') { const fr = M(sph(.06, 12, 8, 0, Math.PI / 2), hairM, style === 'side' ? .03 : 0, .165, .055, head); fr.scale.set(1.5, .55, .9); fr.rotation.z = style === 'side' ? -.25 : 0; }
        if (style === 'bun') M(sph(.05, 12, 10), hairM, 0, .175, -.075, head);
        if (style === 'long') { const lh = M(boxg(.2, .26, .05), hairM, 0, -.04, -.08, head); lh.geometry = new THREE.BoxGeometry(.2, .26, .05, 2, 3, 1); }
      }
    }
    if (o.beard === 'full' || o.beard === 'trim') { const b = M(sph(.084, 16, 12), mat(o.beardC || '#5a3a22', { rough: 1 }), 0, .02, .045, head); b.scale.set(.93, o.beard === 'full' ? 1.05 : .78, .72); M(boxg(.05, .012, .016), mat(o.beardC || '#5a3a22', { rough: 1 }), 0, .056, .098, head); }
    if (o.beard === 'moust' || o.beard === 'walrus') { const ms = M(sph(.02, 10, 6), mat(o.beardC || '#3a2a20', { rough: 1 }), 0, .055, .098, head); ms.scale.set(o.beard === 'walrus' ? 2.2 : 1.7, .55, .6); }
    const _accH = head.children.length; // всё, что ниже (маска, очки, шляпы), — аксессуары: их переносят на 3D-модель
    if (o.mask === 'harlequin') {
      if (!window.__hqTex) { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#140f12'; g.fillRect(0, 0, 128, 128);
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 32 + (y % 2) * 16, cy = y * 32; g.fillStyle = '#6e1a20'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 16, cy + 16); g.lineTo(cx, cy + 32); g.lineTo(cx - 16, cy + 16); g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.stroke(); }
        window.__hqTex = new THREE.CanvasTexture(c); window.__hqTex.encoding = THREE.sRGBEncoding; }
      const mm = new THREE.MeshStandardMaterial({ map: window.__hqTex, roughness: .35, metalness: .2 });
      const mk = M(new THREE.SphereGeometry(.109, 24, 16, 0, Math.PI, Math.PI * .18, Math.PI * .7), mm, 0, .085, .0, head); mk.scale.set(.94, 1.08, 1.02);
      for (const sd of [-1, 1]) M(new THREE.TorusGeometry(.021, .004, 6, 16), mat('#c9a24a', { metal: .85, rough: .3 }), sd * .036, .1, .101, head);
    }
    const _lb0 = head.children.length;
    if (o.beard === 'long') { const lb = M(new THREE.ConeGeometry(.075, .32, 14), mat(o.beardC || '#d8d0c0', { rough: 1 }), 0, -.1, .07, head); lb.rotation.x = Math.PI + .25; M(sph(.07, 12, 8), mat(o.beardC || '#d8d0c0', { rough: 1 }), 0, .03, .06, head).scale.set(1.1, .8, .7); }
    const _lb1 = head.children.length;
    if (o.glasses) for (const sd of [-1, 1]) M(new THREE.TorusGeometry(.019, .0028, 6, 16), mat('#3a3228', { metal: .6, rough: .35 }), sd * .036, .1, .104, head);
    // ---- головные уборы ----
    const hc = mat(o.hatC || '#2a2a2a', { rough: .8 });
    switch (o.hat) {
      case 'cap': M(cyl(.118, .112, .06, 18), hc, 0, .2, -.005, head); M(cyl(.11, .11, .012, 18), hc, 0, .21, .01, head); { const v = M(boxg(.16, .012, .085), mat('#1c140e'), 0, .146, .112, head); v.rotation.x = .25; } break;
      case 'clerk': case 'conductor': M(cyl(.12, .112, .07, 18), hc, 0, .215, 0, head); { const v = M(boxg(.16, .012, .08), mat('#111318', { rough: .3 }), 0, .148, .11, head); v.rotation.x = .2; } break;
      case 'police': M(cyl(.125, .112, .075, 18), hc, 0, .215, 0, head); M(cyl(.126, .126, .025, 18), mat('#8a2a2a'), 0, .2, 0, head); { const v = M(boxg(.16, .012, .085), mat('#0e121c', { rough: .3 }), 0, .148, .112, head); v.rotation.x = .2; } M(sph(.016, 8, 6), mat('#c9a35a', { metal: .8, rough: .3 }), 0, .225, .122, head); break;
      case 'hood': { const hd2 = M(sph(.135, 18, 12, 0, Math.PI * .6), hc, 0, .085, -.035, head); hd2.scale.set(1.02, 1.1, 1.08); hd2.rotation.x = -.75; const rim = M(new THREE.TorusGeometry(.105, .018, 8, 20, Math.PI * 1.2), hc, 0, .085, .02, head); rim.rotation.set(-.35, 0, -Math.PI * .1); } break;
      case 'top': M(cyl(.098, .1, .19, 18), hc, 0, .34, 0, head); M(cyl(.17, .17, .012, 22), hc, 0, .155, 0, head); break;
      case 'bowler': { const d = M(sph(.115, 18, 10, 0, Math.PI / 2), hc, 0, .14, 0, head); d.scale.y = .9; M(cyl(.155, .155, .012, 22), hc, 0, .146, 0, head); } break;
      // облики главных героев по их 3D-моделям
      case 'greathelm': {
        const steel = mat('#3a3c41', { metal: .75, rough: .38 });
        const hm = M(cyl(.118, .122, .28, 22), steel, 0, .25, .0, head);
        M(sph(.118, 22, 10, 0, Math.PI * .5), steel, 0, .235, 0, head).scale.y = .35;
        M(boxg(.012, .25, .012), mat('#1a1b1e', { metal: .6, rough: .4 }), 0, .1, .121, head);
        M(boxg(.2, .02, .02), mat('#050506', { rough: 1 }), 0, .11, .114, head);
        for (const sd of [-1, 1]) { const g = M(sph(.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb030 }), sd * .042, .11, .12, head); g.scale.set(1.6, .7, .5); }
        const ring = M(new THREE.TorusGeometry(.124, .012, 6, 26), mat('#8a5a24', { metal: .8, rough: .35 }), 0, .225, 0, head); ring.rotation.x = Math.PI / 2;
        for (let i = 0; i < 9; i++) { const an = i / 9 * Math.PI * 2, sp = M(new THREE.ConeGeometry(.022, .09 + (i % 2) * .04, 5), mat('#2a2622', { metal: .6, rough: .5 }), Math.sin(an) * .118, .28 + (i % 2) * .02, Math.cos(an) * .118, head); sp.rotation.z = -Math.sin(an) * .15; sp.rotation.x = Math.cos(an) * .15; }
        hm.renderOrder = 1;
      } break;
      case 'nunveil': {
        const white = mat('#f2eee6', { rough: .7 }), black = mat('#121114', { rough: .65 });
        const coif = M(new THREE.TorusGeometry(.098, .024, 10, 28), white, 0, .085, .035, head); coif.scale.set(.92, 1.15, 1);
        M(cyl(.1, .1, .05, 18), white, 0, -.02, .0, head).scale.z = .9;
        const v = M(sph(.135, 20, 12, 0, Math.PI * .62), black, 0, .09, -.03, head); v.scale.set(1.04, 1.12, 1.1); v.rotation.x = -.7;
        const dg = new THREE.CylinderGeometry(.12, .21, .44, 18, 1, true); dg.translate(0, -.22, 0);
        M(dg, new THREE.MeshStandardMaterial({ color: new THREE.Color('#121114').convertSRGBToLinear(), roughness: .65, side: THREE.DoubleSide }), 0, .14, -.05, head);
        M(boxg(.004, .022, .003), mat('#111', {}), 0, .152, .102, head); M(boxg(.014, .004, .003), mat('#111', {}), 0, .147, .102, head);
        for (const sd of [-1, 1]) M(boxg(.004, .03, .003), mat('#9a1010', { rough: .4 }), sd * .036, .078, .1, head);
      } break;
      case 'fedora': {
        M(cyl(.21, .21, .012, 26), hc, 0, .17, 0, head);
        M(cyl(.1, .115, .13, 20), hc, 0, .3, 0, head); M(cyl(.117, .117, .03, 20), mat('#1e140c', { rough: .7 }), 0, .2, 0, head);
        M(boxg(.03, .012, .2), mat('#2a1c10'), 0, .3, 0, head);
      } break;
      case 'kerchief': { const k = M(sph(.122, 18, 12, 0, Math.PI * .6), hc, 0, .08, -.02, head); k.scale.set(1, 1.1, 1.05); k.rotation.x = -.6; M(cyl(.09, .13, .14, 14), hc, 0, .02, -.035, head).scale.z = .6; } break;
      case 'crown': { const gm = mat(o.hatC || '#d8b060', { metal: .9, rough: .25 }); M(cyl(.118, .118, .05, 20), gm, 0, .2, 0, head); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const p = M(new THREE.ConeGeometry(.018, .06, 4), gm, Math.cos(a) * .115, .23, Math.sin(a) * .115, head); } } break;
      case 'ushanka': { // меховая шапка-ушанка: купол, отворот спереди, уши опущены
        const fur = mat(o.hatC || '#4a3a2c', { rough: 1 }), top = mat(o.hatTop || '#2a2a30', { rough: .9 });
        M(sph(.128, 18, 12, 0, Math.PI * 2, 0, Math.PI * .5), top, 0, .1, -.005, head).scale.set(1.02, .95, 1.05);
        { const f = M(cyl(.135, .135, .07, 20), fur, 0, .165, 0, head); f.scale.z = 1.05; }
        { const b = M(boxg(.24, .07, .05), fur, 0, .17, .115, head); b.rotation.x = -.25; }
        for (const sd of [-1, 1]) { const e = M(boxg(.045, .13, .1), fur, sd * .125, .03, -.005, head); e.rotation.z = sd * .08; }
        M(boxg(.25, .05, .05), fur, 0, .09, -.12, head);
      } break;
    }
    for (let i = _accH; i < head.children.length; i++) head.children[i].userData.acc = 'head';
    for (let i = _lb0; i < _lb1; i++) head.children[i].userData.acc = null; // длинная борода — часть лица, у 3D-модели своя
    const _accT = torso.children.length, _accR = root.children.length;
    // ---- предметы ----
    if (o.prop === 'paper') { const pp = M(boxg(.42, .3, .006), mat('#e8e0cc'), 0, .42, .36, torso); pp.rotation.x = -.35; M(boxg(.3, .02, .007), mat('#3a3a3a'), 0, .5, .335, torso).rotation.x = -.35; }
    if (o.prop === 'book') { const b = M(boxg(.18, .03, .13), mat('#5a2a20'), 0, .2, .32, torso); b.rotation.x = .5; }
    if (o.prop === 'bread') M(sph(.05, 8, 6), mat('#a8743a'), .1, .24, .3, torso).scale.set(1.6, .8, .8);
    if (o.prop === 'cup') { M(cyl(.03, .026, .08, 12), mat('#e8e4dc', { rough: .3 }), 0, .14, .3, torso); M(cyl(.034, .034, .02, 12), mat('#c9a35a', { metal: .7, rough: .3 }), 0, .1, .3, torso); }
    if (o.prop === 'shovel') { const s = new THREE.Group(); s.position.set(.25, .1, .25); root.add(s); M(cyl(.016, .016, 1.1), mat('#6a4a2a'), 0, 1.1, 0, s); M(boxg(.22, .26, .02), mat('#3a3a3a', { metal: .5, rough: .5 }), 0, -.12, .03, s).rotation.x = .4; s.rotation.x = .15; }
    if (o.prop === 'cane') M(cyl(.012, .012, .9), mat('#2a1a10', { rough: .4 }), .28, .9, .18, root);
    if (o.prop === 'bag') { const bg = new THREE.Group(); bg.position.set(.32, sit ? hipY : .2, sit ? -.05 : .1); root.add(bg); M(boxg(.3, .3, .22), mat('#c8c0b0'), 0, .15, 0, bg); M(boxg(.302, .02, .222), mat('#a8322b'), 0, .1, 0, bg); M(boxg(.302, .02, .222), mat('#2a4a8a'), 0, .2, 0, bg); M(boxg(.02, .302, .222), mat('#a8322b'), .06, .15, 0, bg); }

    for (let i = _accT; i < torso.children.length; i++) torso.children[i].userData.acc = 'torso';
    for (let i = _accR; i < root.children.length; i++) root.children[i].userData.acc = 'root';
    // ---- позы рук ----
    const ap = o.armPose && !(o.prop === 'paper' || o.prop === 'book') ? o.armPose : (sit ? (o.prop === 'paper' || o.prop === 'book' ? 'hold' : 'lap') : 'down');
    const base = arms.map(a => {
      if (ap === 'hold') return { sx: -.85, sy: a.sd * -.55, sz: a.sd * .08, ex: -1.3 };
      if (o.prop === 'bread' && a.sd > 0) return { sx: -.7, sz: a.sd * .1, ex: -1.6 };
      if (ap === 'lap') return { sx: -.5, sz: a.sd * .16, ex: -1.0, sy: a.sd * -.45 };
      if (ap === 'knees') return { sx: -.32, sz: a.sd * .1, ex: -.75 };
      if (ap === 'crossed') return { sx: -.55, sz: a.sd * .32, ex: -1.9, sy: a.sd * -.9 };
      if (o.prop === 'shovel') return { sx: -.5, sz: a.sd * .2, ex: -.6 };
      if (o.handsBehind) return { sx: .35, sz: a.sd * .1, ex: -.6 };
      return { sx: .03, sz: a.sd * .07, ex: -.14 };
    });
    arms.forEach((a, i) => { a.sh.rotation.set(base[i].sx, base[i].sy || 0, base[i].sz); a.el.rotation.x = base[i].ex; });
    if (ap === 'window' || o.lean === 'window') { torso.rotation.z = .12; head.rotation.z = .25; }
    if (o.sleep) { head.rotation.x = .45; head.rotation.z = .2; lids.forEach(l => l.scale.y = 1.9); }

    const st = { o, root, head, torso, arms, base, legs, lids, mouth, t: Math.random() * 10, look: 0, lookP: 0, talk: 0, sleep: !!o.sleep, stand: !sit, blink: 2 + Math.random() * 3 };
    root.userData.npc = st;
    return st;
  };

  // анимация: дыхание, моргание, взгляд, жесты, шаг
  window.animHuman = function (st, dt, px, pz, talking, speed) {
    st.t += dt;
    st.torso.scale.y = 1 + Math.sin(st.t * (st.sleep ? 1.3 : 1.8)) * .008;
    if (!st.sleep && st.lids) {
      st.blink -= dt;
      const closed = st.blink < .12 && st.blink > 0;
      st.lids.forEach(l => { l.scale.y = closed ? 1.9 : .95; });
      if (st.blink <= 0) st.blink = 2.5 + Math.random() * 3.5;
    }
    if (st.stand) {
      // шаг: частота растёт со скоростью, шаг длиннее; колено сгибается, когда нога идёт вперёд
      const sp = speed || 0; st.walk = (st.walk || 0) + dt * (sp > 0 ? 2.4 + sp * 2.3 : 0);
      st.wk = (st.wk || 0) + ((sp > 0 ? 1 : 0) - (st.wk || 0)) * Math.min(1, dt * 6);   // плавный старт и остановка
      const amp = Math.min(.6, .3 + sp * .2) * st.wk;
      st.legs.forEach((l, i) => {
        const ph = st.walk + (i ? Math.PI : 0);
        l.leg.rotation.x = -Math.sin(ph) * amp;
        l.knee.rotation.x = Math.max(0, Math.cos(ph)) * amp * 1.5 + .04 * st.wk;
      });
      if (st.wk > .02) {
        st.arms.forEach((a, i) => { a.sh.rotation.x = Math.sin(st.walk + (i ? 0 : Math.PI)) * amp * .7; a.el.rotation.x = -.25 - amp * .35; a.sh.rotation.z = (i ? -1 : 1) * .06; });
        st.root.position.y = (Math.abs(Math.cos(st.walk)) - .5) * amp * .05;
        st.torso.rotation.y = Math.sin(st.walk) * amp * .12;
        st.root.rotation.z = Math.sin(st.walk) * amp * .025;
        if (sp > 0) return;
      }
      st.root.rotation.z = Math.sin(st.t * .6) * .008;
    }
    const r = st.root, dx = px - r.position.x, dz = pz - r.position.z, d = Math.hypot(dx, dz);
    let target = 0, targetP = 0;
    if (!st.sleep && (d < 3.2 || talking)) {
      let a = Math.atan2(dx, dz) - r.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a));
      target = Math.max(-1.1, Math.min(1.1, a));
      targetP = Math.max(-.35, Math.min(.35, -Math.atan2(.4, d) * .6));
    } else if (!st.sleep) target = Math.sin(st.t * .23) * .35;
    st.look += (target - st.look) * Math.min(1, dt * 3);
    st.lookP += (targetP - st.lookP) * Math.min(1, dt * 3);
    if (!st.sleep) { st.head.rotation.y = st.look; st.head.rotation.x = st.lookP + (talking ? Math.sin(st.t * 7) * .04 : 0); }
    if (st.mouth) st.mouth.scale.y = talking ? 1 + Math.abs(Math.sin(st.t * 13)) * 2.5 : 1;
    st.talk += ((talking ? 1 : 0) - st.talk) * Math.min(1, dt * 4);
    st.arms.forEach((a, i) => {
      const b = st.base[i], k = st.talk * (i === 1 ? 1 : .35);
      // жест при разговоре: предплечье не поднимаем выше груди (у сидящих руки уже согнуты — кисть уходила в лицо)
      const sh = b.sx - k * (.2 + .12 * Math.sin(st.t * 3.1 + i));
      let el = b.ex - k * (.45 + .22 * Math.sin(st.t * 4.3 + i * 2));
      const lim = Math.min(-1.75, b.sx + b.ex);
      if (sh + el < lim) el = lim - sh;
      a.sh.rotation.x = sh; a.el.rotation.x = el;
    });
  };
})();
