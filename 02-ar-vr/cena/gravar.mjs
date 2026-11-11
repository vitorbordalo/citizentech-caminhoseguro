// Grava a cena 3D em MP4 (Node 24, sem dependências).
// Uso:
//   node gravar.mjs                 -> renderiza todos os frames e monta o MP4
//   node gravar.mjs --servir        -> só serve a pasta (abra http://127.0.0.1:8765/)
//   node gravar.mjs --teste=3,17,40 -> salva PNGs desses instantes em quadros-teste/
//   opções: --workers=N  --retomar  --so-video  --porta=8765
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_MP4 = path.join(DIR, '..', 'caminhoseguro-arvr.mp4');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = 'C:\\Users\\Pichau\\Desktop\\GS-2026\\_ferramentas\\ffmpeg\\ffmpeg-9.0.2-essentials_build\\bin\\ffmpeg.exe';
const FPS = 30, DUR = 55, N = FPS * DUR;
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const PORTA = Number(args.porta || 8765);
const WORKERS = Number(args.workers || Math.max(1, Math.min(4, Math.floor(os.cpus().length / 3))));
const FRAMES = path.join(DIR, 'frames');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
function servir() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.normalize(path.join(DIR, p));
    if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(PORTA, '127.0.0.1', () => r(srv)));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.p = new Map(); ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && this.p.has(m.id)) { const { ok, ko } = this.p.get(m.id); this.p.delete(m.id); m.error ? ko(new Error(JSON.stringify(m.error))) : ok(m.result); } }); }
  send(method, params = {}) { const id = ++this.id; return new Promise((ok, ko) => { this.p.set(id, { ok, ko }); this.ws.send(JSON.stringify({ id, method, params })); }); }
}
async function abrirChrome(k) {
  const port = 9333 + k, udd = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--window-size=1920,1080', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--user-data-dir=${udd}`, '--no-first-run', '--hide-scrollbars', '--mute-audio', '--force-device-scale-factor=1', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 100; i++) {
    try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(x => x.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch { }
    await sleep(300);
  }
  if (!ws) throw new Error('Chrome não respondeu');
  const sock = new WebSocket(ws); await new Promise((ok, ko) => { sock.onopen = ok; sock.onerror = ko; });
  const c = new CDP(sock);
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url: `http://127.0.0.1:${PORTA}/index.html?gravar=1` });
  for (let i = 0; i < 200; i++) { const r = await c.send('Runtime.evaluate', { expression: 'window.__pronto===true', returnByValue: true }); if (r.result.value) break; await sleep(300); if (i === 199) throw new Error('página não carregou'); }
  return { c, proc, udd, sock };
}
async function fechar(w) { try { w.sock.close(); } catch { } w.proc.kill(); await sleep(500); try { fs.rmSync(w.udd, { recursive: true, force: true }); } catch { } }
async function capturar(w, t) {
  const r = await w.c.send('Runtime.evaluate', { expression: `window.renderFrame(${t})`, returnByValue: true });
  if (r.exceptionDetails) throw new Error('renderFrame falhou: ' + JSON.stringify(r.exceptionDetails));
  const s = await w.c.send('Page.captureScreenshot', { format: 'png' });
  return Buffer.from(s.data, 'base64');
}

