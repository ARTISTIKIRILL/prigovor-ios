// Настройки графики игрока (их задаёт главный экран menu.html). Подключается первым скриптом
// и в игре, и в катсцене: ограничивает частоту кадров и даёт window.GFX для рендера.
(function () {
  var DEF = { q: 'high', scale: 1, aa: true, bloom: true, dust: true, fps: 60, people: true };
  var PRESETS = {
    low:    { scale: 0.6,  aa: false, bloom: false, dust: false, fps: 30, people: false },
    medium: { scale: 0.75, aa: true,  bloom: false, dust: false, fps: 30, people: true },
    high:   { scale: 1.0,  aa: true,  bloom: true,  dust: true,  fps: 60, people: true },
    ultra:  { scale: 1.35, aa: true,  bloom: true,  dust: true,  fps: 0, people: true }
  };
  var g = {};
  try { g = JSON.parse(localStorage.getItem('prigovor_gfx') || '{}') || {}; } catch (e) { g = {}; }
  for (var k in DEF) if (!(k in g)) g[k] = DEF[k];
  // v2: на телефоне «Средняя» стала легче (без свечения и пыли) — старую сохранённую «Среднюю» переводим на новую
  if (g.v !== 2) {
    var phone = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (phone && g.scale === 0.8 && g.bloom === true && g.aa === false) { g.scale = 0.75; g.aa = true; g.bloom = false; g.dust = false; g.q = 'medium'; }
    g.v = 2;
  }
  // v3: телефон грелся — «Средняя» и «Низкая» теперь 30 к/с (60 можно вернуть в «Своя»)
  if (g.v !== 3) {
    if (/Android|iPhone|iPad/i.test(navigator.userAgent) && (g.q === 'medium' || g.q === 'low') && g.fps === 60) g.fps = 30;
    g.v = 3;
    try { localStorage.setItem('prigovor_gfx', JSON.stringify({ q: g.q, scale: g.scale, aa: g.aa, bloom: g.bloom, dust: g.dust, fps: g.fps, people: g.people, v: 3 })); } catch (e) { }
  }
  g.PRESETS = PRESETS;
  // множитель чёткости: применяется к devicePixelRatio, который выбирает игра
  g.pr = function (base) { return Math.max(0.5, base * g.scale); };
  window.GFX = g;

  // ограничение кадров (GFX.fps) делает power.js — он же сбавляет кадры в диалогах, без фокуса и под прологом.
  // Если power.js почему-то нет — простой предел здесь.
  if (!window.POWER && g.fps) {
    var raf = window.requestAnimationFrame.bind(window), step = 1000 / g.fps, last = 0, adm = -1, skp = -1;
    window.requestAnimationFrame = function (cb) {
      return raf(function loop(t) {
        if (t !== adm) { if (t === skp || t - last < step * 0.8) { skp = t; raf(loop); return; } adm = t; last = t; }
        cb(t);
      });
    };
  }

  // игра на three r128 создаёт рендер через глобальный THREE: подменяем сглаживание и чёткость
  function patchThree() {
    if (!window.THREE || !THREE.WebGLRenderer || THREE.WebGLRenderer.__gfx) return false;
    var R = THREE.WebGLRenderer;
    var W = function (o) {
      // при свечении кадр идёт через постобработку: сглаживание холста там бесполезно, края сглаживает FXAA
      o = Object.assign({}, o || {}, { antialias: !!g.aa && g.bloom === false });
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
