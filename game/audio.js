// Звук: эффекты и шаги — записи из пакетов Kenney и OpenGameArt (все CC0, файлы snd/*.mp3), фоновый гул — запись rumble.mp3 по кругу.
// Пока записи не загрузились (или файла нет) — играет прежний синтезированный вариант. Кнопка выключения.
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
    amb = { g, src, lp, next: ctx.currentTime + .5 };
  }
  // как только запись гула загрузилась — она вместо синтезированного шума (края mp3 обрезаны, чтобы круг был без щелчка)
  function ambRec() {
    if (!amb || amb.rec || !SMP.rumble) return;
    const s = ctx.createBufferSource(); s.buffer = SMP.rumble; s.loop = true;
    s.loopStart = .06; s.loopEnd = SMP.rumble.duration - .06;
    const k = ctx.createGain(); k.gain.value = .4; amb.lp.frequency.value = 420;   // .4 — по громкости как прежний синтез
    s.connect(k); k.connect(amb.lp); s.start(0, .06);
    try { amb.src.stop(); } catch (e) { }
    amb.rec = s;
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
  // ---------- записи ----------
  const SMP = {}, SMP_LIST = ['blip', 'chime', 'lily', 'alarm', 'hit', 'miss', 'card', 'card2', 'click', 'unlock', 'unlock2', 'door', 'door2', 'buff', 'bell', 'win', 'clack', 'sand', 'rumble', 'thud', 'rewind'];
  ['wood', 'carpet', 'concrete', 'snow'].forEach(s => { for (let i = 0; i < 5; i++) SMP_LIST.push('step_' + s + i); });
  let smpLoading = false;
  // ПК-версия без сервера (file://) не может fetch — там звуки лежат base64 в snd/b64.js (window.__SNDB)
  function sndBuf(base,n){const b=window.__SNDB&&window.__SNDB[n];if(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return Promise.resolve(u.buffer);}return fetch(base+n+'.mp3').then(r=>r.ok?r.arrayBuffer():Promise.reject());}
  function loadSamples() {
    if (smpLoading || !ctx) return; smpLoading = true;
    SMP_LIST.forEach(n => sndBuf('snd/', n).then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej))).then(buf => { SMP[n] = buf; }).catch(() => { }));
  }
  function smp(n, vol, rate, when, lp) {
    if (!ctx || muted || !SMP[n]) return false;
    const s = ctx.createBufferSource(); s.buffer = SMP[n]; s.playbackRate.value = rate || 1;
    const g = ctx.createGain(); g.gain.value = vol == null ? .5 : vol;
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; s.connect(f); f.connect(g); } else s.connect(g);
    g.connect(master); s.start(when || 0); return true;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  // эффект → запись (если не загрузилась — синтез из FX)
  const REC = {
    // звуки эпохи вместо электронных «бипов»: шорох, страница блокнота, колокольчик, удар по дереву, металл
    blip: () => smp('blip', .1, rnd(.92, 1.08)),          // реплика: тихий шорох (голос и так звучит)
    chime: () => smp('chime', .75, rnd(.95, 1.05)),       // улика: перелистнули блокнот
    lily: () => smp('lily', .5) && (setTimeout(() => smp('lily', .32, 1.12), 260), true),   // лилия: два удара колокольчика
    alarm: () => smp('alarm', .6),                        // заметили: лязг металла
    thud: () => smp('thud', .6, rnd(.9, 1.05)),           // неудача: глухой удар
    hit: () => smp('hit', .8, rnd(.9, 1.1)),
    miss: () => smp('miss', .7, rnd(.9, 1.05)),
    card: () => smp(Math.random() < .5 ? 'card' : 'card2', .7, rnd(.95, 1.08)),
    click: () => smp('click', .4),
    unlock: () => smp('unlock', .7) && (setTimeout(() => smp('unlock2', .5), 120), true),
    door: () => smp(Math.random() < .5 ? 'door' : 'door2', .6, rnd(.95, 1.05)),
    buff: () => smp('buff', .5),
    bell: () => smp('bell', .35, .8, 0, 3500),
    horn: () => smp('bell', .22, .55, 0, 1600),    // вокзал: далёкий станционный колокол вместо синтезированного гудка
    win: () => smp('win', .55) && (setTimeout(() => smp('win', .4, .97), 1500), true),   // дело раскрыто: колокол, два удара
    sand: () => smp('rewind', .6, .8) && (smp('sand', .4, .7), true)    // откат: время сворачивается и сыплется песок
  };
  window.SFX = { play(n) { try { if (!(REC[n] && REC[n]())) { if (FX[n]) FX[n](); } } catch (e) {} } };
  function setMute(m) {
    muted = m; draw();
    try { localStorage.setItem('train_mute', m ? '1' : '0'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(m ? 0 : .6, ctx.currentTime, .05);
  }
  btn.addEventListener('pointerdown', e => e.stopPropagation());
  btn.addEventListener('click', e => { e.stopPropagation(); init(); setMute(!muted); });
  document.addEventListener('keydown', e => { if (e.code === 'KeyM') { init(); setMute(!muted); } }, true);
  const wake = () => { init(); loadSamples(); if (ctx && ctx.state === 'suspended') ctx.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, wake, { passive: true }));
  // фон: гул поезда и «ту-дук» колёс, пока идёт игра в вагонах
  (function loop() {
    requestAnimationFrame(loop);
    if (!ctx || ctx.state !== 'running') return;
    const loc = window.WORLD ? WORLD.cur : 'train';
    const playing = typeof gameOn !== 'undefined' && gameOn && !(typeof sandOn !== 'undefined' && sandOn) && !(document.getElementById('fight') || {}).classList?.contains('on');
    const inTrain = playing && loc === 'train';
    ambience(); ambRec();
    amb.g.gain.setTargetAtTime(inTrain ? .07 : (playing ? (loc === 'boat' ? .05 : .025) : 0), ctx.currentTime, .4);
    // пароход: рында раз в полминуты; вокзал: далёкий гудок
    if (playing && !inTrain && !muted) { amb.ev = (amb.ev || ctx.currentTime + 6); if (ctx.currentTime > amb.ev) { window.SFX.play(loc === 'boat' ? 'bell' : 'horn'); amb.ev = ctx.currentTime + 25 + Math.random() * 20; } }
    if (inTrain && ctx.currentTime > amb.next - .1) {
      const t = Math.max(ctx.currentTime, amb.next);
      // «ту-дук»: запись удара металла, приглушённая и пониженная; без записи — синтез
      if (!(SMP.clack && !muted && smp('clack', .16, .5, t, 700) && smp('clack', .11, .46, t + .14, 650))) { clack(t, .09); clack(t + .14, .06); }
      amb.next = t + 1.05 + Math.random() * .1;
    }
    steps(playing);
  })();
  // ---------- шаги: покрытие по месту, чаще на бегу, тише вприсядку ----------
  let lpx = null, lpz = null, stepAcc = 0, stepI = 0;
  function surface() {
    const loc = window.WORLD ? WORLD.cur : 'train', lv = (typeof P !== 'undefined' && P.lv) || 0;
    if (loc === 'train') return 'carpet';
    if (loc === 'boat') return lv === 0 ? 'carpet' : 'wood';
    if (loc === 'monast' || loc === 'polar') return lv < 0 ? 'concrete' : 'snow';
    if (loc === 'ball') return 'wood';
    return 'concrete';
  }
  function steps(playing) {
    if (typeof P === 'undefined') return;
    if (lpx === null) { lpx = P.x; lpz = P.z; return; }
    const d = Math.hypot(P.x - lpx, P.z - lpz); lpx = P.x; lpz = P.z;
    const talking = typeof D !== 'undefined' && D.on;
    if (!playing || talking || d > 1.5 || muted) { stepAcc = 0; return; }   // телепорт/переход — не шаг
    stepAcc += d;
    const stride = (typeof crouch !== 'undefined' && crouch) ? .55 : .72;
    if (stepAcc >= stride) {
      stepAcc = 0; const sf = surface();
      smp('step_' + sf + (stepI = (stepI + 1 + Math.floor(Math.random() * 3)) % 5), (typeof crouch !== 'undefined' && crouch) ? .12 : (sf === 'snow' ? .3 : .22), rnd(.92, 1.06));
    }
  }
  draw();
})();
