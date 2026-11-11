(async function () {
  const { $, $$, icone, esc, api, mensagemAmigavel, renderShell, CRITERIOS, ErroApi } = CS;
  renderShell("inicio");
  const box = $("#resultado");
  const q = new URLSearchParams(location.search);
  const origem = q.get("origem"), destino = q.get("destino");
  let criterio = CRITERIOS[q.get("criterio")] ? q.get("criterio") : "ACESSIVEL";

  const trilha = (passo) => `<ol class="trilha" aria-label="Etapas">
    <li><span class="n">1</span><span class="t">Escolher os lugares</span></li>
    <li${passo === 2 ? ' aria-current="step"' : ""}><span class="n">2</span><span class="t">Ver o caminho</span></li>
    <li><span class="n">3</span><span class="t">Avisar um problema</span></li></ol>`;

  function pronto(html) {
    box.innerHTML = html;
    box.setAttribute("aria-busy", "false");
    const h1 = box.querySelector("h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  }

  if (!origem || !destino) {
    pronto(`${trilha(1)}<div class="cartao vazio">${icone("pin")}<h1>Vamos escolher o caminho</h1>
      <p>Para ver o mapa e o passo a passo, diga de onde você sai e para onde vai.</p>
      <a class="botao botao-grande" href="index.html">Escolher os lugares</a></div>`);
    return;
  }

  const consulta = (c, comUsuario) => api("/api/rotas?" + new URLSearchParams(Object.assign({ origem, destino, criterio: c }, comUsuario ? { usuario: USUARIO_LOGADO.id } : {})));
  let locais, trechos, abertas;
  const rotas = {};
  try {
    const crits = Object.keys(CRITERIOS);
    const [lo, tr, ab, ...res] = await Promise.all([
      api("/api/locais"), api("/api/trechos"), api("/api/ocorrencias?status=ABERTA"),
      ...crits.map((c) => consulta(c, c === criterio).then((r) => ({ r }), (e) => ({ e }))),
    ]);
    locais = lo; trechos = tr; abertas = ab;
    crits.forEach((c, i) => { rotas[c] = res[i]; });
  } catch (e) {
    pronto(`${trilha(2)}<div class="cartao"><h1>Não conseguimos mostrar o caminho</h1>
      <div class="aviso aviso-erro">${icone("alerta")}<div><strong>Algo deu errado.</strong><p>${esc(mensagemAmigavel(e))}</p></div></div>
      <div class="acoes"><a class="botao" href="">Tentar de novo</a><a class="botao botao-claro" href="index.html">Voltar ao início</a></div></div>`);
    return;
  }

  const erroSel = rotas[criterio].e;
  if (erroSel && !(erroSel instanceof ErroApi)) { // falha inesperada
    pronto(`${trilha(2)}<div class="cartao"><h1>Não conseguimos mostrar o caminho</h1>
      <div class="aviso aviso-erro">${icone("alerta")}<div><strong>Algo deu errado.</strong><p>${esc(mensagemAmigavel(erroSel))}</p></div></div>
      <div class="acoes"><a class="botao" href="">Tentar de novo</a><a class="botao botao-claro" href="index.html">Voltar ao início</a></div></div>`);
    return;
  }
  if (erroSel && erroSel.status === 422) {
    pronto(`${trilha(1)}<div class="cartao"><h1>Os dois lugares são iguais</h1>
      <div class="aviso aviso-atencao">${icone("alerta")}<div><strong>Você já está no destino.</strong><p>Escolha um lugar de saída diferente do destino.</p></div></div>
      <div class="acoes"><a class="botao" href="index.html">Escolher de novo</a></div></div>`);
    return;
  }

  const nomeLocal = (id) => (locais.find((l) => String(l.id) === String(id)) || {}).nome || "Local " + id;
  const trechoPorId = new Map(trechos.map((t) => [t.id, t]));
  const avisosPorTrecho = new Map();
  abertas.forEach((o) => avisosPorTrecho.set(o.idTrecho, (avisosPorTrecho.get(o.idTrecho) || 0) + 1));
  const NIVEL = { baixo: "Baixo", medio: "Médio", alto: "Alto" };
  const ordemNivel = { baixo: 0, medio: 1, alto: 2 };
  const url = (c) => "rota.html?" + new URLSearchParams({ origem, destino, criterio: c });

  const disponiveis = Object.values(rotas).filter((x) => x.r).map((x) => x.r);
  const menorTempo = disponiveis.length ? Math.min(...disponiveis.map((r) => r.tempoTotalMin)) : null;

  function opcoes() {
    return `<nav class="opcoes-rota" aria-label="Tipo de caminho">` + Object.entries(CRITERIOS).map(([c, v]) => {
      const r = rotas[c].r;
      const min = r ? `<span class="min">${r.tempoTotalMin} min${r.tempoTotalMin === menorTempo && disponiveis.length > 1 ? "<small>menor tempo</small>" : "<small>a pé</small>"}</span>` : `<span class="min nao">Sem caminho</span>`;
      return `<a class="op-rota${r ? "" : " sem"}" href="${url(c)}" data-c="${c}"${c === criterio ? ' aria-current="true"' : ""}>${icone(v.icone)}<span><strong>${esc(v.nome)}</strong><span class="sub">${esc(v.desc)}</span></span>${min}</a>`;
    }).join("") + `</nav>`;
  }

  function semRota() {
    const e = rotas[criterio].e;
    const ac = criterio === "ACESSIVEL";
    return `<div class="cartao"><h2>Não achamos um caminho assim</h2>
      <div class="aviso aviso-atencao">${icone("alerta")}<div><strong>${esc(e.corpo.mensagem || "Não há rota entre esses lugares")}.</strong>
      <p>${ac && disponiveis.length ? "Hoje, todos os caminhos entre esses lugares passam por degraus, ladeira forte ou calçada muito estreita. " : "Esses dois lugares não estão ligados por calçadas que conhecemos. "}${disponiveis.length ? "Veja as outras opções acima: se for por elas, vá acompanhada." : "Tente outro destino."}</p></div></div>
      <div class="acoes"><a class="botao" href="index.html?${new URLSearchParams({ origem, destino, criterio })}">Mudar os lugares</a></div></div>`;
  }

  function corpo() {
    const rota = rotas[criterio].r;
    if (!rota) return semRota();
    const ult = rota.locais.length - 1;
    const trs = rota.trechos.map((id) => trechoPorId.get(id)).filter(Boolean);
    const pior = trs.reduce((m, t) => (ordemNivel[CSMapa.nivel(t.risco)] > ordemNivel[m] ? CSMapa.nivel(t.risco) : m), "baixo");
    const classeNivel = pior === "baixo" ? "ok" : pior === "medio" ? "atencao" : "alto";
    const apoios = rota.locais.filter((l) => l.pontoApoio);
    const nAvisos = trs.reduce((s, t) => s + (avisosPorTrecho.get(t.id) || 0), 0);

    const passos = rota.locais.map((l, i) => {
      const t = trechoPorId.get(rota.trechos[i]);
      let acao, notas = "";
      if (i === 0) acao = `Saia de <b>${esc(l.nome)}</b>.`;
      else if (i === ult) acao = `Pronto! Você chegou em <b>${esc(l.nome)}</b>.`;
      else acao = `Continue até <b>${esc(l.nome)}</b>.`;
      if (i > 0) {
        const ant = trechoPorId.get(rota.trechos[i - 1]);
        if (ant) acao += ` <span class="tempo">(${ant.tempoMin} min a pé)</span>`;
      }
      if (i < ult && t) {
        const n = avisosPorTrecho.get(t.id);
        if (i === 0 || true) {
          const nv = CSMapa.nivel(t.risco);
          const aviso = [];
          if (!t.acessivel) aviso.push(`<span class="nota alerta">${icone("alerta")}Próximo trecho: degrau ou ladeira forte</span>`);
          if (nv === "alto") aviso.push(`<span class="nota alerta">${icone("alerta")}Próximo trecho pede muito cuidado</span>`);
          else if (nv === "medio") aviso.push(`<span class="nota atencao">${icone("info")}Próximo trecho pede atenção</span>`);
          if (n) aviso.push(`<span class="nota alerta">${icone("alerta")}${n === 1 ? "1 aviso aberto" : n + " avisos abertos"} de moradores</span>`);
          notas += aviso.join("");
        }
      }
      if (l.pontoApoio) notas = `<span class="nota apoio">${icone("coracao")}Ponto de apoio: dá para descansar e pedir ajuda</span>` + notas;
      return `<li class="passo${i === ult ? " fim" : ""}" data-no="${l.id}"><span class="numero" aria-hidden="true">${i + 1}</span>
        <p class="acao"><span class="sr-only">Passo ${i + 1}: </span>${acao}</p>${notas ? `<p class="notas">${notas}</p>` : ""}</li>`;
    }).join("");

    const alerta = rota.totalmenteAcessivel ? "" : `<div class="aviso aviso-atencao">${icone("alerta")}<div><strong>Este caminho não é totalmente acessível.</strong>
      <p>Pode ter degrau, ladeira forte ou calçada estreita. Se puder, vá acompanhada${criterio !== "ACESSIVEL" && rotas.ACESSIVEL.r ? `, ou veja o caminho <a href="${url("ACESSIVEL")}" data-c="ACESSIVEL">mais acessível</a>` : ""}.</p></div></div>`;

    return `<div class="rota-layout">
      <div class="mapa-col">
        <div class="resumo-rota">
          <div class="dado"><span class="r">Tempo a pé</span><span class="v">${rota.tempoTotalMin} <small>min</small></span></div>
          <div class="dado ${classeNivel}"><span class="r">Cuidado</span><span class="v">${NIVEL[pior]}</span></div>
          <div class="dado ${rota.totalmenteAcessivel ? "ok" : "atencao"}"><span class="r">Acessível</span><span class="v">${rota.totalmenteAcessivel ? "Sim" : "Em parte"}</span></div>
        </div>
        <div class="mapa-quadro"><div id="mapa"></div>
          <ul class="legenda"><li><svg viewBox="0 0 36 16" aria-hidden="true"><path d="M2 8h32" stroke="var(--brand)" stroke-width="7" stroke-linecap="round"/></svg>Seu caminho</li>
          ${apoios.length ? `<li><svg viewBox="0 0 36 16" aria-hidden="true"><circle cx="18" cy="8" r="7" fill="var(--amber)" stroke="var(--amber-ink)" stroke-width="2"/></svg>Ponto de apoio</li>` : ""}
          ${nAvisos ? `<li><svg viewBox="0 0 36 16" aria-hidden="true"><circle cx="18" cy="8" r="7" fill="var(--danger)"/></svg>Aviso de morador</li>` : ""}</ul>
          <p class="mapa-dica" id="dica-rolar" hidden>Arraste o mapa para os lados para ver tudo.</p></div>
      </div>
      <div>
        <section class="cartao passos-card" aria-labelledby="titulo-passos"><h2 id="titulo-passos">Passo a passo</h2>
          ${alerta}
          <ol class="passos">${passos}</ol>
          <p class="dica" style="margin:1.25rem 0 0">${apoios.length ? "Neste caminho há " + (apoios.length === 1 ? "um ponto de apoio" : apoios.length + " pontos de apoio") + " para descansar." : "Neste caminho não há ponto de apoio. Vá com calma e peça ajuda a quem estiver por perto, se precisar."}</p>
        </section>
        <div class="proximo"><div class="cartao">
          <h2>${icone("alerta")} Viu um problema no caminho?</h2>
          <p>Avise em menos de um minuto. Seu aviso ajuda outras pessoas e a prefeitura.</p>
          <a class="botao" href="ocorrencia.html?trechos=${rota.trechos.join(",")}">Avisar um problema neste caminho</a>
        </div>
        <div class="acoes" style="margin-top:.25rem"><a class="botao botao-claro" href="index.html?${new URLSearchParams({ origem, destino, criterio })}">Mudar os lugares</a>
        <button class="botao botao-claro" type="button" id="imprimir">${icone("imprimir")}Imprimir o caminho</button></div></div>
      </div>
    </div>`;
  }

  function desenhaMapa() {
    const rota = rotas[criterio].r, el = $("#mapa");
    if (!rota || !el) return;
    const m = CSMapa.desenhar(el, { locais, trechos, avisos: avisosPorTrecho,
      rota: { locais: rota.locais.map((l) => l.id), trechos: rota.trechos },
      aria: `Mapa do caminho: ${rota.locais.map((l) => l.nome).join(", depois ")}.` });
    const rol = el.querySelector(".mapa-rolagem");
    if (rol && rol.scrollWidth > rol.clientWidth + 4) $("#dica-rolar").hidden = false;
    $$(".passo").forEach((li) => {
      li.addEventListener("mouseenter", () => m.destacarNo(Number(li.dataset.no), true));
      li.addEventListener("mouseleave", () => m.destacarNo(Number(li.dataset.no), false));
    });
    const imp = $("#imprimir"); if (imp) imp.addEventListener("click", () => window.print());
  }

  function render(foco) {
    const rota = rotas[criterio].r;
    const titulo = rota
      ? `<h1>Seu caminho até ${esc(rota.locais[rota.locais.length - 1].nome)}</h1><p class="lead" style="margin:0">Saindo de <strong>${esc(rota.locais[0].nome)}</strong>. Siga os números no mapa e na lista.</p>`
      : `<h1>Seu caminho: ${esc(nomeLocal(origem))} até ${esc(nomeLocal(destino))}</h1>`;
    pronto(`${trilha(2)}<header class="rota-topo">${titulo}</header>${opcoes()}<div id="corpo">${corpo()}</div>`);
    desenhaMapa();
    document.title = "Seu caminho | CaminhoSeguro";
    if (foco) { const a = $(`.op-rota[data-c="${criterio}"]`); if (a) a.focus(); }
  }

  // Trocar o tipo de caminho sem recarregar (os três já foram calculados)
  box.addEventListener("click", (ev) => {
    const a = ev.target.closest("a[data-c]");
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    ev.preventDefault();
    criterio = a.dataset.c;
    history.replaceState(null, "", url(criterio));
    render(true);
  });
  render(false);
})();
