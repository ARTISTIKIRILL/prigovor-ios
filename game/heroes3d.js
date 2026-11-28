// 3D-модели героев и Смотрителя на вокзале вместо простых фигур.
// Модели те же, что в прологе (cs/glb/*.glb.gz — tools/glb/convert.py). Герои сидят на лавке, Смотритель стоит.
// Простые фигуры остаются для логики (разговор, подсветка), но становятся невидимыми.
(function () {
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
  const FILES = {
    knight: ['knight_v3_0.txt'], gravedigger: ['gravedigger_v3_0.txt'],
    nun: ['nun_v4_0.txt'], forger: ['forger_v3_0.txt'], warden: ['warden_v2_0.txt'],
    executioner: ['executioner_v3_0.txt'], chronicler: ['chronicler_v2_0.txt'], vampire: ['vampire_v3_0.txt']
  };
  const HEIGHT = { knight: 1.85, gravedigger: 1.8, nun: 1.74, forger: 1.85, warden: 1.74, executioner: 2.0, chronicler: 1.86, vampire: 1.7 };
  // оружие на вокзале не носят (как и в Палате)
  // у рыцаря в файле части подписаны со сдвигом: «Helmet» — это щит
  const HIDE = { knight: ['Greatsword', 'Paladin_J_Nordstrom_Helmet'], gravedigger: ['X_Shovel'], nun: ['X_Cross'], forger: ['X_Cane'], warden: [], executioner: ['BattleAxe_GEO'], chronicler: [], vampire: ['X_Scythe'] };
  const MODEL = { rowen: 'knight', miron: 'gravedigger', agata: 'nun', tibo: 'forger', smotritel: 'warden',
    // секретные герои: палач Гордей, летописец Евсей, графиня Маргарет (и их фигуры-NPC на вокзале и в делах)
    gordey: 'executioner', evsey: 'chronicler', margaret: 'vampire', margaretP: 'vampire', margaretN: 'vampire' };
  const LEGS = /(UpLeg|Leg|Foot|ToeBase|Toe_End)$/;
  const MIXERS = [];
  let libs = null;

  function script(u) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function ensureLibs() {
    if (!libs) libs = (window.fflate ? Promise.resolve() : script(CDN + 'libs/fflate.min.js')).then(() => THREE.FBXLoader ? null : script(CDN + 'loaders/FBXLoader.js')).then(() => THREE.GLTFLoader ? null : script(CDN + 'loaders/GLTFLoader.js'));
    return libs;
  }
  // модель: по сети — fetch; при запуске с диска (file://) — через <script> из cs/data (так собирается архив для друзей)
  function txtScript(f) {
    window.__CSV = window.__CSV || {};
    window.__CSD = window.__CSD || ((n, s) => { window.__CSV[n] = s; });
    return new Promise((res, rej) => {
      if (f in __CSV) return res(__CSV[f]);
      const s = document.createElement('script'); s.src = 'cs/data/' + f + '.js';
      s.onload = () => { s.remove(); f in __CSV ? res(__CSV[f]) : rej(new Error(f)); };
      s.onerror = () => { s.remove(); rej(new Error(f + ' missing')); };
      document.head.appendChild(s);
    });
  }
  async function txt(f) {
    if (location.protocol === 'file:') return txtScript(f);
    let c = null, r = null;
    try { c = window.caches ? await caches.open('prigovor-models-v1') : null; r = c ? await c.match('cs/' + f) : null; } catch (e) { c = null; }
    if (!r) { r = await fetch('cs/' + f); if (!r.ok) throw new Error(f + ' ' + r.status); if (c) c.put('cs/' + f, r.clone()).catch(() => { }); }
    return (await r.text()).trim();
  }
  function parse(b64) {
    const s = atob(b64), u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return new THREE.FBXLoader().parse(u.buffer, '');
  }
  // glb: по сети — fetch (+ кэш), с диска — base64 из cs/data/<имя>.glb.gz.js; gzip распаковывает браузер
  let glbTxt = false;
  async function bin(n) {
    const f = n + '.glb.gz';
    let u;
    if (location.protocol === 'file:') { const s = atob(await txtScript(f)); u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); }
    else {
      let c = null, r = null;
      try { c = window.caches ? await caches.open('prigovor-models-v3') : null; r = c ? await c.match('glb/' + f) : null; } catch (e) { c = null; }
      if (!r) {
        r = glbTxt ? null : await fetch('cs/glb/' + f).catch(() => null);
        if (!r || !r.ok) { r = await fetch('cs/glb/' + f + '.txt'); if (!r.ok) throw new Error(f + ' ' + r.status); glbTxt = true; } // base64-копия для хостинга без .gz
        if (c) c.put('glb/' + f, r.clone()).catch(() => { });
      }
      u = new Uint8Array(await r.arrayBuffer());
      if (u[0] === 0x48 && u[1] === 0x34 && u[2] === 0x73) { const s = atob(new TextDecoder().decode(u).trim()); u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); }
    }
    if (u[0] === 0x1f && u[1] === 0x8b) u = new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    return u.buffer;
  }
  // как в катсцене: склеить примитивы обратно в один меш, вернуть исходные имена, меш со скином — в ноль
  function fixGlb(root, clips) {
    for (const c of clips) for (const tr of c.tracks) { const nn = THREE.PropertyBinding.parseTrackName(tr.name).nodeName; const ob = root.getObjectByName(nn); if (ob && ob.userData.oname !== undefined) tr.name = ob.userData.oname + tr.name.slice(nn.length); }
    const grp = []; root.traverse(o => { if (o.isMesh) return; const ms = o.children.filter(c => c.isMesh); if (ms.length > 1 && ms.every(m => m.geometry.attributes.position === ms[0].geometry.attributes.position)) grp.push([o, ms]); });
    for (const [o, ms] of grp) {
      const g0 = ms[0].geometry, geo = new THREE.BufferGeometry(); for (const k in g0.attributes) geo.setAttribute(k, g0.attributes[k]);
      let cnt = 0; for (const m of ms) cnt += m.geometry.index.count; const idx = new Uint32Array(cnt); let s = 0;
      ms.forEach((m, i) => { const ix = m.geometry.index.array; idx.set(ix, s); geo.addGroup(s, ix.length, i); s += ix.length; }); geo.setIndex(new THREE.BufferAttribute(idx, 1));
      const mats = ms.map(m => m.material); let nm; if (ms[0].isSkinnedMesh) { nm = new THREE.SkinnedMesh(geo, mats); nm.bind(ms[0].skeleton, ms[0].bindMatrix); } else nm = new THREE.Mesh(geo, mats);
      nm.name = o.name; nm.userData = o.userData; nm.position.copy(o.position); nm.quaternion.copy(o.quaternion); nm.scale.copy(o.scale);
      const par = o.parent; par.add(nm); o.children.filter(c => !c.isMesh).forEach(c => nm.add(c)); par.remove(o);
    }
    root.traverse(o => { if (o.userData.oname !== undefined) o.name = o.userData.oname; });
    root.traverse(o => { if (o.isSkinnedMesh) { o.position.set(0, 0, 0); o.quaternion.identity(); o.scale.set(1, 1, 1); o.bind(o.skeleton, new THREE.Matrix4()); } });
    // один общий скелет на модель вместо копии у каждой части
    { const sk = []; const same = (a, b) => { if (a.bones.length !== b.bones.length) return false; for (let i = 0; i < a.bones.length; i++) { if (a.bones[i] !== b.bones[i]) return false; const x = a.boneInverses[i].elements, y = b.boneInverses[i].elements; for (let k = 0; k < 16; k++) if (Math.abs(x[k] - y[k]) > 1e-5) return false; } return true; };
      root.traverse(o => { if (!o.isSkinnedMesh) return; const s = sk.find(q => same(q, o.skeleton)); if (s) o.skeleton = s; else sk.push(o.skeleton); }); }
  }
  async function model(n) {
    const buf = await bin(n);
    const r = await new Promise((res, rej) => new THREE.GLTFLoader().parse(buf, '', res, rej));
    const g = r.scene.children.length === 1 ? r.scene.children[0] : r.scene; if (g.parent) g.parent.remove(g);
    fixGlb(g, r.animations); g.animations = r.animations;
    if (LITE && /_v\d+_\d+$/.test(n)) { const S = await simplifier(); if (S) liteMesh(g, S); }
    return g;
  }
  // телефон: облегчаем сетку героев (meshoptimizer убирает треугольники, вершины с весами костей те же) — как в катсцене. ?lite=0 / ?lite=1
  const LITE = /[?&]lite=1/.test(location.search) || (!/[?&]lite=0/.test(location.search) && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform))));
  let _ms = null;
  function simplifier() { return _ms || (_ms = import('https://cdn.jsdelivr.net/npm/meshoptimizer@0.21.0/meshopt_simplifier.module.js').then(async m => { await m.MeshoptSimplifier.ready; return m.MeshoptSimplifier; }).catch(() => null)); }
  function liteMesh(root, S) {
    root.traverse(o => {
      if (!o.isMesh) return; const geo = o.geometry, pa = geo.attributes.position;
      if (!geo.index || pa.isInterleavedBufferAttribute || pa.itemSize !== 3 || !(pa.array instanceof Float32Array)) return;
      const src = geo.index.array, hadG = geo.groups.length > 0, grs = hadG ? geo.groups.slice() : [{ start: 0, count: src.length, materialIndex: 0 }];
      const out = new Uint32Array(src.length); let k = 0; const ng = [];
      for (const gr of grs) {
        const sub = new Uint32Array(src.subarray(gr.start, gr.start + gr.count)); let res = sub;
        if (sub.length >= 1500) { const r2 = S.simplify(sub, pa.array, 3, Math.floor(sub.length * .65 / 3) * 3, .0015, ["Sparse"])[0]; if (r2.length >= 3) res = r2; }
        out.set(res, k); ng.push([k, res.length, gr.materialIndex]); k += res.length;
      }
      geo.setIndex(new THREE.BufferAttribute(out.slice(0, k), 1)); geo.clearGroups(); if (hadG) ng.forEach(x => geo.addGroup(x[0], x[1], x[2]));
    });
  }
  const cache = {};
  function load(id, fresh) {
    if (cache[id] && !fresh) return cache[id];
    const p = (async () => {
      await ensureLibs();
      const base = FILES[id][0].replace(/\.txt$/, '');
      const pg = model(base), pi = model(id + '_idle').catch(() => null), pw = fresh && id !== 'warden' ? model(id + '_walk').catch(() => null) : Promise.resolve(null);
      const g = await pg;
      const ig = await pi, wg = await pw;
      let idle = ig ? ig.animations[0] || null : null;
      let walk = wg ? wg.animations[0] || null : null;
      // Смотритель (MPFB) со своими длинами костей: из старого клипа берём только повороты
      // и без ног/таза: чужой клип сгибает ему колени и валит корпус вперёд — стоит прямо, живут руки, голова и плечи
      if (id === 'warden' && idle) { idle = idle.clone(); idle.tracks = idle.tracks.filter(tr => !/\.(position|scale)$/.test(tr.name) && !/(Hips|UpLeg|Leg|Foot|ToeBase|Toe_End|Spine\d?|Shoulder|Arm|ForeArm|Hand)\.quaternion$/.test(tr.name)); }
      return { g, idle: idle || g.animations[0] || null, walk };
    })();
    if (!fresh) cache[id] = p;
    return p;
  }

  function bones(g) { const B = {}; g.traverse(o => { if (o.isBone) { const n = o.name.replace(/^mixamorig:?/, ''); if (!B[n]) B[n] = o; } }); return B; }

  // материалы в стиле пролога: мягкий PBR, ткань матовая
  function fixMaterials(g, id) {
    g.traverse(o => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      o.castShadow = false; o.receiveShadow = false;
      if (HIDE[id].includes(o.name)) o.visible = false;
      const conv = m => {
        const s = new THREE.MeshStandardMaterial({ map: m.map || null, normalMap: m.normalMap || null, color: m.color || new THREE.Color(1, 1, 1), emissive: m.emissive || new THREE.Color(0, 0, 0), emissiveMap: m.emissiveMap || null, transparent: m.transparent, opacity: m.opacity, alphaMap: m.alphaMap || null, side: o.name.startsWith('X_') ? THREE.DoubleSide : m.side, skinning: true, roughness: .72, metalness: 0 });
        if (s.map) s.map.encoding = THREE.sRGBEncoding;
        if (/Metal|Plate|Armor|Paladin/i.test(m.name || '')) { s.metalness = .55; s.roughness = .4; }
        if (id === 'warden' && !s.emissiveMap) s.emissive = new THREE.Color(0, 0, 0);
        if (/^(Hair|Brows)_MAT/.test(m.name || '')) { s.transparent = false; s.alphaTest = .45; s.side = THREE.DoubleSide; }
        if (/^Gold_MAT/.test(m.name || '')) { s.metalness = .55; s.roughness = .32; s.color.setRGB(1, .78, .4); }
        return s;
      };
      o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
    });
  }

  // посадить на лавку: бедро направляем вперёд, голень — вниз к полу (под каждую модель отдельно)
  const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _qp = new THREE.Quaternion();
  function aim(bone, child, dir) {
    bone.updateMatrixWorld(true);
    bone.getWorldPosition(_v1); child.getWorldPosition(_v2);
    const cur = _v2.sub(_v1).normalize();
    const rot = new THREE.Quaternion().setFromUnitVectors(cur, dir.clone().normalize());
    bone.getWorldQuaternion(_q);
    const want = rot.multiply(_q);                       // нужный мировой поворот кости
    bone.parent.getWorldQuaternion(_qp);
    bone.quaternion.copy(_qp.invert().multiply(want));    // в локальный
    bone.updateMatrixWorld(true);
  }
  function sit(B, root) {
    root.updateMatrixWorld(true);
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
    for (const s of ['Left', 'Right']) {
      const up = B[s + 'UpLeg'], lg = B[s + 'Leg'], ft = B[s + 'Foot'], toe = B[s + 'ToeBase'];
      if (!up || !lg || !ft) continue;
      const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), fwd).multiplyScalar(s === 'Left' ? .12 : -.12);
      aim(up, lg, fwd.clone().add(side).add(new THREE.Vector3(0, -.06, 0)));
      // голень: вниз, чуть вперёд, чтобы ступня встала на пол
      const a = new THREE.Vector3(), b = new THREE.Vector3();
      lg.getWorldPosition(a); ft.getWorldPosition(b);
      const L = a.distanceTo(b), h = a.y - root.getWorldPosition(new THREE.Vector3()).y - .08;
      const down = Math.min(L, Math.max(.05, h)), ahead = Math.sqrt(Math.max(0, L * L - down * down));
      aim(lg, ft, fwd.clone().multiplyScalar(ahead + .02).add(side.clone().multiplyScalar(.2)).add(new THREE.Vector3(0, -down, 0)));
      if (toe) aim(ft, toe, fwd.clone().add(new THREE.Vector3(0, -.15, 0)));
    }
  }

  // Смотритель держит руки за спиной (как его простая фигура): плечо вниз и чуть назад, предплечье — за поясницу
  function handsBehind(B, root) {
    root.updateMatrixWorld(true);
    const q = root.getWorldQuaternion(new THREE.Quaternion());
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q), left = new THREE.Vector3(1, 0, 0).applyQuaternion(q), up = new THREE.Vector3(0, 1, 0);
    for (const [s, k] of [['Left', 1], ['Right', -1]]) {
      const ua = B[s + 'Arm'], fa = B[s + 'ForeArm'], hd = B[s + 'Hand'];
      if (!ua || !fa || !hd) continue;
      aim(ua, fa, up.clone().multiplyScalar(-1).addScaledVector(fwd, -.32).addScaledVector(left, k * .12));
      aim(fa, hd, left.clone().multiplyScalar(-k * .95).addScaledVector(fwd, -.38).addScaledVector(up, .28));
    }
  }
  // Смотритель (MPFB): клип не двигает ноги, и в позе покоя колени согнуты вперёд, таз выдвинут — «куриные» ноги.
  // Ставим ноги прямо: бедро и голень — строго вниз, стопы чуть врозь.
  function straightLegs(B, root) {
    root.updateMatrixWorld(true);
    const q = root.getWorldQuaternion(new THREE.Quaternion());
    const left = new THREE.Vector3(1, 0, 0).applyQuaternion(q), fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q), down = new THREE.Vector3(0, -1, 0);
    for (const [s, k] of [['Left', 1], ['Right', -1]]) {
      const ul = B[s + 'UpLeg'], lg = B[s + 'Leg'], ft = B[s + 'Foot'], toe = B[s + 'ToeBase'];
      if (!ul || !lg || !ft) continue;
      aim(ul, lg, down.clone().addScaledVector(left, k * .04));
      aim(lg, ft, down.clone().addScaledVector(fwd, -.02));
      if (toe) aim(ft, toe, fwd.clone().addScaledVector(down, .45));
    }
  }
  async function attach(n, seated) {
    const id = MODEL[n.id.replace(/^b_/, '')];
    if (!id) return;
    let m;
    try { m = await load(id); } catch (e) { console.warn('3D-модель не загрузилась:', id, e); return; }
    const g = THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(m.g) : m.g;
    fixMaterials(g, id);
    const B = bones(g);
    // рост по позе покоя
    const box = new THREE.Box3().setFromObject(g);
    g.scale.setScalar(HEIGHT[id] / (box.max.y - box.min.y));
    const holder = new THREE.Group();
    holder.add(g);
    if (m.idle) {
      const clip = m.idle.clone();
      clip.tracks = clip.tracks.filter(tr => {
        const bn = tr.name.split('.')[0].replace(/^mixamorig:?/, '');
        if (seated && LEGS.test(bn)) return false;                         // ноги держим в сидячей позе
        if (/Hips$/.test(bn) && tr.name.endsWith('.position')) return false; // не уезжаем с места
        return true;
      });
      const mx = new THREE.AnimationMixer(g);
      const a = mx.clipAction(clip); a.play(); a.time = Math.random() * clip.duration;
      mx.__post = () => { if (n.__h3 && n.__h3.walk) n.__h3.blend(); if (window.UPRIGHT) UPRIGHT(B, holder, seated ? { lean: .1 } : null); if (n.__pose) n.__pose(B, holder); };   // выпрямить спину после клипа; кино: ходьба и удары
      MIXERS.push(mx);
      n.__h3 = { B, holder, mx, idle: a };
      // кино: фигура героя ходит своим клипом ходьбы (вес — от скорости актёра), а не скользит стоя
      if (n.film && !seated && id !== 'warden') model(id + '_walk').then(wg => {
        const wc0 = wg && wg.animations[0]; if (!wc0) return;
        const wc = wc0.clone(); wc.tracks = wc.tracks.filter(tr => !(/Hips$/.test(tr.name.split('.')[0]) && tr.name.endsWith('.position')));
        const wa = mx.clipAction(wc); wa.play(); wa.setEffectiveWeight(0);
        const h = n.__h3; h.walk = wa; h.w = 0;
        h.blend = () => { const sp = (n.st.film && n.st.film.speed) || 0, tw = Math.min(1, sp * 1.2); h.w += (tw - h.w) * .25; wa.setEffectiveWeight(h.w); a.setEffectiveWeight(1 - h.w); wa.timeScale = Math.max(.6, Math.min(1.8, sp || 1)); };
      }).catch(() => { });
    }
    g.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(g);
    // простую фигуру прячем, 3D-модель кладём в тот же узел (позиция, поворот, видимость — общие)
    n.st.root.children.forEach(c => { c.visible = false; });
    n.st.root.add(holder);
    if (seated && B.Hips) {
      n.st.root.updateMatrixWorld(true);
      const hp = new THREE.Vector3(); B.Hips.getWorldPosition(hp); holder.worldToLocal(hp);
      g.position.y += (n.seatY || .45) + .17 - hp.y; // сиденье лавки на высоте ~.49, бёдра чуть выше
      g.position.z = Heroes3D.SIT_BACK;
      sit(B, holder);
    } else {
      g.position.y = -b2.min.y;
      if (id === 'warden') { straightLegs(B, holder); handsBehind(B, holder);
        // ноги стали длиннее — ставим стопы на пол по кости стопы
        if (B.LeftFoot) { n.st.root.updateMatrixWorld(true); const fp = new THREE.Vector3(); B.LeftFoot.getWorldPosition(fp); holder.worldToLocal(fp); g.position.y += .085 - fp.y; } }
    }
    if (window.UPRIGHT) UPRIGHT(B, holder, seated ? { lean: .1 } : null);
    n.model3d = holder;
    if (window.Passengers3D && Passengers3D.blob) Passengers3D.blob(n.st.root, seated);
  }

  let last = performance.now();
  (function loop(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    // спрятанных (другая локация, не в кадре сюжета) не анимируем — к финалу их десятки
    for (const mx of MIXERS) { let o = mx.getRoot(), v = true; for (; o; o = o.parent) if (!o.visible) { v = false; break; } if (v) { mx.update(dt); if (mx.__post) mx.__post(); } }
    requestAnimationFrame(loop);
  })(last);


  // ---------- вид от третьего лица: камера за спиной, герой виден целиком ----------
  const TP = { on: false, body: null, id: null, loading: false, mixer: null, aIdle: null, aWalk: null, walking: false, dist: 2.3 };
  try { TP.on = localStorage.getItem('train_tp') === '1'; } catch (e) { }
  const lockRoot = c => { if (!c) return null; c = c.clone(); for (const tr of c.tracks) if (/Hips\.position$/.test(tr.name)) { const v = tr.values, x0 = v[0], z0 = v[2]; for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; } } return c; };
  async function ensureBody() {
    const id = MODEL[typeof S !== 'undefined' && S.hero];
    if (!id || TP.id === id || TP.loading) return;
    TP.loading = true;
    try {
      const m = await load(id, true);
      if (TP.body) scene.remove(TP.body);
      const g = m.g; fixMaterials(g, id);
      const box = new THREE.Box3().setFromObject(g);
      g.scale.setScalar(HEIGHT[id] / (box.max.y - box.min.y));
      g.updateMatrixWorld(true);
      const b2 = new THREE.Box3().setFromObject(g); g.position.y = -b2.min.y;
      const holder = new THREE.Group(); holder.add(g); holder.visible = false; scene.add(holder);
      TP.mixer = new THREE.AnimationMixer(g);
      TP.aIdle = m.idle ? TP.mixer.clipAction(lockRoot(m.idle)) : null;
      TP.aWalk = m.walk ? TP.mixer.clipAction(lockRoot(m.walk)) : null;
      if (TP.aIdle) TP.aIdle.play();
      TP.walking = false; TP.body = holder; TP.id = id; TP.B = bones(g);
    } catch (e) { console.warn('модель героя не загрузилась', e); }
    TP.loading = false;
  }
  function setTP(on) {
    TP.on = on;
    try { localStorage.setItem('train_tp', on ? '1' : '0'); } catch (e) { }
    if (btn) { btn.classList.toggle('on', on); btn.title = on ? 'Вид от первого лица (V)' : 'Вид от третьего лица (V)'; btn.textContent = on ? '1' : '3'; }
    if (on) ensureBody();
  }
  let btn = null;
  function makeButton() {
    btn = document.createElement('button');
    btn.id = 'tpBtn'; btn.className = 'tab r';
    btn.style.cssText = 'top:162px;font:600 16px system-ui,sans-serif;z-index:40';
    btn.onclick = e => { e.stopPropagation(); setTP(!TP.on); btn.blur(); };
    document.body.appendChild(btn);
    setTP(TP.on);
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', makeButton); else makeButton();
  addEventListener('keydown', e => {
    if (e.code !== 'KeyV' || e.repeat || (typeof D !== 'undefined' && D.on)) return;
    const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;
    setTP(!TP.on);
  });
  const _c = new THREE.Vector3(), _h = new THREE.Vector3();
  const TPK = { executioner: 1.25, chronicler: 1.35 };
  // вызывается из tick() игры после установки камеры от первого лица
  function thirdPerson(dt, moving, run, eye) {
    const show = TP.on && !(typeof D !== 'undefined' && D.on);
    if (TP.mixer) { TP.mixer.update(dt); if (TP.body && TP.B && window.UPRIGHT) UPRIGHT(TP.B, TP.body, TP.walking ? { lean: .12 } : null); }
    if (!TP.body) { if (TP.on) ensureBody(); return; }
    if (TP.id !== MODEL[S.hero]) ensureBody();
    TP.body.visible = show;
    if (!show) return;
    const fy = P.fy || 0;
    TP.body.position.set(P.x, fy, P.z);
    TP.body.rotation.y = P.yaw + Math.PI;
    const w = moving && TP.aWalk;
    if (w !== TP.walking) {
      TP.walking = w;
      const from = w ? TP.aIdle : TP.aWalk, to = w ? TP.aWalk : TP.aIdle;
      if (to) { to.reset().play(); if (from) to.crossFadeFrom(from, .25, false); }
    }
    if (TP.aWalk) TP.aWalk.timeScale = run ? 1.7 : 1;
    // камера за спиной: отодвигаемся, пока не упрёмся в стену
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    // крупные модели (палач, летописец с кольцом за спиной) — камера дальше и выше
    const k = TPK[TP.id] || 1;
    let d = .3; const want = TP.dist * k;
    while (d < want && window.inside(P.x - fx * (d + .25), P.z - fz * (d + .25))) d += .1;
    const ch = Math.cos(P.pitch), cy = Math.sin(P.pitch);
    _h.set(P.x, fy + eye * .95, P.z);
    _c.set(P.x - fx * d * ch, fy + eye * .95 + .35 + (k - 1) * .5 - cy * d, P.z - fz * d * ch);
    camera.position.copy(_c);
    camera.lookAt(_h.x + fx * .6, _h.y + cy * .6, _h.z + fz * .6);
  }

  window.Heroes3D = {
    SIT_BACK: -0.03,   // было −0.11: спины героев уходили в спинку скамейки
    station(L, sm) {
      if (sm) attach(sm, false);
      (L.bench || []).forEach(n => attach(n, true));
      if (L.crow) L.crow.visible = false; // у Мирона ворон уже на плече модели
    },
    attach, load, thirdPerson, setTP, get tp() { return TP.on; }, _tp: TP, _txt: txt, _parse: parse, _libs: ensureLibs, _script: script, CDN
  };
})();
