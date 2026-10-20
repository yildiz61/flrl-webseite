// Erzeugt die Aquarell-Illustrationen (img/*.svg) und fügt die Torte in index.html ein.
// Aufruf: node scripts/aquarell.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (name, svg) => writeFileSync(join(root, 'img', name), svg.replace(/\n\s*/g, '\n'));

// ---------- Hilfsfunktionen ----------
let seed = 7;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (a, b) => a + rand() * (b - a);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const f = (n) => Math.round(n * 10) / 10;
const rad = (deg) => (deg * Math.PI) / 180;
const pt = (cx, cy, r, deg) => [f(cx + Math.cos(rad(deg)) * r), f(cy + Math.sin(rad(deg)) * r)];

// Filter der japanischen Aquarelltechnik:
// wc    – Lasur mit nassem Rand (Farbe sammelt sich am Rand), Papierkörnung
// bleed – Nass-in-Nass: weich ausblutende Farbwolke
// ink   – Sumi-Pinselstrich mit leicht ausfransender Kante
const filters = (p = '', s = 3) => `
<filter id="${p}wc" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="${s}" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="14" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feGaussianBlur in="shape" stdDeviation="1.1" result="soft"/>
  <feMorphology in="soft" operator="erode" radius="2.5" result="inner"/>
  <feGaussianBlur in="inner" stdDeviation="5" result="innerSoft"/>
  <feComposite in="soft" in2="innerSoft" operator="arithmetic" k2="1" k3="-0.45" result="pool"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="${s + 4}" result="grain"/>
  <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.9 0 0 0 1.28" result="grainA"/>
  <feComposite in="pool" in2="grainA" operator="in"/>
</filter>
<filter id="${p}bleed" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="${s + 1}" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="46" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feGaussianBlur in="shape" stdDeviation="7" result="soft"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="${s + 2}" result="grain"/>
  <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.2 0 0 0 1.4" result="grainA"/>
  <feComposite in="soft" in2="grainA" operator="in"/>
</filter>
<filter id="${p}ink" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${s + 3}" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="4" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feGaussianBlur in="shape" stdDeviation="0.45"/>
</filter>`;

const svg = (vb, body, s = 3) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">
<defs>${filters('', s)}</defs>
<g style="mix-blend-mode:multiply">${body}</g>
</svg>
`;

// Lasur-Fläche (Pfad) mit Aquarellfilter
const wash = (d, fill, op = 0.8, filter = 'wc', extra = '') =>
  `<path d="${d}" fill="${fill}" fill-opacity="${op}" filter="url(#${filter})" style="mix-blend-mode:multiply"${extra}/>`;
const blob = (cx, cy, rx, ry, fill, op = 0.5, filter = 'bleed') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" fill-opacity="${op}" filter="url(#${filter})" style="mix-blend-mode:multiply"/>`;
const stroke = (d, color, w, op = 0.9, filter = 'ink') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${op}" filter="url(#${filter})"/>`;

// Blütenblätter (zeigen nach oben, Ursprung = Blütenmitte)
const petalRound = (l, w) =>
  `M0 0C${f(w)} ${f(-l * 0.25)} ${f(w * 1.15)} ${f(-l * 0.82)} 0 ${f(-l)}C${f(-w * 1.15)} ${f(-l * 0.82)} ${f(-w)} ${f(-l * 0.25)} 0 0Z`;
const petalSakura = (l, w) =>
  `M0 0C${f(w)} ${f(-l * 0.3)} ${f(w * 1.08)} ${f(-l * 0.78)} ${f(w * 0.36)} ${f(-l)}L0 ${f(-l * 0.86)}L${f(-w * 0.36)} ${f(-l)}C${f(-w * 1.08)} ${f(-l * 0.78)} ${f(-w)} ${f(-l * 0.3)} 0 0Z`;
const petalPoint = (l, w) =>
  `M0 0C${f(w)} ${f(-l * 0.3)} ${f(w * 0.8)} ${f(-l * 0.75)} 0 ${f(-l)}C${f(-w * 0.8)} ${f(-l * 0.75)} ${f(-w)} ${f(-l * 0.3)} 0 0Z`;
const leafPath = (l, w) =>
  `M0 0C${f(w)} ${f(-l * 0.2)} ${f(w * 0.9)} ${f(-l * 0.7)} 0 ${f(-l)}C${f(-w * 0.7)} ${f(-l * 0.65)} ${f(-w)} ${f(-l * 0.25)} 0 0Z`;

const ring = (cx, cy, n, shape, l, w, colors, rot = 0, op = [0.55, 0.8], filter = 'wc') => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = rot + (360 / n) * i + between(-7, 7);
    const ll = l * between(0.88, 1.08);
    s += `<path d="${shape(ll, w * between(0.9, 1.1))}" transform="translate(${cx} ${cy}) rotate(${f(a)})" fill="${pick(colors)}" fill-opacity="${f(between(...op) * 100) / 100}" filter="url(#${filter})" style="mix-blend-mode:multiply"/>`;
  }
  return s;
};
const stamens = (cx, cy, r, color, dot, n = 12) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = between(0, 360);
    const rr = r * between(0.6, 1);
    const [x, y] = pt(cx, cy, rr, a);
    s += `<path d="M${cx} ${cy}L${x} ${y}" stroke="${color}" stroke-width="1.2" stroke-opacity=".7" filter="url(#ink)"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${f(between(1.6, 2.8))}" fill="${dot}" fill-opacity=".85" filter="url(#ink)"/>`;
  }
  return s;
};

