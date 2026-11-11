#!/usr/bin/env node
/*
 * GERADOR DO DIAGRAMA DE CLASSES (CaminhoSeguro API)
 * ---------------------------------------------------------------------------
 * LE os arquivos .java de ../caminhoseguro-api/src/main/java e gera:
 *   - diagramas/fig-N.svg        (uma figura por pagina A4 paisagem)
 *   - diagrama_classes.html      (todas as figuras juntas, para conferir)
 *
 * O que e extraido do codigo: classes/interfaces/records, atributos (visibilidade e tipo),
 * metodos publicos (assinatura resumida), extends/implements e dependencias
 * (campos injetados, parametros de construtor/metodos e chaves estrangeiras idXxx).
 * So o POSICIONAMENTO das caixas nas figuras (variavel FIGURAS, mais abaixo) e manual.
 *
 * Como regerar quando o codigo mudar:
 *     node doc/gerar_diagrama_classes.mjs            (sem dependencias, so Node)
 *     node doc/gerar_diagrama_classes.mjs --json     (imprime o que foi lido do codigo)
 * Depois remonte o PDF:  node doc/montar_pdf.mjs LINK_GITHUB LINK_DEPLOY
 * Se uma classe nova nao aparecer, inclua-a em FIGURAS (nome e posicao x, y).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(DIR, '../caminhoseguro-api/src/main/java');
const SAIDA = path.join(DIR, 'diagramas');

// ============================================================ 1. LEITURA DO JAVA
function listar(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? listar(path.join(dir, e.name)) : e.name.endsWith('.java') ? [path.join(dir, e.name)] : []);
}

// remove comentarios e esvazia o conteudo de strings/chars
function limpar(src) {
  let r = '', i = 0;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'") {
      const q = c; r += q; i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      r += q; i++; continue;
    }
    r += c; i++;
  }
  return r;
}

function casar(s, i, ab = '{', fe = '}') { // indice do fechamento que casa com s[i]
  let n = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === ab) n++;
    else if (s[j] === fe && --n === 0) return j;
  }
  return s.length - 1;
}

const RE_ANOT = /@\w+(?:\.\w+)*(?:\s*\((?:[^()]|\([^()]*\))*\))?/g;
const semAnot = s => s.replace(RE_ANOT, ' ').replace(/\s+/g, ' ').trim();

function dividirVirgula(s) { // divide por virgula fora de <>
  const r = []; let n = 0, b = '';
  for (const c of s) {
    if (c === '<') n++; if (c === '>') n--;
    if (c === ',' && n === 0) { r.push(b.trim()); b = ''; } else b += c;
  }
  if (b.trim()) r.push(b.trim());
  return r;
}

function dividirMembros(corpo) {
  const res = []; let buf = '', i = 0;
  while (i < corpo.length) {
    const c = corpo[i];
    if (c === '(') { const f = casar(corpo, i, '(', ')'); buf += corpo.slice(i, f + 1); i = f + 1; continue; }
    if (c === '{') {
      const f = casar(corpo, i);
      const ehCampo = /=/.test(buf.replace(RE_ANOT, '').replace(/\([^)]*\)/g, ''));
      if (ehCampo) { // campo com inicializador em bloco/lambda: vai ate o ';'
        let j = f + 1, n = 0;
        while (j < corpo.length && !(corpo[j] === ';' && n === 0)) { if (corpo[j] === '{') n++; if (corpo[j] === '}') n--; j++; }
        res.push({ cab: buf.trim(), corpo: null }); buf = ''; i = j + 1; continue;
      }
      res.push({ cab: buf.trim(), corpo: corpo.slice(i + 1, f) }); buf = ''; i = f + 1; continue;
    }
    if (c === ';') { res.push({ cab: buf.trim(), corpo: null }); buf = ''; i++; continue; }
    buf += c; i++;
  }
  return res;
}

const RE_TIPO = /^((?:(?:public|private|protected|static|final|abstract|sealed)\s+)*)(class|interface|record|enum)\s+(\w+)/;

function visib(mods, naInterface) {
  if (/\bpublic\b/.test(mods) || naInterface) return '+';
  if (/\bprivate\b/.test(mods)) return '-';
  if (/\bprotected\b/.test(mods)) return '#';
  return '~';
}

function parseParams(s) {
  return dividirVirgula(s).map(p => {
    p = semAnot(p).replace(/\bfinal\s+/, '');
    const m = p.match(/^(.+)\s+(\w+)$/);
    return m ? { tipo: m[1].trim(), nome: m[2] } : { tipo: p, nome: '' };
  }).filter(p => p.tipo);
}

function parseTipo(texto, pacote, externo = null) {
  // texto: do inicio das anotacoes/modificadores ate o fim do corpo
  const ini = texto.search(/\b(class|interface|record|enum)\s+\w+/);
  const anots = [...texto.slice(0, ini).matchAll(/@(\w+)/g)].map(m => m[1]);
  const abre = texto.indexOf('{', ini);
  let cab = texto.slice(ini, abre).replace(/\s+/g, ' ');
  const mods = texto.slice(0, ini).replace(RE_ANOT, ' ');
  const kind = cab.match(/^(class|interface|record|enum)/)[1];
  const nome = cab.match(/^\w+\s+(\w+)/)[1];
  let componentes = [];
  if (kind === 'record') {
    const p0 = cab.indexOf('('), p1 = casar(cab, p0, '(', ')');
    componentes = parseParams(cab.slice(p0 + 1, p1));
    cab = cab.slice(0, p0) + cab.slice(p1 + 1);
  }
  const ext = (cab.match(/\bextends\s+(.+?)(?=\s+implements\b|$)/) || [])[1];
  const impl = (cab.match(/\bimplements\s+(.+)$/) || [])[1];
  const t = {
    nome, kind, pacote, anots,
    abstrato: /\babstract\b/.test(mods),
    extends: ext ? dividirVirgula(ext).map(x => x.replace(/<.*>/, '')) : [],
    implements: impl ? dividirVirgula(impl).map(x => x.replace(/<.*>/, '')) : [],
    campos: [], metodos: [], ctors: [], internos: [], externo,
  };
  for (const c of componentes) t.campos.push({ vis: '-', nome: c.nome, tipo: c.tipo });
  const corpo = texto.slice(abre + 1, casar(texto, abre));
  for (const m of dividirMembros(corpo)) {
    const cabM = semAnot(m.cab);
    if (!cabM) continue;
    const mt = cabM.match(RE_TIPO);
    if (mt) { // tipo interno
      const modsI = mt[1];
      if (!/\bpublic\b/.test(modsI) && kind !== 'interface') continue; // so internos publicos
      const textoI = m.cab + ' {' + (m.corpo ?? '') + '}';
      t.internos.push(parseTipo(textoI, pacote, null));
      continue;
    }
    const eqPos = cabM.indexOf('='), parPos = cabM.indexOf('(');
    if (parPos >= 0 && (eqPos < 0 || parPos < eqPos)) { // metodo ou construtor
      const mm = cabM.match(/^((?:(?:public|private|protected|static|final|abstract|synchronized|default)\s+)*)(?:<[^>]*>\s*)?(?:(.+?)\s+)?(\w+)\s*\((.*)\)\s*(?:throws\s+[\w.,\s]+)?$/s);
      if (!mm) continue;
      const [, modsM, ret, nm, params] = mm;
      const item = {
        vis: visib(modsM, kind === 'interface'), nome: nm, ret: ret || null,
        params: parseParams(params), estatico: /\bstatic\b/.test(modsM), abstrato: /\babstract\b/.test(modsM),
        anots: [...m.cab.matchAll(/@(\w+)/g)].map(x => x[1]),
      };
      if (!ret && nm === nome) t.ctors.push(item); else t.metodos.push(item);
    } else { // campo
      const semInit = eqPos >= 0 ? cabM.slice(0, eqPos).trim() : cabM;
      const mf = semInit.match(/^((?:(?:public|private|protected|static|final|transient|volatile)\s+)*)(.+?)\s+(\w+)$/);
      if (!mf) continue;
      if (/\bstatic\b/.test(mf[1])) continue; // constantes/estaticos nao entram no diagrama
      t.campos.push({ vis: visib(mf[1], kind === 'interface'), nome: mf[3], tipo: mf[2], final: /\bfinal\b/.test(mf[1]) });
    }
  }
  return t;
}

function lerProjeto() {
  const classes = [];
  for (const arq of listar(SRC)) {
    const txt = limpar(fs.readFileSync(arq, 'utf8'));
    const pacote = (txt.match(/\bpackage\s+([\w.]+)\s*;/) || [])[1] || '';
    const curto = pacote.split('.').pop();
    const depoisImports = txt.slice(Math.max(txt.lastIndexOf('\nimport '), 0));
    const aposImp = depoisImports.slice(depoisImports.indexOf(';') + 1);
    const t = parseTipo(aposImp.trim(), curto === 'caminhoseguro' ? 'app' : curto);
    t.arquivo = path.relative(SRC, arq).replace(/\\/g, '/');
    classes.push(t);
    for (const i of t.internos) { i.dono = t.nome; i.arquivo = t.arquivo; classes.push(i); }
  }
  return classes;
}

// ============================================================ 2. RELACOES
function idsDoTipo(tipo) { return [...tipo.matchAll(/\b[A-Z]\w*/g)].map(m => m[0]); }

