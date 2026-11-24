// Предзагрузка следующей локации, пока на экране итог дела.
// Раньше вокзал и новое дело строились и собирали шейдеры в момент входа — игра замирала на секунды.
// Карточка итога дела статична, поэтому работу делаем под ней: строим вокзал и следующее дело (спрятанными),
// ждём модели героев и собираем шейдеры, пока лампы те же (их число постоянно — см. index.html).
// Сборка шейдеров заранее. Кадр рисуется не на экран, а в буфер постобработки (GameFX) — у шейдеров для него
// другая кодировка цвета, поэтому собирать нужно под тот же буфер, иначе собранное не пригодится.
window.compileScene = function () {
  const fx = window.GameFX, prev = renderer.getRenderTarget();
  try {
    if (fx && fx.ready && fx.composer) renderer.setRenderTarget(fx.composer.readBuffer);
    renderer.compile(scene, camera);
  } finally { renderer.setRenderTarget(prev); }
};
(function () {
  const NEXT = { train: ['station', 'boat'], boat: ['station', 'monast'], monast: ['station', 'polar'], polar: ['station', 'ball', 'fort'], ball: ['station', 'fort'], fort: ['station', 'noon'] };
  const done = new Set();
  let busy = false;

  function build(id) {
    const L = WORLD.LOC && WORLD.LOC[id];
    if (!L || !L.build) return null;
    if (!L.group) {
      // build() не меняет текущую локацию: только создаёт группу и людей; группу сразу прячем
      try { L.build(L); } catch (e) { console.warn('prewarm build', id, e); return null; }
      if (L.group && WORLD.cur !== id) L.group.visible = false;
    }
    return L;
  }
  // всё, что относится к локации id: её группа и люди
  function roots(id) {
    const L = WORLD.LOC[id], r = [];
    if (L && L.group) r.push(L.group);
    if (typeof NPCS !== 'undefined') NPCS.forEach(n => { if ((n.loc || 'train') === id && n.st) r.push(n.st.root); });
    return r;
  }
  function skinned(id) { let k = 0; roots(id).forEach(o => o.traverse(m => { if (m.isSkinnedMesh) k++; })); return k; }
  function compile(ids) {
    const flip = [], dark = [];
    const walk = o => {
      if (o.isLight) { if (o.visible) { o.visible = false; dark.push(o); } return; }
      if (!o.visible) { o.visible = true; flip.push(o); }
      o.children.forEach(walk);
    };
    ids.forEach(id => roots(id).forEach(walk));
    try { compileScene(); } catch (e) { console.warn('prewarm compile', e); }
    flip.forEach(o => { o.visible = false; });
    dark.forEach(o => { o.visible = true; });
  }
  async function warm(from) {
    if (busy || done.has(from)) return;
    const ids = (NEXT[from] || []).filter(id => !(id === 'ball' && !(S.f.env1 && S.f.env2 && S.f.env3)));
    if (!ids.length) return;
    busy = true; done.add(from);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    try {
      for (const id of ids) { build(id); await wait(50); }
      // реалистичные пассажиры этих локаций (обычно грузятся только при входе)
      if (window.Passengers3D && typeof NPCS !== 'undefined') NPCS.forEach(n => { if (ids.includes(n.loc) && n.st && !n.st.m3 && !n.st.m3loading && !n.model3d && !/^(b_|smotritel|gordey$|evsey$|margaret)/.test(n.id)) Passengers3D.attach(n.st); });
      // ждём, пока догрузятся 3D-модели героев на вокзале (число скинированных сеток перестанет расти)
      let last = -1;
      for (let k = 0; k < 40; k++) {
        await wait(500);
        const n = ids.reduce((a, id) => a + skinned(id), 0);
        if (n === last && n > 0) break;
        last = n;
      }
      if (document.getElementById('end').classList.contains('on')) compile(ids);
    } finally { busy = false; }
  }
  const endEl = document.getElementById('end');
  if (/[?&]noprewarm/.test(location.search)) { window.Prewarm = { warm, build, compile }; return; }
  new MutationObserver(() => {
    if (!endEl.classList.contains('on') || !window.WORLD) return;
    const from = WORLD.cur;
    if (from === 'station' || from === 'noon') return;
    setTimeout(() => warm(from), 300);
  }).observe(endEl, { attributes: true, attributeFilter: ['class'] });
  window.Prewarm = { warm, build, compile };
})();
