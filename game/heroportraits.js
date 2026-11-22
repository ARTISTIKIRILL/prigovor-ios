// Портреты четырёх главных героев — по их 3D-моделям (артефакт «Герои петли»).
// Ровен — закрытый шлем с короной и горящими глазами; Мирон — кукла из мешковины в шляпе, с бородой и вороном;
// Агата — монахиня с белым платом, трещинами-кракелюром под глазами и крестиком на лбу; Тибо — цилиндр и маска арлекина.
// Подменяет portraitSVG для этих id; остальные портреты рисует portraits.js.
(function () {
  const base = window.portraitSVG;
  let n = 0;
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const sh = (h, k) => '#' + hx(h).map(v => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))))).map(v => v.toString(16).padStart(2, '0')).join('');
  const open = (defs) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 640"><defs>${defs}</defs>`;
  // зернистость материала: шум, наложенный поверх формы
  const grain = (id, f, oct, op, seed) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="${oct}" seed="${seed || 3}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${op} 0" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in"/></filter>`;
  const glowF = (id, r) => `<filter id="${id}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="${r}"/></filter>`;

  // ================= РОВЕН: пепельный рыцарь =================
  function rowen(e) {
    const u = 'rw' + (n++);
    let s = open(
      `<linearGradient id="m${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2b2f"/><stop offset=".22" stop-color="#5d6066"/><stop offset=".42" stop-color="#3a3c41"/><stop offset=".7" stop-color="#26272b"/><stop offset=".86" stop-color="#4a4c52"/><stop offset="1" stop-color="#18191c"/></linearGradient>` +
      `<linearGradient id="v${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".18"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>` +
      `<linearGradient id="cr${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3530"/><stop offset="1" stop-color="#16130f"/></linearGradient>` +
      `<linearGradient id="pl${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a6d73"/><stop offset=".45" stop-color="#34363b"/><stop offset="1" stop-color="#151619"/></linearGradient>` +
      `<radialGradient id="eg${u}"><stop offset="0" stop-color="#fff2c0"/><stop offset=".35" stop-color="#ffbe40"/><stop offset="1" stop-color="#ff7a10" stop-opacity="0"/></radialGradient>` +
      grain('g' + u, .9, 3, .35, 7) + glowF('b' + u, 9) + glowF('bs' + u, 3)
    );
    // плащ и наплечники
    s += `<path d="M30 640 Q40 520 110 470 Q180 440 250 446 Q320 440 390 470 Q460 520 470 640Z" fill="#1a1716"/>`;
    s += `<path d="M38 640 Q52 540 120 490 Q190 456 250 462 Q310 456 380 490 Q448 540 462 640Z" fill="url(#pl${u})"/>`;
    for (const sd of [-1, 1]) {
      const x = 250 + sd * 150;
      s += `<path d="M${x - sd * 100} 470 Q${x} 448 ${x + sd * 70} 500 Q${x + sd * 94} 540 ${x + sd * 88} 600 Q${x + sd * 20} 560 ${x - sd * 90} 520Z" fill="url(#pl${u})" stroke="#0e0f11" stroke-width="3"/>`;
      s += `<path d="M${x - sd * 92} 500 Q${x} 476 ${x + sd * 74} 524" stroke="#7d8087" stroke-width="3" fill="none" opacity=".55"/>`;
      s += `<path d="M${x - sd * 80} 524 Q${x} 504 ${x + sd * 80} 552" stroke="#0e0f11" stroke-width="3" fill="none"/>`;
      s += [0, 1, 2].map(k => `<circle cx="${x - sd * 40 + sd * k * 40}" cy="${496 + k * 8}" r="4" fill="#8a7a5a"/>`).join('');
    }
    // латный ворот
    s += `<path d="M168 430 Q250 410 332 430 L340 480 Q250 462 160 480Z" fill="url(#m${u})" stroke="#0e0f11" stroke-width="3"/>`;
    s += `<path d="M160 480 Q250 462 340 480 L346 512 Q250 494 154 512Z" fill="url(#m${u})" stroke="#0e0f11" stroke-width="3"/>`;
    s += `<path d="M170 440 Q250 422 330 440" stroke="#9a9ea5" stroke-width="2" fill="none" opacity=".5"/>`;
    // шлем-ведро
    const helm = `M162 196 Q160 150 250 140 Q340 150 338 196 L346 380 Q344 420 300 438 Q250 450 200 438 Q156 420 154 380Z`;
    s += `<path d="${helm}" fill="url(#m${u})" stroke="#0b0b0d" stroke-width="4"/>`;
    s += `<path d="${helm}" fill="url(#v${u})"/>`;
    s += `<path d="${helm}" fill="#8a7a6a" filter="url(#g${u})" opacity=".5"/>`;
    s += `<path d="M250 146 L250 444" stroke="#0e0f11" stroke-width="5"/><path d="M246 150 L246 440" stroke="#8a8e95" stroke-width="2" opacity=".6"/>`;
    // рёбра шлема, заклёпки, царапины
    s += `<path d="M160 236 Q250 222 340 236" stroke="#0e0f11" stroke-width="4" fill="none"/><path d="M160 232 Q250 218 340 232" stroke="#9a9ea5" stroke-width="1.6" fill="none" opacity=".5"/>`;
    s += [176, 208, 292, 324].map(x => `<circle cx="${x}" cy="${231 + Math.abs(x - 250) * .02}" r="4.5" fill="#6a6d73" stroke="#111" stroke-width="1.5"/>`).join('');
    s += `<path d="M184 330 l18 26 M296 322 l-10 30 M210 392 l30 -6 M312 380 l14 12" stroke="#9aa0a8" stroke-width="1.4" opacity=".55"/>`;
    // дыхательные отверстия
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) s += `<circle cx="${282 + k * 14}" cy="${336 + r * 15}" r="3.2" fill="#070708"/>`;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) s += `<circle cx="${190 + k * 14}" cy="${336 + r * 15}" r="3.2" fill="#070708"/>`;
    // смотровая щель и глаза
    const tilt = e === 'angry' ? 7 : (e === 'sad' || e === 'worried') ? -6 : 0;
    s += `<path d="M168 ${276 - tilt * .2} L240 ${282 + tilt} L240 ${300 + tilt * .4} L168 ${292}Z M332 ${276 - tilt * .2} L260 ${282 + tilt} L260 ${300 + tilt * .4} L332 ${292}Z" fill="#050506"/>`;
    s += `<path d="M168 ${292} L240 ${300 + tilt * .4} M260 ${300 + tilt * .4} L332 292" stroke="#7d8087" stroke-width="2.4" opacity=".7"/>`;
    const glowC = e === 'angry' ? '#ff5a1a' : e === 'sad' ? '#c08840' : '#ffb030';
    const ey = 289 + tilt * .5;
    for (const sd of [-1, 1]) {
      const cx = 250 + sd * 42;
      let rx = 15, ry = 5.5, rot = sd * tilt * 1.6;
      if (e === 'surprised') { rx = 12; ry = 8.5; }
      if (e === 'smug' && sd > 0) ry = 3;
      if (e === 'smile') ry = 3.6;
      if (e === 'sleepy') ry = 2;
      s += `<ellipse cx="${cx}" cy="${ey}" rx="${rx + 14}" ry="${ry + 12}" fill="${glowC}" opacity="${e === 'sad' ? .25 : .45}" filter="url(#b${u})"/>`;
      if (e === 'smile') s += `<path d="M${cx - rx} ${ey + 3} Q${cx} ${ey - 9} ${cx + rx} ${ey + 3}" stroke="url(#eg${u})" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${cx - rx} ${ey + 3} Q${cx} ${ey - 9} ${cx + rx} ${ey + 3}" stroke="#fff2c0" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      else s += `<ellipse cx="${cx}" cy="${ey}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${ey})" fill="url(#eg${u})"/><ellipse cx="${cx}" cy="${ey}" rx="${rx * .45}" ry="${Math.max(1, ry * .45)}" transform="rotate(${rot} ${cx} ${ey})" fill="#fffbe8"/>`;
    }
    s += `<path d="M168 300 Q250 330 332 300 L332 316 Q250 342 168 316Z" fill="${glowC}" opacity=".08" filter="url(#bs${u})"/>`;
    // корона из тёмного железа с бронзовым ободом
    const spikes = [[168, 128], [196, 92], [222, 118], [250, 74], [278, 118], [304, 92], [332, 128]];
    let cp = `M156 214 L156 176 `;
    spikes.forEach(([x, y], i) => { cp += `L${x - 12} 168 L${x} ${y} L${x + 12} 168 `; });
    cp += `L344 176 L344 214 Q250 196 156 214Z`;
    s += `<path d="${cp}" fill="url(#cr${u})" stroke="#0a0908" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="${cp}" fill="#6a5a48" filter="url(#g${u})" opacity=".35"/>`;
    s += `<path d="M156 200 Q250 182 344 200" stroke="#b07a34" stroke-width="5" fill="none"/><path d="M156 214 Q250 196 344 214" stroke="#7a5424" stroke-width="3" fill="none"/>`;
    spikes.forEach(([x, y]) => { s += `<path d="M${x} ${y} L${x + 7} 166" stroke="#5a5048" stroke-width="2" opacity=".7"/>`; });
    // контровой тёплый свет слева (как на модели)
    s += `<path d="M162 200 Q156 300 156 380 Q160 412 186 430" stroke="#e08a40" stroke-width="3" fill="none" opacity=".55"/>`;
    s += `<path d="M44 640 Q58 540 124 494" stroke="#e08a40" stroke-width="3" fill="none" opacity=".45"/>`;
    return s + `</svg>`;
  }

  // ================= МИРОН: тряпичная кукла-могильщик =================
  function miron(e) {
    const u = 'mr' + (n++);
    const sk = '#bfa074', skd = '#8a6e48', skl = '#dcc49a';
    let s = open(
      `<linearGradient id="f${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${skl}"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${skd}"/></linearGradient>` +
      `<linearGradient id="h${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a2618"/><stop offset=".4" stop-color="#6a4a30"/><stop offset=".75" stop-color="#4a3220"/><stop offset="1" stop-color="#24170e"/></linearGradient>` +
      `<linearGradient id="bd${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ece6da"/><stop offset=".6" stop-color="#cfc6b6"/><stop offset="1" stop-color="#9a9282"/></linearGradient>` +
      `<linearGradient id="c${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a221c"/><stop offset=".5" stop-color="#3e3228"/><stop offset="1" stop-color="#16110d"/></linearGradient>` +
      `<pattern id="st${u}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#8a4a20"/><rect width="7" height="14" fill="#c27a3a"/></pattern>` +
      `<pattern id="w${u}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3 H6 M3 0 V6" stroke="#5a4428" stroke-width=".8" opacity=".35"/></pattern>` +
      `<clipPath id="fc${u}"><path d="M168 236 C160 300 172 360 206 402 C224 424 240 432 252 432 C266 432 282 424 298 402 C330 360 342 300 334 236 C330 166 296 140 250 140 C204 140 172 166 168 236Z"/></clipPath>` +
      grain('g' + u, .55, 4, .55, 11) + glowF('b' + u, 4)
    );
    const face = `M168 236 C160 300 172 360 206 402 C224 424 240 432 252 432 C266 432 282 424 298 402 C330 360 342 300 334 236 C330 166 296 140 250 140 C204 140 172 166 168 236Z`;
    // тело: полосатая рубаха, тёмный жилет со шнуровкой
    s += `<path d="M40 640 Q52 520 130 478 Q190 452 250 456 Q310 452 370 478 Q448 520 460 640Z" fill="url(#st${u})"/>`;
    s += `<path d="M40 640 Q52 520 130 478 Q190 452 250 456 Q310 452 370 478 Q448 520 460 640Z" fill="#000" opacity=".25"/>`;
    s += `<path d="M120 640 Q130 520 196 470 L250 520 L304 470 Q370 520 380 640Z" fill="url(#c${u})"/>`;
    for (let k = 0; k < 5; k++) s += `<path d="M232 ${528 + k * 22} L268 ${540 + k * 22} M268 ${528 + k * 22} L232 ${540 + k * 22}" stroke="#c9a46a" stroke-width="2.6"/>`;
    s += `<path d="M228 520 L228 640 M272 520 L272 640" stroke="#120d09" stroke-width="3"/>`;
    // шея из мешковины со швом
    s += `<path d="M214 400 L286 400 L292 474 Q250 492 208 474Z" fill="${skd}"/><path d="M214 400 L286 400 L292 474 Q250 492 208 474Z" fill="url(#w${u})"/>`;
    s += `<path d="M210 452 Q250 466 290 452" stroke="#3a2a18" stroke-width="2.4" fill="none" stroke-dasharray="6 5"/>`;
    // лицо: мешковина
    s += `<path d="${face}" fill="url(#f${u})" stroke="#4a3620" stroke-width="2.6"/>`;
    s += `<g clip-path="url(#fc${u})"><rect x="150" y="130" width="200" height="320" fill="url(#w${u})"/><rect x="150" y="130" width="200" height="320" fill="#4a3018" filter="url(#g${u})" opacity=".55"/>`;
    s += `<path d="M300 150 Q356 230 340 330 Q322 410 262 440 L350 450 L360 140Z" fill="#5a3e22" opacity=".35"/>`;
    s += `<path d="M150 220 Q250 196 350 220 L350 140 L150 140Z" fill="#2a1a0e" opacity=".55"/></g>`;
    // тяжёлые надбровья и запавшие глазницы
    const browY = e === 'angry' ? 8 : (e === 'sad' || e === 'worried') ? -5 : e === 'surprised' ? -10 : 0;
    for (const sd of [-1, 1]) {
      const cx = 250 + sd * 44;
      s += `<ellipse cx="${cx}" cy="270" rx="34" ry="24" fill="#3a2614" opacity=".55" filter="url(#b${u})"/>`;
      const smugUp = e === 'smug' && sd > 0 ? -6 : 0;
      s += `<path d="M${cx - sd * 30} ${246 + browY * (sd < 0 ? 1 : 1) + smugUp} Q${cx} ${232 + browY * .2 + smugUp} ${cx + sd * 36} ${244 - browY * .4 + smugUp} Q${cx} ${248 + smugUp} ${cx - sd * 30} ${256 + browY + smugUp}Z" fill="#8a6c46" stroke="#4a3620" stroke-width="1.6"/>`;
      // глаз-бусина
      let ry = 11; if (e === 'surprised') ry = 15; if (e === 'smug' || e === 'sleepy') ry = 6; if (e === 'smile') ry = 4;
      s += `<ellipse cx="${cx}" cy="273" rx="15" ry="${ry + 3}" fill="#24180c" opacity=".8"/><ellipse cx="${cx}" cy="273" rx="12" ry="${ry}" fill="#0c0805"/><circle cx="${cx - 4}" cy="${269 - ry * .2}" r="3.4" fill="#f4ead6"/><circle cx="${cx + 4}" cy="${277}" r="1.4" fill="#f4ead6" opacity=".6"/>`;
      if (e === 'smile') s += `<path d="M${cx - 14} 276 Q${cx} 266 ${cx + 14} 276" stroke="#4a3620" stroke-width="3" fill="none"/>`;
    }
    // крестиками зашитый шов через лоб и щёку
    s += `<path d="M196 196 Q250 178 306 200" stroke="#3a2614" stroke-width="2.6" fill="none"/>`;
    s += [204, 222, 240, 258, 276, 294].map(x => { const y = 192 - Math.sin((x - 196) / 110 * Math.PI) * 10; return `<path d="M${x - 5} ${y - 6} L${x + 5} ${y + 6} M${x + 5} ${y - 6} L${x - 5} ${y + 6}" stroke="#2a1a0c" stroke-width="2.4"/>`; }).join('');
    s += `<path d="M326 270 Q316 330 282 372" stroke="#3a2614" stroke-width="2.4" fill="none"/>`;
    s += [[322, 290], [314, 316], [302, 340], [288, 362]].map(([x, y]) => `<path d="M${x - 6} ${y - 5} L${x + 6} ${y + 5} M${x + 6} ${y - 5} L${x - 6} ${y + 5}" stroke="#2a1a0c" stroke-width="2.2"/>`).join('');
    // большой нос
    s += `<path d="M246 280 C238 300 228 322 236 336 C244 348 268 346 272 334 C278 320 262 300 256 280Z" fill="#c8a678" stroke="#5a4228" stroke-width="2.2"/>`;
    s += `<ellipse cx="248" cy="318" rx="8" ry="6" fill="#ecd8b0" opacity=".5"/><path d="M238 338 q6 4 12 0 M256 338 q6 4 12 0" stroke="#4a3620" stroke-width="2" fill="none"/>`;
    // борода: длинная, соломенно-седая
    s += `<path d="M176 318 Q182 352 206 360 Q228 350 250 352 Q272 350 294 360 Q318 352 324 318 Q320 360 300 372 Q276 366 250 368 Q224 366 200 372 Q180 360 176 318Z" fill="#d8d0c0" opacity=".9"/>`;
    let bd = `M180 340 Q190 400 212 432 Q226 490 238 560 Q246 600 250 620 Q256 600 264 560 Q276 490 288 432 Q310 400 320 340 Q300 380 284 382 Q266 372 250 374 Q234 372 216 382 Q200 380 188 352Z`;
    s += `<path d="${bd}" fill="url(#bd${u})" stroke="#7a7262" stroke-width="2"/>`;
    for (let k = 0; k < 26; k++) { const x0 = 196 + k * 4.4, sw = Math.sin(k * 1.7) * 10; s += `<path d="M${x0} ${370 + Math.abs(k - 13) * 1.5} Q${x0 + sw} ${470} ${250 + (x0 - 250) * .35} ${560 + (k % 5) * 10}" stroke="${k % 3 ? '#b0a898' : '#f4f0e6'}" stroke-width="1.6" fill="none" opacity=".75"/>`; }
    // зашитый рот поверх бороды
    const my = 372;
    const mpath = { smile: `M222 ${my - 4} Q250 ${my + 14} 278 ${my - 6}`, smug: `M226 ${my + 2} Q252 ${my + 8} 280 ${my - 8}`, angry: `M224 ${my + 6} Q250 ${my - 6} 276 ${my + 6}`, sad: `M226 ${my + 6} Q250 ${my - 4} 274 ${my + 6}`, worried: `M226 ${my + 2} q8 -5 16 0 q8 5 16 0 q8 -5 16 0`, surprised: `M236 ${my - 2} Q250 ${my + 16} 264 ${my - 2} Q250 ${my - 8} 236 ${my - 2}`, sleepy: `M234 ${my} Q250 ${my + 4} 266 ${my}`, neutral: `M226 ${my} Q250 ${my + 6} 274 ${my - 2}` }[e] || `M226 ${my} Q250 ${my + 6} 274 ${my - 2}`;
    s += `<path d="${mpath}" stroke="#2a1a0c" stroke-width="4.2" fill="${e === 'surprised' ? '#2a1a0c' : 'none'}" stroke-linecap="round"/>`;
    s += [232, 244, 256, 268].map(x => `<path d="M${x} ${my - 9} L${x} ${my + 9}" stroke="#2a1a0c" stroke-width="2.2" stroke-linecap="round"/>`).join('');
    // шляпа с широкими полями
    s += `<path d="M118 196 Q120 168 180 160 Q250 150 320 160 Q380 168 384 196 Q384 212 330 210 Q250 202 170 210 Q118 212 118 196Z" fill="url(#h${u})" stroke="#180f08" stroke-width="3"/>`;
    s += `<path d="M178 168 Q172 108 214 84 Q250 70 286 84 Q328 108 322 168 Q250 150 178 168Z" fill="url(#h${u})" stroke="#180f08" stroke-width="3"/>`;
    s += `<path d="M234 82 Q250 104 266 82" stroke="#180f08" stroke-width="3" fill="none"/>`;
    s += `<path d="M180 158 Q250 140 320 158 L322 168 Q250 150 178 168Z" fill="#1e140c"/>`;
    s += `<path d="M118 196 Q120 168 180 160 Q250 150 320 160 Q380 168 384 196" stroke="#8a6440" stroke-width="2" fill="none" opacity=".5"/>`;
    // ворон Карр на плече
    s += `<g transform="translate(388 470)"><path d="M-50 22 Q-20 -40 30 -34 Q62 -28 74 -10 L96 -4 L74 4 Q60 26 26 34 Q-10 44 -50 22Z" fill="#121216"/>` +
      `<path d="M-46 24 Q-78 40 -96 34 Q-74 18 -50 16Z" fill="#121216"/><path d="M-26 6 Q10 -14 46 -6" stroke="#3a3048" stroke-width="3" fill="none"/>` +
      `<path d="M-10 -10 Q20 -28 54 -16" stroke="#4a3a5a" stroke-width="2" fill="none" opacity=".7"/><circle cx="56" cy="-12" r="5" fill="#e8c850"/><circle cx="57" cy="-13" r="1.8" fill="#111"/>` +
      `<path d="M74 -10 L98 -4 L74 2Z" fill="#4a4040"/><path d="M-6 34 l-6 22 M10 34 l4 22" stroke="#a87a8a" stroke-width="4" stroke-linecap="round"/></g>`;
    return s + `</svg>`;
  }

  // ================= АГАТА: отлучённая монахиня =================
  function agata(e) {
    const u = 'ag' + (n++);
    const sk = '#e9e1d8', skd = '#b9aeaa', sk2 = '#8a7a80';
    let s = open(
      `<linearGradient id="f${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f0ea"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${skd}"/></linearGradient>` +
      `<linearGradient id="v${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050506"/><stop offset=".3" stop-color="#1e1c22"/><stop offset=".55" stop-color="#0a0a0c"/><stop offset=".8" stop-color="#26232a"/><stop offset="1" stop-color="#060607"/></linearGradient>` +
      `<linearGradient id="w${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8f2"/><stop offset=".6" stop-color="#e6e0d6"/><stop offset="1" stop-color="#b8b0a4"/></linearGradient>` +
      `<radialGradient id="ir${u}" cx=".5" cy=".65" r=".7"><stop offset="0" stop-color="#6a4a3a"/><stop offset=".6" stop-color="#2e1c16"/><stop offset="1" stop-color="#0c0806"/></radialGradient>` +
      `<linearGradient id="bt${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a0610"/><stop offset=".7" stop-color="#7a0c1a"/><stop offset="1" stop-color="#8e1222"/></linearGradient>` +
      `<clipPath id="fc${u}"><path d="M178 232 C174 296 188 352 214 392 C230 414 242 422 250 422 C258 422 270 414 286 392 C312 352 326 296 322 232 C318 170 290 150 250 150 C210 150 182 170 178 232Z"/></clipPath>` +
      grain('g' + u, .8, 2, .18, 5) + glowF('b' + u, 6)
    );
    const face = `M178 232 C174 296 188 352 214 392 C230 414 242 422 250 422 C258 422 270 414 286 392 C312 352 326 296 322 232 C318 170 290 150 250 150 C210 150 182 170 178 232Z`;
    // чёрное покрывало за спиной
    s += `<path d="M110 640 Q86 420 120 250 Q140 110 250 96 Q360 110 380 250 Q414 420 390 640Z" fill="url(#v${u})"/>`;
    s += `<path d="M140 620 Q120 420 146 270 M360 620 Q380 420 354 270" stroke="#3a3640" stroke-width="3" fill="none" opacity=".6"/>`;
    // чёрное облачение и широкий белый воротник
    s += `<path d="M60 640 Q76 520 150 478 Q200 456 250 458 Q300 456 350 478 Q424 520 440 640Z" fill="#141216"/>`;
    s += `<path d="M118 520 Q150 462 250 458 Q350 462 382 520 Q390 560 350 580 Q300 600 250 600 Q200 600 150 580 Q110 560 118 520Z" fill="url(#w${u})" stroke="#9a9286" stroke-width="2"/>`;
    s += `<path d="M150 540 Q250 568 350 540" stroke="#c8c0b4" stroke-width="2" fill="none"/>`;
    // золотой крестик на груди
    s += `<path d="M250 548 L250 600 M234 562 L266 562" stroke="#c9a24a" stroke-width="7" stroke-linecap="round"/><path d="M250 548 L250 600 M234 562 L266 562" stroke="#f4dc8a" stroke-width="2" stroke-linecap="round"/>`;
    // белый плат вокруг лица
    s += `<path d="M150 250 Q150 140 250 128 Q350 140 350 250 Q352 360 320 430 Q290 476 250 478 Q210 476 180 430 Q148 360 150 250Z" fill="url(#w${u})" stroke="#a8a094" stroke-width="2.4"/>`;
    s += `<path d="M164 250 Q166 160 250 148 Q334 160 336 250" stroke="#ffffff" stroke-width="3" fill="none" opacity=".6"/>`;
    // лицо: мертвенно-бледное
    s += `<path d="${face}" fill="url(#f${u})" stroke="#9a8e8c" stroke-width="2"/>`;
    s += `<g clip-path="url(#fc${u})"><rect x="170" y="140" width="160" height="290" fill="#7a6a70" filter="url(#g${u})" opacity=".5"/>`;
    s += `<path d="M300 160 Q340 240 326 320 Q312 396 262 430 L340 440 L344 150Z" fill="${sk2}" opacity=".3"/>`;
    s += `<path d="M170 200 Q250 178 330 200 L330 150 L170 150Z" fill="${sk2}" opacity=".35"/></g>`;
    // чёрный крестик на лбу
    s += `<path d="M250 190 L250 218 M240 199 L260 199" stroke="#141014" stroke-width="4.2" stroke-linecap="round"/>`;
    // брови
    const bt = { angry: [10, -4], worried: [-8, 6], sad: [-8, 6], surprised: [-12, -12], smug: [0, 0] }[e] || [0, 0];
    for (const sd of [-1, 1]) {
      const cx = 250 + sd * 40, up = e === 'smug' && sd > 0 ? -7 : 0;
      s += `<path d="M${cx - sd * 20} ${236 + bt[0] + up} Q${cx + sd * 2} ${226 + bt[1] * .5 + up} ${cx + sd * 26} ${232 + bt[1] + up}" stroke="#140e10" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    }
    // глаза: тёмные круги, тёмная радужка
    for (const sd of [-1, 1]) {
      const cx = 250 + sd * 40, cy = 266;
      s += `<ellipse cx="${cx}" cy="${cy + 2}" rx="36" ry="26" fill="#140c10" opacity=".78" filter="url(#b${u})"/><ellipse cx="${cx}" cy="${cy + 12}" rx="26" ry="8" fill="#6a1018" opacity=".45" filter="url(#b${u})"/>`;
      let h = 11; if (e === 'surprised') h = 15; if (e === 'smug' || e === 'sleepy') h = 6; if (e === 'angry') h = 8;
      const tin = e === 'angry' ? -4 : (e === 'sad' || e === 'worried') ? 4 : 0;
      if (e === 'smile') { s += `<path d="M${cx - 22} ${cy + 3} Q${cx} ${cy - 12} ${cx + 22} ${cy + 3}" stroke="#1a1012" stroke-width="4.5" fill="none" stroke-linecap="round"/>`; }
      else {
        const top = `M${cx - sd * 22} ${cy + 2 - tin * .5} C${cx - sd * 10} ${cy - h * 1.2 + tin * .4} ${cx + sd * 12} ${cy - h * 1.25} ${cx + sd * 23} ${cy}`;
        const bot = `C${cx + sd * 12} ${cy + h * .8} ${cx - sd * 12} ${cy + h * .8} ${cx - sd * 22} ${cy + 2 - tin * .5}Z`;
        s += `<clipPath id="e${u}${sd}"><path d="${top} ${bot}"/></clipPath><path d="${top} ${bot}" fill="#efe2dc"/>`;
        s += `<g clip-path="url(#e${u}${sd})"><circle cx="${cx}" cy="${cy + 1}" r="10" fill="url(#ir${u})"/><circle cx="${cx}" cy="${cy + 1}" r="4.4" fill="#050303"/><circle cx="${cx - 3.5}" cy="${cy - 3}" r="2.6" fill="#fff" opacity=".9"/>` +
          `<path d="M${cx - 24} ${cy - h * 1.3} L${cx + 24} ${cy - h * 1.3} L${cx + 24} ${cy - h * .3} Q${cx} ${cy} ${cx - 24} ${cy - h * .3}Z" fill="#4a2a2a" opacity=".3"/></g>`;
        s += `<path d="${top}" stroke="#140c0e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${cx + sd * 23} ${cy} q${sd * 8} -3 ${sd * 11} -9" stroke="#140c0e" stroke-width="2.4" fill="none"/>`;
        s += `<path d="M${cx + sd * 20} ${cy + 4} C${cx + sd * 10} ${cy + h + 2} ${cx - sd * 10} ${cy + h + 2} ${cx - sd * 20} ${cy + 5}" stroke="#7a3a40" stroke-width="2" fill="none" opacity=".8"/>`;
      }
    }
    // трещины, как кракелюр на старой иконе: каждая распознанная ложь — новая трещина
    const more = e === 'sad' || e === 'worried';
    for (const sd of [-1, 1]) {
      const x = 250 + sd * 36, P = (dx, y) => `${x + sd * dx} ${y}`;
      const lines = [
        [`M${P(0, 280)} L${P(-3, 292)} L${P(2, 303)} L${P(-1, 316)} L${P(4, 330)}`, 1.7],
        [`M${P(2, 303)} L${P(10, 311)} L${P(13, 320)}`, 1.1],
        [`M${P(12, 282)} L${P(15, 294)} L${P(12, 305)} L${P(17, 318)}`, 1.4],
        [`M${P(15, 294)} L${P(22, 300)}`, 1]
      ];
      if (more) lines.push([`M${P(-1, 316)} L${P(-8, 326)} L${P(-6, 338)}`, 1.1]);
      for (const [d, w] of lines) {
        s += `<path d="${d}" transform="translate(1 0.6)" stroke="#ffffff" stroke-width="${(w * .6).toFixed(2)}" fill="none" opacity=".45" stroke-linejoin="bevel"/>`;
        s += `<path d="${d}" stroke="#1c0c12" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="bevel"/>`;
      }
    }
    // нос
    s += `<path d="M256 282 C260 300 262 312 256 320 C252 324 246 324 242 321" fill="none" stroke="#9a8a8a" stroke-width="2.2" stroke-linecap="round"/><path d="M240 322 q3 2 6 0 M254 322 q3 2 6 0" stroke="#8a7a7a" stroke-width="1.6" fill="none"/>`;
    // губы: бледные
    const y = 358, lip = '#4a0c16', ln = '#24060c';
    const mouths = {
      smile: `<path d="M226 ${y - 4} Q250 ${y + 16} 274 ${y - 4} Q250 ${y + 4} 226 ${y - 4}Z" fill="#6a2a30"/><path d="M226 ${y - 4} Q250 ${y + 4} 274 ${y - 4}" stroke="${lip}" stroke-width="3" fill="none"/>`,
      surprised: `<ellipse cx="250" cy="${y + 3}" rx="9" ry="12" fill="#4a1a20"/><ellipse cx="250" cy="${y + 3}" rx="9" ry="12" fill="none" stroke="${lip}" stroke-width="2.4"/>`,
      angry: `<path d="M230 ${y + 5} Q250 ${y - 5} 270 ${y + 5}" stroke="${ln}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
      sad: `<path d="M232 ${y + 5} Q250 ${y - 4} 268 ${y + 5}" stroke="${ln}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
      worried: `<path d="M232 ${y + 2} q6 -4 12 0 q6 4 12 0 q6 -4 12 0" stroke="${ln}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      smug: `<path d="M232 ${y + 2} Q252 ${y + 6} 272 ${y - 6}" stroke="${ln}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    };
    s += mouths[e] || `<path d="M234 ${y} Q242 ${y - 5} 250 ${y - 2} Q258 ${y - 5} 266 ${y} Q250 ${y + 4} 234 ${y}Z" fill="${lip}"/><path d="M236 ${y + 1} Q250 ${y + 11} 264 ${y + 1} Q250 ${y + 4} 236 ${y + 1}Z" fill="#5e1020"/><ellipse cx="246" cy="${y + 5}" rx="5" ry="1.6" fill="#c88a92" opacity=".55"/><path d="M234 ${y} Q250 ${y + 4} 266 ${y}" stroke="${ln}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    // чёрный край покрывала над платом
    s += `<path d="M138 250 Q132 120 250 104 Q368 120 362 250 Q350 150 250 140 Q150 150 138 250Z" fill="url(#v${u})"/>`;
    return s + `</svg>`;
  }

  // ================= ТИБО: цилиндр и маска арлекина =================
  function tibo(e) {
    const u = 'tb' + (n++);
    let s = open(
      `<linearGradient id="hat${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050506"/><stop offset=".3" stop-color="#2a2a30"/><stop offset=".45" stop-color="#0c0c0e"/><stop offset=".8" stop-color="#1a1a1e"/><stop offset="1" stop-color="#040405"/></linearGradient>` +
      `<linearGradient id="sat${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a0a0c"/><stop offset=".4" stop-color="#2c2c32"/><stop offset="1" stop-color="#060607"/></linearGradient>` +
      `<linearGradient id="gl${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".32"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>` +
      `<linearGradient id="gd${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc8a"/><stop offset=".5" stop-color="#c9a24a"/><stop offset="1" stop-color="#7a5a20"/></linearGradient>` +
      `<pattern id="hq${u}" width="56" height="74" patternUnits="userSpaceOnUse" patternTransform="translate(250 290)"><rect width="56" height="74" fill="#140f12"/><path d="M28 0 L56 37 L28 74 L0 37Z" fill="#6e1a20"/><path d="M28 0 L56 37 L28 74 L0 37Z" fill="none" stroke="url(#gd${u})" stroke-width="2.6"/></pattern>` +
      `<radialGradient id="ir${u}" cx=".5" cy=".65" r=".7"><stop offset="0" stop-color="#c8a050"/><stop offset=".55" stop-color="#6a4a22"/><stop offset="1" stop-color="#1a1008"/></radialGradient>` +
      `<clipPath id="mk${u}"><path d="M176 220 C168 290 180 352 210 396 C226 418 240 428 250 428 C260 428 274 418 290 396 C320 352 332 290 324 220 C318 168 290 150 250 150 C210 150 182 168 176 220Z"/></clipPath>`
    );
    const mask = `M176 220 C168 290 180 352 210 396 C226 418 240 428 250 428 C260 428 274 418 290 396 C320 352 332 290 324 220 C318 168 290 150 250 150 C210 150 182 168 176 220Z`;
    // фрак, жабо, бабочка
    s += `<path d="M40 640 Q54 520 140 476 Q196 452 250 454 Q304 452 360 476 Q446 520 460 640Z" fill="url(#sat${u})"/>`;
    s += `<path d="M196 462 L250 600 L304 462 Q330 470 340 480 L260 640 L240 640 L160 480 Q170 470 196 462Z" fill="#f4f0ea"/>`;
    for (let k = 0; k < 5; k++) s += `<path d="M${226 - k * 2} ${490 + k * 26} Q250 ${506 + k * 26} ${274 + k * 2} ${490 + k * 26}" stroke="#cfc8bc" stroke-width="3" fill="none"/>`;
    s += `<path d="M160 480 L240 640 L120 640 Q120 560 160 480Z M340 480 L260 640 L380 640 Q380 560 340 480Z" fill="#0c0c0e"/>`;
    s += `<path d="M162 486 L228 620 M338 486 L272 620" stroke="#3a3a44" stroke-width="3" opacity=".7"/>`;
    s += `<path d="M212 456 L250 474 L212 492Z M288 456 L250 474 L288 492Z" fill="#0a0a0c" stroke="#2a2a30" stroke-width="2"/><circle cx="250" cy="474" r="8" fill="#141418"/>`;
    // шея
    s += `<path d="M218 400 L282 400 L290 462 Q250 476 210 462Z" fill="#c8a084"/><path d="M218 400 L282 400 L286 430 Q250 446 214 430Z" fill="#8a6450" opacity=".5"/>`;
    // маска арлекина
    s += `<path d="${mask}" fill="url(#hq${u})"/>`;
    s += `<g clip-path="url(#mk${u})"><path d="${mask}" fill="url(#gl${u})"/><path d="M300 160 Q344 240 330 320 Q314 400 262 432 L344 440 L350 150Z" fill="#000" opacity=".3"/></g>`;
    s += `<path d="${mask}" fill="none" stroke="url(#gd${u})" stroke-width="5"/>`;
    // прорези глаз в золотых ободках, живые глаза внутри
    for (const sd of [-1, 1]) {
      const cx = 250 + sd * 44, cy = 270;
      let h = 16; if (e === 'surprised') h = 21; if (e === 'smug') h = sd > 0 ? 9 : 12; if (e === 'angry') h = 11; if (e === 'sleepy') h = 7;
      const tin = e === 'angry' ? -6 : (e === 'sad' || e === 'worried') ? 6 : 0;
      const hole = `M${cx - sd * 28} ${cy + 4 - tin * .6} C${cx - sd * 14} ${cy - h - 6 + tin * .4} ${cx + sd * 18} ${cy - h - 8} ${cx + sd * 32} ${cy - 6} C${cx + sd * 18} ${cy + h * .7} ${cx - sd * 12} ${cy + h * .8} ${cx - sd * 28} ${cy + 4 - tin * .6}Z`;
      s += `<clipPath id="eh${u}${sd}"><path d="${hole}"/></clipPath><path d="${hole}" fill="#120a08"/>`;
      if (e !== 'smile') s += `<g clip-path="url(#eh${u}${sd})"><ellipse cx="${cx + sd * 2}" cy="${cy - 2}" rx="21" ry="${Math.max(5, h * .8)}" fill="#efe4d6"/><circle cx="${cx + sd * 2}" cy="${cy - 1}" r="10" fill="url(#ir${u})"/><circle cx="${cx + sd * 2}" cy="${cy - 1}" r="4.4" fill="#070403"/><circle cx="${cx - 1}" cy="${cy - 5}" r="2.6" fill="#fff"/></g>`;
      else s += `<g clip-path="url(#eh${u}${sd})"><path d="M${cx - 18} ${cy + 2} Q${cx} ${cy - 10} ${cx + 18} ${cy + 2}" stroke="#efe4d6" stroke-width="3" fill="none"/></g>`;
      s += `<path d="${hole}" fill="none" stroke="url(#gd${u})" stroke-width="5.5"/><path d="${hole}" fill="none" stroke="#fff3c4" stroke-width="1.4" opacity=".6"/>`;
    }
    // нарисованный рот маски
    const y = 372;
    const mouth = {
      smile: `M222 ${y - 6} Q250 ${y + 18} 278 ${y - 6} Q250 ${y + 6} 222 ${y - 6}Z`, smug: `M226 ${y + 2} Q254 ${y + 10} 280 ${y - 10} Q256 ${y + 2} 226 ${y + 2}Z`,
      angry: `M228 ${y + 6} Q250 ${y - 6} 272 ${y + 6} Q250 ${y} 228 ${y + 6}Z`, sad: `M230 ${y + 6} Q250 ${y - 4} 270 ${y + 6} Q250 ${y + 2} 230 ${y + 6}Z`,
      surprised: `M238 ${y} Q250 ${y - 14} 262 ${y} Q250 ${y + 16} 238 ${y}Z`
    }[e] || `M228 ${y} Q250 ${y + 8} 272 ${y - 2} Q250 ${y + 3} 228 ${y}Z`;
    s += `<path d="${mouth}" fill="#2a0808" stroke="url(#gd${u})" stroke-width="3"/>`;
    // нос маски — гребень с бликом
    s += `<path d="M250 268 L242 330 Q250 340 258 330Z" fill="#000" opacity=".25"/><path d="M252 270 L256 326" stroke="#fff" stroke-width="2" opacity=".3"/>`;
    // цилиндр с картой за лентой
    s += `<path d="M120 182 Q122 158 180 152 Q250 144 320 152 Q378 158 380 182 Q380 200 320 196 Q250 190 180 196 Q120 200 120 182Z" fill="url(#hat${u})" stroke="#000" stroke-width="2"/>`;
    s += `<path d="M180 160 L184 30 Q250 14 316 30 L320 160 Q250 146 180 160Z" fill="url(#hat${u})" stroke="#000" stroke-width="2"/>`;
    s += `<ellipse cx="250" cy="28" rx="66" ry="12" fill="#1a1a1e" stroke="#000" stroke-width="2"/>`;
    s += `<path d="M182 128 Q250 116 318 128 L319 150 Q250 138 181 150Z" fill="#3a0e12"/><path d="M182 128 Q250 116 318 128" stroke="#7a2a30" stroke-width="2" fill="none"/>`;
    s += `<g transform="rotate(12 290 100)"><rect x="268" y="62" width="44" height="62" rx="4" fill="#f8f4ec" stroke="#2a2a2a" stroke-width="1.6"/><text x="275" y="80" font-size="15" font-family="Georgia" fill="#b02a2a">A</text><path d="M290 102 c-8 -6 -8 -14 0 -10 c8 -4 8 4 0 10Z" fill="#b02a2a"/></g>`;
    s += `<path d="M192 40 Q196 100 192 150" stroke="#4a4a52" stroke-width="5" fill="none" opacity=".55"/>`;
    // веер карт в руке
    s += `<g transform="translate(398 560)">` + [-24, -8, 8, 24].map((a, i) => `<g transform="rotate(${a})"><rect x="-22" y="-74" width="44" height="62" rx="4" fill="#fbf8f2" stroke="#2a2a2a" stroke-width="1.6"/><text x="-16" y="-56" font-size="14" font-family="Georgia" fill="${i % 2 ? '#1a1a1a' : '#b02a2a'}">${['A', 'K', 'Q', 'J'][i]}</text></g>`).join('') + `</g>`;
    return s + `</svg>`;
  }

  const HP = { rowen, miron, agata, tibo };
  window.portraitSVG = function (id, expr) { return HP[id] ? HP[id](expr || 'neutral') : base(id, expr); };
})();