function relacoes(classes) {
  const porNome = new Map(classes.map(c => [c.nome, c]));
  const rel = []; // {de, para, tipo: heranca|realiza|fk|campo|uso, rotulo}
  for (const c of classes) {
    for (const e of c.extends) rel.push({ de: c.nome, para: e, tipo: 'heranca' });
    for (const e of c.implements) rel.push({ de: c.nome, para: e, tipo: 'realiza' });
    const vistos = new Set();
    for (const f of c.campos) {
      const fk = f.nome.match(/^id([A-Z]\w*)$/);
      if (c.pacote === 'model' && fk) {
        let alvo = fk[1];
        if (!porNome.has(alvo)) alvo = alvo.replace(/(Origem|Destino)$/, '');
        if (porNome.has(alvo)) { rel.push({ de: c.nome, para: alvo, tipo: 'fk', rotulo: f.nome }); vistos.add(alvo); continue; }
      }
      for (const id of idsDoTipo(f.tipo)) {
        if (porNome.has(id) && id !== c.nome) {
          rel.push({ de: c.nome, para: id, tipo: 'campo', rotulo: f.nome, multi: /List|Set|Collection/.test(f.tipo), interno: porNome.get(id).dono === c.nome });
          vistos.add(id);
        }
      }
    }
    const usos = new Set();
    for (const m of [...c.ctors, ...c.metodos]) {
      for (const p of m.params) for (const id of idsDoTipo(p.tipo)) usos.add(id);
      if (m.ret) for (const id of idsDoTipo(m.ret)) usos.add(id);
    }
    for (const id of usos) if (porNome.has(id) && id !== c.nome && !vistos.has(id)) rel.push({ de: c.nome, para: id, tipo: 'uso' });
  }
  return rel;
}