const PEONY = ['#e8a3b0', '#d98597', '#f0bfc4', '#e494a4'];
const SAKURA = ['#f4c9d1', '#ecb2c0', '#f7d8dc'];
const APRICOT = ['#f0b597', '#e89d7f', '#f5c9ad'];
const LAVENDER = ['#b7a8d3', '#a293c4', '#c9bde0'];
const SAGE = ['#8fa889', '#7f9a7e', '#a3b898'];

const peony = (cx, cy, r, rot = 0, colors = PEONY) =>
  ring(cx, cy, 9, petalRound, r, r * 0.55, colors, rot) +
  ring(cx, cy, 7, petalRound, r * 0.7, r * 0.42, colors, rot + 20) +
  ring(cx, cy, 5, petalRound, r * 0.42, r * 0.3, colors, rot + 40, [0.7, 0.9]) +
  stamens(cx, cy, r * 0.22, '#b8914b', '#c99a3e', 9);
const sakura = (cx, cy, r, rot = 0) =>
  ring(cx, cy, 5, petalSakura, r, r * 0.62, SAKURA, rot, [0.6, 0.85]) +
  stamens(cx, cy, r * 0.45, '#b45a72', '#a8475f', 10);
const leaf = (x, y, l, a, colors = SAGE) =>
  `<path d="${leafPath(l, l * 0.38)}" transform="translate(${x} ${y}) rotate(${a})" fill="${pick(colors)}" fill-opacity=".75" filter="url(#wc)" style="mix-blend-mode:multiply"/>` +
  `<path d="M0 0L0 ${-l * 0.9}" transform="translate(${x} ${y}) rotate(${a})" stroke="#5f7a5c" stroke-width="1" stroke-opacity=".45" filter="url(#ink)"/>`;
const looseSakuraPetal = (x, y, s, a) =>
  `<path d="${petalSakura(s, s * 0.62)}" transform="translate(${x} ${y}) rotate(${a})" fill="${pick(SAKURA)}" fill-opacity=".8" filter="url(#wc)"/>`;

// ---------- Hintergrund-Blüten (je drei Lagen, die nacheinander aufblühen) ----------
const bloomTypes = {
  peony: [
    () => ring(0, 0, 8, leafPath, 112, 30, SAGE, 22, [0.35, 0.5]) + ring(0, 0, 10, petalRound, 98, 50, PEONY, 0, [0.45, 0.65]),
    () => ring(0, 0, 8, petalRound, 66, 36, PEONY, 18, [0.55, 0.75]),
    () => ring(0, 0, 5, petalRound, 34, 22, PEONY, 36, [0.7, 0.9]) + stamens(0, 0, 14, '#b8914b', '#c99a3e', 10),
  ],
  sakura: [
    () => ring(0, 0, 5, petalSakura, 100, 66, SAKURA, 0, [0.5, 0.7]),
    () => ring(0, 0, 5, petalSakura, 62, 42, SAKURA, 36, [0.45, 0.65]),
    () => stamens(0, 0, 34, '#b45a72', '#a8475f', 16),
  ],
  anemone: [
    () => ring(0, 0, 6, leafPath, 110, 34, SAGE, 30, [0.3, 0.45]) + ring(0, 0, 6, petalRound, 96, 56, LAVENDER, 0, [0.45, 0.65]),
    () => ring(0, 0, 6, petalRound, 60, 36, LAVENDER, 30, [0.5, 0.7]),
    () => `<circle r="16" fill="#3b2f3a" fill-opacity=".85" filter="url(#wc)"/>` + stamens(0, 0, 30, '#3b2f3a', '#3b2f3a', 18),
  ],
  apricot: [
    () => ring(0, 0, 11, petalPoint, 100, 40, APRICOT, 0, [0.4, 0.6]),
    () => ring(0, 0, 9, petalRound, 68, 34, APRICOT, 16, [0.5, 0.7]),
    () => ring(0, 0, 6, petalRound, 36, 22, ['#e48f78', '#efa58c'], 30, [0.65, 0.85]) + stamens(0, 0, 12, '#b8914b', '#b8914b', 8),
  ],
};
let s0 = 11;
for (const [name, layers] of Object.entries(bloomTypes)) {
  layers.forEach((layer, i) => {
    seed = s0++ * 97;
    out(`bloom-${name}-${i + 1}.svg`, svg('-125 -125 250 250', layer(), s0));
  });
}

// ---------- Logo / Favicon ----------
seed = 5;
out('logo.svg', svg('-60 -60 120 120',
  ring(0, 0, 5, petalSakura, 48, 32, ['#d98597', '#e494a4'], -90 + 36, [0.75, 0.9]) +
  stamens(0, 0, 18, '#6e2330', '#6e2330', 10), 4));

