// Интерлюдии на вокзале (по документу «Интерлюдии: что происходит между делами»):
// разговоры пар на лавке — ранний / средний / поздний (не больше одного нового за интерлюдию),
// фразы Смотрителя за каждые три лилии, тон Смотрителя по подозрению, поддержка после серии откатов.
(function () {
  const SD = window.STORY;
  const SX = 300;

  // ---------- разговоры пар ----------
  // stage: 2 — средний (после акта 2), 3 — поздний (после акта 3 или 4); need — дополнительное условие
  const TALKS = [
    { id: 'rtMid', a: 'rowen', b: 'tibo', stage: 2, title: 'Ровен и Тибо: честно ли подделывать ради правды', lines: [
      ['tibo', 'smug', 'Рыцарь, вопрос чести. Если я подделаю улику — а она укажет на настоящего убийцу. Это ложь или правда?'],
      ['rowen', 'angry', 'Ложь. Улика должна быть настоящей.'],
      ['tibo', 'neutral', 'А досье Палаты — настоящее? Нам в монастыре выдали враньё с печатью. По-вашему, это правда, раз бумага настоящая?'],
      ['rowen', 'neutral', '…Правда — это то, что было. А не то, что написано.'],
      ['tibo', 'smile', 'Вот. Мы с вами почти договорились. Ещё пара дел — и вы начнёте мне платить за уроки.']] },
    { id: 'rtLate', a: 'rowen', b: 'tibo', stage: 3, need: 'act4done|orderSeal|act3done', title: 'Ровен и Тибо: «Один раз»', lines: [
      ['rowen', 'neutral', 'Тибо. Мне нужна твоя рука.'],
      ['tibo', 'surprised', 'Моя? Рыцарь просит вора? Запишу дату.'],
      ['rowen', 'sad', 'Подделай приказ. Если понадобится. Один раз. Ради них — ради тех, кто сидит в подвалах.'],
      ['tibo', 'neutral', 'Один раз… Знаете, я всю жизнь подделывал ради себя. Ради кого-то — впервые.'],
      [null, null, 'Тибо протягивает руку. Ровен жмёт её — крепко, по-рыцарски.']] },
    { id: 'maMid', a: 'miron', b: 'agata', stage: 2, title: 'Мирон и Агата: во что верить', lines: [
      ['miron', 'neutral', 'Сестра. А ты-то сама во что веришь? После всего этого.'],
      ['agata', 'sad', 'Раньше знала. Устав, молитвы, исповедь. А теперь видела, как монахи прячут святого старца в леднике за монеты с лилией.'],
      ['agata', 'neutral', 'Я больше не знаю, во что верю. Знаю только, кому — тебе, ворону и этой лавке.'],
      ['miron', 'smile', 'Ну, это уже вера. Мелкая, зато своя.']] },
    { id: 'maLate', a: 'miron', b: 'agata', stage: 3, title: 'Мирон и Агата: шов', lines: [
      [null, null, 'У Мирона на плече разошёлся шов. Агата молча достаёт иголку.'],
      ['miron', 'neutral', 'Больно не будет. Я ж не живой. Наверное.'],
      ['agata', 'neutral', 'Сиди смирно.'],
      [null, null, 'Она шьёт и шепчет. Это не церковная молитва — свои слова, тихие, простые. Мирон закрывает пуговичный глаз.'],
      ['miron', 'sad', 'Спасибо, сестра. Так меня ещё никто не отпевал. Живого.']] },
    { id: 'atMid', a: 'agata', b: 'tibo', stage: 2, title: 'Агата и Тибо: как звучит ложь Смотрителя', lines: [
      ['tibo', 'neutral', 'Сестра. Вы слышите ложь. Как фальшивую ноту. А как звучит ложь Смотрителя?'],
      ['agata', 'worried', 'В том-то и дело — никак.'],
      ['tibo', 'surprised', 'Никак? Он что, правду говорит?'],
      ['agata', 'neutral', 'Он вообще ничего не говорит. Слова есть, а звука нет. Как будто человек давно разучился быть кем-то.']] },
    { id: 'atLate', a: 'agata', b: 'tibo', stage: 3, title: 'Агата и Тибо: правда о себе', lines: [
      ['tibo', 'neutral', 'Сестра. Один раз — без фокусов. Можно?'],
      ['agata', 'neutral', 'Говори.'],
      ['tibo', 'sad', 'Я не родился шулером. Я был мальчишкой при монетном дворе. Отец чеканил честные кроны, а его повесили за чужие. Я стал подделывать, чтобы найти, кто чеканил те.'],
      ['agata', 'smile', 'Это правда. Целиком. Впервые от тебя — ни одной фальшивой ноты.'],
      ['tibo', 'smile', 'Не привыкайте.']] },
    { id: 'rmMid', a: 'rowen', b: 'miron', stage: 2, title: 'Ровен и Мирон: кого он спасал', lines: [
      ['rowen', 'neutral', 'Могильщик. Ты спрашивал про подвал крепости.'],
      ['rowen', 'sad', 'Там сидели люди из других времён. Девушка в странной одежде. Старик, который говорил, что в его веке летают по небу. Мальчишка, что всё звал маму на чужом языке.'],
      ['rowen', 'neutral', 'Их приказали сжечь. Печать Короля. Я открыл двери и поджёг всё остальное.'],
      ['miron', 'neutral', 'Выходит, ты не жёг. Ты выпускал.']] },
    { id: 'rmLate', a: 'rowen', b: 'miron', stage: 3, need: 'act4done', title: 'Ровен и Мирон: пустые гробы', lines: [
      ['miron', 'sad', 'Рыцарь. Я видел, как горела твоя крепость. Своими глазами — в ту ночь.'],
      ['miron', 'neutral', 'Тех, кто сгорел, хоронил не я. Их не было. Гробы были пустые с самого начала.'],
      ['rowen', 'sad', 'Я знаю.'],
      ['miron', 'neutral', 'Прости, что копал под тебя. Буквально.']] },
    { id: 'gaEarly', a: 'margaret', b: 'agata', stage: 1, need: 'margOpen|margFreed', title: 'Графиня и Агата: исповедь отца', lines: [
      ['margaret', 'neutral', 'Сестра. Вы были с моим отцом в его последний час. Что он сказал?'],
      ['agata', 'sad', 'Это тайна исповеди, графиня. Даже для дочери.'],
      ['margaret', 'sad', 'Я триста лет жду этих слов.'],
      ['agata', 'neutral', 'Тогда подождите ещё немного. Я не отказываю. Я думаю.']] },
    { id: 'gaMid', a: 'margaret', b: 'agata', stage: 2, need: 'gaEarly', title: 'Графиня и Агата: одна фраза', lines: [
      ['agata', 'neutral', 'Графиня. Одну фразу я вам скажу. Он разрешил бы.'],
      ['agata', 'smile', 'Он сказал, что вы — его лучшее создание.'],
      [null, null, 'Графиня долго молчит. Потом отворачивается к туману, и плечи у неё вздрагивают.']] },
    { id: 'gmEarly', a: 'margaret', b: 'miron', stage: 1, need: 'margOpen|margFreed', title: 'Графиня и Мирон: вернувшиеся', lines: [
      ['miron', 'smile', 'Графиня. Вас бы в моём ремесле не схоронили — вы бы из гроба вылезли и счёт выставили.'],
      ['margaret', 'smile', 'А вас, могильщик, похоронили бы — и вы бы всё равно вышли. С вороном.'],
      ['miron', 'neutral', 'Двое вернувшихся. Хорошая компания.']] },
    { id: 'gmMid', a: 'margaret', b: 'miron', stage: 2, need: 'gmEarly', title: 'Графиня и Мирон: что каждый потерял', lines: [
      [null, null, 'Мирон и графиня долго сидят молча.'],
      ['margaret', 'sad', 'Я потеряла отца. И солнце.'],
      ['miron', 'sad', 'А я — всё, кроме лопаты и ворона.'],
      [null, null, 'Карр перебирается графине на плечо. Она не прогоняет его.']] }
  ];
  Object.assign(SD.cast, { margaret: SD.cast.margaret || { name: 'Графиня Маргарет', role: 'хозяйка Чернолесья' } });

  // текущая интерлюдия = сколько дел закрыто
  const stageOf = f => (f.act4done ? 4 : f.act3done ? 3 : f.act2done ? 2 : f.act1done ? 1 : 0);
  const d0 = window.deriveLoc;
  window.deriveLoc = function () {
    d0 && d0();
    const f = S.f, st = stageOf(f);
    f.iluFree = !f['iluUsed' + st];
    TALKS.forEach(t => { f['can_' + t.id] = !!(f.iluFree && !f[t.id] && st >= t.stage && (!t.need || t.need.split('|').some(k => f[k]))); });
    // лилии: каждая тройка — новая фраза Смотрителя
    const n = Math.floor(STORY_lilies() / 3), heard = f.lilyHeard || 0;
    for (let k = 1; k <= 12; k++) f['lilyNext' + k] = (k === heard + 1 && n >= k);
    f.lilyMore = n > heard;
  };
  const STORY_lilies = () => (S.clues || []).filter(c => STORY.clues[c] && STORY.clues[c].lily).length;

  // реплики разговоров — в диалоги героев на лавке
  ['rowen', 'miron', 'agata', 'tibo'].forEach(h => {
    const d = SD.dialogs['b_' + h]; if (!d) return;
    TALKS.filter(t => t.a === h || t.b === h).forEach(t => {
      const other = t.a === h ? t.b : t.a;
      d.nodes['ilu_' + t.id] = { lines: t.lines, set: [t.id], go: 'menu', iluTalk: true };
      d.nodes.menu.choices.unshift({ t: '«…» ' + t.title.split(': ')[1].replace(/^./, c => c.toUpperCase()), go: 'ilu_' + t.id, if: 'can_' + t.id + (other === 'margaret' ? '' : '') });
    });
  });
  // графиня на лавке — свои разговоры
  // на вокзале у графини своё меню — без вопросов с бала
  const MG = SD.dialogs.margaret;
  MG.start.unshift(['station_here', 'hubS']);
  MG.nodes.hubS = { lines: [['margaret', 'neutral', 'На этой лавке жёстко. Но здесь — свои.']], go: 'menuS' };
  MG.nodes.menuS = { lines: [], choices: TALKS.filter(t => t.a === 'margaret').map(t => ({ t: '«…» ' + t.title.split(': ')[1].replace(/^./, c => c.toUpperCase()), go: 'ilu_' + t.id, if: 'can_' + t.id }))
    .concat([{ t: 'Каково вам здесь, на вокзале?', go: 'gStation', hide: 'g_stat' }, { t: 'Уйти', exit: true }]) };
  MG.nodes.gStation = { lines: [['margaret', 'neutral', 'Свет здесь тусклеет, когда я рядом. Смотритель роняет чашки. Мне почти нравится.']], set: ['g_stat'], go: 'menuS' };
  TALKS.filter(t => t.a === 'margaret').forEach(t => { MG.nodes['ilu_' + t.id] = { lines: t.lines, set: [t.id], go: 'menuS', iluTalk: true }; });

  // помечаем интерлюдию использованной (не больше одного нового разговора)
  const run0 = window.runNode;
  window.runNode = function (id) {
    const n = D.dlg && D.dlg.nodes && D.dlg.nodes[id];
    if (n && n.iluTalk) { S.f['iluUsed' + stageOf(S.f)] = true; derive(); }
    return run0.apply(this, arguments);
  };

  // ---------- фразы Смотрителя за лилии ----------
  const LILY = [
    'Лилия — герб Палаты. Красивый, правда?',
    'Палата есть везде, где нужна справедливость.',
    'Иногда справедливости нужно немного помочь.',
    'Золото не пахнет. Даже чужое.',
    'Вы когда-нибудь думали, сколько стоит один солнечный день?',
    'Король ни разу не болел. За триста лет ни разу.',
    'Не все, кто носит лилию, носят её добровольно.',
    'Счёт — это не число. Это обещание. А обещания иногда пересматривают.',
    'Ваше прошлое тоже кто-то записал. Очень аккуратным почерком.',
    'У любого механизма есть слабое место. Даже у тех, что считают песок.',
    'Я тоже когда-то собирал лилии.',
    'Номер два. Запомните. Больше мне это сказать некому.'];
  const sm = SD.dialogs.smotritel;
  const old = sm.nodes.menu.choices.findIndex(c => c.go === 'lily'); if (old >= 0) sm.nodes.menu.choices.splice(old, 1);
  sm.nodes.menu.choices.splice(1, 0, { t: 'Я нашёл ещё лилии.', go: 'lilyR', if: 'lilyMore' });
  sm.nodes.lilyR = { lines: [], route: LILY.map((_, i) => ['lilyNext' + (i + 1), 'lily' + (i + 1)]).concat([['', 'menu']]) };
  LILY.forEach((s, i) => { sm.nodes['lily' + (i + 1)] = { lines: [['smotritel', i >= 10 ? 'sad' : 'smile', s]], do: 'lilyHeard:' + (i + 1), go: 'menu' }; });
  const la0 = window.locAction;
  window.locAction = function (a, def) {
    if (a.startsWith('lilyHeard:')) { const k = +a.split(':')[1]; S.f.lilyHeard = Math.max(S.f.lilyHeard || 0, k); S.f['lilyPhrase' + k] = true; derive(); toastMsg = 'Фраза Смотрителя записана в блокнот, раздел «Лилии».'; toastT = 2.5; if (D.on && D.node && D.node.go) runNode(D.node.go); return true; }
    return la0 ? la0(a, def) : false;
  };
  // фразы — как записи в блокноте (раздел улик вокзала)
  LILY.forEach((s, i) => { SD.clues['lilyPhrase' + (i + 1)] = { n: 'Смотритель о лилиях · ' + (i + 1), t: '«' + s + '»', cs: 'station' }; });
  const la1 = window.locAction;
  window.locAction = function (a, def) {
    if (a.startsWith('lilyHeard:')) { const r = la1(a, def); const k = +a.split(':')[1]; if (!S.clues.includes('lilyPhrase' + k)) S.clues.push('lilyPhrase' + k); return r; }
    return la1(a, def);
  };

  // тон Смотрителя по подозрению задаёт villain.js (динамические реплики); здесь — только где он стоит (см. ниже)

  // ---------- поддержка после серии откатов ----------
  const CHEER = {
    rowen: [['rowen', 'neutral', 'Садись. Долго тебя крутило?'], ['rowen', 'neutral', 'Меня в первом бою трижды сбивали с коня. На четвёртый я понял, куда смотреть. Ты тоже поймёшь.']],
    miron: [['miron', 'smile', 'Опять на кладбище побывал? По лицу вижу.'], ['miron', 'neutral', 'Я тоже по три раза одну яму копаю, пока ровно не выйдет. Это не провал. Это ремесло.']],
    agata: [['agata', 'neutral', 'Выпей воды. Не чаю — воды.'], ['agata', 'smile', 'Петля не наказывает, она учит. Злая учительница, но учит. Ты ближе, чем думаешь.']],
    tibo: [['tibo', 'smile', 'Проигрался? Бывает. Я однажды проиграл всё, включая шляпу.'], ['tibo', 'neutral', 'Главный секрет шулера: смотри не на карты, а на того, кто их сдаёт. Попробуй ещё раз — по-другому.']]
  };
  Object.assign(SD.scenes, {
    cheer: { start: 'c0', nodes: Object.assign({ c0: { bg: 'none', lines: [[null, null, 'Кто-то из героев подсаживается к тебе на край лавки.']], route: ['rowen', 'miron', 'agata', 'tibo'].map(h => ['cheer_' + h, 'c_' + h]) } },
      Object.fromEntries(['rowen', 'miron', 'agata', 'tibo'].map(h => ['c_' + h, { lines: CHEER[h], end: true }]))) }
  });

  // ---------- вокзал: применяем при входе ----------
  const stL = WORLD.LOC.station, stEnter = stL.enter;
  stL.enter = function (L) {
    stEnter.call(this, L);
    const f = S.f, sus = S.sus || 0;
    f.susMid = sus >= 20 && sus < 45; f.susHigh = sus >= 45; f.station_here = true;
    // при высоком подозрении Смотритель стоит у выхода рядом с палачом
    const smN = NPCS.find(n => n.id === 'smotritel' && n.loc === 'station');
    if (smN) { const x = f.susHigh ? SX + 12.0 : SX + 3.6, z = f.susHigh ? 5.4 : 5.7; smN.x = x; smN.z = z; smN.st.root.position.set(x, 0, z); const b = L.blockers.find(q => q.x > SX + 3 && q.x < SX + 4.2 && Math.abs(q.z - 5.7) < .1) || null; if (b) { b.x = x; b.z = z; } }
    // серия откатов с прошлого визита — кто-то подсаживается
    const loops = S.loops || 0, last = f.loopsAtStation === undefined ? loops : f.loopsAtStation;
    f.loopsAtStation = loops;
    if (loops - last >= 3) {
      const others = ['rowen', 'miron', 'agata', 'tibo'].filter(h => h !== S.hero); const h = others[loops % others.length];
      ['rowen', 'miron', 'agata', 'tibo'].forEach(k => delete f['cheer_' + k]); f['cheer_' + h] = true;
      setTimeout(() => { if (!D.on) startScene('cheer'); }, 2200);
    }
    derive();
  };
  // уходя с вокзала, графиня перестаёт быть «на лавке»
  const el0 = window.enterLoc;
  window.enterLoc = function (id) { if (id !== 'station') S.f.station_here = false; return el0(id); };

  // подсказка: над героем на лавке горит «…», если у него есть новый разговор
  const ST = STORY.locs.station;
  ['rowen', 'miron', 'agata', 'tibo'].forEach(h => {
    const ids = TALKS.filter(t => t.a === h || t.b === h).map(t => 'can_' + t.id);
    ids.forEach(c => ST.leads.push([c + '&!hero:' + h, 'Над героем на лавке горит «…» — новый разговор.', 'npc:b_' + h]));
  });
})();