// ============================================================ 3. LAYOUT DAS FIGURAS
// Cada figura: titulo, nos {n, x, y, w, compacto?} e opcoes. Coordenadas em px do SVG (largura 1000).
// pacotes: true => desenha a moldura de cada pacote em volta dos nos dele.
// arestas: tipos de relacao desenhados. so: filtra pares {de, para} (opcional).
const FIGURAS = [
  {
    id: 1, titulo: 'Pacote model: entidades e referências por chave estrangeira', pacotes: true,
    nos: [
      { n: 'Bairro', x: 6, y: 44, w: 192 }, { n: 'Local', x: 280, y: 44, w: 192 }, { n: 'Trecho', x: 554, y: 44, w: 192 }, { n: 'Ocorrencia', x: 828, y: 44, w: 192 },
      { n: 'TipoLocal', x: 6, y: 300, w: 192 }, { n: 'RotaConsulta', x: 280, y: 300, w: 192 }, { n: 'Usuario', x: 554, y: 300, w: 192 }, { n: 'TipoOcorrencia', x: 828, y: 300, w: 192 },
    ],
    arestas: ['fk'],
  },
  {
    id: 2, titulo: 'Camadas por recurso (1/5): usuários, tipos de ocorrência e status', pacotes: true,
    nos: [
      { n: 'UsuarioController', x: 10, y: 40, w: 330 }, { n: 'StatusController', x: 10, y: 250, w: 330 },
      { n: 'UsuarioBO', x: 380, y: 40, w: 300, h: 270 }, { n: 'UsuarioDAO', x: 730, y: 40, w: 295 },
      { n: 'OcorrenciaDAO', x: 730, y: 235, w: 295, compacto: true }, { n: 'RotaConsultaDAO', x: 730, y: 285, w: 295, compacto: true },
      { n: 'TipoOcorrenciaController', x: 10, y: 400, w: 330 }, { n: 'TipoOcorrenciaBO', x: 380, y: 400, w: 300 }, { n: 'TipoOcorrenciaDAO', x: 730, y: 400, w: 295 },
    ],
    arestas: ['campo'],
  },
  {
    id: 3, titulo: 'Camadas por recurso (2/5): locais', pacotes: true,
    nos: [
      { n: 'LocalController', x: 10, y: 40, w: 330 }, { n: 'LocalBO', x: 380, y: 40, w: 300, h: 330 }, { n: 'LocalDAO', x: 730, y: 40, w: 295 },
      { n: 'BairroDAO', x: 730, y: 300, w: 295, compacto: true }, { n: 'TipoLocalDAO', x: 730, y: 352, w: 295, compacto: true },
    ],
    arestas: ['campo'],
  },
  {
    id: 4, titulo: 'Camadas por recurso (3/5): trechos', pacotes: true,
    nos: [
      { n: 'TrechoController', x: 10, y: 40, w: 330 }, { n: 'TrechoBO', x: 380, y: 40, w: 300, h: 300 }, { n: 'TrechoDAO', x: 730, y: 40, w: 295 },
      { n: 'LocalDAO', x: 730, y: 275, w: 295, compacto: true },
    ],
    arestas: ['campo'],
  },
  {
    id: 5, titulo: 'Camadas por recurso (4/5): ocorrências', pacotes: true,
    nos: [
      { n: 'OcorrenciaController', x: 10, y: 40, w: 355 }, { n: 'OcorrenciaBO', x: 395, y: 40, w: 300, h: 300 }, { n: 'OcorrenciaDAO', x: 730, y: 40, w: 295 },
      { n: 'TrechoDAO', x: 730, y: 262, w: 295, compacto: true }, { n: 'UsuarioDAO', x: 730, y: 312, w: 295, compacto: true }, { n: 'TipoOcorrenciaDAO', x: 730, y: 362, w: 295, compacto: true },
    ],
    arestas: ['campo'],
  },
  {
    id: 6, titulo: 'Camadas por recurso (5/5): cálculo da rota (Dijkstra)', pacotes: true,
    nos: [
      { n: 'RotaController', x: 10, y: 40, w: 345 }, { n: 'RotaResposta', x: 10, y: 270, w: 345, compacto: true },
      { n: 'RotaBO', x: 390, y: 40, w: 350, h: 270 }, { n: 'CalculadoraRotaBO', x: 390, y: 360, w: 350 },
      { n: 'LocalDAO', x: 790, y: 40, w: 235, compacto: true }, { n: 'TrechoDAO', x: 790, y: 92, w: 235, compacto: true },
      { n: 'UsuarioDAO', x: 790, y: 144, w: 235, compacto: true }, { n: 'OcorrenciaDAO', x: 790, y: 196, w: 235, compacto: true },
      { n: 'RotaConsultaDAO', x: 790, y: 248, w: 235, compacto: true },
      { n: 'Trecho', x: 790, y: 380, w: 235, compacto: true },
    ],
    arestas: ['campo', 'uso'],
    so: [['RotaController', 'RotaBO'], ['RotaBO', 'CalculadoraRotaBO'], ['RotaBO', 'LocalDAO'], ['RotaBO', 'TrechoDAO'], ['RotaBO', 'UsuarioDAO'],
      ['RotaBO', 'OcorrenciaDAO'], ['RotaBO', 'RotaConsultaDAO'], ['RotaBO', 'RotaResposta'], ['CalculadoraRotaBO', 'Trecho'], ['RotaController', 'RotaResposta']],
  },
  {
    id: 7, titulo: 'Pacote dao: hierarquia a partir de BaseDAO (JDBC puro)', pacotes: false,
    nos: [
      { n: 'BairroDAO', x: 6, y: 10, w: 230 }, { n: 'TipoLocalDAO', x: 242, y: 10, w: 240 }, { n: 'TipoOcorrenciaDAO', x: 488, y: 10, w: 245 }, { n: 'RotaConsultaDAO', x: 740, y: 10, w: 290 },
      { n: 'BaseDAO', x: 210, y: 150, w: 600 },
      { n: 'UsuarioDAO', x: 6, y: 395, w: 228 }, { n: 'LocalDAO', x: 240, y: 395, w: 250 }, { n: 'TrechoDAO', x: 496, y: 395, w: 235 }, { n: 'OcorrenciaDAO', x: 737, y: 395, w: 295 },
    ],
    arestas: ['heranca'],
  },
  {
    id: 8, titulo: 'Pacote exception: exceções próprias e tratador global (@RestControllerAdvice)', pacotes: true,
    nos: [
      { n: 'RuntimeException', x: 390, y: 10, w: 240, externo: '«JDK»' },
      { n: 'RecursoNaoEncontradoException', x: 6, y: 120, w: 235 }, { n: 'ConflitoException', x: 249, y: 120, w: 160 }, { n: 'RegraNegocioException', x: 417, y: 120, w: 175 },
      { n: 'RequisicaoInvalidaException', x: 600, y: 120, w: 215 }, { n: 'ErroBancoException', x: 823, y: 120, w: 200 },
      { n: 'ManipuladorExcecoes', x: 10, y: 215, w: 645 }, { n: 'ErroResposta', x: 200, y: 525, w: 300, compacto: true },
    ],
    arestas: ['heranca', 'uso'],
    so: [['ManipuladorExcecoes', 'ErroResposta']],
  },
  {
    id: 9, titulo: 'Pacotes dto e config e classe principal', pacotes: true,
    nos: [
      { n: 'RotaResposta', x: 10, y: 50, w: 330 }, { n: 'LocalResumo', x: 10, y: 330, w: 330 }, { n: 'ErroResposta', x: 370, y: 50, w: 280 },
      { n: 'WebMvcConfigurer', x: 730, y: 20, w: 280, externo: '«interface»' },
      { n: 'CorsConfig', x: 730, y: 130, w: 280 }, { n: 'OpenApiConfig', x: 730, y: 225, w: 280 }, { n: 'CaminhoseguroApiApplication', x: 700, y: 385, w: 330 },
    ],
    arestas: ['campo', 'realiza'],
  },
];

