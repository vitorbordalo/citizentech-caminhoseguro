package br.com.fiap.caminhoseguro.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;

/**
 * Representa a tabela T_CS_LOCAL: um ponto do bairro (nó do grafo de rotas).
 */
public class Local {

    private Long id;

    @NotNull(message = "obrigatório")
    private Long idBairro;

    @NotNull(message = "obrigatório")
    private Long idTipoLocal;

    @NotBlank(message = "obrigatório")
    @Size(max = 80, message = "máximo de 80 caracteres")
    private String nome;

    @Size(max = 120, message = "máximo de 120 caracteres")
    private String endereco;

    @DecimalMin(value = "-90", message = "latitude deve estar entre -90 e 90")
    @DecimalMax(value = "90", message = "latitude deve estar entre -90 e 90")
    private Double latitude;

    @DecimalMin(value = "-180", message = "longitude deve estar entre -180 e 180")
    @DecimalMax(value = "180", message = "longitude deve estar entre -180 e 180")
    private Double longitude;

    private Boolean pontoApoio;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdBairro() {
        return idBairro;
    }

    public void setIdBairro(Long idBairro) {
        this.idBairro = idBairro;
    }

    public Long getIdTipoLocal() {
        return idTipoLocal;
    }

    public void setIdTipoLocal(Long idTipoLocal) {
        this.idTipoLocal = idTipoLocal;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Boolean getPontoApoio() {
        return pontoApoio;
    }

    public void setPontoApoio(Boolean pontoApoio) {
        this.pontoApoio = pontoApoio;
    }
}
