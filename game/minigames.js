// Мини-игры: драка в тёмном тамбуре, «очко» с Дэном, вскрытие сейфа на слух.
(function () {
  const $ = id => document.getElementById(id);
  const pauseLock = () => { if (typeof locked !== 'undefined' && locked) document.exitPointerLock(); };

  // ---------- драка: быстрые нажатия ----------
  const DIRS = [
    { k: ['ArrowLeft', 'KeyA'], s: '←', t: 'Влево' },
    { k: ['ArrowRight', 'KeyD'], s: '→', t: 'Вправо' },
    { k: ['ArrowDown', 'KeyS', 'KeyC'], s: '↓', t: 'Пригнуться' }
  ];
  let F = null;
  window.startFight = function (tough, done, opt) {
    pauseLock(); opt = opt || {};
    $('fight').querySelector('.foe').firstChild.textContent = (opt.foe || 'Нападавший') + ' ';
    $('fight').classList.toggle('lit', !!opt.lit);
    F = { hp: tough ? 3 : 2, maxHp: tough ? 3 : 2, foe: 4, step: 0, done, tough, win: 0, cur: null, t: 0, timer: 0 };
    $('fight').classList.add('on'); $('fmsg').textContent = 'Уворачивайся и бей! Жми стрелку (или A / D / S), как только она загорится.';
    drawFight();
    setTimeout(nextBlow, 1400);
  };
  function drawFight() {
    $('fhp').innerHTML = '♥'.repeat(F.hp) + '<span>' + '♥'.repeat(F.maxHp - F.hp) + '</span>';
    $('ffoe').style.width = (F.foe / 4 * 100) + '%';
  }
  function nextBlow() {
    if (!F) return;
    if (F.foe <= 0 || F.hp <= 0) return endFight();
    const d = DIRS[Math.floor(Math.random() * DIRS.length)];
    F.cur = d; F.win = (F.tough ? 1.35 : 1.1) - F.step * .04; F.t0 = performance.now(); F.step++;
    $('farrow').textContent = d.s; $('farrow').className = 'on'; $('fring').style.animation = 'none'; void $('fring').offsetWidth;
    $('fring').style.animation = 'shrink ' + F.win + 's linear forwards';
    $('fmsg').textContent = d.t + '!';
    clearTimeout(F.timer); F.timer = setTimeout(() => resolveBlow(false), F.win * 1000);
  }
  function resolveBlow(ok) {
    if (!F || !F.cur) return;
    clearTimeout(F.timer); F.cur = null;
    $('farrow').className = ok ? 'hit' : 'miss';
    window.SFX && SFX.play(ok ? 'hit' : 'miss');
    if (ok) { F.foe--; $('fmsg').textContent = ['Попал!', 'Есть!', 'Он шатается!', 'Ещё!'][Math.floor(Math.random() * 4)]; }
    else { F.hp--; $('fight').classList.add('hurt'); setTimeout(() => $('fight').classList.remove('hurt'), 250); $('fmsg').textContent = 'Удар по тебе!'; }
    drawFight();
    setTimeout(nextBlow, 700);
  }
  function endFight() {
    const win = F.foe <= 0, done = F.done; F = null;
    $('fmsg').textContent = win ? 'Готово!' : 'Темнеет в глазах...';
    setTimeout(() => { $('fight').classList.remove('on'); done(win); }, 900);
  }
  function fightKey(code) {
    if (!F || !F.cur) return false;
    resolveBlow(F.cur.k.includes(code));
    return true;
  }
  document.addEventListener('keydown', e => { if (F && $('fight').classList.contains('on')) { if (fightKey(e.code)) e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.querySelectorAll('#fight [data-d]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fightKey(DIRS[+b.dataset.d].k[0]); }));

  // ---------- очко (21) на 36 картах ----------
  const RANKS = [['6', 6], ['7', 7], ['8', 8], ['9', 9], ['10', 10], ['В', 2], ['Д', 3], ['К', 4], ['Т', 11]], SUITS = ['♠', '♥', '♦', '♣'];
  let C = null;
  window.startCards = function (cheat, done, opt) {
    opt = opt || {};
    $('cards').querySelector('.ct').textContent = opt.title || 'Очко с Дэном';
    $('cards').querySelector('.lbl').textContent = opt.foe || 'Дэн';
    pauseLock();
    C = { me: 0, dan: 0, cheat, done, peeked: false };
    $('cards').classList.add('on'); newRound();
  };
  function deck() { const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r: r[0], v: r[1], s }); return d.sort(() => Math.random() - .5); }
  const sum = h => (h.length === 2 && h[0].r === 'Т' && h[1].r === 'Т') ? 21 : h.reduce((a, c) => a + c.v, 0);
  function cardHtml(c, hide) { if (hide) return '<div class="card back"></div>'; const red = c.s === '♥' || c.s === '♦'; return '<div class="card' + (red ? ' red' : '') + '"><b>' + c.r + '</b><i>' + c.s + '</i></div>'; }
  function newRound() {
    window.SFX && SFX.play('card'); C.d = deck(); C.p = [C.d.pop(), C.d.pop()]; C.h = [C.d.pop(), C.d.pop()]; C.over = false; C.peeked = false; C.peekCard = null;
    $('cmsg').textContent = 'Ещё карту или хватит? Перебор — больше 21. Два туза — «золотое очко».';
    drawCards();
  }
  function drawCards(reveal) {
    $('chand').innerHTML = C.p.map(c => cardHtml(c)).join('') + '<span class="sum">' + sum(C.p) + '</span>';
    $('dhand').innerHTML = C.h.map((c, i) => cardHtml(c, i === 1 && !reveal)).join('') + (reveal ? '<span class="sum">' + sum(C.h) + '</span>' : '');
    $('cscore').textContent = 'Ты ' + C.me + ' : ' + C.dan + ' Дэн  ·  до двух побед';
    $('cpeek').style.display = C.cheat && !C.over ? 'inline-block' : 'none';
    $('cpeek').disabled = C.peeked;
    $('cmore').disabled = $('cstop').disabled = C.over;
    $('cnext').style.display = C.over ? 'inline-block' : 'none';
  }
  function finish(msg, who) {
    C.over = true; if (who === 'me') C.me++; else if (who === 'dan') C.dan++;
    drawCards(true); $('cmsg').textContent = msg;
    if (C.me >= 2 || C.dan >= 2) { $('cnext').textContent = 'Дальше'; } else $('cnext').textContent = 'Следующая раздача';
  }
  $('cmore').addEventListener('click', e => {
    e.stopPropagation(); if (C.over) return;
    C.p.push(C.d.pop()); C.peeked = false; window.SFX && SFX.play('card'); $('cmsg').textContent = '';
    if (sum(C.p) > 21) finish('Перебор! Дэн забирает раздачу.', 'dan'); else drawCards();
  });
  $('cstop').addEventListener('click', e => {
    e.stopPropagation(); if (C.over) return;
    while (sum(C.h) < 17) C.h.push(C.d.pop());
    const a = sum(C.p), b = sum(C.h);
    if (b > 21) finish('У Дэна перебор — раздача твоя!', 'me');
    else if (a > b) finish('У тебя ' + a + ' против ' + b + ' — раздача твоя!', 'me');
    else if (a < b) finish('У Дэна ' + b + ' против твоих ' + a + '.', 'dan');
    else finish('Ничья — ' + a + ' на ' + b + '. Переиграем.', null);
  });
  $('cpeek').addEventListener('click', e => {
    e.stopPropagation(); if (!C || C.over || C.peeked) return;
    C.peeked = true; const nx = C.d[C.d.length - 1];
    $('cmsg').textContent = 'Тибо незаметно заглядывает в колоду: следующая карта — ' + nx.r + nx.s + ' (' + nx.v + '). А у Дэна под рубашкой — ' + C.h[1].r + C.h[1].s + '.';
    drawCards();
  });
  $('cnext').addEventListener('click', e => {
    e.stopPropagation();
    if (C.me >= 2 || C.dan >= 2) { const win = C.me >= 2, d = C.done; C = null; $('cards').classList.remove('on'); d(win); }
    else newRound();
  });

  // ---------- сейф на слух ----------
  let L = null;
  window.startListen = function (code, done) {
    L = { code, pos: 0, done, tries: 0 };
    $('kpListen').style.display = 'block'; $('kpd').textContent = '_ _ _ _';
    $('kphint').textContent = 'Крути диск: нажимай цифры. На верной цифре замок щёлкнет.';
  };
  window.listenDigit = function (d) {
    if (!L) return false;
    L.tries++; if (typeof S !== 'undefined') S.time += .5;
    if (d === L.code[L.pos]) {
      L.pos++;
      $('kpd').textContent = (L.code.slice(0, L.pos) + '____').slice(0, 4).split('').join(' ');
      window.SFX && SFX.play('unlock'); $('kphint').textContent = 'Щёлк! ' + (L.pos < 4 ? 'Следующий диск.' : 'Замок поддался.');
      $('keypad').classList.add('click'); setTimeout(() => $('keypad').classList.remove('click'), 200);
      if (L.pos === 4) { const f = L.done; L = null; $('kpListen').style.display = 'none'; setTimeout(f, 400); }
    } else $('kphint').textContent = '…тишина. Не та цифра.';
    return true;
  };
  window.stopListen = () => { L = null; $('kpListen').style.display = 'none'; };

  // ---------- перевязка: остановить иглу в зелёной зоне ----------
  let B = null;
  window.startBandage = function (done, opt) {
    pauseLock(); opt = opt || {};
    B = { hits: 0, miss: 0, pos: 0, dir: 1, sp: .9, zone: [.38, .62], done, t: performance.now(), busy: false, opt };
    $('band').querySelector('.bt').textContent = opt.title || 'Перевязка';
    $('band').classList.toggle('pick', !!opt.pick);
    $('bmsg').textContent = opt.msg || 'Жми E / пробел (или тапни), когда игла в зелёной зоне. Нужно три стежка.';
    $('band').classList.add('on'); drawBand(); requestAnimationFrame(bandLoop);
  };
  function drawBand() {
    $('bzone').style.left = (B.zone[0] * 100) + '%'; $('bzone').style.width = ((B.zone[1] - B.zone[0]) * 100) + '%';
    $('bst').innerHTML = '✚'.repeat(B.hits) + '<span>' + '✚'.repeat(3 - B.hits) + '</span>';
  }
  function bandLoop(t) {
    if (!B) return;
    const dt = Math.min(.05, (t - B.t) / 1000); B.t = t;
    if (!B.busy) { B.pos += B.dir * B.sp * dt; if (B.pos > 1) { B.pos = 1; B.dir = -1; } if (B.pos < 0) { B.pos = 0; B.dir = 1; } }
    $('bneedle').style.left = (B.pos * 100) + '%';
    requestAnimationFrame(bandLoop);
  }
  function bandHit() {
    if (!B || B.busy) return;
    const ok = B.pos >= B.zone[0] && B.pos <= B.zone[1];
    window.SFX && SFX.play(ok ? 'click' : 'miss');
    B.busy = true;
    const o = B.opt || {};
    if (ok) { B.hits++; $('bmsg').textContent = (o.ok || ['Ровный стежок.', 'Хорошо. Ещё один.', 'Готово.'])[B.hits - 1]; }
    else { B.miss++; $('bmsg').textContent = B.miss >= 3 ? (o.fail || 'Дэн отдёргивает руку.') : (o.miss || 'Мимо — Дэн шипит от боли.'); $('band').classList.add('hurt'); setTimeout(() => $('band').classList.remove('hurt'), 250); }
    drawBand();
    setTimeout(() => {
      if (!B) return;
      if (B.hits >= 3 || B.miss >= 3) { const win = B.hits >= 3, d = B.done; B = null; $('band').classList.remove('on'); d(win); return; }
      const w = .24 - B.hits * .05, c = .2 + Math.random() * .6; B.zone = [Math.max(0, c - w / 2), Math.min(1, c + w / 2)]; B.sp += .35; B.busy = false; drawBand();
    }, 650);
  }
  document.addEventListener('keydown', e => { if (B && $('band').classList.contains('on')) { if (['KeyE', 'Space', 'Enter', 'KeyF'].includes(e.code)) { e.preventDefault(); bandHit(); } e.stopImmediatePropagation(); } }, true);
  $('band').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); bandHit(); });
})();
