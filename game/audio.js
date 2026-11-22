// Звук без файлов: всё синтезируется WebAudio. Гул и стук колёс в поезде, короткие эффекты, кнопка выключения.
(function () {
  let ctx = null, master = null, amb = null, muted = false;
  try { muted = localStorage.getItem('train_mute') === '1'; } catch (e) {}
  const btn = document.getElementById('snd');
  const draw = () => { btn.textContent = muted ? '🔇' : '🔊'; btn.title = muted ? 'Включить звук (M)' : 'Выключить звук (M)'; };
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : .6;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -10; lim.ratio.value = 12; master.connect(lim); lim.connect(ctx.destination);
  }
  function noiseBuf(sec, brown) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last; } else d[i] = w; }
    let mx = 0; for (let i = 0; i < d.length; i++) mx = Math.max(mx, Math.abs(d[i]));
    const k = (brown ? .5 : .8) / (mx || 1), fade = Math.min(2000, d.length >> 3);
    for (let i = 0; i < d.length; i++) d[i] *= k;
    if (brown) for (let i = 0; i < fade; i++) { const a = i / fade; d[d.length - fade + i] = d[d.length - fade + i] * (1 - a) + d[i] * a; }
    return b;
  }
  function ambience() {
    if (amb || !ctx) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(4, true); src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 110; lp.Q.value = .5;
    const g = ctx.createGain(); g.gain.value = 0; src.connect(lp); lp.connect(g); g.connect(master); src.start();
    amb = { g, next: ctx.currentTime + .5 };
  }
  function clack(t, vol) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf(.08, false);
    const bp = ctx.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 380;
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.001, t + .09);
    s.connect(bp); bp.connect(g); g.connect(master); s.start(t);
  }
  function tone(f, dur, type, vol, slide) {
    if (!ctx || muted) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
  }
  function burst(dur, freq, vol, q) {
    if (!ctx || muted) return;
    const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noiseBuf(dur, false);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const FX = {
    blip: () => tone(520 + Math.random() * 60, .05, 'triangle', .04),
    chime: () => { tone(880, .5, 'sine', .12); setTimeout(() => tone(1320, .6, 'sine', .09), 110); },
    lily: () => { tone(660, .7, 'sine', .1); setTimeout(() => tone(990, .8, 'sine', .08), 150); setTimeout(() => tone(1320, .9, 'sine', .06), 300); },
    sand: () => burst(2.4, 1800, .12, .5),
    alarm: () => { tone(300, .25, 'square', .08); setTimeout(() => tone(240, .35, 'square', .08), 220); },
    hit: () => { burst(.15, 300, .5, .8); tone(90, .2, 'sine', .3, 50); },
    miss: () => { burst(.2, 180, .6, .6); tone(70, .3, 'sawtooth', .15, 40); },
    card: () => burst(.06, 3500, .25, 2),
    click: () => burst(.03, 2000, .35, 4),
    unlock: () => { burst(.04, 1800, .4, 4); setTimeout(() => burst(.06, 900, .4, 3), 90); },
    door: () => burst(.35, 400, .12, .7),
    buff: () => { tone(392, .18, 'triangle', .07); setTimeout(() => tone(587, .22, 'triangle', .07), 70); setTimeout(() => tone(784, .4, 'sine', .08), 140); },
    horn: () => { tone(110, 1.6, 'sawtooth', .05, 104); tone(165, 1.6, 'sawtooth', .03, 158); },
    bell: () => { tone(740, 1.4, 'sine', .08); tone(1110, 1.0, 'sine', .04); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .35, 'triangle', .1), i * 110))
  };
  window.SFX = { play(n) { try { if (FX[n]) FX[n](); } catch (e) {} } };
  function setMute(m) {
    muted = m; draw();
    try { localStorage.setItem('train_mute', m ? '1' : '0'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(m ? 0 : .6, ctx.currentTime, .05);
  }
  btn.addEventListener('pointerdown', e => e.stopPropagation());
  btn.addEventListener('click', e => { e.stopPropagation(); init(); setMute(!muted); });
  document.addEventListener('keydown', e => { if (e.code === 'KeyM') { init(); setMute(!muted); } }, true);
  const wake = () => { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, wake, { passive: true }));
  // фон: гул поезда и «ту-дук» колёс, пока идёт игра в вагонах
  (function loop() {
    requestAnimationFrame(loop);
    if (!ctx || ctx.state !== 'running') return;
    const loc = window.WORLD ? WORLD.cur : 'train';
    const playing = typeof gameOn !== 'undefined' && gameOn && !(typeof sandOn !== 'undefined' && sandOn) && !(document.getElementById('fight') || {}).classList?.contains('on');
    const inTrain = playing && loc === 'train';
    ambience();
    amb.g.gain.setTargetAtTime(inTrain ? .07 : (playing ? (loc === 'boat' ? .05 : .025) : 0), ctx.currentTime, .4);
    // пароход: рында раз в полминуты; вокзал: далёкий гудок
    if (playing && !inTrain && !muted) { amb.ev = (amb.ev || ctx.currentTime + 6); if (ctx.currentTime > amb.ev) { (loc === 'boat' ? FX.bell : FX.horn)(); amb.ev = ctx.currentTime + 25 + Math.random() * 20; } }
    if (inTrain && ctx.currentTime > amb.next - .1) {
      const t = Math.max(ctx.currentTime, amb.next);
      clack(t, .09); clack(t + .14, .06);
      amb.next = t + 1.05 + Math.random() * .1;
    }
  })();
  draw();
})();
