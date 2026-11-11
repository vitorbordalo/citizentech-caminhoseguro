// CaminhoSeguro — cena 3D procedural (three.js r160). Animação determinística: window.renderFrame(t)
import * as THREE from 'three';

const W = 1920, H = 1080, DUR = 55;
const GRAVANDO = new URLSearchParams(location.search).has('gravar');
if (GRAVANDO) document.body.classList.add('gravando');

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => u * u * (3 - 2 * u);
const easeOutBack = u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(11);

// ---------------------------------------------------------------- renderer / cena
const cv3d = document.getElementById('c3d');
const renderer = new THREE.WebGLRenderer({ canvas: cv3d, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
function gradTex() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#4f86d6'); gr.addColorStop(.45, '#9cc3ee'); gr.addColorStop(.8, '#f4d9bd'); gr.addColorStop(1, '#f8cfa5');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
scene.background = gradTex();
scene.fog = new THREE.Fog(0xf1d6bd, 75, 240);

const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x9a8570, 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2b8, 2.6);
sun.position.set(-35, 50, 30); sun.target.position.set(0, 0, 0);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 170 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 800);

// ---------------------------------------------------------------- utilidades
const mats = {};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, metalness: 0, ...o });
function M(c) { return mats[c] || (mats[c] = mat(c)); }
function box(w, h, d, m, x, y, z, parent = scene, shadow = true) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'number' ? M(m) : m);
  o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
}
function cyl(rt, rb, h, m, x, y, z, parent = scene, seg = 10) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'number' ? M(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
const FONT = '"Segoe UI", Arial, sans-serif';

// gradiente de brilho
const glowTex = canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

// ---------------------------------------------------------------- rótulos (sprites com CanvasTexture)
const labels = [];
function makeLabel({ text, sub, bg = '#0b1630', fg = '#ffffff', subFg = '#bfe3ff', border = '#ffffff', w = 6.4, pos, t0 = 0, t1 = null, personIcon = false, big = 1, hide = null }) {
  const CW = 1024, CH = sub ? 300 : 200;
  const tex = canvasTex(CW, CH, (g) => {
    g.fillStyle = bg; rrect(g, 8, 8, CW - 16, CH - 16, 44); g.fill();
    g.lineWidth = 8; g.strokeStyle = border; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
    let px = sub ? 92 : 98;
    const off = personIcon ? 70 : 0;
    do { g.font = `800 ${px}px ${FONT}`; px -= 2; } while (g.measureText(text).width > CW - 110 - off && px > 30);
    const cy = sub ? 100 : CH / 2 + 4;
    g.fillText(text, CW / 2 + off / 2, cy);
    if (sub) {
      let p2 = 64; do { g.font = `600 ${p2}px ${FONT}`; p2 -= 2; } while (g.measureText(sub).width > CW - 110 && p2 > 24);
      g.fillStyle = subFg; g.fillText(sub, CW / 2, 215);
    }
    if (personIcon) { g.fillStyle = fg; g.beginPath(); g.arc(92, CH / 2 - 14, 22, 0, 7); g.fill(); g.beginPath(); g.arc(92, CH / 2 + 56, 38, Math.PI, 0); g.fill(); }
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false }));
  sp.renderOrder = 20; sp.visible = false; sp.position.copy(pos);
  scene.add(sp);
  const L = { sp, w: w * big, h: w * big * CH / CW, t0, t1, hide }; labels.push(L); return L;
}

// ---------------------------------------------------------------- terreno e ruas
const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), M(0x4a4f57));
asphalt.rotation.x = -Math.PI / 2; asphalt.position.y = -0.01; asphalt.receiveShadow = true; scene.add(asphalt);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(76, 0.15, 76, 0xcdc6ba, sx * 42, 0.075, sz * 42, scene, false);
// faixas tracejadas
for (let v = -78; v <= 78; v += 4.5) {
  if (Math.abs(v) < 6) continue;
  box(2.4, 0.02, 0.2, 0xf1e9c0, v, 0.012, 0, scene, false);
  box(0.2, 0.02, 2.4, 0xf1e9c0, 0, 0.012, v, scene, false);
}
// faixas de pedestres: 1 sobre a rua horizontal (x=-5.5), 2 sobre a rua vertical (z=5.5)
for (let z = -3.5; z <= 3.51; z += 1.0) box(3.0, 0.03, 0.5, 0xf4f4f4, -5.5, 0.016, z, scene, false);
for (let x = -3.5; x <= 3.51; x += 1.0) box(0.5, 0.03, 3.0, 0xf4f4f4, x, 0.016, 5.5, scene, false);
// uma faixa também no cruzamento do lado do hospital (apenas decoração, vista aérea)
for (let z = -3.5; z <= 3.51; z += 1.0) box(3.0, 0.03, 0.5, 0xf4f4f4, 5.5, 0.016, z, scene, false);

