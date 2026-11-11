/* CaminhoSeguro - mapa esquemático em SVG, gerado a partir de /api/locais e /api/trechos.
   Se todos os locais têm latitude/longitude, usa a posição real como ponto de partida e afasta
   os pontos que ficariam colados (o desenho é um esquema, não uma escala). Sem coordenadas,
   cria um layout automático (forças). Zero dependências. */
const CSMapa = (() => {
  const W = 1000;
  const NS = "http://www.w3.org/2000/svg";
  const HEART = "M12 20.5s-7.5-4.7-7.5-10.5A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.5 2.5c0 5.8-7.5 10.5-7.5 10.5z";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const temCoord = (l) => l.latitude != null && l.longitude != null && isFinite(l.latitude) && isFinite(l.longitude);

  function ajustar(pts, H, pad) {
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = Math.max(maxX - minX, 1), h = Math.max(maxY - minY, 1);
    const py = Math.min(pad, H * 0.28), k = Math.min((W - 2 * pad) / w, (H - 2 * py) / h);
    const ox = (W - w * k) / 2, oy = (H - h * k) / 2;
    pts.forEach((p) => { p.x = ox + (p.x - minX) * k; p.y = oy + (p.y - minY) * k; });
  }

  function afastar(pts, H, pad, minD, alvo) {
    for (let it = 0; it < 400; it++) {
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        let dx = pts[j].x - pts[i].x, dy = pts[j].y - pts[i].y, d = Math.hypot(dx, dy);
        if (d < 0.01) { dx = 1; dy = 0; d = 1; }
        if (d < minD) { const f = (minD - d) / 2 / d; pts[i].x -= dx * f; pts[i].y -= dy * f; pts[j].x += dx * f; pts[j].y += dy * f; }
      }
      if (alvo) pts.forEach((p, i) => { p.x += (alvo[i].x - p.x) * 0.03; p.y += (alvo[i].y - p.y) * 0.03; });
      pts.forEach((p) => { p.x = Math.min(W - pad, Math.max(pad, p.x)); p.y = Math.min(H - Math.min(pad, H * 0.28), Math.max(Math.min(pad, H * 0.28), p.y)); });
    }
  }

  function posicoes(locais, trechos, H, pad, minMin) {
    const n = locais.length, idx = new Map(locais.map((l, i) => [l.id, i]));
    const minD = Math.max(minMin || 95, Math.min(160, Math.sqrt((W * H) / Math.max(n, 1)) * 0.6));
    let pts;
    if (locais.every(temCoord) && n > 1) {
      const lat0 = locais.reduce((s, l) => s + l.latitude, 0) / n, c = Math.cos((lat0 * Math.PI) / 180);
      pts = locais.map((l) => ({ x: l.longitude * c, y: -l.latitude }));
      ajustar(pts, H, pad);
      for (let r = 0; r < 2; r++) {
        const alvo = pts.map((p) => ({ x: p.x, y: p.y }));
        afastar(pts, H, pad, minD, alvo);
        ajustar(pts, H, pad);
      }
    } else {
      // Layout automático: círculo inicial + forças (atração nas arestas, repulsão entre todos)
      pts = locais.map((l, i) => ({ x: W / 2 + Math.cos((2 * Math.PI * i) / n) * 300, y: H / 2 + Math.sin((2 * Math.PI * i) / n) * 200 }));
      const k = Math.sqrt((W * H) / Math.max(n, 1)) * 0.8;
      const arestas = trechos.filter((t) => idx.has(t.idLocalOrigem) && idx.has(t.idLocalDestino));
      for (let it = 0, temp = 90; it < 300; it++, temp *= 0.985) {
        const dx = pts.map(() => 0), dy = pts.map(() => 0);
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          let ax = pts[i].x - pts[j].x, ay = pts[i].y - pts[j].y, d = Math.max(Math.hypot(ax, ay), 1);
          const f = (k * k) / d / d;
          dx[i] += ax * f; dy[i] += ay * f; dx[j] -= ax * f; dy[j] -= ay * f;
        }
        arestas.forEach((t) => {
          const a = idx.get(t.idLocalOrigem), b = idx.get(t.idLocalDestino);
          const ax = pts[a].x - pts[b].x, ay = pts[a].y - pts[b].y, d = Math.max(Math.hypot(ax, ay), 1), f = d / k;
          dx[a] -= ax * f; dy[a] -= ay * f; dx[b] += ax * f; dy[b] += ay * f;
        });
        pts.forEach((p, i) => { const d = Math.max(Math.hypot(dx[i], dy[i]), 1), m = Math.min(d, temp); p.x += (dx[i] / d) * m; p.y += (dy[i] / d) * m; });
      }
      ajustar(pts, H, pad);
      afastar(pts, H, pad, minD, null);
    }
    const mapa = new Map();
    locais.forEach((l, i) => mapa.set(l.id, pts[i]));
    return mapa;
  }

  const quebrar = (nome, max = 15) => {
    const palavras = String(nome).split(/\s+/), linhas = [];
    let atual = "";
    palavras.forEach((p) => {
      if (atual && (atual + " " + p).length > max) { linhas.push(atual); atual = p; } else atual = atual ? atual + " " + p : p;
    });
    if (atual) linhas.push(atual);
    return linhas.slice(0, 4);
  };

  const colide = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function rotulos(lista, pos, ids, H, pesados, todos, fs, extras) {
    const ocupados = (extras || []).concat(todos.map((l) => { const p = pos.get(l.id); return { x: p.x - 24, y: p.y - 24, w: 48, h: 48 }; }));
    const saida = new Map();
    const ordem = lista.slice().sort((a, b) => (pesados.has(b.id) ? 1 : 0) - (pesados.has(a.id) ? 1 : 0));
    ordem.forEach((l) => {
      const p = pos.get(l.id);
      const linhas = quebrar(l.nome), w = Math.max(...linhas.map((s) => s.length)) * fs * 0.56 + 8, h = linhas.length * fs * 1.15 + 4;
      const g = 30;
      const cands = [
        { x: p.x + g, y: p.y - h / 2, a: "start" }, { x: p.x - g - w, y: p.y - h / 2, a: "end" },
        { x: p.x - w / 2, y: p.y + g - 4, a: "middle" }, { x: p.x - w / 2, y: p.y - g - h + 4, a: "middle" },
        { x: p.x + g * 0.6, y: p.y + g * 0.6, a: "start" }, { x: p.x - g * 0.6 - w, y: p.y + g * 0.6, a: "end" },
        { x: p.x + g * 0.6, y: p.y - g * 0.6 - h, a: "start" }, { x: p.x - g * 0.6 - w, y: p.y - g * 0.6 - h, a: "end" },
      ];
      let melhor = null, menor = Infinity;
      cands.forEach((c) => {
        const r = { x: c.x, y: c.y, w, h };
        let custo = ocupados.filter((o) => colide(r, o)).length * 10;
        if (r.x < 4 || r.x + w > W - 4 || r.y < 4 || r.y + h > H - 4) custo += 6;
        if (custo < menor) { menor = custo; melhor = { ...c, w, h, linhas, fs }; }
      });
      ocupados.push({ x: melhor.x, y: melhor.y, w: melhor.w, h: melhor.h });
      const ancora = melhor.a === "start" ? melhor.x : melhor.a === "end" ? melhor.x + w : melhor.x + w / 2;
      saida.set(l.id, { ...melhor, tx: ancora });
    });
    return saida;
  }

  /* Layout esquemático do trajeto (estilo linha de metrô): os pontos seguem a ordem da caminhada em
     "cobrinha" (esquerda->direita, desce, direita->esquerda...). Nada se cruza nem passa por cima de
     outro ponto, e trajetos que voltam para trás continuam fáceis de seguir. */
  function esquema(locais, fs, estreito) {
    const n = locais.length, cols = estreito ? Math.min(n, 3) : n <= 4 ? n : n <= 6 ? 3 : 4, rows = Math.ceil(n / cols);
    const esp = estreito ? 200 : Math.min(300, 520 / Math.max(cols - 1, 1)), x0 = W / 2 - (esp * (cols - 1)) / 2, gapY = 250, y0 = 130;
    const H = y0 + (rows - 1) * gapY + 170;
    const pos = new Map(), lado = new Map();
    locais.forEach((l, i) => {
      const r = Math.floor(i / cols), k = i - r * cols, c = r % 2 === 0 ? k : cols - 1 - k;
      pos.set(l.id, { x: x0 + c * esp, y: y0 + r * gapY });
      const viraDepois = k === cols - 1 && i < n - 1, viraAntes = k === 0 && r > 0;
      if (viraDepois || viraAntes) lado.set(l.id, c === cols - 1 ? "d" : "e");
    });
    const rot = new Map();
    const max = estreito ? 10 : esp < 200 ? 12 : 16, maxLado = estreito ? 10 : 12;
    locais.forEach((l) => {
      const p = pos.get(l.id), linhas = quebrar(l.nome, lado.get(l.id) ? maxLado : max), w = Math.max(...linhas.map((s) => s.length)) * fs * 0.56 + 8, h = linhas.length * fs * 1.15 + 4, s = lado.get(l.id);
      if (s === "d") rot.set(l.id, { x: p.x + 46, y: p.y - h / 2 + 8, w, h, a: "start", tx: p.x + 46, linhas, fs });
      else if (s === "e") rot.set(l.id, { x: p.x - 46 - w, y: p.y - h / 2 + 8, w, h, a: "end", tx: p.x - 46, linhas, fs });
      else rot.set(l.id, { x: p.x - w / 2, y: p.y + 32, w, h, a: "middle", tx: p.x, linhas, fs });
    });
    return { pos, rot, H };
  }

  /** Nível de cuidado do trecho (regra do app: 1-2 baixo, 3-5 médio, 6+ alto). */
  const nivel = (r) => (r >= 6 ? "alto" : r >= 3 ? "medio" : "baixo");

  /* Opções: locais, trechos (todos os da API), rota {locais:[ids], trechos:[ids]} (mostra SÓ o trajeto),
     destaque:Set(idTrecho), avisos:Map(idTrecho->n), aria, altura.
     Sem rota: as calçadas ficam discretas; só aparecem com cor e nome as que têm destaque ou aviso. */
  function desenhar(el, d) {
    const todos = (d.locais || []).filter((l) => l && l.id != null);
    if (!todos.length) { el.innerHTML = ""; return null; }
    let rota = d.rota && d.rota.locais && d.rota.locais.length > 1 ? d.rota : null;
    const t0 = d.soTrecho;
    if (t0) rota = { locais: [t0.idLocalOrigem, t0.idLocalDestino], trechos: [t0.id] };
    const simples = !!t0;
    const rotaLocais = rota ? rota.locais : [], rotaTrechos = new Set(rota ? rota.trechos : []);
    const porIdTodos = new Map(todos.map((l) => [l.id, l]));
    const locais = rota ? rotaLocais.map((id) => porIdTodos.get(id)).filter(Boolean) : todos;
    const ids = new Set(locais.map((l) => l.id));
    const trechos = (d.trechos || []).filter((t) => ids.has(t.idLocalOrigem) && ids.has(t.idLocalDestino) && (!rota || rotaTrechos.has(t.id)));
    const destaque = d.destaque || new Set(), avisos = d.avisos || new Map();
    const modoEsq = !!rota && !simples;
    const esq = modoEsq ? esquema(locais, d.fonte || 25, el.clientWidth > 0 && el.clientWidth < 560) : null;
    const H = esq ? esq.H : (d.altura || (locais.length <= 4 ? 440 : 600));
    const pos = esq ? esq.pos : posicoes(locais, trechos, H, rota ? 150 : 100, rota ? 230 : 95);
    const porId = new Map(locais.map((l) => [l.id, l]));

    // Quem recebe nome: o trajeto; ou as pontas dos trechos em destaque/com aviso
    const nomeados = new Set(rotaLocais);
    const soDestaque = destaque.size > 0;
    trechos.forEach((t) => { if (soDestaque ? destaque.has(t.id) : avisos.get(t.id)) { nomeados.add(t.idLocalOrigem); nomeados.add(t.idLocalDestino); } });
    const pilulas = [];
    for (let i = 0; i < rotaLocais.length - 1; i++) { const a = pos.get(rotaLocais[i]), b = pos.get(rotaLocais[i + 1]); if (a && b) { pilulas.push({ x: (a.x + b.x) / 2 - 42, y: (a.y + b.y) / 2 - 20, w: 84, h: 40 }); const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 30); for (let k = 1; k < n; k++) pilulas.push({ x: a.x + ((b.x - a.x) * k) / n - 12, y: a.y + ((b.y - a.y) * k) / n - 12, w: 24, h: 24 }); } }
    const rot = esq ? esq.rot : rotulos(locais.filter((l) => nomeados.has(l.id)), pos, ids, H, nomeados, locais, d.fonte || (rota ? 23 : 19), pilulas);

    // Se a reta entre a e b passa por cima de outro ponto, ela vira uma curva que desvia dele
    const pontos = [...pos.values()];
    const controle = (a, b) => {
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      let pior = null;
      pontos.forEach((p) => {
        if (p === a || p === b) return;
        const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (L * L);
        if (t <= 0.05 || t >= 0.95) return;
        const lado = ((p.x - a.x) * dy - (p.y - a.y) * dx) / L; // distância com sinal
        if (Math.abs(lado) < 34 && (!pior || Math.abs(lado) < Math.abs(pior.lado))) pior = { lado };
      });
      if (!pior) return null;
      const s = pior.lado >= 0 ? -1 : 1, desvio = 2 * (Math.abs(pior.lado) + 30); // o meio da curva passa ~30px do ponto, do outro lado
      return { x: (a.x + b.x) / 2 + (s * desvio * dy) / L, y: (a.y + b.y) / 2 - (s * desvio * dx) / L };
    };
    const linha = (a, b) => {
      const c = controle(a, b);
      return c ? `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
               : `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    };
    const meio = (a, b) => { const c = controle(a, b) || { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; return { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 }; };
    let svg = "";
    trechos.forEach((t) => {
      if (rotaTrechos.has(t.id)) return;
      const a = pos.get(t.idLocalOrigem), b = pos.get(t.idLocalDestino);
      const marcado = destaque.has(t.id), n = avisos.get(t.id);
      const cls = ["m-via", marcado ? "forte" : n ? "aviso" : "fraca", t.acessivel ? "" : "sem-acesso"].join(" ");
      if (marcado) svg += `<path class="m-sel" d="${linha(a, b)}"/>`;
      svg += `<path class="${cls}" d="${linha(a, b)}"><title>${esc(porId.get(t.idLocalOrigem).nome)} até ${esc(porId.get(t.idLocalDestino).nome)}: ${t.tempoMin} min${t.acessivel ? "" : ", com degrau ou ladeira forte"}</title></path>`;
    });
    // trajeto escolhido, na ordem de caminhada
    const segs = [];
    for (let i = 0; i < rotaLocais.length - 1; i++) {
      const a = pos.get(rotaLocais[i]), b = pos.get(rotaLocais[i + 1]);
      if (a && b) segs.push({ a, b, t: (d.trechos || []).find((x) => x.id === rota.trechos[i]) });
    }
    segs.forEach((s) => { svg += `<path class="m-borda-rota" d="${linha(s.a, s.b)}"/>`; });
    segs.forEach((s) => { svg += `<path class="m-rota${s.t && !s.t.acessivel ? " sem-acesso" : ""}" d="${linha(s.a, s.b)}"/>`; });
    segs.forEach((s) => { svg += `<path class="m-fluxo" d="${linha(s.a, s.b)}"/>`; });
    if (!simples) segs.forEach((s) => {
      if (!s.t) return;
      const m = meio(s.a, s.b), mx = m.x, my = m.y, txt = s.t.tempoMin + " min", w = txt.length * 11 + 22;
      svg += `<g class="m-min"><rect x="${(mx - w / 2).toFixed(1)}" y="${(my - 16).toFixed(1)}" width="${w}" height="32" rx="16"/><text x="${mx.toFixed(1)}" y="${my.toFixed(1)}">${txt}</text></g>`;
    });
    trechos.forEach((t) => {
      const n = avisos.get(t.id);
      if (!n) return;
      const a = pos.get(t.idLocalOrigem), b = pos.get(t.idLocalDestino);
      let x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
      if (modoEsq && rotaTrechos.has(t.id)) { if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) y -= 38; else x -= 62; }
      svg += `<g class="m-aviso"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${n}</text><title>${n === 1 ? "1 aviso aberto" : n + " avisos abertos"}</title></g>`;
    });
    // locais
    const ult = rotaLocais.length - 1;
    locais.forEach((l) => {
      const p = pos.get(l.id), i = rotaLocais.indexOf(l.id), naRota = i >= 0, nome = nomeados.has(l.id);
      const x = p.x.toFixed(1), y = p.y.toFixed(1);
      let g = `<g class="m-no${l.pontoApoio ? " apoio" : ""}${naRota ? " rota" : ""}${i === ult && naRota ? " dest" : ""}${nome || naRota ? "" : " discreto"}" data-id="${l.id}"><title>${esc(l.nome)}${l.pontoApoio ? " (ponto de apoio)" : ""}</title>`;
      if (naRota) {
        g += (i === ult && !simples ? `<circle class="anel" cx="${x}" cy="${y}" r="31"/>` : "") +
          `<circle class="base" cx="${x}" cy="${y}" r="21"/>${simples ? "" : `<text class="num" x="${x}" y="${(p.y + 1).toFixed(1)}">${i + 1}</text>`}`;
        if (l.pontoApoio) g += `<circle cx="${(p.x + 18).toFixed(1)}" cy="${(p.y - 18).toFixed(1)}" r="12" fill="var(--amber)" stroke="var(--surface)" stroke-width="3"/><path class="glifo" style="stroke:var(--amber-ink)" d="${HEART}" transform="translate(${(p.x + 18 - 7).toFixed(1)} ${(p.y - 18 - 7).toFixed(1)}) scale(.58)"/>`;
      } else if (l.pontoApoio) {
        g += `<circle class="base" cx="${x}" cy="${y}" r="${nome ? 15 : 9}"/>` + (nome ? `<path class="glifo" d="${HEART}" transform="translate(${(p.x - 8.2).toFixed(1)} ${(p.y - 8.2).toFixed(1)}) scale(.68)"/>` : "");
      } else {
        g += `<circle class="base" cx="${x}" cy="${y}" r="${nome ? 11 : 6}"/>`;
      }
      svg += g + "</g>";
    });
    // nomes
    locais.forEach((l) => {
      const r = rot.get(l.id);
      if (!r) return;
      const forte = rotaLocais.includes(l.id), y0 = r.y + r.fs * 0.95;
      const t = r.linhas.map((s, k) => `<tspan x="${r.tx.toFixed(1)}" y="${(y0 + k * r.fs * 1.15).toFixed(1)}">${esc(s)}</tspan>`).join("");
      svg += `<text class="m-rotulo${forte ? " forte" : ""}" style="font-size:${r.fs}px" text-anchor="${r.a}">${t}</text>`;
    });
    // SAÍDA / CHEGADA
    if (rota && !simples) {
      const marca = (id, txt) => {
        const p = pos.get(id);
        if (!p) return "";
        const w = txt.length * 11 + 22;
        // se o nome do local ocupa o espaço acima do ponto, a etiqueta vai para baixo
        let top = p.y - 66;
        const r = rot.get(id);
        if (r && !modoEsq) {
          const bate = (t) => r.x < p.x + w / 2 && r.x + r.w > p.x - w / 2 && r.y < t + 28 && r.y + r.h > t;
          if (bate(top)) top = bate(p.y + 38) ? top : p.y + 38;
        }
        return `<g><rect class="m-flag-fundo" x="${(p.x - w / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${w}" height="28" rx="14"/><text class="m-flag" x="${p.x.toFixed(1)}" y="${(top + 14).toFixed(1)}">${txt}</text></g>`;
      };
      svg += marca(rotaLocais[0], "SAÍDA") + marca(rotaLocais[ult], "CHEGADA");
    }

    let vx = 0, vw = W;
    if (esq) {
      const xs = [...pos.values()].flatMap((p) => [p.x - 36, p.x + 36]).concat([...rot.values()].flatMap((r) => [r.x, r.x + r.w]));
      vx = Math.max(0, Math.min(...xs) - 24); vw = Math.min(W, Math.max(...xs) + 24) - vx;
    }
    el.innerHTML = `<div class="mapa-rolagem"><svg class="mapa${esq ? " mapa-esq" : ""}" viewBox="${vx.toFixed(0)} 0 ${vw.toFixed(0)} ${H}" role="img" aria-label="${esc(d.aria || "Mapa esquemático dos lugares e das calçadas")}" focusable="false">${svg}</svg></div>`;
    const rol = el.querySelector(".mapa-rolagem");
    if (!esq && rol.scrollWidth > rol.clientWidth && rotaLocais.length) {
      const xs = rotaLocais.map((id) => pos.get(id).x), cx = ((Math.min(...xs) + Math.max(...xs)) / 2) / W;
      rol.scrollLeft = cx * rol.scrollWidth - rol.clientWidth / 2;
    }
    return { destacarNo(id, on) { const g = el.querySelector(`.m-no[data-id="${id}"]`); if (g) g.classList.toggle("realce", !!on); } };
  }

  return { desenhar, nivel };
})();