// ============================================================ 4. DESENHO SVG
const FONTE = "Consolas, 'Courier New', monospace";
const FS = 11, CW = 6.5, LH = 15.5; // tamanho da fonte, largura do caractere (estimada), altura da linha
const COR = {
  model: '#dbe9f6', dao: '#fde6cf', bo: '#dff1e3', controller: '#ece0f5', exception: '#fbdcdc', dto: '#fff2c4', config: '#e6e6e6', app: '#e6e6e6', externo: '#ffffff',
};
const COR_MOLDURA = { model: '#6d9bc8', dao: '#d9a066', bo: '#6fb283', controller: '#a583c4', exception: '#d98a8a', dto: '#d5b64a', config: '#999', app: '#999' };
const ESTEREO = { RestController: 'controller', Service: 'service', Component: 'component', Repository: 'repository', Configuration: 'configuration', RestControllerAdvice: 'advice', SpringBootApplication: 'application' };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const semGen = t => t.replace(/java\.util\./g, '');

function linhaMetodo(m, maxCh) {
  if (m.nome === '«ctor»') return `${m.vis} ${m.nome}(${m.params.map(p => semGen(p.tipo)).join(', ')})`;
  const ret = m.ret && m.ret !== 'void' ? ` : ${semGen(m.ret)}` : '';
  let l = `${m.vis} ${m.nome}(${m.params.map(p => `${semGen(p.tipo)} ${p.nome}`).join(', ')})${ret}`;
  if (l.length > maxCh) l = `${m.vis} ${m.nome}(${m.params.map(p => semGen(p.tipo)).join(', ')})${ret}`;
  if (l.length > maxCh && m.params.length > 1) l = `${m.vis} ${m.nome}(${semGen(m.params[0].tipo)}, …)${ret}`;
  if (l.length > maxCh) l = l.slice(0, maxCh - 1) + '…';
  return l;
}

