// Игровая логика пролога «Приговор»: выбор героя, петля 23:00–06:00, разговоры-новелла, улики, сейф, обвинение, откаты.
// Подключается до основного скрипта; переменные игрока (P, camera, scene, inv, doors…) берутся из него во время вызова.
let stamina = 1, tired = false, restT = 0, curSp = 1.7, target = null;
const S = { f: {}, clues: [], time: -60, hero: null, loops: 0 };
const NPCS = [], INSPECT = [], PROPS = {};
const stamEl = document.getElementById('stam'), endEl = document.getElementById('end'), noteEl = document.getElementById('note');
const qEl = document.getElementById('qtext'), questBox = document.getElementById('quest'), qtEl = document.querySelector('#quest .qt');
const clueEl = document.getElementById('clue'), sandEl = document.getElementById('sand'), keypadEl = document.getElementById('keypad');
const XA = 13.2, XD = 26.4, XB = 39.6, XV = 52.8, BAYW = 1.5;
let trainReady = false, wantTrain = false, gameOn = false, CUR_LEADS = [];
const leadsEl = document.getElementById('leads'), marksEl = document.getElementById('marks');

// ---------- состояние ----------
function cond(c) {
  if (!c) return true;
  return c.split('|').some(part => part.split('&').every(t => { t = t.trim(); return t[0] === '!' ? !S.f[t.slice(1)] : !!S.f[t]; }));
}
const gameClock = () => { let m = ((S.time % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0'); };
function derive() {
  if (window.deriveLoc) deriveLoc();
  S.f.ready = !!((S.f.timeDeath || S.f.receipt) && (S.f.button || S.f.missingButton || S.f.boots || S.f.efim) && S.f.case && (!S.f['hero:tibo'] || S.f.envelope || S.f.cufflink || S.f.karr));
}
let clueTimer = 0;
function addClue(id) {
  if (!id || !STORY.clues[id]) return;
  S.f[id] = true;
  if (S.clues.includes(id)) return;
  S.clues.push(id);
  const c = STORY.clues[id];
  window.SFX && SFX.play(c.lily ? 'lily' : 'chime');
  clueEl.querySelector('b').textContent = c.lily ? 'Лилия' : 'Новая улика';
  clueEl.querySelector('span').textContent = c.t;
  clueEl.classList.toggle('lily', !!c.lily);
  clueEl.classList.add('on'); clearTimeout(clueTimer); clueTimer = setTimeout(() => clueEl.classList.remove('on'), 4200);
}
function give(key) { if (!key) return; inv.add(key); S.f['has_' + key] = true; const d = doors.find(x => x.key === key); toastMsg = 'Получен: ' + (d ? d.label : key); toastT = 2.4; }
function applyFx(n) {
  if (!n) return;
  (n.set || []).forEach(k => { S.f[k] = true; if (k.startsWith('hero:')) S.hero = k.slice(5); });
  addClue(n.clue); addClue(n.clue2); addClue(n.clue3);
  if (n.heroClue && S.hero) addClue(n.heroClue[S.hero]);
  give(n.give);
  if (n.time) S.time += n.time;
  derive(); updateQuest(); updateInv();
}
// ---------- умения героев: подсветка реплик и вспышка ----------
const HERO_UI = {
  rowen: { c: '#a9bcd4', ic: '⚔', tag: 'Ровен', def: 'Ровен: военные и знать говорят ему правду' },
  miron: { c: '#9cc472', ic: '⚰', tag: 'Мирон', def: 'Мирон видит то, что пропустят живые' },
  agata: { c: '#f2a070', ic: '✚', tag: 'Агата', def: 'Агата чувствует ложь' },
  tibo: { c: '#c9a6f2', ic: '♠', tag: 'Тибо', def: 'Тибо видит подделку' },
  // секретные герои (secret.js)
  gordey: { c: '#d8794a', ic: '⛓', tag: 'Гордей', def: 'Под взглядом палача ломаются быстрее' },
  evsey: { c: '#86b8ec', ic: '✒', tag: 'Евсей', def: 'Евсей помнит каждую петлю' },
  margaret: { c: '#e0485e', ic: '♛', tag: 'Маргарет', def: 'Графиня чует кровь' }
};
const buffEl = document.getElementById('buff'); let buffT = 0;
function showBuff(text, neg, hero) {
  hero = hero || S.hero; const u = HERO_UI[hero]; if (!u) return;
  buffEl.style.setProperty('--hc', u.c);
  buffEl.querySelector('.bi').textContent = neg ? '✕' : u.ic;
  buffEl.querySelector('.bt2').innerHTML = (text || u.def) + '<small>' + (neg ? 'слабость героя' : 'умение героя') + '</small>';
  buffEl.classList.toggle('neg', !!neg);
  buffEl.classList.add('on'); window.SFX && SFX.play(neg ? 'miss' : 'buff');
  clearTimeout(buffT); buffT = setTimeout(() => buffEl.classList.remove('on'), 2800);
}
function heroOfCond(c) { const m = /(^|[&|])hero:(\w+)/.exec(c || ''); return m ? m[2] : null; }

let lastQuest = '';
const curLoc = () => (window.WORLD ? WORLD.cur : 'train');
const caseOf = id => (STORY.clues[id] && STORY.clues[id].cs) || 'train';
const curCase = () => (['boat', 'monast', 'polar', 'ball', 'fort', 'noon'].includes(curLoc()) ? curLoc() : 'train');
function updateQuest() {
  const L = curLoc() === 'train' ? STORY : STORY.locs[curLoc()];
  qtEl.textContent = '◆ ' + (L.title || 'Приговор') + (L.noClock ? '' : ' · ' + gameClock());
  const q = L.quests.find(([c]) => cond(c)), t = q ? q[1] : '';
  const leads = (L.leads || []).filter(([c]) => cond(c)).slice(0, S.f.g_trial ? 0 : S.hero === 'evsey' ? 5 : 3); // испытание палача — без подсказок; Евсей помнит больше
  CUR_LEADS = leads;
  const lh = leads.filter(l => l[1] !== t).map(l => '<li>' + l[1] + '</li>').join('');
  if (lh !== updateQuest.lh) { leadsEl.innerHTML = lh; updateQuest.lh = lh; }
  if (t !== lastQuest) { qEl.textContent = t; lastQuest = t; questBox.classList.add('flash'); setTimeout(() => questBox.classList.remove('flash'), 900); if (window.pingFold) pingFold('quest'); }
}
function updateInv() {
  const items = doors.filter((d, i, a) => d.key && inv.has(d.key) && a.findIndex(x => x.key === d.key) === i).map(d => d.label);
  if (S.f.case) items.push('кейс Вельяминова');
  const h = S.hero ? STORY.heroes[S.hero].name + ' · ' : '';
  invEl.textContent = h + (items.length ? 'При себе: ' + items.join(', ') : 'При себе: ничего');
}
function toggleNote() {
  const on = !noteEl.classList.contains('on');
  if (on) {
    const h = S.hero ? STORY.heroes[S.hero] : null;
    document.getElementById('nsub').innerHTML = (h ? '<b>' + h.full + '</b> — ' + h.role + '. ' + h.buff + '<br>' : '') + 'Время: ' + gameClock() + (S.loops ? ' · петля №' + (S.loops + 1) : '') + '<br>Задание: ' + lastQuest;
    const cc = curCase(), mine = S.clues.filter(c => caseOf(c) === cc);
    const norm = mine.filter(c => !STORY.clues[c].lily), lil = S.clues.filter(c => STORY.clues[c].lily);
    document.getElementById('nlist').innerHTML = (norm.length ? norm.map(c => '<li>' + STORY.clues[c].t + '</li>').join('') : '<li>Пока ничего. Осмотрись и расспроси людей.</li>') +
      (lil.length ? '</ol><h3>Лилии</h3><ol>' + lil.map(c => '<li>' + STORY.clues[c].t + '</li>').join('') : '');
    if (locked) document.exitPointerLock();
  }
  noteEl.classList.toggle('on', on);
}
noteEl.querySelector('.close').addEventListener('click', () => toggleNote());

// ---------- внешность пассажиров ----------
const LOOK = {
  golts: { coat: '#7a6a4a', vest: '#6a5a3a', shirtFront: true, tie: '#5a3a2a', collar: '#e8e4d8', pants: '#3a3a40', hair: '#d0ccc4', hairStyle: 'bald', glasses: true, skin: '#ecc6a8', eyeC: '#5a5a48', prop: 'cup' },
  remez: { coat: '#4a5a6e', pants: '#2a3448', buttons: true, belt: '#1a1a1a', hat: 'police', hatC: '#2a3448', beard: 'moust', beardC: '#4a3a2c', hair: '#4a3a2c', skin: '#e2ae8c', heavy: true, boots: true, radio: true, armPose: 'knees', eyeC: '#3a2a1a' },
  stupina: { female: true, coat: '#2a3a6a', skirt: '#2a3a6a', buttons: true, collar: '#f4f2ee', hair: '#8a4a28', hairStyle: 'curly', skin: '#eebd9c', stockings: '#3a3030', lips: '#b84a4a', prop: 'cup' },
  zoya: { female: true, coat: '#5a6a8a', skirt: '#2a3448', apron: true, hat: 'kerchief', hatC: '#d8d0c0', hair: '#2a1a14', skin: '#f2cdb4', stockings: '#2a2a30', lips: '#c86a6a', eyeC: '#5a3a22' },
  velyaminov: { coat: '#1e2a44', vest: '#1e2a44', shirtFront: true, lapels: true, tie: '#7a2030', collar: '#f2efe6', pants: '#1e2a44', beard: 'trim', beardC: '#d8d4cc', hair: '#d8d4cc', hairStyle: 'side', skin: '#f0cdb4', eyeC: '#4a5a6a', prop: 'cane', armPose: 'crossed' },
  surkov: { coat: '#4a5a40', pants: '#3a3a36', boots: true, hat: 'cap', hatC: '#3a3a3a', hair: '#8a8478', skin: '#d9a47c', prop: 'bag', armPose: 'knees' },
  dan: { coat: '#3a4a5a', pants: '#2a3040', hat: 'hood', hatC: '#3a4a5a', hair: '#3a2a20', skin: '#f0c8a8', h: .97, eyeC: '#4a5a3a' },
  somov: { coat: '#3a3a3e', shirtFront: true, lapels: true, tie: '#3a4a6a', collar: '#e8e8ec', pants: '#2a2a2e', hair: '#3a2a20', hairStyle: 'side', skin: '#d8b8a0' }
};
const pick = (a, r) => a[Math.floor(r() * a.length)];
function rngOf(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
function peasantM(seed, extra) {
  const r = rngOf(seed);
  return Object.assign({ coat: pick(['#7a6448', '#8a7458', '#5e4e3c', '#5a6a4a'], r), coatTex: r() > .4 ? 'sack' : null, shirt: pick(['#a8322b', '#d8d0b8', '#5a6a8a'], r), pants: pick(['#4a4640', '#3c3a36', '#2a3040'], r), boots: true,
    hat: r() > .5 ? 'cap' : null, hatC: pick(['#3d2c1f', '#2a2a2a', '#4a3a2a'], r), beard: pick(['full', 'moust', null, null], r), beardC: pick(['#6b4428', '#4a3220', '#9a9086'], r),
    hair: pick(['#5a3a22', '#3a2a1e', '#8a6a40', '#a9a39a'], r), hairStyle: pick(['short', 'side', 'buzz', 'bald'], r), skin: pick(['#e3b08a', '#d9a47c', '#eab894'], r),
    armPose: pick(['lap', 'knees', 'crossed', 'window'], r), eyeC: pick(['#3a2a20', '#4a5a6a', '#5a4a2a'], r) }, extra || {});
}
function peasantF(seed, extra) {
  const r = rngOf(seed);
  return Object.assign({ female: true, skirt: pick(['#3e3a5a', '#5a2a24', '#2e4a3a', '#6a5a3a'], r), coat: pick(['#d8c8a8', '#8a5a5a', '#5a6a8a'], r), hat: r() > .4 ? 'kerchief' : null,
    hatC: pick(['#a8322b', '#36569a', '#c9a35a', '#e8e0d0'], r), hair: pick(['#5a3a22', '#8a6a40', '#2a1a14'], r), hairStyle: pick(['bun', 'long', 'curly'], r), skin: pick(['#e2b392', '#eab894', '#d9a47c'], r),
    armPose: pick(['lap', 'lap', 'window'], r), lips: pick(['#b05a52', '#a04a48'], r) }, extra || {});
}
function richM(seed, extra) {
  const r = rngOf(seed);
  return Object.assign({ coat: pick(['#22252b', '#1f2430', '#2a2420'], r), vest: pick(['#6a5434', '#4a3a5a', '#7a2a2a'], r), shirtFront: true, lapels: true, tie: pick(['#7a2030', '#2a3a5a', '#3a3a3a'], r), collar: '#f2efe6', pants: '#2a2a2e',
    beard: pick(['trim', 'moust', null], r), beardC: pick(['#5a4030', '#8a8278'], r), hair: pick(['#3a2a20', '#6d5a48', '#9a9288'], r), hairStyle: pick(['side', 'short', 'bald'], r), skin: pick(['#efc6a6', '#e8b996'], r),
    armPose: pick(['lap', 'crossed'], r) }, extra || {});
}
function richF(seed, extra) {
  const r = rngOf(seed);
  return Object.assign({ female: true, skirt: pick(['#2e4a5a', '#4a2a4a', '#3a4a2a'], r), coat: pick(['#2e4a5a', '#4a2a4a', '#3a4a2a'], r), collar: '#f2efe6', hair: pick(['#2b1a14', '#6a4a2a', '#b08850'], r), hairStyle: pick(['bun', 'long'], r), skin: '#f3d3c0', stockings: '#1a1214', gloves: '#f0ebe0', lips: '#b0484a', armPose: 'lap' }, extra || {});
}

// ---------- места ----------
const FACE = { '+x': Math.PI / 2, '-x': -Math.PI / 2, '+z': 0, '-z': Math.PI };
function bench(X, b, side, dir, near) { return { x: X + b * BAYW + (dir > 0 ? .2 : 1.3), z: side === 0 ? (near ? .82 : .35) : (near ? 2.18 : 2.65), face: dir > 0 ? '+x' : '-x', seatY: .45, pose: 'sit' }; }
function arm(X, b, side, dir) { return { x: X + b * BAYW + (dir > 0 ? .26 : 1.24), z: side === 0 ? .45 : 2.55, face: dir > 0 ? '+x' : '-x', seatY: .48, pose: 'sit' }; }
function chair(X, b, side, dir) { return { x: X + b * BAYW + (dir > 0 ? .2 : 1.3), z: side === 0 ? .43 : 2.57, face: dir > 0 ? '+x' : '-x', seatY: .48, pose: 'sit' }; }
function standAt(x, z, face) { return { x, z, face, pose: 'stand' }; }
function addNPC(id, place, look, opt) {
  opt = opt || {};
  const st = makeHuman(Object.assign({ pose: place.pose, seatY: place.seatY }, look));
  st.root.position.set(place.x, 0, place.z);
  st.root.rotation.y = FACE[place.face];
  scene.add(st.root);
  const n = { id, st, x: place.x, z: place.z, talk: !!STORY.dialogs[id], bark: opt.bark, name: opt.name || (STORY.cast[id] ? STORY.cast[id].name : ''), loc: opt.loc, lv: opt.lv || 0 };
  if (opt.lv) st.root.position.y = opt.fy || 0;
  NPCS.push(n);
  if (place.pose === 'stand' && !opt.loc) blockers.push({ x: place.x, z: place.z });
  return n;
}
function mkMat(name, color) {
  const src = window.__sceneMats && window.__sceneMats[name];
  const m = new THREE.MeshStandardMaterial({ color: color || 0xffffff, roughness: .8 });
  if (src && src.map) { m.map = src.map; if (src.normalMap) m.normalMap = src.normalMap; }
  return m;
}
function boxMesh(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); scene.add(m); return m; }

function spawnCast() {
  const HX = XB, hb = Math.round((HOME[0] - HX - .75) / BAYW);
  addNPC('golts', bench(HX, hb, 0, -1, true), LOOK.golts);
  addNPC('remez', bench(XB, 0, 0, 1, true), LOOK.remez);
  addNPC('stupina', bench(XB, 1, 0, -1, true), LOOK.stupina);
  addNPC('zoya', standAt(XD + 2.85, 2.28, '+x'), LOOK.zoya);
  addNPC('velyaminov', arm(XA, 3, 0, 1), LOOK.velyaminov);
  addNPC('surkov', bench(XV, 3, 1, -1, true), LOOK.surkov);
  addNPC('dan', bench(XV, 7, 1, -1, true), LOOK.dan).hidden = true;
  // тело Сомова в тамбуре: лежит на спине головой к ресторану
  const body = makeHuman(Object.assign({ pose: 'stand' }, LOOK.somov));
  body.sleep = true; body.root.rotation.order = 'YXZ'; body.root.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
  body.root.position.set(XB + .5, .14, 1.5); scene.add(body.root);
  body.head.rotation.z = .5; body.arms[0].sh.rotation.z = -.6; body.arms[1].sh.rotation.z = .9;
  PROPS.body = body;
  // массовка
  let sd = 11;
  const M = (place, look, bark, name) => addNPC('extra' + (sd++), place, look, { bark, name });
  M(arm(XA, 1, 1, -1), richF(sd), 'richF', 'Дама из СВ');
  M(arm(XA, 5, 0, 1), richM(sd, { prop: 'paper' }), 'rich', 'Господин с газетой');
  M(arm(XA, 6, 1, -1), richM(sd, { beard: 'full', heavy: true }), 'rich', 'Пассажир СВ');
  M(chair(XD, 4, 0, 1), richM(sd), 'rich', 'Поздний посетитель');
  M(chair(XD, 6, 1, -1), peasantM(sd, { prop: 'bread' }), 'peasantM', 'Мужик в ресторане');
  M(standAt(XD + .85, .98, '-z'), { coat: '#f2efe8', pants: '#3a3a3a', apron: true, hat: 'clerk', hatC: '#f4f1ea', beard: 'moust', beardC: '#3a2a20', hair: '#3a2a20', skin: '#e8b996', heavy: true }, 'cook', 'Повар');
  M(bench(XB, 4, 1, 1, true), peasantF(sd), 'peasantF', 'Пассажирка');
  M(bench(XB, 5, 1, -1, true), peasantM(sd, { sleep: true }), 'sleeper', 'Пассажир');
  M(bench(XB, 6, 0, 1, true), peasantM(sd), 'peasantM', 'Пассажир');
  M(bench(XV, 0, 0, 1, true), peasantM(sd), 'peasantM', 'Мужик');
  M(bench(XV, 1, 1, 1, true), peasantF(sd), 'peasantF', 'Тётка');
  M(bench(XV, 2, 0, -1, true), peasantM(sd, { sleep: true }), 'sleeper', 'Дед');
  M(bench(XV, 4, 1, 1, true), peasantF(sd), 'peasantF', 'Тётка');
  M(bench(XV, 5, 1, -1, true), peasantM(sd, { prop: 'bread' }), 'peasantM', 'Мужик');
  M(bench(XV, 6, 0, -1, true), peasantM(sd, { sleep: true }), 'sleeper', 'Мужик');
  M(standAt(-5.75, 2.0, '-x'), { coat: '#2a2a2a', pants: '#2a2a2a', hat: 'cap', hatC: '#1a1a1a', beard: 'full', beardC: '#3a2a20', boots: true, skin: '#d9a47c' }, 'crew', 'Машинист');
  M(standAt(-4.9, 1.05, '-x'), { coat: '#4a3a2a', coatTex: 'sack', pants: '#2a2622', boots: true, hat: 'cap', hatC: '#2a2622', beard: 'moust', skin: '#c99470', prop: 'shovel' }, 'crew', 'Кочегар');

  // драка в плацкарте (личный эпизод Ровена): двое мужиков делят бутылку
  const ef = addNPC('efim', standAt(XV + 4 * BAYW + .5, .5, '+x'), peasantM(77, { coat: '#6a5a40', hat: 'cap', hatC: '#3a3020' }));
  const kum = addNPC('kum', standAt(XV + 4 * BAYW + 1.1, .5, '-x'), peasantM(91, { beard: 'full', heavy: true }), { bark: 'brawl', name: 'Буян' });
  ef.brawl = kum.brawl = true;
  INSPECT.push({ id: 'crow', x: XA + 3 * BAYW + .3, z: 1.35, r: 1.1 });

  // служебное купе Ремеза: перегородка с дверью у купе 8, сейф на полке
  const wood = mkMat('door3b', 0xb08a64), metal = new THREE.MeshStandardMaterial({ color: 0x2f3b33, roughness: .45, metalness: .6 });
  const RX = XB + 7 * BAYW;
  boxMesh(.45, 2.05, .05, wood, RX + .28, 1.025, 1.13); boxMesh(.45, 2.05, .05, wood, RX + 1.22, 1.025, 1.13); boxMesh(.5, .25, .05, wood, RX + .75, 1.93, 1.13);
  PROPS.door = boxMesh(.5, 1.8, .04, wood, RX + .75, .9, 1.13);
  const plate = boxMesh(.22, .07, .01, new THREE.MeshStandardMaterial({ color: 0xc9a35a, metalness: .8, roughness: .3 }), RX + .75, 1.55, 1.16);
  PROPS.safe = new THREE.Group();
  const sb = new THREE.Mesh(new THREE.BoxGeometry(.42, .45, .36), metal); sb.position.y = .225; PROPS.safe.add(sb);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .02, 18), new THREE.MeshStandardMaterial({ color: 0xc9c2b4, metalness: .9, roughness: .3 })); dial.rotation.x = Math.PI / 2; dial.position.set(0, .26, .19); PROPS.safe.add(dial);
  PROPS.safe.position.set(RX + .75, .47, .5); PROPS.safe.rotation.y = 0; scene.add(PROPS.safe);
  // бумаги Сомова в 7-м купе, рюкзак Дэна в багажном, пуговица под решёткой
  const paper = new THREE.MeshStandardMaterial({ color: 0xece6d6, roughness: .9 });
  const pp = boxMesh(.3, .03, .22, paper, XB + 6 * BAYW + 1.15, .48, 2.45); pp.rotation.y = .3;
  const bagM = new THREE.MeshStandardMaterial({ color: 0x3a4a3a, roughness: .9 });
  boxMesh(.32, .42, .2, bagM, 6.6, .21, 2.5);
  PROPS.button = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .004, 12), new THREE.MeshStandardMaterial({ color: 0xd8b860, metalness: .9, roughness: .25, emissive: 0x3a2a08 }));
  PROPS.button.position.set(XB - .45, .012, 1.62); scene.add(PROPS.button);

  INSPECT.push({ id: 'body', x: XB - .1, z: 1.5, r: 1.3 });
  INSPECT.push({ id: 'grate', x: XB - .45, z: 1.6, r: .9 });
  INSPECT.push({ id: 'papers', x: XB + 6 * BAYW + 1.1, z: 2.1, r: 1.2 });
  INSPECT.push({ id: 'backpack', x: 6.6, z: 2.4, r: 1.3 });
  INSPECT.push({ id: 'door', x: RX + .75, z: 1.25, r: 1.0 });
  INSPECT.push({ id: 'safe', x: RX + .75, z: .9, r: 1.2 });
  addHideRects();
  trainReady = true;
  updateQuest(); updateInv();
  if (wantTrain) startNight();
}