// terreno (altura) usado pelos caminhos
const HILL = { x0: 7, x1: 14, z0: -7, z1: -4, h: 1.7 };
function hillH(x) { const u = (x - HILL.x0) / (HILL.x1 - HILL.x0); return (u > 0 && u < 1) ? HILL.h * Math.pow(Math.sin(Math.PI * u), 2) : 0; }
function gy(x, z) {
  let y = (Math.abs(x) < 4 || Math.abs(z) < 4) ? 0 : 0.15;
  if (z > HILL.z0 && z < HILL.z1) y += hillH(x);
  return y;
}
// ladeira: perfil extrudado
{
  const sh = new THREE.Shape(); sh.moveTo(HILL.x0, 0.1);
  for (let i = 0; i <= 28; i++) { const x = lerp(HILL.x0, HILL.x1, i / 28); sh.lineTo(x, 0.15 + hillH(x)); }
  sh.lineTo(HILL.x1, 0.1); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: HILL.z1 - HILL.z0, bevelEnabled: false });
  const m = new THREE.Mesh(geo, M(0xc9a66b)); m.position.z = HILL.z0; m.castShadow = m.receiveShadow = true; scene.add(m);
  // degraus de aviso (listras) na ladeira
  for (let i = 0; i < 7; i++) { const x = lerp(HILL.x0 + .5, HILL.x1 - .5, i / 6); box(0.35, 0.04, 2.6, i % 2 ? 0xf2c230 : 0x3a3a3a, x, 0.15 + hillH(x) + 0.02, -5.5, scene, false).rotation.z = Math.atan2(HILL.h * Math.PI / 7 * Math.sin(2 * Math.PI * ((x - 7) / 7)) / 2, 1); }
}

// ---------------------------------------------------------------- caminhos
function makePath(pts, hillOn = true) {
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, l, s0: total }); total += l; }
  const xz = (s) => {
    s = clamp(s, 0, total);
    for (const g of segs) if (s <= g.s0 + g.l + 1e-9) { const u = g.l ? (s - g.s0) / g.l : 0; return [lerp(g.a[0], g.b[0], u), lerp(g.a[1], g.b[1], u)]; }
    const e = pts[pts.length - 1]; return [e[0], e[1]];
  };
  const at = (s) => { // posição com altura suavizada
    const p = xz(s); let y = 0; for (let k = -2; k <= 2; k++) { const q = xz(s + k * .3); y += gy(q[0], q[1]); } return { x: p[0], z: p[1], y: y / 5 };
  };
  const dir = (s, sm = .9) => { const a = xz(s - sm), b = xz(s + sm); const dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
  const smPos = (s) => { let x = 0, z = 0, y = 0; for (let k = -3; k <= 3; k++) { const p = at(s + k); x += p.x; z += p.z; y += p.y; } return { x: x / 7, y: y / 7, z: z / 7 }; };
  return { pts, total, xz, at, dir, smPos };
}
const direct = makePath([[-14, -9.4], [-14, -5.5], [16.5, -5.5], [18.5, 5.5], [19, 8.8]]);
const green = makePath([[-14, -9.4], [-14, -5.5], [-5.5, -5.5], [-5.5, 5.5], [5.5, 5.5], [19, 5.5], [19, 8.8]]);
const S_DIRECT_END = 3.9 + 25.5;               // até x = 11.5
const S_APOIO = 3.9 + 8.5 + 11 + 11 + 5;       // x = 10.5 na calçada sul

