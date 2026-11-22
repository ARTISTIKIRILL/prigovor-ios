// Злодейский слой: взгляд Палаты (подозрение), добыча, подставы, карманные кражи, «Палата знает лишнее».
(function () {
  if (S.sus === undefined) S.sus = 0;
  if (!S.loot) S.loot = [];

  // ---------- индикатор «Взгляд Палаты» в панели задания ----------
  const eyeHud = document.createElement('div');
  eyeHud.id = 'palataEye';
  eyeHud.title = 'Взгляд Палаты: растёт от грязных методов. Смотритель всё замечает.';
  document.getElementById('quest').insertBefore(eyeHud, document.getElementById('leads'));
  const tier = () => S.sus >= 45 ? 3 : S.sus >= 20 ? 2 : S.sus > 0 ? 1 : 0;
  function drawEye() {
    const t = tier();
    eyeHud.innerHTML = '<span class="pe-ic">✾</span> Взгляд Палаты <span class="pe-d">' + [0, 1, 2].map(i => '<i class="' + (i < t ? 'on' : '') + '"></i>').join('') + '</span>' +
      '<span class="pe-t">' + ['не смотрит', 'заметила', 'присматривается', 'следит'][t] + '</span>';
    eyeHud.className = 't' + t;
  }
  drawEye();
  function addSus(v) {
    const before = tier(); S.sus = Math.min(100, S.sus + v); drawEye();
    eyeHud.classList.add('pulse'); setTimeout(() => eyeHud.classList.remove('pulse'), 900);
    if (tier() > before) { toastMsg = ['', 'Палата заметила. Где-то звякнула ложечка о стакан.', 'Палата присматривается к тебе.', 'Палата следит. Смотритель это запомнит.'][tier()]; toastT = 3.2; }
  }
  window.addSus = addSus;

  // ---------- добыча ----------
  function addLoot(id) {
    if (!id || S.loot.includes(id) || !STORY.loot[id]) return;
    S.loot.push(id); S.f.hasLoot = true;
    window.SFX && SFX.play('card');
    setTimeout(() => { toastMsg = 'В карман: ' + STORY.loot[id].n; toastT = 3; }, 300);
  }
  window.addLoot = addLoot;

  // applyFx: поля sus и loot
  const _applyFx = applyFx;
  applyFx = function (n) {
    if (n && n.loot) addLoot(n.loot);
    if (n && n.sus) addSus(n.sus);
    return _applyFx(n);
  };

  // динамические узлы: реакция на добычу и «Палата знает лишнее»
  const _runNode = runNode;
  runNode = function (id) {
    const n = D.dlg && D.dlg.nodes[id];
    if (n && n.dyn === 'lootTalk') {
      const who = D.npc ? D.npc.id.replace(/^b_/, '') : null;
      const items = S.loot.filter(l => STORY.loot[l]);
      n.lines = items.length ? items.map(l => [who, 'neutral', STORY.lootTalk[l] ? STORY.lootTalk[l][2] : 'Хм. Интересная вещица.']) : [[who, 'neutral', 'Пустые карманы? Скучно живёшь.']];
    }
    if (n && n.dyn === 'palata') {
      const fresh = (STORY.palataKnows || []).filter(([f]) => S.f[f] && !S.f['pk_' + f]).slice(0, 2);
      fresh.forEach(([f]) => { S.f['pk_' + f] = true; });
      const tone = (STORY.palataTone || []).find(([v]) => S.sus >= v);
      n.lines = [['smotritel', 'smile', 'Чаю? С сушками.']].concat(fresh.map(([, t]) => ['smotritel', 'neutral', t]));
      if (tone && tone[1]) n.lines.push([null, null, tone[1]]);
      if (fresh.length) n.lines.push(['det', null, '(Откуда он знает?)']);
    }
    return _runNode(id);
  };
  STORY.dialogs.smotritel.nodes.hub.dyn = 'palata';

  // дополнительные места осмотра в поезде (по координатам уже расставленных)
  const _spawnCast = spawnCast;
  spawnCast = function () {
    const r = _spawnCast.apply(this, arguments);
    const body = INSPECT.find(i => i.id === 'body'), safe = INSPECT.find(i => i.id === 'safe'), rz = NPCS.find(n => n.id === 'remez');
    if (body) INSPECT.push({ id: 'pockets', x: body.x + .35, z: body.z - .2, r: 1.1 });
    if (safe) INSPECT.push({ id: 'takeContract', x: safe.x - .2, z: safe.z, r: 1.1 });
    if (rz) INSPECT.push({ id: 'pickRemez', x: rz.x + .85, z: 1.3, r: .9 });
    return r;
  };

  // действия: карманные кражи и подставы
  const _locAction = window.locAction;
  window.locAction = function (a, def) {
    if (a === 'pickRemez' || a === 'pickLykov') {
      const id = a === 'pickRemez' ? 'remez' : 'lykov';
      const npc = NPCS.find(n => n.id === id && !n.hidden && (n.loc || 'train') === curLoc());
      showBuff('Тибо: ловкость рук');
      startBandage(win => { openDlg(); D.npc = npc; D.solo = null; D.dlg = STORY.dialogs[id]; runNode(win ? 'pickWin' : 'pickLose'); },
        { title: 'Карманная кража', msg: 'Жми E / пробел, когда рука в зелёной зоне. Три точных движения.', ok: ['Палец в кармане.', 'Нащупал.', 'Есть.'], miss: 'Капитан шевельнулся!', fail: 'Тебя заметили!', pick: true });
      return true;
    }
    if (a.startsWith('pickHero:')) {
      const h = a.slice(9), prev = S.hero; closeDialog();
      for (const k in S.f) if (k.startsWith('hero:')) delete S.f[k];
      S.f['hero:' + h] = true; S.hero = h; window.setHeroFormsNow && setHeroFormsNow();
      if (window.rebuildBench) rebuildBench();
      const own = STORY.locs.boat.owner === h;
      showBuff(own ? 'Личное дело ' + STORY.heroes[h].full.split(' ')[0] + 'а' : 'На платформу идёт ' + STORY.cast[h].name, false, h);
      toastMsg = (prev === h ? 'Идёшь снова ты.' : 'Теперь ты играешь за: ' + STORY.cast[h].name + '.') + ' Платформа 2 ждёт.'; toastT = 3.5;
      S.f.heroPicked = true; derive(); updateQuest(); return true;
    }
    if (a === 'frameEnd') { startScene('framed'); return true; }
    if (a === 'boatFrameEnd') { startScene('boatFramed'); return true; }
    return _locAction ? _locAction(a, def) : false;
  };

  // откаты: Палата помнит (v_ и подозрение), а вещи из этого дела пропадают
  const _rollback = rollback;
  rollback = function () {
    const keepV = {}; for (const k in S.f) if (k.startsWith('v_') || k.startsWith('pk_')) keepV[k] = S.f[k];
    S.loot = S.loot.filter(l => STORY.loot[l].cs !== 'train');
    _rollback();
    setTimeout(() => { Object.assign(S.f, keepV); S.f.hasLoot = S.loot.length > 0; drawEye(); }, 2700);
  };
  // откат парохода реализован в world2 (boatRollback): чистим добычу парохода
  const _resetLoot = () => { S.loot = S.loot.filter(l => STORY.loot[l].cs !== 'boat'); S.f.hasLoot = S.loot.length > 0; };
  const _la2 = window.locAction;
  window.locAction = function (a, def) { if (a === 'boatRollback') _resetLoot(); return _la2(a, def); };

  // блокнот: добыча и взгляд Палаты
  const _toggleNote = toggleNote;
  toggleNote = function () {
    _toggleNote();
    if (!noteEl.classList.contains('on')) return;
    const list = document.getElementById('nlist');
    if (S.loot.length) list.innerHTML += '</ol><h3>Добыча</h3><ol>' + S.loot.map(l => '<li><b>' + STORY.loot[l].n + '.</b> ' + STORY.loot[l].t + '</li>').join('');
    document.getElementById('nsub').innerHTML += '<br>Взгляд Палаты: ' + ['не смотрит', 'заметила', 'присматривается', 'следит'][tier()];
  };
})();
