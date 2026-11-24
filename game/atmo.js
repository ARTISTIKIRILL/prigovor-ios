// Атмосфера и «киношность» почти без затрат:
// 1) цветокоррекция под локацию — оттенок теней и светов, насыщенность, лёгкое плёночное зерно
//    (параметры финального прохода gamefx.js; плавный переход при смене локации);
// 2) пылинки в воздухе — одно облако точек вокруг камеры, всё движение считает видеокарта (0 работы процессора);
// 3) анизотропная фильтрация текстур — полы и стены под острым углом остаются чёткими, а не мылом.
// Отключить: ?noatmo. Пылинки следуют настройке «Пыль» (GFX.dust), фильтрация — качеству (GFX.q).
(function () {
  if (/[?&]noatmo/.test(location.search)) return;
  // сцена, рендер и камера создаются в index.html после подключения модулей — запускаемся по load
  if (document.readyState === 'complete') init(); else addEventListener('load', init);
  function init() {
  if (typeof scene === 'undefined' || typeof renderer === 'undefined') return;
  const G = window.GFX || {};

  // ---------- 1. цветокоррекция ----------
  // lift — множитель для тёмных тонов, gain — для светлых (около 1: тёплые света, холодные тени и т. п.)
  const GRADE = {
    train:   { lift: [0.96, 0.99, 1.06], gain: [1.06, 1.00, 0.91], sat: 1.06 },  // тёплые лампы купе, синие тени ночи
    station: { lift: [0.95, 1.00, 1.07], gain: [1.03, 1.00, 0.96], sat: 0.94 },  // туманное утро
    boat:    { lift: [0.95, 1.00, 1.06], gain: [1.05, 1.00, 0.93], sat: 1.04 },  // ночь на реке, тёплое дерево
    monast:  { lift: [0.94, 0.99, 1.09], gain: [1.05, 1.00, 0.93], sat: 0.92 },  // луна и свечи
    polar:   { lift: [0.93, 1.00, 1.10], gain: [1.00, 1.00, 1.03], sat: 0.86 },  // пурга
    ball:    { lift: [1.00, 0.96, 1.05], gain: [1.07, 1.00, 0.90], sat: 1.10 },  // золото и бархат
    fort:    { lift: [0.96, 1.00, 1.05], gain: [1.05, 1.00, 0.93], sat: 0.90 },  // ночь перед боем
    noon:    { lift: [1.00, 1.00, 1.03], gain: [1.02, 1.00, 0.97], sat: 0.92 }   // белый полдень
  };
  const DEF = { lift: [1, 1, 1], gain: [1, 1, 1], sat: 1 };
  const cur = { lift: [1, 1, 1], gain: [1, 1, 1], sat: 1 };
  let lastT = performance.now();
  function grade(u) {
    const t = performance.now(), k = Math.min(1, (t - lastT) / 700); lastT = t;
    const g = GRADE[window.WORLD && WORLD.cur] || DEF;
    for (let i = 0; i < 3; i++) { cur.lift[i] += (g.lift[i] - cur.lift[i]) * k; cur.gain[i] += (g.gain[i] - cur.gain[i]) * k; }
    cur.sat += (g.sat - cur.sat) * k;
    u.lift.value.set(cur.lift[0], cur.lift[1], cur.lift[2]); u.gain.value.set(cur.gain[0], cur.gain[1], cur.gain[2]);
    u.sat.value = cur.sat; u.grain.value = G.q === 'low' ? 0 : 0.022;
  }
  (function hook() { if (window.GameFX) GameFX.onFrame = grade; else setTimeout(hook, 500); })();

  // ---------- 2. пылинки ----------
  // где летают и какого цвета (в пурге и на палубе — нет: там свой снег/ветер)
  const DUST = {
    train: [1.0, 0.82, 0.6], station: [0.85, 0.88, 0.95], monast: [1.0, 0.85, 0.65], ball: [1.0, 0.86, 0.6],
    fort: [1.0, 0.8, 0.6], noon: [1.0, 0.97, 0.9]
  };
  if (G.dust !== false) {
    const N = 420, BOX = 14, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = Math.random() * BOX; pos[i * 3 + 1] = Math.random() * 3.2 + 0.2; pos[i * 3 + 2] = Math.random() * BOX; seed[i] = Math.random(); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, cam: { value: new THREE.Vector3() }, col: { value: new THREE.Color(1, .85, .65) }, op: { value: 0 }, scale: { value: 300 }, far: { value: 12 } },
      vertexShader: [
        'attribute float seed; uniform float time; uniform vec3 cam; uniform float scale; uniform float far; varying float vA;',
        'void main(){',
        '  vec3 p = position + vec3(sin(time * 0.13 + seed * 40.0), sin(time * 0.21 + seed * 17.0) * 0.6 - time * 0.02, cos(time * 0.11 + seed * 23.0)) * 0.6;',
        '  p.xz = cam.xz + mod(p.xz - cam.xz + 7.0, 14.0) - 7.0;',
        '  p.y = mod(p.y, 3.4) + 0.15;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  float d = -mv.z;',
        '  vA = smoothstep(0.4, 1.2, d) * (1.0 - smoothstep(far * 0.5, far, d)) * (0.55 + 0.45 * sin(time * (0.7 + seed) + seed * 9.0));',
        '  gl_PointSize = clamp(scale * (0.6 + seed * 0.8) / max(d, 0.1), 1.0, 9.0);',
        '  gl_Position = projectionMatrix * mv;',
        '}'].join('\n'),
      fragmentShader: [
        'uniform vec3 col; uniform float op; varying float vA;',
        'void main(){ vec2 q = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(q)); gl_FragColor = vec4(col * a * vA * op, 1.0); }'].join('\n'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false; pts.renderOrder = 5; pts.userData.atmo = true;
    scene.add(pts);
    let op = 0;
    const t0 = performance.now();
    (function step() {
      requestAnimationFrame(step);
      const loc = window.WORLD && WORLD.cur, c = DUST[loc];
      const want = c ? (loc === 'noon' ? 0.16 : 0.24) : 0;
      op += (want - op) * 0.05;
      pts.visible = op > 0.005;
      if (!pts.visible) return;
      if (c) mat.uniforms.col.value.setRGB(c[0], c[1], c[2]);
      mat.uniforms.op.value = op;
      mat.uniforms.time.value = (performance.now() - t0) / 1000;
      mat.uniforms.cam.value.copy(camera.position);
      mat.uniforms.scale.value = 26 * renderer.getPixelRatio() * (innerHeight / 720);
      mat.uniforms.far.value = scene.fog ? Math.min(14, scene.fog.far) : 12;
    })();
  }

  // ---------- 3. анизотропная фильтрация ----------
  // Ставим только текстурам, которые ещё не ушли в видеокарту (иначе пришлось бы загружать заново — рывок).
  // Пока игру закрывает пролог, можно и перезагрузить: рывка никто не увидит.
  if (G.q !== 'low') {
    const maxA = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
    const A = Math.min(maxA, G.q === 'medium' ? 4 : 8);
    const KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'bumpMap'];
    const done = new WeakSet();
    function fix(tex) {
      if (!tex || done.has(tex) || !tex.isTexture || tex.isRenderTargetTexture || tex.isDataTexture || tex.isCubeTexture) return;
      if (tex.minFilter === THREE.NearestFilter || tex.minFilter === THREE.LinearFilter) { done.add(tex); return; } // без мипмапов — не нужно
      const up = renderer.properties.get(tex).__webglInit;
      if (up && !(window.POWER && POWER.cover)) return; // уже в видеокарте — подождём следующего «закрытого» момента или оставим
      done.add(tex);
      if (tex.anisotropy >= A) return;
      tex.anisotropy = A;
      if (up) tex.needsUpdate = true;
    }
    const look = o => { const m = o.material; if (!m) return; if (Array.isArray(m)) m.forEach(x => KEYS.forEach(k => fix(x[k]))); else KEYS.forEach(k => fix(m[k])); };
    // всё дерево (после сборки локации) или только видимое (раз в полторы секунды — новые люди, предметы)
    function scan() { if (A > 1) scene.traverse(look); }
    function scanVisible() { if (A > 1) scene.traverseVisible(look); }
    window.Atmo = { scan };
    scan();
    setInterval(scanVisible, 1500);
    // локации собираются заранее (prewarm.js) — ставим фильтрацию сразу после сборки, до первой отрисовки
    if (window.WORLD && WORLD.LOC) for (const k in WORLD.LOC) {
      const L = WORLD.LOC[k]; if (!L || typeof L.build !== 'function' || L.__atmo) continue;
      const b0 = L.build; L.build = function () { const r = b0.apply(this, arguments); try { scan(); } catch (e) { } return r; }; L.__atmo = true;
    }
  }
  }
})();