// ---------- Hero: Cappuccino zwischen Pfingstrosen, Kirschzweig ----------
seed = 21;
const branch = [
  stroke('M-10 128C80 104 170 100 250 82S420 40 650 52', '#3a2a26', 11, 0.85),
  stroke('M250 82C285 52 300 34 340 18', '#3a2a26', 6, 0.8),
  stroke('M410 55C440 78 470 86 520 92', '#3a2a26', 5, 0.8),
  stroke('M120 106C130 80 150 66 176 58', '#3a2a26', 4, 0.75),
].join('');
const blossoms = [[60, 118, 26, 10], [118, 92, 22, 40], [178, 62, 20, 5], [205, 104, 28, 60], [300, 46, 24, 18],
  [338, 20, 18, 50], [372, 70, 26, 4], [452, 60, 22, 33], [520, 92, 24, 12], [590, 46, 26, 48], [262, 80, 16, 20]]
  .map(([x, y, r, a]) => sakura(x, y, r, a)).join('');
const buds = [[150, 100], [240, 70], [420, 40], [560, 70], [480, 84]].map(([x, y]) =>
  `<ellipse cx="${x}" cy="${y}" rx="6" ry="9" fill="#d98597" fill-opacity=".85" filter="url(#wc)"/>`).join('');
const cup = [
  // Untertasse
  `<path d="M110 512C110 478 210 458 320 458S530 478 530 512C530 548 430 566 320 566S110 548 110 512Z" fill="#f4ece2" filter="url(#ink)"/>`,
  wash('M110 512C110 478 210 458 320 458S530 478 530 512C530 548 430 566 320 566S110 548 110 512Z', '#efe4d8', 0.95),
  wash('M130 522C180 552 260 560 320 560S470 550 512 520C480 546 400 558 320 558S170 546 130 522Z', '#b99c8c', 0.55),
  wash('M200 500C200 486 255 478 320 478S440 486 440 500C440 514 385 522 320 522S200 514 200 500Z', '#cdb4a4', 0.55),
  stroke('M110 512C110 478 210 458 320 458S530 478 530 512C530 548 430 566 320 566S110 548 110 512Z', '#7d6458', 2.2, 0.55),
  // Tasse (deckende Grundierung, darauf Lasuren)
  `<path d="M150 330C150 452 228 512 320 512S490 452 490 330C490 358 414 378 320 378S150 358 150 330Z" fill="#fbf7f1" filter="url(#ink)"/>`,
  wash('M150 330C150 452 228 512 320 512S490 452 490 330Z', '#fbf7f1', 1),
  wash('M380 336C450 344 486 352 488 336C486 440 430 504 330 510C404 484 430 420 380 336Z', '#b7a6ad', 0.6),
  wash('M152 340C160 430 214 490 290 506C230 480 196 420 190 344Z', '#e9dcd6', 0.6),
  wash('M164 380C230 408 410 408 476 380C472 398 466 410 460 420C400 444 240 444 180 420C174 410 168 396 164 380Z', '#d98597', 0.62),
  ring(214, 420, 5, petalSakura, 13, 9, ['#fbf7f1'], 10, [0.9, 1]),
  ring(320, 432, 5, petalSakura, 13, 9, ['#fbf7f1'], 30, [0.9, 1]),
  ring(426, 420, 5, petalSakura, 13, 9, ['#fbf7f1'], 50, [0.9, 1]),
  stroke('M150 332C152 452 228 512 320 512S488 452 490 332', '#6e5248', 2.6, 0.7),
  // Henkel
  stroke('M484 368C562 346 572 448 468 452', '#efe5da', 22, 1, 'wc'),
  stroke('M486 360C566 340 580 456 466 462', '#6e5248', 2.2, 0.6),
  stroke('M488 384C540 376 542 434 474 440', '#6e5248', 2, 0.55),
  // Kaffee
  wash('M150 330C150 302 226 282 320 282S490 302 490 330C490 358 414 378 320 378S150 358 150 330Z', '#f7f0e7', 1),
  wash('M168 332C168 310 238 295 320 295S472 310 472 332C472 354 402 367 320 367S168 354 168 332Z', '#7a4a2e', 0.95),
  wash('M182 333C182 315 248 304 320 304S458 315 458 333C458 351 392 360 320 360S182 351 182 333Z', '#a86f43', 0.9),
  // Latte Art (Herz)
  wash('M320 352C290 340 258 330 262 318C266 306 296 304 320 318C344 304 374 306 378 318C382 330 350 340 320 352Z', '#f6ead9', 0.98),
  wash('M320 340C304 334 290 328 292 321C294 314 308 314 320 322C332 314 346 314 348 321C350 328 336 334 320 340Z', '#c2895a', 0.5),
  stroke('M320 300L320 356', '#c2895a', 2, 0.6),
  stroke('M150 330C150 302 226 282 320 282S490 302 490 330C490 358 414 378 320 378S150 358 150 330Z', '#6e5248', 2.4, 0.65),
].join('');
const steam = [
  stroke('M290 270C270 240 310 220 290 186S300 140 286 120', '#bfa9a2', 6, 0.28, 'bleed'),
  stroke('M336 268C356 238 320 214 344 182S336 140 352 112', '#bfa9a2', 7, 0.24, 'bleed'),
].join('');
out('hero-kaffee.svg', svg('0 0 640 640',
  blob(330, 360, 270, 240, '#f0c9c9', 0.45) + blob(150, 520, 170, 110, '#b9c9ad', 0.35) + blob(540, 230, 120, 120, '#f3d9c4', 0.4) +
  branch + buds + blossoms +
  ring(108, 430, 7, leafPath, 120, 40, SAGE, -60, [0.5, 0.7]) +
  peony(120, 420, 105, 10) +
  cup + steam +
  ring(560, 520, 5, leafPath, 90, 32, SAGE, 200, [0.5, 0.7]) +
  peony(560, 500, 72, 30, APRICOT) +
  sakura(470, 560, 24, 12) + sakura(214, 566, 20, 40) +
  looseSakuraPetal(600, 330, 22, 30) + looseSakuraPetal(70, 270, 18, -40) + looseSakuraPetal(250, 600, 16, 80) + looseSakuraPetal(420, 210, 14, 140),
  9));