// ---------- мир: часы, анимация, события петли ----------
function tickWorld(dt) {
  for (const n of NPCS) {
    // 26 м — дальше конца вагона, чтобы люди не «возникали из воздуха» посреди прохода
    const vis = !n.hidden && (n.loc || 'train') === curLoc() && Math.abs(n.x - P.x) < 26 && (n.lv || 0) === (P.lv || 0);
    n.st.root.visible = vis;
    if (vis) animHuman(n.st, dt, P.x, P.z, D.on && D.npc === n && D.speaking);
    if (vis && n.brawl && !S.f.brawlDone && !(D.on && D.npc === n)) {
      const t = n.st.t; n.st.arms.forEach((a, i) => { a.sh.rotation.x = -1.25 + Math.max(0, Math.sin(t * 5 + i * Math.PI + n.x)) * -.5; a.sh.rotation.z = (i ? 1 : -1) * .25; a.el.rotation.x = -1.4 + Math.max(0, Math.sin(t * 5 + i * Math.PI + n.x)) * 1.1; });
      n.st.root.position.x = n.x + Math.sin(t * 2.3 + n.z) * .06; n.st.torso.rotation.x = .12 + Math.sin(t * 5) * .05;
    }
  }
  if (PROPS.door) { PROPS.door.visible = !S.f.access; PROPS.safe.visible = true; PROPS.button.visible = !S.f.button; }
  if (!gameOn) return;
  if (curLoc() !== 'train') { tickMarks(); if (window.tickLocation) tickLocation(dt); return; }
  tickRunners(dt); tickMarks();
  const busy = D.on || endEl.classList.contains('on') || noteEl.classList.contains('on') || keypadEl.classList.contains('on') || sandOn || document.getElementById('fight').classList.contains('on') || document.getElementById('cards').classList.contains('on') || document.getElementById('band').classList.contains('on');
  if (!busy) {
    S.time += dt / 3;                                  // 1 игровая минута за 3 секунды
    if (!S.f.solved && S.time >= 180 && !S.f.ambushed) startScene('ambush');
    else if (!S.f.solved && S.time >= 360) startScene('dawn');
  }
  if ((S.time | 0) !== (tickWorld.lastMin | 0)) { tickWorld.lastMin = S.time; updateQuest(); }
}
function findTarget() {
  if (D.on || !gameOn) return null;
  let best = null, bd = 1e9;
  if (CHASE.state === 'corner' && Math.hypot(P.x - CHASE.x, P.z - CHASE.z) < 1.5) return { kind: 'grab', label: 'СХВАТИТЬ!' };
  for (const n of NPCS) {
    if (n.hidden || (n.loc || 'train') !== curLoc() || (n.lv || 0) !== (P.lv || 0)) continue;
    const d = Math.hypot(P.x - n.x, P.z - n.z);
    if (d < 1.75 && d < bd) { bd = d; best = { kind: 'npc', n, label: (n.talk ? 'говорить: ' : 'окликнуть: ') + n.name }; }
  }
  for (const i of INSPECT) {
    if ((i.loc || 'train') !== curLoc() || (i.lv || 0) !== (P.lv || 0)) continue;
    const def = STORY.inspect[i.id];
    if (def.once && S.f[def.once] && !(def.heroClue && S.hero && def.heroClue[S.hero] && !S.f[def.heroClue[S.hero]])) continue;
    if (!cond(def.if)) continue;
    const d = Math.hypot(P.x - i.x, P.z - i.z);
    if (d < i.r && d - .3 < bd) { bd = d - .3; best = { kind: 'inspect', i, label: def.label }; }
  }
  return best;
}
function interact() {
  if (D.on) { dlgAdvance(); return; }
  const t = findTarget(); if (!t) return;
  if (t.kind === 'grab') { CHASE.grab(); return; }
  if (t.kind === 'npc') {
    if (t.n.talk) startDialog(t.n);
    else { const hb = STORY.heroBarks && S.hero && STORY.heroBarks[S.hero] && STORY.heroBarks[S.hero][t.n.bark];
      const lines = hb || STORY.barks[t.n.bark] || ['…'];
      if (hb && !S.f['hb_' + t.n.bark]) { S.f['hb_' + t.n.bark] = true; const neg = STORY.heroBarksNeg && STORY.heroBarksNeg[S.hero] && STORY.heroBarksNeg[S.hero][t.n.bark]; if (neg) showBuff(neg, true); } toastMsg = t.n.name + ': «' + lines[Math.floor(Math.random() * lines.length)] + '»'; toastT = 3.2; }
    return;
  }
  const def = STORY.inspect[t.i.id];
  if (def.do === 'keypad') { openKeypad(); return; }
  if (def.go && window.locAction) { if (def.lines && def.lines.length) startSolo(def.lines, () => { applyFx(def); locAction(def.go, def); }); else { applyFx(def); locAction(def.go, def); } return; }
  const hl = def.heroLines && S.hero && def.heroLines[S.hero];
  const lines = (def.heroOnly && hl ? [] : def.lines).concat(hl || []);
  if (hl) setTimeout(() => showBuff(def.buff && def.buff[S.hero]), 350);
  S.time += 2;
  startSolo(lines, () => applyFx(def));
}