function montarCaixa(c, no) {
  const maxCh = Math.floor((no.w - 12) / CW);
  const est = c.kind === 'interface' ? 'interface' : c.kind === 'record' ? 'record'
    : (c.anots.map(a => ESTEREO[a]).find(Boolean) || null);
  const campos = c.campos.map(f => `${f.vis} ${f.nome} : ${semGen(f.tipo)}`.slice(0, maxCh));
  const acessor = new Set(); // getters/setters/is de campos viram uma linha so
  let temAcessor = false;
  const metodos = [];
  const mostrarCtor = c.pacote === 'exception' && c.kind !== 'record' && !c.anots.includes('RestControllerAdvice');
  const ctors = mostrarCtor ? c.ctors.map(k => ({ ...k, nome: '«ctor»' })) : [];
  for (const m of [...ctors, ...c.metodos]) {
    if (m.vis !== '+' && !(c.abstrato && m.vis === '#')) continue;
    if (c.pacote === 'model' || c.pacote === 'dto') {
      const alvo = m.nome.replace(/^(get|set|is)/, '');
      if (alvo !== m.nome && c.campos.some(f => f.nome.toLowerCase() === alvo.toLowerCase())) { temAcessor = true; continue; }
    }
    metodos.push({ txt: linhaMetodo(m, maxCh), est: m.estatico });
  }
  if (temAcessor) metodos.unshift({ txt: '+ getters e setters', est: false });
  const compacto = no.compacto || no.externo;
  const hCab = 26 + (est || no.externo ? 14 : 0);
  const hCampos = compacto ? 0 : Math.max(campos.length, 1) * LH + 8;
  const hMet = compacto ? 0 : Math.max(metodos.length, 1) * LH + 8;
  const hMin = no.h || 0;
  return { c, no, hMinimo: hMin, est: no.externo || (est ? `«${est}»` : null), campos, metodos, compacto, hCab, hCampos, hMet, h: Math.max(hCab + hCampos + hMet, hMin) };
}

