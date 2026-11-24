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

  // ---------- герои в том же стиле (рисуются вручную; поверх старых heroportraits.js / secret.js через window.NOIR) ----------
  const T = l => mix(INK, PAPER, l);
  const HC = { rowen: '#a9bcd4', miron: '#9cc472', agata: '#f2a070', tibo: '#c9a6f2', gordey: '#d8794a', evsey: '#86b8ec', margaret: '#e0485e' };
  const SH_PATH = 'M286 30 C294 110 302 190 304 248 C306 292 272 300 270 322 C268 346 298 352 294 374 C290 404 268 420 264 436 C268 452 280 462 292 470 C320 520 338 580 346 640 L520 640 L520 30Z';
  function frameNoir(uid, acc, behind, fig) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 640" data-noir="1"><defs>` +
      `<radialGradient id="bg${uid}" cx=".45" cy=".36" r=".75"><stop offset="0" stop-color="#f4ebd6"/><stop offset=".65" stop-color="${PAPER}"/><stop offset="1" stop-color="#c7b38d"/></radialGradient>` +
      `<pattern id="ht${uid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="1.7" height="6" fill="${INK}"/></pattern>` +
      `<pattern id="bu${uid}" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 4.5 H9 M4.5 0 V9" stroke="${INK}" stroke-width="1.1" opacity=".5"/></pattern>` +
      `<mask id="fm${uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="640"><g>${silhouette(fig.replace(/<defs>[\s\S]*?<\/defs>/g, ''))}</g></mask></defs>` +
      `<rect width="500" height="640" fill="url(#bg${uid})"/><circle cx="262" cy="262" r="196" fill="${acc}" opacity=".2"/><path d="M0 560 L500 520 L500 640 L0 640Z" fill="${INK}" opacity=".06"/>` +
      behind + fig +
      `<g mask="url(#fm${uid})"><path d="${SH_PATH}" fill="${INK}" opacity=".34"/><path d="${SH_PATH}" fill="url(#ht${uid})" opacity=".42"/></g></svg>`;
  }
  const bodyP = (w = 0) => `M${28 - w} 640 C${38 - w} 528 ${108 - w} 476 210 460 L290 460 C${392 + w} 476 ${462 + w} 528 ${472 + w} 640Z`;
  const glow = (x, y, acc, r = 9) => `<circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${acc}" opacity=".25"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .45}" fill="${acc}"/><ellipse cx="${x}" cy="${y}" rx="${r * .45}" ry="${r * .2}" fill="#fff8e8"/>`;
  const H = {};

  // АГАТА: чёрный покров, белый плат и воротник, фарфоровое лицо, тёмные круги у глаз, крест на лбу, трещинки-слёзы
  H.agata = (e, uid) => {
    const acc = HC.agata, SK = '#efe3cf', c = { sex: 'f', age: 32, eye: '#4a2a20', hair: '#1a1a1a', lips: '#6a2228' };
    const face = 'M188 202 C184 272 198 340 222 384 C234 402 244 410 250 410 C256 410 266 402 278 384 C302 340 316 272 312 202 C298 190 280 186 250 186 C220 186 202 190 188 202Z';
    let f = `<path d="M118 640 C108 420 118 214 168 146 C198 104 302 104 332 146 C382 214 392 420 382 640Z" fill="${INK}"/>`;
    f += `<path d="M166 214 C168 154 208 130 250 130 C292 130 332 154 334 214 L338 424 C320 446 180 446 162 424Z" fill="${T(.2)}"/>`;
    f += `<path d="${bodyP()}" fill="${INK}"/>`;
    f += `<path d="M150 474 C168 424 208 412 250 412 C292 412 332 424 350 474 C370 526 330 566 250 566 C170 566 130 526 150 474Z" fill="${PAPER}" stroke="${INK}" stroke-width="3.2"/>`;
    f += `<path d="M196 470 Q250 500 304 470" stroke="${INK}" stroke-width="2" fill="none" opacity=".35"/>`;
    f += `<path d="M250 500 L250 548 M234 516 L266 516" stroke="${acc}" stroke-width="6" stroke-linecap="round"/><path d="M250 500 L250 548 M234 516 L266 516" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`;
    f += `<path d="${face}" fill="${SK}" stroke="${INK}" stroke-width="3.2"/>`;
    f += `<path d="M178 200 C190 152 220 142 250 142 C280 142 310 152 322 200 C300 188 280 184 250 184 C220 184 200 188 178 200Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="M198 386 C222 424 278 424 302 386 L312 426 C282 446 218 446 188 426Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.6"/>`;
    f += `<path d="M250 202 L250 230 M240 212 L260 212" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
    f += `<ellipse cx="204" cy="280" rx="32" ry="17" fill="${INK}" opacity=".42"/><ellipse cx="296" cy="280" rx="32" ry="17" fill="${INK}" opacity=".42"/>`;
    f += eye(c, e, -1, SK, uid) + eye(c, e, 1, SK, uid) + brow(c, e, -1) + brow(c, e, 1) + nose();
    f += `<path d="M196 296 l-3 22 l5 14 l-2 16 M204 298 l2 18 M300 296 l4 20 l-5 16 l3 14" stroke="${INK}" stroke-width="1.4" fill="none" opacity=".55"/>`;
    f += mouth(c, e, '#6a2228');
    return frameNoir(uid, acc, '', f);
  };

  // ТИБО: цилиндр с картой за лентой, маска-арлекин во всё лицо, чёрный фрак, белый воротник, веер карт
  H.tibo = (e, uid) => {
    const acc = HC.tibo, c = { sex: 'm', age: 35, eye: '#5a3a20', hair: '#222222' };
    const face = 'M184 214 C180 284 196 346 222 388 C234 406 244 414 250 414 C256 414 266 406 278 388 C304 346 320 284 316 214 C300 192 280 186 250 186 C220 186 200 192 184 214Z';
    let f = `<path d="${bodyP()}" fill="${INK}"/>`;
    f += `<path d="M214 460 L250 556 L286 460Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.6"/><path d="M232 476 L250 496 L268 476 L262 506 L250 498 L238 506Z" fill="${acc}" stroke="${INK}" stroke-width="2"/>`;
    f += `<path d="M214 460 L250 556 L222 640 L140 640Z M286 460 L250 556 L278 640 L360 640Z" fill="${T(.14)}"/><path d="M214 460 L250 556 L286 460" stroke="${T(.4)}" stroke-width="3" fill="none"/>`;
    f += `<path d="M228 404 L272 404 L276 462 Q250 474 224 462Z" fill="${T(.62)}" stroke="${INK}" stroke-width="2.6"/>`;
    f += `<defs><clipPath id="tm${uid}"><path d="${face}"/></clipPath></defs><path d="${face}" fill="${T(.72)}"/><g clip-path="url(#tm${uid})">`;
    for (let r = -1; r < 9; r++) for (let q = -1; q < 6; q++) {
      const x = 170 + q * 36 + (r % 2 ? 18 : 0), y = 180 + r * 30;
      f += `<path d="M${x} ${y - 30} L${x + 18} ${y} L${x} ${y + 30} L${x - 18} ${y}Z" fill="${(q + r) % 2 ? INK : acc}" opacity="${(q + r) % 2 ? .78 : .55}" stroke="${INK}" stroke-width="1.2"/>`;
    }
    f += `</g><path d="${face}" fill="none" stroke="${INK}" stroke-width="4"/>`;
    f += `<ellipse cx="204" cy="278" rx="30" ry="15" fill="${T(.8)}" stroke="${INK}" stroke-width="2.6"/><ellipse cx="296" cy="278" rx="30" ry="15" fill="${T(.8)}" stroke="${INK}" stroke-width="2.6"/>`;
    f += eye(c, e, -1, T(.8), uid) + eye(c, e, 1, T(.8), uid);
    f += `<path d="M226 366 Q250 ${e === 'smile' || e === 'smug' ? 384 : 374} 274 366" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    f += `<path d="M170 176 C200 158 300 158 330 176 C344 186 330 198 250 198 C170 198 156 186 170 176Z" fill="${INK}"/>`;
    f += `<path d="M198 172 L196 50 C230 40 270 40 304 50 L302 172Z" fill="${T(.1)}" stroke="${INK}" stroke-width="3"/><path d="M197 146 L303 146 L302 168 L198 168Z" fill="${acc}" opacity=".85"/>`;
    f += `<path d="M212 60 L214 160" stroke="${T(.45)}" stroke-width="5" opacity=".6"/>`;
    f += `<g transform="rotate(14 284 112)"><rect x="268" y="78" width="40" height="56" rx="4" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/><text x="276" y="98" font-family="Georgia,serif" font-size="16" fill="${INK}">A</text><path d="M288 122 q-9 -9 0 -15 q9 6 0 15Z" fill="${INK}"/></g>`;
    f += `<g transform="translate(372 520)">` + [-22, -6, 10].map((a, i) => `<g transform="rotate(${a})"><rect x="-22" y="-62" width="44" height="64" rx="5" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/><path d="M0 -40 q-8 -8 0 -13 q8 5 0 13Z" fill="${i === 1 ? acc : INK}"/></g>`).join('') + `</g>`;
    return frameNoir(uid, acc, '', f);
  };

  // РОВЕН: глухой шлем с короной из шипов, светящиеся прорези, дыхательные отверстия, тяжёлые наплечники
  H.rowen = (e, uid) => {
    const acc = HC.rowen;
    let f = `<path d="${bodyP(20)}" fill="${T(.36)}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="M206 460 L294 460 L310 640 L190 640Z" fill="${T(.48)}" stroke="${INK}" stroke-width="2.6"/><path d="M250 470 L250 640" stroke="${INK}" stroke-width="2" opacity=".5"/>`;
    for (const sd of [-1, 1]) {
      const x = 250 + sd * 150;
      f += `<path d="M${250 + sd * 60} 470 C${250 + sd * 110} 440 ${x + sd * 40} 450 ${x + sd * 60} 520 C${x + sd * 30} 530 ${250 + sd * 80} 520 ${250 + sd * 60} 470Z" fill="${T(.55)}" stroke="${INK}" stroke-width="3"/>`;
      f += `<path d="M${250 + sd * 74} 486 C${250 + sd * 118} 466 ${x + sd * 28} 478 ${x + sd * 44} 512" stroke="${INK}" stroke-width="2" fill="none" opacity=".5"/>`;
      f += [0, 1, 2].map(i => `<circle cx="${250 + sd * (100 + i * 34)}" cy="${478 + i * 10}" r="4" fill="${INK}"/>`).join('');
    }
    f += `<path d="M210 400 L290 400 L298 470 L202 470Z" fill="${T(.3)}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="M170 168 L170 396 C204 428 296 428 330 396 L330 168 C300 140 200 140 170 168Z" fill="${T(.52)}" stroke="${INK}" stroke-width="4"/>`;
    f += `<path d="M172 168 L178 112 L192 150 L204 96 L218 146 L232 84 L250 140 L268 84 L282 146 L296 96 L308 150 L322 112 L328 168 C300 150 200 150 172 168Z" fill="${T(.22)}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="M170 188 C200 176 300 176 330 188 L330 206 C300 194 200 194 170 206Z" fill="${T(.75)}" stroke="${INK}" stroke-width="2.4"/>`;
    f += `<path d="M250 206 L250 410" stroke="${INK}" stroke-width="3" opacity=".6"/><path d="M190 214 L190 386" stroke="${PAPER}" stroke-width="5" opacity=".35"/>`;
    f += `<path d="M178 262 L322 262 L322 284 L178 284Z" fill="${INK}"/>` + glow(214, 273, acc) + glow(286, 273, acc);
    for (const sd of [-1, 1]) for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) f += `<circle cx="${250 + sd * (28 + q * 16)}" cy="${318 + r * 18}" r="3.6" fill="${INK}"/>`;
    return frameNoir(uid, acc, '', f);
  };

  // МИРОН: широкополая шляпа, лицо-мешковина со швами, пустой глаз и глаз-пуговица, длинная белая борода, ворон на плече
  H.miron = (e, uid) => {
    const acc = HC.miron;
    const face = 'M186 196 C182 270 196 336 222 380 C234 398 244 406 250 406 C256 406 266 398 278 380 C304 336 318 270 314 196 C300 182 280 178 250 178 C220 178 200 182 186 196Z';
    let f = `<path d="${bodyP(10)}" fill="${T(.34)}" stroke="${INK}" stroke-width="3"/>`;
    for (let x = 40; x < 470; x += 18) f += `<path d="M${x} 640 Q${x + (x - 250) * .05} 540 ${250 + (x - 250) * .7} 470" stroke="${INK}" stroke-width="3" opacity=".35" fill="none"/>`;
    f += `<path d="M212 462 L250 520 L288 462" fill="${T(.18)}"/>`;
    f += `<path d="M232 410 L268 410 L272 462 L228 462Z" fill="${T(.5)}" stroke="${INK}" stroke-width="2.4"/>`;
    f += `<defs><clipPath id="mf${uid}"><path d="${face}"/></clipPath></defs><path d="${face}" fill="${T(.62)}"/><path d="${face}" fill="url(#bu${uid})" clip-path="url(#mf${uid})"/>`;
    f += `<path d="${face}" fill="none" stroke="${INK}" stroke-width="3.4"/>`;
    f += `<path d="M192 214 Q250 196 310 218" stroke="${INK}" stroke-width="2.4" fill="none" stroke-dasharray="7 6"/>` + [200, 220, 240, 260, 280, 300].map(x => `<path d="M${x} ${206 + Math.abs(x - 250) * .06} l0 11" stroke="${INK}" stroke-width="2.2"/>`).join('');
    f += `<path d="M296 300 Q318 336 300 372" stroke="${INK}" stroke-width="2.2" fill="none" stroke-dasharray="6 5"/>`;
    f += `<circle cx="204" cy="276" r="21" fill="${INK}"/><circle cx="208" cy="272" r="4" fill="${acc}"/>`;
    f += `<circle cx="296" cy="276" r="22" fill="${T(.3)}" stroke="${INK}" stroke-width="3"/>` + [[-7, -7], [7, -7], [-7, 7], [7, 7]].map(([x, y]) => `<circle cx="${296 + x}" cy="${276 + y}" r="3" fill="${INK}"/>`).join('') + `<path d="M289 269 L303 283 M303 269 L289 283" stroke="${PAPER}" stroke-width="2"/>`;
    f += `<path d="M244 296 L258 296 L262 330 L240 330Z" fill="${T(.45)}" stroke="${INK}" stroke-width="2.2"/>`;
    f += `<path d="M206 346 C222 360 278 360 294 346 C300 420 276 520 250 568 C224 520 200 420 206 346Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`;
    f += [222, 236, 250, 264, 278].map(x => `<path d="M${x} 362 Q${x + (250 - x) * .3} 450 ${250 + (x - 250) * .2} 540" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".45"/>`).join('');
    f += `<path d="M226 362 Q250 ${e === 'smile' ? 376 : 370} 274 362" stroke="${INK}" stroke-width="3" fill="none"/>`;
    f += `<path d="M120 196 C150 166 350 166 380 196 C394 210 360 220 250 220 C140 220 106 210 120 196Z" fill="${T(.16)}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="M184 194 C182 140 200 96 250 92 C300 96 318 140 316 194 C290 182 210 182 184 194Z" fill="${T(.24)}" stroke="${INK}" stroke-width="3"/><path d="M186 176 C220 166 280 166 314 176 L316 194 C290 182 210 182 184 194Z" fill="${INK}"/>`;
    f += `<g transform="translate(372 452)"><path d="M-46 22 Q-12 -32 36 -22 Q64 -14 74 0 L94 4 L74 10 Q60 28 30 34 Q-4 44 -46 22Z" fill="${INK}"/><path d="M-42 24 Q-68 40 -88 34 Q-66 20 -46 16Z" fill="${INK}"/><path d="M-20 6 Q12 -10 44 -4" stroke="${T(.35)}" stroke-width="3" fill="none"/><circle cx="54" cy="-6" r="5" fill="${acc}"/><circle cx="55" cy="-7" r="1.8" fill="${INK}"/></g>`;
    return frameNoir(uid, acc, '', f);
  };

  // ГОРДЕЙ: кожаный капюшон палача, железная личина с янтарными прорезями и решёткой у рта, голые плечи в наколках, ремни
  H.gordey = (e, uid) => {
    const acc = HC.gordey, SK = '#c9a07e';
    let f = `<path d="${bodyP(26)}" fill="${SK}" stroke="${INK}" stroke-width="3"/>`;
    for (const sd of [-1, 1]) f += `<path d="M${250 + sd * 120} 500 q${sd * 20} 30 ${sd * 10} 70 M${250 + sd * 140} 520 l${sd * 22} 14 l${-sd * 6} 20 l${sd * 22} 14 M${250 + sd * 100} 560 c${sd * 20} 10 ${sd * 30} 30 ${sd * 24} 60" stroke="${INK}" stroke-width="3" fill="none" opacity=".75"/>`;
    f += `<path d="M150 470 L360 640 L330 640 L130 492Z M350 470 L140 640 L170 640 L370 492Z" fill="${T(.14)}"/><circle cx="250" cy="555" r="14" fill="${T(.55)}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="M130 480 C120 330 146 196 190 136 C214 100 286 100 310 136 C354 196 380 330 370 480 C330 500 170 500 130 480Z" fill="${T(.16)}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="M190 136 C214 100 286 100 310 136 C300 120 280 112 250 112 C220 112 200 120 190 136Z" fill="${T(.3)}"/>`;
    f += `<path d="M176 204 C174 284 188 350 218 396 C234 414 266 414 282 396 C312 350 326 284 324 204 C302 178 198 178 176 204Z" fill="${T(.56)}" stroke="${INK}" stroke-width="4"/>`;
    f += `<path d="M250 190 L250 300" stroke="${INK}" stroke-width="2.6" opacity=".6"/><path d="M196 214 L196 360" stroke="${PAPER}" stroke-width="5" opacity=".3"/>`;
    f += [[186, 214], [314, 214], [182, 300], [318, 300], [206, 380], [294, 380], [250, 196]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${INK}"/>`).join('');
    f += `<path d="M190 264 L238 274 L238 286 L190 280Z M310 264 L262 274 L262 286 L310 280Z" fill="${INK}"/>` + glow(216, 276, acc, 10) + glow(284, 276, acc, 10);
    f += `<rect x="218" y="334" width="64" height="40" rx="6" fill="${INK}"/>` + [230, 242, 254, 266].map(x => `<rect x="${x}" y="336" width="5" height="36" fill="${T(.5)}"/>`).join('');
    return frameNoir(uid, acc, '', f);
  };

  // ЕВСЕЙ: за головой — светящееся кольцо-циферблат, серебряные волосы до плеч, половина лица в синей краске, стальные наплечники, том
  H.evsey = (e, uid) => {
    const acc = HC.evsey, SK = '#e9d6bc', c = { sex: 'm', age: 62, eye: '#4a5a70', hair: '#d8d4cc', wrinkles: 1 };
    const face = faceShape({ sex: 'm', jaw: 0 });
    let behind = `<circle cx="250" cy="256" r="172" fill="none" stroke="${acc}" stroke-width="12" opacity=".85"/><circle cx="250" cy="256" r="150" fill="none" stroke="${acc}" stroke-width="2" opacity=".6"/>` +
      Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<line x1="${250 + Math.sin(a) * 156}" y1="${256 - Math.cos(a) * 156}" x2="${250 + Math.sin(a) * 166}" y2="${256 - Math.cos(a) * 166}" stroke="${acc}" stroke-width="5"/>`; }).join('');
    let f = `<path d="M150 470 C130 380 130 220 170 160 C200 116 300 116 330 160 C370 220 370 380 350 470Z" fill="${T(.82)}" stroke="${INK}" stroke-width="3"/>`;
    f += [176, 196, 304, 324].map(x => `<path d="M${x} 200 Q${x + (x < 250 ? -14 : 14)} 330 ${x + (x < 250 ? -6 : 6)} 460" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".4"/>`).join('');
    f += `<path d="${bodyP(10)}" fill="${T(.26)}" stroke="${INK}" stroke-width="3"/>`;
    for (const sd of [-1, 1]) f += `<path d="M${250 + sd * 70} 468 C${250 + sd * 130} 446 ${250 + sd * 200} 470 ${250 + sd * 214} 540 C${250 + sd * 170} 520 ${250 + sd * 110} 510 ${250 + sd * 70} 468Z" fill="${T(.6)}" stroke="${INK}" stroke-width="3"/><path d="M${250 + sd * 92} 482 C${250 + sd * 140} 470 ${250 + sd * 186} 488 ${250 + sd * 200} 524" stroke="${INK}" stroke-width="2" fill="none" opacity=".45"/>`;
    f += `<path d="M216 372 L284 372 L294 470 Q250 492 206 470Z" fill="${SK}" stroke="${INK}" stroke-width="3"/>`;
    f += `<defs><clipPath id="ef${uid}"><path d="${face}"/></clipPath></defs><path d="${face}" fill="${SK}"/><path d="M250 100 L250 450 L100 450 L100 100Z" fill="${acc}" opacity=".42" clip-path="url(#ef${uid})"/>`;
    f += `<path d="M212 214 Q250 206 288 214 M220 200 Q250 193 280 200" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".35" clip-path="url(#ef${uid})"/><path d="${face}" fill="none" stroke="${INK}" stroke-width="3.4"/>`;
    f += eye(c, e, -1, SK, uid) + eye(c, e, 1, SK, uid) + brow(c, e, -1) + brow(c, e, 1) + nose();
    f += recolor(beard({ beard: 'trim', beardC: '#dcd8d0' }), acc) + mouth(c, e, acc);
    f += `<path d="M160 230 C160 150 200 118 250 116 C300 118 340 150 340 230 C320 190 290 168 250 168 C210 168 180 190 160 230Z" fill="${T(.85)}" stroke="${INK}" stroke-width="3"/><path d="M200 140 Q250 126 300 140" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".4"/>`;
    f += `<g transform="rotate(-6 250 580)"><rect x="178" y="540" width="144" height="100" rx="6" fill="${T(.2)}" stroke="${INK}" stroke-width="3"/><rect x="186" y="546" width="128" height="10" fill="${PAPER}"/><rect x="242" y="560" width="16" height="40" rx="3" fill="${acc}" stroke="${INK}" stroke-width="2"/></g>`;
    return frameNoir(uid, acc, behind, f);
  };

  // МАРГАРЕТ: бледная графиня, чёрные волосы в высокой причёске, красные глаза, тёмные губы, высокий стоячий воротник
  H.margaret = (e, uid) => {
    const acc = HC.margaret, SK = '#f2e8e4', c = { sex: 'f', age: 40, eye: '#9a1a2a', hair: '#141010', hairStyle: 'updo', lips: '#7a1424', earrings: true };
    const face = faceShape({ sex: 'f' });
    let f = recolor(hairBack(c), acc);
    f += `<path d="M216 372 L284 372 L294 470 Q250 492 206 470Z" fill="${SK}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="${bodyP()}" fill="${T(.1)}" stroke="${INK}" stroke-width="3"/>`;
    f += `<path d="M150 470 C170 380 200 350 214 340 L224 430 C200 440 180 460 170 490Z M350 470 C330 380 300 350 286 340 L276 430 C300 440 320 460 330 490Z" fill="${INK}" stroke="${T(.3)}" stroke-width="2"/>`;
    f += `<path d="M226 462 L250 500 L274 462" fill="${acc}" stroke="${INK}" stroke-width="2.4"/><circle cx="250" cy="512" r="9" fill="${acc}" stroke="${INK}" stroke-width="2.4"/>`;
    for (const sd of [-1, 1]) { const ex = 250 + sd * 92; f += `<path d="M${ex} 248 C${ex + sd * 24} 240 ${ex + sd * 26} 304 ${ex + sd * 2} 314" fill="${SK}" stroke="${INK}" stroke-width="2.6"/><circle cx="${250 + sd * 96}" cy="318" r="6" fill="${acc}" stroke="${INK}" stroke-width="2"/>`; }
    f += `<path d="${face}" fill="${SK}" stroke="${INK}" stroke-width="3.4"/>`;
    f += `<ellipse cx="204" cy="282" rx="30" ry="15" fill="${INK}" opacity=".18"/><ellipse cx="296" cy="282" rx="30" ry="15" fill="${INK}" opacity=".18"/>`;
    // красные глаза: свой цвет радужки — акцент
    f += eye(c, e, -1, SK, uid) + eye(c, e, 1, SK, uid);
    f = f.replace(new RegExp(`(<circle cx="[\\d.]+" cy="[\\d.]+" r="7.2" fill=")[^"]+`, 'g'), `$1${acc}`);
    f += brow(c, e, -1) + brow(c, e, 1) + nose() + mouth(c, e, acc);
    f += recolor(hairFront(c), acc);
    return frameNoir(uid, acc, '', f);
  };
  window.NOIR = { has: id => !!(H[id] || C[id]), svg: (id, e) => H[id === 'margaretP' || id === 'margaretN' ? 'margaret' : id] ? H[id === 'margaretP' || id === 'margaretN' ? 'margaret' : id](e || 'neutral', 'h' + (uidN++)) : noirSVG(id, e) };
  ['margaretP', 'margaretN'].forEach(k => { H[k] = H.margaret; });

  const base = window.portraitSVG;
  window.portraitSVG = function (id, expr) { return C[id] ? noirSVG(id, expr) : base(id, expr); };
})();
