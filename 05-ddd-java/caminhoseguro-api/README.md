# CaminhoSeguro API

API REST em Java (Spring Boot) do projeto **CaminhoSeguro** (CitizenTech, Global Solution FIAP 2026.2): rotas acessíveis para idosos e pessoas com mobilidade reduzida no bairro **Bela Vista (São Paulo)**. Disciplina: Domain Driven Design - Java.

Equipe 1, turma 2ESPH: Lucas Branquinho (RM 562262) e Vitor Bordalo (RM 561592).

## Arquitetura (padrão de aula)

| Pacote | Papel |
|---|---|
| `model` | Uma classe por tabela do banco (Bairro, TipoLocal, Local, Trecho, Usuario, TipoOcorrencia, Ocorrencia, RotaConsulta), com as validações do Bean Validation |
| `dao` | Acesso ao banco com **JDBC puro** (`PreparedStatement`), recebendo o `DataSource` do Spring. Sem JPA |
| `bo` | Regras de negócio e validações; chama os DAOs. `CalculadoraRotaBO` faz o Dijkstra |
| `controller` | `@RestController` com GET, POST, PUT e DELETE |
| `exception` | Exceções próprias + `ManipuladorExcecoes` (`@RestControllerAdvice`) |
| `dto` | Resposta da rota e formato do erro |
| `config` | CORS e título do Swagger |

Fluxo: `Controller -> BO -> DAO -> Oracle`. O diagrama de classes está em [`diagrama-classes.puml`](diagrama-classes.puml) (PlantUML).

## Endpoints (base `/api`)

O contrato completo está em `../CONTRATO_API.md`. JSON em camelCase, datas em `yyyy-MM-dd`.

| Recurso | Métodos |
|---|---|
| `/api/usuarios` | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} |
| `/api/locais` (filtro `?pontoApoio=true`) | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} |
| `/api/trechos` | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} |
| `/api/ocorrencias` (filtro `?status=ABERTA`) | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} |
| `/api/tipos-ocorrencia` | GET |
| `/api/rotas?origem=1&destino=3&criterio=RAPIDA\|SEGURA\|ACESSIVEL&usuario=1` | GET (grava em `T_CS_ROTA_CONSULTA` se vier `usuario`) |
| `/api/status` | GET (health check, usado pelo Render) |
| `/swagger-ui.html` | Documentação interativa (Swagger) |

Status HTTP: 200 (GET/PUT), 201 (POST, com header `Location`), 204 (DELETE), 400 (validação), 404 (não encontrado), 409 (conflito), 422 (regra de negócio), 500 (erro genérico, sem stack trace).

Formato de erro:

```json
{"timestamp":"...","status":404,"erro":"Não encontrado","mensagem":"Local 99 não encontrado","caminho":"/api/locais/99"}
```

Nos erros 400 de validação aparece também `"campos": {"nome": "obrigatório"}`.

### Regras de negócio principais (no BO)

- Risco de 0 a 10, gravidade de 1 a 5, perfil entre IDOSO, PCD, CUIDADOR, MORADOR e AGENTE, e-mail válido.
- E-mail de usuário único (409); nome de local único no bairro (409); par origem/destino de trecho único (409).
- Origem diferente do destino no trecho e na rota (422).
- Não excluir local com trechos, trecho com ocorrências, usuário com ocorrências ou consultas (409).
- Ocorrência: `dataResolucao` não pode ser anterior à `dataRegistro` (422); status `RESOLVIDA` sem `dataResolucao` usa a data de hoje; status padrão `ABERTA`.
- Chave estrangeira que não existe resulta em 404 com mensagem clara (ex.: "Bairro 999 não encontrado").

### Cálculo da rota (Dijkstra)

Os trechos são **bidirecionais**. O peso de cada trecho depende do critério:

- `RAPIDA`: `tempoMin`
- `SEGURA`: `tempoMin + 2 x risco`
- `ACESSIVEL`: ignora trechos não acessíveis; `tempoMin + risco`
- Trecho com ocorrência **ABERTA** de gravidade 4 ou 5 soma **+5** nos critérios SEGURA e ACESSIVEL (a comunidade influencia a rota).

Sem caminho, a API responde 404 ("Não há rota acessível entre X e Y").

## Como rodar local (H2, sem Oracle)

Pré-requisito: Java 21.

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
```

No Windows (PowerShell): `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=h2"`.

O perfil `h2` usa um banco em memória (modo Oracle) criado por `src/main/resources/schema-h2.sql` e `data-h2.sql`, equivalentes ao DDL/DML da disciplina de Database. Depois abra `http://localhost:8080/swagger-ui.html`.

Testes: `./mvnw test` (integração com MockMvc no perfil h2). Empacotar: `./mvnw package -DskipTests`.

## Como rodar com o Oracle da FIAP

1. No SQL Developer, conectado com o seu usuário (RM), rode em ordem `04-database/01_DDL_caminhoseguro.sql` e `04-database/02_DML_caminhoseguro.sql`.
2. Defina as variáveis de ambiente (nunca coloque a senha no código nem no Git):

| Variável | Descrição | Padrão |
|---|---|---|
| `DB_URL` | URL JDBC, ex.: `jdbc:oracle:thin:@oracle.fiap.com.br:1521:ORCL` | o exemplo acima |
| `DB_USER` | usuário (RM) | sem padrão |
| `DB_PASSWORD` | senha | sem padrão |
| `PORT` | porta HTTP | `8080` |

3. Rode (sem perfil, que é o Oracle): `./mvnw spring-boot:run`.

## Deploy no Render (Docker)

1. Suba o projeto para um repositório no GitHub (a pasta `caminhoseguro-api/` precisa ficar na raiz do repositório, ou aponte o *Root Directory* para ela no Render).
2. No Render: **New > Blueprint** (usa o `render.yaml`) ou **New > Web Service**, escolhendo o repositório e **Runtime: Docker**.
3. Em **Environment**, cadastre `DB_URL`, `DB_USER` e `DB_PASSWORD` (o `render.yaml` já declara com `sync: false`, então o Render pede os valores).
4. **Health Check Path**: `/api/status`.
5. Faça o deploy. O Render define a variável `PORT` sozinho e a aplicação já lê essa variável. O build usa o `Dockerfile` (etapa Maven + imagem `eclipse-temurin:21-jre`).
6. Teste: `https://SEU-SERVICO.onrender.com/api/status` e `/swagger-ui.html`.

Observação: no plano gratuito o serviço "dorme" após alguns minutos sem uso; a primeira chamada depois disso demora mais.

## Front-end estático

Arquivos colocados em `src/main/resources/static/` são servidos pela própria API, e `/` abre o `index.html` se ele existir.
