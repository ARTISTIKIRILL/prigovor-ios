// Реалистичные 3D-пассажиры (MakeHuman/MPFB, CC0) поверх процедурных NPC.
// Процедурный человечек (npc.js) остаётся «скелетом логики»: его двигает animHuman (сидит, идёт, смотрит на героя, жестикулирует),
// а кости 3D-модели каждый кадр повторяют повороты его частей. Шляпы, очки, маски и предметы переносятся на кости модели.
// Две базы: pm (мужчина: костюм, рубашка, рубаха, куртка, комбинезон; 3 стрижки; 3 бороды) и pf (женщина: блузка и длинная юбка; 3 причёски).
// Отключить: GFX.people = false.
(function () {
  const FILES = { pm: 'pm_v2.txt', pf: 'pf_v2.txt', po: 'po_v1.txt' };
  const base = {};
  const ALL = [];
  const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
  const _q1 = Q(), _q2 = Q(), _q3 = Q(), _v1 = V(), _v2 = V();

  function load(id) {
    if (base[id]) return base[id];
    const H = window.Heroes3D;
    base[id] = (async () => {
      await H._libs();
      if (!THREE.SkeletonUtils) await H._script(H.CDN + 'utils/SkeletonUtils.js');
      const g = H._parse(await H._txt(FILES[id]));
      return g;
    })();
    return base[id];
  }

  // ---------- выбор облика по описанию NPC ----------
  function hashStr(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function outfit(o) {
    const r = hashStr(JSON.stringify(o));
    if (o.female) {
      const hs = o.hairStyle || 'bun';
      const hair = (o.hair === 'none' || o.hat === 'nunveil') ? null : hs === 'long' ? 'braid01' : hs === 'curly' ? 'bob01' : hs === 'bun' ? 'ponytail01' : 'bob01';
      return { base: 'pf', cloth: 'female_elegantsuit01', hair, beard: null, color: o.skirt || o.coat || '#4a3a3a' };
    }
    let cloth;
    if (o.lapels || o.vest || o.shirtFront || o.tie || o.buttons) cloth = 'male_elegantsuit01';
    else if (o.apron) cloth = 'male_casualsuit01';
    else if (o.hat === 'hood') cloth = 'male_casualsuit05';
    else if (o.coatTex === 'sack') cloth = ['male_casualsuit05', 'male_casualsuit03', 'male_worksuit01'][(r >>> 3) % 3];
    else cloth = ['male_casualsuit03', 'male_casualsuit05', 'male_casualsuit01', 'male_worksuit01'][r % 4];
    const hs = o.hairStyle || 'short';
    const hair = (o.hair === 'none' || hs === 'bald' || hs === 'none') ? null : hs === 'buzz' ? 'short04' : hs === 'side' ? 'short01' : 'short02';
    const beard = o.beard === 'full' || o.beard === 'long' ? 'full' : o.beard === 'trim' ? 'trim' : (o.beard === 'moust' || o.beard === 'walrus') ? 'moust' : null;
    // седые волосы или длинная борода — пожилое лицо (морщины, кожа «old»)
    const hc = new THREE.Color(o.beardC && o.beard ? o.beardC : (o.hair && o.hair !== 'none' ? o.hair : '#3a2a1e')), hsl = {}; hc.getHSL(hsl);
    const old = o.beard === 'long' || (hsl.l > .5 && hsl.s < .14);
    return { base: old ? 'po' : 'pm', cloth, hair, beard, color: o.coat || '#5a4a3a' };
  }

  // ткань: серую текстуру красим цветом одежды, светлые места (рубашка, воротник) остаются светлыми
  function tintMat(m, color, keepLight) {
    const s = new THREE.MeshStandardMaterial({ map: m.map || null, color: new THREE.Color(color).convertSRGBToLinear(), roughness: .82, metalness: 0, skinning: true,
      transparent: false, alphaTest: m.map && /hair|brows/i.test(m.name) ? .45 : 0, side: /hair|brows/i.test(m.name) ? THREE.DoubleSide : THREE.FrontSide });
    if (s.map) s.map.encoding = THREE.sRGBEncoding;
    if (keepLight && s.map) {
      s.onBeforeCompile = sh => {
        sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
          '#ifdef USE_MAP\n vec4 texelColor = texture2D( map, vUv );\n texelColor = mapTexelToLinear( texelColor );\n float gg = texelColor.g;\n' +
          ' diffuseColor.rgb = mix( diffuse * gg * 1.08, vec3( gg * .92 ), smoothstep( .9, .99, gg ) );\n#endif');
      };
      s.customProgramCacheKey = () => 'tintLight';
    }
    s.name = m.name;
    return s;
  }


  // мягкая контактная тень под человеком: модель «стоит» на полу, а не висит над ним
  let blobTex = null;
  function blob(root, seated) {
    if (!root || root.userData.blob) return;
    if (!blobTex) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(.55, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128); blobTex = new THREE.CanvasTexture(c);
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: seated ? .75 : .85, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2;
    if (seated) { m.scale.set(.75, .95, 1); m.position.set(0, .012, .28); } else { m.scale.set(.78, .62, 1); m.position.set(0, .012, .02); }
    root.add(m); root.userData.blob = m;
  }

  function bonesOf(g) { const B = {}; g.traverse(o => { if (o.isBone) { const n = o.name.replace(/^mixamorig:?/, ''); if (!B[n]) B[n] = o; } }); return B; }

  // ---------- привязка к NPC ----------
  async function attach(st) {
    if (!st || st.m3 || st.m3loading || window.GFX && GFX.people === false) return;
    st.m3loading = true;
    const o = st.o || {};
    const fit = outfit(o);
    let src;
    try { src = await load(fit.base); } catch (e) { console.warn('пассажиры 3D: не загрузилось', e); return; }
    const g = THREE.SkeletonUtils.clone(src);
    const keepMesh = n => {
      const k = n.replace(/^p[mfo]_/, '');
      if (k === 'body' || k === 'eyes' || k === 'shoes' || k === 'brows' || k === 'lashes') return true;
      if (k.startsWith('cl_')) return k === 'cl_' + fit.cloth;
      if (k.startsWith('hair_')) return k === 'hair_' + fit.hair;
      if (k.startsWith('beard_')) return k === 'beard_' + fit.beard;
      return false;
    };
    const hairC = (o.hair && o.hair !== 'none') ? o.hair : '#3a2a1e';
    const skinRef = new THREE.Color('#e3b08a'), skinC = new THREE.Color(o.skin || '#e3b08a');
    const skinTint = new THREE.Color(Math.min(1.2, skinC.r / skinRef.r), Math.min(1.2, skinC.g / skinRef.g), Math.min(1.2, skinC.b / skinRef.b));
    g.traverse(m => {
      if (!m.isMesh) return;
      m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
      // имя меша иногда сдвигается загрузчиком r128 — проверяем и по имени материала
      const mm = Array.isArray(m.material) ? m.material[0] : m.material;
      const key = (mm && mm.name || '').replace(/^M_/, '').replace(/\.\d+$/, '');
      const nm = /^(skin)$/.test(key) ? 'body' : key;
      if (!keepMesh(nm) && !keepMesh(m.name)) { m.visible = false; return; }
      let col = '#ffffff', light = false;
      if (/^cl_/.test(nm)) { col = fit.color; light = fit.cloth === 'male_elegantsuit01'; }
      else if (/^hair_|brows|lashes/.test(nm)) col = hairC;
      else if (/^beard_/.test(nm)) col = o.beardC || hairC;
      else if (nm === 'shoes') col = o.boots ? '#2a1e16' : '#1c1612';
      m.material = tintMat(mm, col, light);
      if (nm === 'body') { m.material.color.copy(skinTint); m.material.roughness = .6; }
      if (nm === 'eyes') m.material.roughness = .2;
    });
    const B = bonesOf(g);
    if (!B.Hips || !B.LeftArm) { console.warn('пассажиры 3D: нет костей'); return; }
    const holder = new THREE.Group(); holder.add(g);
    st.root.add(holder);
    const H = o.h || 1;
    // эталонная поза: руки вниз, ноги прямо (так стоит процедурный человечек при нулевых поворотах)
    const aimB = (bone, child, dirLocal) => {
      holder.updateMatrixWorld(true);
      bone.getWorldPosition(_v1); child.getWorldPosition(_v2);
      const cur = _v2.sub(_v1).normalize();
      const want = dirLocal.clone().applyQuaternion(holder.getWorldQuaternion(Q())).normalize();
      const rot = Q().setFromUnitVectors(cur, want);
      bone.getWorldQuaternion(_q1); const wq = rot.multiply(_q1);
      bone.parent.getWorldQuaternion(_q2); bone.quaternion.copy(_q2.invert().multiply(wq)); bone.updateMatrixWorld(true);
    };
    // перед эталоном снимаем все повороты частей процедурного NPC, чтобы holder смотрел как st.root
    for (const s of [['Left', 1], ['Right', -1]]) {
      if (B[s[0] + 'ForeArm']) aimB(B[s[0] + 'Arm'], B[s[0] + 'ForeArm'], new THREE.Vector3(s[1] * .13, -1, .02));
      if (B[s[0] + 'Hand']) aimB(B[s[0] + 'ForeArm'], B[s[0] + 'Hand'], new THREE.Vector3(s[1] * .06, -1, .08));
      if (B[s[0] + 'Leg']) aimB(B[s[0] + 'UpLeg'], B[s[0] + 'Leg'], new THREE.Vector3(s[1] * .02, -1, 0));
      if (B[s[0] + 'Foot']) aimB(B[s[0] + 'Leg'], B[s[0] + 'Foot'], new THREE.Vector3(0, -1, -.02));
    }
    // масштаб: длина ноги как у процедурного (.9·H), бёдра в точке поворота его ног
    holder.updateMatrixWorld(true);
    const hl = holder.worldToLocal(B.LeftUpLeg.getWorldPosition(V())), hr = holder.worldToLocal(B.RightUpLeg.getWorldPosition(V()));
    const box = new THREE.Box3().setFromObject(g); const footY = holder.worldToLocal(new THREE.Vector3(0, box.min.y, 0).add(holder.getWorldPosition(V()))).y;
    const legLen = (hl.y + hr.y) / 2 - footY;
    const sc = (.9 * H) / Math.max(.2, legLen);
    g.scale.multiplyScalar(sc);
    if (o.heavy) { holder.scale.set(1.1, 1, 1.12); }
    holder.updateMatrixWorld(true);
    const ml = holder.worldToLocal(B.LeftUpLeg.getWorldPosition(V())).add(holder.worldToLocal(B.RightUpLeg.getWorldPosition(V()))).multiplyScalar(.5);
    const pl = st.legs[0].leg.position.clone().add(st.legs[1].leg.position).multiplyScalar(.5);
    g.position.add(pl.sub(ml).divide(holder.scale));
    holder.updateMatrixWorld(true);
    const hq = holder.getWorldQuaternion(Q()).invert();
    const relQ = (obj, out) => obj.getWorldQuaternion(out).premultiply(hq);
    const side = sd => sd > 0 ? 'Left' : 'Right';
    const map = [];
    const add = (part, bn) => { const b = B[bn]; if (!part || !b) return; map.push({ part, b, ref: relQ(b, Q()), pref: relQ(part, Q()) }); };
    // эталон процедурных частей — при нулевых поворотах (относительно st.root). Части уже могут быть повёрнуты (сидит), поэтому
    // эталон считаем аналитически: нулевой поворот = поворот st.root
    add(st.torso, 'Spine');
    add(st.head, 'Head');
    for (const a of st.arms) { add(a.sh, side(a.sd) + 'Arm'); add(a.el, side(a.sd) + 'ForeArm'); }
    st.legs.forEach((l, i) => { const sd = l.leg.position.x > 0 ? 1 : -1; add(l.leg, side(sd) + 'UpLeg'); add(l.knee, side(sd) + 'Leg'); });
    const rootRel = relQ(st.root, Q());
    for (const e of map) e.pref.copy(rootRel);
    // аксессуары: шляпы/очки/маски — на кость головы, предметы на груди — на Spine2, остальное остаётся
    const acc = [];
    st.root.traverse(m => { if (m.userData && m.userData.acc && m !== holder) acc.push(m); });
    // прячем процедурное тело (кроме аксессуаров)
    st.root.traverse(m => { if (m.isMesh && !m.userData.acc && !isIn(m, holder)) m.visible = false; });
    st.m3 = { holder, g, map, B, hq, acc, accDone: false };
    if (!(st.root.rotation.x || st.root.rotation.z)) blob(st.root, !st.stand);
    ALL.push(st);
    drive(st);
    placeAcc(st);
  }
  function isIn(m, root) { for (let p = m; p; p = p.parent) if (p === root) return true; return false; }

  function placeAcc(st) {
    const M = st.m3; if (!M || M.accDone) return;
    M.accDone = true;
    st.root.updateMatrixWorld(true);
    const headB = M.B.Head, chestB = M.B.Spine2 || M.B.Spine1;
    // смещение головы: процедурная голова → кость головы модели
    const dHead = headB.getWorldPosition(V()).sub(st.head.getWorldPosition(V()));
    const dChest = chestB.getWorldPosition(V()).sub(st.torso.localToWorld(new THREE.Vector3(0, .45, 0)));
    for (const m of M.acc) {
      const kind = m.userData.acc;
      if (kind === 'root') continue;
      const bone = kind === 'head' ? headB : chestB;
      m.updateMatrixWorld(true);
      const w = m.matrixWorld.clone();
      w.elements[12] += (kind === 'head' ? dHead : dChest).x; w.elements[13] += (kind === 'head' ? dHead : dChest).y; w.elements[14] += (kind === 'head' ? dHead : dChest).z;
      bone.updateMatrixWorld(true);
      const loc = new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(w);
      bone.add(m); loc.decompose(m.position, m.quaternion, m.scale);
      m.visible = true;
    }
  }

  // каждый кадр: кости = повороты процедурных частей. Только умножение кватернионов по цепочке родителей,
  // без пересчёта матриц (иначе 27 человек съедают 40+ мс на кадр)
  const _chain = [];
  function chainQ(obj, stop, out) {
    out.set(0, 0, 0, 1); _chain.length = 0;
    for (let o = obj; o && o !== stop; o = o.parent) _chain.push(o);
    for (let i = _chain.length - 1; i >= 0; i--) out.multiply(_chain[i].quaternion);
    return out;
  }
  function drive(st) {
    const M = st.m3; if (!M) return;
    for (const e of M.map) {
      chainQ(e.part, st.root, _q1);                 // поворот части относительно st.root (нулевой = единичный)
      const want = _q2.copy(_q1).multiply(e.ref);   // нужный поворот кости относительно holder
      chainQ(e.b.parent, M.holder, _q3).invert();
      e.b.quaternion.copy(_q3.multiply(want));
    }
  }
  const orig = window.animHuman;
  window.animHuman = function (st, dt, px, pz, talking, speed) {
    orig.apply(this, arguments);
    if (st && st.m3) {
      // не считаем тех, кто далеко (в другом вагоне их всё равно не видно)
      const d = Math.hypot(px - st.root.position.x, pz - st.root.position.z);
      // в поезде рисуем свой вагон и тех, кто совсем рядом (через стенки остальных всё равно не видно)
      let vis = d < 17;
      if (vis && d > 7 && typeof zoneName === 'function' && typeof curLoc === 'function' && curLoc() === 'train') vis = zoneName(st.root.position.x) === zoneName(px);
      st.m3.holder.visible = vis;
      if (vis && (d < 7 || ((st.m3.k = (st.m3.k || 0) + 1) % 3 === 0))) drive(st);   // дальних — раз в 3 кадра
    }
  };

  // все NPC: и уже созданные, и будущие (вокзал, пароход, бегущие)
  function scan() {
    if (typeof NPCS !== 'undefined') for (const n of NPCS) if (n.st && !n.st.m3 && !n.st.m3loading && !/^(b_|smotritel)/.test(n.id) && !n.model3d) attach(n.st);
    if (typeof CHASE !== 'undefined' && CHASE.st && !CHASE.st.m3) attach(CHASE.st);
    if (typeof PATROL !== 'undefined' && PATROL.st && !PATROL.st.m3) attach(PATROL.st);
    if (typeof PROPS !== 'undefined' && PROPS.body && PROPS.body.root && !PROPS.body.m3) attach(PROPS.body); // тело в тамбуре
  }
  setInterval(() => { try { scan(); } catch (e) { console.warn(e); } }, 1500);
  window.Passengers3D = { attach, scan, outfit, ALL, blob };
})();