// ---------- Kleine Karte: Vignetten (400 × 320) ----------
const vignette = (name, s, tint, body, accent = true) => {
  seed = s * 31;
  const extra = accent ? sakura(between(330, 360), between(56, 80), 18, between(0, 60)) + looseSakuraPetal(between(40, 70), between(250, 280), 14, between(0, 180)) : '';
  out(`karte-${name}.svg`, svg('0 0 400 320', blob(200, 170, 165, 115, tint, 0.45) + body() + extra, s));
};

vignette('avocado', 3, '#d9e2c4', () => {
  let s = wash('M70 196C58 124 120 92 200 94C292 96 348 126 336 196C328 240 288 252 200 252C110 252 78 240 70 196Z', '#c38a52', 0.9);
  s += wash('M88 194C80 136 132 112 200 113C274 115 322 138 314 194C308 228 276 236 200 236C122 236 94 228 88 194Z', '#ecd3a6', 0.9);
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 32;
    s += `<g transform="translate(${x} 176) rotate(${-24 + i * 9})">` +
      wash('M-14 -40C6 -42 18 -14 14 16C10 38 -6 44 -14 40C-2 22 2 -18 -14 -40Z', '#9fb46c', 0.9) +
      stroke('M-12 -38C4 -38 14 -14 12 14C10 34 -2 40 -12 38', '#6f8a3f', 2.4, 0.8) + '</g>';
  }
  for (let i = 0; i < 26; i++) s += `<circle cx="${f(between(110, 300))}" cy="${f(between(140, 220))}" r="${f(between(1.4, 2.6))}" fill="${pick(['#b4392f', '#c75a35', '#f2e8d4', '#3a2a26'])}" fill-opacity=".85" filter="url(#ink)"/>`;
  s += leaf(250, 150, 34, -50, ['#7d9b52', '#93ad62']) + leaf(258, 150, 30, 10, ['#7d9b52', '#93ad62']);
  return s;
});

vignette('croissant', 4, '#f3dcc0', () => {
  let s = '';
  const segs = [[110, 200, 34, 26, -40], [148, 176, 44, 34, -22], [200, 166, 52, 40, 0], [252, 176, 44, 34, 22], [290, 200, 34, 26, 40]];
  segs.forEach(([x, y, rx, ry, a]) => {
    s += `<g transform="translate(${x} ${y}) rotate(${a})">` +
      wash(`M${-rx} 0C${-rx} ${-ry} ${rx} ${-ry} ${rx} 0C${rx} ${ry * 0.8} ${-rx} ${ry * 0.8} ${-rx} 0Z`, '#d6964f', 0.9) +
      wash(`M${-rx * 0.6} ${-ry * 0.2}C${-rx * 0.4} ${-ry * 0.7} ${rx * 0.4} ${-ry * 0.7} ${rx * 0.6} ${-ry * 0.2}`, '#f2c98b', 0.7) +
      stroke(`M${-rx * 0.15} ${-ry * 0.75}C${-rx * 0.25} 0 ${-rx * 0.1} ${ry * 0.5} 0 ${ry * 0.7}`, '#9a5a2c', 2.2, 0.6) + '</g>';
  });
  s += wash('M96 236C150 254 250 254 304 236C280 250 240 258 200 258S124 250 96 236Z', '#b9a596', 0.5);
  return s;
});

