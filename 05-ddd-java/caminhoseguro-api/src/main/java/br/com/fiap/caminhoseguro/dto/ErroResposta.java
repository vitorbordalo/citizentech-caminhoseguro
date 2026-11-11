package br.com.fiap.caminhoseguro.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Corpo JSON de todos os erros da API (formato definido no CONTRATO_API.md).
 * O campo "campos" só aparece nos erros de validação (400).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErroResposta {

    private final LocalDateTime timestamp = LocalDateTime.now();
    private final int status;
    private final String erro;
    private final String mensagem;
    private final String caminho;
    private final Map<String, String> campos;

    public ErroResposta(int status, String erro, String mensagem, String caminho, Map<String, String> campos) {
        this.status = status;
        this.erro = erro;
        this.mensagem = mensagem;
        this.caminho = caminho;
        this.campos = campos;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getErro() {
        return erro;
    }

    public String getMensagem() {
        return mensagem;
    }

    public String getCaminho() {
        return caminho;
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