// ---------- диалоги ----------
const D = { on: false, npc: null, dlg: null, node: null, q: [], i: 0, shown: 0, full: '', speaking: false, choosing: false, opts: [], sel: 0 };
const dlgEl = document.getElementById('dlg'), whoEl = document.getElementById('who'), txtEl = document.getElementById('txt'), porEl = document.getElementById('portrait'), porR = document.getElementById('portraitR'),
  chEl = document.getElementById('choices'), nextEl = document.getElementById('next'), bgEl = document.getElementById('bg');
let porId = '', porExpr = '', porRId = '';
// --- диалог v3: медальон говорящего, журнал, «уже спрашивал», автолистание ---
const boxEl = document.getElementById('box'), logEl = document.getElementById('dlglog'), logList = document.getElementById('dlglist'), autoBtn = document.getElementById('dlgauto');
const SEEN = new WeakMap(); // узел → тексты уже выбранных ответов
const LOG = []; let logSep = false;
let AUTO = false; try { AUTO = localStorage.getItem('prig_auto') === '1'; } catch (e) { }
autoBtn.classList.toggle('on', AUTO);
function setAuto(v) { AUTO = v; autoBtn.classList.toggle('on', v); D.autoT = 0; try { localStorage.setItem('prig_auto', v ? '1' : '0'); } catch (e) { } }
function frame(act, color) { // act: porEl / porR / null
  porEl.classList.toggle('act', act === porEl); porR.classList.toggle('act', act === porR);
  boxEl.classList.toggle('nop', !act);
  if (color) boxEl.style.setProperty('--pc', color); else boxEl.style.removeProperty('--pc');
}
function heroColor() { return S.hero && HERO_UI[S.hero] ? HERO_UI[S.hero].c : null; }
function logAdd(cls, name, text, color) {
  if (logSep && LOG.length) LOG.push({ cls: 'sep', text: '· · ·' }); logSep = false;
  LOG.push({ cls, name, text, color }); if (LOG.length > 160) LOG.splice(0, LOG.length - 160);
}
function openLog() {
  logList.innerHTML = '';
  LOG.forEach(l => { const d = document.createElement('div'); d.className = 'ln ' + (l.cls || ''); if (l.color) d.style.setProperty('--pc', l.color);
    if (l.name) { const b = document.createElement('b'); b.textContent = l.name; d.appendChild(b); } d.appendChild(document.createTextNode(l.text)); logList.appendChild(d); });
  if (!LOG.length) logList.innerHTML = '<div class="ln narr">Пока пусто.</div>';
  logEl.classList.add('on'); logList.scrollTop = logList.scrollHeight;
}
function closeLog() { logEl.classList.remove('on'); }
const plain = h => { const t = document.createElement('div'); t.innerHTML = h; return t.textContent; };
function openDlg() {
  D.on = true; D.choosing = false;
  document.body.classList.add('talking'); dlgEl.classList.add('on');
  if (locked) document.exitPointerLock();
}
function startDialog(npc) {
  openDlg(); D.npc = npc; D.solo = null;
  porEl.classList.remove('show'); porId = '';
  D.dlg = STORY.dialogs[npc.id];
  S.time += 1;
  let st = D.dlg.start.find(([c]) => cond(c))[1];
  if (st === 'hub' && S.f['met_' + npc.id] && D.dlg.nodes.menu && !D.dlg.nodes.hub.dyn) {
    st = 'menu';
    const c = STORY.cast[npc.id]; whoEl.style.display = 'block'; whoEl.innerHTML = (c ? c.name + '<small>' + c.role + '</small>' : npc.name);
    txtEl.classList.add('narr'); txtEl.textContent = (c ? c.name : npc.name) + ' ждёт, что ты скажешь.'; D.full = txtEl.textContent; D.shown = D.full.length;
    if (c && STORY.cast[npc.id]) { porEl.innerHTML = portraitSVG(npc.id, 'neutral'); porId = npc.id; porExpr = 'neutral'; porEl.classList.add('show'); porEl.classList.remove('dim'); frame(porEl); } else frame(null);
  }
  S.f['met_' + npc.id] = true;
  runNode(st);
}
function startScene(id) {
  const sc = STORY.scenes[id];
  openDlg(); D.npc = null; D.solo = null; D.dlg = sc;
  porEl.classList.remove('show'); porId = '';
  runNode(sc.start);
}
function startSolo(lines, onEnd) {
  openDlg(); D.npc = null; D.dlg = null; D.solo = { onEnd };
  D.q = lines.slice(); D.node = null; D.i = -1; nextLine();
}
function setBg(b) { bgEl.className = b && b !== 'none' ? 'on ' + b : ''; }
function runNode(id) {
  const n = D.dlg.nodes[id]; D.node = n;
  if (n.bg !== undefined) setBg(n.bg);
  if (n.buff) showBuff(n.buff === true ? null : n.buff); if (n.debuff) showBuff(n.debuff, true);
  if (n.route && !(n.lines && n.lines.length)) { applyFx(n); const r = n.route.find(([c]) => cond(c)); runNode(r ? r[1] : n.route[n.route.length - 1][1]); return; }
  if (n.evidence) { showEvidence(n.evidence); return; }
  D.q = (n.lines || []).slice(); D.i = -1;
  if (!D.q.length) { finishNode(); return; }
  nextLine();
}
function heroPortrait() {
  if (!S.hero) { porR.classList.remove('show'); return; }
  if (porRId !== S.hero) { porR.innerHTML = portraitSVG(S.hero, 'neutral'); porRId = S.hero; }
  porR.classList.add('show');
}
function nextLine() {
  D.i++;
  if (D.i >= D.q.length) { finishNode(); return; }
  let [who, ex, text] = D.q[D.i];
  if (who && who === S.hero) who = 'det';
  D.full = text; D.shown = 0; D.hold = 0; D.speaking = who && who !== 'det';
  { const bx = document.getElementById('box'); bx.classList.remove('pop'); void bx.offsetWidth; bx.classList.add('pop'); }
  window.SFX && SFX.play('blip');
  chEl.innerHTML = ''; D.choosing = false; nextEl.style.display = 'block';
  if (who === 'det') {
    const h = S.hero ? STORY.heroes[S.hero] : null;
    whoEl.innerHTML = h ? h.name + '<small>' + h.role + '</small>' : 'Детектив';
    porEl.classList.add('dim'); heroPortrait(); porR.classList.remove('dim');
    frame(S.hero ? porR : null, heroColor()); logAdd('', h ? h.name : 'Детектив', text, heroColor());
  } else if (!who) { whoEl.innerHTML = ''; porEl.classList.add('dim'); porR.classList.add('dim'); frame(null); logAdd('narr', '', text); }
  else {
    const c = STORY.cast[who];
    whoEl.innerHTML = c.name + '<small>' + c.role + '</small>';
    if (porId !== who || porExpr !== ex) { porEl.innerHTML = portraitSVG(who, ex); porId = who; porExpr = ex; }
    porEl.classList.add('show'); porEl.classList.remove('dim'); porR.classList.add('dim');
    frame(porEl); logAdd('', c.name, text);
  }
  D.autoT = 0;
  whoEl.style.display = who === null ? 'none' : 'block';
  txtEl.classList.toggle('narr', !who);
  txtEl.textContent = '';
}
function finishNode() {
  if (D.solo) { const f = D.solo.onEnd; closeDialog(); if (f) f(); return; }
  const n = D.node;
  applyFx(n);
  if (n.ending) { closeDialog(); showEnding(n.ending); return; }
  if (n.do) { doAction(n.do); return; }
  if (n.route) { const r = n.route.find(([c]) => cond(c)); runNode(r ? r[1] : n.route[n.route.length - 1][1]); return; }
  if (n.choices) {
    let opts = n.choices.filter(c => cond(c.if) && !(c.hide && cond(c.hide)));
    const ex = opts.filter(c => c.exit); opts = opts.filter(c => !c.exit).slice(0, n.many ? 8 : 4).concat(ex); // many — выбор героя, там до шести имён
    if (opts.length) { showChoices(opts); return; }
  }
  if (n.go) { runNode(n.go); return; }
  closeDialog();
}
function showChoices(opts, question) {
  D.choosing = true; D.chAt = performance.now(); D.opts = opts; D.sel = 0; nextEl.style.display = 'none'; D.speaking = false;
  chEl.innerHTML = '';
  if (!question && porEl.classList.contains('show')) { porEl.classList.remove('dim'); frame(porEl); } // во время выбора — лицо собеседника
  const seen = !question && D.node && SEEN.get(D.node);
  chEl.classList.toggle('ev', !!question);
  if (question) { const q = document.createElement('div'); q.className = 'evq'; q.textContent = 'Предъяви улику: ' + question; chEl.appendChild(q); }
  opts.forEach((c, k) => {
    const b = document.createElement('button'); const hh = c.hero || heroOfCond(c.if);
    let txt = c.t;
    if (hh && HERO_UI[hh]) { txt = txt.replace(/^\((Тибо|Агата|Ровен|Мирон)\)\s*/, ''); b.className = 'hero'; b.style.setProperty('--hc', HERO_UI[hh].c); b.dataset.ic = HERO_UI[hh].ic; txt += '<em class="htag">' + HERO_UI[hh].tag + '</em>'; }
    b.innerHTML = '<i>' + (k + 1) + '</i>' + txt; if (c.exit) b.className = 'exit';
    if (seen && !c.exit && seen.has(c.t)) { b.classList.add('seen'); b.title = 'Уже спрашивал'; }
    b.addEventListener('click', e => { e.stopPropagation(); choose(k); });
    b.addEventListener('mouseenter', () => { D.sel = k; markSel(); });
    chEl.appendChild(b);
  });
  markSel();
}
function markSel() { [...chEl.querySelectorAll('button')].forEach((b, k) => b.classList.toggle('sel', k === D.sel)); }
function choose(k) {
  const c = D.opts[k]; if (!c) return;
  if (D.node && c.evid === undefined && !c.exit) { let st = SEEN.get(D.node); if (!st) SEEN.set(D.node, st = new Set()); st.add(c.t); }
  if (!c.exit) logAdd('me', '', plain(c.t).replace(/^\((Тибо|Агата|Ровен|Мирон)\)\s*/, ''));
  chEl.innerHTML = ''; chEl.classList.remove('ev'); D.choosing = false;
  if (c.evid !== undefined) { if (c.evid) D.evUsed.push(c.evid); runNode(c.ok ? c.next : c.fail); return; }
  if (c.exit) { closeDialog(); return; }
  const hh = c.hero || heroOfCond(c.if); if (hh && hh === S.hero) showBuff(c.buff);
  applyFx(c);
  if (c.go) runNode(c.go); else closeDialog();
}
function showEvidence(ev) {
  whoEl.style.display = 'none'; txtEl.classList.add('narr'); txtEl.textContent = ev.q; D.full = ev.q; D.shown = ev.q.length;
  porR.classList.add('dim'); frame(porEl.classList.contains('show') ? porEl : null);
  if (!D.evUsed || D.node === STORY.dialogs.remez.nodes.ev1 || D.node.evReset) D.evUsed = [];
  const cc = curCase();
  const free = S.clues.filter(id => caseOf(id) === cc && (!D.evUsed.includes(id) && !STORY.clues[id].lily || ev.ok.includes(id) && !D.evUsed.includes(id)));
  const good = free.filter(id => ev.ok.includes(id)), bad = free.filter(id => !ev.ok.includes(id)).sort(() => Math.random() - .5).slice(0, S.hero === 'gordey' && good.length ? 1 : good.length ? 2 : 3); // при палаче подозреваемый ломается быстрее
  const ids = good.slice(0, 2).concat(bad).sort(() => Math.random() - .5);
  const blood = id => S.hero === 'margaret' && ev.ok.includes(id) && /кров/i.test(STORY.clues[id].t + STORY.clues[id].n); // графиня по капле крови знает, чья она
  if (window.secretEvidence) secretEvidence(ev, ids.some(blood), good.length);
  const opts = ids.map(id => ({ t: '<b>' + STORY.clues[id].n + '</b>' + (blood(id) ? ' <i class="blood" title="Графиня чует кровь">●</i>' : ''), evid: id, ok: ev.ok.includes(id), next: ev.next, fail: ev.fail }));
  opts.push({ t: 'Мне нечего предъявить.', evid: null, ok: false, next: ev.next, fail: ev.fail });
  showChoices(opts, ev.q);
}
function dlgAdvance(byMouse) {
  if (D.choosing) { if (!byMouse && !(D.node && D.node.evidence) && performance.now() - D.chAt > 450) choose(D.sel); return; }
  if (D.shown < D.full.length) { D.shown = D.full.length; txtEl.textContent = D.full; return; }
  nextLine();
}
function dlgKey(e) {
  if (logEl.classList.contains('on')) { if (['Escape', 'KeyJ', 'KeyL', 'Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); closeLog(); } return; }
  if (e.code === 'KeyJ' || e.code === 'KeyL') { e.preventDefault(); openLog(); return; }
  if (e.code === 'KeyA' && !e.repeat) { setAuto(!AUTO); return; }
  if (D.choosing) {
    const k = parseInt(e.key, 10);
    if (k >= 1 && k <= Math.min(9, D.opts.length) && performance.now() - D.chAt > 250) { choose(k - 1); return; }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { D.sel = (D.sel + 1) % D.opts.length; markSel(); return; }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { D.sel = (D.sel + D.opts.length - 1) % D.opts.length; markSel(); return; }
  }
  if (['KeyE', 'KeyF', 'Space', 'Enter'].includes(e.code)) { e.preventDefault(); dlgAdvance(); }
  if (e.code === 'Escape' && canExit()) { e.preventDefault(); closeDialog(); }
  if (e.code === 'Tab') { e.preventDefault(); dlgSkip(); }
}
function canExit() { return !!(D.npc || D.solo) && !(D.node && D.node.evidence); }
document.getElementById('dlgx').addEventListener('pointerdown', e => e.stopPropagation());
// «Пропустить»: пролистывает реплики до ближайшего выбора или конца сцены (эффекты узлов срабатывают как обычно)
function dlgSkip() { for (let k = 0; k < 400 && D.on && !D.choosing && !(D.node && D.node.evidence); k++) { D.shown = D.full.length; nextLine(); } }
document.getElementById('dlgskip').addEventListener('pointerdown', e => e.stopPropagation());
document.getElementById('dlgskip').addEventListener('click', e => { e.stopPropagation(); dlgSkip(); });
document.getElementById('dlgx').addEventListener('click', e => { e.stopPropagation(); if (canExit()) closeDialog(); });
document.getElementById('box').addEventListener('click', e => { e.stopPropagation(); dlgAdvance(true); });
['dlglogb', 'dlgauto', 'dlglogx'].forEach(id => document.getElementById(id).addEventListener('pointerdown', e => e.stopPropagation()));
document.getElementById('dlglogb').addEventListener('click', e => { e.stopPropagation(); openLog(); });
document.getElementById('dlglogx').addEventListener('click', e => { e.stopPropagation(); closeLog(); });
logEl.addEventListener('click', e => { e.stopPropagation(); if (e.target === logEl) closeLog(); });
autoBtn.addEventListener('click', e => { e.stopPropagation(); setAuto(!AUTO); });
// колесо вверх — открыть журнал (если не прокручивается список ответов или сам журнал)
dlgEl.addEventListener('wheel', e => { if (e.deltaY < -20 && !logEl.classList.contains('on') && !chEl.contains(e.target)) openLog(); }, { passive: true });
dlgEl.addEventListener('click', () => { if (!D.choosing && !logEl.classList.contains('on')) dlgAdvance(true); });
function closeDialog() {
  D.on = false; D.speaking = false; D.choosing = false;
  dlgEl.classList.remove('on'); document.body.classList.remove('talking'); porEl.classList.remove('show'); porR.classList.remove('show');
  chEl.innerHTML = ''; setBg('none'); updateQuest(); closeLog(); logSep = true; porEl.classList.remove('act'); porR.classList.remove('act');
  setTimeout(() => { if (gameOn && !D.on && !locked && !endEl.classList.contains('on') && !noteEl.classList.contains('on') && !keypadEl.classList.contains('on') && !matchMedia('(pointer: coarse)').matches) toggleLock(); }, 30);
}
const headW = new THREE.Vector3();
function dlgCamera(dt) {
  // печать с паузами на знаках препинания — реплика звучит живее
  if (D.shown < D.full.length) {
    if (D.hold > 0) D.hold -= dt;
    else {
      const a = Math.floor(D.shown); D.shown = Math.min(D.full.length, D.shown + dt * 52); const b = Math.floor(D.shown);
      for (let i = a; i < b; i++) { const ch = D.full[i], nx = D.full[i + 1]; if (nx !== ' ') continue; if ('.!?…'.includes(ch)) { D.shown = i + 1; D.hold = .3; break; } if (',;:—'.includes(ch)) { D.shown = i + 1; D.hold = .1; break; } }
    }
    txtEl.textContent = D.full.slice(0, Math.floor(D.shown));
  }
  { const talking = D.on && !D.choosing && D.shown < D.full.length && D.hold <= 0; porEl.classList.toggle('talk', talking && !porEl.classList.contains('dim')); porR.classList.toggle('talk', talking && !porR.classList.contains('dim')); }
  { const rdy = D.on && !D.choosing && D.shown >= D.full.length; nextEl.classList.toggle('rdy', rdy);
    // автолистание: после полной реплики — пауза по длине текста
    if (rdy && AUTO && !logEl.classList.contains('on') && !(D.node && D.node.evidence)) { D.autoT = (D.autoT || 0) + dt; if (D.autoT > 1.1 + D.full.length * 0.028) { D.autoT = 0; nextLine(); } } }
  document.getElementById('dlgx').style.display = canExit() ? 'block' : 'none';
  document.getElementById('dlgskip').style.display = D.on && !D.choosing && D.q && D.i < D.q.length - 1 ? 'block' : 'none';
  if (!D.npc) return;
  D.npc.st.head.getWorldPosition(headW);
  const dx = headW.x - P.x, dz = headW.z - P.z, dist = Math.hypot(dx, dz);
  const ty = Math.atan2(-dx, -dz), tp = Math.atan2(headW.y + .05 - eye - (P.fy || 0), dist);
  let dy = ty - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  P.yaw += dy * Math.min(1, dt * 4); P.pitch += (tp - P.pitch) * Math.min(1, dt * 4);
}

// ---------- действия сцен ----------
function doAction(a) {
  if (a === 'toTrain') { closeDialog(); window.allowBuild = true; if (window.pendingBuild) { window.pendingBuild = false; build(); } if (trainReady) startNight(); else { wantTrain = true; status.style.display = 'flex'; status.classList.add('late'); msg.textContent = 'Поезд подъезжает…'; } return; }
  if (a === 'rollback') { closeDialog(); rollback(); return; }
  if (window.locAction && locAction(a)) return;
  if (a === 'finale') { startScene('finale'); return; }
  if (a === 'wake') { S.time = 45; closeDialog(); return; }
  if (a === 'fight') { closeDialog(); if (S.hero === 'rowen') showBuff('Ровен держит удар: лишнее сердце в драке'); startFight(S.hero === 'rowen', win => startScene(win ? 'fightWin' : 'fightLose')); return; }
  // мини-игры с собеседником: 'игра:npc:узел_победы:узел_поражения'
  const mg = /^(cardsN|bandage|brawl):(\w+):(\w+):(\w+)$/.exec(a);
  if (mg) {
    const [, kind, nid, wn, ln] = mg, npc = D.npc || NPCS.find(n => n.id === nid); closeDialog();
    const back = win => { openDlg(); D.npc = npc; D.solo = null; D.dlg = STORY.dialogs[nid]; runNode(win ? wn : ln); };
    if (kind === 'cardsN') { if (S.hero === 'tibo') showBuff('Тибо может подсмотреть карту'); startCards(S.hero === 'tibo', back, { title: 'Очко с ' + (STORY.cast[nid] ? STORY.cast[nid].name + 'ым' : 'соседом'), foe: STORY.cast[nid] ? STORY.cast[nid].name : 'Сосед' }); }
    else if (kind === 'bandage') startBandage(back);
    else startFight(true, back, { foe: 'Буян', lit: true });
    return;
  }
  if (a === 'toHome') { closeDialog(); P.x = HOME[0]; P.z = HOME[1]; P.yaw = HOME[2]; P.pitch = 0; PATROL.sus = 0; return; }
  if (a.startsWith('cards:')) {
    const round = a.slice(6); closeDialog();
    if (S.hero === 'tibo') showBuff('Тибо может подсмотреть карту');
    startCards(S.hero === 'tibo', win => { const dan = NPCS.find(n => n.id === 'dan'); openDlg(); D.npc = dan; D.solo = null; D.dlg = STORY.dialogs.dan; runNode(win ? 'cardsWin' + round : 'cardsLose'); });
    return;
  }
}
function startNight() {
  wantTrain = false; status.style.display = 'none';
  P.x = HOME[0]; P.z = HOME[1]; P.yaw = HOME[2]; P.pitch = 0;
  S.time = -60; gameOn = true; updateQuest(); updateInv();
  if (wantFinish) { S.time = 60; applyFinish(); return; }
  startScene('night');
}
let sandOn = false;
function rollback() {
  sandOn = true; sandEl.classList.add('on'); window.SFX && SFX.play('sand');
  setTimeout(() => {
    S.loops++;
    const keep = {};
    for (const k in S.f) if (k.startsWith('hero:') || STORY.clues[k] || ['ambushed', 'solved', 'danCaught', 'danWon'].includes(k)) keep[k] = S.f[k];
    S.f = keep; derive();
    inv.clear(); doors.forEach(d => { d.cur = 0; });
    P.x = HOME[0]; P.z = HOME[1]; P.yaw = HOME[2]; P.pitch = 0; S.time = 45; PATROL.sus = 0; PATROL.x = XB + 1; CHASE.reset();
    sandEl.classList.remove('on'); sandOn = false;
    updateQuest(); updateInv();
    startScene('loop');
  }, 2600);
}

// ---------- кодовый замок сейфа ----------
let code = '';
function openKeypad() {
  code = ''; drawCode(); keypadEl.classList.add('on'); if (locked) document.exitPointerLock();
  document.getElementById('kphint').textContent = S.f.code ? 'Дэн говорил: один-пять-ноль-восемь.' : 'Четыре цифры. Не знаешь код — попробуй послушать замок.';
  document.getElementById('kplisten').style.display = S.f.code ? 'none' : 'block';
}
function drawCode() { document.getElementById('kpd').textContent = (code + '____').slice(0, 4).split('').join(' '); }
function closeKeypad() { keypadEl.classList.remove('on'); if (window.stopListen) stopListen(); }
document.getElementById('kplisten').addEventListener('click', e => { e.stopPropagation(); startListen(STORY.safeCode, safeSuccess); });
function safeSuccess() {
  window.SFX && SFX.play('unlock');
  closeKeypad();
  const so = STORY.safeOpen, lines = so.lines.concat((so.heroLines && so.heroLines[S.hero]) || []);
  if (so.heroLines && so.heroLines[S.hero]) setTimeout(() => showBuff(), 600);
  startSolo(lines, () => applyFx(so));
}
function keyIn(d) {
  window.SFX && SFX.play('click');
  if (/^[0-9]$/.test(d) && window.listenDigit && listenDigit(d)) return;
  if (d === 'C') { code = ''; drawCode(); return; }
  if (d === 'X') { closeKeypad(); return; }
  if (code.length >= 4) return;
  code += d; drawCode();
  if (code.length === 4) setTimeout(() => {
    if (code === STORY.safeCode) safeSuccess();
    else { document.getElementById('kpd').textContent = 'НЕВЕРНО'; code = ''; S.time += 1; setTimeout(drawCode, 700); }
  }, 250);
}
keypadEl.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); keyIn(b.dataset.k); }));
document.addEventListener('keydown', e => {
  if (!keypadEl.classList.contains('on')) return;
  if (/^[0-9]$/.test(e.key)) keyIn(e.key); else if (e.key === 'Backspace') { code = code.slice(0, -1); drawCode(); } else if (e.key === 'Escape') closeKeypad();
});