vignette('panini', 5, '#ead9c4', () => {
  let s = '';
  // hintere Hälfte
  s += wash('M96 150L250 104L300 160L140 206Z', '#e2b475', 0.9);
  // Füllung
  s += wash('M128 210C150 200 170 214 194 202S240 196 262 186S292 176 306 168L310 180L136 226Z', '#83a15a', 0.85);
  s += wash('M140 220L300 176L304 190L146 234Z', '#c9463c', 0.75);
  s += wash('M146 230L304 186L306 196L150 242Z', '#f4ecdc', 0.9);
  // vordere Hälfte
  s += wash('M120 238L300 190L320 236L150 282Z', '#dcab6c', 0.92);
  for (let i = 0; i < 5; i++) s += stroke(`M${150 + i * 32} ${272 - i * 8.5}L${142 + i * 32} ${246 - i * 8.5}`, '#7a4a2a', 4, 0.55);
  for (let i = 0; i < 4; i++) s += stroke(`M${130 + i * 34} ${188 - i * 10}L${164 + i * 34} ${152 - i * 10}`, '#7a4a2a', 4, 0.45);
  s += leaf(304, 176, 30, 60, ['#6f9a4f']) + leaf(130, 214, 26, -70, ['#6f9a4f']);
  return s;
});

vignette('tiramisu', 6, '#ead6c8', () => {
  let s = wash('M70 250C70 232 130 220 200 220S330 232 330 250C330 268 270 280 200 280S70 268 70 250Z', '#efe5da', 0.95);
  s += wash('M120 132L250 112L300 142L170 166Z', '#5d3a29', 0.9);
  const layers = [['#5d3a29', 0], ['#f3e6cf', 14], ['#b98552', 38], ['#f3e6cf', 60], ['#b98552', 84]];
  layers.forEach(([c, y], i) => {
    const h = i === 0 ? 14 : (i % 2 ? 24 : 22);
    s += wash(`M120 ${132 + y}L170 ${166 + y}L170 ${166 + y + h}L120 ${132 + y + h}Z`, c, 0.85);
    s += wash(`M170 ${166 + y}L300 ${142 + y}L300 ${142 + y + h}L170 ${166 + y + h}Z`, c, 0.95);
  });
  for (let i = 0; i < 70; i++) s += `<circle cx="${f(between(130, 290))}" cy="${f(between(118, 160))}" r="${f(between(0.8, 2))}" fill="#3e2418" fill-opacity=".7" filter="url(#ink)"/>`;
  s += wash('M260 240C268 230 286 230 292 242C286 250 268 250 260 240Z', '#3a2a26', 0.8);
  return s;
});

vignette('cheesecake', 8, '#f1d6d6', () => {
  let s = wash('M70 252C70 234 130 222 200 222S330 234 330 252C330 270 270 282 200 282S70 270 70 252Z', '#efe5da', 0.95);
  s += wash('M110 150L300 128L286 150L124 178Z', '#f6e9c9', 0.95);
  s += wash('M124 178L286 150L286 226L124 248Z', '#f2dfb6', 0.95);
  s += wash('M110 150L124 178L124 248L110 222Z', '#e8d0a0', 0.9);
  s += wash('M110 222L124 248L286 226L286 238L124 262L110 236Z', '#b9804a', 0.9);
  s += wash('M108 146C150 136 250 124 302 124C304 136 290 144 270 146C268 160 262 168 256 150C220 154 170 160 150 162C146 176 138 182 134 164C120 166 108 160 108 146Z', '#b2394f', 0.85);
  for (const [x, y] of [[170, 136], [212, 130], [250, 128]]) s += `<circle cx="${x}" cy="${y}" r="9" fill="#8e2440" fill-opacity=".85" filter="url(#wc)"/>`;
  s += leaf(232, 124, 22, -40, ['#6f9a4f']);
  return s;
});

vignette('torte', 10, '#f4d4d8', () => {
  let s = wash('M70 254C70 236 130 224 200 224S330 236 330 254C330 272 270 284 200 284S70 272 70 254Z', '#efe5da', 0.95);
  s += wash('M108 128L292 120L292 240L108 248Z', '#f4dcdc', 0.9);
  const ls = [[128, '#c9874f'], [152, '#f5e7e1'], [170, '#e3909c'], [190, '#f5e7e1'], [210, '#c9874f']];
  ls.forEach(([y, c]) => { s += wash(`M108 ${y}L292 ${y - 6}L292 ${y + 14}L108 ${y + 20}Z`, c, 0.85); });
  s += wash('M104 126C140 112 260 106 296 118C300 128 292 134 280 132C260 130 140 134 116 136C104 136 100 132 104 126Z', '#fbf5ef', 0.95);
  for (const [x, y] of [[140, 112], [200, 104], [258, 106]]) {
    s += wash(`M${x - 16} ${y}C${x - 16} ${y - 22} ${x + 16} ${y - 22} ${x + 16} ${y}C${x + 12} ${y + 12} ${x - 12} ${y + 12} ${x - 16} ${y}Z`, '#d23a4a', 0.9);
    s += leaf(x, y - 14, 14, -30, ['#6f9a4f']) + leaf(x, y - 14, 12, 30, ['#6f9a4f']);
  }
  return s;
});

