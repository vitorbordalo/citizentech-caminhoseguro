(async function () {
  const { $, $$, icone, iconeTipo, esc, api, mensagemAmigavel, renderShell, GRAVIDADE, STATUS, STATUS_ICONE, dataBR, nomeTrecho } = CS;
  renderShell("painel");
  const lista = $("#lista"), msg = $("#mensagem");
  let ocs = [], tipos = [], trechos = [], locais = [], filtro = "", trechoSel = null;
  const hoje = () => new Date().toISOString().slice(0, 10);

  try {
    [ocs, tipos, trechos, locais] = await Promise.all([api("/api/ocorrencias"), api("/api/tipos-ocorrencia"), api("/api/trechos"), api("/api/locais")]);
  } catch (e) {
    $("#area-lista").setAttribute("aria-busy", "false");
    lista.innerHTML = `<div class="aviso aviso-erro">${icone("alerta")}<div><strong>Não conseguimos carregar os avisos.</strong><p>${esc(mensagemAmigavel(e))} Recarregue a página.</p></div></div>`;
    $("#contadores").innerHTML = "";
    return;
  }

  const ordem = { ABERTA: 0, EM_ANALISE: 1, RESOLVIDA: 2 };
  const n = (s) => ocs.filter((o) => o.status === s).length;

  function contadores() {
    const c = (cls, ic, rot, v) => `<div class="kpi ${cls}"><span class="valor">${v}</span><span class="rotulo">${icone(ic)}${rot}</span></div>`;
    $("#contadores").innerHTML = c("total", "painel", "Total de avisos", ocs.length) + c("aberta", "alerta", "Abertos", n("ABERTA")) +
      c("analise", "lupa", "Em análise", n("EM_ANALISE")) + c("resolvida", "ok", "Resolvidos", n("RESOLVIDA"));
    const t = ocs.length || 1, p = (s) => ((n(s) / t) * 100).toFixed(1);
    $("#progresso").innerHTML = ocs.length ? `<i class="a" style="width:${p("ABERTA")}%"></i><i class="e" style="width:${p("EM_ANALISE")}%"></i><i class="r" style="width:${p("RESOLVIDA")}%"></i>` : "";
  }

  function filtros() {
    const itens = [["", "Todos", ocs.length], ["ABERTA", "Abertos", n("ABERTA")], ["EM_ANALISE", "Em análise", n("EM_ANALISE")], ["RESOLVIDA", "Resolvidos", n("RESOLVIDA")]];
  $("#filtros").innerHTML = itens.map(([v, r, c]) => `<li><button type="button" data-f="${v}" aria-pressed="${v === filtro}">${r} (${c})</button></li>`).join("");
  }

  function barras() {
    const por = new Map();
    ocs.filter((o) => o.status === "ABERTA").forEach((o) => { const r = por.get(o.idTrecho) || { id: o.idTrecho, n: 0, g: 0 }; r.n++; r.g = Math.max(r.g, o.gravidade); por.set(o.idTrecho, r); });
    const top = [...por.values()].sort((a, b) => b.n - a.n || b.g - a.g).slice(0, 6), max = top.length ? top[0].n : 1;
    $("#col-mapa").hidden = !top.length;
    $("#barras").innerHTML = top.map((r) => {
      const tr = trechos.find((t) => t.id === r.id);
      return `<li><button type="button" class="barra-item" data-trecho="${r.id}" aria-pressed="${r.id === trechoSel}">
        <span class="b-nome">${tr ? esc(nomeTrecho(tr, locais)) : "Trecho " + r.id}</span>
        <span class="b-trilho" aria-hidden="true"><i style="width:${(r.n / max) * 100}%"></i></span>
        <span class="b-n">${r.n} ${r.n === 1 ? "aviso" : "avisos"}</span></button></li>`;
    }).join("");
  }

  function desenha() {
    contadores(); filtros(); barras();
    const itens = ocs.filter((o) => (!filtro || o.status === filtro) && (!trechoSel || o.idTrecho === trechoSel)).sort((a, b) => ordem[a.status] - ordem[b.status] || b.gravidade - a.gravidade || b.id - a.id);
    $("#area-lista").setAttribute("aria-busy", "false");
    if (!ocs.length) {
      lista.innerHTML = `<div class="cartao vazio">${icone("ok")}<h3>Nenhum aviso ainda</h3><p>Quando um morador avisar um problema, ele aparece aqui para você acompanhar.</p><a class="botao" href="ocorrencia.html">Registrar um aviso</a></div>`;
      return;
    }
    if (!itens.length) {
      lista.innerHTML = `<div class="cartao vazio">${icone("ok")}<h3>Nenhum aviso aqui</h3><p>Não há avisos com essa situação. Escolha "Todos" para ver os demais.</p></div>`;
      return;
    }
    lista.innerHTML = `<ul class="lista">` + itens.map((o) => {
      const tp = tipos.find((t) => t.id === o.idTipoOcorrencia) || { descricao: "Problema" };
      const tr = trechos.find((t) => t.id === o.idTrecho);
      const opts = Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === o.status ? " selected" : ""}>${v}</option>`).join("");
      const cls = o.status === "ABERTA" ? "selo-erro" : o.status === "EM_ANALISE" ? "selo-atencao" : "selo-ok";
      const pontos = [1, 2, 3, 4, 5].map((i) => `<i${i <= o.gravidade ? ' class="on"' : ""}></i>`).join("");
      return `<li class="ocorrencia s-${o.status}" data-id="${o.id}" data-trecho="${o.idTrecho}">
        <h3>${icone(iconeTipo(o.idTipoOcorrencia))}${esc(tp.descricao)}</h3>
        <ul class="selos"><li class="selo ${cls}">${icone(STATUS_ICONE[o.status])}${STATUS[o.status]}</li>
          <li class="selo ${o.gravidade >= 4 ? "selo-erro" : "selo-neutro"}"><span class="pontos${o.gravidade >= 4 ? "" : " leve"}" aria-hidden="true">${pontos}</span>Gravidade ${o.gravidade} de 5: ${esc(GRAVIDADE[o.gravidade])}</li></ul>
        <p class="meta">${tr ? esc(nomeTrecho(tr, locais)) : "Trecho " + o.idTrecho} &middot; registrado em ${dataBR(o.dataRegistro)}${o.dataResolucao ? " &middot; resolvido em " + dataBR(o.dataResolucao) : ""}</p>
        ${o.descricao ? `<p class="desc">${esc(o.descricao)}</p>` : ""}
        <div class="muda"><div class="linha"><div><label for="st-${o.id}">Mudar a situação</label><select id="st-${o.id}">${opts}</select></div>
        <button class="botao botao-claro" type="button" data-salvar="${o.id}">Salvar</button></div></div></li>`;
    }).join("") + "</ul>";
  }

  lista.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-salvar]");
    if (!b) return;
    const id = Number(b.dataset.salvar), o = ocs.find((x) => x.id === id);
    const novo = $("#st-" + id).value;
    if (novo === o.status) { msg.innerHTML = `<div class="aviso aviso-info">${icone("info")}<div>O aviso ${id} já está como "${STATUS[novo]}".</div></div>`; return; }
    b.disabled = true; b.textContent = "Salvando...";
    try {
      const salvo = await api("/api/ocorrencias/" + id, { metodo: "PUT", corpo: Object.assign({}, o, { status: novo, dataResolucao: novo === "RESOLVIDA" ? hoje() : null }) });
      ocs[ocs.findIndex((x) => x.id === id)] = salvo;
      desenha();
      msg.innerHTML = `<div class="aviso aviso-ok">${icone("ok")}<div>Aviso ${id} agora está como <strong>${STATUS[salvo.status]}</strong>.</div></div>`;
      const nb = $(`[data-salvar="${id}"]`); if (nb) nb.focus();
    } catch (e) {
      b.disabled = false; b.textContent = "Salvar";
      msg.innerHTML = `<div class="aviso aviso-erro">${icone("alerta")}<div><strong>Não foi possível salvar.</strong> ${esc(mensagemAmigavel(e))}</div></div>`;
    }
  });
  $("#barras").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-trecho]"); if (!b) return;
    const id = Number(b.dataset.trecho); trechoSel = trechoSel === id ? null : id;
    if (trechoSel && filtro && filtro !== "ABERTA") filtro = "ABERTA";
    msg.innerHTML = ""; desenha();
    const nb = $(`[data-trecho="${id}"]`); if (nb) nb.focus();
  });
  $("#filtros").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-f]"); if (!b) return;
    filtro = b.dataset.f; msg.innerHTML = ""; desenha();
    const nb = $(`[data-f="${filtro}"]`); if (nb) nb.focus();
  });
  desenha();
})();
