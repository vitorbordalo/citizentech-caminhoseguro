package br.com.fiap.caminhoseguro.model;

/**
 * Representa a tabela T_CS_TIPO_LOCAL (UBS, mercado, praça...).
 */
public class TipoLocal {

    private Long id;

    private String descricao;

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
}