function chevronTex(rgb) {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = `rgba(${rgb},0.62)`; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 18; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(24, 104); g.lineTo(64, 42); g.lineTo(104, 104); g.stroke();
  }, true);
}
function ribbon(path, width, tex, color = 0xffffff, opacity = 1, yOff = .09, vScale = 1.6) {
  const step = 0.5, n = Math.ceil(path.total / step) + 1;
  const pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = [];
  for (let i = 0; i < n; i++) {
    const s = Math.min(i * step, path.total), p = path.at(s), d = path.dir(s, .4);
    const nx = -d[1], nz = d[0];
    pos.set([p.x + nx * width / 2, p.y + yOff, p.z + nz * width / 2, p.x - nx * width / 2, p.y + yOff, p.z - nz * width / 2], i * 6);
    uv.set([0, s / vScale, 1, s / vScale], i * 4);
    if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const m = new THREE.MeshBasicMaterial({ map: tex || null, color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = 5; mesh.visible = false; scene.add(mesh);
  return { mesh, mat: m, n, set(frac) { const segs = Math.floor(clamp(frac) * (n - 1)); geo.setDrawRange(0, segs * 6); mesh.visible = segs > 0; } };
}
const texRed = chevronTex('226,32,48'), texGreen = chevronTex('18,190,110');
[texRed, texGreen].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
const redLine = ribbon(direct, 1.1, texRed), redGlow = ribbon(direct, 2.0, null, 0xff3040, .28, .07);
const greenLine = ribbon(green, 1.1, texGreen), greenGlow = ribbon(green, 2.1, null, 0x20ffb0, .30, .07);

// ---------------------------------------------------------------- prédios
const palette = [0xe9d8c4, 0xd9b8a0, 0xc9d6df, 0xe6c9c9, 0xcfd9c2, 0xf0e2b6, 0xb9c7d8, 0xd8c3dd];
const winTexBase = canvasTex(128, 128, (g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#5d7893'; g.fillRect(26, 28, 76, 72);
  g.fillStyle = '#8fb0cc'; g.fillRect(26, 28, 76, 30);
  g.fillStyle = '#e8e8e8'; g.fillRect(62, 28, 4, 72);
});
winTexBase.wrapS = winTexBase.wrapT = THREE.RepeatWrapping;
function winTex(rx, ry) { const t = winTexBase.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; }
const reserved = [[-17.6, -10.4, -15.6, -9.4], [12, 22, -18, -10], [7, 13.6, 8.5, 17.6], [14.4, 23.6, 8.9, 17.1]];
function reservedHit(x0, x1, z0, z1) { return reserved.some(r => x0 < r[1] + .4 && x1 > r[0] - .4 && z0 < r[3] + .4 && z1 > r[2] - .4); }
for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
  const u = 8 + 9 * i + 4.5, v = 8 + 9 * j + 4.5;
  const w = 6.2 + R() * 1.6, d = 6.2 + R() * 1.6;
  const cx = sx * u, cz = sz * v;
  const near = Math.abs(cx) < 28 && Math.abs(cz) < 24;
  const h = near ? 4 + R() * 5 : 6 + R() * 12;
  const col = palette[Math.floor(R() * palette.length)];
  if (reservedHit(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2)) { R(); continue; }
  const side = (rx) => new THREE.MeshStandardMaterial({ color: col, map: winTex(rx, Math.max(1, Math.round(h / 3))), roughness: .85 });
  const top = M(0x8c8f96), mx = side(Math.round(d / 3)), mz = side(Math.round(w / 3));
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [mx, mx, top, top, mz, mz]);
  b.position.set(cx, h / 2 + .15, cz); b.castShadow = b.receiveShadow = true; scene.add(b);
  box(w + .3, .25, d + .3, 0x777a82, cx, h + .27, cz, scene, false);
}
// ---- casa da dona Maria
{
  const g = new THREE.Group(); g.position.set(-14, .15, -12.5); scene.add(g);
  box(7, 4.2, 6, 0xf2d58c, 0, 2.1, 0, g);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.1, 2.4, 4), M(0xb85a3a)); roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, .9); roof.position.y = 5.4; roof.castShadow = true; g.add(roof);
  box(1.2, 2.2, .12, 0x7a4a2b, 0, 1.1, 3.03, g);
  box(1.0, 1.0, .1, 0xa6d3ee, -2.3, 2.2, 3.03, g); box(1.0, 1.0, .1, 0xa6d3ee, 2.3, 2.2, 3.03, g);
  box(1.8, .15, .8, 0xbdb6a8, 0, .05, 3.4, g);
  box(.7, 1.6, .7, 0xb85a3a, 2, 5.4, -1, g);
}
// ---- mercado
{
  const g = new THREE.Group(); g.position.set(17, .15, -14); scene.add(g);
  box(10, 5, 8, 0xf3e3c0, 0, 2.5, 0, g);
  for (let i = 0; i < 10; i++) { const s = box(1, .15, 1.8, i % 2 ? 0xffffff : 0x2f9e6a, -4.5 + i, 3.4, 4.7, g); s.rotation.x = .38; }
  box(8, 1.4, .1, 0xffffff, 0, 4.4, 4.02, g);
  const fr = [0xd9453a, 0xf29b30, 0xf2d03a, 0x6bbf4a];
  for (let i = 0; i < 4; i++) { box(1.1, .6, .8, 0x9b6a3c, -3.2 + i * 2.1, .3, 4.6, g); box(.9, .3, .6, fr[i], -3.2 + i * 2.1, .72, 4.6, g); }
  box(1.6, 2.4, .1, 0xa6d3ee, 0, 1.2, 4.02, g);
}
// ---- posto de saúde
{
  const g = new THREE.Group(); g.position.set(19, .15, 13); scene.add(g);
  box(9, 7, 8, 0xf4f6f7, 0, 3.5, 0, g);
  box(9.2, .8, 8.2, 0x1faa59, 0, 6.7, 0, g, false);
  box(.7, 2.4, .12, 0x1faa59, 0, 5.1, -4.03, g); box(2.4, .7, .12, 0x1faa59, 0, 5.1, -4.04, g);
  box(2.2, 2.6, .12, 0x9fd3ee, 0, 1.3, -4.03, g);
  box(.1, 2.6, .14, 0x4a5560, 0, 1.3, -4.05, g);
  for (const x of [-3, 3]) { box(1.4, 1.4, .1, 0xa6d3ee, x, 2.6, -4.03, g); }
  // rampa de entrada
  const rp = box(2.8, .12, 1.6, 0xf2c230, 0, .12, -4.7, g); rp.rotation.x = -.12;
}
// ---- praça 14 Bis
{
  const g = new THREE.Group(); g.position.set(10.3, .15, 13); scene.add(g);
  box(6.4, .1, 9, 0x74b86a, 0, .05, 0, g, false);
  box(1.2, .12, 9, 0xe4d9bf, 0, .07, 0, g, false);
  cyl(1.0, 1.1, .5, 0xcfd3d8, 0, .3, 1.6, g, 16); cyl(.85, .85, .1, 0x5bb8e8, 0, .56, 1.6, g, 16); cyl(.12, .12, 1.0, 0xcfd3d8, 0, 1, 1.6, g);
  box(1.8, .1, .5, 0x8b5a2b, 1.9, .6, -2.4, g); box(1.8, .5, .08, 0x8b5a2b, 1.9, .9, -2.6, g);
}
function tree(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, .15, z); scene.add(g);
  cyl(.12 * s, .18 * s, 1.6 * s, 0x7a5230, 0, .8 * s, 0, g, 7);
  const c = [0x4f9e4d, 0x62b05a, 0x3f8d4a][Math.floor(R() * 3)];
  const a = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 * s, 0), M(c)); a.position.y = 2.3 * s; a.castShadow = true; g.add(a);
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.8 * s, 0), M(c)); b.position.set(.3 * s, 3.1 * s, .1 * s); b.castShadow = true; g.add(b);
}
for (let x = -44; x <= 44; x += 6.5) {
  if (Math.abs(x) > 8.5 && !(x > 5 && x < 19)) tree(x, -6.7, .85 + R() * .3);
  if (Math.abs(x) > 8.5 && !(x > 5 && x < 15)) tree(x, 6.7, .85 + R() * .3);
}
for (let z = -44; z <= 44; z += 6.5) if (Math.abs(z) > 9) { tree(-6.7, z, .85 + R() * .3); tree(6.7, z, .85 + R() * .3); }
tree(12.2, 16, 1.2); tree(8.2, 16.2, 1);