vignette('matcha', 12, '#dfe6cc', () => {
  let s = wash('M136 70L264 70L252 270C230 282 170 282 148 270Z', '#eef0ea', 0.7);
  s += wash('M142 132L258 132L252 230L148 230Z', '#f2ede2', 0.95);
  s += wash('M140 104L260 104L258 140C230 150 170 150 142 140Z', '#8fa65c', 0.95);
  s += wash('M142 136C170 150 230 150 258 136L256 170C226 180 174 180 144 170Z', '#b7c58e', 0.55);
  s += wash('M148 230L252 230L252 270C230 282 170 282 148 270Z', '#a7bb78', 0.7);
  s += stroke('M136 70L148 270C170 282 230 282 252 270L264 70', '#a6aca2', 2.5, 0.6);
  s += stroke('M158 84L166 250', '#ffffff', 6, 0.55, 'bleed');
  s += leaf(300, 250, 48, 50, ['#7d9b52', '#93ad62']) + leaf(300, 250, 40, 100, ['#7d9b52', '#93ad62']);
  return s;
});

vignette('cappuccino', 14, '#efd6c8', () => {
  let s = wash('M70 248C70 228 130 214 200 214S330 228 330 248C330 268 270 280 200 280S70 268 70 248Z', '#efe4d8', 0.95);
  s += wash('M110 150C110 220 150 256 200 256S290 220 290 150Z', '#faf5ee', 1);
  s += wash('M240 156C266 160 286 160 288 152C286 214 258 250 206 254C246 234 262 196 240 156Z', '#cbbcc0', 0.55);
  s += wash('M118 182C160 196 240 196 282 182C280 192 276 198 272 204C236 218 164 218 128 204C124 198 120 190 118 182Z', '#e6a1ad', 0.5);
  s += stroke('M288 176C330 166 334 222 280 226', '#e9ddd2', 12, 1, 'wc');
  s += wash('M110 150C110 134 152 122 200 122S290 134 290 150C290 166 248 176 200 176S110 166 110 150Z', '#f6efe6', 1);
  s += wash('M122 151C122 139 158 130 200 130S278 139 278 151C278 163 242 170 200 170S122 163 122 151Z', '#b98153', 0.9);
  s += wash('M168 151C168 143 182 138 200 138S232 143 232 151C232 159 218 164 200 164S168 159 168 151Z', '#f5e8d6', 0.95);
  s += wash('M182 152C182 147 190 144 200 144S218 147 218 152C218 157 210 160 200 160S182 157 182 152Z', '#c48d5c', 0.5);
  s += stroke('M196 112C186 92 206 82 196 62', '#bfa9a2', 5, 0.3, 'bleed');
  return s;
});

// ---------- Café-Fassade ----------
seed = 77;
let fac = blob(320, 260, 300, 220, '#f0d9cf', 0.4) + blob(120, 420, 160, 80, '#b9c9ad', 0.35);
fac += wash('M60 60L580 60L580 440L60 440Z', '#efe1cc', 0.85);
fac += wash('M60 60L580 60L580 84L60 84Z', '#d9c2a5', 0.7);
fac += stroke('M60 440L60 60L580 60L580 440', '#6b4532', 2.2, 0.5);
fac += stroke('M40 58L600 58', '#6b4532', 3, 0.6);
// Schild
fac += wash('M240 92C240 82 400 82 400 92L400 122C400 132 240 132 240 122Z', '#6e2330', 0.85);
fac += ring(320, 107, 5, petalSakura, 11, 7, ['#f4c9d1'], -54, [0.85, 0.95]);
// Markise: eine Bahn, darauf helle Streifen, unten Bogenkante
let scallop = 'M76 140L564 140L568 190';
for (let i = 0; i < 10; i++) { const x = 568 - i * 49.2; scallop += `Q${f(x - 24.6)} 214 ${f(x - 49.2)} 190`; }
scallop += 'Z';
let aw = wash(scallop, '#d98597', 0.88);
for (let i = 0; i < 5; i++) {
  const x = 100 + i * 98.4;
  aw += wash(`M${f(x)} 142L${f(x + 49)} 142L${f(x + 49)} 196Q${f(x + 24.5)} 214 ${f(x)} 196Z`, '#fbf3ea', 0.82);
}
aw += stroke(scallop, '#6e2330', 2, 0.55);
fac += aw;
// Fenster mit warmem Licht
fac += wash('M90 210L380 210L380 380L90 380Z', '#f3d79a', 0.75);
fac += blob(230, 300, 120, 70, '#f0b65e', 0.45, 'bleed');
fac += stroke('M90 210L380 210L380 380L90 380Z', '#6b4532', 5, 0.8);
fac += stroke('M235 210L235 380', '#6b4532', 4, 0.8);
// Pflanzen-Silhouetten im Fenster
for (const [x, y, n] of [[140, 360, 6], [326, 360, 5]]) {
  for (let i = 0; i < n; i++) fac += leaf(x + between(-8, 8), y, between(34, 58), -70 + i * (140 / (n - 1)), ['#6f8e63', '#7f9a7e']);
}
fac += peony(140, 318, 14, 10) + peony(330, 324, 12, 40, APRICOT);
fac += wash('M200 300C200 290 260 290 260 300L254 330L206 330Z', '#fbf3ea', 0.7);
fac += wash('M222 286C222 276 238 276 238 286', '#6b4532', 0.6);
// Tür
fac += wash('M420 200L540 200L540 440L420 440Z', '#7a3b4c', 0.85);
fac += wash('M436 216L524 216L524 330L436 330Z', '#f3d79a', 0.7);
fac += `<circle cx="432" cy="350" r="5" fill="#c99a3e" filter="url(#ink)"/>`;
// Blumenkasten
fac += wash('M80 380L390 380L384 412L86 412Z', '#8a5a3e', 0.85);
for (let i = 0; i < 14; i++) {
  const x = 96 + i * 21;
  fac += leaf(x, 384, between(22, 34), between(-50, 50));
}
for (let i = 0; i < 9; i++) {
  const x = 100 + i * 34 + between(-6, 6);
  const y = 370 + between(-10, 6);
  fac += i % 3 === 0 ? peony(x, y, 18, between(0, 60)) : i % 3 === 1 ? sakura(x, y, 15, between(0, 60)) : peony(x, y, 15, between(0, 60), APRICOT);
}
// Kübelpflanze an der Tür
fac += wash('M548 380L600 380L594 440L554 440Z', '#b9804a', 0.85);
fac += ring(574, 370, 9, leafPath, 70, 22, SAGE, -90, [0.55, 0.75]);
fac += peony(580, 320, 22, 10) + peony(556, 340, 16, 40, APRICOT);
// Bistrotisch
fac += stroke('M150 470L150 520M120 520L180 520', '#3a2a26', 4, 0.8);
fac += wash('M110 462C110 454 190 454 190 462C190 470 110 470 110 462Z', '#d7c2b4', 0.9);
fac += wash('M140 450C140 440 160 440 160 450L158 460L142 460Z', '#faf5ee', 1);
fac += stroke('M210 520L214 470C214 456 244 456 246 470L250 520M212 490L248 490', '#3a2a26', 3.5, 0.75);
fac += wash('M40 440L600 440L600 452L40 452Z', '#cdb6a8', 0.55);
out('cafe-fassade.svg', svg('0 0 640 540', fac, 15));