function desenharCaixa(b) {
  const { c, no } = b;
  const x = no.x, y = no.y, w = no.w;
  const fill = no.externo ? '#fff' : COR[c.pacote] || '#eee';
  const dash = no.externo || no.compacto ? ' stroke-dasharray="5 3"' : '';
  let s = `<g>\n<rect x="${x}" y="${y}" width="${w}" height="${b.h}" fill="#fff" stroke="#0b3d5c" stroke-width="1.4"${dash}/>\n`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${b.hCab}" fill="${fill}" stroke="#0b3d5c" stroke-width="1.4"${dash}/>\n`;
  let ty = y + 18;
  if (b.est) { s += `<text x="${x + w / 2}" y="${y + 14}" text-anchor="middle" font-size="10.5" fill="#444" font-family="${FONTE}">${esc(b.est)}</text>\n`; ty += 14; }
  const nomeEx = c.dono ? `${c.nome}` : c.nome;
  s += `<text x="${x + w / 2}" y="${ty}" text-anchor="middle" font-size="13.5" font-weight="700" fill="#0b3d5c" font-family="Segoe UI, Arial, sans-serif"${c.abstrato ? ' font-style="italic"' : ''}>${esc(nomeEx)}</text>\n`;
  if (!b.compacto) {
    let yy = y + b.hCab;
    s += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}" stroke="#0b3d5c" stroke-width="1.2"/>\n`;
    b.campos.forEach((l, i) => { s += `<text x="${x + 6}" y="${yy + 14 + i * LH}" font-size="${FS}" font-family="${FONTE}" fill="#111">${esc(l)}</text>\n`; });
    yy += b.hCampos;
    s += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}" stroke="#0b3d5c" stroke-width="1.2"/>\n`;
    b.metodos.forEach((m, i) => { s += `<text x="${x + 6}" y="${yy + 14 + i * LH}" font-size="${FS}" font-family="${FONTE}" fill="#111"${m.est ? ' text-decoration="underline"' : ''}>${esc(m.txt)}</text>\n`; });
  }
  return s + '</g>\n';
}

// ponto de ancoragem de uma aresta entre caixas a e b (retorna {p, q, ori})
function ancorar(a, b, desloc = 0) {
  const ax1 = a.x, ax2 = a.x + a.w, ay1 = a.y, ay2 = a.y + a.h;
  const bx1 = b.x, bx2 = b.x + b.w, by1 = b.y, by2 = b.y + b.h;
  const sobX = [Math.max(ax1, bx1), Math.min(ax2, bx2)];
  const sobY = [Math.max(ay1, by1), Math.min(ay2, by2)];
  if (sobX[0] < sobX[1] - 20) { // alinhadas na vertical
    const x = (sobX[0] + sobX[1]) / 2 + desloc;
    return a.y < b.y ? { p: [x, ay2], q: [x, by1], ori: 'v' } : { p: [x, ay1], q: [x, by2], ori: 'v' };
  }
  if (sobY[0] < sobY[1] - 14) { // alinhadas na horizontal
    const y = (sobY[0] + sobY[1]) / 2 + desloc;
    return a.x < b.x ? { p: [ax2, y], q: [bx1, y], ori: 'h' } : { p: [ax1, y], q: [bx2, y], ori: 'h' };
  }
  // diagonal: do canto/lado mais proximo
  const px = a.x < b.x ? ax2 : ax1, qx = a.x < b.x ? bx1 : bx2;
  const py = a.y < b.y ? ay2 - Math.min(20, a.h / 2) : ay1 + Math.min(20, a.h / 2);
  const qy = a.y < b.y ? by1 + Math.min(20, b.h / 2) : by2 - Math.min(20, b.h / 2);
  return { p: [px, py + desloc], q: [qx, qy + desloc], ori: 'd' };
}

function seta(p, q, tipo) { // marcador na ponta q
  const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const rot = (dx, dy) => [q[0] + dx * Math.cos(ang) - dy * Math.sin(ang), q[1] + dx * Math.sin(ang) + dy * Math.cos(ang)];
  const f = pts => pts.map(t => t.map(n => n.toFixed(1)).join(',')).join(' ');
  if (tipo === 'heranca' || tipo === 'realiza') return `<polygon points="${f([rot(0, 0), rot(-14, -7), rot(-14, 7)])}" fill="#fff" stroke="#0b3d5c" stroke-width="1.4"/>`;
  if (tipo === 'composicao') return `<polygon points="${f([rot(0, 0), rot(-9, -5), rot(-18, 0), rot(-9, 5)])}" fill="#0b3d5c" stroke="#0b3d5c" stroke-width="1"/>`;
  return `<polyline points="${f([rot(-11, -6), rot(0, 0), rot(-11, 6)])}" fill="none" stroke="#0b3d5c" stroke-width="1.5"/>`;
}