// ---------------------------------------------------------------- trilha sonora sintetizada (sem músicas de terceiros)
function gerarTrilha(arq) {
  const SR = 44100, n = SR * DUR, L = new Float32Array(n), Rr = new Float32Array(n);
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const nota = (m, t0, dur, amp, { att = .05, rel = .5, harm = [1, .3, .1], pan = 0 } = {}) => {
    const f = hz(m), i0 = Math.floor(t0 * SR), len = Math.floor((dur + rel) * SR);
    for (let i = 0; i < len && i0 + i < n; i++) {
      const t = i / SR; let env = Math.min(1, t / att); if (t > dur) env *= Math.max(0, 1 - (t - dur) / rel);
      let v = 0; harm.forEach((h, k) => { v += h * Math.sin(2 * Math.PI * f * (k + 1) * t + k); });
      v *= amp * env; L[i0 + i] += v * (1 - Math.max(0, pan)); Rr[i0 + i] += v * (1 + Math.min(0, pan));
    }
  };
  // pads: Am F C G
  const acordes = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  for (let c = 0; c * 6.9 < DUR; c++) acordes[c % 4].forEach((m, k) => { nota(m, c * 6.9, 6.6, .045, { att: 1.4, rel: 1.6, harm: [1, .15], pan: (k - 1) * .4 }); nota(m + 12, c * 6.9 + .1, 6.4, .02, { att: 1.8, rel: 1.6, harm: [1], pan: (1 - k) * .4 }); });
  // pulso suave de arpejo na parte positiva (32 s em diante)
  const pent = [69, 72, 74, 76, 79, 81];
  for (let t = 32.5, i = 0; t < 52; t += .6, i++) nota(pent[(i * 2 + (i >> 2)) % pent.length], t, .15, .03, { att: .01, rel: .5, harm: [1, .2], pan: (i % 2 ? .3 : -.3) });
  // alertas das barreiras (dois tons descendentes)
  [8.3, 11.0, 15.0, 17.6].forEach(t => { nota(69, t, .12, .08, { att: .01, rel: .15, harm: [1, .4] }); nota(64, t + .16, .16, .08, { att: .01, rel: .2, harm: [1, .4] }); });
  // avisos da comunidade
  [20.5, 20.95, 21.4, 21.85].forEach(t => nota(81, t, .1, .05, { att: .005, rel: .4, harm: [1, .3] }));
  // rota calculada e chegada
  [72, 76, 79, 84].forEach((m, i) => nota(m, 32.9 + i * .12, .2, .06, { att: .01, rel: .6 }));
  [60, 64, 67, 72, 76].forEach((m, i) => nota(m, 47.5 + i * .05, .8, .05, { att: .01, rel: 1.6 }));
  // fade final
  const buf = Buffer.alloc(44 + n * 4);
  let pico = 0; for (let i = 0; i < n; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(Rr[i]));
  const g = .32 / (pico || 1);
  for (let i = 0; i < n; i++) {
    const t = i / SR, fade = Math.min(1, t / .8, (DUR - t) / 2.0);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g * fade)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[i] * g * fade)) * 32767), 46 + i * 4);
  }
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  fs.writeFileSync(arq, buf);
}

function montar() {
  const wav = path.join(DIR, 'trilha.wav'); gerarTrilha(wav);
  execFileSync(FFMPEG, ['-y', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.png'), '-i', wav, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT_MP4], { stdio: 'inherit' });
  console.log('MP4 gerado em', OUT_MP4);
}

async function main() {
  const srv = await servir();
  if (args.servir) { console.log(`Cena em http://127.0.0.1:${PORTA}/  (Ctrl+C para sair)`); return; }
  if (args['so-video']) { montar(); srv.close(); return; }
  fs.mkdirSync(FRAMES, { recursive: true });
  const teste = args.teste ? String(args.teste).split(',').map(Number) : null;
  const tarefas = teste ? teste.map((t, i) => ({ t, arq: path.join(DIR, 'quadros-teste', `t${String(t).replace('.', '_')}.png`) })) : Array.from({ length: N }, (_, i) => ({ t: i / FPS, arq: path.join(FRAMES, `f${String(i).padStart(5, '0')}.png`) }));
  if (teste) fs.mkdirSync(path.join(DIR, 'quadros-teste'), { recursive: true });
  const nw = teste ? 1 : WORKERS;
  const ini = Date.now(); let feitos = 0;
  const ws = await Promise.all(Array.from({ length: nw }, (_, k) => abrirChrome(k)));
  try {
    await Promise.all(ws.map(async (w, k) => {
      for (let i = k; i < tarefas.length; i += nw) {
        const T = tarefas[i]; if (args.retomar && fs.existsSync(T.arq)) { feitos++; continue; }
        fs.writeFileSync(T.arq, await capturar(w, T.t)); feitos++;
        if (feitos % 50 === 0) console.log(`${feitos}/${tarefas.length}  (${((Date.now() - ini) / 1000).toFixed(0)} s)`);
      }
    }));
  } finally { await Promise.all(ws.map(fechar)); srv.close(); }
  console.log('frames prontos em', ((Date.now() - ini) / 1000).toFixed(0), 's');
  if (!teste) montar();
}
main().then(() => { if (args.servir) return; process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
