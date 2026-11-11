package br.com.fiap.caminhoseguro.model;

/**
 * Representa a tabela T_CS_TIPO_OCORRENCIA (domínio dos problemas de calçada).
 */
public class TipoOcorrencia {

    private Long id;

    private String descricao;

    private Integer gravidadePadrao;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Integer getGravidadePadrao() {
        return gravidadePadrao;
    }

    public void setGravidadePadrao(Integer gravidadePadrao) {
        this.gravidadePadrao = gravidadePadrao;
    }
}
