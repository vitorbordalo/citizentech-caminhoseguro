package br.com.fiap.caminhoseguro.model;

/**
 * Representa a tabela T_CS_BAIRRO (bairro atendido pela solução).
 */
public class Bairro {

    private Long id;

    private String nome;

    private String cidade;

    private String uf;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getUf() {
        return uf;
    }

    public void setUf(String uf) {
        this.uf = uf;
    }
}