// ---------- Torte (inline in index.html) ----------
seed = 101;
const P = 'k-';
const C = 260, R = 196;
const slices = [
  { base: '#f1d58a', rim: '#d9a94f' },
  { base: '#ebb8b2', rim: '#c9868a' },
  { base: '#f7e6df', rim: '#e3b9a8' },
  { base: '#aebe80', rim: '#7f9555' },
  { base: '#8f5e40', rim: '#5d3a29' },
  { base: '#eaa9b6', rim: '#c97f90' },
];
const deco = [
  // I  Frühstück: Zitrone & Vanille
  (m) => [0.45, 0.72].map((t, j) => {
    const [x, y] = pt(C, C, R * t, m + (j ? -8 : 10));
    return `<circle cx="${x}" cy="${y}" r="15" fill="#f6e27a" fill-opacity=".9" filter="url(#${P}wc)"/>` +
      `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#e0b93c" stroke-width="3" filter="url(#${P}ink)"/>` +
      [0, 60, 120].map((a) => { const [x1, y1] = pt(x, y, 12, a); const [x2, y2] = pt(x, y, 12, a + 180); return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#e8c650" stroke-width="1.4" filter="url(#${P}ink)"/>`; }).join('');
  }).join(''),
  // II Brunch: Beeren
  (m) => {
    let s = '';
    for (let i = 0; i < 9; i++) {
      const [x, y] = pt(C, C, R * between(0.35, 0.8), m + between(-20, 20));
      s += `<circle cx="${x}" cy="${y}" r="${f(between(6, 9))}" fill="${pick(['#a3283f', '#b8324a', '#5b3a6e'])}" fill-opacity=".9" filter="url(#${P}wc)"/>`;
    }
    return s;
  },
  // III Kuchen: Erdbeeren
  (m) => [[0.45, 8], [0.7, -12], [0.72, 14]].map(([t, d]) => {
    const [x, y] = pt(C, C, R * t, m + d);
    return `<g transform="translate(${x} ${y}) rotate(${f(m + 90)})"><path d="M-13 -4C-13 -22 13 -22 13 -4C10 10 -10 10 -13 -4Z" fill="#d23a4a" fill-opacity=".92" filter="url(#${P}wc)"/>` +
      `<path d="M-6 -16L0 -24L6 -16" stroke="#5f8a45" stroke-width="3" fill="none" filter="url(#${P}ink)"/></g>`;
  }).join(''),
  // IV Vegan: Matcha mit weißer Blüte
  (m) => {
    let s = '';
    for (let i = 0; i < 40; i++) {
      const [x, y] = pt(C, C, R * between(0.2, 0.85), m + between(-24, 24));
      s += `<circle cx="${x}" cy="${y}" r="${f(between(0.8, 1.8))}" fill="#5f7a35" fill-opacity=".7"/>`;
    }
    const [x, y] = pt(C, C, R * 0.6, m);
    return s + ring(x, y, 5, petalSakura, 18, 12, ['#fbf8f2', '#f4efe6'], 0, [0.95, 1], `${P}wc`) +
      `<circle cx="${x}" cy="${y}" r="3.5" fill="#c99a3e" filter="url(#${P}ink)"/>`;
  },
  // V  Kaffee: Kakao & Bohnen
  (m) => {
    let s = '';
    for (let i = 0; i < 50; i++) {
      const [x, y] = pt(C, C, R * between(0.2, 0.85), m + between(-24, 24));
      s += `<circle cx="${x}" cy="${y}" r="${f(between(0.8, 1.8))}" fill="#3a2016" fill-opacity=".75"/>`;
    }
    return s + [[0.48, -6], [0.72, 10]].map(([t, d]) => {
      const [x, y] = pt(C, C, R * t, m + d);
      return `<g transform="translate(${x} ${y}) rotate(${f(m + 30)})"><ellipse rx="10" ry="7" fill="#3b2318" fill-opacity=".92" filter="url(#${P}wc)"/><path d="M-8 0C-3 -3 3 3 8 0" stroke="#8f5e40" stroke-width="1.6" fill="none"/></g>`;
    }).join('');
  },
  // VI Feiern: Rosenblätter & Blattgold
  (m) => {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const [x, y] = pt(C, C, R * between(0.35, 0.8), m + between(-18, 18));
      s += `<path d="${petalRound(18, 10)}" transform="translate(${x} ${y}) rotate(${f(between(0, 360))})" fill="${pick(['#c64f6b', '#d9677f', '#b8405c'])}" fill-opacity=".85" filter="url(#${P}wc)"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const [x, y] = pt(C, C, R * between(0.3, 0.85), m + between(-22, 22));
      s += `<path d="M${x} ${y}l4 -3l3 4l-4 3z" fill="#d4a94c" fill-opacity=".95"/>`;
    }
    return s;
  },
];
const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
let cake = `<svg class="cake__svg" viewBox="0 0 520 520" role="group" aria-label="Torte mit sechs Stücken – jedes Stück steht für ein Angebot">
<defs>${filters(P, 8)}
<radialGradient id="${P}plate" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#fdfaf5"/><stop offset=".85" stop-color="#f3ebe0"/><stop offset="1" stop-color="#e2d4c4"/></radialGradient>
</defs>
<ellipse cx="270" cy="276" rx="250" ry="246" fill="#2b201d" fill-opacity=".10" filter="url(#${P}bleed)"/>
<circle cx="${C}" cy="${C}" r="248" fill="url(#${P}plate)"/>
<circle cx="${C}" cy="${C}" r="226" fill="none" stroke="#d9c7b5" stroke-width="1.2" stroke-dasharray="2 6"/>
<circle cx="${C}" cy="${C}" r="${R + 2}" fill="#e8dccd" filter="url(#${P}wc)"/>
`;
slices.forEach((sl, i) => {
  const a0 = -90 + i * 60, a1 = a0 + 60, m = a0 + 30;
  const [x0, y0] = pt(C, C, R, a0), [x1, y1] = pt(C, C, R, a1);
  const [dx, dy] = pt(0, 0, 30, m);
  const [nx, ny] = pt(C, C, 236, m);
  const wedge = `M${C} ${C}L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}Z`;
  const [rx0, ry0] = pt(C, C, R - 7, a0 + 1.5), [rx1, ry1] = pt(C, C, R - 7, a1 - 1.5);
  const rosettes = [m - 15, m, m + 15].map((a) => {
    const [x, y] = pt(C, C, R - 22, a);
    return `<circle cx="${x}" cy="${y}" r="8" fill="#fdf9f3" fill-opacity=".95" filter="url(#${P}wc)"/><path d="M${x - 4} ${y}a4 4 0 1 1 4 4" stroke="#e6d8c8" stroke-width="1.4" fill="none"/>`;
  }).join('');
  cake += `<g class="cake__slice" data-slice="${i}" style="--dx:${dx}px;--dy:${dy}px" tabindex="0" role="button" aria-label="Stück ${numerals[i]}">
  <path d="${wedge}" fill="#2b201d" fill-opacity=".14" filter="url(#${P}bleed)" class="cake__shadow"/>
  <path d="${wedge}" fill="${sl.base}" filter="url(#${P}wc)"/>
  <path d="M${rx0} ${ry0}A${R - 7} ${R - 7} 0 0 1 ${rx1} ${ry1}" fill="none" stroke="${sl.rim}" stroke-width="12" stroke-opacity=".8" filter="url(#${P}wc)"/>
  ${deco[i](m)}${rosettes}
  <path d="${wedge}" fill="none" stroke="#fbf8f2" stroke-width="2.5"/>
</g>
<text class="cake__num" x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central">${numerals[i]}</text>
`;
});
cake += '</svg>';

const indexPath = join(root, 'index.html');
const html = readFileSync(indexPath, 'utf8');
const start = '<!-- torte:start -->', end = '<!-- torte:end -->';
const i0 = html.indexOf(start), i1 = html.indexOf(end);
if (i0 < 0 || i1 < 0) throw new Error('Torten-Marker in index.html fehlen');
writeFileSync(indexPath, html.slice(0, i0 + start.length) + '\n' + cake + '\n' + html.slice(i1));
console.log('Illustrationen und Torte erzeugt.');
