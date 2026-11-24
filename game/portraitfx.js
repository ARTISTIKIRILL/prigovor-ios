// Общая доводка всех портретов диалогов (собеседники, герои, тайные герои) — подключается после secret.js.
// 1) лёгкая фактура холста только по фигуре (фон не трогаем) — убирает «пластиковую» гладкость вектора;
// 2) плечи внизу мягко растворяются в фоне медальона.
(function () {
  const base = window.portraitSVG;
  if (!base) return;
  let n = 0;
  // все портреты — гравюры по 3D-моделям (por_eng.js, файлы por/<id>.webp); картинка ложится ровно в видимое окно медальона (см. CSS-зум #portrait)
  const ENGID = { margaretP: 'margaret', margaretN: 'margaret', smotritelN: 'smotritel' };
  const ENGSET = new Set(window.ENGPOR || []);
  // канон: каждая распознанная ложь оставляет на лице Агаты новую трещину, как кракелюр на иконе (S.f.agLies, до 10)
  function cracks() {
    const n = Math.min(10, (window.S && S.f && S.f.agLies) || 0); if (!n) return '';
    let r = 7, out = '';
    const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      const sd = i % 2 ? 1 : -1, x0 = 220 + sd * (16 + rnd() * 8), y0 = 214 + rnd() * 6;
      let x = x0, y = y0, d = `M${x.toFixed(1)} ${y.toFixed(1)}`; const len = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < len; k++) { x += (rnd() - .5) * 4 + sd * rnd() * 1.4; y += 4 + rnd() * 5; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
      const fresh = i === n - 1 ? ' class="fresh"' : '';
      out += `<path${fresh} d="${d}" stroke="#20130f" stroke-width="${(1 + rnd() * .7).toFixed(2)}" fill="none" stroke-linejoin="bevel" stroke-linecap="round" opacity=".85"/>`;
      if (rnd() < .5) { const bx = x0 + sd * 3, by = y0 + 9; out += `<path d="M${bx.toFixed(1)} ${by.toFixed(1)} l${(sd * (3 + rnd() * 3)).toFixed(1)} ${(4 + rnd() * 4).toFixed(1)}" stroke="#20130f" stroke-width=".9" fill="none" opacity=".75"/>`; }
    }
    return out;
  }
  const _buff = window.showBuff;
  if (_buff) window.showBuff = function (text, neg, hero) {
    const h = hero || (window.S && S.hero);
    if (h === 'agata' && !neg && window.S && S.f) {
      S.f.agLies = (S.f.agLies || 0) + 1;
      const pr = document.getElementById('portraitR');   // портрет Агаты в открытом диалоге обновляем сразу
      if (pr && typeof porRId !== 'undefined' && porRId === 'agata') pr.innerHTML = window.portraitSVG('agata', 'worried');
    }
    return _buff.apply(this, arguments);
  };
  window.portraitSVG = function (id, expr) {
    const ei = ENGID[id] || id;
    if (ENGSET.has(ei) && !/[?&]oldpor/.test(location.search)) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 640" data-eng="1" data-x="${expr || 'neutral'}"><image href="por/${ei}.webp" x="96" y="84" width="308" height="374" preserveAspectRatio="xMidYMid slice"/>${ei === 'agata' ? cracks() : ''}</svg>`;
    const s = window.NOIR && NOIR.has(id) ? NOIR.svg(id, expr) : base(id, expr);   // нуар-стиль — для всех, включая героев
    if (!s || s.indexOf('</svg>') < 0) return s;
    const u = 'pfx' + (n++);
    const defs = `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset=".74" stop-color="#fff"/><stop offset=".98" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<mask id="${u}m" maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="640"><rect width="500" height="640" fill="url(#${u}g)"/></mask>` +
      `<filter id="${u}f" x="0" y="0" width="500" height="640" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="7" result="t"/>` +
      `<feColorMatrix in="t" type="matrix" values=".14 0 0 0 .88 .14 0 0 0 .87 .14 0 0 0 .85 0 0 0 0 1" result="g"/>` +
      `<feComposite in="SourceGraphic" in2="g" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/></filter></defs>`;
    // героев и тайных героев (рисованы отдельно, в цвете) приводим к нуар-гамме собеседников: бумажный фон, сепия, приглушённый цвет
    if (s.indexOf('data-noir') < 0) {
      const sep = `<filter id="${u}s" x="0" y="0" width="500" height="640" filterUnits="userSpaceOnUse"><feColorMatrix type="matrix" values=".53 .36 .07 0 .02 .17 .68 .06 0 .01 .14 .28 .4 0 0 0 0 0 1 0"/>` +
        `<feComponentTransfer><feFuncR type="linear" slope="1.12" intercept="-.04"/><feFuncG type="linear" slope="1.12" intercept="-.05"/><feFuncB type="linear" slope="1.1" intercept="-.05"/></feComponentTransfer></filter>` +
        `<radialGradient id="${u}p" cx=".45" cy=".36" r=".75"><stop offset="0" stop-color="#f4ebd6"/><stop offset=".65" stop-color="#ede2c9"/><stop offset="1" stop-color="#c7b38d"/></radialGradient>`;
      return s.replace(/(<svg[^>]*>)/, `$1${defs.replace('</defs>', sep + '</defs>')}<rect width="500" height="640" fill="url(#${u}p)"/><g mask="url(#${u}m)"><g filter="url(#${u}f)"><g filter="url(#${u}s)">`).replace(/<\/svg>\s*$/, '</g></g></g></svg>');
    }
    return s.replace(/(<svg[^>]*>)/, `$1${defs}<g mask="url(#${u}m)"><g filter="url(#${u}f)">`).replace(/<\/svg>\s*$/, '</g></g></svg>');
  };
})();
