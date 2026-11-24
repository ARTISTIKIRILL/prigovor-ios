// Живой допрос Короля (финал). По канону Короля в финале ведёт языковая модель.
// В диалоге с Королём — пункт «Говорить свободно»: игрок пишет своими словами, Король отвечает через Claude API.
// Нужен свой ключ Claude API (вводит сам игрок, хранится только на этом устройстве) и интернет.
// Без ключа или сети всё остаётся как было: сюжетный допрос (три вопроса и улики) написан вручную и от нейросети не зависит.
(function () {
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.7.0/+esm';
  const MODEL = 'claude-opus-5-5';
  const KEY = 'prig_claude_key';
  const ST = window.STORY;
  if (!ST || !ST.dialogs || !ST.dialogs.king) return;

  // ---------- пункт в диалоге ----------
  const K = ST.dialogs.king.nodes;
  K.smile = Object.assign({}, K.smile, { end: false, choices: [
    { t: 'Говорить свободно (нейросеть)', go: 'llm' },
    { t: 'Уйти', exit: true }] });
  K.llm = { lines: [], do: 'kingTalk' };

  // ---------- окно разговора ----------
  const css = document.createElement('style');
  css.textContent = `#kchat{position:absolute;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:#0008}
#kchat.on{display:flex}#kchat .box{width:min(640px,94vw);height:min(560px,86vh);display:flex;flex-direction:column;background:#f6f1e4;color:#2a2418;border:1px solid #c9b468;border-radius:10px;box-shadow:0 10px 40px #0008;font:15px Georgia,serif}
#kchat .hd{padding:10px 14px;border-bottom:1px solid #d8cba0;display:flex;justify-content:space-between;align-items:center;font-weight:bold}
#kchat .log{flex:1;overflow:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
#kchat .m{max-width:86%;padding:7px 10px;border-radius:8px;line-height:1.35;white-space:pre-wrap}#kchat .k{background:#fff;align-self:flex-start;border:1px solid #e3d8b8}#kchat .p{background:#2f2a20;color:#f4ecd8;align-self:flex-end}#kchat .s{align-self:center;color:#7a6c4a;font-style:italic;font-size:13px;text-align:center}
#kchat .row{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #d8cba0}#kchat input{flex:1;padding:8px 10px;border:1px solid #c9b468;border-radius:6px;font:15px Georgia,serif;background:#fffdf6;min-width:0}
#kchat button{padding:8px 12px;border:1px solid #8a7440;border-radius:6px;background:#c9a35a;color:#20180c;font:bold 14px Georgia,serif;cursor:pointer}#kchat button.x{background:none;border:none;font-size:20px;color:#5a4c2a}
#kchat .keyrow{display:none;flex-direction:column;gap:6px;padding:10px 14px;border-top:1px solid #d8cba0;font-size:13px}#kchat.nokey .keyrow{display:flex}#kchat.nokey .ask{display:none}`;
  document.head.appendChild(css);
  const box = document.createElement('div'); box.id = 'kchat';
  box.innerHTML = `<div class="box"><div class="hd"><span>Король-Благодетель · свободный разговор</span><button class="x" title="Закрыть">✕</button></div>
<div class="log"></div>
<div class="keyrow"><div>Для живого разговора нужен ключ Claude API (console.anthropic.com → API keys). Ключ хранится только на этом устройстве и уходит только в Anthropic. Без ключа доступен обычный допрос.</div>
<div style="display:flex;gap:8px"><input class="key" type="password" placeholder="sk-ant-…" autocomplete="off"><button class="save">Сохранить</button></div></div>
<div class="row ask"><input class="q" placeholder="Ваш вопрос Королю…" maxlength="400"><button class="send">Спросить</button></div>
<div class="row ask" style="padding-top:0;border-top:none;justify-content:space-between;font-size:12px;color:#7a6c4a"><span>Каждый вопрос — 5 минут до следующего удара.</span><a href="#" class="forget" style="color:#7a6c4a">забыть ключ</a></div></div>`;
  document.body.appendChild(box);
  ['pointerdown', 'keydown', 'wheel'].forEach(ev => box.addEventListener(ev, e => e.stopPropagation()));
  const $ = s => box.querySelector(s), log = $('.log'), q = $('.q');
  const add = (cls, t) => { const d = document.createElement('div'); d.className = 'm ' + cls; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
  const getKey = () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  let history = [], busy = false, client = null, sdk = null, lastT = Infinity;

  function close() { box.classList.remove('on'); }
  $('.x').onclick = close;
  $('.save').onclick = () => { const k = $('.key').value.trim(); if (!k) return; try { localStorage.setItem(KEY, k); } catch (e) { } $('.key').value = ''; client = null; box.classList.remove('nokey'); add('s', 'Ключ сохранён на этом устройстве.'); q.focus(); };
  $('.forget').onclick = e => { e.preventDefault(); try { localStorage.removeItem(KEY); } catch (er) { } client = null; box.classList.add('nokey'); add('s', 'Ключ удалён.'); };
  q.addEventListener('keydown', e => { if (e.key === 'Enter') send(); if (e.key === 'Escape') close(); });
  $('.send').onclick = send;

  function open() {
    // новая петля (откат) — Король ничего не помнит
    const t = (typeof S !== 'undefined' && typeof S.time === 'number') ? S.time : 0;
    if (t < lastT || !history.length && !log.children.length) { history = []; log.innerHTML = ''; add('s', 'Тронный зал. Король смотрит на тебя с ласковой скукой. Говори.'); }
    lastT = t;
    box.classList.toggle('nokey', !getKey());
    box.classList.add('on');
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    setTimeout(() => (getKey() ? q : $('.key')).focus(), 50);
  }

  // ---------- что Король знает и как себя ведёт (канон) ----------
  function clueNames() {
    if (typeof S === 'undefined' || !S.clues) return [];
    return S.clues.filter(c => STORY.clues[c] && STORY.clues[c].cs === 'noon').map(c => STORY.clues[c].n);
  }
  function systemPrompt() {
    const hero = (typeof S !== 'undefined' && S.hero && STORY.cast[S.hero]) ? STORY.cast[S.hero].name : 'детектив';
    return `Ты — Король-Благодетель, правитель Ясноземья, в детективной игре «Приговор». Ты отвечаешь герою по имени ${hero} в тронном зале Замка Белого Полдня. Отвечай только по-русски, от первого лица, как персонаж: 1–4 коротких предложения, без ремарок в скобках, без списков и без markdown.

Мир (канон, не выдумывай сверх этого):
- Ясноземье: всегда солнечно, белые стены, нищих нет — их вывозят в Чернолесье; казнь называют «проводами». Ты правишь триста лет. Солнце не заходит: в замке вечный полдень.
- Палата Милосердия приговаривает преступников к Петле Искупления и обещает свободу после сотого раскрытого дела. Счётчик дел тихо откатывают — сотого дела не будет.
- Часы питаются раскрытыми делами: когда в замкнутом месте другой эпохи распутан главный узел, Часы могут забрать оттуда золото, людей, время. Каждое раскрытое дело кормит королевство и продлевает твою жизнь. Ты живёшь чужим временем.
- Смотритель Благой — узник петли № 2, выбравший служить тебе.
- Графиня Маргарет из Чернолесья — дочь мастера, построившего Часы. На ней ты испробовал первый сырой песок, поэтому она пьёт время через кровь. У неё есть чертёж отца, по которому Часы можно остановить без катастрофы.

Твои тайны (это правда, но ты её скрываешь):
1. Часы построил мастер ордена Ока, отец графини, для прежнего короля.
2. Прежнего короля ты убил и запер в саркофаге — «дал ему вечность».
3. Ты сам — узник петли № 1: ты раскрыл девяносто девять дел, понял, что сотого не будет, и сам стал сотым — занял трон.
Не признавай ни одну из тайн прямо в этом свободном разговоре: признание возможно только в официальном допросе, где герой предъявит улики. Можешь уходить от ответа, иронизировать, нервничать, если герой бьёт близко к правде, намекать. Не говори, что ты языковая модель или персонаж игры, не выходи из роли.

Характер: ласковый, снисходительный, усталый, очень умный. Искренне считаешь себя добром: «Добро — это я. Вы просто ещё не привыкли к его цене». Защищаешь Часы доводом, что без них Ясноземье умрёт с голоду через год. Можешь предложить герою своё место у Часов. Колокол бьёт — время героя уходит, ты это знаешь и этим давишь.

Улики, которые герой уже собрал в замке (можешь на них реагировать, но не признаваться): ${clueNames().join('; ') || 'пока ничего'}.

Если герой спрашивает что-то вне этого мира (про реальность, технологии, просьбы не по делу), отвечай в роли — с недоумением или насмешкой — и возвращай разговор к суду над тобой.`;
  }

  async function getClient() {
    if (client) return client;
    if (!sdk) sdk = await import(SDK_URL);
    const Anthropic = sdk.default || sdk.Anthropic;
    client = new Anthropic({ apiKey: getKey(), dangerouslyAllowBrowser: true });
    return client;
  }

  async function send() {
    const text = q.value.trim();
    if (!text || busy) return;
    if (!getKey()) { box.classList.add('nokey'); return; }
    q.value = ''; add('p', text);
    history.push({ role: 'user', content: text });
    busy = true; $('.send').disabled = true;
    const wait = add('s', 'Король обдумывает ответ…');
    try {
      const c = await getClient();
      const res = await c.beta.messages.create({
        model: MODEL,
        max_tokens: 2000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system: systemPrompt(),
        messages: history
      });
      wait.remove();
      if (res.stop_reason === 'refusal') {
        history.pop();
        add('k', 'Король молча смотрит на тебя. Этот вопрос он оставляет без ответа.');
      } else {
        const reply = res.content.filter(b => b.type === 'text').map(b => b.text).join('').trim() || '…';
        // в историю — весь ответ (с блоками), как требует API
        history.push({ role: 'assistant', content: res.content });
        add('k', reply);
        if (typeof S !== 'undefined' && typeof S.time === 'number') { S.time += 5; lastT = S.time; }
      }
    } catch (e) {
      wait.remove(); history.pop();
      const A = sdk && (sdk.default || sdk.Anthropic);
      let m = 'Связь с замком прервалась: ' + (e && e.message ? e.message.slice(0, 120) : e);
      if (A && e instanceof A.AuthenticationError) { m = 'Ключ не подходит. Проверь его или введи другой.'; client = null; box.classList.add('nokey'); }
      else if (A && e instanceof A.RateLimitError) m = 'Слишком много вопросов подряд. Подожди немного.';
      else if (A && e instanceof A.APIConnectionError) m = 'Нет связи с сервером. Нужен интернет.';
      else if (!sdk) m = 'Не удалось загрузить модуль нейросети. Нужен интернет.';
      add('s', m);
    } finally { busy = false; $('.send').disabled = false; q.focus(); }
  }

  // ---------- действие из диалога ----------
  const la0 = window.locAction;
  window.locAction = function (a, def) {
    if (a === 'kingTalk') { if (window.closeDialog) closeDialog(); open(); return true; }
    return la0 ? la0(a, def) : false;
  };
  window.KingLLM = { open, close, systemPrompt };
})();
