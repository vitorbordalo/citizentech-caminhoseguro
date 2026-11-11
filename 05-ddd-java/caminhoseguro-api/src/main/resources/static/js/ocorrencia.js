(async function () {
  const { $, $$, icone, iconeTipo, esc, api, mensagemAmigavel, renderShell, GRAVIDADE, nomeTrecho } = CS;
  renderShell("ocorrencia");
  const form = $("#form-ocorrencia"), resumo = $("#resumo-erros"), selTrecho = $("#trecho");
  const noCaminho = (new URLSearchParams(location.search).get("trechos") || "").split(",").map(Number).filter(Boolean);
  let tipos = [], trechos = [], locais = [];

  try {
    [tipos, trechos, locais] = await Promise.all([api("/api/tipos-ocorrencia"), api("/api/trechos"), api("/api/locais")]);
  } catch (e) {
    $("#carregando").hidden = true;
    resumo.hidden = false;
    resumo.innerHTML = icone("alerta") + `<div><strong>Não conseguimos abrir o formulário.</strong><p>${esc(mensagemAmigavel(e))} Recarregue a página.</p></div>`;
    $("#botao-enviar").disabled = true;
    return;
  }
  $("#carregando").hidden = true;

  // Trechos: os do caminho (se veio de lá) ficam em primeiro
  const opt = (t) => `<option value="${t.id}">${esc(nomeTrecho(t, locais))}</option>`;
  const doCaminho = trechos.filter((t) => noCaminho.includes(t.id)), outros = trechos.filter((t) => !noCaminho.includes(t.id));
  selTrecho.innerHTML = `<option value="">Escolha o trecho</option>` +
    (doCaminho.length ? `<optgroup label="Neste caminho">${doCaminho.map(opt).join("")}</optgroup><optgroup label="Outros trechos">${outros.map(opt).join("")}</optgroup>` : trechos.map(opt).join(""));
  if (doCaminho.length === 1) selTrecho.value = doCaminho[0].id;

  $("#tipos").innerHTML = tipos.map((t) => `
    <label class="opcao"><input type="radio" name="tipo" value="${t.id}">
      <span class="cartao-opcao">${icone(iconeTipo(t.id))}<strong>${esc(t.descricao)}</strong>
      <span class="marca-sel">${icone("check")}</span></span></label>`).join("");
  $("#gravidade").innerHTML = [1, 2, 3, 4, 5].map((n) => `
    <label class="opcao"><input type="radio" name="gravidade" value="${n}">
      <span class="cartao-opcao"><span class="num" aria-hidden="true">${n}</span><strong><span class="sr-only">${n}: </span>${GRAVIDADE[n]}</strong>
      <span class="marca-sel">${icone("check")}</span></span></label>`).join("");

  function erro(id, texto) {
    const p = $("#erro-" + id), tem = !!texto;
    p.hidden = !tem; p.innerHTML = tem ? icone("alerta") + "<span>" + esc(texto) + "</span>" : "";
    if (id === "trecho") selTrecho.setAttribute("aria-invalid", tem ? "true" : "false");
    return tem;
  }

  // Sugere a gravidade do tipo escolhido (a pessoa pode mudar)
  $$('input[name="tipo"]').forEach((r) => r.addEventListener("change", () => {
    erro("tipo", "");
    const t = tipos.find((x) => String(x.id) === r.value);
    if (t && !$('input[name="gravidade"]:checked')) { $(`input[name="gravidade"][value="${t.gravidadePadrao}"]`).checked = true; erro("grav", ""); }
  }));
  $$('input[name="gravidade"]').forEach((r) => r.addEventListener("change", () => erro("grav", "")));
  const mini = $("#mini-mapa");
  function mapaTrecho() {
    const t = trechos.find((x) => String(x.id) === selTrecho.value);
    mini.hidden = !t;
    if (t) CSMapa.desenhar(mini, { locais, trechos, soTrecho: t, fonte: 30, altura: 300, aria: "Mapa com o trecho escolhido em destaque: " + nomeTrecho(t, locais) });
  }
  selTrecho.addEventListener("change", () => { erro("trecho", ""); mapaTrecho(); });
  mapaTrecho();
  $("#descricao").addEventListener("input", (e) => { $("#contagem").textContent = e.target.value.length + " de 300 letras"; });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const trecho = selTrecho.value, tipo = ($('input[name="tipo"]:checked') || {}).value, grav = ($('input[name="gravidade"]:checked') || {}).value;
    const faltas = [];
    if (erro("trecho", trecho ? "" : "Escolha o trecho onde viu o problema.")) faltas.push(["trecho", "Falta escolher o trecho."]);
    if (erro("tipo", tipo ? "" : "Escolha que problema você viu.")) faltas.push(["tipo", "Falta escolher o problema."]);
    if (erro("grav", grav ? "" : "Diga quanto isso atrapalha.")) faltas.push(["grav", "Falta dizer quanto atrapalha."]);
    if (faltas.length) {
      resumo.hidden = false;
      resumo.innerHTML = icone("alerta") + "<div><strong>Falta pouco para enviar:</strong><p>" + faltas.map((f) => esc(f[1])).join("<br>") + "</p></div>";
      const alvo = faltas[0][0] === "trecho" ? selTrecho : faltas[0][0] === "tipo" ? $('input[name="tipo"]') : $('input[name="gravidade"]');
      alvo.focus();
      return;
    }
    resumo.hidden = true;
    const botao = $("#botao-enviar");
    botao.disabled = true; botao.textContent = "Enviando...";
    try {
      const salva = await api("/api/ocorrencias", { metodo: "POST", corpo: {
        idTrecho: Number(trecho), idUsuario: USUARIO_LOGADO.id, idTipoOcorrencia: Number(tipo),
        descricao: $("#descricao").value.trim() || null, gravidade: Number(grav), status: "ABERTA" } });
      const t = trechos.find((x) => x.id === Number(trecho)), tp = tipos.find((x) => x.id === Number(tipo));
      $("#area-form").hidden = true;
      const c = $("#confirmacao");
      c.hidden = false;
      c.innerHTML = `${icone("ok")}<h1 tabindex="-1" id="titulo-conf">Aviso enviado. Obrigada, ${esc(USUARIO_LOGADO.nome)}!</h1>
        <p class="lead" style="margin-inline:auto">Seu aviso ajuda outras pessoas a escolher o melhor caminho.</p>
        <div class="aviso aviso-ok">${icone("info")}<div><strong>${esc(tp.descricao)}</strong> (${esc(GRAVIDADE[salva.gravidade])})<br>${esc(nomeTrecho(t, locais))}<br>Situação: aberto, a prefeitura vai acompanhar.</div></div>
        <div class="acoes"><a class="botao" href="index.html">Traçar um caminho</a><a class="botao botao-claro" href="ocorrencia.html">Avisar outro problema</a></div>`;
      $("#titulo-conf").focus();
    } catch (e) {
      resumo.hidden = false;
      resumo.innerHTML = icone("alerta") + `<div><strong>Não conseguimos enviar seu aviso.</strong><p>${esc(mensagemAmigavel(e))} O que você preencheu continua aqui: é só tentar de novo.</p></div>`;
      botao.disabled = false; botao.textContent = "Enviar aviso";
      resumo.scrollIntoView({ block: "center" });
    }
  });
})();