// ---------- концовки ----------
function showEnding(id) {
  const e = STORY.endings[id];
  document.getElementById('etitle').textContent = e.title;
  document.getElementById('etext').textContent = e.text + (S.loops ? ' Петель понадобилось: ' + (S.loops + 1) + '.' : '');
  const row = document.getElementById('erow'); row.innerHTML = '';
  const btn = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.onclick = f; row.appendChild(b); };
  if (e.next && window.enterLoc) btn(e.nextLabel || 'Дальше →', () => { endEl.classList.remove('on'); enterLoc(e.next); });
  if (!e.next || curLoc() === 'train') btn(curLoc() === 'train' ? 'Погулять по поезду' : 'Осмотреться', () => { endEl.classList.remove('on'); toastMsg = 'Дело раскрыто. Со всеми можно поговорить ещё раз.'; toastT = 3; });
  btn('Сыграть другим героем', () => location.reload());
  if (locked) document.exitPointerLock();
  window.SFX && SFX.play('win');
  endEl.classList.add('on');
}

// ---------- старт: приговор, пока грузится поезд ----------
// Сначала 3D-катсцена «Приговор» (cs/index.html). Игрок выбирает героя в ней, и после Часов игра сразу
// переходит в поезд. Если катсцены нет или она не загрузилась — обычная сцена приговора в диалоге.
const CS_HERO = { knight: 'rowen', gravedigger: 'miron', nun: 'agata', forger: 'tibo' };
function startGame() {
  const fallback = () => startScene('verdict');
  if (location.protocol === 'file:') { fallback(); return; }
  fetch('cs/index.html', { method: 'HEAD' }).then(r => {
    if (!r.ok) { fallback(); return; }
    const fr = document.createElement('iframe');
    fr.id = 'csFrame'; fr.src = 'cs/index.html?embed=1&v=61'; fr.allow = 'autoplay; fullscreen';
    fr.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999;background:#000';
    document.body.appendChild(fr);
    const onMsg = e => {
      const d = e.data || {};
      // пролог стоит на месте (заставка, выбор героя) — самое время собрать поезд, чтобы потом не ждать
      if (d.cutscene === 'idle') { window.allowBuild = true; if (window.pendingBuild) { window.pendingBuild = false; build(); } return; }
      if (d.cutscene !== 'done') return;
      removeEventListener('message', onMsg);
      fr.remove();
      const h = CS_HERO[d.hero];
      if (!h) { fallback(); return; }
      S.f['hero:' + h] = true; S.hero = h; window.setHeroFormsNow && setHeroFormsNow();
      doAction('toTrain');
    };
    addEventListener('message', onMsg);
  }).catch(fallback);
}

