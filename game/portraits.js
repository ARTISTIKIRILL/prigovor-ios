// Портреты для диалогов (SVG, рисуются кодом). portraitSVG(id, expr) → строка <svg>.
// expr: neutral | smile | worried | angry | surprised | smug | sad | sleepy
(function () {
  const C = {
    smotritel:  { sex: 'm', age: 68, skin: '#f1d0b8', hair: '#ece8e2', hairStyle: 'side', beard: 'trim', beardC: '#efebe5', eye: '#5d7488', collar: 'whitecoat', cloth: '#f4f1ea', cloth2: '#d9b46a', roundGlasses: true, wrinkles: 1 },
    rowen:      { sex: 'm', age: 50, skin: '#deb08f', hair: '#9b978f', hairStyle: 'buzz', eye: '#6c7a88', collar: 'guard', cloth: '#1f2226', cloth2: '#3a3f46', stubble: '#7a766e', scar: true, jaw: 1 },
    miron:      { sex: 'm', age: 40, skin: '#cfb68c', hair: '#3e3428', hairStyle: 'messy', eye: '#2c2a28', hat: 'cap', hatC: '#3a3a34', collar: 'vatnik', cloth: '#4b4b3f', stitches: true, buttonEye: true, crow: true },
    agata:      { sex: 'f', age: 32, skin: '#f2d0b9', hair: '#6b4a30', hairStyle: 'updo', eye: '#4f8070', hat: 'nurse', hatC: '#ffffff', collar: 'nurse', cloth: '#f3f3ef', cloth2: '#d8e0e6', lips: '#c0646a' },
    tibo:       { sex: 'm', age: 35, skin: '#ecc3a2', hair: '#24180f', hairStyle: 'slick', beard: 'moust', beardC: '#24180f', eye: '#6a4a26', collar: 'flashy', cloth: '#5b1e2b', cloth2: '#ece6dc', card: true },
    remez:      { sex: 'm', age: 46, skin: '#e1ab88', hair: '#4a3a2c', hairStyle: 'short', beard: 'moust', beardC: '#4a3a2c', eye: '#4a3a28', hat: 'police', hatC: '#2a3448', collar: 'police', cloth: '#4a5a6e', cloth2: '#c9a35a', stubble: '#5a4a3c', radio: true, heavy: true, jaw: 1 },
    velyaminov: { sex: 'm', age: 64, skin: '#f0cdb4', hair: '#dcd8d0', hairStyle: 'slick', beard: 'trim', beardC: '#dcd8d0', eye: '#4c6070', collar: 'suit3', cloth: '#1e2a44', cloth2: '#7a2030', wrinkles: 1 },
    golts:      { sex: 'm', age: 71, skin: '#edc8aa', hair: '#d4d0c8', hairStyle: 'bald', eye: '#5a5a48', collar: 'vest', cloth: '#7a6a4a', cloth2: '#e8e4d8', glasses: true, chain: true, wrinkles: 2 },
    stupina:    { sex: 'f', age: 52, skin: '#eebd9c', hair: '#8c4a28', hairStyle: 'curly', eye: '#5a4a38', collar: 'uniformF', cloth: '#2a3a6a', cloth2: '#c9a35a', lips: '#b84a4a', badge: true, wrinkles: 1 },
    zoya:       { sex: 'f', age: 22, skin: '#f3cfb6', hair: '#2a1a14', hairStyle: 'bob', eye: '#6a4228', hat: 'kosynka', hatC: '#ddd4c2', collar: 'apron', cloth: '#e8e2d4', cloth2: '#5a6a8a', piercing: true, blush: true, lips: '#c86a6a' },
    surkov:     { sex: 'm', age: 59, skin: '#d8a27a', hair: '#8a8478', hairStyle: 'short', eye: '#5a5a48', hat: 'cap', hatC: '#3a3a3a', collar: 'vatnik', cloth: '#3e4a3a', stubble: '#8a8478', wrinkles: 2, jaw: 1 },
    dan:        { sex: 'm', age: 19, skin: '#f0c8a8', hair: '#3a2a20', hairStyle: 'messy', eye: '#4c6a3a', hat: 'hood', hatC: '#3a4a5a', collar: 'hoodie', cloth: '#3a4a5a', earphones: true },
    efim:       { sex: 'm', age: 47, skin: '#dca07c', hair: '#6a5a44', hairStyle: 'messy', eye: '#4a4a38', hat: 'cap', hatC: '#3a3020', collar: 'vatnik', cloth: '#6a5a40', stubble: '#6a5a44', blush: true, wrinkles: 1, jaw: 1 },
    // акт 1: пароход «Святая Марфа», 1926
    lykov:      { sex: 'm', age: 56, skin: '#e2b08e', hair: '#bdb6aa', hairStyle: 'short', beard: 'full', beardC: '#c8c2b6', eye: '#46586a', hat: 'police', hatC: '#18202e', collar: 'suit3', cloth: '#1a2436', cloth2: '#c9a35a', wrinkles: 1, heavy: true, jaw: 1 },
    stepan:     { sex: 'm', age: 31, skin: '#c8946e', hair: '#2a1e16', hairStyle: 'messy', eye: '#3a2a1e', collar: 'vatnik', cloth: '#3a3430', stubble: '#2a1e16', scar: true, jaw: 1 },
    okunev:     { sex: 'm', age: 46, skin: '#efc6a6', hair: '#3a2a1c', hairStyle: 'slick', beard: 'moust', beardC: '#3a2a1c', eye: '#5a4a32', collar: 'vest', cloth: '#5a4a3a', cloth2: '#ece6da', chain: true, heavy: true },
    bragin:     { sex: 'm', age: 39, skin: '#e0b090', hair: '#2a2420', hairStyle: 'short', eye: '#3a3a3a', hat: 'cap', hatC: '#262222', collar: 'police', cloth: '#2a2626', cloth2: '#8a2020', stubble: '#3a3430', jaw: 1 },
    lidia:      { sex: 'f', age: 29, skin: '#f4d6c4', hair: '#141010', hairStyle: 'bob', eye: '#3a5a4a', collar: 'flashy', cloth: '#3a1a3a', cloth2: '#e8e0d0', lips: '#a8242c', badge: true, blush: true },
    koch:       { sex: 'm', age: 66, skin: '#efd0ba', hair: '#e2ded6', hairStyle: 'side', eye: '#5a5a4a', collar: 'vest', cloth: '#3a3a40', cloth2: '#ece6da', roundGlasses: true, wrinkles: 2, chain: true },
    // старый состав (первые версии), оставлен для совместимости
    fedor: { sex: 'm', age: 45, skin: '#e3b08a', hair: '#5a3a22', hairStyle: 'short', beard: 'full', beardC: '#6b4428', eye: '#5b3a1e', hat: 'cap', hatC: '#3d2c1f', collar: 'vatnik', cloth: '#6d5638' },
    countess: { sex: 'f', age: 40, skin: '#f3d3c0', hair: '#2b1a14', hairStyle: 'updo', eye: '#3f6b4f', collar: 'uniformF', cloth: '#5e1a2a', cloth2: '#8a2a3e', lips: '#a8343c' }
  };
  const sh = (hex, k) => {
    const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  };
  const P = (...a) => a.map(v => typeof v === 'number' ? v.toFixed(1) : v).join(' ');

  // ---------- лицо ----------
  function faceShape(c) {
    const j = c.sex === 'm' ? 10 + (c.jaw ? 10 : 0) + (c.heavy ? 8 : 0) : 0, ch = c.sex === 'f' ? 0 : 6;
    return `M${160 - j * .3} 238 C${158 - j * .4} 300 ${172 - j * .2} 352 ${200 - j * .3} ${386 + ch} C${218} ${410 + ch} ${236 - j * .2} ${424 + ch} 250 ${426 + ch} C${264 + j * .2} ${424 + ch} ${282} ${410 + ch} ${300 + j * .3} ${386 + ch} C${328 + j * .2} 352 ${342 + j * .4} 300 ${340 + j * .3} 238 C340 150 300 118 250 118 C200 118 160 150 ${160 - j * .3} 238Z`;
  }
  function eye(c, e, sd, uid) {
    const young = c.age < 30, old = c.age > 58, fem = c.sex === 'f';
    const cx = 250 + sd * 47, cy = 274;
    let w = (young ? 31 : old ? 26 : 29) * 1.06, h = (young ? 18 : old ? 12 : 15) * (fem ? 1.12 : 1);
    const ir = (young ? 14 : old ? 10 : 12) * (fem ? 1.08 : 1);
    if (e === 'smile') {
      return `<path d="M${cx - w} ${cy + 3} Q${cx} ${cy - h - 6} ${cx + w} ${cy + 3}" fill="none" stroke="#2a1812" stroke-width="5.5" stroke-linecap="round"/>` +
        (fem ? `<path d="M${cx + sd * w} ${cy + 2} l${sd * 9} -7" stroke="#2a1812" stroke-width="3" stroke-linecap="round"/>` : '') +
        `<path d="M${cx - w * .7} ${cy + 9} Q${cx} ${cy + 3} ${cx + w * .7} ${cy + 9}" fill="none" stroke="${sh(c.skin, -.3)}" stroke-width="1.6" opacity=".6"/>`;
    }
    if (e === 'surprised') h *= 1.25;
    if (e === 'sleepy') h *= .5;
    if (e === 'smug') h *= .72;
    const tiltIn = e === 'angry' ? -5 : (e === 'worried' || e === 'sad') ? 5 : 0;   // внутренний угол выше/ниже
    const xi = cx - sd * w, xo = cx + sd * w;                                      // внутренний и внешний углы
    const yi = cy + 2 - tiltIn * .5, yo = cy - 1 + tiltIn * .3;
    const top = `M${xi} ${yi} C${cx - sd * w * .55} ${cy - h * 1.15 + tiltIn * .5} ${cx + sd * w * .45} ${cy - h * 1.2} ${xo} ${yo}`;
    const bot = `C${cx + sd * w * .55} ${cy + h * .85} ${cx - sd * w * .5} ${cy + h * .85} ${xi} ${yi}Z`;
    const ic = c.eye, id = `ir${uid}${sd > 0 ? 'r' : 'l'}`;
    let s = `<defs><radialGradient id="${id}" cx=".5" cy=".7" r=".75"><stop offset="0" stop-color="${sh(ic, .55)}"/><stop offset=".45" stop-color="${sh(ic, .15)}"/><stop offset=".85" stop-color="${ic}"/><stop offset="1" stop-color="${sh(ic, -.55)}"/></radialGradient>` +
      `<clipPath id="cp${id}"><path d="${top} ${bot}"/></clipPath></defs>`;
    s += `<path d="${top} ${bot}" fill="#fdf8f3"/>`;
    s += `<g clip-path="url(#cp${id})">`;
    const ix = cx - sd * 1, iy = cy + (e === 'sleepy' ? 3 : 1);
    s += `<circle cx="${ix}" cy="${iy}" r="${ir}" fill="url(#${id})"/><circle cx="${ix}" cy="${iy}" r="${ir}" fill="none" stroke="${sh(ic, -.6)}" stroke-width="1.6"/>`;
    for (let a = 0; a < 8; a++) { const an = a / 8 * Math.PI * 2; s += `<path d="M${P(ix + Math.cos(an) * ir * .45, iy + Math.sin(an) * ir * .45)} L${P(ix + Math.cos(an) * ir * .85, iy + Math.sin(an) * ir * .85)}" stroke="${sh(ic, .45)}" stroke-width="1" opacity=".45"/>`; }
    s += `<ellipse cx="${ix}" cy="${iy}" rx="${ir * .42}" ry="${ir * .46}" fill="#120b08"/>`;
    s += `<path d="M${cx - w - 2} ${cy - h * 1.3} L${cx + w + 2} ${cy - h * 1.3} L${cx + w + 2} ${cy - h * .35} Q${cx} ${cy - h * .05} ${cx - w - 2} ${cy - h * .35}Z" fill="#5a2a1a" opacity=".22"/>`;
    s += `<ellipse cx="${ix - ir * .38}" cy="${iy - ir * .42}" rx="${ir * .3}" ry="${ir * .24}" fill="#fff"/><circle cx="${ix + ir * .38}" cy="${iy + ir * .38}" r="${ir * .12}" fill="#fff" opacity=".85"/>`;
    if (e === 'sleepy') s += `<path d="M${cx - w - 2} ${cy - h * 2} L${cx + w + 2} ${cy - h * 2} L${cx + w + 2} ${cy - h * .1} Q${cx} ${cy + h * .2} ${cx - w - 2} ${cy - h * .1}Z" fill="${c.skin}"/>`;
    s += `</g>`;
    // веко и ресницы
    const lw = fem ? 5.5 : 4.4;
    s += `<path d="${top}" fill="none" stroke="#24140f" stroke-width="${lw}" stroke-linecap="round"/>`;
    if (fem) s += `<path d="M${xo} ${yo} q${sd * 9} -3 ${sd * 13} -11 M${cx + sd * w * .72} ${cy - h * .95} q${sd * 6} -4 ${sd * 8} -11" stroke="#24140f" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    else s += `<path d="M${xo} ${yo} q${sd * 5} -1 ${sd * 7} -5" stroke="#24140f" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${cx - sd * w * .65} ${cy - h * 1.45} Q${cx} ${cy - h * 1.75} ${cx + sd * w * .8} ${cy - h * 1.2}" stroke="${sh(c.skin, -.35)}" stroke-width="1.6" fill="none" opacity=".7"/>`;
    s += `<path d="M${cx + sd * w * .95} ${cy + 1} C${cx + sd * w * .5} ${cy + h * .9} ${cx - sd * w * .3} ${cy + h * .95} ${cx - sd * w * .75} ${cy + h * .5}" stroke="${sh(c.skin, -.45)}" stroke-width="1.6" fill="none" opacity=".75"/>`;
    if (old) s += `<path d="M${xo + sd * 4} ${cy + 3} l${sd * 10} 3 M${xo + sd * 2} ${cy + 8} l${sd * 9} 7 M${cx - sd * w * .4} ${cy + h + 6} q${sd * 14} 5 ${sd * 30} 0" stroke="${sh(c.skin, -.32)}" stroke-width="1.4" fill="none" opacity=".6"/>`;
    return s;
  }
  function brow(c, e, sd) {
    const col = sh(c.hair, c.age > 60 ? -.18 : -.28);
    const cx = 250 + sd * 47, t = c.sex === 'm' ? 12 : 7;
    let yi = 238, ym = 229, yo = 236;
    if (e === 'angry') { yi = 248; ym = 236; yo = 232; }
    if (e === 'worried' || e === 'sad') { yi = 226; ym = 228; yo = 240; }
    if (e === 'surprised') { yi = 222; ym = 213; yo = 222; }
    if (e === 'smug' && sd > 0) { yi = 232; ym = 220; yo = 226; }
    const xi = cx - sd * 22, xm = cx + sd * 4, xo = cx + sd * 32;
    return `<path d="M${xi} ${yi - t * .5} Q${xm} ${ym - t * .6} ${xo} ${yo - 1} Q${xm} ${ym + t * .45} ${xi} ${yi + t * .5}Z" fill="${col}"/>` +
      `<path d="M${xi + sd * 4} ${yi - t * .2} Q${xm} ${ym - t * .3} ${xo - sd * 8} ${yo - 1}" stroke="${sh(col, .25)}" stroke-width="1" fill="none" opacity=".5"/>`;
  }
  function nose(c) {
    const d = sh(c.skin, -.28);
    return `<path d="M258 284 C262 302 266 316 258 326 C254 330 246 331 240 327" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M260 296 C266 310 266 320 258 327 L252 316Z" fill="${d}" opacity=".22"/>` +
      `<ellipse cx="247" cy="314" rx="5" ry="3" fill="#fff" opacity=".35"/><path d="M238 326 q3 2 6 0 M256 326 q3 2 6 0" stroke="${sh(c.skin, -.4)}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  }
  function mouth(c, e) {
    const lip = c.lips || sh(c.skin, -.22), ln = sh(c.skin, -.48), y = 364;
    const under = `<path d="M238 ${y + 14} Q250 ${y + 19} 262 ${y + 14}" stroke="${sh(c.skin, -.25)}" stroke-width="2" fill="none" opacity=".5"/>`;
    switch (e) {
      case 'smile': return `<path d="M222 ${y - 6} Q250 ${y + 26} 278 ${y - 6} Q250 ${y + 6} 222 ${y - 6}Z" fill="#7a2a2a"/><path d="M228 ${y - 3} Q250 ${y + 6} 272 ${y - 3} L270 ${y} Q250 ${y + 7} 230 ${y}Z" fill="#fff"/><path d="M240 ${y + 12} Q250 ${y + 18} 260 ${y + 12}" stroke="#c45a5a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`;
      case 'surprised': return `<ellipse cx="250" cy="${y + 3}" rx="10" ry="13" fill="#6a2422"/><ellipse cx="250" cy="${y + 9}" rx="6" ry="4" fill="#b04a48"/>`;
      case 'angry': return `<path d="M227 ${y + 6} Q250 ${y - 6} 273 ${y + 6}" stroke="${ln}" stroke-width="4" fill="none" stroke-linecap="round"/>` + under;
      case 'worried': return `<path d="M231 ${y + 2} q7 -5 13 0 q6 5 12 0 q6 -5 13 0" stroke="${ln}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` + under;
      case 'sad': return `<path d="M231 ${y + 6} Q250 ${y - 5} 269 ${y + 6}" stroke="${ln}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` + under;
      case 'smug': return `<path d="M232 ${y + 2} Q252 ${y + 7} 272 ${y - 7}" stroke="${ln}" stroke-width="3.8" fill="none" stroke-linecap="round"/>` + under;
      case 'sleepy': return `<ellipse cx="252" cy="${y + 2}" rx="7" ry="5" fill="#6a2422"/>`;
      default: return (c.lips ? `<path d="M233 ${y} Q241 ${y - 6} 250 ${y - 2} Q259 ${y - 6} 267 ${y} Q250 ${y + 3} 233 ${y}Z" fill="${lip}"/><path d="M235 ${y + 1} Q250 ${y + 12} 265 ${y + 1} Q250 ${y + 5} 235 ${y + 1}Z" fill="${sh(lip, .12)}"/>` : '') +
        `<path d="M233 ${y} Q250 ${y + 5} 267 ${y}" stroke="${ln}" stroke-width="3.2" fill="none" stroke-linecap="round"/>` + under;
    }
  }
  // ---------- волосы ----------
  function hairBack(c) {
    const h = c.hair, d = sh(h, -.3);
    if (c.hairStyle === 'updo') return `<path d="M148 260 Q136 140 250 108 Q364 140 352 260 L340 310 Q332 200 250 188 Q168 200 160 310Z" fill="${d}"/><ellipse cx="250" cy="104" rx="46" ry="38" fill="${d}"/><path d="M216 92 Q250 70 284 92" stroke="${sh(h, .15)}" stroke-width="5" fill="none" opacity=".5"/>`;
    if (c.hairStyle === 'bob') return `<path d="M146 330 Q130 136 250 112 Q370 136 354 330 Q330 346 318 330 L182 330 Q170 346 146 330Z" fill="${d}"/>`;
    if (c.hairStyle === 'curly') return `<path d="M140 300 Q120 150 250 110 Q380 150 360 300 Z" fill="${d}"/>`;
    return '';
  }
  function hairFront(c) {
    const h = c.hair, hl = sh(h, .3), d = sh(h, -.32), ring = `<path d="M196 150 Q250 128 306 150" stroke="${hl}" stroke-width="9" fill="none" opacity=".45" stroke-linecap="round"/>`;
    const strands = (xs, y0, y1) => xs.map(x => `<path d="M${x} ${y0} Q${x + 6} ${(y0 + y1) / 2} ${x + 2} ${y1}" stroke="${d}" stroke-width="2" fill="none" opacity=".55"/>`).join('');
    switch (c.hairStyle) {
      case 'short': return `<path d="M154 254 Q144 136 250 112 Q356 136 346 254 L336 226 Q330 186 302 172 Q298 194 272 198 Q278 182 264 170 Q246 194 208 196 Q216 184 212 174 Q178 194 168 232Z" fill="${h}"/>` + strands([196, 230, 270, 300], 140, 190) + ring;
      case 'side': return `<path d="M154 258 Q146 132 252 112 Q354 128 346 252 L338 220 Q326 176 286 164 Q250 158 214 170 Q182 186 166 236Z" fill="${h}"/><path d="M286 164 Q250 150 206 176" stroke="${d}" stroke-width="3" fill="none" opacity=".6"/>` + strands([210, 240, 300, 322], 132, 170) + ring;
      case 'messy': return `<path d="M150 266 Q130 150 228 110 Q300 94 350 158 Q364 210 348 266 L338 236 L330 212 L316 230 L306 198 L290 224 L282 190 L264 222 L252 188 L238 224 L222 192 L210 228 L196 198 L184 236 L170 212 L162 248Z" fill="${h}"/>` + strands([200, 236, 268, 304], 128, 196) + ring;
      case 'slick': return `<path d="M156 252 Q146 128 252 114 Q354 124 346 244 L338 212 Q320 168 270 166 Q228 166 204 184 Q182 198 166 240Z" fill="${h}"/>` + [0, 1, 2, 3].map(i => `<path d="M${178 + i * 10} ${196 - i * 8} Q240 ${150 - i * 8} 322 ${168 - i * 4}" stroke="${i % 2 ? hl : d}" stroke-width="2.4" fill="none" opacity=".5"/>`).join('') +
        `<path d="M156 250 L160 304 L170 304 L168 250Z M344 250 L340 304 L330 304 L332 250Z" fill="${h}"/>`;
      case 'buzz': return `<path d="M158 248 Q150 134 250 120 Q350 134 342 248 L334 220 Q328 166 250 158 Q172 166 166 220Z" fill="${h}"/><path d="M166 214 Q250 148 334 214" stroke="${d}" stroke-width="2" fill="none" opacity=".45" stroke-dasharray="2 5"/><path d="M196 140 Q250 124 304 140" stroke="${hl}" stroke-width="6" fill="none" opacity=".3"/>`;
      case 'updo': return `<path d="M156 262 Q148 148 250 122 Q352 148 344 262 Q334 206 298 186 Q282 210 238 206 Q254 196 256 184 Q208 196 180 228 Q166 244 156 262Z" fill="${h}"/>` + strands([212, 244, 290], 134, 184) + ring +
        `<path d="M158 262 Q148 306 166 340" stroke="${h}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M342 262 Q352 300 338 330" stroke="${h}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      case 'bob': return `<path d="M150 300 Q138 140 250 118 Q362 140 350 300 L332 304 Q336 228 300 196 Q262 216 212 206 Q180 230 170 304Z" fill="${h}"/>` + strands([212, 246, 282, 312], 128, 196) + ring;
      case 'curly': { let s = ''; const pts = [[160, 244], [156, 204], [170, 168], [194, 140], [224, 124], [256, 120], [288, 128], [316, 148], [336, 178], [346, 212], [346, 248], [204, 178], [238, 166], [274, 168], [308, 184]];
        pts.forEach(([x, y], i) => { const r = 24 + (i % 3) * 4; s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? h : d}"/><path d="M${x - r * .5} ${y - r * .2} q${r * .5} -${r * .6} ${r * .9} 0" stroke="${hl}" stroke-width="2.4" fill="none" opacity=".5"/>`; }); return s; }
      case 'bald': return `<path d="M154 266 Q146 222 164 204 L174 272Z M346 266 Q354 222 336 204 L326 272Z" fill="${h}"/><path d="M188 148 Q250 124 312 148" stroke="#fff" stroke-width="12" fill="none" opacity=".2" stroke-linecap="round"/>`;
      default: return '';
    }
  }
  function beard(c) {
    if (!c.beard) return '';
    const b = c.beardC, d = sh(b, -.25), l = sh(b, .2);
    switch (c.beard) {
      case 'full': return `<path d="M168 300 Q176 382 212 414 Q250 450 288 414 Q324 382 332 300 Q322 346 300 360 Q286 340 250 342 Q214 340 200 360 Q178 346 168 300Z" fill="${b}"/><path d="M222 352 Q250 338 278 352 Q264 360 250 356 Q236 360 222 352Z" fill="${d}"/>` + [208, 230, 250, 270, 292].map(x => `<path d="M${x} 380 q4 18 0 34" stroke="${d}" stroke-width="2" fill="none" opacity=".5"/>`).join('');
      case 'trim': return `<path d="M172 312 Q182 382 214 406 Q250 430 286 406 Q318 382 328 312 Q318 348 296 358 Q282 344 250 346 Q218 344 204 358 Q182 348 172 312Z" fill="${b}"/><path d="M220 352 Q250 336 280 352 Q264 359 250 355 Q236 359 220 352Z" fill="${d}"/>` + [224, 250, 276].map(x => `<path d="M${x} 386 q3 12 0 22" stroke="${l}" stroke-width="1.6" fill="none" opacity=".5"/>`).join('');
      case 'walrus': return `<path d="M212 352 Q250 328 288 352 Q298 374 280 382 Q266 362 250 360 Q234 362 220 382 Q202 374 212 352Z" fill="${b}"/>`;
      case 'moust': return `<path d="M222 350 Q250 334 278 350 Q286 358 292 351 Q286 366 270 361 Q258 352 250 354 Q242 352 230 361 Q214 366 208 351 Q214 358 222 350Z" fill="${b}"/><path d="M230 350 Q250 342 270 350" stroke="${l}" stroke-width="1.4" fill="none" opacity=".5"/>`;
    }
    return '';
  }
  // ---------- головные уборы ----------
  function hat(c) {
    if (!c.hat) return '';
    const k = c.hatC, d = sh(k, -.3), l = sh(k, .18);
    switch (c.hat) {
      case 'cap': return `<path d="M148 198 Q148 110 250 102 Q352 110 354 198 Q300 176 250 176 Q200 176 148 198Z" fill="${k}"/><path d="M160 186 Q250 156 342 186" stroke="${l}" stroke-width="5" fill="none" opacity=".5"/><path d="M144 198 Q250 168 356 198 Q332 216 250 212 Q168 216 144 198Z" fill="${d}"/><path d="M194 214 Q250 238 320 212 Q302 232 250 234 Q204 234 194 214Z" fill="#1a120c"/>`;
      case 'police': return `<path d="M134 170 Q148 110 250 106 Q352 110 366 170 L348 204 L152 204Z" fill="${k}"/><path d="M146 150 Q250 120 354 150" stroke="${l}" stroke-width="4" fill="none" opacity=".5"/><path d="M150 190 L350 190 L350 210 L150 210Z" fill="#8a2a2a"/><path d="M172 210 Q250 248 328 210 Q310 238 250 240 Q190 238 172 210Z" fill="#0e121c"/><path d="M190 218 Q250 236 310 218" stroke="#3a4050" stroke-width="2" fill="none"/><circle cx="250" cy="168" r="15" fill="#c9a35a"/><path d="M250 155 l5 9 l10 1 l-7 7 l2 10 l-10 -5 l-10 5 l2 -10 l-7 -7 l10 -1Z" fill="#8a6a30"/>`;
      case 'nurse': return `<path d="M174 168 Q250 118 326 168 L320 194 Q250 174 180 194Z" fill="${k}"/><path d="M180 194 Q250 174 320 194" stroke="#c8d0d6" stroke-width="3" fill="none"/><path d="M200 160 Q250 136 300 160" stroke="#e4ecf2" stroke-width="4" fill="none"/>`;
      case 'kosynka': return `<path d="M150 222 Q148 128 250 116 Q352 128 350 222 Q300 190 250 188 Q200 190 150 222Z" fill="${k}"/><path d="M162 202 Q250 168 338 202" stroke="${d}" stroke-width="3" fill="none" opacity=".45"/><path d="M180 150 Q250 128 320 150" stroke="${l}" stroke-width="5" fill="none" opacity=".5"/><path d="M336 206 q32 10 42 42 q-26 -6 -42 -20Z" fill="${k}"/>`;
      case 'hood': return `<path d="M132 340 Q114 118 250 96 Q386 118 368 340 Q352 262 332 222 Q312 168 250 164 Q188 168 168 222 Q148 262 132 340Z" fill="${k}"/><path d="M166 228 Q188 170 250 166 Q312 170 334 228" stroke="${d}" stroke-width="12" fill="none"/><path d="M150 180 Q200 110 300 112" stroke="${l}" stroke-width="5" fill="none" opacity=".35"/>`;
      case 'kerchief': return `<path d="M134 292 Q118 118 250 104 Q382 118 366 292 Q352 362 316 412 Q300 352 336 262 Q324 196 250 194 Q176 196 164 262 Q200 352 184 412 Q148 362 134 292Z" fill="${k}"/>`;
    }
    return '';
  }
  // ---------- одежда ----------
  function body(c, uid) {
    const k = c.cloth, d = sh(k, -.32), l = sh(k, .14), k2 = c.cloth2 || sh(k, .3);
    const wide = c.heavy ? 28 : 0;
    let s = `<path d="M${28 - wide} 640 C${38 - wide} 528 ${108 - wide} 476 210 460 L290 460 C${392 + wide} 476 ${462 + wide} 528 ${472 + wide} 640Z" fill="url(#cl${uid})"/>`;
    s += `<path d="M${70 - wide} 600 Q${110 - wide} 540 170 512 M${430 + wide} 600 Q${390 + wide} 540 330 512" stroke="${d}" stroke-width="3" fill="none" opacity=".45"/>`;
    switch (c.collar) {
      case 'guard': s += `<path d="M214 460 L250 520 L286 460Z" fill="${k2}"/><path d="M214 460 L250 520 L232 640 L150 640Z M286 460 L250 520 L268 640 L350 640Z" fill="${d}"/><path d="M214 460 L250 520 L286 460" stroke="${l}" stroke-width="3" fill="none"/><rect x="330" y="560" width="72" height="26" rx="4" fill="#3a3f46"/><text x="366" y="578" font-size="14" fill="#c9c4b8" text-anchor="middle" font-family="sans-serif">ОХРАНА</text>`; break;
      case 'vatnik': s += [0, 1, 2, 3, 4].map(i => `<path d="M${58 + i * 6} ${540 + i * 22} Q250 ${518 + i * 22} ${442 - i * 6} ${540 + i * 22}" stroke="${d}" stroke-width="3" fill="none" opacity=".55"/>`).join('') + `<path d="M204 460 Q250 486 296 460 L302 500 Q250 520 198 500Z" fill="${sh(k, -.15)}"/><path d="M250 500 L250 640" stroke="${d}" stroke-width="4"/>` + [540, 580, 620].map(y => `<circle cx="258" cy="${y}" r="5" fill="${sh(k, -.45)}"/>`).join(''); break;
      case 'nurse': s += `<path d="M206 460 L250 530 L294 460Z" fill="${k2}"/><path d="M206 460 L250 530 L240 640 L160 640Z M294 460 L250 530 L260 640 L340 640Z" fill="${sh(k, -.04)}"/><path d="M206 460 L250 530 L294 460" stroke="#c8cdd2" stroke-width="3" fill="none"/><rect x="300" y="560" width="42" height="8" rx="3" fill="#3a6aa0"/><path d="M130 600 Q170 560 200 540" stroke="#dde2e6" stroke-width="3" fill="none"/>`; break;
      case 'flashy': s += `<path d="M216 460 L250 540 L284 460Z" fill="${k2}"/><path d="M226 470 L250 502 L274 470" stroke="#e0b860" stroke-width="3" fill="none"/><circle cx="250" cy="506" r="5" fill="#e0b860"/><path d="M216 460 L250 540 L230 640 L140 640Z M284 460 L250 540 L270 640 L360 640Z" fill="${d}"/><path d="M216 460 L250 540 L284 460" stroke="${sh(k, .28)}" stroke-width="4" fill="none"/><path d="M196 560 l20 8 M304 560 l-20 8" stroke="${l}" stroke-width="3" opacity=".6"/>`; break;
      case 'police': s += `<path d="M212 460 L250 500 L288 460 L292 486 L250 520 L208 486Z" fill="${sh(k, .14)}"/><path d="M250 520 L250 640" stroke="${d}" stroke-width="3"/>` + [550, 600].map(y => `<circle cx="258" cy="${y}" r="5.5" fill="${k2}"/><circle cx="257" cy="${y - 1.5}" r="2" fill="#fff3c8"/>`).join('') +
        `<path d="M94 552 L160 532 L164 550 L98 570Z" fill="#2a3448"/><path d="M406 552 L340 532 L336 550 L402 570Z" fill="#2a3448"/><path d="M110 556 l10 -3 M130 550 l10 -3" stroke="${k2}" stroke-width="3"/><path d="M160 600 l44 0 l0 -24" stroke="${d}" stroke-width="2.4" fill="none" opacity=".6"/>` +
        (c.radio ? `<rect x="330" y="484" width="34" height="58" rx="6" fill="#1a1c20"/><rect x="342" y="466" width="5" height="22" rx="2" fill="#1a1c20"/><rect x="336" y="494" width="22" height="12" rx="2" fill="#4a7a4a"/><circle cx="347" cy="522" r="4" fill="#3a3c40"/>` : ''); break;
      case 'suit3': s += `<path d="M214 460 L250 530 L286 460Z" fill="#f4f1e8"/><path d="M243 468 L257 468 L262 560 L250 580 L238 560Z" fill="${k2}"/><path d="M243 468 L257 468 L254 480 L246 480Z" fill="${sh(k2, -.3)}"/><path d="M226 500 L250 530 L274 500 L280 640 L220 640Z" fill="${sh(k, .1)}"/><path d="M214 460 L250 530 L226 640 L146 640Z M286 460 L250 530 L274 640 L354 640Z" fill="${d}"/><path d="M214 460 L250 530 M286 460 L250 530" stroke="${l}" stroke-width="2.4" fill="none"/><circle cx="250" cy="600" r="4" fill="#c9a35a"/><path d="M300 548 l26 -4 l2 10 l-26 4Z" fill="#f4f1e8"/>`; break;
      case 'vest': s += `<path d="M214 460 L250 520 L286 460Z" fill="${k2}"/><path d="M244 468 L256 468 L258 540 L250 552 L242 540Z" fill="#5a3a2a"/><path d="M204 470 L250 560 L296 470 L310 640 L190 640Z" fill="${k}"/>` + [0, 1, 2, 3, 4, 5].map(i => `<path d="M${198 + i * 21} 596 l6 12 l6 -12" stroke="${d}" stroke-width="2" fill="none"/>`).join('') + `<path d="M150 470 L204 470 L190 640 L120 640Z M350 470 L296 470 L310 640 L380 640Z" fill="#3a3a40"/>`; break;
      case 'uniformF': s += `<path d="M212 460 L250 506 L288 460Z" fill="#f4f2ee"/><path d="M232 470 L250 486 L268 470 L262 494 L250 488 L238 494Z" fill="#b03a3a"/><path d="M212 460 L250 506 L238 640 L160 640Z M288 460 L250 506 L262 640 L340 640Z" fill="${d}"/>` + (c.badge ? `<rect x="298" y="540" width="58" height="18" rx="3" fill="#e8e2d0"/><rect x="304" y="546" width="46" height="6" rx="2" fill="#3a3a3a" opacity=".5"/>` : '') + `<circle cx="250" cy="560" r="5" fill="${k2}"/><circle cx="250" cy="600" r="5" fill="${k2}"/>`; break;
      case 'apron': s += `<path d="M198 460 Q250 500 302 460 L312 640 L188 640Z" fill="${k2}"/><path d="M198 520 L302 520 L322 640 L178 640Z" fill="${k}"/><path d="M198 520 L188 468 M302 520 L312 468" stroke="${k}" stroke-width="10"/><path d="M198 520 L302 520" stroke="${sh(k, -.15)}" stroke-width="3"/><circle cx="228" cy="582" r="11" fill="#b07a4a" opacity=".3"/><circle cx="278" cy="604" r="7" fill="#a83a2a" opacity=".28"/>`; break;
      case 'hoodie': s += `<path d="M194 460 Q250 502 306 460 L300 482 Q250 518 200 482Z" fill="${d}"/><path d="M232 486 L228 562 M268 486 L272 562" stroke="#e8e4dc" stroke-width="4"/><circle cx="228" cy="564" r="5" fill="#e8e4dc"/><circle cx="272" cy="564" r="5" fill="#e8e4dc"/><path d="M178 600 L322 600 L316 640 L184 640Z" fill="${d}" opacity=".6"/>`; break;
      case 'whitecoat': s += `<path d="M214 460 L250 520 L286 460Z" fill="#e8e2d4"/><path d="M214 460 L250 520 L226 640 L140 640Z M286 460 L250 520 L274 640 L360 640Z" fill="${sh(k, -.05)}"/><path d="M214 460 L250 520 L286 460" stroke="${k2}" stroke-width="4" fill="none"/>` +
        `<g transform="translate(176 552) scale(1.3)"><path d="M0 -26 Q10 -10 0 6 Q-10 -10 0 -26Z M0 6 Q-22 -2 -26 -18 Q-8 -14 0 6Z M0 6 Q22 -2 26 -18 Q8 -14 0 6Z" fill="${k2}"/><ellipse cx="0" cy="-8" rx="5" ry="3.5" fill="#fff"/><circle cx="0" cy="-8" r="2" fill="#3a2a10"/><path d="M0 6 L0 26" stroke="${k2}" stroke-width="3"/></g>`; break;
    }
    return s;
  }

  let uidN = 0;
  window.portraitSVG = function (id, expr) {
    const c = C[id]; if (!c) return '';
    const e = expr || 'neutral', uid = 'p' + (uidN++);
    const sk = c.skin, skd = sh(sk, -.2), skl = sh(sk, .14), sk2 = sh(sk, -.35);
    const face = faceShape(c);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 640"><defs>` +
      `<linearGradient id="sk${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${skl}"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${skd}"/></linearGradient>` +
      `<linearGradient id="cl${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sh(c.cloth, .16)}"/><stop offset=".55" stop-color="${c.cloth}"/><stop offset="1" stop-color="${sh(c.cloth, -.38)}"/></linearGradient>` +
      `<radialGradient id="bl${uid}"><stop offset="0" stop-color="#ff7a7a" stop-opacity=".5"/><stop offset="1" stop-color="#ff7a7a" stop-opacity="0"/></radialGradient>` +
      `<clipPath id="fc${uid}"><path d="${face}"/></clipPath></defs>`;
    s += hairBack(c);
    // шея
    s += `<path d="M216 372 L284 372 L294 470 Q250 492 206 470Z" fill="${skd}"/><path d="M216 380 Q250 424 284 380 L286 414 Q250 442 214 414Z" fill="${sk2}" opacity=".5"/>`;
    s += body(c, uid);
    // уши
    for (const sd of [-1, 1]) {
      const ex = 250 + sd * 92;
      s += `<path d="M${ex} 250 C${ex + sd * 22} 244 ${ex + sd * 24} 300 ${ex + sd * 2} 312" fill="${skd}"/><path d="M${ex + sd * 4} 262 C${ex + sd * 14} 262 ${ex + sd * 14} 292 ${ex + sd * 4} 298" stroke="${sk2}" stroke-width="2.2" fill="none" opacity=".7"/>`;
    }
    if (c.earrings) s += `<circle cx="154" cy="314" r="7" fill="#f6f1e8"/><circle cx="346" cy="314" r="7" fill="#f6f1e8"/>`;
    // лицо и светотень
    s += `<path d="${face}" fill="url(#sk${uid})" stroke="${sh(sk, -.42)}" stroke-width="2.2"/>`;
    s += `<g clip-path="url(#fc${uid})">`;
    s += `<path d="M300 140 Q356 210 342 310 Q326 392 268 432 L340 440 L360 120Z" fill="${sk2}" opacity=".28"/>`;          // тень справа
    s += `<path d="M150 200 Q250 168 350 200 L350 150 L150 150Z" fill="${sk2}" opacity=".35"/>`;                              // тень от волос/шапки
    s += `<ellipse cx="250" cy="420" rx="60" ry="14" fill="${sk2}" opacity=".18"/>`;
    s += `<ellipse cx="205" cy="300" rx="22" ry="12" fill="#fff" opacity=".12"/>`;
    if (c.blush || c.sex === 'f') { s += `<ellipse cx="197" cy="322" rx="26" ry="13" fill="url(#bl${uid})" opacity="${c.age > 55 ? .4 : .9}"/><ellipse cx="303" cy="322" rx="26" ry="13" fill="url(#bl${uid})" opacity="${c.age > 55 ? .4 : .9}"/>`; }
    if (c.stubble) s += `<path d="M176 326 Q190 394 222 412 Q250 430 278 412 Q310 394 324 326 Q302 380 250 384 Q198 380 176 326Z" fill="${c.stubble}" opacity=".25"/>`;
    s += `</g>`;
    if (c.freckles) s += [[190, 306], [202, 312], [212, 304], [292, 304], [300, 312], [310, 306]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#b07040" opacity=".6"/>`).join('');
    if (c.wrinkles) s += `<path d="M206 206 Q250 198 294 206 M214 192 Q250 184 286 192" stroke="${sk2}" stroke-width="1.6" fill="none" opacity=".45"/><path d="M216 328 Q206 352 222 374 M284 328 Q294 352 278 374" stroke="${sk2}" stroke-width="2" fill="none" opacity="${c.wrinkles > 1 ? .6 : .35}"/>`;
    if (c.scar) s += `<path d="M302 230 L324 300 M306 248 l10 -4 M312 264 l10 -4 M318 282 l10 -4" stroke="#a8665a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
    s += eye(c, e, -1, uid) + eye(c, e, 1, uid) + brow(c, e, -1) + brow(c, e, 1) + nose(c);
    if (c.stitches) s += `<path d="M190 210 Q250 190 312 214" stroke="#5a4428" stroke-width="2.5" fill="none" stroke-dasharray="7 6"/>` + [196, 214, 232, 250, 268, 286, 304].map(x => `<path d="M${x} ${206 - Math.abs(x - 250) * -.04} l0 10" stroke="#5a4428" stroke-width="2.5"/>`).join('') +
      `<path d="M168 300 Q200 330 214 380 M272 384 Q300 362 330 330" stroke="#5a4428" stroke-width="2.5" fill="none" stroke-dasharray="6 6"/>`;
    if (c.buttonEye) s += `<circle cx="297" cy="272" r="23" fill="#2a2a30"/><circle cx="297" cy="272" r="18" fill="#3c3c46"/><circle cx="291" cy="266" r="6" fill="#55556a" opacity=".6"/>` + [[-6, -6], [6, -6], [-6, 6], [6, 6]].map(([dx, dy]) => `<circle cx="${297 + dx}" cy="${272 + dy}" r="3" fill="#15151a"/>`).join('') + `<path d="M291 266 L303 278 M303 266 L291 278" stroke="#cdb48a" stroke-width="2"/>`;
    if (c.piercing) s += `<circle cx="320" cy="232" r="4" fill="#dcdce4"/><circle cx="326" cy="238" r="3" fill="#dcdce4"/>`;
    s += beard(c) + mouth(c, e);
    if (c.roundGlasses) s += `<circle cx="203" cy="274" r="25" fill="#ffffff18" stroke="#b08a40" stroke-width="2.6"/><circle cx="297" cy="274" r="25" fill="#ffffff18" stroke="#b08a40" stroke-width="2.6"/><path d="M228 272 Q250 265 272 272 M178 270 L158 264 M322 270 L342 264" stroke="#b08a40" stroke-width="2.6" fill="none"/><path d="M188 262 l10 -6 M282 262 l10 -6" stroke="#fff" stroke-width="2" opacity=".6"/>`;
    if (c.glasses && c.chain) s += `<path d="M158 264 Q138 360 168 470 M342 264 Q362 360 332 470" stroke="#c9a35a" stroke-width="1.6" fill="none"/>`;
    if (c.glasses) s += `<rect x="176" y="254" width="56" height="40" rx="12" fill="#ffffff1a" stroke="#3a3228" stroke-width="3"/><rect x="268" y="254" width="56" height="40" rx="12" fill="#ffffff1a" stroke="#3a3228" stroke-width="3"/><path d="M232 272 Q250 264 268 272 M176 268 L158 262 M324 268 L342 262" stroke="#3a3228" stroke-width="3" fill="none"/><path d="M186 262 l12 -4 M278 262 l12 -4" stroke="#fff" stroke-width="2" opacity=".55"/>`;
    s += hairFront(c) + hat(c);
    if (c.earphones) s += `<path d="M156 300 Q150 380 200 470 M344 300 Q352 380 300 470" stroke="#f2f2f2" stroke-width="3" fill="none"/><circle cx="156" cy="296" r="9" fill="#f2f2f2"/><circle cx="344" cy="296" r="9" fill="#f2f2f2"/>`;
    if (c.card) s += `<g transform="rotate(-14 410 520)"><rect x="380" y="470" width="62" height="88" rx="6" fill="#fbf8f2" stroke="#2a2a2a" stroke-width="2"/><text x="392" y="496" font-size="22" font-family="Georgia" fill="#b02a2a">A</text><path d="M411 512 q-14 -14 0 -22 q14 8 0 22Z M411 512 q-12 4 -16 16 q16 -2 16 -16Z M411 512 q12 4 16 16 q-16 -2 -16 -16Z" fill="#b02a2a"/></g>`;
    if (c.crow) s += `<g transform="translate(366 452)"><path d="M-40 18 Q-10 -30 34 -20 Q60 -14 70 -2 L88 2 L70 8 Q58 24 30 30 Q0 40 -40 18Z" fill="#141418"/><path d="M-36 20 Q-60 34 -78 30 Q-60 18 -40 14Z" fill="#141418"/><path d="M-20 4 Q10 -10 40 -4" stroke="#2c2c3a" stroke-width="3" fill="none"/><circle cx="50" cy="-6" r="4.5" fill="#e8d870"/><circle cx="51" cy="-7" r="1.5" fill="#111"/></g>`;
    return s + `</svg>`;
  };
  window.PORTRAIT_IDS = Object.keys(C);
})();