function gerarFigura(fig, classes, rel) {
  const porNome = new Map(classes.map(c => [c.nome, c]));
  const caixas = new Map();
  for (const no of fig.nos) {
    let c = porNome.get(no.n);
    if (!c) {
      if (!no.externo) { console.warn(`  aviso: classe ${no.n} não encontrada no código (figura ${fig.id})`); continue; }
      c = { nome: no.n, kind: 'class', pacote: null, anots: [], campos: [], metodos: [], ctors: [], extends: [], implements: [] };
    }
    const b = montarCaixa(c, no);
    Object.assign(b, { x: no.x, y: no.y, w: no.w });
    caixas.set(no.n, b);
  }
  let svgFundo = '', svgArestas = '', svgCaixas = '', svgRotulos = '';

  // molduras de pacote
  if (fig.pacotes) {
    const grupos = new Map();
    for (const b of caixas.values()) if (b.c.pacote && !b.no.externo) (grupos.get(b.c.pacote) || grupos.set(b.c.pacote, []).get(b.c.pacote)).push(b);
    for (const [pac, bs] of grupos) {
      const x1 = Math.min(...bs.map(b => b.x)) - 10, y1 = Math.min(...bs.map(b => b.y)) - 26;
      const x2 = Math.max(...bs.map(b => b.x + b.w)) + 10, y2 = Math.max(...bs.map(b => b.y + b.h)) + 10;
      const cor = COR_MOLDURA[pac] || '#999';
      svgFundo += `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="4" fill="${COR[pac] || '#eee'}" fill-opacity=".28" stroke="${cor}" stroke-width="1.3" stroke-dasharray="7 4"/>\n`;
      const nomeP = 'br.com.fiap.caminhoseguro.' + pac;
      const wT = Math.min(nomeP.length * 6.4 + 16, x2 - x1);
      svgFundo += `<rect x="${x1}" y="${y1 - 17}" width="${wT}" height="17" fill="${COR[pac] || '#eee'}" stroke="${cor}" stroke-width="1.3"/>\n`;
      svgFundo += `<text x="${x1 + 8}" y="${y1 - 4.5}" font-size="11" font-family="${FONTE}" fill="#222">${esc(nomeP)}</text>\n`;
    }
  }

  // arestas
  const pares = new Map();
  const arestas = rel.filter(r => fig.arestas.includes(r.tipo) && caixas.has(r.de) && caixas.has(r.para)
    && (!fig.so || fig.so.some(([d, p]) => d === r.de && p === r.para)));
  // heranca em barramento
  const herd = arestas.filter(r => r.tipo === 'heranca' || r.tipo === 'realiza');
  const grupos = new Map();
  for (const r of herd) (grupos.get(r.para) || grupos.set(r.para, []).get(r.para)).push(r);
  for (const [pai, rs] of grupos) {
    const P = caixas.get(pai);
    for (const lado of ['cima', 'baixo']) {
      const fs_ = rs.map(r => caixas.get(r.de)).filter(b => lado === 'cima' ? b.y + b.h <= P.y : b.y >= P.y + P.h);
      if (!fs_.length) continue;
      const pcx = P.x + P.w / 2;
      const dash = rs[0].tipo === 'realiza' ? ' stroke-dasharray="6 4"' : '';
      if (lado === 'cima') {
        const maxB = Math.max(...fs_.map(b => b.y + b.h));
        const yb = (maxB + P.y) / 2;
        for (const b of fs_) svgArestas += `<polyline points="${b.x + b.w / 2},${b.y + b.h} ${b.x + b.w / 2},${yb} ${pcx},${yb}" fill="none" stroke="#0b3d5c" stroke-width="1.4"${dash}/>\n`;
        svgArestas += `<line x1="${pcx}" y1="${yb}" x2="${pcx}" y2="${P.y - 0}" stroke="#0b3d5c" stroke-width="1.4"${dash}/>\n${seta([pcx, yb], [pcx, P.y], 'heranca')}\n`;
      } else {
        const minT = Math.min(...fs_.map(b => b.y));
        const yb = (minT + P.y + P.h) / 2;
        for (const b of fs_) svgArestas += `<polyline points="${b.x + b.w / 2},${b.y} ${b.x + b.w / 2},${yb} ${pcx},${yb}" fill="none" stroke="#0b3d5c" stroke-width="1.4"${dash}/>\n`;
        svgArestas += `<line x1="${pcx}" y1="${yb}" x2="${pcx}" y2="${P.y + P.h}" stroke="#0b3d5c" stroke-width="1.4"${dash}/>\n${seta([pcx, yb], [pcx, P.y + P.h], 'heranca')}\n`;
      }
    }
  }
  const demais = arestas.filter(r => r.tipo !== 'heranca' && r.tipo !== 'realiza');
  for (const r of demais) {
    const chave = [r.de, r.para].sort().join('|');
    const n = (pares.get(chave) || 0); pares.set(chave, n + 1);
    r._i = n;
  }
  for (const r of demais) {
    const total = pares.get([r.de, r.para].sort().join('|'));
    const desloc = (r._i - (total - 1) / 2) * 22;
    const A = caixas.get(r.de), B = caixas.get(r.para);
    const { p, q, ori } = ancorar(A, B, desloc);
    const tracejado = r.tipo === 'uso' ? ' stroke-dasharray="6 4"' : '';
    svgArestas += `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="#0b3d5c" stroke-width="1.4"${tracejado}/>\n`;
    const composicao = r.tipo === 'campo' && r.interno;
    if (composicao) svgArestas += seta(q, p, 'composicao') + '\n';
    else svgArestas += seta(p, q, r.tipo === 'fk' || r.tipo === 'campo' || r.tipo === 'uso' ? 'assoc' : 'assoc') + '\n';
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    let rot = r.rotulo || '';
    if (r.tipo === 'uso') rot = '«usa»';
    const comp = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const wRot = rot.length * 6.2 + 8;
    if (rot && (r.tipo === 'fk' || (ori !== 'd' && comp >= wRot + (r.tipo === 'uso' ? 60 : 6)))) {
      const wR = wRot;
      const lado = total > 1 ? (r._i % 2 === 0 ? -1 : 1) : 1;
      const lx = ori === 'v' ? mx + lado * (wR / 2 + 4) : mx, ly = ori === 'v' ? my + 4 : my - 5;
      svgRotulos += `<rect x="${(lx - wR / 2).toFixed(1)}" y="${(ly - 11).toFixed(1)}" width="${wR.toFixed(1)}" height="14" fill="#fff" fill-opacity=".92"/>`
        + `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="10.5" font-family="${FONTE}" fill="#0b3d5c">${esc(rot)}</text>\n`;
    }
    // multiplicidades
    const mult = (pt, txt, dx, dy) => `<text x="${(pt[0] + dx).toFixed(1)}" y="${(pt[1] + dy).toFixed(1)}" font-size="11" font-weight="700" font-family="${FONTE}" fill="#333">${txt}</text>\n`;
    if (r.tipo === 'fk') {
      const [a1, a2] = ori === 'h' ? [p[0] < q[0] ? [8, 14] : [-14, 14], p[0] < q[0] ? [-14, 14] : [8, 14]] : ori === 'v' ? [[6, p[1] < q[1] ? 14 : -6], [6, p[1] < q[1] ? -6 : 14]] : [[p[0] < q[0] ? 6 : -14, p[1] < q[1] ? 14 : -6], [q[0] < p[0] ? 6 : -14, q[1] < p[1] ? 14 : -6]];
      svgRotulos += mult(p, '*', a1[0], a1[1]) + mult(q, '1', a2[0], a2[1]);
    } else if (r.tipo === 'campo' && r.multi) {
      svgRotulos += mult(q, '*', ori === 'v' ? 6 : q[0] > p[0] ? -14 : 8, ori === 'v' ? (q[1] > p[1] ? -6 : 14) : -5);
    }
  }

  for (const b of caixas.values()) svgCaixas += desenharCaixa(b);
  const H = Math.ceil(Math.max(...[...caixas.values()].map(b => b.y + b.h)) + 24);
  fig.h = H;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 ${H}" width="1040" height="${H}" font-family="Segoe UI, Arial, sans-serif">\n<rect width="1040" height="${H}" fill="#fff"/>\n<g transform="translate(3,0)">\n${svgFundo}${svgArestas}${svgCaixas}${svgRotulos}</g>\n</svg>\n`;
}

