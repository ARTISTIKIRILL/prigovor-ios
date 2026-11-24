// Портреты собеседников в стиле детективного комикса: тушь и сепия, жёсткий свет слева, тень со штриховкой справа,
// у каждого персонажа один цветной акцент (околыш, губы, галстук, пальто). Лица нарисованы заново —
// реалистичные пропорции и прищур вместо «мультяшных» глаз. Причёски, головные уборы и одежда берутся
// из генератора portraits.js (window.__POR) и перекрашиваются в палитру. Старые портреты: ?oldpor.
(function () {
  const R = window.__POR; if (!R || /[?&]oldpor/.test(location.search)) return;
  const { C, sh, faceShape, hairBack, hairFront, beard, hat, body } = R;
  const INK = '#1d1713', PAPER = '#ede2c9';
  const rgb = h => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  function hsl(h) { const [r, g, b] = rgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let hu = 0; if (d) hu = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: (hu * 60 + 360) % 360, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l }; }
  const lum = h => { const [r, g, b] = rgb(h); return (r * .3 + g * .59 + b * .11) / 255; };
  // акцент: первый насыщенный цвет из губ / второго цвета одежды / головного убора / одежды / волос
  function accentOf(c) {
    if (c.hat === 'police') return '#9a2a2a';                                   // красный околыш
    const ok = v => { if (!v) return false; const q = hsl(v); return q.s > .38 && q.l > .14 && q.l < .8; };
    if (ok(c.cloth) && hsl(c.cloth).s > .45) return c.cloth;                    // яркая одежда — сама акцент
    for (const k of ['lips', 'hatC', 'cloth2', 'cloth', 'hair']) if (ok(c[k])) return c[k];
    return null;
  }
  // тон: насыщенное близкое к акценту — остаётся цветным, остальное — ступени между тушью и бумагой
  function tone(h, acc) {
    const q = hsl(h), L = lum(h);
    if (acc) { const a = hsl(acc); const dh = Math.min(Math.abs(q.h - a.h), 360 - Math.abs(q.h - a.h)); if (q.s > .3 && dh < 24) return mix(INK, mix(acc, '#c0392b', .0), Math.min(1, .25 + L * 1.25)); }
    const lv = [.06, .26, .5, .74, .93]; let best = lv[0]; for (const v of lv) if (Math.abs(v - L) < Math.abs(best - L)) best = v;
    return mix(INK, PAPER, best);
  }
  const recolor = (s, acc) => s.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b/g, (m, a, al) => tone('#' + a, acc) + (al || ''));
  const silhouette = s => s.replace(/fill="(?!none)[^"]*"/g, 'fill="#fff"').replace(/stroke="(?!none)[^"]*"/g, 'stroke="#fff"');

  function eye(c, e, sd, sk, uid) {
    const cx = 250 + sd * 46, cy = 277, fem = c.sex === 'f', old = c.age > 58;
    let w = fem ? 23 : 22, h = fem ? 8.5 : 7.5;
    if (e === 'surprised') h *= 1.5; if (e === 'sleepy') h *= .45; if (e === 'smug') h *= .7; if (e === 'smile') h *= .55; if (e === 'angry') h *= .8;
    const tilt = e === 'angry' ? 4 : (e === 'worried' || e === 'sad') ? -3 : 0;
    const xi = cx - sd * w, xo = cx + sd * w;
    const top = `M${xi} ${cy + tilt} C${cx - sd * w * .4} ${cy - h * 1.3 + tilt} ${cx + sd * w * .5} ${cy - h * 1.25} ${xo} ${cy - 1}`;
    const bot = `C${cx + sd * w * .4} ${cy + h * (e === 'smile' ? .2 : .9)} ${cx - sd * w * .5} ${cy + h * .8} ${xi} ${cy + tilt}Z`;
    const id = `ne${uid}${sd > 0 ? 'r' : 'l'}`, ir = 7.2, ix = cx - sd * 1.5, iy = cy + (e === 'sleepy' ? 2 : 0.5);
    const irisC = mix(INK, tone(c.eye || '#555555', null), .35);
    let s = `<defs><clipPath id="${id}"><path d="${top} ${bot}"/></clipPath></defs>`;
    s += `<path d="${top} ${bot}" fill="${mix(PAPER, sk, .25)}"/><g clip-path="url(#${id})">` +
      `<circle cx="${ix}" cy="${iy}" r="${ir}" fill="${irisC}"/><circle cx="${ix}" cy="${iy}" r="${ir * .45}" fill="${INK}"/>` +
      `<path d="M${xi - 4} ${cy - h * 2} L${xo + 4} ${cy - h * 2} L${xo + 4} ${cy - h * .25} Q${cx} ${cy + h * .2} ${xi - 4} ${cy - h * .25}Z" fill="${INK}" opacity=".3"/>` +
      `<circle cx="${ix - 2.4}" cy="${iy - 2.6}" r="1.8" fill="#fff"/></g>`;
    s += `<path d="${top}" fill="none" stroke="${INK}" stroke-width="${fem ? 4.6 : 4}" stroke-linecap="round"/>`;
    s += `<path d="M${xo} ${cy - 1} l${sd * (fem ? 7 : 4)} ${fem ? -4 : -1.5}" stroke="${INK}" stroke-width="${fem ? 3 : 2.4}" stroke-linecap="round"/>`;
    s += `<path d="M${cx - sd * w * .6} ${cy - h - 7} Q${cx + sd * 2} ${cy - h - 11} ${cx + sd * w * .9} ${cy - h - 4}" stroke="${INK}" stroke-width="1.8" fill="none" opacity=".5"/>`;
    s += `<path d="M${xo - sd * 3} ${cy + 2} C${cx + sd * w * .3} ${cy + h + 1} ${cx - sd * w * .4} ${cy + h + 1} ${xi + sd * 4} ${cy + h * .4 + tilt}" stroke="${INK}" stroke-width="1.4" fill="none" opacity=".4"/>`;
    if (old) s += `<path d="M${xo + sd * 3} ${cy + 3} l${sd * 9} 2 M${xo + sd * 2} ${cy + 7} l${sd * 8} 6 M${cx - sd * 10} ${cy + h + 8} q${sd * 12} 5 ${sd * 24} 0" stroke="${INK}" stroke-width="1.4" fill="none" opacity=".45"/>`;
    if (e === 'smile') s += `<path d="M${xi + sd * 2} ${cy + 5} Q${cx} ${cy + 1} ${xo - sd * 2} ${cy + 4}" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".5"/>`;
    return s;
  }
  function brow(c, e, sd) {
    const light = lum(c.hair) > .62, col = light ? mix(INK, PAPER, .45) : INK;
    const cx = 250 + sd * 46, t = c.sex === 'm' ? 9 : 5.5;
    let yi = 252, ym = 244, yo = 250;
    if (e === 'angry') { yi = 262; ym = 251; yo = 246; }
    if (e === 'worried' || e === 'sad') { yi = 241; ym = 243; yo = 255; }
    if (e === 'surprised') { yi = 237; ym = 229; yo = 238; }
    if (e === 'smug' && sd > 0) { yi = 246; ym = 236; yo = 241; }
    const xi = cx - sd * 22, xm = cx + sd * 4, xo = cx + sd * 30;
    return `<path d="M${xi} ${yi - t * .55} Q${xm} ${ym - t * .65} ${xo} ${yo - 1} L${xo - sd * 2} ${yo + 1.5} Q${xm} ${ym + t * .3} ${xi} ${yi + t * .5}Z" fill="${col}"/>`;
  }
  function nose() {
    return `<path d="M247 262 C245 288 241 304 239 316" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".3"/>` +
      `<path d="M238 324 q6 7 14 3" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M257 329 q7 -1 9 -7" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      `<path d="M243 331 Q250 336 257 331" stroke="${INK}" stroke-width="1.4" fill="none" opacity=".45"/>`;
  }
  function mouth(c, e, acc) {
    const y = 367, fem = c.sex === 'f' && c.lips, lipC = fem ? (acc && hsl(acc).h === hsl(c.lips).h ? mix(INK, acc, .85) : mix(INK, PAPER, .32)) : null;
    const under = `<path d="M240 ${y + 12} Q250 ${y + 16} 260 ${y + 12}" stroke="${INK}" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>`;
    const lips = fem ? `<path d="M234 ${y} Q242 ${y - 6} 250 ${y - 3} Q258 ${y - 6} 266 ${y} Q250 ${y + 2} 234 ${y}Z" fill="${lipC}"/><path d="M237 ${y + 1} Q250 ${y + 11} 263 ${y + 1} Q250 ${y + 4} 237 ${y + 1}Z" fill="${mix(lipC, PAPER, .25)}"/>` : '';
    switch (e) {
      case 'smile': return `<path d="M228 ${y - 5} Q250 ${y + 16} 272 ${y - 5}" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M226 ${y - 9} l-3 6 M274 ${y - 9} l3 6" stroke="${INK}" stroke-width="2" opacity=".55"/>` + under;
      case 'surprised': return `<ellipse cx="250" cy="${y + 2}" rx="8" ry="11" fill="${INK}"/>`;
      case 'angry': return `<path d="M232 ${y + 4} Q250 ${y - 4} 268 ${y + 4}" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M228 ${y - 10} q-4 8 2 16 M272 ${y - 10} q4 8 -2 16" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".4"/>` + under;
      case 'worried': return lips + `<path d="M234 ${y + 2} q8 -5 16 0 q8 5 16 0" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>` + under;
      case 'sad': return lips + `<path d="M234 ${y + 5} Q250 ${y - 3} 266 ${y + 5}" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>` + under;
      case 'smug': return lips + `<path d="M234 ${y + 2} Q252 ${y + 6} 270 ${y - 6}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>` + under;
      case 'sleepy': return `<ellipse cx="251" cy="${y + 1}" rx="6" ry="4" fill="${INK}"/>`;
      default: return lips + `<path d="M233 ${y} Q250 ${y + 3} 267 ${y - 1}" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>` + under;
    }
  }

  let uidN = 0;
  function noirSVG(id, expr) {
    const c = C[id]; if (!c) return '';
    const e = expr || 'neutral', uid = 'n' + (uidN++), acc = accentOf(c);
    const sL = lum(c.skin), SK = mix('#9c7356', '#f0dcc0', Math.min(1, Math.max(0, (sL - .45) / .4))), SKd = mix(SK, INK, .38);
    const face = faceShape(c), wide = c.heavy ? 28 : 0;
    const bodyPath = `M${28 - wide} 640 C${38 - wide} 528 ${108 - wide} 476 210 460 L290 460 C${392 + wide} 476 ${462 + wide} 528 ${472 + wide} 640Z`;
    const neck = 'M216 372 L284 372 L294 470 Q250 492 206 470Z';
    // одежда, волосы, уборы, борода — формы старого генератора, цвета в палитру
    const clT = tone(c.cloth, acc);
    const parts = {
      back: recolor(hairBack(c), acc),
      body: recolor(body(c, uid), acc),
      beard: recolor(beard(c), acc),
      front: recolor(hairFront(c), acc),
      hat: recolor(hat(c), acc)
    };
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 640" data-noir="1"><defs>` +
      `<radialGradient id="bg${uid}" cx=".45" cy=".36" r=".75"><stop offset="0" stop-color="#f4ebd6"/><stop offset=".65" stop-color="${PAPER}"/><stop offset="1" stop-color="#c7b38d"/></radialGradient>` +
      `<linearGradient id="cl${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${mix(clT, PAPER, .12)}"/><stop offset="1" stop-color="${clT}"/></linearGradient>` +
      `<pattern id="ht${uid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="1.7" height="6" fill="${INK}"/></pattern>` +
      `<pattern id="st${uid}" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".9" fill="${INK}"/><circle cx="4" cy="3.8" r=".8" fill="${INK}"/></pattern>` +
      `<clipPath id="fc${uid}"><path d="${face}"/></clipPath>` +
      `<mask id="fm${uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="640"><g fill="#fff">` + silhouette(parts.back) + `<path d="${neck}"/><path d="${bodyPath}"/><path d="${face}"/>` +
      `<ellipse cx="158" cy="282" rx="16" ry="32"/><ellipse cx="342" cy="282" rx="16" ry="32"/>` + silhouette(parts.beard) + silhouette(parts.front) + silhouette(parts.hat) + `</g></mask></defs>`;
    // фон: бумага, за головой — пятно цвета акцента, как на афише
    s += `<rect width="500" height="640" fill="url(#bg${uid})"/>`;
    if (acc) s += `<circle cx="262" cy="262" r="196" fill="${acc}" opacity=".2"/>`;
    s += `<path d="M0 560 L500 520 L500 640 L0 640Z" fill="${INK}" opacity=".06"/>`;
    s += parts.back;
    s += `<path d="${neck}" fill="${SK}" stroke="${INK}" stroke-width="3"/>`;
    s += `<path d="M216 372 Q250 452 288 380 L292 432 Q250 480 210 432Z" fill="${INK}" opacity=".5"/>`;          // тень от подбородка
    s += parts.body + `<path d="${bodyPath}" fill="none" stroke="${INK}" stroke-width="3.2"/>`;
    s += `<path d="M206 464 Q250 496 294 464 L298 478 Q250 514 202 478Z" fill="${INK}" opacity=".3"/>`;
    for (const sd of [-1, 1]) { const ex = 250 + sd * 92;
      s += `<path d="M${ex} 248 C${ex + sd * 24} 240 ${ex + sd * 26} 304 ${ex + sd * 2} 314" fill="${SK}" stroke="${INK}" stroke-width="2.6"/><path d="M${ex + sd * 5} 262 C${ex + sd * 15} 264 ${ex + sd * 14} 292 ${ex + sd * 5} 298" stroke="${INK}" stroke-width="2" fill="none" opacity=".6"/>`; }
    if (c.earrings) s += `<circle cx="154" cy="316" r="6" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><circle cx="346" cy="316" r="6" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="${face}" fill="${SK}"/>`;
    s += `<g clip-path="url(#fc${uid})">`;
    if (c.stubble) s += `<path d="M170 318 Q186 398 222 418 Q250 434 278 418 Q314 398 330 318 Q304 376 250 380 Q196 376 170 318Z" fill="url(#st${uid})" opacity=".5"/>`;
    s += `<path d="M150 150 L350 150 L350 ${c.hat ? 232 : 206} Q250 ${c.hat ? 214 : 190} 150 ${c.hat ? 232 : 206}Z" fill="${INK}" opacity=".22"/>`;   // тень от волос/полей
    s += `<path d="M182 316 Q190 342 208 356" stroke="${INK}" stroke-width="2" fill="none" opacity=".28"/>`;                                       // скула на свету
    if (c.wrinkles) s += `<path d="M212 214 Q250 206 288 214 M220 200 Q250 193 280 200" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".35"/>` +
      `<path d="M230 334 Q216 352 226 378 M270 334 Q284 352 274 378" stroke="${INK}" stroke-width="2" fill="none" opacity="${c.wrinkles > 1 ? .55 : .35}"/>`;
    s += `</g>`;
    s += `<path d="${face}" fill="none" stroke="${INK}" stroke-width="3.4"/>`;
    if (c.freckles) s += [[192, 308], [204, 314], [214, 306], [290, 306], [300, 314], [310, 308]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${INK}" opacity=".5"/>`).join('');
    if (c.scar) s += `<path d="M302 230 L324 300 M306 248 l10 -4 M312 264 l10 -4 M318 282 l10 -4" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    s += eye(c, e, -1, SK, uid) + eye(c, e, 1, SK, uid) + brow(c, e, -1) + brow(c, e, 1) + nose();
    if (c.stitches) s += `<path d="M190 210 Q250 190 312 214" stroke="${INK}" stroke-width="2.4" fill="none" stroke-dasharray="7 6"/>`;
    if (c.piercing) s += `<circle cx="320" cy="234" r="3.5" fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/>`;
    s += parts.beard + mouth(c, e, acc);
    const gl = mix(INK, PAPER, .12);
    if (c.roundGlasses) s += `<circle cx="204" cy="277" r="24" fill="#ffffff22" stroke="${gl}" stroke-width="3"/><circle cx="296" cy="277" r="24" fill="#ffffff22" stroke="${gl}" stroke-width="3"/><path d="M228 274 Q250 267 272 274 M180 272 L160 266 M320 272 L340 266" stroke="${gl}" stroke-width="3" fill="none"/><path d="M190 266 l10 -6" stroke="#fff" stroke-width="2.4" opacity=".7"/>`;
    if (c.glasses && c.chain) s += `<path d="M158 266 Q138 360 168 470 M342 266 Q362 360 332 470" stroke="${gl}" stroke-width="1.6" fill="none" opacity=".7"/>`;
    if (c.glasses) s += `<rect x="178" y="259" width="54" height="36" rx="9" fill="#ffffff22" stroke="${gl}" stroke-width="3.4"/><rect x="268" y="259" width="54" height="36" rx="9" fill="#ffffff22" stroke="${gl}" stroke-width="3.4"/><path d="M232 275 Q250 267 268 275 M178 270 L158 264 M322 270 L342 264" stroke="${gl}" stroke-width="3.4" fill="none"/><path d="M188 268 l12 -5" stroke="#fff" stroke-width="2.4" opacity=".7"/>`;
    s += parts.front + parts.hat;
    if (c.earphones) s += `<path d="M156 300 Q150 380 200 470 M344 300 Q352 380 300 470" stroke="${PAPER}" stroke-width="3" fill="none"/><circle cx="156" cy="296" r="8" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><circle cx="344" cy="296" r="8" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`;
    // жёсткий свет слева: тень на правой половине фигуры — заливка тушью и штриховка, граница идёт по форме лица
    const SH = 'M286 30 C294 110 302 190 304 248 C306 292 272 300 270 322 C268 346 298 352 294 374 C290 404 268 420 264 436 C268 452 280 462 292 470 C320 520 338 580 346 640 L520 640 L520 30Z';
    s += `<g mask="url(#fm${uid})"><path d="${SH}" fill="${INK}" opacity=".34"/><path d="${SH}" fill="url(#ht${uid})" opacity=".42"/>` +
      `<path d="M120 120 C140 260 150 360 214 440 L180 640 L0 640 L0 120Z" fill="#fff8e6" opacity=".1"/></g>`;    // и чуть света на освещённой стороне
    return s + `</svg>`;
  }
  const base = window.portraitSVG;
  window.portraitSVG = function (id, expr) { return C[id] ? noirSVG(id, expr) : base(id, expr); };
})();
