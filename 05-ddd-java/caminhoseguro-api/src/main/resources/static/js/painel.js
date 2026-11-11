(async function () {
  const { $, icone, iconeTipo, esc, api, mensagemAmigavel, renderShell, GRAVIDADE, STATUS, STATUS_ICONE, dataBR, nomeTrecho } = CS;
  renderShell("painel");
  const lista = $("#lista"), msg = $("#mensagem"), filtro = $("#filtro");
  let ocs = [], tipos = [], trechos = [], locais = [];
  const hoje = () => new Date().toISOString().slice(0, 10);

  try {
    [ocs, tipos, trechos, locais] = await Promise.all([api("/api/ocorrencias"), api("/api/tipos-ocorrencia"), api("/api/trechos"), api("/api/locais")]);
  } catch (e) {
    $("#area-lista").setAttribute("aria-busy", "false");
    lista.innerHTML = `<div class="aviso aviso-erro">${icone("alerta")}<div><strong>Não conseguimos carregar os avisos.</strong><p>${esc(mensagemAmigavel(e))} Recarregue a página.</p></div></div>`;
    return;
  }

  const ordem = { ABERTA: 0, EM_ANALISE: 1, RESOLVIDA: 2 };
  function contadores() {
    const n = (s) => ocs.filter((o) => o.status === s).length;
    const c = (cls, ic, rot, v) => `<div class="contador ${cls}"><span class="valor">${v}</span><span class="rotulo">${icone(ic)}${rot}</span></div>`;
    $("#contadores").innerHTML = c("aberta", "alerta", "Abertos", n("ABERTA")) + c("analise", "lupa", "Em análise", n("EM_ANALISE")) + c("resolvida", "ok", "Resolvidos", n("RESOLVIDA"));
  }
  function desenha() {
    contadores();
    const f = filtro.value;
    const itens = ocs.filter((o) => !f || o.status === f).sort((a, b) => ordem[a.status] - ordem[b.status] || b.gravidade - a.gravidade || b.id - a.id);
    $("#area-lista").setAttribute("aria-busy", "false");
    if (!itens.length) {
      lista.innerHTML = `<div class="cartao vazio">${icone("ok")}<h3>Nenhum aviso aqui</h3><p>Não há avisos com essa situação. Escolha "Todos" para ver os demais.</p></div>`;
      return;
    }
    lista.innerHTML = `<ul class="lista">` + itens.map((o) => {
      const tp = tipos.find((t) => t.id === o.idTipoOcorrencia) || { descricao: "Problema" };
      const tr = trechos.find((t) => t.id === o.idTrecho);
      const opts = Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === o.status ? " selected" : ""}>${v}</option>`).join("");
      const cls = o.status === "ABERTA" ? "selo-erro" : o.status === "EM_ANALISE" ? "selo-atencao" : "selo-ok";
      return `<li class="ocorrencia s-${o.status}" data-id="${o.id}">
        <h3>${icone(iconeTipo(o.idTipoOcorrencia))}${esc(tp.descricao)}</h3>
        <ul class="selos"><li class="selo ${cls}">${icone(STATUS_ICONE[o.status])}${STATUS[o.status]}</li>
          <li class="selo ${o.gravidade >= 4 ? "selo-erro" : "selo-neutro"}">${icone(o.gravidade >= 4 ? "travessia" : "info")}Gravidade ${o.gravidade} de 5: ${esc(GRAVIDADE[o.gravidade])}</li></ul>
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
  filtro.addEventListener("change", () => { msg.innerHTML = ""; desenha(); });
  desenha();
})();
