/* MODO DEMONSTRAÇÃO: dados simulados (mesmos de 04-database/02_DML_caminhoseguro.sql)
   e um Dijkstra com as mesmas regras de peso do CONTRATO_API.md.
   Usado só quando a API não responde (ex.: página aberta direto do disco). */
const CS_DEMO = (() => {
  const L = (id, idBairro, idTipoLocal, nome, endereco, latitude, longitude, ap) =>
    ({ id, idBairro, idTipoLocal, nome, endereco, latitude, longitude, pontoApoio: ap === "S" });
  const locais = [
    L(1, 1, 1, "Casa da dona Maria", "Rua fictícia, 100 - Bela Vista", -23.5589, -46.6452, "N"),
    L(2, 1, 5, "Praça 14 Bis", "Praça 14 Bis - Bela Vista", -23.5568, -46.6465, "N"),
    L(3, 1, 2, "Posto de Saúde", "Endereço de exemplo - Bela Vista", -23.5552, -46.6487, "S"),
    L(4, 1, 6, "Escola", "Endereço de exemplo - Bela Vista", -23.5599, -46.6471, "N"),
    L(5, 1, 4, "Metrô Brigadeiro", "Av. Paulista - Bela Vista", -23.5683, -46.6496, "N"),
    L(6, 1, 3, "Mercado", "Endereço de exemplo - Bela Vista", -23.5579, -46.6491, "N"),
    L(7, 1, 7, "Ponto de Apoio", "Endereço de exemplo - Bela Vista", -23.5561, -46.6503, "S"),
    L(8, 1, 6, "Biblioteca", "Endereço de exemplo - Bela Vista", -23.5612, -46.6518, "N"),
    L(9, 1, 8, "Viaduto", "Endereço de exemplo - Bela Vista", -23.5625, -46.6449, "N"),
    L(10, 1, 7, "Centro Comunitário", "Endereço de exemplo - Bela Vista", -23.5634, -46.6527, "S"),
    L(11, 1, 6, "FIAP Paulista", "Av. Paulista - Bela Vista", -23.564, -46.6525, "N"),
    L(12, 1, 3, "Farmácia", "Endereço de exemplo - Bela Vista", -23.5651, -46.6536, "N"),
    L(13, 2, 4, "Metrô Liberdade", "Praça da Liberdade - Liberdade", -23.5554, -46.6357, "N"),
    L(14, 1, 2, "UBS Bela Vista", "Endereço de exemplo - Bela Vista", -23.5608, -46.646, "S"),
    L(15, 1, 3, "Padaria Pão Quente", "Endereço de exemplo - Bela Vista", -23.5582, -46.643, "N"),
    L(16, 1, 7, "CRAS Bela Vista", "Endereço de exemplo - Bela Vista", -23.556, -46.6432, "S"),
    L(17, 1, 7, "Igreja da Paz", "Endereço de exemplo - Bela Vista", -23.5612, -46.6495, "S"),
    L(18, 1, 4, "Ponto de Ônibus Treze de Maio", "Rua Treze de Maio - Bela Vista", -23.564, -46.647, "N"),
    L(19, 1, 5, "Praça Dom Orione", "Endereço de exemplo - Bela Vista", -23.554, -46.6455, "N"),
    L(20, 1, 1, "Casa do seu Antônio", "Rua fictícia, 250 - Bela Vista", -23.5655, -46.6455, "N"),
    L(21, 1, 3, "Sacolão Bela Vista", "Endereço de exemplo - Bela Vista", -23.5668, -46.651, "N"),
    L(22, 1, 3, "Casa Lotérica Paulista", "Av. Paulista - Bela Vista", -23.5675, -46.656, "N"),
    L(23, 1, 4, "Ponto de Ônibus Paulista", "Av. Paulista - Bela Vista", -23.569, -46.6575, "N"),
    L(24, 1, 5, "Praça da Cidadania", "Endereço de exemplo - Bela Vista", -23.566, -46.6545, "S"),
    L(25, 1, 2, "Clínica da Família", "Endereço de exemplo - Bela Vista", -23.57, -46.653, "S"),
  ];
  // [id, origem, destino, tempoMin, risco, acessivel, declividadePct, larguraCalcadaM]
  const T = [
    [1, 1, 2, 5, 2, "S", 3.5, 2.3], [2, 1, 4, 4, 6, "N", 9.8, 1.1], [3, 1, 9, 6, 8, "S", 4.0, 1.6],
    [4, 2, 3, 6, 1, "S", 2.1, 2.8], [5, 2, 6, 4, 2, "S", 2.8, 2.4], [6, 2, 8, 5, 3, "S", 4.2, 2.0],
    [7, 4, 6, 5, 4, "S", 5.0, 1.8], [8, 4, 5, 7, 5, "N", 11.5, 1.2], [9, 9, 5, 4, 7, "S", 3.9, 1.5],
    [10, 6, 5, 6, 3, "S", 4.5, 2.2], [11, 6, 7, 3, 1, "S", 1.5, 3.0], [12, 3, 7, 4, 1, "S", 1.8, 2.6],
    [13, 8, 10, 4, 2, "S", 3.0, 2.1], [14, 7, 10, 5, 2, "S", 2.5, 2.5], [15, 3, 10, 9, 6, "N", 12.0, 1.0],
    [16, 5, 10, 8, 2, "S", 3.2, 2.7], [17, 11, 5, 5, 2, "S", 2.0, 3.5], [18, 11, 8, 6, 3, "S", 4.8, 2.2],
    [19, 11, 12, 3, 1, "S", 1.2, 3.2], [20, 12, 10, 4, 2, "S", 2.6, 2.4], [21, 6, 3, 5, 2, "S", 2.9, 2.3],
    [22, 1, 15, 4, 2, "S", 2.0, 2.4], [23, 15, 16, 4, 3, "S", 3.1, 2.0], [24, 16, 2, 6, 2, "S", 2.8, 2.2],
    [25, 16, 19, 5, 2, "S", 2.2, 2.5], [26, 19, 3, 5, 1, "S", 1.9, 2.7], [27, 9, 14, 7, 10, "S", 4.4, 1.9],
    [28, 4, 14, 7, 6, "S", 5.2, 1.7], [29, 14, 18, 4, 7, "S", 3.0, 1.6], [30, 14, 17, 5, 3, "S", 4.0, 2.0],
    [31, 17, 8, 6, 2, "S", 3.6, 2.3], [32, 18, 20, 3, 2, "S", 2.5, 2.5], [33, 18, 21, 6, 4, "S", 6.0, 1.8],
    [34, 20, 21, 4, 1, "S", 1.7, 2.9], [35, 20, 5, 8, 3, "S", 4.8, 2.1], [36, 21, 5, 7, 2, "S", 3.3, 2.6],
    [37, 21, 24, 5, 2, "S", 2.4, 2.4], [38, 24, 22, 4, 1, "S", 1.5, 3.0], [39, 22, 12, 6, 2, "S", 2.9, 2.2],
    [40, 24, 12, 5, 3, "S", 3.8, 2.0], [41, 22, 23, 5, 4, "N", 10.5, 1.2], [42, 24, 23, 6, 2, "S", 2.7, 2.3],
    [43, 23, 25, 4, 2, "S", 2.0, 2.6], [44, 25, 5, 8, 3, "S", 3.4, 2.4], [45, 25, 21, 6, 2, "S", 2.6, 2.5],
    [46, 17, 18, 4, 5, "N", 8.9, 1.3], [47, 20, 14, 5, 6, "N", 9.5, 1.1], [48, 19, 2, 4, 2, "S", 2.3, 2.6],
  ].map(([id, idLocalOrigem, idLocalDestino, tempoMin, risco, ac, declividadePct, larguraCalcadaM]) =>
    ({ id, idLocalOrigem, idLocalDestino, tempoMin, risco, acessivel: ac === "S", declividadePct, larguraCalcadaM }));
  const tipos = [
    { id: 1, descricao: "Buraco ou piso quebrado", gravidadePadrao: 4 },
    { id: 2, descricao: "Calçada estreita ou obstruída", gravidadePadrao: 3 },
    { id: 3, descricao: "Esquina sem rampa", gravidadePadrao: 4 },
    { id: 4, descricao: "Iluminação ruim", gravidadePadrao: 3 },
    { id: 5, descricao: "Travessia perigosa", gravidadePadrao: 5 },
    { id: 6, descricao: "Ladeira muito íngreme", gravidadePadrao: 2 },
  ];
  const O = (id, idTrecho, idUsuario, idTipoOcorrencia, descricao, gravidade, status, dataRegistro, dataResolucao) =>
    ({ id, idTrecho, idUsuario, idTipoOcorrencia, descricao, gravidade, status, dataRegistro, dataResolucao });
  const ocorrenciasSeed = [
    O(1, 2, 1, 3, "Esquina da escola sem rampa, precisei descer pela rua.", 4, "ABERTA", "2026-10-02", null),
    O(2, 3, 4, 5, "Carros em alta velocidade perto do viaduto, sem faixa.", 5, "EM_ANALISE", "2026-10-04", null),
    O(3, 8, 2, 6, "Subida muito forte para cadeira de rodas.", 3, "ABERTA", "2026-10-06", null),
    O(4, 15, 3, 1, "Piso solto em frente ao número 200.", 4, "RESOLVIDA", "2026-10-07", "2026-10-21"),
    O(5, 9, 5, 4, "Poste apagado, trecho escuro à noite.", 3, "RESOLVIDA", "2026-10-09", "2026-10-16"),
    O(6, 2, 6, 2, "Mesas de bar ocupando a calçada.", 3, "ABERTA", "2026-10-13", null),
    O(7, 3, 1, 4, "Iluminação fraca na passagem do viaduto.", 3, "ABERTA", "2026-10-15", null),
    O(8, 7, 7, 1, "Buraco grande perto do mercado.", 4, "EM_ANALISE", "2026-10-18", null),
    O(9, 15, 2, 3, "Sem rampa na esquina do posto de saúde.", 4, "ABERTA", "2026-10-22", null),
    O(10, 8, 3, 5, "Semáforo de pedestres muito curto.", 5, "ABERTA", "2026-10-25", null),
    O(11, 41, 4, 1, "Buraco grande na subida da lotérica.", 4, "ABERTA", "2026-10-27", null),
    O(12, 29, 2, 5, "Travessia sem semáforo em frente à UBS.", 5, "ABERTA", "2026-10-28", null),
    O(13, 33, 6, 6, "Ladeira forte até o sacolão, difícil com sacola.", 3, "ABERTA", "2026-10-29", null),
    O(14, 25, 5, 4, "Poste queimado perto do CRAS.", 3, "EM_ANALISE", "2026-10-30", null),
    O(15, 46, 1, 3, "Esquina da igreja sem rampa.", 4, "ABERTA", "2026-10-31", null),
    O(16, 42, 7, 1, "Piso quebrado na praça, já consertado pela subprefeitura.", 4, "RESOLVIDA", "2026-10-26", "2026-11-04"),
    O(17, 37, 3, 2, "Banca de frutas ocupando metade da calçada.", 3, "ABERTA", "2026-11-02", null),
    O(18, 47, 6, 3, "Sem rampa na esquina da casa do seu Antônio.", 4, "ABERTA", "2026-11-03", null),
  ];

  const CHAVE = "caminhoseguro_demo_ocorrencias";
  let ocorrencias;
  try { ocorrencias = JSON.parse(sessionStorage.getItem(CHAVE)); } catch (e) { ocorrencias = null; }
  if (!Array.isArray(ocorrencias)) ocorrencias = JSON.parse(JSON.stringify(ocorrenciasSeed));
  const salvar = () => { try { sessionStorage.setItem(CHAVE, JSON.stringify(ocorrencias)); } catch (e) { /* ok */ } };

  const erro = (status, nome, mensagem, caminho, campos) => ({
    status, data: Object.assign({ timestamp: new Date().toISOString(), status, erro: nome, mensagem, caminho }, campos ? { campos } : {}),
  });
  const ok = (data, status = 200) => ({ status, data });
  const hoje = () => new Date().toISOString().slice(0, 10);

  function rota(q, caminho) {
    const origem = Number(q.get("origem")), destino = Number(q.get("destino"));
    const criterio = (q.get("criterio") || "ACESSIVEL").toUpperCase();
    if (!["RAPIDA", "SEGURA", "ACESSIVEL"].includes(criterio)) return erro(400, "Requisição inválida", "Critério inválido", caminho);
    const lo = locais.find((l) => l.id === origem), ld = locais.find((l) => l.id === destino);
    if (!lo) return erro(404, "Não encontrado", `Local ${q.get("origem")} não encontrado`, caminho);
    if (!ld) return erro(404, "Não encontrado", `Local ${q.get("destino")} não encontrado`, caminho);
    if (origem === destino) return erro(422, "Regra de negócio", "Origem e destino devem ser diferentes", caminho);

    // Trechos com ocorrência ABERTA de gravidade >= 4 ganham +5 (SEGURA e ACESSIVEL)
    const penal = new Set(ocorrencias.filter((o) => o.status === "ABERTA" && o.gravidade >= 4).map((o) => o.idTrecho));
    const peso = (t) => {
      if (criterio === "RAPIDA") return t.tempoMin;
      const base = criterio === "SEGURA" ? t.tempoMin + 2 * t.risco : t.tempoMin + t.risco;
      return base + (penal.has(t.id) ? 5 : 0);
    };
    const adj = new Map();
    for (const t of T) {
      if (criterio === "ACESSIVEL" && !t.acessivel) continue;
      (adj.get(t.idLocalOrigem) || adj.set(t.idLocalOrigem, []).get(t.idLocalOrigem)).push([t.idLocalDestino, t]);
      (adj.get(t.idLocalDestino) || adj.set(t.idLocalDestino, []).get(t.idLocalDestino)).push([t.idLocalOrigem, t]);
    }
    const dist = new Map([[origem, 0]]), prev = new Map(), feito = new Set();
    while (true) {
      let u = null;
      for (const [id, d] of dist) if (!feito.has(id) && (u === null || d < dist.get(u))) u = id;
      if (u === null || u === destino) break;
      feito.add(u);
      for (const [v, t] of adj.get(u) || []) {
        const nd = dist.get(u) + peso(t);
        if (!dist.has(v) || nd < dist.get(v)) { dist.set(v, nd); prev.set(v, [u, t]); }
      }
    }
    if (!dist.has(destino)) {
      const qual = criterio === "ACESSIVEL" ? "rota acessível" : "rota";
      return erro(404, "Não encontrado", `Não há ${qual} entre ${lo.nome} e ${ld.nome}`, caminho);
    }
    const ids = [destino], trechos = [];
    for (let c = destino; c !== origem;) { const [p, t] = prev.get(c); trechos.unshift(t); ids.unshift(p); c = p; }
    return ok({
      criterio,
      tempoTotalMin: trechos.reduce((s, t) => s + t.tempoMin, 0),
      riscoTotal: trechos.reduce((s, t) => s + t.risco, 0),
      totalmenteAcessivel: trechos.every((t) => t.acessivel),
      locais: ids.map((i) => { const l = locais.find((x) => x.id === i); return { id: l.id, nome: l.nome, pontoApoio: l.pontoApoio }; }),
      trechos: trechos.map((t) => t.id),
    });
  }

  function request(metodo, caminho, corpo) {
    const url = new URL(caminho, "http://demo.local");
    const p = url.pathname.replace(/\/+$/, ""), q = url.searchParams;
    let m;
    if (p === "/api/locais" && metodo === "GET")
      return ok(q.get("pontoApoio") === "true" ? locais.filter((l) => l.pontoApoio) : locais);
    if (p === "/api/trechos" && metodo === "GET") return ok(T);
    if (p === "/api/tipos-ocorrencia" && metodo === "GET") return ok(tipos);
    if (p === "/api/rotas" && metodo === "GET") return rota(q, caminho);
    if (p === "/api/ocorrencias" && metodo === "GET") {
      const s = q.get("status");
      return ok(s ? ocorrencias.filter((o) => o.status === s) : ocorrencias);
    }
    if (p === "/api/ocorrencias" && metodo === "POST") {
      const b = corpo || {}, campos = {};
      if (!b.idTrecho) campos.idTrecho = "obrigatório";
      if (!b.idTipoOcorrencia) campos.idTipoOcorrencia = "obrigatório";
      if (!(b.gravidade >= 1 && b.gravidade <= 5)) campos.gravidade = "deve ser de 1 a 5";
      if (Object.keys(campos).length) return erro(400, "Requisição inválida", "Dados inválidos", caminho, campos);
      if (!T.find((t) => t.id === b.idTrecho)) return erro(404, "Não encontrado", `Trecho ${b.idTrecho} não encontrado`, caminho);
      const nova = O(Math.max(0, ...ocorrencias.map((o) => o.id)) + 1, b.idTrecho, b.idUsuario || 1, b.idTipoOcorrencia,
        b.descricao || null, b.gravidade, "ABERTA", hoje(), null);
      ocorrencias.push(nova); salvar();
      return ok(nova, 201);
    }
    if ((m = p.match(/^\/api\/ocorrencias\/(\d+)$/))) {
      const i = ocorrencias.findIndex((o) => o.id === Number(m[1]));
      if (i < 0) return erro(404, "Não encontrado", `Ocorrência ${m[1]} não encontrada`, caminho);
      if (metodo === "GET") return ok(ocorrencias[i]);
      if (metodo === "PUT") {
        const n = Object.assign({}, ocorrencias[i], corpo, { id: ocorrencias[i].id });
        if (n.dataResolucao && n.dataResolucao < n.dataRegistro)
          return erro(422, "Regra de negócio", "A data de resolução não pode ser antes do registro", caminho);
        ocorrencias[i] = n; salvar();
        return ok(n);
      }
    }
    return erro(404, "Não encontrado", "Recurso não disponível no modo demonstração", caminho);
  }

  return { request };
})();
