(async function () {
  const { $, icone, esc, opcoesLocais, CRITERIOS, api, mensagemAmigavel, renderShell } = CS;
  renderShell("inicio");
  const params = new URLSearchParams(location.search);
  const form = $("#form-rota"), origem = $("#origem"), destino = $("#destino"), resumo = $("#resumo-erros");
  const preCriterio = CRITERIOS[params.get("criterio")] ? params.get("criterio") : "ACESSIVEL";

  // Critérios (Mais acessível é o padrão)
  $("#criterios").innerHTML = Object.entries(CRITERIOS).map(([cod, c]) => `
    <label class="opcao"><input type="radio" name="criterio" value="${cod}"${cod === preCriterio ? " checked" : ""}>
      <span class="cartao-opcao">${icone(c.icone)}<span><strong>${esc(c.nome)}</strong><span class="desc">${esc(c.desc)}</span></span>
      <span class="marca-sel">${icone("check")}</span></span></label>`).join("");

  try {
    const locais = await api("/api/locais");
    opcoesLocais(origem, locais, params.get("origem"));
    opcoesLocais(destino, locais, params.get("destino"));
    $("#carregando").hidden = true;
  } catch (e) {
    $("#carregando").hidden = true;
    resumo.hidden = false;
    resumo.innerHTML = icone("alerta") + `<div><strong>Não conseguimos carregar os lugares.</strong><p>${esc(mensagemAmigavel(e))} Recarregue a página.</p></div>`;
    $("#botao-ver").disabled = true;
    return;
  }

  function erroCampo(campo, texto) {
    const p = $("#erro-" + campo.id), tem = !!texto;
    campo.setAttribute("aria-invalid", tem ? "true" : "false");
    p.hidden = !tem;
    p.innerHTML = tem ? icone("alerta") + "<span>" + esc(texto) + "</span>" : "";
    return tem;
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const msgs = [];
    let primeiro = null;
    if (erroCampo(origem, origem.value ? "" : "Escolha de onde você sai.")) { msgs.push("Falta escolher de onde você sai."); primeiro = primeiro || origem; }
    if (erroCampo(destino, !destino.value ? "Escolha para onde você vai." : (destino.value === origem.value ? "O destino precisa ser diferente de onde você sai." : ""))) {
      msgs.push(destino.value ? "O destino precisa ser diferente da origem." : "Falta escolher para onde você vai."); primeiro = primeiro || destino;
    }
    if (msgs.length) {
      resumo.hidden = false;
      resumo.innerHTML = icone("alerta") + "<div><strong>Falta pouco para ver o caminho:</strong><p>" + msgs.map(esc).join("<br>") + "</p></div>";
      primeiro.focus();
      return;
    }
    resumo.hidden = true;
    const criterio = form.querySelector('input[name="criterio"]:checked').value;
    location.href = "rota.html?" + new URLSearchParams({ origem: origem.value, destino: destino.value, criterio });
  });
  [origem, destino].forEach((c) => c.addEventListener("change", () => erroCampo(c, "")));
})();
