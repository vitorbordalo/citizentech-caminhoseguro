/* CaminhoSeguro - utilitários comuns: API (com modo demonstração), ícones, cabeçalho/rodapé. */
const CS = (() => {
  let demo = false;

  class ErroApi extends Error {
    constructor(status, corpo) {
      super((corpo && corpo.mensagem) || "Erro " + status);
      this.status = status; this.corpo = corpo || {};
    }
  }

  function entrarDemo() {
    demo = true;
    const selo = document.getElementById("selo-demo");
    if (selo) selo.hidden = false;
  }

  function tratar(status, dados) {
    if (status >= 400) throw new ErroApi(status, dados);
    return dados;
  }

  // O servidor gratuito "dorme": se a chamada demora, explicamos em vez de deixar a pessoa no escuro.
  let pendentes = 0, timerAviso = null, timerSeg = null, inicio = 0;
  function mostrarAcordando() {
    if (document.getElementById("acordando")) return;
    const d = document.createElement("div");
    d.id = "acordando"; d.className = "acordando"; d.setAttribute("role", "status");
    d.innerHTML = '<span class="giro" aria-hidden="true"></span><div><strong>Acordando o servidor...</strong>' +
      '<p>O serviço gratuito descansa quando fica parado, e a primeira visita pode levar até 1 minuto. Fique nesta tela: já vai carregar. <span id="acordando-seg"></span></p>' +
      '<div class="barra" aria-hidden="true"><i id="acordando-barra"></i></div></div>';
    document.body.appendChild(d);
    timerSeg = setInterval(() => {
      const s = Math.round((Date.now() - inicio) / 1000);
      const el = document.getElementById("acordando-seg"), b = document.getElementById("acordando-barra");
      if (el) el.textContent = "(" + s + " s)";
      if (b) b.style.width = Math.min(100, (s / 60) * 100) + "%";
    }, 1000);
  }
  function iniciarEspera() {
    if (pendentes++ === 0) { inicio = Date.now(); timerAviso = setTimeout(mostrarAcordando, 3000); }
  }
  function fimEspera() {
    if (--pendentes > 0) return;
    clearTimeout(timerAviso); clearInterval(timerSeg);
    const d = document.getElementById("acordando"); if (d) d.remove();
  }

  async function api(caminho, { metodo = "GET", corpo } = {}) {
    if (!demo) {
      iniciarEspera();
      const ctl = new AbortController(), limite = setTimeout(() => ctl.abort(), 90000);
      try {
        const r = await fetch(API_BASE + caminho, {
          method: metodo, signal: ctl.signal,
          headers: Object.assign({ Accept: "application/json" }, corpo ? { "Content-Type": "application/json" } : {}),
          body: corpo ? JSON.stringify(corpo) : undefined,
        });
        if (r.status === 204) return null;
        if ((r.headers.get("content-type") || "").includes("json")) return tratar(r.status, await r.json());
        throw new Error("resposta-nao-json"); // servidor estático sem API: cai no modo demonstração
      } catch (e) {
        if (e instanceof ErroApi) throw e;
        entrarDemo();
      } finally { clearTimeout(limite); fimEspera(); }
    }
    const { status, data } = CS_DEMO.request(metodo, caminho, corpo);
    return tratar(status, data);
  }

  // Texto amigável para qualquer erro
  function mensagemAmigavel(e) {
    if (e instanceof ErroApi) {
      if (e.status === 400 && e.corpo.campos) return "Confira o que foi preenchido: " + Object.keys(e.corpo.campos).join(", ") + ".";
      if (e.corpo.mensagem) return e.corpo.mensagem + ".";
    }
    return "Não deu certo agora. Tente de novo em instantes.";
  }

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Ícones próprios (SVG inline, 24x24, traço)
  const I = {
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
    acessivel: '<circle cx="11" cy="4.500" r="1.800"/><path d="M11 8v6h5l2.500 5"/><path d="M8 11h3"/><path d="M7.500 13.500a5 5 0 1 0 7 6.500"/>',
    segura: '<path d="M12 3l7.500 3v5.500c0 4.800-3.200 8.200-7.500 9.500-4.300-1.300-7.500-4.700-7.500-9.500V6z"/><path d="M8.800 12l2.400 2.400 4.200-4.400"/>',
    rapida: '<circle cx="12" cy="13" r="8"/><path d="M12 8.500V13l3 2"/><path d="M9.500 2.500h5"/>',
    buraco: '<path d="M3 15c2-3.500 5-5 9-5s7 1.500 9 5c-2 3.500-5 5-9 5s-7-1.500-9-5z"/><path d="M8 4l2 3M16 4l-2 3"/>',
    estreita: '<path d="M8 3L5.500 21M16 3l2.500 18"/><path d="M12 5v3M12 11v3M12 17v3"/>',
    rampa: '<path d="M3 20h5v-4h4v-4h4V8h5"/><path d="M3 4l5 4"/>',
    luz: '<path d="M9 18h6M10 21.500h4"/><path d="M12 2.500a6.500 6.500 0 0 0-3.800 11.800c.6.500 1 1.200 1 2h5.600c0-.8.400-1.500 1-2A6.500 6.500 0 0 0 12 2.500z"/>',
    travessia: '<path d="M12 3L22 20H2z"/><path d="M12 10v4.500M12 17.500v.5"/>',
    ladeira: '<path d="M3 19L21 8v11z"/><path d="M8 19v-3.500"/>',
    coracao: '<path d="M12 20.500s-7.500-4.700-7.500-10.500A4.300 4.300 0 0 1 12 7.500a4.300 4.300 0 0 1 7.500 2.500c0 5.800-7.500 10.500-7.500 10.500z"/>',
    alerta: '<circle cx="12" cy="12" r="9.500"/><path d="M12 7v6M12 16.500v.5"/>',
    info: '<circle cx="12" cy="12" r="9.500"/><path d="M12 11v6M12 7.500v.5"/>',
    ok: '<circle cx="12" cy="12" r="9.500"/><path d="M7.500 12.500l3 3 6-6.500"/>',
    relogio: '<circle cx="12" cy="12" r="9.500"/><path d="M12 7v5l3.500 2"/>',
    lupa: '<circle cx="10.500" cy="10.500" r="6.500"/><path d="M15.500 15.500L21 21"/>',
    casa: '<path d="M3 11l9-7.500 9 7.500"/><path d="M5.500 9.500V20h13V9.500"/><path d="M10 20v-5h4v5"/>',
    painel: '<rect x="3.500" y="3.500" width="17" height="17" rx="2.500"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4.500 21c.5-4.500 3.500-6.500 7.500-6.500s7 2 7.500 6.500"/>',
    seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
    sol: '<circle cx="12" cy="12" r="4.200"/><path d="M12 2.500v2.200M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.500 1.500M17.200 17.200l1.500 1.500M5.300 18.700l1.500-1.500M17.200 6.800l1.500-1.500"/>',
    lua: '<path d="M20.500 14.500A8.500 8.500 0 1 1 9.500 3.500a6.800 6.800 0 0 0 11 11z"/>',
    troca: '<path d="M7 4v14M3.500 14.500L7 18l3.500-3.500M17 20V6M13.500 9.500L17 6l3.500 3.500"/>',
    imprimir: '<path d="M7 9V3.500h10V9"/><rect x="3.500" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.500H7z"/>',
    mapa: '<path d="M9 4L3.500 6v14L9 18l6 2 5.500-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>',
    nuvem: '<path d="M7 18a4.500 4.500 0 0 1-.5-9 6 6 0 0 1 11.500 1.500A3.800 3.800 0 0 1 17.500 18z"/>',
  };
  const icone = (nome, extra = "") =>
    `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round">${I[nome] || I.pin}</svg>`;
  const ICONE_TIPO = { 1: "buraco", 2: "estreita", 3: "rampa", 4: "luz", 5: "travessia", 6: "ladeira" };
  const iconeTipo = (id) => ICONE_TIPO[id] || "alerta";

  const LOGO = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect width="48" height="48" rx="13" fill="#0f766e"/>
    <path d="M24 40s-10-8-10-17a10 10 0 0 1 20 0c0 9-10 17-10 17z" fill="#fff"/>
    <path d="M19 22.500l3.800 3.800 7-7.600" fill="none" stroke="#0f766e" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function alternarTema() {
    const novo = document.documentElement.getAttribute("data-tema") === "escuro" ? "claro" : "escuro";
    document.documentElement.setAttribute("data-tema", novo);
    try { localStorage.setItem("cs_tema", novo); } catch (e) { /* ok */ }
    const b = document.getElementById("btn-tema");
    if (b) b.setAttribute("aria-label", novo === "escuro" ? "Mudar para o tema claro" : "Mudar para o tema escuro");
  }

  function renderShell(atual) {
    const item = (id, href, ic, txt) =>
      `<a href="${href}"${atual === id ? ' aria-current="page"' : ""}>${icone(ic)}<span>${txt}</span></a>`;
    const escuro = document.documentElement.getAttribute("data-tema") === "escuro";
    $("#shell-topo").outerHTML = `<header class="topo"><div class="topo-int">
      <a class="marca" href="index.html" aria-label="CaminhoSeguro, ir para o início">${LOGO}<span>CaminhoSeguro<small>Calçadas seguras, juntos</small></span></a>
      <span id="selo-demo" class="selo-demo" hidden title="A API não respondeu: estes são dados de exemplo, guardados só neste navegador.">${icone("nuvem")}Modo demonstração</span>
      <nav class="menu" aria-label="Principal">
        ${item("inicio", "index.html", "casa", "Traçar caminho")}
        ${item("ocorrencia", "ocorrencia.html", "alerta", "Avisar problema")}
        ${item("painel", "painel.html", "painel", "Painel<span class=\"sr-only\"> do agente</span>")}
      </nav>
      <span class="usuario">${icone("usuario")}<span>Olá, ${USUARIO_LOGADO.nome}</span></span>
      <button class="btn-tema" id="btn-tema" type="button" aria-label="${escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro"}">${icone("sol", "sol")}${icone("lua", "lua")}</button>
      </div></header>`;
    $("#btn-tema").addEventListener("click", alternarTema);
    $("#shell-rodape").outerHTML = `<footer class="rodape"><div>
      <p><strong>CaminhoSeguro</strong>, uma CitizenTech da Global Solution FIAP 2026.2. Protótipo acadêmico.</p>
      <p>Todos os locais, ocorrências e usuários são fictícios. Não use para decidir um trajeto real.</p></div></footer>`;
  }

  // Preenche um <select> com locais
  function opcoesLocais(sel, locais, escolhido) {
    sel.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = ""; ph.textContent = "Escolha um lugar...";
    sel.appendChild(ph);
    locais.forEach((l) => {
      const o = document.createElement("option");
      o.value = l.id; o.textContent = l.nome + (l.pontoApoio ? " (ponto de apoio)" : "");
      if (String(l.id) === String(escolhido)) o.selected = true;
      sel.appendChild(o);
    });
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dataBR = (iso) => (iso ? iso.split("-").reverse().join("/") : "");
  const GRAVIDADE = { 1: "Incomoda um pouco", 2: "Incomoda", 3: "Atrapalha", 4: "Difícil de passar", 5: "Perigoso" };
  const STATUS = { ABERTA: "Aberta", EM_ANALISE: "Em análise", RESOLVIDA: "Resolvida" };
  const STATUS_ICONE = { ABERTA: "alerta", EM_ANALISE: "lupa", RESOLVIDA: "ok" };
  const CRITERIOS = {
    ACESSIVEL: { nome: "Mais acessível", icone: "acessivel", desc: "Sem degraus nem ladeiras fortes." },
    SEGURA: { nome: "Mais segura", icone: "segura", desc: "Foge dos trechos com perigo." },
    RAPIDA: { nome: "Mais rápida", icone: "rapida", desc: "Chega no menor tempo a pé." },
  };

  const nomeTrecho = (t, locais) => {
    const n = (id) => (locais.find((l) => l.id === id) || {}).nome || "Local " + id;
    return n(t.idLocalOrigem) + " → " + n(t.idLocalDestino);
  };

  return { api, ErroApi, mensagemAmigavel, $, $$, icone, iconeTipo, renderShell, opcoesLocais, esc, dataBR, nomeTrecho,
    GRAVIDADE, STATUS, STATUS_ICONE, CRITERIOS };
})();
