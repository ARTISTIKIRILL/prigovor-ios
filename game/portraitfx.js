// Общая доводка всех портретов диалогов (собеседники, герои, тайные герои) — подключается после secret.js.
// 1) лёгкая фактура холста только по фигуре (фон не трогаем) — убирает «пластиковую» гладкость вектора;
// 2) плечи внизу мягко растворяются в фоне медальона.
(function () {
  const base = window.portraitSVG;
  if (!base) return;
  let n = 0;
  window.portraitSVG = function (id, expr) {
    const s = base(id, expr);
    if (!s || s.indexOf('</svg>') < 0) return s;
    const u = 'pfx' + (n++);
    const defs = `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset=".74" stop-color="#fff"/><stop offset=".98" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<mask id="${u}m" maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="640"><rect width="500" height="640" fill="url(#${u}g)"/></mask>` +
      `<filter id="${u}f" x="0" y="0" width="500" height="640" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="7" result="t"/>` +
      `<feColorMatrix in="t" type="matrix" values=".14 0 0 0 .88 .14 0 0 0 .87 .14 0 0 0 .85 0 0 0 0 1" result="g"/>` +
      `<feComposite in="SourceGraphic" in2="g" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/></filter></defs>`;
    return s.replace(/(<svg[^>]*>)/, `$1${defs}<g mask="url(#${u}m)"><g filter="url(#${u}f)">`).replace(/<\/svg>\s*$/, '</g></g></svg>');
  };
})();
