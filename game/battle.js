// Финальная битва в тронном зале Замка Белого Полдня и облик Короля-Благодетеля.
// Король больше не «простой смертный»: это колосс из света и часовых механизмов — золотая маска, корона-нимб,
// кольца циферблатов за спиной, в груди песочные часы-сердце (его уязвимое место), под ним сыплется песок.
// В обычных сценах он сидит перед троном (фигура NPC 'king' остаётся для диалога, но невидима).
// Битва: начинается выбором «разбить Часы» / «остановить Часы» в допросе Короля (story8 → doAction 'noonBattle:<сцена>').
//   Волна 1 и 2 — гвардия Палаты; затем Король в три фазы: песчаная волна (рывок сквозь неё), луч полудня
//   (уйти с линии), призыв гвардии, удары по кругам. После каждой атаки сердце-часы открыто — бей вблизи.
// Управление: ЛКМ / F — удар, пробел — рывок (полсекунды неуязвимости), R — умение героя; на телефоне — кнопки.
// Поражение — «Ещё раз» с начала фазы Короля (или с волн), после двух поражений можно пропустить бой.
// ?battle — сразу в бой (для проверки), BATTLE.start('endTrue').
(function () {
  const NX = 2100, THRONE = { x: 0, z: -10.75 };
  const B = window.BATTLE = { on: false };
  const V3 = () => new THREE.Vector3();

  // ---------- облик Короля ----------
  function glowTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(.25, 'rgba(255,214,120,.65)'); gr.addColorStop(1, 'rgba(255,180,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t;
  }
  function buildGod() {
    const G = new THREE.Group(); G.name = 'godKing';
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd27a, metalness: 1, roughness: .22, emissive: 0x6a4a10, emissiveIntensity: .55 });
    const robeM = new THREE.MeshStandardMaterial({ color: 0xd8a84a, roughness: .45, metalness: .45, emissive: 0x4a2c06, emissiveIntensity: .5, side: THREE.DoubleSide });   // в белом зале белый король терялся
    const redM = new THREE.MeshStandardMaterial({ color: 0x8a1414, roughness: .5, metalness: .2, emissive: 0x2a0404, emissiveIntensity: .4 });
    const add = (geo, m, x, y, z, p) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); (p || G).add(o); return o; };
    // мантия — колокол до пола, расходится книзу; низ растворяется в свете
    const prof = [[.02, 3.05], [.34, 3.0], [.5, 2.75], [.52, 2.4], [.48, 2.0], [.6, 1.4], [.82, .7], [1.05, .05], [1.1, 0]].map(p => new THREE.Vector2(p[0], p[1]));
    add(new THREE.LatheGeometry(prof, 40), robeM);
    // золотые ленты по мантии
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const s = add(new THREE.BoxGeometry(.07, 2.6, .02), i % 2 ? gold : redM, Math.sin(a) * .62, 1.45, Math.cos(a) * .62); s.rotation.y = a; s.rotation.x = Math.cos(a) * .08; s.rotation.z = -Math.sin(a) * .08; }
    // плечи и наплечники
    for (const sd of [-1, 1]) { const sh = add(new THREE.SphereGeometry(.26, 20, 14), gold, sd * .5, 2.82, 0); sh.scale.set(1.25, .7, 1); }
    // руки (поднимаются в атаках)
    const arms = [-1, 1].map(sd => {
      const sh = new THREE.Group(); sh.position.set(sd * .6, 2.78, 0); G.add(sh);
      add(new THREE.CylinderGeometry(.13, .1, 1.0, 14), robeM, 0, -.5, 0, sh);
      const el = new THREE.Group(); el.position.y = -1.0; sh.add(el);
      add(new THREE.CylinderGeometry(.1, .08, .9, 14), robeM, 0, -.45, 0, el);
      const hand = add(new THREE.SphereGeometry(.11, 14, 10), gold, 0, -.95, 0, el); hand.scale.set(.9, 1.2, .7);
      sh.rotation.z = sd * .35; el.rotation.x = -.5;
      return { sh, el, sd };
    });
    // голова: золотая маска без черт, светящиеся глаза
    const head = new THREE.Group(); head.position.y = 3.32; G.add(head);
    const mask = add(new THREE.SphereGeometry(.3, 28, 20), gold, 0, 0, 0, head); mask.scale.set(.86, 1.08, .9);
    const eyeM = new THREE.MeshBasicMaterial({ color: 0xfff6d8 });
    for (const sd of [-1, 1]) { const e = add(new THREE.SphereGeometry(.045, 10, 8), eyeM, sd * .1, .04, .25, head); e.scale.set(1.6, .55, .5); }
    add(new THREE.BoxGeometry(.02, .16, .02), new THREE.MeshBasicMaterial({ color: 0x3a2a10 }), 0, -.12, .27, head);
    // корона из двенадцати лучей
    const crown = new THREE.Group(); crown.position.y = .3; head.add(crown);
    add(new THREE.TorusGeometry(.25, .025, 8, 40), gold, 0, 0, 0, crown).rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const sp = add(new THREE.ConeGeometry(.03, .32 + (i % 3 === 0 ? .18 : 0), 6), gold, Math.sin(a) * .25, .18, Math.cos(a) * .25, crown); sp.rotation.z = -Math.sin(a) * .25; sp.rotation.x = Math.cos(a) * .25; }
    // нимб и сияние (без ламп: свет — материалы, чтобы не пересобирать шейдеры)
    const glowM = new THREE.SpriteMaterial({ map: glowTex(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const halo = new THREE.Sprite(glowM); halo.scale.set(3.2, 3.2, 1); halo.position.set(0, 3.4, -.35); G.add(halo);
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowM.map, color: 0xff9a30, transparent: true, depthWrite: false, opacity: .5 })); aura.scale.set(6.5, 7.5, 1); aura.position.set(0, 2.3, -.9); G.add(aura);   // тёплый ореол отделяет его от белых стен
    const haloRing = add(new THREE.TorusGeometry(.62, .03, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 3.4, -.3);
    // часовые кольца за спиной: римские метки, крутятся навстречу
    const rings = [];
    for (const [r, n, sp] of [[1.55, 12, .12], [2.05, 24, -.07]]) {
      const ring = new THREE.Group(); ring.position.set(0, 2.6, -.55); G.add(ring);
      add(new THREE.TorusGeometry(r, .035, 8, 90), gold, 0, 0, 0, ring);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const m = add(new THREE.BoxGeometry(.05, i % 3 === 0 ? .26 : .14, .04), gold, Math.sin(a) * r, Math.cos(a) * r, 0, ring); m.rotation.z = -a; }
      ring.userData.sp = sp; rings.push(ring);
    }
    // песочные часы-сердце в груди: стекло + светящийся песок
    const heart = new THREE.Group(); heart.position.set(0, 2.35, .6); heart.scale.setScalar(1.25); G.add(heart);   // на груди, поверх мантии (глубже — тонуло в ней)
    const glass = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: .35, roughness: .05, metalness: .2, depthWrite: false });
    const sandM = new THREE.MeshBasicMaterial({ color: 0xffb040 });
    for (const sd of [-1, 1]) { const c = add(new THREE.ConeGeometry(.2, .3, 20, 1, true), glass, 0, sd * .15, 0, heart); c.rotation.x = sd > 0 ? Math.PI : 0; }
    const sandTop = add(new THREE.ConeGeometry(.15, .2, 16), sandM, 0, .2, 0, heart); sandTop.rotation.x = Math.PI;
    const sandBot = add(new THREE.ConeGeometry(.17, .14, 16), sandM, 0, -.22, 0, heart);
    for (const sd of [-1, 1]) add(new THREE.CylinderGeometry(.24, .24, .03, 20), gold, 0, sd * .31, 0, heart);
    const heartGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowM.map, color: 0xffa040, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55 }));
    heartGlow.scale.set(1.1, 1.1, 1); heart.add(heartGlow);
    // песок сыплется из-под мантии
    const N = 160, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * .9; pos[i * 3] = Math.sin(a) * r; pos[i * 3 + 1] = Math.random() * .6; pos[i * 3 + 2] = Math.cos(a) * r; seed[i] = Math.random(); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sand = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffd080, size: .05, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
    G.add(sand);
    G.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = false; } });
    return { G, arms, head, halo, haloRing, rings, heart, heartGlow, sandTop, sandBot, sand, seed, t: 0, lift: 0, pose: 'idle', open: 0 };
  }
  let god = null;
  function animGod(dt) {
    if (!god) return;
    const g = god; g.t += dt;
    g.rings.forEach(r => { r.rotation.z += r.userData.sp * dt * (B.on ? 2.2 : 1); });
    g.haloRing.rotation.z += dt * .3;
    g.halo.material.opacity = .75 + Math.sin(g.t * 2.1) * .15;
    // руки: покой / замах (атака) / опущены (уязвим)
    const up = g.pose === 'raise' ? 1 : 0, low = g.open > 0 ? 1 : 0;
    g.arms.forEach(a => {
      const tz = a.sd * (up ? 1.25 : low ? .15 : .35 + Math.sin(g.t * 1.3 + a.sd) * .05), tx = up ? -.4 : low ? .2 : 0;
      a.sh.rotation.z += (tz - a.sh.rotation.z) * Math.min(1, dt * 6); a.sh.rotation.x += (tx - a.sh.rotation.x) * Math.min(1, dt * 6);
      a.el.rotation.x += ((up ? -1.2 : -.5) - a.el.rotation.x) * Math.min(1, dt * 6);
    });
    // парит; уязвимый — опускается и склоняется, сердце светит ярко
    const hover = .25 + Math.sin(g.t * 1.6) * .08 + g.lift - low * .3;
    g.G.position.y += (hover - g.G.position.y) * Math.min(1, dt * 4);
    g.G.rotation.x += ((low ? .22 : 0) - g.G.rotation.x) * Math.min(1, dt * 4);
    const hb = low ? 1.9 + Math.sin(g.t * 9) * .3 : .9 + Math.sin(g.t * 2.5) * .1;
    g.heartGlow.scale.setScalar(hb); g.heartGlow.material.opacity = low ? .95 : .5;
    g.sandTop.scale.y = .6 + .4 * Math.abs(Math.sin(g.t * .2));
    // песок падает и снова появляется под мантией
    const p = g.sand.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * (.5 + g.seed[i] * .8); if (y < -.35) y = .55; p.setY(i, y); }
    p.needsUpdate = true;
  }

  // король на троне: прячем простую фигуру (она нужна для диалога), ставим колосса
  function kingNPC() { return typeof NPCS !== 'undefined' ? NPCS.find(n => n.id === 'king') : null; }
  function placeGod() {
    if (!window.WORLD || WORLD.cur !== 'noon') { if (god) god.G.visible = false; return; }
    if (!god) { god = buildGod(); scene.add(god.G); }
    const k = kingNPC();
    if (k && k.st && k.st.root && B.film) k.st.root.scale.setScalar(.001);
    if (k && k.st && k.st.root && !B.on && !B.film) {   // B.film — кино ставит колосса само
      k.st.root.scale.setScalar(.001);   // простой «смертный» больше не виден
      god.G.visible = !k.hidden;
      god.G.position.x = NX + THRONE.x; god.G.position.z = THRONE.z + .25; god.G.rotation.y = 0;
      god.G.scale.setScalar(.82); god.lift = 0;
    }
  }

  // ---------- интерфейс боя ----------
  let ui = null;
  function css() {
    const s = document.createElement('style');
    s.textContent = `#battle{position:fixed;inset:0;pointer-events:none;z-index:30;font-family:Georgia,serif;color:#f3e6c8;display:none}
#battle.on{display:block}
#battle.dark::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.15) 20%,rgba(0,0,0,.8) 100%)}
#battle::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 45%,rgba(25,12,2,.62) 100%)}
body.inbattle #tut,body.inbattle #quest,body.inbattle #marks,body.inbattle #inv,body.inbattle #prompt,body.inbattle #who,body.inbattle #hint{visibility:hidden!important}
#battle .bars{position:absolute;left:0;right:0;height:7vh;background:#000;transition:transform .5s}
#battle .bars.t{top:0}#battle .bars.b{bottom:0}
#battle .hp{position:absolute;left:18px;bottom:calc(7vh + 14px);font-size:26px;letter-spacing:2px;text-shadow:0 2px 6px #000}
#battle .hp span{opacity:.25}
#battle .boss{position:absolute;left:50%;top:calc(7vh + 12px);transform:translateX(-50%);width:min(60vw,560px);text-align:center;opacity:0;transition:opacity .6s}
#battle .boss.on{opacity:1}
#battle .boss .nm{font-size:15px;letter-spacing:.25em;text-transform:uppercase;color:#ffd98a;text-shadow:0 0 12px #a86a10}
#battle .boss .bar{height:9px;margin-top:6px;border:1px solid #d8b060;background:rgba(0,0,0,.55)}
#battle .boss .fill{height:100%;background:linear-gradient(90deg,#ffe7a0,#e0a030);width:100%;transition:width .25s}
#battle .wave{position:absolute;top:calc(7vh + 14px);right:18px;font-size:14px;letter-spacing:.12em;color:#e8d4a8}
#battle .sub{position:absolute;left:50%;bottom:calc(7vh + 64px);transform:translateX(-50%);max-width:min(80vw,760px);text-align:center;font-size:21px;line-height:1.35;background:rgba(12,8,4,.62);padding:8px 16px;border-radius:6px;text-shadow:0 2px 8px #000,0 0 2px #000;opacity:0;transition:opacity .3s}
#battle .sub b{display:block;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#ffd98a;margin-bottom:4px}
#battle .hint{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-size:18px;background:rgba(12,8,4,.5);padding:6px 14px;border-radius:6px;color:#fff3cc;text-shadow:0 0 10px #a86a10,0 2px 6px #000;opacity:0;transition:opacity .25s;text-align:center}
#battle .bcard{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.0);opacity:0;transition:opacity .7s;text-align:center}
#battle .bcard .big{font-size:clamp(28px,6vw,58px);letter-spacing:.18em;color:#ffe2a0;text-shadow:0 0 30px #c88a20}
#battle .bcard .small{font-size:16px;margin-top:10px;letter-spacing:.1em;color:#e8d8b8}
#battle .flash{position:absolute;inset:0;background:#fff;opacity:0;transition:opacity .35s}
#battle .hurt{position:absolute;inset:0;box-shadow:inset 0 0 160px 40px rgba(170,20,10,.85);opacity:0;transition:opacity .25s}
#battle .ab{position:absolute;right:18px;bottom:calc(7vh + 14px);font-size:14px;text-align:right;background:rgba(12,8,4,.5);padding:6px 10px;border-radius:6px;text-shadow:0 2px 6px #000}
#battle .ab i{font-style:normal;color:#ffd98a}
#battle .btns{position:absolute;right:16px;bottom:calc(7vh + 48px);display:none;gap:12px;pointer-events:auto}
#battle.touch .btns{display:flex}
#battle .btns button{width:68px;height:68px;border-radius:50%;border:2px solid #d8b060;background:rgba(20,14,8,.6);color:#ffe2a0;font-size:26px}
#battle .over{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.72);pointer-events:auto;gap:14px}
#battle .over.on{display:flex}
#battle .over .t{font-size:24px;color:#ffd9a0;max-width:80vw;text-align:center}
#battle .over button{font:18px Georgia,serif;padding:10px 26px;border:1px solid #d8b060;background:#1a120a;color:#ffe2a0;border-radius:6px;cursor:pointer}`;
    document.head.appendChild(s);
  }
  function makeUI() {
    css();
    const d = document.createElement('div'); d.id = 'battle';
    d.innerHTML = `<div class="bars t"></div><div class="bars b"></div><div class="flash"></div><div class="hurt"></div>
<div class="boss"><div class="nm">Король-Благодетель</div><div class="bar"><div class="fill"></div></div></div>
<div class="wave"></div><div class="hp"></div><div class="ab"></div><div class="hint"></div><div class="sub"></div>
<div class="bcard"><div class="big"></div><div class="small"></div></div>
<div class="btns"><button data-b="dash">⤴</button><button data-b="ab">★</button><button data-b="hit">⚔</button></div>
<div class="over"><div class="t"></div><button data-o="retry">Ещё раз</button><button data-o="skip" style="display:none">Пропустить бой</button></div>`;
    document.body.appendChild(d);
    const q = s => d.querySelector(s);
    ui = { d, hp: q('.hp'), boss: q('.boss'), fill: q('.fill'), wave: q('.wave'), sub: q('.sub'), hint: q('.hint'), card: q('.bcard'), flash: q('.flash'), hurt: q('.hurt'), ab: q('.ab'), over: q('.over') };
    if (matchMedia('(pointer: coarse)').matches) d.classList.add('touch');
    d.querySelectorAll('[data-b]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); act(b.dataset.b); }));
    d.querySelector('[data-o=retry]').addEventListener('click', e => { e.stopPropagation(); retry(); });
    d.querySelector('[data-o=skip]').addEventListener('click', e => { e.stopPropagation(); finish(true, true); });
  }
  let subT = 0, hintT = 0, cardT = 0;
  function say(line, dur) {   // line: [кто, эмоция, текст]
    const nm = line[0] === 'king' ? 'Король-Благодетель' : line[0] === null ? '' : ((STORY.cast[line[0]] || {}).name || (STORY.heroes[line[0]] || {}).name || '');
    ui.sub.innerHTML = (nm ? '<b>' + nm + '</b>' : '') + line[2]; ui.sub.style.opacity = 1; subT = dur || 3.6;
    if (window.VOICE) VOICE.play(line[0], line[2]);
  }
  function hint(t, dur) { ui.hint.textContent = t; ui.hint.style.opacity = 1; hintT = dur || 2; }
  function card(big, small, dur) { ui.card.querySelector('.big').textContent = big; ui.card.querySelector('.small').textContent = small || ''; ui.card.style.opacity = 1; cardT = dur || 2.6; }
  function flash(a) { ui.flash.style.transition = 'none'; ui.flash.style.opacity = a == null ? .85 : a; void ui.flash.offsetWidth; ui.flash.style.transition = 'opacity .6s'; ui.flash.style.opacity = 0; }
  function hurtFx() { ui.hurt.style.transition = 'none'; ui.hurt.style.opacity = 1; void ui.hurt.offsetWidth; ui.hurt.style.transition = 'opacity .5s'; ui.hurt.style.opacity = 0; }

  // ---------- реплики боя (их озвучивает tools/voice/build.py — ищет такие строки в коде) ----------
  const L = {
    intro: ['king', 'angry', 'Разбить полдень? Тогда смотрите, чем он был все эти триста лет.'],
    guard: ['king', 'neutral', 'Гвардия. Проводите гостей — туда, откуда не возвращаются.'],
    wave2: ['king', 'smile', 'Ещё. Палата не кончается. Она — везде, где нужен порядок.'],
    rise: ['king', 'angry', 'Хватит. Я сам.'],
    p2: ['king', 'angry', 'Триста лет я держал солнце над этой землёй. Вы не удержите его и минуты.'],
    p3: ['king', 'angry', 'Если Ясноземью суждено умереть — оно умрёт вместе с вами!'],
    fall: ['king', 'sad', 'Тихо... Наконец-то тихо. Я и забыл, как звучит тишина.'],
    lose: [null, null, 'Песок засыпает зал. Двенадцатый удар звучит снова.']
  };
  const HERO_AB = {
    rowen: ['Щит ордена', 'неуязвимость и толчок щитом'], miron: ['Карр', 'ворон отвлекает стражу, сердце Короля открыто дольше'],
    agata: ['Молитва', '+2 сердца'], tibo: ['Пригоршня крон', 'удар монетами по всем рядом'],
    gordey: ['Топор палача', 'двойной урон 6 с'], evsey: ['Летопись', 'время замедляется 5 с'], margaret: ['Жажда', 'удары лечат']
  };

  // ---------- состояние ----------
  let st = null;
  const ARENA = { x0: -7.2, x1: 7.2, z0: -9.0, z1: 7.2 };
  function OX() { return st && st.mode === 'duel' ? 0 : NX; }
  function heroId() { return (typeof S !== 'undefined' && S.hero) || 'rowen'; }
  function fwd() { return { x: -Math.sin(P.yaw), z: -Math.cos(P.yaw) }; }
  function rel(x, z) { return { x: x - NX, z }; }

  function guardLook() {
    return { coat: '#f4f2ec', pants: '#e8e4dc', boots: true, buttons: true, belt: '#d8b060', hat: 'greathelm', helmCol: '#d8dce2', hair: 'none', skin: '#e8c8a8' };   // «Белые»: светлые латы и золотые зубцы
  }
  function spawnGuard(x, z, look) {
    const s = window.makeHuman(look || guardLook());
    s.root.position.set(OX() + x, 0, z); scene.add(s.root);
    // меч в правой руке: клинок светится красным при замахе
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.04, .8, .012), new THREE.MeshStandardMaterial({ color: 0xd8dce4, metalness: .9, roughness: .25, emissive: 0x000000 }));
    blade.position.set(0, -.42, .04); blade.rotation.x = Math.PI; const hilt = new THREE.Mesh(new THREE.BoxGeometry(.16, .025, .03), new THREE.MeshStandardMaterial({ color: 0xc9a050, metalness: .8, roughness: .3 }));
    hilt.position.set(0, -.04, .04); const hand = s.arms[1].hand; hand.add(blade); hand.add(hilt);
    blade.userData.acc = hilt.userData.acc = 'root';
    if (window.Passengers3D && Passengers3D.attach && (!window.GFX || GFX.people !== false)) { try { Passengers3D.attach(s); } catch (e) { } }
    const g = { s, x, z, hp: 3, state: 'walk', t: 0, cd: 1 + Math.random(), blade, dead: 0, kb: 0, kx: 0, kz: 0, hitT: 0 };
    st.guards.push(g);
    return g;
  }
  function killGuard(g) { g.state = 'dead'; g.dead = 0.001; window.SFX && SFX.play('thud'); }

  function start(endScene) {
    // автотесты (chain.py) бой не играют — сразу концовка; ?battle — проверка самого боя
    if (navigator.webdriver && !/[?&]battle/.test(location.search)) { if (window.locAction) locAction('noonEnd:' + endScene); return; }
    if (!ui) makeUI();
    if (typeof closeDialog === 'function' && D.on) closeDialog();
    placeGod();
    const hp = heroId() === 'evsey' ? 4 : 6;
    st = { end: endScene, phase: 'intro', t: 0, hp, maxHp: hp, boss: 12, bossMax: 12, guards: [], fx: [], atk: null, atkT: 2.5, inv: 0, dashT: 0, hitCd: 0,
      ab: 0, abOn: 0, abKind: heroId(), losses: (st && st.end === endScene ? st.losses : 0), slow: 0, wave: 0, crowT: 0, shake: 0, from: 'waves' };
    B.on = true; window.__battleOn = true; document.body.classList.add('inbattle');
    ui.d.classList.add('on'); ui.over.classList.remove('on'); ui.boss.classList.remove('on');
    // игрок — у входа в тронный зал, лицом к трону
    P.x = NX; P.z = 4.5; P.yaw = 0; P.pitch = .12; P.lv = 0; P.fy = 0;
    god.lift = 0; god.G.scale.setScalar(.82); god.open = 0; god.pose = 'idle';
    drawHP(); ui.ab.innerHTML = '<i>R / ★</i> — ' + HERO_AB[st.abKind][0] + ' (' + HERO_AB[st.abKind][1] + ')<br><i>ЛКМ / F / ⚔</i> — удар · <i>Пробел / ⤴</i> — рывок';
    card('Двенадцатый удар', 'Полдень не отпустит без боя', 3.2);
    window.SFX && SFX.play('bell');
    setTimeout(() => st && say(L.intro, 4.4), 900);
  }
  function retry() { const e = st.end, from = st.from, losses = st.losses; start(e); st.losses = losses; if (from === 'boss') { st.phase = 'rise'; st.t = 0; } ui.over.classList.remove('on'); }

  function drawHP() { ui.hp.innerHTML = '♥'.repeat(Math.max(0, st.hp)) + '<span>' + '♥'.repeat(Math.max(0, st.maxHp - st.hp)) + '</span>'; }
  function drawBoss() { ui.fill.style.width = Math.max(0, st.boss / st.bossMax * 100) + '%'; }

  function damagePlayer(n) {
    if (st.inv > 0 || st.phase === 'won' || st.phase === 'lost') return;
    st.hp -= n; st.inv = .8; st.shake = .35; hurtFx(); drawHP(); window.SFX && SFX.play('hit');
    if (st.hp <= 0) lose();
  }
  function lose() {
    if (st.mode === 'duel') { st.phase = 'lost'; hint('Темнеет в глазах...', 1.4); setTimeout(() => endDuel(false), 1300); return; }
    st.phase = 'lost'; st.losses++;
    say(L.lose, 4);
    setTimeout(() => {
      if (!st) return;
      ui.over.querySelector('.t').textContent = st.from === 'boss' ? 'Король сильнее. Пока.' : 'Гвардия Палаты сомкнула строй.';
      ui.over.querySelector('[data-o=skip]').style.display = st.losses >= 2 ? '' : 'none';
      ui.over.classList.add('on');
      if (document.pointerLockElement) document.exitPointerLock();
    }, 1600);
  }
  function finish(win, skipped) {
    const e = st.end;
    st.guards.forEach(g => scene.remove(g.s.root)); st.fx.forEach(f => scene.remove(f.o));
    ui.d.classList.remove('on'); ui.over.classList.remove('on');
    B.on = false; window.__battleOn = false; st = null; document.body.classList.remove('inbattle');
    if (god) { god.open = 0; god.pose = 'idle'; }
    if (window.locAction) locAction('noonEnd:' + e); else if (typeof startScene === 'function') startScene(e);
  }

  // ---------- действия игрока ----------
  function act(kind) {
    if (!st || st.phase === 'intro' || st.phase === 'lost' || st.phase === 'won' || st.phase === 'rise') return;
    if (kind === 'hit') attack();
    else if (kind === 'dash') dash();
    else if (kind === 'ab') ability();
  }
  function attack() {
    if (st.hitCd > 0) return;
    st.hitCd = .42; window.SFX && SFX.play('miss');
    const f = fwd(), dmg = st.abOn > 0 && st.abKind === 'gordey' ? 2 : 1; let hit = false;
    for (const g of st.guards) {
      if (g.state === 'dead') continue;
      const dx = OX() + g.x - P.x, dz = g.z - P.z, d = Math.hypot(dx, dz);
      if (d < 2.2 && (dx * f.x + dz * f.z) / Math.max(.01, d) > .45) {
        g.hp -= dmg; g.hitT = .2; g.kb = .25; g.kx = dx / d; g.kz = dz / d; hit = true;
        if (st.mode === 'duel' && g.max) ui.fill.style.width = Math.max(0, g.hp / g.max * 100) + '%';
        if (g.hp <= 0) killGuard(g);
      }
    }
    // сердце-часы Короля: только когда открыто и вблизи
    if (st.phase === 'boss' && god.open > 0) {
      const gx = god.G.position.x, gz = god.G.position.z, dx = gx - P.x, dz = gz - P.z, d = Math.hypot(dx, dz);
      if (d < 3.7 && (dx * f.x + dz * f.z) / Math.max(.01, d) > .3) { bossHit(dmg); hit = true; }
    }
    if (hit) { window.SFX && SFX.play('hit'); st.shake = Math.max(st.shake, .12); if (st.abOn > 0 && st.abKind === 'margaret') { st.hp = Math.min(st.maxHp, st.hp + 1); drawHP(); } }
  }
  function dash() {
    if (st.dashT > 0) return;
    st.dashT = .9; st.inv = Math.max(st.inv, .5);
    // рывок в сторону движения (или назад)
    const k = (typeof keys !== 'undefined') ? keys : {};
    let mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0), mz = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    if (!mx && !mz) mz = 1;
    const c = Math.cos(P.yaw), s = Math.sin(P.yaw);
    const wx = mx * c + mz * s, wz = -mx * s + mz * c, l = Math.hypot(wx, wz) || 1;
    for (let i = 0; i < 10; i++) { const nx = P.x + wx / l * .24, nz = P.z + wz / l * .24; if (typeof inside === 'function' && !inside(nx, nz)) break; P.x = nx; P.z = nz; }
    window.SFX && SFX.play('miss');
  }
  function ability() {
    if (st.ab > 0) { hint('Умение ещё не готово', .9); return; }
    st.ab = 14; const k = st.abKind;
    flash(.35); window.SFX && SFX.play('buff');
    if (k === 'rowen') { st.inv = 4; st.abOn = 4; for (const g of st.guards) { const dx = OX() + g.x - P.x, dz = g.z - P.z, d = Math.hypot(dx, dz); if (d < 3.5 && g.state !== 'dead') { g.kb = .5; g.kx = dx / d; g.kz = dz / d; g.state = 'walk'; g.t = 0; g.cd = 2; } } hint('Щит ордена!', 1.2); }
    else if (k === 'miron') { st.crowT = 6; st.abOn = 6; if (god && god.open > 0) god.open += 2; hint('Карр, отвлеки их!', 1.2); }
    else if (k === 'agata') { st.hp = Math.min(st.maxHp, st.hp + 2); drawHP(); hint('Господи, дай сил.', 1.2); }
    else if (k === 'tibo') { let n = 0; for (const g of st.guards) { if (g.state === 'dead') continue; if (Math.hypot(OX() + g.x - P.x, g.z - P.z) < 8) { g.hp--; g.hitT = .2; n++; if (g.hp <= 0) killGuard(g); } } if (st.phase === 'boss' && god.open > 0) bossHit(1); window.SFX && SFX.play('card'); hint(n ? 'Сдачи не надо!' : 'Мимо кассы.', 1.2); }
    else if (k === 'gordey') { st.abOn = 6; hint('Топор палача!', 1.2); }
    else if (k === 'evsey') { st.slow = 5; st.abOn = 5; hint('Время записано — и замедлено.', 1.4); }
    else if (k === 'margaret') { st.abOn = 6; hint('Кровь за кровь.', 1.2); }
  }
  function bossHit(n) {
    st.boss -= n; drawBoss(); flash(.25);
    god.heartGlow.scale.multiplyScalar(1.4);
    if (st.boss <= 8 && st.bp < 2) { st.bp = 2; st.slow = 1.2; say(L.p2, 4.4); god.open = 0; st.atkT = 2.2; card('Вторая фаза', 'Король призывает гвардию', 1.8); }
    else if (st.boss <= 4 && st.bp < 3) { st.bp = 3; st.slow = 1.2; say(L.p3, 4.2); god.open = 0; st.atkT = 2; card('Последний удар', '', 1.6); }
    if (st.boss <= 0) win();
  }
  function win() {
    st.phase = 'won'; god.open = 0; god.pose = 'idle'; st.slow = 2; flash(1);
    window.SFX && SFX.play('win');
    say(L.fall, 5);
    // сердце лопается: песок осыпается, колосс гаснет
    setTimeout(() => { if (!st) return; card('Полдень окончен', '', 2.4); }, 1800);
    setTimeout(() => { if (st) finish(true); }, 5200);
  }

  // ---------- атаки Короля ----------
  function ringFx(color) {
    const m = new THREE.Mesh(new THREE.RingGeometry(.9, 1.5, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.position.set(god.G.position.x, .05, god.G.position.z); scene.add(m); return m;
  }
  function beginAttack() {
    const ph = st.bp || 1, opts = ['wave', 'beam'];
    if (ph >= 2) opts.push('summon');
    if (ph >= 3) opts.push('slam', 'wave');
    let kind = opts[Math.floor(Math.random() * opts.length)];
    if (kind === 'summon' && st.guards.filter(g => g.state !== 'dead').length >= 2) kind = 'beam';
    const fast = ph >= 3 ? .75 : 1;
    god.pose = 'raise';
    if (kind === 'wave') { st.atk = { kind, t: 0, tele: 1.1 * fast, r: 0, hit: false, o: null }; hint('Песчаная волна — рывок сквозь неё (пробел)!', 1.6); }
    else if (kind === 'beam') {
      const dx = P.x - god.G.position.x, dz = P.z - god.G.position.z, l = Math.hypot(dx, dz) || 1;
      const line = new THREE.Mesh(new THREE.PlaneGeometry(.08, 26), new THREE.MeshBasicMaterial({ color: 0xff5030, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
      line.rotation.x = -Math.PI / 2; line.rotation.z = Math.atan2(dx, dz); line.position.set(god.G.position.x + dx / l * 13, .06, god.G.position.z + dz / l * 13); scene.add(line);
      st.atk = { kind, t: 0, tele: 1.2 * fast, dir: { x: dx / l, z: dz / l }, o: line, hit: false }; hint('Луч полудня — уйди с линии!', 1.4);
    }
    else if (kind === 'summon') { st.atk = { kind, t: 0, tele: 1.0 }; say(L.guard, 3); }
    else if (kind === 'slam') {
      const marks = [];
      for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), new THREE.MeshBasicMaterial({ color: 0xff7030, transparent: true, opacity: .35, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(P.x + (Math.random() - .5) * 3 * (i ? 1 : 0), .06, P.z + (Math.random() - .5) * 3 * (i ? 1 : 0)); scene.add(m); marks.push(m); }
      st.atk = { kind, t: 0, tele: 1.3 * fast, marks, hit: false }; hint('Круги света — прочь из них!', 1.3);
    }
  }
  function tickAttack(dt) {
    const a = st.atk; if (!a) return;
    a.t += dt;
    const gx = god.G.position.x, gz = god.G.position.z;
    if (a.kind === 'wave') {
      if (a.t > a.tele) {
        if (!a.o) { a.o = ringFx(0xffc060); st.shake = .2; window.SFX && SFX.play('alarm'); god.pose = 'idle'; }
        a.r += dt * 6.5; a.o.scale.setScalar(a.r / 1.2 + .01); a.o.material.opacity = Math.max(0, .85 - a.r / 18);
        const d = Math.hypot(P.x - gx, P.z - gz);
        if (!a.hit && Math.abs(d - a.r) < .55) { a.hit = true; if (st.inv <= 0) damagePlayer(1); }
        if (a.r > 17) { scene.remove(a.o); endAttack(); }
      }
    } else if (a.kind === 'beam') {
      if (a.t < a.tele) a.o.material.opacity = .4 + .4 * Math.abs(Math.sin(a.t * 14));
      else if (!a.fired) { a.fired = true; a.o.material.color.set(0xfff0b0); a.o.scale.x = 14; a.o.material.opacity = .95; a.o.material.blending = THREE.AdditiveBlending; flash(.3); st.shake = .3; window.SFX && SFX.play('alarm'); god.pose = 'idle';
        const px = P.x - gx, pz = P.z - gz, along = px * a.dir.x + pz * a.dir.z, side = Math.abs(px * a.dir.z - pz * a.dir.x);
        if (along > 0 && side < .75 && st.inv <= 0) damagePlayer(1); }
      else if (a.t > a.tele + .45) { scene.remove(a.o); endAttack(); }
    } else if (a.kind === 'summon') {
      if (a.t > a.tele && !a.done) { a.done = true; god.pose = 'idle'; flash(.25); spawnGuard(-5.5, -6.5); spawnGuard(5.5, -6.5); endAttack(); }
    } else if (a.kind === 'slam') {
      a.marks.forEach(m => { m.material.opacity = .25 + .35 * (a.t / a.tele); });
      if (a.t > a.tele && !a.fired) { a.fired = true; flash(.4); st.shake = .4; window.SFX && SFX.play('alarm'); god.pose = 'idle';
        if (a.marks.some(m => Math.hypot(P.x - m.position.x, P.z - m.position.z) < 1.25) && st.inv <= 0) damagePlayer(1);
        a.marks.forEach(m => { m.material.color.set(0xfff0c0); m.material.opacity = .9; }); }
      if (a.t > a.tele + .35) { a.marks.forEach(m => scene.remove(m)); endAttack(); }
    }
  }
  function endAttack() {
    st.atk = null;
    // после атаки сердце открыто — окно для удара
    god.open = (st.crowT > 0 ? 4.6 : 2.8);
    hint('Сердце-часы открыто — бей!', 1.4);
    st.atkT = god.open + (st.bp >= 3 ? 1.0 : 1.6);
  }

  // ---------- кадр ----------
  let last = performance.now(), camBase = null;
  function tick() {
    requestAnimationFrame(tick);
    const now = performance.now(); let dt = Math.min(.05, (now - last) / 1000); last = now;
    placeGod(); animGod(dt);
    if (!st || !B.on) return;
    if (st.slow > 0) { st.slow -= dt; dt *= .35; }
    st.t += dt;
    st.inv = Math.max(0, st.inv - dt); st.hitCd = Math.max(0, st.hitCd - dt); st.dashT = Math.max(0, st.dashT - dt);
    st.ab = Math.max(0, st.ab - dt); st.abOn = Math.max(0, st.abOn - dt); st.crowT = Math.max(0, st.crowT - dt);
    if (subT > 0 && (subT -= dt) <= 0) ui.sub.style.opacity = 0;
    if (hintT > 0 && (hintT -= dt) <= 0) ui.hint.style.opacity = 0;
    if (cardT > 0 && (cardT -= dt) <= 0) ui.card.style.opacity = 0;
    ui.ab.style.opacity = st.ab > 0 ? .55 : 1;
    // держим игрока в зале
    const r = rel(P.x, P.z);
    if (st.mode !== 'duel') {
    if (r.x < ARENA.x0) P.x = NX + ARENA.x0; if (r.x > ARENA.x1) P.x = NX + ARENA.x1;
    if (r.z > ARENA.z1) P.z = ARENA.z1; if (r.z < ARENA.z0 + .3) P.z = ARENA.z0 + .3;
    }
    // тряска камеры: лёгкое дрожание взгляда
    if (st.shake > 0) { st.shake -= dt; P.yaw += (Math.random() - .5) * st.shake * .06; P.pitch += (Math.random() - .5) * st.shake * .05; }

    // фазы
    if (st.phase === 'intro') {
      // Король встаёт с трона и вырастает
      god.lift = Math.min(1.2, st.t * .35); god.G.scale.setScalar(.82 + Math.min(.43, st.t * .12));
      if (st.t > 5.2) { st.phase = 'waves'; st.wave = 0; st.t = 0; }
    } else if (st.phase === 'waves') {
      const alive = st.guards.filter(g => g.state !== 'dead');
      if (!alive.length && st.t > .8) {
        if (st.wave === 0) { st.wave = 1; say(L.guard, 3.4); [[-4, -4], [0, -5.5], [4, -4]].forEach(p => spawnGuard(p[0], p[1])); ui.wave.textContent = 'Гвардия Палаты · 1/2'; }
        else if (st.wave === 1) { st.wave = 2; say(L.wave2, 3.4); [[-6, -1], [6, -1], [-3, -6.5], [3, -6.5]].forEach(p => spawnGuard(p[0], p[1])); ui.wave.textContent = 'Гвардия Палаты · 2/2'; }
        else { st.phase = 'rise'; st.t = 0; ui.wave.textContent = ''; }
      }
    } else if (st.phase === 'rise') {
      if (st.t < dt * 1.5) { say(L.rise, 2.6); flash(.6); st.shake = .5; window.SFX && SFX.play('bell'); st.from = 'boss'; }
      god.lift = 1.2; god.G.scale.setScalar(1.25);
      if (st.t > 2.4) { st.phase = 'boss'; st.t = 0; st.bp = 1; st.atkT = 1.2; ui.boss.classList.add('on'); drawBoss(); }
    } else if (st.phase === 'duel') {
      const alive = st.guards.filter(g => g.state !== 'dead' && g.state !== 'gone');
      if (!alive.length && st.t > .5 && !st.over) { st.over = true; hint('Готово!', 1.2); setTimeout(() => endDuel(true), 1100); }
    } else if (st.phase === 'boss') {
      if (god.open > 0) { god.open -= dt; if (god.open <= 0) god.open = 0; }
      if (st.atk) tickAttack(dt);
      else if ((st.atkT -= dt) <= 0) beginAttack();
    }

    // стража
    for (const g of st.guards) {
      const s = g.s;
      if (g.state === 'dead') {
        g.dead += dt; s.root.rotation.x = -Math.min(Math.PI / 2, g.dead * 4); s.root.position.y = -Math.min(.15, g.dead * .5);
        if (g.dead > 2) { scene.remove(s.root); g.state = 'gone'; }
        continue;
      }
      if (g.state === 'gone') continue;
      if (g.hitT > 0) g.hitT -= dt;
      // цель: игрок или ворон Мирона
      let tx = P.x, tz = P.z;
      if (st.crowT > 0) { tx = P.x + Math.sin(st.t * 2) * 4; tz = P.z + Math.cos(st.t * 2) * 4; }
      const gx = OX() + g.x, dx = tx - gx, dz = tz - g.z, d = Math.hypot(dx, dz);
      let speed = 0;
      if (g.kb > 0) { g.kb -= dt; g.x += g.kx * dt * 4; g.z += g.kz * dt * 4; }
      else if (g.state === 'walk') {
        if (d > 1.55) { speed = 1.7; g.x += dx / d * speed * dt; g.z += dz / d * speed * dt; }
        g.cd -= dt;
        if (d < 2.0 && g.cd <= 0) { g.state = 'wind'; g.t = 0; }
      } else if (g.state === 'wind') {
        g.t += dt; g.blade.material.emissive.setRGB(.9 * (g.t / .7), .1, 0);
        s.wk = 0; s.arms[1].sh.rotation.x = -2.4 * Math.min(1, g.t / .7);
        if (g.t > .7) {
          g.state = 'strike'; g.t = 0;
          if (Math.hypot(P.x - (OX() + g.x), P.z - g.z) < 2.1 && st.crowT <= 0) damagePlayer(1);
        }
      } else if (g.state === 'strike') {
        g.t += dt; s.wk = 0; s.arms[1].sh.rotation.x = -2.4 + Math.min(1, g.t / .18) * 2.6; g.blade.material.emissive.setRGB(0, 0, 0);
        if (g.t > .5) { g.state = 'walk'; g.cd = 1.4 + Math.random() * 1.2; }
      }
      // не толпятся и не выходят из зала
      for (const o of st.guards) if (o !== g && o.state !== 'dead' && o.state !== 'gone') { const ox = g.x - o.x, oz = g.z - o.z, od = Math.hypot(ox, oz); if (od < .9 && od > .001) { g.x += ox / od * (.9 - od) * .5; g.z += oz / od * (.9 - od) * .5; } }
      if (st.mode === 'duel') { if (typeof inside === 'function' && !inside(g.x, g.z)) { g.x = g.px; g.z = g.pz; } g.px = g.x; g.pz = g.z; }
      else { g.x = Math.max(ARENA.x0, Math.min(ARENA.x1, g.x)); g.z = Math.max(ARENA.z0, Math.min(ARENA.z1, g.z)); }
      s.root.position.set(OX() + g.x, 0, g.z);
      s.root.rotation.y = Math.atan2(dx, dz);
      s.root.scale.setScalar(g.hitT > 0 ? 1.06 : 1);
      if (window.animHuman) window.animHuman(s, dt, P.x, P.z, false, (g.state === 'wind' || g.state === 'strike') ? 0 : speed);
    }
  }
  requestAnimationFrame(tick);

  // ---------- ввод ----------
  addEventListener('keydown', e => {
    if (!B.on || !st) return;
    if (e.code === 'KeyF' || e.code === 'KeyE') { act('hit'); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (e.code === 'Space') { act('dash'); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (e.code === 'KeyR') { act('ab'); e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  addEventListener('mousedown', e => { if (B.on && st && e.button === 0 && document.pointerLockElement) act('hit'); }, true);

  // ---------- дуэль: драки сюжета (тёмный тамбур, буян) вместо мини-игры со стрелками ----------
  function duel(tough, done, opt) {
    opt = opt || {};
    if (!ui) makeUI();
    const weak = !tough && heroId() === 'evsey', hp = tough ? 4 : weak ? 2 : 3;
    st = { mode: 'duel', phase: 'duel', t: 0, hp, maxHp: hp, boss: 0, bossMax: 1, guards: [], fx: [], atk: null, inv: 0, dashT: 0, hitCd: 0, ab: 0, abOn: 0, abKind: heroId(), slow: 0, crowT: 0, shake: 0, done };
    B.on = true; window.__battleOn = true; document.body.classList.add('inbattle');
    ui.d.classList.add('on'); ui.over.classList.remove('on'); ui.boss.classList.add('on');
    ui.boss.querySelector('.nm').textContent = opt.foe || 'Нападавший';
    ui.d.classList.toggle('dark', !opt.lit);
    // свободное место рядом: прямо, по сторонам, сзади (в купе прямо — часто стена)
    const f = fwd(); let sx = P.x + f.x * 2, sz = P.z + f.z * 2, okp = false;
    for (const d of [2.4, 1.9, 1.4]) { for (const a of [0, .5, -.5, 1, -1, 1.6, -1.6, Math.PI]) {
      const c = Math.cos(a), sn = Math.sin(a), x = P.x + (f.x * c - f.z * sn) * d, z = P.z + (f.x * sn + f.z * c) * d;
      if (typeof inside !== 'function' || inside(x, z)) { sx = x; sz = z; okp = true; break; } } if (okp) break; }
    P.yaw = Math.atan2(-(sx - P.x), -(sz - P.z));
    // в тёмном тамбуре — человек в чёрном и кепке, на свету — здоровенный буян
    const look = opt.lit ? { coat: '#5a4632', pants: '#3a3028', boots: true, hair: '#3a2a1c', hairStyle: 'messy', beard: 'full', beardC: '#3a2a1c', skin: '#d8a080', heavy: true }
      : { coat: '#1c1e26', pants: '#1a1a20', boots: true, hat: 'cap', hatC: '#14161c', hair: '#1a1410', skin: '#d8b090' };
    const g = spawnGuard(sx, sz, look);
    g.hp = tough ? 5 : 4; g.max = g.hp; g.px = g.x; g.pz = g.z; g.cd = 1.4;
    g.s.root.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.userData.acc) o.material = o.material.clone(); });
    drawHP(); ui.fill.style.width = '100%'; ui.wave.textContent = '';
    ui.ab.innerHTML = '<i>ЛКМ / F / ⚔</i> — удар · <i>Пробел / ⤴</i> — рывок · <i>R / ★</i> — ' + HERO_AB[st.abKind][0];
    hint('Уворачивайся рывком, когда клинок загорится красным, — и бей!', 3);
  }
  function endDuel(win) {
    const done = st.done;
    st.guards.forEach(g => scene.remove(g.s.root));
    ui.d.classList.remove('on', 'dark'); ui.boss.querySelector('.nm').textContent = 'Король-Благодетель';
    B.on = false; window.__battleOn = false; st = null; document.body.classList.remove('inbattle');
    if (done) done(win);
  }
  const qte = window.startFight;
  window.startFight = function (tough, done, opt) {
    // автотесты и игроки без 3D-людей — прежняя мини-игра
    if (navigator.webdriver && !/[?&]battle/.test(location.search) || !window.makeHuman || !qte) return qte && qte(tough, done, opt);
    duel(tough, done, opt);
  };
  B.duel = duel;
  B.start = start;
  B.god = () => { placeGod(); return god; }; B._st = () => st; B.L = L; B.guardLook = guardLook;   // для проверок
  // разработчику: ?battle — сразу в бой (после загрузки финала Shift+F4)
  if (/[?&]battle/.test(location.search)) addEventListener('load', () => setTimeout(() => { if (window.WORLD && WORLD.cur === 'noon') start('endTrue'); }, 4000));
})();