// ---------- погоня за Дэном ----------
const RUNNERS = [];
const TOUCHUI = matchMedia('(pointer: coarse)').matches;
const CHASE = {
  state: 'idle', x: XV - .7, z: 1.5, dir: 1, speed: 0, t: 0, st: null, tries: 0,
  init() {
    this.st = makeHuman(Object.assign({ pose: 'stand' }, LOOK.dan)); scene.add(this.st.root);
    this.reset(); RUNNERS.push(this);
  },
  reset() {
    this.state = S.f.danCaught ? 'done' : 'idle'; this.x = XV - .7; this.z = 1.5; this.dir = -1; this.tries = 0;
    if (this.st) { this.st.root.visible = this.state !== 'done'; this.st.root.position.set(this.x, 0, this.z); this.st.root.rotation.y = FACE['-x']; }
    const n = NPCS.find(q => q.id === 'dan'); if (n) n.hidden = !S.f.danCaught;
  },
  grab() {
    if (this.state !== 'corner') return;
    this.state = 'done'; this.st.root.visible = false;
    const n = NPCS.find(q => q.id === 'dan'); n.hidden = false;
    toastT = 0; startScene('caught');
  },
  tick(dt) {
    if (!this.st || this.state === 'done') return;
    const d = Math.hypot(P.x - this.x, P.z - this.z);
    if (this.state === 'idle') {
      if (gameOn && !D.on && d < 4.5 && Math.abs(P.z - 1.5) < .7) {
        this.state = 'run'; this.dir = P.x < this.x ? 1 : -1; window.SFX && SFX.play('door'); toastMsg = 'Дэн бросился бежать! Догони его' + (TOUCHUI ? ' (кнопка «Бегом»)' : ' (Shift)') + ' — в конце вагона он упрётся в тупик. Тогда быстро жми ' + (TOUCHUI ? '«Схватить»' : 'E') + '.'; toastT = 5;
      }
    } else if (this.state === 'run') {
      this.speed = this.tries ? 3.5 : 3.2;
      this.x += this.dir * this.speed * dt;
      const end = this.dir > 0 ? XV + 11.3 : XD - .9;
      if ((this.dir > 0 && this.x >= end) || (this.dir < 0 && this.x <= end)) { this.x = end; this.state = 'corner'; this.t = 0; }
      if (d < .8) { this.state = 'corner'; this.t = 0; }
    } else if (this.state === 'corner') {
      this.t += dt;
      if (d < 1.5) { if (!this.warn) { this.warn = true; this.t = 0; toastMsg = 'Дэн в тупике! Хватай — ' + (TOUCHUI ? 'жми «Схватить»!' : 'жми E!'); toastT = 2.5; } }
      const win = (this.tries ? 2.2 : 1.4) * (TOUCHUI ? 1.6 : 1);
      if (this.warn && this.t > win) {                        // не успел схватить — проскользнул мимо
        this.warn = false; this.tries++; this.state = 'run'; this.dir = -this.dir;
        toastMsg = 'Не успел — Дэн проскользнул мимо! Беги за ним: в другом конце его остановит запертая дверь СВ. Подбеги и сразу хватай.'; toastT = 4.5;
        if (this.dir < 0 && this.x < XD) this.dir = 1;
      }
    }
    this.st.root.position.set(this.x, 0, this.z);
    this.st.root.rotation.y = this.state === 'corner' ? (P.x > this.x ? FACE['+x'] : FACE['-x']) : (this.dir > 0 ? FACE['+x'] : FACE['-x']);
    animHuman(this.st, dt, P.x, P.z, false, this.state === 'run' ? this.speed : 0);
    this.st.root.visible = Math.abs(this.x - P.x) < 26;
  }
};