// ---- postes de luz
const poolMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffd98a, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
function lamp(x, z, lit = true) {
  const g = new THREE.Group(); g.position.set(x, .15, z); scene.add(g);
  cyl(.07, .1, 4.4, 0x6c727a, 0, 2.2, 0, g, 8); box(.9, .08, .08, 0x6c727a, 0, 4.4, 0, g);
  box(.55, .14, .3, 0x6c727a, .5, 4.4, 0, g);
  const bulb = box(.4, .08, .22, lit ? new THREE.MeshBasicMaterial({ color: 0xfff0b0 }) : M(0x2b2f35), .5, 4.3, 0, g, false);
  if (lit) {
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd98a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
    gl.scale.set(3, 3, 1); gl.position.set(.5, 4.2, 0); g.add(gl);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4, 24), poolMat); pool.rotation.x = -Math.PI / 2; pool.position.set(.5, .06, 0); pool.renderOrder = 2; g.add(pool);
  }
}
[-36, -25, -3, 7, 27, 37].forEach(x => lamp(x, -4.6));
[-36, -25, -18, 25, 36].forEach(x => lamp(x, 4.6));
[-34, -22, 16, 30].forEach(z => { lamp(-4.6, z); lamp(4.6, z); });
const POLE_DARK = { x: 16.5, z: -4.6 };
lamp(POLE_DARK.x, POLE_DARK.z, false);

// ---- rampas (amarelo tátil)
function ramp(x, z, axis, sign) {
  const th = .1, m = M(0xf2c230);
  const o = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? 2.4 : 1.4, .1, axis === 'z' ? 1.4 : 2.4), m);
  o.position.set(x, .08, z); o.castShadow = o.receiveShadow = true;
  if (axis === 'z') o.rotation.x = sign * th; else o.rotation.z = sign * th;
  scene.add(o); return o;
}
ramp(-5.5, -4.0, 'z', +1); ramp(-5.5, 4.0, 'z', -1); ramp(-4.0, 5.5, 'x', -1); ramp(4.0, 5.5, 'x', +1);
ramp(5.5, -4.0, 'z', +1); ramp(5.5, 4.0, 'z', -1);

// ---- semáforo de pedestre (faixa 1)
const sem = [];
function semaforo(x, z, face) {
  const g = new THREE.Group(); g.position.set(x, .15, z); g.rotation.y = face; scene.add(g);
  cyl(.07, .08, 3, 0x4a4f57, 0, 1.5, 0, g, 8);
  box(.6, 1.1, .35, 0x1d2026, 0, 3.2, 0, g);
  const r = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), new THREE.MeshBasicMaterial({ color: 0x551111 })); r.position.set(0, 3.5, .2); g.add(r);
  const gr = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), new THREE.MeshBasicMaterial({ color: 0x113d22 })); gr.position.set(0, 2.9, .2); g.add(gr);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x30ff90, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  glow.scale.set(1.6, 1.6, 1); glow.position.set(0, 2.9, .3); g.add(glow);
  sem.push({ r, gr, glow });
}
semaforo(-7.4, -4.6, 0); semaforo(-7.4, 4.6, Math.PI);

