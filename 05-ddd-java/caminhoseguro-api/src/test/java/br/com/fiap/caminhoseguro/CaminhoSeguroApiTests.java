package br.com.fiap.caminhoseguro;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Testes de integração: sobem a aplicação inteira com o banco H2 (perfil h2)
 * e chamam os endpoints com MockMvc. Cada teste cria os próprios dados quando precisa alterá-los,
 * para não bagunçar os dados de exemplo usados nos testes de rota.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class CaminhoSeguroApiTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JdbcTemplate jdbc;

    // ---------- Métodos auxiliares ----------

    private ResultActions enviarJson(String metodo, String url, String json) throws Exception {
        var req = metodo.equals("POST") ? post(url) : put(url);
        return mvc.perform(req.contentType(MediaType.APPLICATION_JSON).content(json));
    }

    /** Cria um local novo com nome único e devolve o id. */
    private long criarLocal() throws Exception {
        String json = "{\"idBairro\":1,\"idTipoLocal\":3,\"nome\":\"Local " + UUID.randomUUID() + "\",\"latitude\":-23.56,\"longitude\":-46.65}";
        String corpo = enviarJson("POST", "/api/locais", json).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(corpo, "$.id")).longValue();
    }

    private long criarTrecho(long origem, long destino) throws Exception {
        String json = "{\"idLocalOrigem\":" + origem + ",\"idLocalDestino\":" + destino
                + ",\"tempoMin\":5,\"risco\":3,\"acessivel\":true,\"declividadePct\":2.5,\"larguraCalcadaM\":2.0}";
        String corpo = enviarJson("POST", "/api/trechos", json).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(corpo, "$.id")).longValue();
    }

    private String jsonOcorrencia(long trecho, String extra) {
        return "{\"idTrecho\":" + trecho + ",\"idUsuario\":1,\"idTipoOcorrencia\":1,\"descricao\":\"Teste\",\"gravidade\":3" + extra + "}";
    }

    // ---------- Status ----------

    @Test
    void statusRespondeOk() throws Exception {
        mvc.perform(get("/api/status")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
    }

    // ---------- Locais ----------

    @Test
    void locaisListarBuscarEFiltrar() throws Exception {
        mvc.perform(get("/api/locais")).andExpect(status().isOk()).andExpect(jsonPath("$[0].nome").exists());
        mvc.perform(get("/api/locais/3")).andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Posto de Saúde"))
                .andExpect(jsonPath("$.pontoApoio").value(true));
        mvc.perform(get("/api/locais?pontoApoio=true")).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nome", hasItem("Ponto de Apoio")))
                .andExpect(jsonPath("$[*].nome", not(hasItem("Escola"))));
    }

    @Test
    void locaisCrudCompleto() throws Exception {
        String nome = "Praça Teste " + UUID.randomUUID();
        String json = "{\"idBairro\":1,\"idTipoLocal\":5,\"nome\":\"" + nome + "\",\"endereco\":\"Rua X\",\"latitude\":-23.5,\"longitude\":-46.6,\"pontoApoio\":false}";
        String corpo = enviarJson("POST", "/api/locais", json)
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.nome").value(nome))
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(corpo, "$.id")).longValue();

        String alterado = json.replace("\"pontoApoio\":false", "\"pontoApoio\":true");
        enviarJson("PUT", "/api/locais/" + id, alterado).andExpect(status().isOk())
                .andExpect(jsonPath("$.pontoApoio").value(true));
        mvc.perform(get("/api/locais/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.pontoApoio").value(true));

        mvc.perform(delete("/api/locais/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/locais/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void locaisErros() throws Exception {
        // 404: não existe
        mvc.perform(get("/api/locais/99999")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.erro").value("Não encontrado"))
                .andExpect(jsonPath("$.mensagem").value("Local 99999 não encontrado"))
                .andExpect(jsonPath("$.caminho").value("/api/locais/99999"));
        // 400: sem nome e idBairro
        enviarJson("POST", "/api/locais", "{\"idTipoLocal\":1}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").value("obrigatório"))
                .andExpect(jsonPath("$.campos.idBairro").value("obrigatório"));
        // 400: JSON quebrado e id que não é número
        enviarJson("POST", "/api/locais", "{nome:").andExpect(status().isBadRequest());
        mvc.perform(get("/api/locais/abc")).andExpect(status().isBadRequest());
        // 404: chave estrangeira inexistente
        enviarJson("POST", "/api/locais", "{\"idBairro\":999,\"idTipoLocal\":1,\"nome\":\"X\"}")
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.mensagem").value("Bairro 999 não encontrado"));
        // 409: nome repetido no mesmo bairro
        enviarJson("POST", "/api/locais", "{\"idBairro\":1,\"idTipoLocal\":1,\"nome\":\"Escola\"}")
                .andExpect(status().isConflict());
        // 409: local que tem trechos não pode ser excluído
        mvc.perform(delete("/api/locais/1")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem", containsString("trechos")));
    }

    // ---------- Trechos ----------

    @Test
    void trechosCrudCompleto() throws Exception {
        long a = criarLocal();
        long b = criarLocal();
        long id = criarTrecho(a, b);

        mvc.perform(get("/api/trechos/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.tempoMin").value(5)).andExpect(jsonPath("$.acessivel").value(true));
        String alterado = "{\"idLocalOrigem\":" + a + ",\"idLocalDestino\":" + b
                + ",\"tempoMin\":9,\"risco\":6,\"acessivel\":false}";
        enviarJson("PUT", "/api/trechos/" + id, alterado).andExpect(status().isOk())
                .andExpect(jsonPath("$.tempoMin").value(9)).andExpect(jsonPath("$.acessivel").value(false));
        mvc.perform(get("/api/trechos")).andExpect(status().isOk()).andExpect(jsonPath("$[*].id", hasItem((int) id)));

        mvc.perform(delete("/api/trechos/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/trechos/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void trechosErros() throws Exception {
        long a = criarLocal();
        long b = criarLocal();
        criarTrecho(a, b);
        // 422: origem igual ao destino
        enviarJson("POST", "/api/trechos", "{\"idLocalOrigem\":" + a + ",\"idLocalDestino\":" + a + ",\"tempoMin\":3,\"risco\":1}")
                .andExpect(status().isUnprocessableEntity());
        // 409: par já existe
        enviarJson("POST", "/api/trechos", "{\"idLocalOrigem\":" + a + ",\"idLocalDestino\":" + b + ",\"tempoMin\":3,\"risco\":1}")
                .andExpect(status().isConflict());
        // 409: sentido inverso (trechos são bidirecionais)
        enviarJson("POST", "/api/trechos", "{\"idLocalOrigem\":" + b + ",\"idLocalDestino\":" + a + ",\"tempoMin\":3,\"risco\":1}")
                .andExpect(status().isConflict());
        // 400: risco fora da faixa 0-10 e tempo faltando
        enviarJson("POST", "/api/trechos", "{\"idLocalOrigem\":" + a + ",\"idLocalDestino\":" + b + ",\"risco\":11}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.risco").exists())
                .andExpect(jsonPath("$.campos.tempoMin").value("obrigatório"));
        // 404: local inexistente
        enviarJson("POST", "/api/trechos", "{\"idLocalOrigem\":99999,\"idLocalDestino\":" + b + ",\"tempoMin\":3,\"risco\":1}")
                .andExpect(status().isNotFound());
    }

    // ---------- Ocorrências ----------

    @Test
    void ocorrenciasCrudCompleto() throws Exception {
        long trecho = criarTrecho(criarLocal(), criarLocal());
        String corpo = enviarJson("POST", "/api/ocorrencias", jsonOcorrencia(trecho, ""))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.status").value("ABERTA"))
                .andExpect(jsonPath("$.dataRegistro").value(LocalDate.now().toString()))
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(corpo, "$.id")).longValue();

        // Status RESOLVIDA sem dataResolucao: preenche com hoje
        enviarJson("PUT", "/api/ocorrencias/" + id, jsonOcorrencia(trecho, ",\"status\":\"RESOLVIDA\""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVIDA"))
                .andExpect(jsonPath("$.dataResolucao").value(LocalDate.now().toString()));

        mvc.perform(get("/api/ocorrencias?status=RESOLVIDA")).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem((int) id)));
        mvc.perform(get("/api/ocorrencias?status=ABERTA")).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem((int) id))));

        // O trecho tem ocorrência: não pode ser excluído (409)
        mvc.perform(delete("/api/trechos/" + trecho)).andExpect(status().isConflict());

        mvc.perform(delete("/api/ocorrencias/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/ocorrencias/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void ocorrenciasErros() throws Exception {
        long trecho = criarTrecho(criarLocal(), criarLocal());
        // 422: resolução antes do registro
        enviarJson("POST", "/api/ocorrencias", jsonOcorrencia(trecho,
                ",\"dataRegistro\":\"2026-10-10\",\"dataResolucao\":\"2026-10-01\",\"status\":\"RESOLVIDA\""))
                .andExpect(status().isUnprocessableEntity());
        // 400: gravidade fora de 1-5 e status inválido
        enviarJson("POST", "/api/ocorrencias", jsonOcorrencia(trecho, ",\"status\":\"XYZ\"").replace("\"gravidade\":3", "\"gravidade\":9"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.gravidade").exists())
                .andExpect(jsonPath("$.campos.status").exists());
        // 400: filtro de status inválido
        mvc.perform(get("/api/ocorrencias?status=XYZ")).andExpect(status().isBadRequest());
        // 404: trecho inexistente
        enviarJson("POST", "/api/ocorrencias", jsonOcorrencia(99999, "")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensagem").value("Trecho 99999 não encontrado"));
    }

    @Test
    void tiposOcorrenciaListar() throws Exception {
        mvc.perform(get("/api/tipos-ocorrencia")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descricao").exists()).andExpect(jsonPath("$[0].gravidadePadrao").exists());
    }

    // ---------- Usuários ----------

    @Test
    void usuariosCrudEErros() throws Exception {
        String email = "teste." + UUID.randomUUID() + "@caminhoseguro.example";
        String json = "{\"nome\":\"Teste\",\"email\":\"" + email + "\",\"perfil\":\"PCD\"}";
        String corpo = enviarJson("POST", "/api/usuarios", json).andExpect(status().isCreated())
                .andExpect(jsonPath("$.dataCadastro").value(LocalDate.now().toString()))
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(corpo, "$.id")).longValue();

        // 409: e-mail repetido
        enviarJson("POST", "/api/usuarios", json).andExpect(status().isConflict());
        // 400: e-mail inválido e perfil inválido
        enviarJson("POST", "/api/usuarios", "{\"nome\":\"A\",\"email\":\"abc\",\"perfil\":\"ROBO\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.email").value("e-mail inválido"))
                .andExpect(jsonPath("$.campos.perfil").exists());

        enviarJson("PUT", "/api/usuarios/" + id, json.replace("PCD", "IDOSO")).andExpect(status().isOk())
                .andExpect(jsonPath("$.perfil").value("IDOSO"));
        // 409: usuário com ocorrências não é excluído (usuário 1 do DML)
        mvc.perform(delete("/api/usuarios/1")).andExpect(status().isConflict());
        mvc.perform(delete("/api/usuarios/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/usuarios/" + id)).andExpect(status().isNotFound());
    }

    // ---------- Rotas ----------

    @Test
    void rotaAcessivel() throws Exception {
        mvc.perform(get("/api/rotas?origem=1&destino=3&criterio=ACESSIVEL")).andExpect(status().isOk())
                .andExpect(jsonPath("$.criterio").value("ACESSIVEL"))
                .andExpect(jsonPath("$.tempoTotalMin").value(11))
                .andExpect(jsonPath("$.riscoTotal").value(3))
                .andExpect(jsonPath("$.totalmenteAcessivel").value(true))
                .andExpect(jsonPath("$.locais[0].id").value(1))
                .andExpect(jsonPath("$.locais[0].nome").value("Casa da dona Maria"))
                .andExpect(jsonPath("$.locais[2].pontoApoio").value(true))
                .andExpect(jsonPath("$.trechos[0]").value(1))
                .andExpect(jsonPath("$.trechos[1]").value(4));
    }

    @Test
    void rotaRapidaPodePassarPorTrechoNaoAcessivel() throws Exception {
        // 1 -> 4 direto (trecho 2) é o mais rápido, mas não é acessível
        mvc.perform(get("/api/rotas?origem=1&destino=4&criterio=RAPIDA")).andExpect(status().isOk())
                .andExpect(jsonPath("$.tempoTotalMin").value(4))
                .andExpect(jsonPath("$.totalmenteAcessivel").value(false))
                .andExpect(jsonPath("$.trechos[0]").value(2));
        // trechos são bidirecionais: 5 -> 1 funciona e passa pelo viaduto (local 9)
        mvc.perform(get("/api/rotas?origem=5&destino=1&criterio=RAPIDA")).andExpect(status().isOk())
                .andExpect(jsonPath("$.tempoTotalMin").value(10))
                .andExpect(jsonPath("$.locais[1].id").value(9));
    }

    @Test
    void rotaSegura() throws Exception {
        // Trecho 2 (1-4) tem ocorrência grave aberta (+5) e risco alto: a rota segura vai por 2, 8 e 10
        mvc.perform(get("/api/rotas?origem=1&destino=10&criterio=SEGURA")).andExpect(status().isOk())
                .andExpect(jsonPath("$.criterio").value("SEGURA"))
                .andExpect(jsonPath("$.locais[1].id").value(2))
                .andExpect(jsonPath("$.locais[2].id").value(8))
                .andExpect(jsonPath("$.tempoTotalMin").value(14))
                .andExpect(jsonPath("$.riscoTotal").value(7));
    }

    @Test
    void rotaSemCaminhoAcessivel() throws Exception {
        // Metrô Liberdade (13) não tem nenhum trecho ligado
        mvc.perform(get("/api/rotas?origem=1&destino=13&criterio=ACESSIVEL")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensagem", containsString("Não há rota acessível entre")));
    }

    @Test
    void rotaGravaConsultaQuandoVemUsuario() throws Exception {
        Integer antes = jdbc.queryForObject("SELECT COUNT(*) FROM T_CS_ROTA_CONSULTA WHERE id_usuario = 7", Integer.class);
        mvc.perform(get("/api/rotas?origem=1&destino=3&criterio=SEGURA&usuario=7")).andExpect(status().isOk());
        Integer depois = jdbc.queryForObject("SELECT COUNT(*) FROM T_CS_ROTA_CONSULTA WHERE id_usuario = 7", Integer.class);
        assertEquals(antes + 1, depois);
        // sem usuário não grava
        mvc.perform(get("/api/rotas?origem=1&destino=3&criterio=SEGURA")).andExpect(status().isOk());
        assertEquals(depois, jdbc.queryForObject("SELECT COUNT(*) FROM T_CS_ROTA_CONSULTA WHERE id_usuario = 7", Integer.class));
    }

    @Test
    void rotaErros() throws Exception {
        mvc.perform(get("/api/rotas?origem=1&destino=1&criterio=RAPIDA")).andExpect(status().isUnprocessableEntity());
        mvc.perform(get("/api/rotas?origem=1&destino=3&criterio=VOANDO")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/rotas?origem=1&destino=3")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.criterio").value("obrigatório"));
        mvc.perform(get("/api/rotas?origem=999&destino=3&criterio=RAPIDA")).andExpect(status().isNotFound());
        mvc.perform(get("/api/rotas?origem=1&destino=3&criterio=RAPIDA&usuario=999")).andExpect(status().isNotFound());
    }
}
