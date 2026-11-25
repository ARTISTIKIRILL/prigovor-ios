// Тепло и батарея. Подключается первым скриптом и в игре, и в прологе (cs/index.html).
// 1) Ограничение кадров для всех циклов страницы сразу: на экранах 120 Гц (новые Mac, iPad, iPhone Pro)
//    браузер зовёт requestAnimationFrame 120 раз в секунду — игра рисовала вдвое больше кадров, чем нужно,
//    и грела машину. Предел — из настроек графики (GFX.fps; 0 = без предела), по умолчанию 60.
// 2) Меньше кадров, когда смотреть не на что: открыт диалог/записка/итог дела или игрок давно ничего
//    не трогает (POWER.idle → 30 к/с), окно не в фокусе (20 к/с), игру закрывает пролог (POWER.cover → 4 к/с).
// 3) Подстройка чёткости (POWER.dyn): если кадры стабильно не успевают, картинка рисуется в меньшем разрешении,
//    когда запас появляется — возвращается обратно. Применяет игра через POWER.onRes.
(function () {
  if (window.POWER) return;
  const W = window, raf0 = W.requestAnimationFrame.bind(W), now = () => performance.now();
  const P = W.POWER = { idle: false, cover: false, dyn: 1, minDyn: W.GFX && W.GFX.phone ? 0.55 : 0.7, onRes: null, fps: 0 };
  let lastInput = now(), blurred = false;
  const touch = () => { lastInput = now(); blurred = false; };
  ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'].forEach(e => addEventListener(e, touch, { passive: true, capture: true }));
  addEventListener('blur', () => { blurred = true; });
  addEventListener('focus', () => { blurred = false; });
  P.sinceInput = () => now() - lastInput;
  function focused() {
    if (!blurred) return true;
    try { if (document.hasFocus()) return true; if (W.top !== W && W.top.document.hasFocus()) return true; } catch (e) { return true; }
    return false;
  }
  function cap() {
    if (W.__virt && W.__virt.on) return 0; // запись кино (film/): кадры шагают по виртуальным часам
    const g = W.GFX; let c = g && typeof g.fps === 'number' ? g.fps : 60;
    if (P.cover) return 4;
    if (!focused()) c = Math.min(c || 60, 20);
    if (P.idle) c = Math.min(c || 60, 30);
    return c;
  }
  P.cap = cap;
  // Все циклы страницы получают один и тот же кадр: первый колбэк кадра решает, пропускать ли его,
  // остальные колбэки с той же меткой времени следуют решению (иначе часть циклов голодала бы).
  let admit = -1, lastT = -1e9, skipT = -1;
  W.requestAnimationFrame = function (cb) {
    return raf0(function loop(t) {
      if (t !== admit) {
        if (t === skipT) { raf0(loop); return; }
        const c = cap(), st = c ? 1000 / c : 0;
        if (st && t - lastT < st * 0.8) { skipT = t; raf0(loop); return; }
        admit = t; frame(t - lastT, st); lastT = t;
      }
      cb(t);
    });
  };

  // ---- подстройка чёткости: медиана интервалов за секунду против целевого шага
  let iv = [], winT = 0, good = 0, bad = 0;
  function frame(d, st) {
    if (d > 0 && d < 500) iv.push(d);
    const t = now();
    if (t - winT < 1000) return;
    winT = t;
    const s = iv.sort((a, b) => a - b), med = s.length ? s[s.length >> 1] : 0; iv = [];
    P.fps = med ? Math.round(1000 / med) : 0;
    if (!P.onRes || P.cover || !st || s.length < 8 || document.hidden) return;
    // две плохие секунды подряд (одиночный рывок при входе в локацию не в счёт) — чуть меньше чёткость;
    // шесть хороших подряд — обратно
    if (med > st * 1.3) { good = 0; if (++bad >= 2 && P.dyn > P.minDyn) { P.dyn = Math.max(P.minDyn, +(P.dyn - 0.1).toFixed(2)); bad = 0; P.onRes(); } }
    else if (med < st * 1.08) { bad = 0; if (++good >= 6 && P.dyn < 1) { P.dyn = Math.min(1, +(P.dyn + 0.05).toFixed(2)); good = 0; P.onRes(); } }
    else { good = 0; bad = 0; }
  }
})();
