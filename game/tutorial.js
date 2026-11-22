// Обучение для новичка + золотая дорожка к текущей цели.
// 1) При первом входе в поезд — короткие шаги: осмотреться, идти, метки, разговор, блокнот, подсказка.
//    Каждый шаг закрывается сам, когда игрок сделал действие. F1 — пройти обучение заново.
// 2) Золотые стрелки на полу от героя к первой зацепке и стрелка у края экрана, если цель не видно.
// Сюжет и тексты истории не трогает: читает только CUR_LEADS / NPCS / INSPECT.
(function () {
  const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const css = document.createElement('style');
  css.textContent = `
  #tut{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);z-index:60;width:min(560px,calc(100% - 32px));
    background:linear-gradient(180deg,#1d1a14f2,#14120ef2);border:1px solid #d9b46a;border-radius:14px;padding:14px 18px 12px;color:#f3ead6;
    font:15px/1.45 Georgia,'Times New Roman',serif;box-shadow:0 10px 40px #000a,0 0 0 1px #0006 inset;opacity:0;pointer-events:none;transition:opacity .35s,transform .35s}
  #tut.on{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}
  #tut .tt{font:700 11px/1 sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#d9b46a;margin-bottom:7px;display:flex;justify-content:space-between;gap:10px}
  #tut .tt i{font-style:normal;color:#a89a7c}
  #tut kbd{display:inline-block;min-width:20px;padding:1px 6px;margin:0 1px;border:1px solid #d9b46a99;border-bottom-width:2px;border-radius:5px;background:#2a2418;color:#f0d58e;font:700 13px/18px sans-serif;text-align:center}
  #tut .tb{display:flex;justify-content:flex-end;gap:8px;margin-top:9px}
  #tut button{font:600 12px sans-serif;padding:6px 12px;border-radius:16px;border:1px solid #d9b46a80;background:#2a2418;color:#f0d58e;cursor:pointer}
  #tut button.skip{border-color:#ffffff30;color:#a89a7c;background:none}
  #tut .bar{height:3px;border-radius:2px;background:#ffffff14;margin-top:10px;overflow:hidden}#tut .bar b{display:block;height:100%;background:#d9b46a;transition:width .4s}
  #guide{position:fixed;z-index:40;display:none;pointer-events:none;transform:translate(-50%,-50%)}
  #guide .ar{width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-bottom:22px solid #f0d58e;filter:drop-shadow(0 0 6px #f0d58e);margin:0 auto}
  #guide .gl{margin-top:4px;padding:3px 9px;border-radius:10px;background:#14120ed9;border:1px solid #d9b46a90;color:#f0d58e;font:600 12px sans-serif;white-space:nowrap}
  #nbBtn{top:212px}
  `;
  if (TOUCH) css.textContent += '#tut{bottom:215px}'; // на телефоне не закрываем джойстик
  document.head.appendChild(css);
  const box = document.createElement('div'); box.id = 'tut';
  box.innerHTML = '<div class="tt"><span>Обучение</span><i></i></div><div class="tx"></div><div class="tb"><button class="skip">Пропустить обучение</button><button class="next">Дальше</button></div><div class="bar"><b></b></div>';
  document.body.appendChild(box);
  const guide = document.createElement('div'); guide.id = 'guide'; guide.innerHTML = '<div class="ar"></div><div class="gl"></div>';
  document.body.appendChild(guide);
  // кнопка блокнота (на телефоне клавиши J нет)
  const nb = document.createElement('button'); nb.id = 'nbBtn'; nb.className = 'tab r'; nb.title = 'Блокнот улик (J)'; nb.textContent = '✎';
  nb.addEventListener('pointerdown', e => e.stopPropagation());
  nb.addEventListener('click', e => { e.stopPropagation(); if (typeof toggleNote === 'function') toggleNote(); });
  document.body.appendChild(nb);

  const K = s => s.split(' ').map(k => '<kbd>' + k + '</kbd>').join(' ');
  const STEPS = [
    { id: 'look', t: TOUCH ? 'Веди пальцем по экрану — так ты осматриваешься.' : 'Кликни по сцене и двигай мышью — так ты осматриваешься. ' + K('Q') + ' или ' + K('Esc') + ' вернут курсор.' },
    { id: 'move', t: TOUCH ? 'Двигайся джойстиком слева внизу. Кнопка «Бегом» — быстрее.' : 'Иди клавишами ' + K('W A S D') + '. Держи ' + K('Shift') + ' — бегом.' },
    { id: 'marks', t: 'Золотые метки ведут по делу: <b style="color:#f0d58e">«!»</b> — человек, с которым стоит поговорить, <b style="color:#f0d58e">◆</b> — место, которое стоит осмотреть. Золотые стрелки на полу показывают дорогу.', auto: 9 },
    { id: 'talk', t: TOUCH ? 'Подойди к человеку с меткой и нажми кнопку ' + K('E') + ' справа внизу — начнётся разговор.' : 'Подойди к человеку с меткой и нажми ' + K('E') + ' — начнётся разговор. Так же осматривают предметы.' },
    { id: 'note', t: 'Найденные улики и показания попадают в блокнот. Открой его: ' + (TOUCH ? 'кнопка ✎ справа.' : K('J') + ' или кнопка ✎ справа.') },
    { id: 'hint', t: 'Текущее задание — в панели слева вверху. Не знаешь, что делать дальше — ' + (TOUCH ? 'нажми «? Подсказка».' : 'нажми ' + K('H') + ' или «? Подсказка».'), auto: 12 },
    { id: 'done', t: 'Готово! Расспрашивай людей, собирай улики и найди виновного. Удачи, детектив.', auto: 4 }
  ];
  const T = { on: false, i: 0, t: 0, yaw0: 0, look: 0, dist: 0, px: 0, pz: 0, sawDlg: false, sawNote: false, hinted: false };
  let done = false;
  try { done = localStorage.getItem('prig_tut') === 'done'; } catch (e) { }
  const tx = box.querySelector('.tx'), cnt = box.querySelector('.tt i'), bar = box.querySelector('.bar b'), nextB = box.querySelector('.next');
  function show(i) {
    T.i = i; T.t = 0; const s = STEPS[i];
    tx.innerHTML = s.t; cnt.textContent = (i + 1) + ' / ' + STEPS.length;
    bar.style.width = ((i + 1) / STEPS.length * 100) + '%';
    nextB.textContent = i === STEPS.length - 1 ? 'Начать' : 'Дальше';
    box.classList.add('on'); window.SFX && SFX.play && SFX.play('buff');
    T.yaw0 = P.yaw; T.look = 0; T.dist = 0; T.px = P.x; T.pz = P.z; T.sawDlg = false; T.sawNote = false; T.hinted = false;
  }
  function finish() {
    T.on = false; box.classList.remove('on'); done = true;
    try { localStorage.setItem('prig_tut', 'done'); } catch (e) { }
  }
  function next() { if (T.i + 1 >= STEPS.length) finish(); else show(T.i + 1); }
  function start() { T.on = true; show(0); }
  box.querySelector('.skip').addEventListener('click', e => { e.stopPropagation(); finish(); });
  nextB.addEventListener('click', e => { e.stopPropagation(); next(); });
  box.addEventListener('pointerdown', e => e.stopPropagation());
  window.Tutorial = { start, finish, get on() { return T.on; } };
  addEventListener('keydown', e => { if (e.code === 'F1') { e.preventDefault(); start(); } });
  // нажатие подсказки засчитываем шагу «hint»
  const hb = document.getElementById('hintBtn'); if (hb) hb.addEventListener('click', () => { T.hinted = true; });
  addEventListener('keydown', e => { if (e.code === 'KeyH') T.hinted = true; }, true);

  const busy = () => (typeof D !== 'undefined' && D.on) || (typeof endEl !== 'undefined' && endEl.classList.contains('on'));
  function stepTutor(dt) {
    if (!T.on) {
      if (!done && typeof gameOn !== 'undefined' && gameOn && curLoc() === 'train' && typeof trainReady !== 'undefined' && trainReady && !busy() && !document.getElementById('csFrame')) {
        T.wait = (T.wait || 0) + dt; if (T.wait > 1.2) start();
      }
      return;
    }
    const s = STEPS[T.i]; T.t += dt;
    let a = Math.abs(P.yaw - T.yaw0); if (a > Math.PI) a = 2 * Math.PI - a;
    T.look = Math.max(T.look, a);
    T.dist += Math.hypot(P.x - T.px, P.z - T.pz); T.px = P.x; T.pz = P.z;
    if (D && D.on) T.sawDlg = true;
    if (noteEl.classList.contains('on')) T.sawNote = true;
    // во время разговора окно обучения прячем, чтобы не закрывало текст
    box.classList.toggle('on', !busy() && !noteEl.classList.contains('on'));
    let ok = false;
    if (s.id === 'look') ok = T.look > 1.0;
    else if (s.id === 'move') ok = T.dist > 4;
    else if (s.id === 'talk') ok = T.sawDlg && !D.on;
    else if (s.id === 'note') ok = T.sawNote && !noteEl.classList.contains('on');
    else if (s.id === 'hint') ok = T.hinted && T.t > 1.5;
    if (s.auto && T.t > s.auto) ok = true;
    if (ok && T.t > .8) next();
  }

  // ---------- золотая дорожка ----------
  function target() {
    if (typeof CUR_LEADS === 'undefined' || !CUR_LEADS.length) return null;
    for (const l of CUR_LEADS.slice(0, 2)) {
      const [kind, id] = (l[2] || '').split(':');
      if (kind === 'npc') {
        if (id === 'dan' && typeof CHASE !== 'undefined' && CHASE.st && CHASE.state !== 'done') return { x: CHASE.x, z: CHASE.z, lv: P.lv || 0 };
        if (id === 'remez' && typeof PATROL !== 'undefined' && PATROL.on) return { x: PATROL.x, z: PATROL.z, lv: P.lv || 0 };
        const n = NPCS.find(q => q.id === id && !q.hidden && (q.loc || 'train') === curLoc());
        if (n) return { x: n.x, z: n.z, lv: n.lv || 0, npc: true };
      } else if (kind) {
        const i = INSPECT.find(q => q.id === id && (q.loc || 'train') === curLoc());
        if (i) return { x: i.x, z: i.z, lv: i.lv || 0 };
      }
    }
    return null;
  }
  // стрелки на полу: плоские золотые шевроны, мягко бегут к цели
  let chev = null; const CHN = 9;
  function makeChevrons() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,214,130,.35)'); gr.addColorStop(1, 'rgba(255,214,130,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#ffe2a0'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = '#f0c060'; g.shadowBlur = 16;
    g.beginPath(); g.moveTo(30, 88); g.lineTo(64, 44); g.lineTo(98, 88); g.stroke();
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 });
    const geo = new THREE.PlaneGeometry(.42, .42);
    chev = [];
    for (let i = 0; i < CHN; i++) { const m = new THREE.Mesh(geo, mat.clone()); m.rotation.order = 'YXZ'; m.renderOrder = 5; m.visible = false; scene.add(m); chev.push(m); }
  }
  let phase = 0;
  function path(t) {
    // в поезде идём по коридору (z≈1.5), к цели в купе сворачиваем в конце
    const pts = [];
    const sx = P.x, sz = P.z;
    if (curLoc() === 'train') {
      const cz = 1.5;
      pts.push([sx, sz]);
      if (Math.abs(sz - cz) > .35 && Math.abs(t.x - sx) > 1.2) pts.push([sx, cz]);
      if (Math.abs(t.x - sx) > 1.2) pts.push([t.x, cz]);
      pts.push([t.x, t.z]);
    } else { pts.push([sx, sz]); pts.push([t.x, t.z]); }
    return pts;
  }
  function stepGuide(dt) {
    const t = (typeof gameOn !== 'undefined' && gameOn && !busy()) ? target() : null;
    if (!chev && t) makeChevrons();
    let shown = 0;
    if (t && chev) {
      const sameLv = (t.lv || 0) === (P.lv || 0);
      const pts = path(t);
      // длина пути и точки через равные промежутки, от героя (начиная с 1 м) и не ближе 1 м к цели
      const seg = []; let L = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], d]); L += d; }
      phase = (phase + dt * .9) % 1;
      if (sameLv && L > 2.2) {
        const step = .85, y = (P.fy || 0) + .025;
        for (let k = 0; k < CHN; k++) {
          const s = 1.1 + (k + phase) * step; if (s > L - 1.0) break;
          let acc = 0, p = null, dir = null;
          for (const [a, b, d] of seg) { if (acc + d >= s) { const u = (s - acc) / d; p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; dir = [b[0] - a[0], b[1] - a[1]]; break; } acc += d; }
          if (!p) break;
          const m = chev[k]; m.visible = true; m.position.set(p[0], y, p[1]);
          m.rotation.set(-Math.PI / 2, 0, 0); m.rotation.y = Math.atan2(-dir[0], -dir[1]);
          const fade = Math.min(1, (s - 1.1) / .8, (L - 1.0 - s) / .8) * (k === CHN - 1 ? 1 - phase : 1) * (k === 0 ? Math.min(1, phase * 3 + .3) : 1);
          m.material.opacity = .85 * Math.max(0, fade);
          shown++;
        }
      }
      for (let k = shown; k < CHN; k++) chev[k].visible = false;
      // стрелка у края экрана, когда цели не видно
      const v = new THREE.Vector3(t.x, (P.fy || 0) + (t.npc ? 1.6 : .9), t.z).project(camera);
      const behind = v.z > 1, off = behind || Math.abs(v.x) > .92 || Math.abs(v.y) > .9;
      const far = Math.hypot(t.x - P.x, t.z - P.z);
      if (off || far > 20) {
        let x = v.x, yv = v.y; if (behind) { x = -x; yv = -yv; }
        // направление на цель в плоскости экрана; если позади — вниз
        let ang = Math.atan2(x, yv); if (behind && Math.abs(x) < .2) ang = Math.PI;
        const R = Math.min(innerWidth, innerHeight) * .38;
        const cx = innerWidth / 2 + Math.sin(ang) * Math.min(innerWidth * .42, R * 1.4), cy = innerHeight / 2 - Math.cos(ang) * R;
        guide.style.left = cx + 'px'; guide.style.top = cy + 'px';
        guide.querySelector('.ar').style.transform = 'rotate(' + ang + 'rad)';
        let lab = Math.round(far) + ' м';
        if (curLoc() === 'train' && typeof zoneName === 'function') { const zt = zoneName(t.x), zp = zoneName(P.x); if (zt && zt !== zp) lab = zt + ' · ' + lab; }
        if (!sameLv) lab = ((t.lv || 0) > (P.lv || 0) ? 'наверх · ' : 'вниз · ') + lab;
        guide.querySelector('.gl').textContent = lab; guide.style.display = 'block';
      } else guide.style.display = 'none';
    } else {
      if (chev) chev.forEach(m => m.visible = false);
      guide.style.display = 'none';
    }
  }
  // подсказка H: к тексту зацепки добавляем, где искать (вагон и примерное направление)
  if (typeof showHint === 'function') {
    const base = showHint;
    window.showHint = function () {
      base();
      try {
        const t = target(); if (!t || typeof toastMsg === 'undefined' || !toastMsg) return;
        const far = Math.round(Math.hypot(t.x - P.x, t.z - P.z));
        let where = '';
        if (curLoc() === 'train' && typeof zoneName === 'function') {
          const zt = zoneName(t.x), zp = zoneName(P.x);
          where = zt && zt !== zp ? zt : 'в этом вагоне';
        }
        const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
        const dot = ((t.x - P.x) * fx + (t.z - P.z) * fz) / Math.max(.01, far);
        const dir = far < 2 ? 'совсем рядом' : dot > .5 ? 'впереди' : dot < -.5 ? 'позади' : 'сбоку';
        toastMsg += '  →  ' + (where ? where + ', ' : '') + dir + (far >= 2 ? ', ~' + far + ' м' : '') + '. Иди по золотым стрелкам.';
        toastT = 6;
      } catch (e) { }
    };
  }
  let last = performance.now();
  // работает и при скрытой вкладке (там rAF стоит): шаг вызывается из tick игры через Tutorial.tick, а если его нет — по rAF
  let ext = false;
  window.Tutorial.tick = dt => { ext = true; try { stepTutor(dt); stepGuide(dt); } catch (e) { console.warn(e); } };
  (function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!ext) { try { stepTutor(dt); stepGuide(dt); } catch (e) { } }
    requestAnimationFrame(loop);
  })(last);
})();
