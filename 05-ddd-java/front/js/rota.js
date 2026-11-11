(async function () {
  const { $, icone, esc, api, mensagemAmigavel, renderShell, CRITERIOS, ErroApi } = CS;
  renderShell("inicio");
  const box = $("#resultado");
  const q = new URLSearchParams(location.search);
  const origem = q.get("origem"), destino = q.get("destino");
  const criterio = CRITERIOS[q.get("criterio")] ? q.get("criterio") : "ACESSIVEL";

  function pronto(html) {
    box.innerHTML = html;
    box.setAttribute("aria-busy", "false");
    const h1 = box.querySelector("h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  }
  const alternativas = (excluir) => `<ul class="outros-criterios">` + Object.entries(CRITERIOS).filter(([c]) => c !== excluir)
    .map(([c, v]) => `<li><a href="rota.html?${new URLSearchParams({ origem, destino, criterio: c })}">${esc(v.nome)}</a></li>`).join("") + "</ul>";

  if (!origem || !destino) {
    pronto(`<div class="cartao vazio">${icone("pin")}<h1>Vamos escolher o caminho</h1>
      <p>Para ver o passo a passo, diga de onde você sai e para onde vai.</p>
      <a class="botao botao-destaque" href="index.html">Escolher os lugares</a></div>`);
    return;
  }

  let rota, locais, trechos, abertas;
  try {
    [rota, locais, trechos, abertas] = await Promise.all([
      api("/api/rotas?" + new URLSearchParams({ origem, destino, criterio, usuario: USUARIO_LOGADO.id })),
      api("/api/locais"), api("/api/trechos"), api("/api/ocorrencias?status=ABERTA"),
    ]);
  } catch (e) {
    if (e instanceof ErroApi && e.status === 404) {
      pronto(`<div class="cartao"><h1>Não achamos um caminho assim</h1>
        <div class="aviso aviso-atencao">${icone("alerta")}<div><strong>${esc(e.corpo.mensagem || "Não há rota entre esses lugares")}.</strong>
        <p>${criterio === "ACESSIVEL" ? "Isso quer dizer que, hoje, todos os caminhos passam por degraus, ladeira forte ou calçada muito estreita, ou que não há calçadas ligando os dois lugares." : "Esses dois lugares não estão ligados por calçadas que conhecemos."}</p></div></div>
        <h2>O que você pode fazer</h2>
        <p>${criterio === "ACESSIVEL" ? "Você pode tentar outro tipo de caminho, mas ele pode passar por degraus ou ladeiras: se for por ele, vá acompanhada. Ou escolha outro destino." : "Escolha outro destino ou outro lugar de saída."}</p>
        ${criterio === "ACESSIVEL" ? alternativas(criterio) : ""}
        <div class="acoes"><a class="botao botao-destaque" href="index.html?${new URLSearchParams({ origem, destino, criterio })}">Mudar os lugares</a></div></div>`);
    } else if (e instanceof ErroApi && e.status === 422) {
      pronto(`<div class="cartao"><h1>Os dois lugares são iguais</h1>
        <div class="aviso aviso-atencao">${icone("alerta")}<div><strong>Você já está no destino.</strong><p>Escolha um lugar de saída diferente do destino.</p></div></div>
        <div class="acoes"><a class="botao botao-destaque" href="index.html">Escolher de novo</a></div></div>`);
    } else {
      pronto(`<div class="cartao"><h1>Não conseguimos mostrar o caminho</h1>
        <div class="aviso aviso-erro">${icone("alerta")}<div><strong>Algo deu errado.</strong><p>${esc(mensagemAmigavel(e))}</p></div></div>
        <div class="acoes"><a class="botao botao-destaque" href="">Tentar de novo</a><a class="botao botao-claro" href="index.html">Voltar ao início</a></div></div>`);
    }
    return;
  }

  const cri = CRITERIOS[rota.criterio] || CRITERIOS[criterio];
  const ult = rota.locais.length - 1;
  const apoios = rota.locais.filter((l) => l.pontoApoio);
  const trechoPorId = new Map(trechos.map((t) => [t.id, t]));
  const avisosPorTrecho = new Map();
  abertas.forEach((o) => avisosPorTrecho.set(o.idTrecho, (avisosPorTrecho.get(o.idTrecho) || 0) + 1));

  const passos = rota.locais.map((l, i) => {
    const t = trechoPorId.get(rota.trechos[i]);
    const papel = i === 0 ? "Você sai de" : i === ult ? "Você chega em" : "Passe por";
    let info = "";
    if (i < ult && t) {
      const n = avisosPorTrecho.get(t.id);
      info = `<p class="trecho-info"><span>${icone("relogio")}Siga por cerca de ${t.tempoMin} min</span>
        ${t.acessivel ? `<span>${icone("acessivel")}Trecho acessível</span>` : `<span class="alerta">${icone("alerta")}Pode ter degrau ou ladeira forte</span>`}
        ${n ? `<span class="alerta">${icone("alerta")}${n === 1 ? "1 aviso aberto" : n + " avisos abertos"} de moradores</span>` : ""}</p>`;
    }
    return `<li class="passo${l.pontoApoio ? " apoio" : ""}"><span class="numero" aria-hidden="true">${i + 1}</span>
      <p class="papel"><span class="sr-only">Passo ${i + 1}: </span>${papel}</p><p class="nome">${esc(l.nome)}</p>
      ${l.pontoApoio ? `<span class="apoio-tag">${icone("coracao")}Ponto de apoio: dá para descansar e pedir ajuda</span>` : ""}${info}</li>`;
  }).join("");

  const aviso = rota.totalmenteAcessivel ? "" : `<div class="aviso aviso-atencao">${icone("alerta")}<div><strong>Atenção: este caminho não é totalmente acessível.</strong>
    <p>Alguns trechos podem ter degraus, ladeira forte ou calçada estreita. Se puder, vá acompanhada. Ou veja o caminho <a href="rota.html?${new URLSearchParams({ origem, destino, criterio: "ACESSIVEL" })}">mais acessível</a>.</p></div></div>`;

  pronto(`<header class="titulo"><h1>Seu caminho: ${esc(rota.locais[0].nome)} até ${esc(rota.locais[ult].nome)}</h1></header>
    <div class="resultado">
      <section class="cartao" aria-labelledby="titulo-passos"><h2 id="titulo-passos">Passo a passo</h2><ol class="passos">${passos}</ol></section>
      <aside class="lateral cartao resumo" aria-label="Resumo do caminho">
        <p class="papel" style="margin:0;font-weight:700">Tempo a pé</p>
        <p class="tempo">${rota.tempoTotalMin} <small>minutos</small></p>
        <ul class="selos">
          <li class="selo selo-neutro">${icone(cri.icone)}${esc(cri.nome)}</li>
          <li class="selo ${rota.totalmenteAcessivel ? "selo-ok" : "selo-atencao"}">${icone(rota.totalmenteAcessivel ? "ok" : "alerta")}${rota.totalmenteAcessivel ? "Totalmente acessível" : "Não é totalmente acessível"}</li>
        </ul>
        ${aviso}
        <h2>Pontos de apoio no caminho</h2>
        <p>${apoios.length ? apoios.map((l) => `<strong>${esc(l.nome)}</strong>`).join(", ") + ". Dá para parar, descansar e pedir ajuda." : "Neste caminho não há ponto de apoio. Vá com calma e, se precisar, peça ajuda a quem estiver por perto."}</p>
        <div class="acoes"><a class="botao botao-destaque" href="ocorrencia.html?trechos=${rota.trechos.join(",")}">${icone("alerta")}Avisar um problema neste caminho</a></div>
        <h2 style="margin-top:1.5rem">Ver de outro jeito</h2>${alternativas(rota.criterio)}
        <div class="acoes"><a class="botao botao-claro" href="index.html?${new URLSearchParams({ origem, destino, criterio: rota.criterio })}">Mudar os lugares</a></div>
      </aside>
    </div>`);
})();