// ---------- стелс: Ремез обходит вагон Б ----------
const PATROL = {
  st: null, x: XB + 1, z: 1.5, dir: 1, wait: 0, sus: 0, on: false,
  init() { this.st = makeHuman(Object.assign({ pose: 'stand' }, LOOK.remez)); this.st.root.visible = false; scene.add(this.st.root); RUNNERS.push(this); },
  active() { return gameOn && S.f.access && !S.f.case && !S.f.remezOpened && !S.f.solved; },
  tick(dt) {
    const on = this.active();
    const seated = NPCS.find(q => q.id === 'remez'); if (seated) seated.hidden = on;
    if (on && !this.on) { this.x = XB + 1; this.dir = 1; this.wait = 0; this.sus = 0; toastMsg = 'Ремез встал и обходит вагон Б. Не попадись ему на глаза!'; toastT = 3.5; }
    this.on = on; this.st.root.visible = on && Math.abs(this.x - P.x) < 26;
    eyeEl.style.display = 'none';
    if (!on) return;
    let moving = 0;
    if (this.wait > 0) { this.wait -= dt; this.look = Math.sin(this.wait * 2.2) * .9; }
    else {
      this.x += this.dir * .95 * dt; moving = .95; this.look = 0;
      if (this.x > XB + 10.1) { this.x = XB + 10.1; this.dir = -1; this.wait = 2.6; }
      if (this.x < XB + .8) { this.x = XB + .8; this.dir = 1; this.wait = 2.6; }
    }
    const face = (this.dir > 0 ? FACE['+x'] : FACE['-x']) + (this.wait > 0 ? this.look : 0);
    this.st.root.position.set(this.x, 0, this.z); this.st.root.rotation.y = face;
    animHuman(this.st, dt, P.x, P.z, false, moving);
    // видит ли он игрока
    const dx = P.x - this.x, dz = P.z - this.z, dist = Math.hypot(dx, dz);
    const fx = Math.sin(face), fz = Math.cos(face), dot = (dx * fx + dz * fz) / (dist || 1);
    const inBay = P.z < 1.17 || P.z > 1.83, sameBay = Math.abs(P.x - this.x) < .9;
    const hidden = (inBay && !sameBay) || (inBay && crouch);
    const range = crouch ? 3.2 : 6.5;
    const inCar = P.x > XB - .3 && P.x < XB + 12.2;
    const sees = inCar && !D.on && !hidden && dist < range && (dot > .55 || dist < .9);
    this.sus = Math.max(0, Math.min(1, this.sus + (sees ? dt * (dist < 2.5 ? 1.0 : .5) : -dt * .3)));
    if (this.sus > 0 && inCar) {
      headW.set(this.x, 2.15, this.z); headW.project(camera);
      if (headW.z < 1) {
        eyeEl.style.display = 'flex';
        eyeEl.style.left = ((headW.x + 1) / 2 * innerWidth) + 'px'; eyeEl.style.top = ((1 - headW.y) / 2 * innerHeight) + 'px';
        eyeEl.firstChild.style.width = (this.sus * 100) + '%';
        eyeEl.className = this.sus > .66 ? 'red' : (this.sus > .3 ? 'amber' : '');
      }
    }
    if (this.sus >= 1 && !D.on) { this.sus = 0; window.SFX && SFX.play('alarm'); startScene('spotted'); }
  }
};
const eyeEl = document.getElementById('eye');
function tickRunners(dt) {
  if (!CHASE.st && trainReady) { CHASE.init(); PATROL.init(); }
  if (!PATROL.st) return;
  CHASE.tick(dt); PATROL.tick(dt);
}
window.RUNNER_POS = () => RUNNERS.filter(r => r.st && r.st.root.visible).map(r => ({ x: r.x, z: r.z }));