// ============================================================ 5. EXECUCAO
const classes = lerProjeto();
const rel = relacoes(classes);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ classes: classes.map(c => ({ ...c, internos: undefined })), rel }, null, 1));
  process.exit(0);
}

fs.mkdirSync(SAIDA, { recursive: true });
let html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Diagrama de classes - CaminhoSeguro API</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;margin:20px;background:#eee}section{background:#fff;margin:0 auto 24px;width:1000px;padding:8px}h2{color:#0b3d5c;font-size:16px;margin:4px 0 8px}svg{display:block;width:1000px;height:auto}</style></head><body>
<!-- gerado por gerar_diagrama_classes.mjs a partir de src/main/java -->\n`;
for (const fig of FIGURAS) {
  const svg = gerarFigura(fig, classes, rel);
  fs.writeFileSync(path.join(SAIDA, `fig-${fig.id}.svg`), svg);
  html += `<section><h2>Figura ${fig.id}. ${esc(fig.titulo)}</h2>\n${svg}</section>\n`;
}
html += '</body></html>\n';
fs.writeFileSync(path.join(DIR, 'diagrama_classes.html'), html);
fs.writeFileSync(path.join(DIR, 'diagramas', 'figuras.json'), JSON.stringify(FIGURAS.map(f => ({ id: f.id, titulo: f.titulo, h: f.h })), null, 1));

const naoUsadas = classes.filter(c => !c.dono && !FIGURAS.some(f => f.nos.some(n => n.n === c.nome))).map(c => c.nome);
console.log(`${classes.length} classes lidas, ${FIGURAS.length} figuras geradas em ${SAIDA}`);
if (naoUsadas.length) console.warn('  aviso: classes fora de qualquer figura: ' + naoUsadas.join(', '));
