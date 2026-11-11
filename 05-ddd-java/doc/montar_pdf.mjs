#!/usr/bin/env node
/*
 * Monta o PDF da documentação (Domain Driven Design - Java).
 *
 *   node doc/montar_pdf.mjs LINK_GITHUB LINK_DEPLOY
 *   ex.: node doc/montar_pdf.mjs https://github.com/usuario/repo https://caminhoseguro.onrender.com
 *   (sem argumentos, deixa os marcadores visíveis: [LINK DO GITHUB] e [LINK DO DEPLOY])
 *
 * Passos: 1) regera os diagramas a partir do código Java; 2) troca {{LINK_GITHUB}} e {{LINK_DEPLOY}}
 * em doc/ddd.html e grava doc/ddd.montado.html; 3) gera o PDF com ../../_doc/pdf.sh (Chrome headless);
 * 4) lê o número das páginas (Python com pymupdf, opcional) para preencher o índice e gera o PDF de novo.
 * Saída: 05-ddd-java/GS-DDD-Java-CaminhoSeguro.pdf
 * Variáveis opcionais: GIT_BASH (caminho do bash.exe) e PYTHON (python com pymupdf).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PDF = path.resolve(DIR, '../GS-DDD-Java-CaminhoSeguro.pdf');
const PDF_SH = path.resolve(DIR, '../../_doc/pdf.sh');
const MONTADO = path.join(DIR, 'ddd.montado.html');
const BASH = process.env.GIT_BASH || 'C:\\Program Files\\Git\\bin\\bash.exe';
const PY = process.env.PYTHON || path.resolve(DIR, '../../../_ferramentas/py/tools/python.exe');

const github = process.argv[2] || '[LINK DO GITHUB]';
const deploy = (process.argv[3] || '[LINK DO DEPLOY]').replace(/\/$/, '');

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); throw new Error(`falhou: ${cmd} ${args.join(' ')}`); }
  return r.stdout;
}

function gerarPdf(paginas) {
  let html = fs.readFileSync(path.join(DIR, 'ddd.html'), 'utf8')
    .replaceAll('{{LINK_GITHUB}}', github).replaceAll('{{LINK_DEPLOY}}', deploy);
  html = html.replace(/\{\{(PG_\w+)\}\}/g, (_, k) => (paginas && paginas[k]) || '');
  fs.writeFileSync(MONTADO, html);
  console.log(rodar(BASH, [PDF_SH.replace(/\\/g, '/'), MONTADO.replace(/\\/g, '/'), PDF.replace(/\\/g, '/')]).trim());
}

rodar(process.execPath, [path.join(DIR, 'gerar_diagrama_classes.mjs')]);
gerarPdf(null);
if (fs.existsSync(PY)) {
  const paginas = JSON.parse(rodar(PY, ['-I', path.join(DIR, 'paginas.py'), PDF]));
  console.log('páginas do índice:', JSON.stringify(paginas));
  gerarPdf(paginas);
} else {
  console.warn('aviso: Python/pymupdf não encontrado; índice ficou sem números de página (defina PYTHON).');
}