// ---------- маркеры зацепок и подсказка ----------
const markPool = [];
function tickMarks() {
  let k = 0;
  const lead = CUR_LEADS.slice(0, 2);
  for (const l of lead) {
    const [kind, id] = (l[2] || '').split(':');
    let x, y, z, isNpc = kind === 'npc';
    if (isNpc) {
      if (id === 'dan' && CHASE.state !== 'done') { x = CHASE.x; z = CHASE.z; y = 2.15; }
      else if (id === 'remez' && PATROL.on) { x = PATROL.x; z = PATROL.z; y = 2.25; }
      else { const n = NPCS.find(q => q.id === id && !q.hidden && (q.loc || 'train') === curLoc()); if (!n || n.hidden || (n.lv || 0) !== (P.lv || 0)) continue; x = n.x; z = n.z; y = (n.st.stand ? 2.15 : 1.75) + (P.fy || 0); }
    } else { const i = INSPECT.find(q => q.id === id && (q.loc || 'train') === curLoc()); if (!i || (i.lv || 0) !== (P.lv || 0)) continue; x = i.x; z = i.z; y = .9 + (P.fy || 0); }
    if (Math.hypot(x - P.x, z - P.z) > 20) continue;
    headW.set(x, y, z); headW.project(camera);
    if (headW.z >= 1 || Math.abs(headW.x) > 1.1 || Math.abs(headW.y) > 1.1) continue;
    let m = markPool[k]; if (!m) { m = document.createElement('div'); marksEl.appendChild(m); markPool[k] = m; }
    m.className = 'mk ' + (isNpc ? 'npc' : 'spot'); m.textContent = isNpc ? '!' : '';
    m.style.left = ((headW.x + 1) / 2 * innerWidth) + 'px'; m.style.top = ((1 - headW.y) / 2 * innerHeight) + 'px'; m.style.display = 'block';
    k++;
  }
  for (; k < markPool.length; k++) markPool[k].style.display = 'none';
}
function showHint() {
  if (!gameOn) return;
  const l = CUR_LEADS[0];
  const h = S.hero ? STORY.heroes[S.hero].name : 'Детектив';
  toastMsg = h + ': «' + (l ? l[1] : 'Похоже, я всё выяснил.') + '»'; toastT = 5;
}
document.getElementById('hintBtn').addEventListener('click', e => { e.stopPropagation(); showHint(); });

