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

  // финальный проход: перевод в sRGB (композер работает в линейном цвете), лёгкий контраст и виньетка
  const Final = {
    uniforms: { tDiffuse: { value: null }, vig: { value: .42 }, contrast: { value: 1.06 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float vig; uniform float contrast; varying vec2 vUv;',
      'vec3 toSRGB(vec3 c){ return mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308)))); }',
      'void main(){',
      '  vec3 c = toSRGB(max(texture2D(tDiffuse, vUv).rgb, 0.0));',
      '  c = (c - 0.5) * contrast + 0.5;',
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
      c.addPass(b);
      c.addPass(new THREE.ShaderPass(Final));
      FX.composer = c; FX.bloom = b;
      FX.render = () => c.render();
      addEventListener('resize', () => c.setSize(innerWidth, innerHeight));
      c.setSize(innerWidth, innerHeight);
      FX.ready = true;
    } catch (e) { console.warn('Постобработка не загрузилась, рисуем без неё', e); }
  }
  if (document.readyState === 'complete') init(); else addEventListener('load', init);
})();
