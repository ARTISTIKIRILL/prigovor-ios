// Постобработка в игре, как в прологе: мягкое свечение ламп (bloom) и затемнение по краям кадра.
// Включается после загрузки модулей three r128; если что-то не загрузилось — игра рисует как раньше.
// Если в главном меню (Android) выключено «Свечение», постобработки нет.
(function () {
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
  const FILES = ['shaders/CopyShader.js', 'shaders/LuminosityHighPassShader.js', 'postprocessing/EffectComposer.js',
    'postprocessing/RenderPass.js', 'postprocessing/ShaderPass.js', 'postprocessing/UnrealBloomPass.js'];
  const FX = { ready: false, composer: null, bloom: null };
  window.GameFX = FX;
  if (window.GFX && GFX.bloom === false) return;

  const load = u => new Promise((res, rej) => { const s = document.createElement('script'); s.src = CDN + u; s.onload = res; s.onerror = rej; document.head.appendChild(s); });

  // финальный проход: перевод в sRGB (композер работает в линейном цвете), сглаживание краёв (FXAA),
  // лёгкий контраст и виньетка. Сглаживание холста при постобработке не работает (кадр рисуется
  // во внутренний буфер без MSAA), поэтому края сглаживаем здесь — это дешевле MSAA.
  const Final = {
    uniforms: { tDiffuse: { value: null }, vig: { value: .42 }, contrast: { value: 1.06 }, px: { value: new THREE.Vector2(1 / 1280, 1 / 720) }, aa: { value: 1 },
      // цветокоррекция под локацию (atmo.js): тени/света с оттенком, насыщенность, плёночное зерно
      lift: { value: new THREE.Vector3(1, 1, 1) }, gain: { value: new THREE.Vector3(1, 1, 1) }, sat: { value: 1 }, grain: { value: 0 }, time: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float vig; uniform float contrast; uniform vec2 px; uniform float aa; uniform vec3 lift; uniform vec3 gain; uniform float sat; uniform float grain; uniform float time; varying vec2 vUv;',
      'vec3 toSRGB(vec3 c){ return mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308)))); }',
      'vec3 S(vec2 u){ return toSRGB(max(texture2D(tDiffuse, u).rgb, 0.0)); }',
      'float L(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
      'vec3 fxaa(vec2 u){',
      '  vec3 m = S(u); if (aa < 0.5) return m;',
      '  float nw = L(S(u + vec2(-1.0, -1.0) * px)), ne = L(S(u + vec2(1.0, -1.0) * px)), sw = L(S(u + vec2(-1.0, 1.0) * px)), se = L(S(u + vec2(1.0, 1.0) * px)), lm = L(m);',
      '  float lo = min(lm, min(min(nw, ne), min(sw, se))), hi = max(lm, max(max(nw, ne), max(sw, se)));',
      '  if (hi - lo < max(0.0312, hi * 0.125)) return m;',
      '  vec2 d = vec2(-((nw + ne) - (sw + se)), (nw + sw) - (ne + se));',
      '  float r = 1.0 / (min(abs(d.x), abs(d.y)) + max((nw + ne + sw + se) * 0.03125, 1.0 / 128.0));',
      '  d = clamp(d * r, vec2(-8.0), vec2(8.0)) * px;',
      '  vec3 a = 0.5 * (S(u + d * (1.0 / 3.0 - 0.5)) + S(u + d * (2.0 / 3.0 - 0.5)));',
      '  vec3 b = a * 0.5 + 0.25 * (S(u - d * 0.5) + S(u + d * 0.5));',
      '  float lb = L(b); return (lb < lo || lb > hi) ? a : b;',
      '}',
      'void main(){',
      '  vec3 c = fxaa(vUv);',
      '  float l = L(c); c = max(mix(vec3(l), c, sat), 0.0);',
      '  c *= mix(lift, gain, smoothstep(0.05, 0.8, l));',
      '  c = (c - 0.5) * contrast + 0.5;',
      '  vec2 g = floor(vUv / px); c += (fract(sin(dot(g + fract(time) * 61.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * grain;',
      '  float d = length((vUv - 0.5) * vec2(1.15, 1.0));',
      '  c *= mix(1.0, smoothstep(0.95, 0.32, d), vig);',
      '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
      '}'].join('\n')
  };

  async function init() {
    try {
      for (const f of FILES) await load(f);
      if (typeof renderer === 'undefined' || !THREE.EffectComposer) return;
      const size = renderer.getSize(new THREE.Vector2());
      const c = new THREE.EffectComposer(renderer);
      c.addPass(new THREE.RenderPass(scene, camera));
      const b = new THREE.UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), .55, .45, .82);
      // свечение размытое — считаем его в четверть разрешения вместо половины: в 4 раза меньше работы, разницы не видно
      const bs = b.setSize.bind(b); b.setSize = (w, h) => bs(Math.max(2, w / 2), Math.max(2, h / 2));
      c.addPass(b);
      const fin = new THREE.ShaderPass(Final); c.addPass(fin);
      fin.uniforms.aa.value = window.GFX && GFX.aa === false ? 0 : 1;
      FX.composer = c; FX.bloom = b; FX.final = fin;
      const ds = new THREE.Vector2();
      FX.render = () => { renderer.getDrawingBufferSize(ds); fin.uniforms.px.value.set(1 / ds.x, 1 / ds.y); fin.uniforms.time.value = (performance.now() / 1000) % 100; if (FX.onFrame) FX.onFrame(fin.uniforms); c.render(); };
      // размер и чёткость композера меняет resize() игры (index.html) — он же подстраивает чёткость по скорости
      c.setPixelRatio(renderer.getPixelRatio()); c.setSize(innerWidth, innerHeight);
      FX.ready = true;
    } catch (e) { console.warn('Постобработка не загрузилась, рисуем без неё', e); }
  }
  if (document.readyState === 'complete') init(); else addEventListener('load', init);
})();
