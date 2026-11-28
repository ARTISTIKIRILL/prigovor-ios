// Озвучка реплик (нейроголоса, заранее записаны tools/voice/build.py в vo/<ключ>.mp3, список ключей — vo/index.js).
// Оборачивает nextLine/closeDialog из game.js: новая реплика — свой файл, прошлая останавливается. Пока голос звучит,
// «Авто» ждёт. Кнопка «Голос» в панели диалога, состояние в localStorage prig_voice. Реплик без файла (динамические) — тишина.
(function () {
  const KEYS = new Set(((window.VOICE_KEYS || '') + '').split(' ').filter(Boolean));
  const HEROES = ['rowen', 'miron', 'agata', 'tibo', 'gordey', 'evsey', 'margaret'];
  let on = true; try { on = localStorage.getItem('prig_voice') !== '0'; } catch (e) { }
  const au = new Audio(); au.preload = 'auto';
  let vol = 1;
  function fnv(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function keyOf(who, text) {
    let vid;
    if (who === null || who === undefined) vid = 'n';
    else if (who === 'det' || who === S.hero) vid = 'h:' + (S.hero || 'rowen');
    else vid = who;
    return fnv(vid + '|' + text);
  }
  function stop() { try { au.pause(); } catch (e) { } }
  function play(who, text) {
    stop();
    if (!on || !KEYS.size || typeof text !== 'string') return;
    const k = keyOf(who, text);
    if (!KEYS.has(k)) { const ms = window.__vmiss || (window.__vmiss = []); if (ms.length < 1500) ms.push([who, text]); return; }   // список немых реплик — для дозаписи
    au.src = 'vo/' + k + '.mp3'; au.volume = vol;
    const p = au.play(); if (p && p.catch) p.catch(() => { });
  }
  window.VOICE = { play, stop, get on() { return on; }, keyOf };

  const nl = window.nextLine;
  if (typeof nl === 'function') {
    window.nextLine = function () {
      const r = nl.apply(this, arguments);
      try { if (D.on && !D.choosing && D.q && D.q[D.i]) { const l = D.q[D.i]; play(l[0], l[2]); } else stop(); } catch (e) { }
      return r;
    };
  }
  const cd = window.closeDialog;
  if (typeof cd === 'function') window.closeDialog = function () { stop(); return cd.apply(this, arguments); };
  const sc = window.showChoices;
  if (typeof sc === 'function') window.showChoices = function () { stop(); return sc.apply(this, arguments); };

  // пока звучит голос, автолистание не перелистывает
  (function tick() { try { if (!au.paused && typeof D !== 'undefined' && D.on) D.autoT = 0; } catch (e) { } requestAnimationFrame(tick); })();

  // кнопка «Голос»
  const bar = document.getElementById('dlgbar');
  if (bar) {
    const b = document.createElement('button'); b.id = 'dlgvoice';
    const draw = () => { b.innerHTML = (on ? '🔊' : '🔈') + ' <span>Голос</span>'; b.classList.toggle('on', on); b.title = on ? 'Выключить озвучку (V)' : 'Включить озвучку (V)'; };
    const tog = () => { on = !on; try { localStorage.setItem('prig_voice', on ? '1' : '0'); } catch (e) { } draw(); if (!on) stop(); };
    b.addEventListener('pointerdown', e => e.stopPropagation());
    b.addEventListener('click', e => { e.stopPropagation(); tog(); });
    bar.insertBefore(b, bar.firstChild); draw();
    addEventListener('keydown', e => { if (e.code === 'KeyV' && !e.repeat && typeof D !== 'undefined' && D.on) tog(); });
  }
  // звук игры выключен — молчит и голос
  setInterval(() => { try { const m = localStorage.getItem('train_mute') === '1'; vol = m ? 0 : 1; au.volume = vol; } catch (e) { } }, 1000);
})();
