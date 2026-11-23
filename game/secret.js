// Секретные герои по «Канону сюжета»: палач Гордей, летописец Евсей, графиня Маргарет.
// Здесь: данные героев, их облик по эпохам, открытие (Евсей — листы Летописи, графиня — «Приглашение»,
// Гордей — «Испытание палача»), выбор героя у Смотрителя, умения и слабости, 3D-модели и портреты.
// Подключается последним (после story9.js).
(function () {
  const ST = window.STORY, SECRET = ['gordey', 'evsey', 'margaret'], LOC = WORLD.LOC, standAt = WORLD.H.standAt || window.standAt;
  const SX = 300;

  // ---------- данные ----------
  Object.assign(ST.heroes, {
    gordey: { name: 'Гордей', role: 'палач', full: 'Гордей, палач', buff: 'На допросе подозреваемые ломаются быстрее; узнаёт агентов Палаты в лицо. Минус: свидетели его боятся, второго обвинения в его делах нет.' },
    evsey: { name: 'Евсей', role: 'королевский летописец', full: 'Евсей, королевский летописец', buff: 'Помнит каждую петлю и видит, что изменилось после отката; замечает правки в досье. Минус: в драке слабее всех, подозрение Смотрителя растёт быстрее.' },
    margaret: { name: 'Маргарет', role: 'хозяйка Чернолесья', full: 'Графиня Маргарет, хозяйка Чернолесья', buff: 'По капле крови на улике знает, чья она; видит в темноте. Минус: в вечном полдне слабеет.' }
  });
  ST.cast.evsey = { name: 'Евсей', role: 'королевский летописец' };
  // облик в эпохах (имя и нрав те же)
  const FORMS = {
    train: ['проводник-молчун', 'пассажир с толстой тетрадью', 'дама из СВ'],
    station: ['палач', 'королевский летописец', 'хозяйка Чернолесья'],
    boat: ['грузчик-молчун', 'судовой писарь', 'пассажирка первого класса'],
    monast: ['заплечных дел мастер', 'книжник-переписчик', 'боярыня-паломница'],
    polar: ['механик-зимовщик', 'метеонаблюдатель', 'инспектор из главка'],
    ball: ['гость в чёрной маске', 'летописец двора', 'хозяйка бала'],
    fort: ['новый стражник ордена', 'новый летописец ордена', 'новая служанка ордена'],
    noon: ['палач', 'летописец', 'графиня']
  };
  for (const loc in FORMS) { ST.heroForms[loc] = ST.heroForms[loc] || {}; SECRET.forEach((h, i) => { ST.heroForms[loc][h] = FORMS[loc][i]; }); }
  ST.heroes.gordey.role = 'палач';

  const NAMES = { rowen: 'Ровен', miron: 'Мирон', agata: 'Агата', tibo: 'Тибо', gordey: 'Гордей', evsey: 'Евсей', margaret: 'Графиня Маргарет' };
  // фраза героя, когда он берёт дело (примеры речи из канона)
  const PHRASE = {
    gordey: 'Говори. Я подожду.',
    evsey: 'Летописец отмечает: дело принято. Запись внесена.',
    margaret: 'Не бойся, милый. Я не кусаю тех, кто мне должен. Пока.'
  };
  const open = h => h === 'margaret' ? !!(S.f.margOpen || S.f.margFreed) : !!S.f[h + 'Open'];
  window.secretHeroes = () => SECRET.filter(open);

  // агенты Палаты по делам — их Гордей узнаёт в лицо
  const AGENTS = ['remez', 'lykov', 'iov', 'tkach', 'lukash', 'herald', 'sedoy'];
  const CASES = ['train', 'boat', 'monast', 'polar', 'ball', 'fort', 'noon'];
  const RB = { train: 'rollback', boat: 'boatRollback', monast: 'monRollback', polar: 'polRollback', ball: 'ballRollback', fort: 'fortRollback', noon: 'noonRollback' };
  const actsDone = () => ['act1done', 'act2done', 'act3done', 'b_solved', 'act4done'].filter(k => S.f[k]).length;

  // ---------- вычисляемые флаги ----------
  const d0 = window.deriveLoc;
  window.deriveLoc = function () {
    d0 && d0();
    const f = S.f;
    f.margHero = !!(f.margOpen || f.margFreed);
    f.secretAny = !!(f.gordeyOpen || f.evseyOpen || f.margHero);
    f.g_canTrial = !!(f.act2done && f.g_invited && !f.gordeyOpen && !f.g_trial && (!f.g_failN || actsDone() > f.g_failN));
    f.g_wait = !!(f.g_failN && !f.gordeyOpen && !f.g_canTrial);
  };

  // ---------- Смотритель: кто ведёт следующее дело ----------
  const smN = ST.dialogs.smotritel.nodes;
  { const ch = smN.menu.choices; let at = 0; ch.forEach((c, i) => { if (/^Я готов/.test(c.t)) at = i + 1; }); // в меню видно 4 пункта — ставим сразу за «Я готов…»
    ch.splice(at, 0, { t: 'Пусть следующее дело ведёт другой.', go: 'swapHero', if: 'secretAny' }); }
  smN.swapHero = { lines: [['smotritel', 'smile', 'Кто на этот раз? Мне, признаться, всё равно — а вам, кажется, нет.']],
    choices: Object.keys(NAMES).map(h => ({ t: NAMES[h], go: 'sw_' + h, hero: h, if: (SECRET.includes(h) ? (h === 'margaret' ? 'margHero' : h + 'Open') + '&' : '') + '!hero:' + h }))
      .concat([{ t: 'Пусть остаётся как есть.', exit: true }]), many: true };
  Object.keys(NAMES).forEach(h => { smN['sw_' + h] = { lines: [], do: 'pickHero2:' + h }; });

  // ---------- Гордей: испытание палача ----------
  const gd = ST.dialogs.gordey, gn = gd.nodes;
  gn.hub.route = [['gordeyOpen', 'opened'], ['g_invited', 'again'], ['', 'inv']];
  gn.opened = { lines: [['gordey', 'neutral', 'Зови.']], go: 'menu' };
  gn.what.lines = [gn.what.lines[0]];
  gn.what.route = [['g_canTrial', 'whatNow'], ['', 'whatLater']];
  gn.whatNow = { lines: [['gordey', 'neutral', 'Готов?']], set: ['g_what'], go: 'menu' };
  gn.whatLater = { lines: [['gordey', 'neutral', 'Не сейчас. Позже.']], set: ['g_what'], go: 'menu' };
  gn.menu.choices.splice(0, 0,
    { t: 'Я готов. Веди.', go: 'trialGo', if: 'g_canTrial&g_what' },
    { t: 'Ещё раз. Я готов.', go: 'trialGo2', if: 'g_canTrial&g_failN' },
    { t: 'Пустишь ещё раз?', go: 'trialWait', if: 'g_wait' },
    { t: 'Пойдёшь со мной на дело?', go: 'withMe', if: 'gordeyOpen' });
  gn.trialGo = { lines: [
    ['gordey', 'neutral', 'Часы держу я.'],
    [null, null, 'Палач кладёт тяжёлую ладонь тебе на плечо. Вокзал гаснет. В лицо бьёт снег, где-то бьёт колокол к повечерию.'],
    ['det', null, 'Монастырь. Снова.'],
    ['gordey', 'neutral', 'Без отката. Без подсказок. Один раз.']], do: 'gTrial' };
  gn.trialGo2 = { lines: [['gordey', 'neutral', 'Один раз.']], do: 'gTrial' };
  gn.trialWait = { lines: [['gordey', 'neutral', 'После следующего дела.']], go: 'menu' };
  gn.withMe = { lines: [['gordey', 'neutral', 'Скажи Смотрителю.']], go: 'menu' };

  ST.scenes.gTrialWin = { start: 'w', nodes: { w: { bg: 'none', lines: [
    [null, null, 'Песок осыпается, и ты снова стоишь на платформе. Палач убирает ладонь с твоего плеча.'],
    ['gordey', 'neutral', 'Годен.'],
    [null, null, 'Впервые за всё время он смотрит прямо на тебя. Под капюшоном — железо и два тусклых огня.'],
    ['gordey', 'neutral', 'Позовёшь — приду.']], set: ['gordeyOpen'], do: 'gUnlock' } } };
  ST.scenes.gTrialLose = { start: 'l', nodes: { l: { bg: 'none', lines: [
    [null, null, 'Песок осыпается. Платформа, туман, тиканье. Палач уже стоит у выхода, как будто никуда не уходил.'],
    ['gordey', 'neutral', 'Ошибся.'],
    ['gordey', 'neutral', 'После следующего дела. Не раньше.']], end: true } } };

  let TRIAL = null;
  function trialStart() {
    closeDialog();
    TRIAL = { f: JSON.parse(JSON.stringify(S.f)), clues: S.clues.slice(), time: S.time, loops: S.loops, sus: S.sus, loot: (S.loot || []).slice() };
    S.clues = S.clues.filter(id => caseOf(id) !== 'monast');
    for (const id in ST.clues) if (ST.clues[id].cs === 'monast') delete S.f[id];
    for (const k in S.f) if (k.startsWith('m_')) delete S.f[k];
    NPCS.forEach(n => { if (n.loc === 'monast') delete S.f['met_' + n.id]; });
    S.f.g_trial = true; S.loops = 0; derive();
    enterLoc('monast');
    setTimeout(() => { toastMsg = 'Испытание палача: без отката, без подсказок, обвинить можно один раз.'; toastT = 5; }, 1200);
  }
  function trialEnd(win) {
    if (!TRIAL) return;
    closeDialog(); sandOn = true; sandEl.classList.add('on'); window.SFX && SFX.play('sand');
    setTimeout(() => {
      const T = TRIAL; TRIAL = null;
      S.f = T.f; S.clues = T.clues; S.time = T.time; S.loops = T.loops; S.sus = T.sus; S.loot = T.loot;
      delete S.f.g_trial;
      if (!win) S.f.g_failN = actsDone();
      derive(); updateInv();
      enterLoc('station');
      sandEl.classList.remove('on'); sandOn = false;
      setTimeout(() => { updateQuest(); startScene(win ? 'gTrialWin' : 'gTrialLose'); }, 700);
    }, 2600);
  }
  // победа — финал монастыря; поражение — откат (время вышло) или неверная улика
  const se0 = window.showEnding;
  window.showEnding = showEnding = function (id) {
    if (S.f.g_trial && id === 'monast') { trialEnd(true); return; }
    return se0(id);
  };
  const fin0 = window.finishLocation;
  window.finishLocation = function () {
    if (S.f.g_trial) { toastMsg = 'Палач не даёт подсказок.'; toastT = 2.5; return; }
    return fin0 && fin0();
  };

  // ---------- действия ----------
  const la0 = window.locAction;
  window.locAction = function (a, def) {
    if (a === 'gTrial') { trialStart(); return true; }
    if (a === 'mgInvite') { startScene('mgInvite'); return true; }
    if (a === 'gUnlock') { closeDialog(); unlockToast('gordey'); return true; }
    if (S.f.g_trial && a === 'monRollback') { trialEnd(false); return true; }
    if (a.startsWith('pickHero2:')) {
      const h = a.slice(10); closeDialog();
      for (const k in S.f) if (k.startsWith('hero:')) delete S.f[k];
      S.f['hero:' + h] = true; S.hero = h; S.f.heroPicked = true;
      window.setHeroFormsNow && setHeroFormsNow();
      if (window.rebuildBench) rebuildBench();
      syncNPCs();
      showBuff('Дело ведёт ' + NAMES[h], false, h);
      toastMsg = 'Теперь ты играешь за: ' + NAMES[h] + '.'; toastT = 3;
      derive(); updateQuest();
      if (PHRASE[h]) setTimeout(() => startSolo([['det', null, PHRASE[h]]]), 400);
      return true;
    }
    return la0 ? la0(a, def) : false;
  };

  // ---------- умения ----------
  // выбор улики: Гордей — неверная улика стоит всей петли; на испытании — всего испытания
  const ch0 = window.choose;
  window.choose = choose = function (i) {
    const c = D.opts && D.opts[i];
    if (c && c.evid !== undefined && !c.ok && c.fail !== c.next) {
      if (S.f.g_trial) { D.choosing = false; startSolo([[null, null, 'Не та улика. Палач молча качает головой.']], () => trialEnd(false)); return; }
      const rb = RB[curCase()];
      if (S.hero === 'gordey' && rb) {
        D.choosing = false; showBuff('Гордей: второго обвинения нет', true);
        startSolo([[null, null, 'Не та улика. Подозреваемый выпрямляется — он понял, что ты ошибся.'], ['det', null, '...'], [null, null, 'Палач не берёт слов назад. Часы идут назад сами.']], () => doAction(rb));
        return;
      }
    }
    return ch0(i);
  };
  let evShown = '';
  window.secretEvidence = function (ev, blood, good) {
    if (evShown === ev.q) return; evShown = ev.q;
    if (S.hero === 'margaret' && blood) setTimeout(() => showBuff('Графиня чует кровь: чья она — ей ясно'), 250);
    if (S.hero === 'gordey' && good) setTimeout(() => showBuff('Под взглядом палача ломаются быстрее'), 250);
  };
  // Гордей на допросе: агенты Палаты и испуганные свидетели
  const sd0 = window.startDialog;
  window.startDialog = startDialog = function (npc) {
    const loc = npc.loc || 'train', id = npc.id; evShown = '';
    if (S.hero === 'gordey' && CASES.includes(loc) && ST.cast[id]) {
      if (AGENTS.includes(id) && !S.f['ga_' + id]) {
        S.f['ga_' + id] = true;
        setTimeout(() => { showBuff('Гордей узнаёт агента Палаты в лицо'); toastMsg = 'Гордей помнит это лицо: ' + ST.cast[id].name + ' служит Палате.'; toastT = 4.5; }, 500);
      } else if (!AGENTS.includes(id) && !S.f['gf_' + id] && !/^b_/.test(id)) {
        S.f['gf_' + id] = true; S.time += 3;
        setTimeout(() => { showBuff('Свидетель боится палача: слова приходится вытягивать', true); }, 500);
      }
    }
    return sd0(npc);
  };
  // Евсей: правки в досье и подозрение Смотрителя
  const ac0 = window.addClue;
  window.addClue = addClue = function (id) {
    const fresh = id && ST.clues[id] && !S.clues.includes(id);
    const r = ac0(id);
    if (fresh && S.hero === 'evsey' && /^dossier/i.test(id)) setTimeout(() => { showBuff('Евсей: в досье правка — чернила свежее подписи'); toastMsg = 'Летописец отмечает: запись в досье исправлена позже, чем подписана. Не верь ей на слово.'; toastT = 5; }, 900);
    return r;
  };
  const fx0 = window.applyFx;
  window.applyFx = applyFx = function (n) {
    const r = fx0(n);
    if (n && n.sus && S.hero === 'evsey' && window.addSus) addSus(Math.ceil(n.sus * .5));
    return r;
  };

  // ---------- графиня в крепости ордена ----------
  // «Знать открывает ей двери»: брошь «Глаз Ордена» — знак мирского брата, которым был её отец; магистр узнаёт её
  // и сам отпирает ларец герольда. «Без приглашения хозяина не войдёт»: порог лекарской сестры Ульяны.
  const FX = 1800, gv = ST.dialogs.gervasiy;
  if (gv) {
    gv.nodes.menu.choices.splice(1, 0, { t: '(Графиня) Взгляните на мою брошь, магистр.', go: 'mgBrooch', if: 'hero:margaret', hide: 'r_magHelp|mg_brooch', hero: 'margaret' });
    gv.nodes.mgBrooch = { set: ['mg_brooch'], lines: [
      [null, null, 'Магистр поднимает глаза от молитвенника — и замирает. На твоей груди золотой глаз в кольце.'],
      ['gervasiy', 'surprised', 'Глаз Ордена… Такой носили мирские братья. Откуда он у служанки?'],
      ['det', null, 'От отца, милый. Он служил твоему ордену, пока орден не забыл, кому служит. За орденом должок.'],
      ['gervasiy', 'sad', 'Долги ордена я помню все. Чего ты хочешь?'],
      ['det', null, 'Чтобы двери, которые для слуг заперты, для меня открывались.']],
      route: [['r_caught', 'mgBrooch2'], ['', 'mgBrooch1']] };
    gv.nodes.mgBrooch1 = { lines: [['gervasiy', 'neutral', 'Придёт час — скажи. Ни один ларец ордена от тебя не будет заперт.']], set: ['mg_magDebt'], go: 'menu' };
    gv.nodes.mgBrooch2 = { buff: 'Графиня: знать открывает ей двери', lines: [['gervasiy', 'neutral', 'У меня ключ ко всем ларцам ордена. Даже к тому, что в гостевой башне. Пойдём — я отопру и не увижу, что ты возьмёшь.']], set: ['r_magHelp'], go: 'menu' };
    // долг помнят и позже: когда обвинение Лукашу предъявлено, магистр сам предлагает ключ
    gv.nodes.menu.choices.splice(2, 0, { t: '(Графиня) Пришёл час, магистр. Ларец герольда.', go: 'mgBrooch2', if: 'hero:margaret&mg_magDebt&r_caught', hide: 'r_magHelp', hero: 'margaret' });
  }
  const uly = ST.dialogs.ulyana;
  ST.inspect.mgUlyDoor = { label: 'порог лекарской', if: 'hero:margaret&!mg_invUly', lines: [], go: 'mgInvite' };
  ST.scenes.mgInvite = { start: 'a', nodes: {
    a: { lines: [
      [null, null, 'Ты останавливаешься на пороге. Дальше нога не идёт — будто под ней не камень, а край обрыва.'],
      ['det', null, 'Сестра! Позволишь войти? Ночь холодная, а у меня к тебе разговор.'],
      ['ulyana', 'worried', 'Служанка, а просится, как госпожа… Чего встала? Заходи, раз пришла. Только склянки не трогай.']],
      set: ['mg_invUly'], time: 4, end: true } } };
  INSPECT.push({ id: 'mgUlyDoor', x: FX - 12.2, z: -6.5, r: 1.2, loc: 'fort', lv: 0 });
  const fortL = LOC.fort; let mgBlockT = 0;
  if (fortL) {
    const b0 = fortL.block;
    fortL.block = function (x, z) {
      if (b0 && b0.call(this, x, z)) return true;
      if (S.hero !== 'margaret' || S.f.mg_invUly || (P.lv || 0) !== 0) return false;
      const lx = x - FX;
      if (lx < -13.1 && lx > -21 && z > -9.9 && z < -3.1) {
        const t = performance.now();
        if (t - mgBlockT > 5000) { mgBlockT = t; toastMsg = 'Графиня не переступит порог без приглашения хозяйки — сестры Ульяны.'; toastT = 3.5; }
        return true;
      }
      return false;
    };
  }

  // ---------- вокзал: фигуры секретных героев ----------
  const EVSEY_LOOK = { coat: '#3a4a66', vest: '#5a6a86', pants: '#262e40', boots: true, belt: '#c9a050', hair: '#c8d2e2', hairStyle: 'side', skin: '#c9b2a0', prop: 'book', eyeC: '#3a2a20' };
  const stL = LOC.station, stEnter = stL.enter;
  stL.enter = function (L) {
    stEnter.call(this, L);
    if (S.f.evseyOpen && !L.evsey) {
      L.evsey = addNPC('evsey', standAt(SX - 5.6, 6.15, '-z'), EVSEY_LOOK, { loc: 'station', name: 'Евсей' });
      L.blockers.push({ x: L.evsey.x, z: L.evsey.z, k: L.evsey }); blockers.push({ x: L.evsey.x, z: L.evsey.z, k: L.evsey });
    }
    syncNPCs();
    if (S.f.margHero && !S.f.margToast) { S.f.margToast = true; setTimeout(() => unlockToast('margaret'), 1500); }
  };
  ST.dialogs.evsey = { start: [['', 'hub']], nodes: {
    hub: { lines: [['evsey', 'neutral', 'Летописец отмечает: посетитель у табло дел. Час неизвестен. Здесь часы не ходят — здесь их ведут.']], go: 'menu' },
    menu: { lines: [], choices: [
      { t: 'Это ты писал Летопись?', go: 'e1', hide: 'ev_1' },
      { t: 'Что не так с табло?', go: 'e2', hide: 'ev_2' },
      { t: 'Пойдёшь с нами на дело?', go: 'e3' },
      { t: 'Уйти', exit: true }] },
    e1: { lines: [['evsey', 'neutral', 'Каждый приговор. Каждое дело. Каждую печать. Моей рукой.'], ['evsey', 'sad', 'Вы вырвали листы — и правильно сделали. Запись о краже внесена. Мною же.']], set: ['ev_1'], go: 'menu' },
    e2: { lines: [['evsey', 'neutral', 'Летописец отмечает: на табло — число дел. Летописец также отмечает, что ведёт это число не он.'], ['evsey', 'worried', 'Сверяйте счёт сами. Записывайте. Мне здесь давно не верят.']], set: ['ev_2'], go: 'menu' },
    e3: { lines: [['evsey', 'neutral', 'Запись внесена: летописец готов вести дело. Скажите Смотрителю.']], go: 'menu' } } };

  function unlockToast(h) { toastMsg = 'Открыт секретный герой: ' + ST.heroes[h].full + '. Выбрать — у Смотрителя.'; toastT = 5; window.SFX && SFX.play('buff'); }

  // кто из секретных героев сейчас «ты» — его фигура на вокзале и в финале прячется
  const SELF = { gordey: ['gordey'], evsey: ['evsey'], margaret: ['margaret', 'margaretN'] };
  function syncNPCs() {
    if (typeof NPCS === 'undefined') return;
    NPCS.forEach(n => {
      const mine = SELF[S.hero] && SELF[S.hero].includes(n.id) && (n.loc === 'station' || n.loc === 'noon');
      if (mine) { n.hidden = true; n.secretHid = true; }
      else if (n.secretHid) { n.hidden = false; n.secretHid = false; }
    });
  }
  window.syncSecretNPCs = syncNPCs;

  // 3D-модели: палач, летописец, графиня (на вокзале, на балу, в крепости, в замке)
  const H3 = { gordey: 1, evsey: 1, margaret: 1, margaretP: 1, margaretN: 1 };
  function attach3d() {
    if (!window.Heroes3D || typeof NPCS === 'undefined') return;
    const here = WORLD.cur;
    NPCS.forEach(n => {
      if (!H3[n.id] || n.model3d || n.h3 || (n.loc || 'train') !== here) return;
      n.h3 = true; Heroes3D.attach(n, (n.id === 'margaret' && here === 'station') || n.id === 'margaretP'); // графиня на лавке и в камере сидит
    });
  }

  // ---------- каждый кадр ----------
  let lastLoops = S.loops || 0, loopClues = 0, darkT = '', lastCur = '';
  const tl0 = window.tickLocation;
  window.tickLocation = function (dt) {
    const r = tl0 ? tl0(dt) : undefined;
    const cur = WORLD.cur;
    if (cur !== lastCur) { lastCur = cur; syncNPCs(); setTimeout(attach3d, 400); }
    // графиня видит в темноте; в вечном полдне — слабеет
    if (S.hero === 'margaret' && cur !== 'station') {
      if (cur === 'noon') {
        const busy = D.on || sandOn || endEl.classList.contains('on');
        if (!busy && S.f.n_started && !S.f.n_solved) S.time += dt / 6;
        if (darkT !== cur) { darkT = cur; setTimeout(() => showBuff('Графиня слабеет в вечном полдне: время для неё идёт быстрее', true), 1500); }
      } else {
        renderer.toneMappingExposure = 1.4;
        if (darkT !== cur) { darkT = cur; setTimeout(() => showBuff('Графиня видит в темноте'), 1500); }
      }
    }
    // Евсей помнит петлю: после отката видит, что изменилось
    if ((S.loops || 0) !== lastLoops) {
      const was = lastLoops; lastLoops = S.loops || 0;
      if (lastLoops > was && S.hero === 'evsey' && !S.f.g_trial) {
        const cc = curCase(), mine = S.clues.filter(id => caseOf(id) === cc), got = mine.slice(loopClues);
        loopClues = mine.length;
        setTimeout(() => {
          showBuff('Евсей помнит петлю №' + lastLoops);
          toastMsg = 'Летописец отмечает: петля ' + (lastLoops + 1) + '. ' + (got.length ? 'В прошлой найдено: ' + got.map(id => ST.clues[id].n).join(', ') + '.' : 'В прошлой ничего нового. Всё повторится — кроме тебя.');
          toastT = 6;
        }, 3200);
      }
    }
    return r;
  };

  // ---------- портреты по 3D-моделям ----------
  const base = window.portraitSVG;
  let pn = 0;
  const svg = defs => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 640"><defs>${defs}</defs>`;
  const grain = (id, f, oct, op, seed) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="${oct}" seed="${seed || 3}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${op} 0" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in"/></filter>`;
  const glowF = (id, r) => `<filter id="${id}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="${r}"/></filter>`;

  // ГОРДЕЙ: кожаный капюшон с железной личиной, янтарные прорези, решётка у рта, голые плечи в наколках
  function gordey(e) {
    const u = 'gd' + (pn++);
    let s = svg(
      `<linearGradient id="sk${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5038"/><stop offset=".3" stop-color="#c8957a"/><stop offset=".55" stop-color="#b07c62"/><stop offset="1" stop-color="#5e3a28"/></linearGradient>` +
      `<linearGradient id="hd${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050505"/><stop offset=".3" stop-color="#26241f"/><stop offset=".5" stop-color="#1a1916"/><stop offset=".75" stop-color="#2a2823"/><stop offset="1" stop-color="#060606"/></linearGradient>` +
      `<linearGradient id="sh${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".14"/><stop offset=".45" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>` +
      `<radialGradient id="eg${u}"><stop offset="0" stop-color="#fff0b8"/><stop offset=".4" stop-color="#ffaa30"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>` +
      grain('g' + u, .8, 3, .4, 11) + glowF('b' + u, 8)
    );
    // плечи и грудь
    s += `<path d="M10 640 Q14 520 96 470 Q170 432 250 438 Q330 432 404 470 Q486 520 490 640Z" fill="url(#sk${u})"/>`;
    s += `<path d="M10 640 Q14 520 96 470 Q170 432 250 438 Q330 432 404 470 Q486 520 490 640Z" fill="#8a5a40" filter="url(#g${u})" opacity=".35"/>`;
    s += `<path d="M150 560 Q200 600 250 590 Q300 600 350 560" stroke="#5a3624" stroke-width="3" fill="none" opacity=".5"/><path d="M250 470 L250 640" stroke="#5a3624" stroke-width="2" opacity=".35"/>`;
    // наколки: узор на плече и кельтский круг на груди
    s += `<g stroke="#3a2a30" stroke-width="5" fill="none" opacity=".72"><path d="M58 560 q20 -40 50 -30 q-10 30 20 40 q-30 10 -24 40"/><path d="M80 520 q30 -14 44 6 q-20 6 -14 26"/><path d="M40 610 q30 -20 56 0"/></g>`;
    s += `<g transform="translate(330 560)" stroke="#3a2a30" stroke-width="6" fill="none" opacity=".7"><circle r="38"/><circle r="22"/><path d="M-38 0 Q0 -30 38 0 Q0 30 -38 0Z"/><path d="M0 -38 Q30 0 0 38 Q-30 0 0 -38Z"/></g>`;
    // ремень фартука
    s += `<path d="M120 640 L190 470 L214 476 L150 640Z" fill="#4a2e1e" stroke="#20140c" stroke-width="3"/><path d="M164 560 l12 4 M178 526 l12 4" stroke="#8a6a3a" stroke-width="4"/>`;
    // капюшон с пелериной
    const hood = 'M120 520 Q130 470 152 430 Q138 360 146 270 Q154 150 250 140 Q346 150 354 270 Q362 360 348 430 Q370 470 380 520 Q320 498 250 500 Q180 498 120 520Z';
    s += `<path d="${hood}" fill="url(#hd${u})" stroke="#000" stroke-width="4"/><path d="${hood}" fill="url(#sh${u})"/><path d="${hood}" fill="#5a5448" filter="url(#g${u})" opacity=".45"/>`;
    s += `<path d="M162 200 Q250 150 338 200" stroke="#4a463e" stroke-width="2.5" fill="none" opacity=".6"/><path d="M152 430 Q250 452 348 430" stroke="#000" stroke-width="4" fill="none"/>`;
    s += `<path d="M168 470 Q200 486 250 488 Q300 486 332 470" stroke="#3a3830" stroke-width="2" fill="none" opacity=".7"/>`;
    // железная личина: пояс с заклёпками и прорезями
    s += `<path d="M168 246 Q250 226 332 246 L330 306 Q250 290 170 306Z" fill="#1c1b19" stroke="#000" stroke-width="3"/>`;
    s += `<path d="M168 246 Q250 226 332 246" stroke="#6a665c" stroke-width="2" fill="none" opacity=".7"/>`;
    s += [178, 206, 294, 322].map(x => `<circle cx="${x}" cy="${252 - (x > 200 && x < 300 ? 4 : 0)}" r="5" fill="#8a7a52" stroke="#1a140a" stroke-width="1.5"/>`).join('');
    s += [176, 324].map(x => `<circle cx="${x}" cy="296" r="4.5" fill="#8a7a52" stroke="#1a140a" stroke-width="1.5"/>`).join('');
    // глаз Палаты на лбу
    s += `<g transform="translate(250 212)"><path d="M-22 0 Q0 -16 22 0 Q0 16 -22 0Z" fill="none" stroke="#d8a840" stroke-width="3"/><circle r="6" fill="#d8a840"/>` + [-40, -20, 0, 20, 40].map(a => `<path d="M0 -14 L0 -22" stroke="#d8a840" stroke-width="2.4" transform="rotate(${a})"/>`).join('') + `</g>`;
    // прорези глаз
    const tilt = e === 'angry' ? 8 : (e === 'sad' || e === 'worried') ? -6 : 0;
    const h = e === 'surprised' ? 13 : e === 'smile' || e === 'sleepy' ? 4 : 8;
    const col = e === 'angry' ? '#ff5010' : e === 'sad' ? '#b07a30' : '#ffa62a';
    for (const sd of [-1, 1]) {
      const cx = 250 + sd * 40, inner = cx - sd * 26, outer = cx + sd * 26;
      const yI = 272 + tilt, yO = 270 - tilt * .3, hh = (e === 'smug' && sd > 0) ? 4 : h;
      s += `<ellipse cx="${cx}" cy="271" rx="40" ry="20" fill="${col}" opacity="${e === 'sad' ? .2 : .38}" filter="url(#b${u})"/>`;
      s += `<path d="M${inner} ${yI - hh / 2} L${outer} ${yO - hh / 2} L${outer} ${yO + hh / 2} L${inner} ${yI + hh / 2}Z" fill="${col}"/>`;
      s += `<path d="M${inner + sd * 6} ${yI - hh / 4} L${outer - sd * 6} ${yO - hh / 4}" stroke="#fff4c8" stroke-width="${Math.max(1.2, hh / 3)}" stroke-linecap="round"/>`;
    }
    // решётка у рта
    s += `<path d="M196 340 Q250 330 304 340 L300 388 Q250 398 200 388Z" fill="#141311" stroke="#000" stroke-width="3"/>`;
    const gap = e === 'surprised' ? 1.25 : e === 'angry' ? 1.1 : 1;
    s += [-2, -1, 0, 1, 2].map(k => `<rect x="${246 + k * 18 * gap - 3}" y="${348}" width="7" height="${34 + (e === 'surprised' ? 6 : 0)}" rx="2" fill="#050505"/>`).join('');
    s += `<path d="M196 340 Q250 330 304 340" stroke="#6a665c" stroke-width="2" fill="none" opacity=".6"/>`;
    return s + `</svg>`;
  }

  // ЕВСЕЙ: светящееся кольцо-циферблат, серебряные волосы, лицо наполовину синее, рог, стальные наплечники, том
  function evsey(e) {
    const u = 'ev' + (pn++);
    let s = svg(
      `<linearGradient id="ar${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a8b8d8"/><stop offset=".45" stop-color="#5a6c94"/><stop offset="1" stop-color="#28324c"/></linearGradient>` +
      `<linearGradient id="hr${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe6f2"/><stop offset=".6" stop-color="#9aa8c4"/><stop offset="1" stop-color="#5e6c8c"/></linearGradient>` +
      `<linearGradient id="fh${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c49a80"/><stop offset=".48" stop-color="#d8b096"/><stop offset=".52" stop-color="#6a7aa4"/><stop offset="1" stop-color="#3e4a72"/></linearGradient>` +
      `<linearGradient id="hn${u}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3a4668"/><stop offset="1" stop-color="#a8b8de"/></linearGradient>` +
      grain('g' + u, .9, 3, .35, 5) + glowF('b' + u, 10) + glowF('bs' + u, 3)
    );
    // кольцо-циферблат за спиной
    s += `<circle cx="250" cy="250" r="190" fill="none" stroke="#ffb030" stroke-width="16" opacity=".35" filter="url(#b${u})"/>`;
    s += `<circle cx="250" cy="250" r="190" fill="none" stroke="#e8a83a" stroke-width="10"/><circle cx="250" cy="250" r="166" fill="none" stroke="#58c8ff" stroke-width="12" opacity=".5" filter="url(#bs${u})"/><circle cx="250" cy="250" r="166" fill="none" stroke="#7ad4ff" stroke-width="5"/>`;
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, x1 = 250 + Math.sin(a) * 172, y1 = 250 - Math.cos(a) * 172, x2 = 250 + Math.sin(a) * 186, y2 = 250 - Math.cos(a) * 186; s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#fff0c8" stroke-width="${k % 3 ? 3 : 6}"/>`; }
    // плечи: стальные наплечники
    s += `<path d="M20 640 Q30 520 110 478 Q180 448 250 452 Q320 448 390 478 Q470 520 480 640Z" fill="#20283c"/>`;
    for (const sd of [-1, 1]) {
      const x = 250 + sd * 150;
      s += `<path d="M${x - sd * 96} 480 Q${x - sd * 10} 430 ${x + sd * 90} 470 Q${x + sd * 116} 520 ${x + sd * 104} 590 Q${x + sd * 30} 556 ${x - sd * 90} 530Z" fill="url(#ar${u})" stroke="#141a28" stroke-width="3"/>`;
      s += `<path d="M${x - sd * 80} 500 Q${x} 460 ${x + sd * 90} 494" stroke="#d8e2f4" stroke-width="2.5" fill="none" opacity=".6"/>`;
      s += `<path d="M${x - sd * 70} 530 Q${x} 500 ${x + sd * 96} 536" stroke="#141a28" stroke-width="3" fill="none"/>`;
    }
    s += `<path d="M180 470 Q250 452 320 470 L330 530 Q250 512 170 530Z" fill="url(#ar${u})" stroke="#141a28" stroke-width="3"/>`;
    s += `<g transform="translate(268 560)"><circle r="22" fill="none" stroke="#d8a840" stroke-width="5"/><path d="M0 -14 L0 0 L10 6" stroke="#d8a840" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
    // волосы сзади
    s += `<path d="M150 230 Q140 140 250 120 Q360 140 350 230 L366 470 Q330 440 320 400 L180 400 Q170 440 134 470Z" fill="url(#hr${u})" stroke="#4a5674" stroke-width="2"/>`;
    // рог справа (синяя половина)
    s += `<path d="M318 168 Q356 96 330 36 Q372 80 368 140 Q362 186 334 204Z" fill="url(#hn${u})" stroke="#1e2640" stroke-width="3"/><path d="M330 160 Q350 110 340 62" stroke="#d8e2f6" stroke-width="2" fill="none" opacity=".5"/>`;
    // лицо: левая половина человеческая, правая — синяя, в чешуе
    const face = 'M184 220 Q186 170 250 164 Q314 170 316 220 L312 330 Q300 382 250 396 Q200 382 188 330Z';
    s += `<path d="${face}" fill="url(#fh${u})" stroke="#3a3040" stroke-width="3"/>`;
    s += `<clipPath id="cl${u}"><path d="${face}"/></clipPath><g clip-path="url(#cl${u})" opacity=".5">` + Array.from({ length: 22 }, (_, i) => { const x = 258 + (i % 4) * 16 + (Math.floor(i / 4) % 2) * 8, y = 196 + Math.floor(i / 4) * 34; return `<path d="M${x - 8} ${y} q8 -10 16 0 q-8 10 -16 0Z" fill="none" stroke="#283458" stroke-width="2"/>`; }).join('') + `</g>`;
    s += `<path d="M250 168 L250 394" stroke="#2a3050" stroke-width="2" opacity=".55"/>`;
    // брови и глаза
    const bt = e === 'angry' ? 8 : (e === 'sad' || e === 'worried') ? -7 : e === 'surprised' ? -10 : 0;
    s += `<path d="M206 ${246 - (e === 'surprised' ? 8 : 0)} Q224 ${236 + bt * .3} 242 ${244 + bt}" stroke="#6a5444" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M294 ${246 - (e === 'surprised' ? 8 : 0)} Q276 ${236 + bt * .3} 258 ${244 + bt}" stroke="#1c2440" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    const ery = e === 'surprised' ? 9 : e === 'sleepy' ? 2 : (e === 'smug' || e === 'smile') ? 4.5 : 6.5;
    s += `<ellipse cx="224" cy="264" rx="14" ry="${ery}" fill="#f2ece4"/><circle cx="224" cy="264" r="${Math.min(5.5, ery)}" fill="#4a2e1c"/><circle cx="226" cy="262" r="1.5" fill="#fff"/>`;
    s += `<ellipse cx="276" cy="264" rx="14" ry="${ery}" fill="#e8d07a"/><ellipse cx="276" cy="264" rx="2.5" ry="${Math.max(1.5, ery)}" fill="#1a1408"/><ellipse cx="276" cy="264" rx="18" ry="${ery + 6}" fill="#ffd060" opacity=".22" filter="url(#bs${u})"/>`;
    // нос и рот
    s += `<path d="M250 270 L244 318 Q250 324 258 318" stroke="#5a4038" stroke-width="2.5" fill="none" opacity=".6"/>`;
    const my = 350;
    if (e === 'smile' || e === 'smug') s += `<path d="M226 ${my} Q250 ${my + (e === 'smug' ? 6 : 12)} 276 ${my - (e === 'smug' ? 6 : 0)}" stroke="#4a2e2e" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    else if (e === 'surprised') s += `<ellipse cx="250" cy="${my + 2}" rx="10" ry="12" fill="#2a1416"/>`;
    else if (e === 'sad' || e === 'worried') s += `<path d="M228 ${my + 6} Q250 ${my - 6} 272 ${my + 6}" stroke="#4a2e2e" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    else s += `<path d="M228 ${my} L272 ${my}" stroke="#4a2e2e" stroke-width="4" stroke-linecap="round"/>`;
    // пряди спереди
    s += `<path d="M184 220 Q192 160 250 150 Q228 178 214 240 Q200 300 196 360 Q180 300 184 220Z" fill="url(#hr${u})" stroke="#4a5674" stroke-width="2"/>`;
    s += `<path d="M316 220 Q308 160 250 150 Q284 170 292 220 Q300 280 306 350 Q320 290 316 220Z" fill="url(#hr${u})" stroke="#4a5674" stroke-width="2"/>`;
    // открытый том внизу
    s += `<g transform="translate(96 584) rotate(-8)"><path d="M-70 -28 Q-36 -40 0 -26 Q36 -40 70 -28 L70 30 Q36 18 0 32 Q-36 18 -70 30Z" fill="#efe6d0" stroke="#3a2a18" stroke-width="3"/><path d="M0 -26 L0 32" stroke="#6a5030" stroke-width="2"/>` +
      [-14, -4, 6, 16].map(y => `<path d="M-60 ${y} L-10 ${y - 3} M10 ${y - 3} L60 ${y}" stroke="#8a7a60" stroke-width="2"/>`).join('') + `</g>`;
    return s + `</svg>`;
  }

  // ГРАФИНЯ МАРГАРЕТ: кружевной капюшон, ровная чёлка до носа, бледная кожа, тёмно-красные губы, золотое кольцо-брошь
  function margaret(e) {
    const u = 'mg' + (pn++);
    let s = svg(
      `<linearGradient id="sk${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8ccd0"/><stop offset=".4" stop-color="#f8f2f2"/><stop offset="1" stop-color="#cabcc2"/></linearGradient>` +
      `<linearGradient id="dr${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a1420"/><stop offset="1" stop-color="#3a080e"/></linearGradient>` +
      `<linearGradient id="hd${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050406"/><stop offset=".45" stop-color="#201c22"/><stop offset="1" stop-color="#060507"/></linearGradient>` +
      `<radialGradient id="eg${u}"><stop offset="0" stop-color="#ffd0d0"/><stop offset=".4" stop-color="#ff3040"/><stop offset="1" stop-color="#a00010" stop-opacity="0"/></radialGradient>` +
      grain('g' + u, 1.1, 2, .3, 9) + glowF('b' + u, 6)
    );
    // красное платье и чёрная кружевная пелерина
    s += `<path d="M40 640 Q50 540 130 494 Q190 466 250 468 Q310 466 370 494 Q450 540 460 640Z" fill="url(#dr${u})"/>`;
    const cape = 'M70 640 Q84 540 150 492 Q200 470 250 472 Q300 470 350 492 Q416 540 430 640 L360 610 L320 640 L280 606 L250 640 L220 606 L180 640 L140 610Z';
    s += `<path d="${cape}" fill="#0e0b10" stroke="#000" stroke-width="3"/>`;
    s += `<path d="${cape}" fill="none" stroke="#3a3440" stroke-width="1.5" stroke-dasharray="3 5" opacity=".8"/>`;
    s += `<path d="M140 610 L180 640 L220 606 L250 640 L280 606 L320 640 L360 610" stroke="#c9a050" stroke-width="3" fill="none"/>`;
    s += `<g transform="translate(250 560)"><circle r="30" fill="none" stroke="#c9a050" stroke-width="7"/>` + [0, 60, 120, 180, 240, 300].map(a => `<rect x="-5" y="-38" width="10" height="12" fill="#c9a050" transform="rotate(${a})"/>`).join('') + `</g>`;
    // шея
    s += `<path d="M222 400 L220 476 Q250 486 280 476 L278 400Z" fill="url(#sk${u})"/>`;
    // капюшон
    const hood = 'M134 480 Q120 380 140 270 Q158 136 250 126 Q342 136 360 270 Q380 380 366 480 Q330 452 312 410 L306 250 Q250 196 194 250 L188 410 Q170 452 134 480Z';
    s += `<path d="${hood}" fill="url(#hd${u})" stroke="#000" stroke-width="3"/><path d="${hood}" fill="#4a4050" filter="url(#g${u})" opacity=".3"/>`;
    s += `<path d="M176 420 Q172 300 196 240 Q250 186 304 240 Q328 300 324 420" fill="none" stroke="#5a5060" stroke-width="2" stroke-dasharray="2 6" opacity=".8"/>`;
    // лицо
    const face = 'M196 250 Q200 206 250 202 Q300 206 304 250 L300 346 Q290 396 250 410 Q210 396 200 346Z';
    s += `<path d="${face}" fill="url(#sk${u})" stroke="#9a8a90" stroke-width="2"/>`;
    // глаза под чёлкой: два красных отблеска
    const gl = e === 'angry' ? .95 : e === 'sad' ? .35 : e === 'surprised' ? .8 : .6;
    for (const sd of [-1, 1]) s += `<ellipse cx="${250 + sd * 28}" cy="282" rx="16" ry="${e === 'surprised' ? 9 : 6}" fill="url(#eg${u})" opacity="${gl}" filter="url(#b${u})"/>`;
    // ровная чёлка до носа
    s += `<path d="M190 250 Q196 200 250 194 Q304 200 310 250 L312 298 Q296 292 282 300 Q266 290 250 298 Q234 290 218 300 Q204 292 188 298Z" fill="#0c0a0e" stroke="#000" stroke-width="2"/>`;
    s += [204, 222, 240, 258, 276, 294].map(x => `<path d="M${x} 214 L${x + 2} 292" stroke="#2a2630" stroke-width="2" opacity=".7"/>`).join('');
    for (const sd of [-1, 1]) s += `<circle cx="${250 + sd * 28}" cy="300" r="${e === 'angry' ? 3 : 2}" fill="#ff4050" opacity="${gl}"/>`;
    // нос, румянец
    s += `<path d="M250 312 L246 336 Q250 340 256 336" stroke="#a89098" stroke-width="2" fill="none"/>`;
    // губы и клыки
    const my = 366;
    if (e === 'smile' || e === 'smug') {
      s += `<path d="M228 ${my - 2} Q250 ${my + (e === 'smug' ? 6 : 12)} 274 ${my - (e === 'smug' ? 8 : 2)} Q250 ${my + (e === 'smug' ? 14 : 20)} 228 ${my - 2}Z" fill="#7a0e1c"/>`;
      s += `<path d="M238 ${my + 2} l3 9 l3 -8 M256 ${my + 2} l3 9 l3 -9" fill="#fbf6f2" stroke="#fbf6f2" stroke-width="1"/>`;
    } else if (e === 'angry') {
      s += `<path d="M228 ${my} Q250 ${my - 8} 272 ${my} Q250 ${my + 16} 228 ${my}Z" fill="#5a0812"/><path d="M236 ${my - 2} l3 12 l3 -11 M258 ${my - 2} l3 12 l3 -12" fill="#fbf6f2"/>`;
    } else if (e === 'surprised') s += `<ellipse cx="250" cy="${my + 2}" rx="11" ry="13" fill="#3a0610" stroke="#7a0e1c" stroke-width="4"/>`;
    else if (e === 'sad' || e === 'worried') s += `<path d="M232 ${my + 6} Q250 ${my - 4} 268 ${my + 6} Q250 ${my + 4} 232 ${my + 6}Z" fill="#7a0e1c" stroke="#7a0e1c" stroke-width="3"/>`;
    else s += `<path d="M230 ${my} Q250 ${my - 5} 270 ${my} Q250 ${my + 9} 230 ${my}Z" fill="#7a0e1c"/>`;
    s += `<path d="M266 ${my + 6} q2 10 -1 16" stroke="#9a0a1a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
    // кружевная кайма капюшона у лица
    s += Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (.08 + i * .07), x = 250 - Math.cos(a) * 66, y = 250 - Math.sin(a) * 60 + (i < 2 || i > 10 ? 40 : 0); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="none" stroke="#4a4252" stroke-width="2"/>`; }).join('');
    return s + `</svg>`;
  }
  const SP = { gordey, evsey, margaret, margaretP: margaret, margaretN: margaret };
  window.portraitSVG = function (id, expr) { return SP[id] ? SP[id](expr || 'neutral') : base(id, expr); };
})();