// ---------- укрытия: можно зайти в купе вагонов Б и В; служебка Ремеза — только когда открыта ----------
function addHideRects() {
  for (const X of [XB, XV]) for (let b = 0; b < 8; b++) {
    const x0 = X + b * BAYW;
    if (!(X === XB && b === 7)) walk.push([x0 + .6, x0 + .9, .4, 1.3]);
    if (b > 0) walk.push([x0 + .6, x0 + .9, 1.7, 2.6]);
  }
  walk.push([XB + 7 * BAYW + .6, XB + 7 * BAYW + .9, .4, 1.3]);
}
window.walkBlock = (x, z) => {
  const RX = XB + 7 * BAYW;
  return !S.f.access && x > RX + .5 && x < RX + 1.0 && z < 1.16;
};


// ---------- тестовая кнопка: «Завершить дело» ----------
// выдаёт все улики первого дела и ставит героя перед Ремезом с открытым обвинением
const FIN_CLUES = ['passport', 'timeDeath', 'button', 'missingButton', 'wallet', 'bundle', 'journal', 'alias', 'statement', 'danAlibi', 'velAlibi', 'receipt', 'boots', 'danSaw', 'code', 'case', 'contract', 'envelope', 'cufflink', 'radio', 'radioTag'];
const FIN_HERO = { rowen: ['slip'], miron: ['tall', 'karr', 'cufflinkL'], agata: ['lieRemez'], tibo: ['forged'] };
let wantFinish = false;
function finishCase() {
  if (window.WORLD && WORLD.cur !== 'train') { if (window.finishLocation) finishLocation(); return; }
  if (S.f.solved) { toastMsg = 'Дело уже раскрыто.'; toastT = 2.5; return; }
  if (!S.hero) { toastMsg = 'Сначала выбери героя в сцене приговора.'; toastT = 3; return; }
  if (!gameOn) { wantFinish = true; if (!trainReady || !window.allowBuild) { closeDialog(); doAction('toTrain'); } return; }
  applyFinish();
}
function applyFinish() {
  wantFinish = false;
  ['fight', 'cards', 'band', 'keypad'].forEach(id => document.getElementById(id).classList.remove('on'));
  if (noteEl.classList.contains('on')) toggleNote();
  if (D.on) closeDialog();
  FIN_CLUES.concat(FIN_HERO[S.hero] || []).forEach(id => { if (STORY.clues[id]) { S.f[id] = true; if (!S.clues.includes(id)) S.clues.push(id); } });
  ['access', 'danCaught', 'ambushed', 'remezWhat', 'remezAlibi', 'goltsAsked', 'zoyaAsked', 'polite', 'surDodge'].forEach(k => S.f[k] = true);
  NPCS.forEach(n => { S.f['met_' + n.id] = true; });
  CHASE.state = 'done'; if (CHASE.st) CHASE.st.root.visible = false; const dan = NPCS.find(n => n.id === 'dan'); if (dan) dan.hidden = false;
  PATROL.on = false; PATROL.sus = 0;
  if (S.time < 60) S.time = 60;
  derive(); updateQuest(); updateInv();
  const rz = NPCS.find(n => n.id === 'remez');
  P.x = rz.x + 1.35; P.z = 1.5; P.yaw = Math.atan2(-(rz.x - P.x), -(rz.z - P.z)); P.pitch = -.15;
  showBuff('Все улики собраны — обвини Ремеза', false, S.hero);
  setTimeout(() => { if (!D.on) startDialog(rz); }, 450);
}
document.getElementById('finBtn').addEventListener('pointerdown', e => e.stopPropagation());
document.getElementById('finBtn').addEventListener('click', e => { e.stopPropagation(); finishCase(); });
setInterval(() => { const fb = document.getElementById('finBtn'); const show = (window.WORLD && WORLD.cur !== 'train') ? !!window.finishLocation && !(WORLD.cur === 'station') : !S.f.solved; fb.style.display = show && DEV ? '' : 'none'; }, 500);
// тестовые кнопки (⏭ Завершить дело) видны только разработчику: localStorage prig_dev = '1' или ?dev в адресе
var DEV = /[?&]dev/.test(location.search); try { if (localStorage.getItem('prig_dev') === '1') DEV = true; else if (DEV) localStorage.setItem('prig_dev', '1'); } catch (e) { }
