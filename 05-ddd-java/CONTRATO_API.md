# Contrato da API CaminhoSeguro (base: `/api`)

JSON em camelCase. Datas em `yyyy-MM-dd`. Erros sempre no formato:
`{"timestamp":"...","status":404,"erro":"Não encontrado","mensagem":"Local 99 não encontrado","caminho":"/api/locais/99"}`
e para validação, também `"campos": {"nome":"obrigatório"}`.

| Recurso | Métodos | Campos (request/response) |
|---|---|---|
| `/api/usuarios` | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} | id, nome, email, perfil (IDOSO, PCD, CUIDADOR, MORADOR, AGENTE), dataCadastro |
| `/api/locais` | GET (filtro opcional `?pontoApoio=true`), POST, GET/{id}, PUT/{id}, DELETE/{id} | id, idBairro, idTipoLocal, nome, endereco, latitude, longitude, pontoApoio (boolean) |
| `/api/trechos` | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} | id, idLocalOrigem, idLocalDestino, tempoMin, risco (0–10), acessivel (boolean), declividadePct, larguraCalcadaM |
| `/api/ocorrencias` | GET (filtro opcional `?status=ABERTA`), POST, GET/{id}, PUT/{id}, DELETE/{id} | id, idTrecho, idUsuario, idTipoOcorrencia, descricao, gravidade (1–5), status (ABERTA, EM_ANALISE, RESOLVIDA), dataRegistro, dataResolucao |
| `/api/tipos-ocorrencia` | GET | id, descricao, gravidadePadrao |
| `/api/rotas` | GET `?origem={idLocal}&destino={idLocal}&criterio=RAPIDA|SEGURA|ACESSIVEL&usuario={idUsuario opcional}` | resposta: criterio, tempoTotalMin, riscoTotal, totalmenteAcessivel, locais: [{id, nome, pontoApoio}], trechos: [ids] — grava em T_CS_ROTA_CONSULTA se `usuario` vier |

Regras da rota (Dijkstra sobre os trechos, que são **bidirecionais**):
- RAPIDA: peso = tempoMin.
- SEGURA: peso = tempoMin + 2 × risco.
- ACESSIVEL: ignora trechos com acessivel = false; peso = tempoMin + risco. Sem caminho → 404 com mensagem clara ("Não há rota acessível entre X e Y").
- Trechos com ocorrência ABERTA de gravidade ≥ 4 recebem +5 no peso nos critérios SEGURA e ACESSIVEL (a comunidade influencia a rota).

Status HTTP: 200 GET/PUT, 201 POST (com header Location), 204 DELETE, 400 validação, 404 não encontrado, 409 conflito (ex.: e-mail repetido, excluir local que tem trechos), 422 regra de negócio (ex.: origem = destino, dataResolucao antes do registro).
