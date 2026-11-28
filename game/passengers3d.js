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

  // Загрузчик FBX (r128) даёт каждой части одежды свою копию скелета: копии висят дочерними костями с нулевым сдвигом,
  // и у человека выходит ~830 костей вместо ~50. Каждый кадр движок пересчитывает их все (у 27 человек — 22 тыс. объектов).
  // Перепривязываем меши к основным костям (мировые матрицы те же — картинка не меняется), лишние кости и ненужные
  // варианты одежды убираем, а одинаковые скелеты частей одного человека объединяем в один.
  function slim(g) {
    const rm = []; g.traverse(m => { if (m.isMesh && !m.visible) rm.push(m); }); rm.forEach(m => m.parent.remove(m));
    const ident = b => b.position.lengthSq() < 1e-8 && Math.abs(Math.abs(b.quaternion.w) - 1) < 1e-6 &&
      Math.abs(b.scale.x - 1) < 1e-5 && Math.abs(b.scale.y - 1) < 1e-5 && Math.abs(b.scale.z - 1) < 1e-5;
    const canon = b => { let c = b; while (c.parent && c.parent.isBone && c.parent.name === c.name && ident(c)) c = c.parent; return c; };
    const sameInv = (a, b) => { for (let i = 0; i < a.length; i++) { const x = a[i].elements, y = b[i].elements; for (let k = 0; k < 16; k++) if (Math.abs(x[k] - y[k]) > 1e-5) return false; } return true; };
    const skels = [];
    g.traverse(m => {
      if (!m.isSkinnedMesh) return;
      const sk = m.skeleton, bones = sk.bones.map(canon);
      let s = skels.find(q => q.bones.length === bones.length && q.bones.every((b, i) => b === bones[i]) && sameInv(q.boneInverses, sk.boneInverses));
      if (!s) { s = new THREE.Skeleton(bones, sk.boneInverses.map(x => x.clone())); skels.push(s); }
      m.skeleton = s;
    });
    const used = new Set(); skels.forEach(s => s.bones.forEach(b => used.add(b)));
    for (let pass = 0; pass < 64; pass++) {   // цепочки копий бывают по 15 штук
      const dead = []; g.traverse(b => { if (b.isBone && !used.has(b) && b.parent && b.parent.isBone && b.parent.name === b.name && ident(b) && !b.children.length) dead.push(b); });
      if (!dead.length) break;
      dead.forEach(b => b.parent.remove(b));
    }
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
    slim(g);
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
    // отсечение по кадру: сфера вокруг всего человека (а не по позе привязки скелета) — кого нет в кадре, не рисуем;
    // считается для каждой камеры отдельно, поэтому в зеркалах люди за спиной остаются
    st.root.updateMatrixWorld(true);
    const cW = st.root.localToWorld(new THREE.Vector3(0, .9, 0));
    g.traverse(m => {
      if (!m.isMesh) return;
      const geo = m.geometry;
      if (!geo.userData.bsFix) {
        const s = m.matrixWorld.getMaxScaleOnAxis() || 1;
        geo.boundingSphere = new THREE.Sphere(cW.clone().applyMatrix4(m.matrixWorld.clone().invert()), 1.6 / s);
        geo.userData.bsFix = true;
      }
      m.frustumCulled = true;
    });
    needCompile = true;
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
    // поворот головы модели относительно процедурной головы: маски и очки висели у уха, если в момент переноса
    // головы смотрели в разные стороны (у симметричных шляп это не видно). Доворачиваем аксессуар вокруг головы.
    const eH = M.map.find(e => e.b === headB);
    const dq = Q();
    if (eH) {
      const hW = M.holder.getWorldQuaternion(Q()), hInv = hW.clone().invert();
      const cur = headB.getWorldQuaternion(Q()).premultiply(hInv);              // поворот кости в осях holder
      const face3 = hW.clone().multiply(cur).multiply(eH.ref.clone().invert()); // куда смотрит лицо модели
      dq.copy(face3).multiply(st.head.getWorldQuaternion(Q()).invert());
    }
    const hP = st.head.getWorldPosition(V()), bP = headB.getWorldPosition(V());
    for (const m of M.acc) {
      const kind = m.userData.acc;
      if (kind === 'root') continue;
      const bone = kind === 'head' ? headB : chestB;
      m.updateMatrixWorld(true);
      const w = m.matrixWorld.clone();
      if (kind === 'head') {
        const p = V(), q = Q(), sc = V(); w.decompose(p, q, sc);
        p.sub(hP).applyQuaternion(dq).add(bP); q.premultiply(dq);
        w.compose(p, q, sc);
      } else { w.elements[12] += dChest.x; w.elements[13] += dChest.y; w.elements[14] += dChest.z; }
      bone.updateMatrixWorld(true);
      const loc = new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(w);
      bone.add(m); loc.decompose(m.position, m.quaternion, m.scale);
      m.visible = true;
    }
    // головные уборы (всё, что выше лба) были впритык к процедурной голове: у модели пышнее волосы, и фуражка
    // сидела на макушке поверх них. Чуть шире и ниже — надета на голову.
    const hb = headB.getWorldPosition(V()), hs = headB.getWorldScale(V()).y || 1;
    const hats = M.acc.filter(m => m.userData.acc === 'head' && m.parent === headB && (m.userData.hat || new THREE.Box3().setFromObject(m).min.y > hb.y + .11));
    // очки-кольца рассчитаны на процедурное лицо: на модели висят у виска — прячем
    for (const m of M.acc) if (m.userData.acc === 'head' && m.geometry && m.geometry.type === 'TorusGeometry') { m.visible = false; m.userData.accOff = true; }
    // маска-полусфера была меньше лица модели: пряталась внутри головы, наружу торчали края у ушей
    const masks = M.acc.filter(m => m.userData.mask && m.parent === headB);
    if (masks.length) {
      const pv = new THREE.Group(); headB.add(pv);
      for (const m of masks) pv.add(m);
      pv.scale.set(1.2, 1.1, 1.38); pv.position.set(0, -.004 / hs, .012 / hs);
    }
    // закрытый шлем был уже головы модели: лицо проступало сквозь переднюю стенку («чёрный ящик с лицом»)
    const helm = M.acc.filter(m => m.userData.helm && m.parent === headB);
    if (helm.length) {
      const pv = new THREE.Group(); headB.add(pv);
      for (const m of helm) pv.add(m);
      pv.scale.set(1.34, 1.14, 1.46); pv.position.set(0, -.03 / hs, .012 / hs);
      M.g.traverse(o => { if (o.isMesh && /hair/i.test(o.name + ' ' + ((o.material && o.material.name) || ''))) o.visible = false; });
    }
    const hoods = M.acc.filter(m => m.userData.hood && m.parent === headB);
    if (hats.length) {
      const pv = new THREE.Group(); headB.add(pv);
      for (const m of hats) if (!m.userData.hood && !m.userData.helm) pv.add(m);
      pv.scale.set(1.16, 1.04, 1.16); pv.position.y = -.025 / hs;
    }
    // клобук монаха был впритык к маленькой процедурной голове: на модели висел чёрным пятном за затылком.
    // Надеваем крупнее и чуть вперёд, свои волосы модели под ним прячем
    if (hoods.length) {
      // свой клобук по голове модели: колпак на макушку и затылок с вырезом для лица + наметка до плеч
      const mat = hoods[0].material;
      for (const m of hoods) { m.visible = false; m.userData.accOff = true; }
      const pv = new THREE.Group(); headB.add(pv); pv.scale.setScalar(1 / hs);
      // центр черепа над костью головы: по высоте макушки модели
      const box = new THREE.Box3().setFromObject(M.g); const top = box.max.y, hy = hb.y;
      const cy = Math.max(.07, Math.min(.13, (top - hy) * .5));
      const R = Math.max(.105, Math.min(.135, (top - hy) * .55 + .01));
      const cap = new THREE.Mesh(new THREE.SphereGeometry(R, 22, 14, Math.PI / 2 + .85, Math.PI * 2 - 1.7, 0, 1.95), mat);
      cap.position.set(0, cy, -.012); pv.add(cap);
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(R * .98, R * 1.45, .26, 20, 1, true, Math.PI / 2 + .95, Math.PI * 2 - 1.9), mat);
      drape.position.set(0, cy - R * .38 - .13, -.03); pv.add(drape);
      [cap, drape].forEach(m => { m.material.side = THREE.DoubleSide; m.userData.acc = 'head'; });
      M.g.traverse(o => { if (o.isMesh && /hair/i.test(o.name + ' ' + ((o.material && o.material.name) || ''))) o.visible = false; });
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
  // невидимого человека вынимаем из сцены целиком: скрытые объекты движок всё равно обходит каждый кадр
  function showHolder(st, vis) {
    const h = st.m3.holder;
    h.visible = vis;
    if (vis && !h.parent) { st.root.add(h); drive(st); }
    else if (!vis && h.parent) h.parent.remove(h);
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
      showHolder(st, vis);
      if (vis && (d < 7 || ((st.m3.k = (st.m3.k || 0) + 1) % 3 === 0))) drive(st);   // дальних — раз в 3 кадра
    }
  };

  // все NPC: и уже созданные, и будущие (вокзал, пароход, бегущие)
  function scan() {
    // модели грузим только людям текущей локации: остальные локации подгрузятся, когда в них войдёшь (меньше памяти на телефоне)
    const here = window.WORLD ? WORLD.cur : 'train';
    if (typeof NPCS !== 'undefined') for (const n of NPCS) if (n.st && !n.st.m3 && !n.st.m3loading && (n.loc || 'train') === here && !/^(b_|smotritel|gordey$|evsey$|margaret)/.test(n.id) && !n.model3d) attach(n.st);
    if (typeof CHASE !== 'undefined' && CHASE.st && !CHASE.st.m3) attach(CHASE.st);
    if (typeof PATROL !== 'undefined' && PATROL.st && !PATROL.st.m3) attach(PATROL.st);
    if (typeof PROPS !== 'undefined' && PROPS.body && PROPS.body.root && !PROPS.body.m3) attach(PROPS.body); // тело в тамбуре
  }
  // шейдеры новых людей собираем заранее, пока их не видно: иначе при входе в вагон кадр замирает на 0.1–0.3 с
  // (заодно и всё скрытое в поезде: вещи, двери, лампы появляются позже — их шейдеры тоже собираем сразу)
  let needCompile = true;
  function precompile() {
    if (!needCompile || typeof renderer === 'undefined' || typeof camera === 'undefined' || typeof trainReady === 'undefined' || !trainReady) return;
    if (typeof NPCS !== 'undefined' && NPCS.some(n => n.st && n.st.m3loading && !n.st.m3)) return;   // ждём, пока догрузятся все
    needCompile = false;
    const hidden = [], flip = [];
    for (const st of ALL) if (st.m3 && !st.m3.holder.parent) { showHolder(st, true); hidden.push(st); }
    // лампы не включаем (иначе шейдеры соберутся под чужое число ламп и не пригодятся), чужие локации не трогаем
    const cur = window.WORLD ? WORLD.cur : 'train', away = new Set();
    if (window.WORLD && WORLD.LOC) for (const k in WORLD.LOC) if (k !== cur && WORLD.LOC[k].group) away.add(WORLD.LOC[k].group);
    if (cur !== 'train' && window.TRAIN_ROOT) away.add(TRAIN_ROOT);
    (function walk(o) { if (away.has(o) || o.isLight) return; if (!o.visible) { o.visible = true; flip.push(o); } o.children.forEach(walk); })(scene);
    try { if (window.compileScene) compileScene(); else renderer.compile(scene, camera); } catch (e) { console.warn(e); }
    flip.forEach(o => { o.visible = false; });
    hidden.forEach(st => showHolder(st, false));
  }
  setInterval(() => { try { scan(); precompile(); } catch (e) { console.warn(e); } }, 1500);
  window.Passengers3D = { attach, scan, outfit, ALL, blob };
})();
