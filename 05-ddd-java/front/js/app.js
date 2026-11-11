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

  async function api(caminho, { metodo = "GET", corpo } = {}) {
    if (!demo) {
      try {
        const r = await fetch(API_BASE + caminho, {
          method: metodo,
          headers: Object.assign({ Accept: "application/json" }, corpo ? { "Content-Type": "application/json" } : {}),
          body: corpo ? JSON.stringify(corpo) : undefined,
        });
        if (r.status === 204) return null;
        if ((r.headers.get("content-type") || "").includes("json")) return tratar(r.status, await r.json());
        throw new Error("resposta-nao-json"); // servidor estático sem API: cai no modo demonstração
      } catch (e) {
        if (e instanceof ErroApi) throw e;
        entrarDemo();
      }
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
    nuvem: '<path d="M7 18a4.500 4.500 0 0 1-.5-9 6 6 0 0 1 11.500 1.500A3.800 3.800 0 0 1 17.500 18z"/>',
  };
  const icone = (nome, extra = "") =>
    `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round">${I[nome] || I.pin}</svg>`;
  const ICONE_TIPO = { 1: "buraco", 2: "estreita", 3: "rampa", 4: "luz", 5: "travessia", 6: "ladeira" };
  const iconeTipo = (id) => ICONE_TIPO[id] || "alerta";

  const LOGO = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect width="48" height="48" rx="12" fill="#ffc13b"/>
    <path d="M24 41s-11-8.700-11-18.500a11 11 0 0 1 22 0C35 32.300 24 41 24 41z" fill="#072f47"/>
    <path d="M18.500 22.500l4 4 7.500-8" fill="none" stroke="#fff" stroke-width="3.600" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function renderShell(atual) {
    const item = (id, href, ic, txt) =>
      `<a href="${href}"${atual === id ? ' aria-current="page"' : ""}>${icone(ic)}<span>${txt}</span></a>`;
    $("#shell-topo").outerHTML = `<header class="topo"><div class="topo-int">
      <a class="marca" href="index.html" aria-label="CaminhoSeguro, ir para o início">${LOGO}<span>CaminhoSeguro<small>Calçadas seguras, juntos</small></span></a>
      <span class="usuario">${icone("usuario")}<span>Olá, ${USUARIO_LOGADO.nome}</span></span>
      <span id="selo-demo" class="selo-demo" hidden title="A API não respondeu: estes são dados de exemplo, guardados só neste navegador.">${icone("nuvem")}Modo demonstração</span>
      <nav class="menu" aria-label="Principal">
        ${item("inicio", "index.html", "casa", "Ir a um lugar")}
        ${item("ocorrencia", "ocorrencia.html", "alerta", "Avisar problema")}
        ${item("painel", "painel.html", "painel", "Painel<span class=\"sr-only\"> do agente</span>")}
      </nav></div></header>`;
    $("#shell-rodape").outerHTML = `<footer class="rodape"><div>
      <p><strong>CaminhoSeguro</strong>, uma CitizenTech da Global Solution FIAP 2026.2. Protótipo acadêmico.</p>
      <p>Todos os locais, ocorrências e usuários são fictícios. Não use para decidir um trajeto real.</p></div></footer>`;
  }

  // Preenche um <select> com locais
  function opcoesLocais(sel, locais, escolhido) {
    sel.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = ""; ph.textContent = "Escolha um lugar";
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
    ACESSIVEL: { nome: "Mais acessível", icone: "acessivel", desc: "Evita degraus e ladeiras fortes." },
    SEGURA: { nome: "Mais segura", icone: "segura", desc: "Evita trechos com risco e com avisos de perigo." },
    RAPIDA: { nome: "Mais rápida", icone: "rapida", desc: "O menor tempo a pé." },
  };

  const nomeTrecho = (t, locais) => {
    const n = (id) => (locais.find((l) => l.id === id) || {}).nome || "Local " + id;
    return n(t.idLocalOrigem) + " → " + n(t.idLocalDestino);
  };

  return { api, ErroApi, mensagemAmigavel, $, $$, icone, iconeTipo, renderShell, opcoesLocais, esc, dataBR, nomeTrecho,
    GRAVIDADE, STATUS, STATUS_ICONE, CRITERIOS };
})();