// ---- ponto de apoio (banco + água + Wi-Fi)
const APOIO = { x: 10.5, z: 6.4 };
{
  const g = new THREE.Group(); g.position.set(APOIO.x, .15, APOIO.z); scene.add(g);
  for (const [dx, dz] of [[-2, -.8], [2, -.8], [-2, .8], [2, .8]]) cyl(.05, .05, 3.2, 0x3a4350, dx, 1.6, dz, g, 6);
  box(4.4, .15, 2, new THREE.MeshStandardMaterial({ color: 0x19c4a8, transparent: true, opacity: .35, roughness: .6 }), 0, 3.25, 1.0, g, false);
  box(2, .1, .55, 0x8b5a2b, -.6, .5, .1, g); box(2, .5, .08, 0x8b5a2b, -.6, .85, .38, g);
  box(.08, .5, .5, 0x3a4350, -1.5, .25, .1, g); box(.08, .5, .5, 0x3a4350, .3, .25, .1, g);
  box(.5, 1.0, .4, 0x2a9df4, 1.4, .5, .1, g); cyl(.05, .05, .3, 0xcfd3d8, 1.4, 1.1, -.15, g, 6).rotation.x = Math.PI / 2;
  const wifi = canvasTex(256, 256, (c) => {
    c.fillStyle = '#0b5fd0'; rrect(c, 8, 8, 240, 240, 36); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 8; c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 18; c.lineCap = 'round';
    for (const r of [34, 66, 98]) { c.beginPath(); c.arc(128, 188, r, Math.PI * 1.22, Math.PI * 1.78); c.stroke(); }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(128, 188, 12, 0, 7); c.fill();
  });
  cyl(.05, .05, 2.6, 0x3a4350, -1.9, 1.3, .3, g, 6);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: wifi })); pl.position.set(-1.9, 2.9, .35); g.add(pl);
  const pl2 = pl.clone(); pl2.rotation.y = Math.PI; pl2.position.z = .25; g.add(pl2);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.5, 40), new THREE.MeshBasicMaterial({ color: 0x19e6c0, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .06; g.add(ring); APOIO.ring = ring;
}

// ---------------------------------------------------------------- marcadores de barreiras
const markers = [];
const bangTex = canvasTex(256, 256, (g) => { g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 220px ${FONT}`; g.fillText('!', 128, 138); });
function marker(x, z, text, t0, ly, lx = x) {
  const g = new THREE.Group(); g.position.set(x, gy(x, z), z); scene.add(g);
  const red = new THREE.MeshStandardMaterial({ color: 0xe0202e, emissive: 0xaa0010, emissiveIntensity: .7, roughness: .5 });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), new THREE.MeshBasicMaterial({ color: 0xff2030, transparent: true, opacity: .4, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = .1; g.add(disc);
  const rip = new THREE.Mesh(new THREE.RingGeometry(.9, 1.1, 40), new THREE.MeshBasicMaterial({ color: 0xff3040, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  rip.rotation.x = -Math.PI / 2; rip.position.y = .12; g.add(rip);
  cyl(.04, .04, 2.9, 0xffffff, 0, 1.45, 0, g, 6);
  const pl = new THREE.Group(); pl.position.y = 4.1; g.add(pl);
  const dia = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, .2), red); dia.rotation.z = Math.PI / 4; dia.castShadow = true; pl.add(dia);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.45, .9, 4), red); cone.rotation.x = Math.PI; cone.position.y = -1.0; pl.add(cone);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: bangTex, transparent: true })); f.position.z = .12; pl.add(f);
  const b = f.clone(); b.rotation.y = Math.PI; b.position.z = -.12; pl.add(b);
  const L = makeLabel({ text, bg: '#a30f1c', border: '#ffffff', w: 5.8, pos: new THREE.Vector3(lx, ly, z), t0: t0 + .15, t1: 34.5 });
  const L2 = makeLabel({ text: 'aviso de moradores', bg: '#0b3d91', border: '#ffffff', w: 4.2, pos: new THREE.Vector3(lx, ly + 1.35, z), t0: 20.5 + markers.length * .45, t1: 32.5, personIcon: true });
  markers.push({ g, pl, rip, disc, t0 });
  return g;
}
marker(-10, -5.5, 'Buraco na calçada', 8.3, 6.4, -13);
marker(-5.5, -5.5, 'Esquina sem rampa', 11.0, 6.4, -2);
marker(10.5, -5.5, 'Ladeira muito íngreme', 15.0, 6.4, 9);
marker(POLE_DARK.x, -4.6, 'Poste apagado', 17.6, 6.4, 19.5);
// buraco físico
{
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.9, .8, .1, 14), M(0x1b1410)); m.position.set(-10, .17, -5.5); m.scale.z = .75; scene.add(m);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.95, .1, 5, 14), M(0x8a8478)); rim.rotation.x = Math.PI / 2; rim.position.set(-10, .19, -5.5); rim.scale.y = .75; scene.add(rim);
  for (let i = 0; i < 6; i++) { const a = i * 1.1; box(.2, .1, .15, 0x9a9488, -10 + Math.cos(a) * 1.25, .2, -5.5 + Math.sin(a) * 1.0, scene, false).rotation.y = a; }
}
// esquina sem rampa: meio-fio vermelho
box(3.2, .08, .25, 0xe0202e, -5.5, .2, -4.1, scene, false);
// evitar
const evitar = makeLabel({ text: 'EVITAR', sub: 'caminho rápido, mas perigoso', bg: '#b3001b', border: '#ffffff', subFg: '#ffffff', w: 6.8, pos: new THREE.Vector3(3.5, 2.6, -0.5), t0: 26.6, t1: 35.2 });

// rótulos permanentes de lugares
const places = [
  ['Casa da dona Maria', [-14, 8.6, -12.5], 1.0], ['Mercado', [17, 8.0, -14], 1.5], ['Praça 14 Bis', [10.3, 6.6, 13], 2.0], ['Posto de Saúde', [19, 10.5, 13], 1.0],
];
places.forEach(([t, p, ts]) => makeLabel({ text: t, bg: '#0b1630', border: '#9fe2ff', w: 5.6, pos: new THREE.Vector3(...p), t0: ts, t1: t.startsWith('Praça') ? 38.5 : 49.0, hide: t.startsWith('Casa') ? [8.2, 32.5] : [8.2, 20.5] }));
// rótulos de rota verde
const gl = (text, pos, t0, sub) => makeLabel({ text, sub, bg: '#0a6b43', border: '#ffffff', subFg: '#d6ffe9', w: 4.6, pos: new THREE.Vector3(...pos), t0, t1: 48.5 });
gl('Rampa', [-9.5, 2.6, -4.6], 33.9);
gl('Faixa com semáforo', [-10, 5.4, 0.5], 34.9);
gl('Rampa', [4.2, 3.2, 5.5], 39.3);
const labelApoio = makeLabel({ text: 'Ponto de Apoio', sub: 'banco · água · Wi-Fi', bg: '#0a6b73', border: '#ffffff', subFg: '#d6fffa', w: 5.0, pos: new THREE.Vector3(APOIO.x - 2.5, 7.2, APOIO.z), t0: 41.0, t1: 48.5 });

// ---------------------------------------------------------------- avatar (dona Maria)
const avatar = new THREE.Group(); scene.add(avatar);
const body = new THREE.Group(); avatar.add(body);
const skin = 0xe3b08b;
const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .12, .72, 0); body.add(l); cyl(.09, .08, .72, 0xd8d0c8, 0, -.36, 0, l, 8); box(.17, .1, .3, 0x3a2a22, 0, -.7, .05, l); return l; });
cyl(.28, .42, .42, 0x4a6fa5, 0, .85, 0, body, 12);
cyl(.25, .3, .62, 0x7b4fb8, 0, 1.22, 0, body, 12);
const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), M(skin)); head.position.y = 1.72; head.castShadow = true; body.add(head);
const hair = new THREE.Mesh(new THREE.SphereGeometry(.245, 14, 8, 0, Math.PI * 2, 0, Math.PI * .58), M(0xe8e8ee)); hair.position.set(0, 1.74, -.025); hair.rotation.x = -.25; body.add(hair);
const bun = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), M(0xe8e8ee)); bun.position.set(0, 1.88, -.16); body.add(bun);
for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.028, 6, 5), M(0x222222)); e.position.set(s * .08, 1.74, .2); body.add(e); }
const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .32, 1.42, 0); body.add(a); cyl(.065, .055, .55, 0x7b4fb8, 0, -.27, 0, a, 8); const h = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), M(skin)); h.position.y = -.58; a.add(h); return a; });
cyl(.026, .026, .95, 0x8b5a2b, 0, -1.0, .06, arms[1], 6); // bengala
box(.25, .3, .12, 0xd9534f, -.38, .95, .02, body);
avatar.scale.setScalar(1.45); avatar.visible = false;

// ---------------------------------------------------------------- linha do tempo
function sDirect(t) { const u = clamp((t - 6.5) / 12.5); return S_DIRECT_END * (.5 * u + .5 * Math.sin(u * Math.PI / 2)); }
const GP = [[32.3, 0], [42.8, S_APOIO], [44.3, S_APOIO], [47.5, green.total]];
function sGreen(t) {
  if (t <= GP[0][0]) return 0;
  for (let i = 0; i < GP.length - 1; i++) if (t <= GP[i + 1][0]) return lerp(GP[i][1], GP[i + 1][1], (t - GP[i][0]) / (GP[i + 1][0] - GP[i][0]));
  return green.total;
}
function avatarState(t) {
  if (t < 6) return null;
  if (t < 21.8) { const p = 6 < t ? clamp((t - 6) / .5) : 0; const sc = t > 21.2 ? 1 - clamp((t - 21.2) / .6) : easeOutBack(p); return { path: direct, s: sDirect(t), sc, v: (sDirect(t + .05) - sDirect(t - .05)) / .1 }; }
  if (t < 31) return null;
  const p = clamp((t - 31) / .5);
  return { path: green, s: sGreen(t), sc: easeOutBack(p), v: (sGreen(t + .05) - sGreen(t - .05)) / .1 };
}
const fol2 = { p: (t) => { const a = direct.smPos(sDirect(t)); return [a.x - 2, a.y + 10, a.z + 15]; }, l: (t) => { const a = direct.smPos(sDirect(t)); return [a.x + 6, a.y + 1.5, a.z - 3]; } };
const fol4 = { p: (t) => { const a = green.smPos(sGreen(t)); const w = smooth(clamp((t - 43.5) / 2.5)); return [a.x + lerp(-5, -3, w), a.y + lerp(13, 11, w), a.z + lerp(13, -15, w)]; }, l: (t) => { const a = green.smPos(sGreen(t)); const w = smooth(clamp((t - 43.5) / 2.5)); return [a.x + 2, a.y + lerp(1.2, 3, w), a.z + w * 2]; } };
const KF = [
  { t: 0, p: [-58, 46, 50], l: [0, 0, 0] },
  { t: 6, p: [-38, 38, 44], l: [0, 0, 0] },
  { t: 10, ...fol2 }, { t: 19.3, ...fol2 },
  { t: 23.5, p: [7, 31, 36], l: [6, 0, 0] },
  { t: 33.2, p: [9, 29, 34], l: [7, 0, 1] },
  { t: 36.8, ...fol4 }, { t: 47.3, ...fol4 },
  { t: 51.5, p: [19, 24, -17], l: [19, 2, 6] },
  { t: 55, p: [19, 38, -24], l: [19, 1, 5] },
];
const ev = (v, t) => typeof v === 'function' ? v(t) : v;
function camAt(t) {
  t = clamp(t, 0, DUR);
  let i = 0; while (i < KF.length - 2 && t >= KF[i + 1].t) i++;
  const a = KF[i], b = KF[i + 1], u = smooth(clamp((t - a.t) / (b.t - a.t)));
  const pa = ev(a.p, t), pb = ev(b.p, t), la = ev(a.l, t), lb = ev(b.l, t);
  return { p: pa.map((v, k) => lerp(v, pb[k], u)), l: la.map((v, k) => lerp(v, lb[k], u)) };
}

// ---------------------------------------------------------------- interação (arrastar para girar)
const user = { yaw: 0, pitch: 0, zoom: 1 };
function applyCamera(t) {
  const c = camAt(t);
  const P = new THREE.Vector3(...c.p), L = new THREE.Vector3(...c.l);
  const v = P.clone().sub(L); v.multiplyScalar(user.zoom);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), user.yaw);
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), v).normalize();
  v.applyAxisAngle(right.negate(), user.pitch);
  if (v.y < 1.5) v.y = 1.5;
  camera.position.copy(L).add(v); camera.lookAt(L);
}

// ---------------------------------------------------------------- HUD 2D
const hud = document.getElementById('hud').getContext('2d');
const win = (t, a, b, c, d) => clamp(Math.min((t - a) / (b - a), (d - t) / (d - c)));
function text(g, s, x, y, px, wt = 800, color = '#fff', align = 'left') {
  g.font = `${wt} ${px}px ${FONT}`; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(s, x, y);
}
function wrap(g, s, maxW) { const w = s.split(' '); const out = []; let cur = ''; for (const k of w) { const tt = cur ? cur + ' ' + k : k; if (g.measureText(tt).width > maxW && cur) { out.push(cur); cur = k; } else cur = tt; } out.push(cur); return out; }
function caption(g, s, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.font = `700 54px ${FONT}`;
  const lines = wrap(g, s, 1500); const h = lines.length * 70 + 44, w = Math.max(...lines.map(l => g.measureText(l).width)) + 90;
  const x = (W - w) / 2, y = H - 70 - h + (1 - a) * 20;
  g.fillStyle = 'rgba(11,22,48,.88)'; rrect(g, x, y, w, h, 30); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke();
  lines.forEach((l, i) => text(g, l, W / 2, y + 22 + 56 + i * 70, 54, 700, '#fff', 'center'));
  g.restore();
}
function panel(g, x, y, w, h, accent, a) { g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(11,22,48,.9)'; rrect(g, x, y, w, h, 28); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke(); g.fillStyle = accent; rrect(g, x, y, 16, h, 8); g.fill(); g.restore(); }
function drawHud(t) {
  const g = hud; g.clearRect(0, 0, W, H);
  // título
  let a = win(t, .3, 1.1, 5.0, 5.9);
  if (a > 0) {
    g.save(); g.globalAlpha = a; const dy = (1 - a) * 24;
    g.fillStyle = 'rgba(11,22,48,.86)'; rrect(g, 90, 600 + dy, 1360, 360, 40); g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = '#18d98a'; rrect(g, 90, 600 + dy, 20, 360, 10); g.fill();
    text(g, 'CaminhoSeguro', 150, 770 + dy, 140, 800);
    text(g, 'uma CitizenTech da Bela Vista', 154, 850 + dy, 62, 600, '#bfe9ff');
    text(g, 'Rotas acessíveis para idosos e pessoas com mobilidade reduzida', 154, 920 + dy, 38, 500, '#e6eefc');
    g.restore();
  }
  // cena 2
  a = win(t, 6.4, 7.0, 19.3, 20.0);
  if (a > 0) { panel(g, 60, 60, 1010, 190, '#ffb02e', a); g.save(); g.globalAlpha = a; text(g, 'Dona Maria, 72 anos', 110, 140, 66); text(g, 'quer ir sozinha de casa ao Posto de Saúde', 110, 205, 44, 600, '#dbe8ff'); g.restore(); }
  caption(g, 'No caminho mais curto, ela encontra barreiras.', win(t, 12.3, 12.9, 19.0, 19.8));
  // cena 3
  a = win(t, 20.4, 21.1, 31.2, 32.0);
  if (a > 0) { panel(g, 60, 60, 880, 150, '#ff3b4a', a); g.save(); g.globalAlpha = a; text(g, 'A comunidade avisa', 110, 163, 84); g.restore(); }
  caption(g, 'Moradores marcam os problemas. O caminho rápido, mas perigoso, vira “evitar”.', win(t, 22.4, 23.0, 31.0, 31.8));
  // cena 4
  a = win(t, 33.0, 33.8, 47.6, 48.4);
  if (a > 0) {
    const x = W - 60 - 800; panel(g, x, 60, 800, 210, '#18d98a', a); g.save(); g.globalAlpha = a;
    text(g, 'Rota mais acessível', x + 50, 130, 50, 800, '#7dffc1');
    text(g, '11 min · 0 barreiras', x + 50, 220, 74, 800); g.restore();
  }
  caption(g, 'O app calcula a rota mais acessível: rampas e faixa com semáforo.', win(t, 33.6, 34.2, 38.4, 39.0));
  caption(g, 'No caminho, um ponto de apoio: banco, água e Wi-Fi.', win(t, 39.4, 40.0, 45.0, 45.6));
  caption(g, 'Chegou ao Posto de Saúde, sozinha e sem barreiras.', win(t, 46.0, 46.5, 47.9, 48.4));
  // final
  a = win(t, 48.8, 49.8, 99, 100);
  if (a > 0) {
    g.save(); g.globalAlpha = a; const dy = (1 - a) * 30, x = 160, y = 190 + dy, w = 1600, h = 700;
    g.fillStyle = 'rgba(11,22,48,.95)'; rrect(g, x, y, w, h, 44); g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
    text(g, 'CaminhoSeguro · uma CitizenTech da Bela Vista', W / 2, y + 90, 40, 600, '#9fe2ff', 'center');
    text(g, 'Rotas acessíveis,', W / 2, y + 190, 88, 800, '#fff', 'center');
    text(g, 'decididas com a comunidade', W / 2, y + 285, 88, 800, '#fff', 'center');
    const ods = [['ODS 3', 'Saúde e bem-estar', '#4C9F38'], ['ODS 10', 'Redução das desigualdades', '#DD1367'], ['ODS 11', 'Cidades e comunidades sustentáveis', '#C98000']];
    ods.forEach((o, i) => {
      const cx = x + 80 + i * 500, cy = y + 340;
      g.fillStyle = o[2]; rrect(g, cx, cy, 460, 150, 26); g.fill();
      text(g, o[0], cx + 230, cy + 68, 58, 800, '#fff', 'center');
      g.font = `600 27px ${FONT}`; const lines = wrap(g, o[1], 420); lines.forEach((l, k) => text(g, l, cx + 230, cy + 108 + k * 30, 27, 600, '#fff', 'center'));
    });
    text(g, 'Equipe 1 — Lucas Branquinho e Vitor Bordalo', W / 2, y + 600, 54, 700, '#fff', 'center');
    g.restore();
  }
}

// ---------------------------------------------------------------- quadro
const tmp = new THREE.Vector3();
function update(t) {
  // avatar
  const st = avatarState(t);
  if (st && st.sc > .001) {
    avatar.visible = true; const p = st.path.at(st.s), d = st.path.dir(st.s);
    avatar.position.set(p.x, p.y, p.z); avatar.rotation.y = Math.atan2(d[0], d[1]); avatar.scale.setScalar(1.45 * st.sc);
    const walk = clamp(st.v / .8), ph = st.s * 4.2;
    legs[0].rotation.x = Math.sin(ph) * .6 * walk; legs[1].rotation.x = -Math.sin(ph) * .6 * walk;
    arms[0].rotation.x = -Math.sin(ph) * .45 * walk; arms[1].rotation.x = Math.sin(ph) * .15 * walk;
    body.position.y = Math.abs(Math.sin(ph)) * .05 * walk;
  } else avatar.visible = false;
  // linhas
  redLine.set(clamp((t - 22) / 5)); redGlow.set(clamp((t - 22) / 5));
  const dimRed = t > 34 ? lerp(1, .35, clamp((t - 34) / 1.5)) : 1;
  redLine.mat.opacity = dimRed; redGlow.mat.opacity = .28 * dimRed;
  greenLine.set(clamp((t - 32) / 3.5)); greenGlow.set(clamp((t - 32) / 3.5));
  texRed.offset.y = -t * .9; texGreen.offset.y = -t * 1.1;
  // marcadores
  for (const m of markers) {
    const u = clamp((t - m.t0) / .5), sc = easeOutBack(u);
    m.g.visible = u > 0; m.g.scale.setScalar(Math.max(.001, sc * (t > 33 ? .8 : 1)));
    m.pl.rotation.y = t * 1.1; m.pl.position.y = 4.1 + Math.sin(t * 2.2 + m.t0) * .18;
    m.disc.material.opacity = .3 + .12 * Math.sin(t * 3);
    if (t >= 20 && t < 32.5) { const f = ((t - 20) % 1.6) / 1.6; m.rip.scale.setScalar(1 + f * 5); m.rip.material.opacity = (1 - f) * .85; } else m.rip.material.opacity = 0;
  }
  APOIO.ring.material.opacity = t > 40 ? .45 + .35 * Math.sin(t * 3) : 0;
  // semáforo
  const verde = t >= 35.2 && t < 39.2;
  for (const s of sem) { s.r.material.color.setHex(verde ? 0x551111 : 0xff2a2a); s.gr.material.color.setHex(verde ? 0x30ff90 : 0x113d22); s.glow.visible = verde; }
  // câmera
  applyCamera(t);
  // rótulos
  for (const L of labels) {
    const vis = t >= L.t0 && (L.t1 == null || t < L.t1 + .3) && !(L.hide && t >= L.hide[0] && t < L.hide[1]);
    L.sp.visible = vis; if (!vis) continue;
    const pop = easeOutBack(clamp((t - L.t0) / .45)) * (L.t1 == null ? 1 : 1 - clamp((t - L.t1) / .3));
    const dist = camera.position.distanceTo(L.sp.position), f = Math.pow(Math.max(1, dist / 22), .5);
    L.sp.scale.set(Math.max(.001, L.w * f * pop), Math.max(.001, L.h * f * pop), 1);
  }
  // vista da pista de luz do pôr do sol: leve variação
  sun.intensity = 2.6;
}
function renderFrame(t) {
  update(t); renderer.render(scene, camera); drawHud(t); return true;
}
window.renderFrame = renderFrame;
window.DURACAO = DUR;

// ---------------------------------------------------------------- modo normal: loop em tempo real + interativo
renderFrame(0);
window.__pronto = true;
if (!GRAVANDO) {
  const dica = document.getElementById('dica'); dica.style.display = 'block';
  let playing = true, tNow = 0, last = performance.now(), drag = null;
  const el = document.getElementById('wrap');
  el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => { if (!drag) return; user.yaw -= (e.clientX - drag.x) * .006; user.pitch = clamp(user.pitch + (e.clientY - drag.y) * .004, -.8, 1.0); drag = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', () => { drag = null; });
  el.addEventListener('wheel', e => { e.preventDefault(); user.zoom = clamp(user.zoom * (e.deltaY > 0 ? 1.08 : .92), .35, 2.2); }, { passive: false });
  el.addEventListener('dblclick', () => { user.yaw = 0; user.pitch = 0; user.zoom = 1; });
  addEventListener('keydown', e => { if (e.code === 'Space') { playing = !playing; e.preventDefault(); } if (e.code === 'ArrowLeft') tNow = Math.max(0, tNow - 3); if (e.code === 'ArrowRight') tNow = Math.min(DUR, tNow + 3); });
  const loop = (now) => { const dt = (now - last) / 1000; last = now; if (playing) { tNow += dt; if (tNow > DUR + 2) tNow = 0; } renderFrame(Math.min(tNow, DUR)); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
