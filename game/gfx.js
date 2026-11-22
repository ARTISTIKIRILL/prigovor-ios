// Настройки графики игрока (их задаёт главный экран menu.html). Подключается первым скриптом
// и в игре, и в катсцене: ограничивает частоту кадров и даёт window.GFX для рендера.
(function () {
  var DEF = { q: 'high', scale: 1, aa: true, bloom: true, dust: true, fps: 60, people: true };
  var PRESETS = {
    low:    { scale: 0.6,  aa: false, bloom: false, dust: false, fps: 30, people: false },
    medium: { scale: 0.8,  aa: false, bloom: true,  dust: true,  fps: 60, people: true },
    high:   { scale: 1.0,  aa: true,  bloom: true,  dust: true,  fps: 60, people: true },
    ultra:  { scale: 1.35, aa: true,  bloom: true,  dust: true,  fps: 0, people: true }
  };
  var g = {};
  try { g = JSON.parse(localStorage.getItem('prigovor_gfx') || '{}') || {}; } catch (e) { g = {}; }
  for (var k in DEF) if (!(k in g)) g[k] = DEF[k];
  g.PRESETS = PRESETS;
  // множитель чёткости: применяется к devicePixelRatio, который выбирает игра
  g.pr = function (base) { return Math.max(0.5, base * g.scale); };
  window.GFX = g;

  // ограничение кадров: 30 к/с экономит батарею на слабых телефонах
  if (g.fps && g.fps < 60) {
    var raf = window.requestAnimationFrame.bind(window), step = 1000 / g.fps, last = 0;
    window.requestAnimationFrame = function (cb) {
      return raf(function loop(t) {
        if (t - last >= step - 2) { last = t; cb(t); } else raf(loop);
      });
    };
  }

  // игра на three r128 создаёт рендер через глобальный THREE: подменяем сглаживание и чёткость
  function patchThree() {
    if (!window.THREE || !THREE.WebGLRenderer || THREE.WebGLRenderer.__gfx) return false;
    var R = THREE.WebGLRenderer;
    var W = function (o) {
      o = Object.assign({}, o || {}, { antialias: !!g.aa });
      var r = new R(o);
      var sp = r.setPixelRatio.bind(r);
      r.setPixelRatio = function (v) { sp(g.pr(v)); };
      return r;
    };
    W.prototype = R.prototype;
    W.__gfx = true;
    THREE.WebGLRenderer = W;
    return true;
  }
  window.GFX.patchThree = patchThree;
})();
