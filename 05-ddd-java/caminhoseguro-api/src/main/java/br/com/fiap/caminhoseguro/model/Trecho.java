package br.com.fiap.caminhoseguro.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;

/**
 * Representa a tabela T_CS_TRECHO: ligação entre dois locais (aresta do grafo, nos dois sentidos).
 */
public class Trecho {

    private Long id;

    @NotNull(message = "obrigatório")
    private Long idLocalOrigem;

    @NotNull(message = "obrigatório")
    private Long idLocalDestino;

    @NotNull(message = "obrigatório")
    @Min(value = 1, message = "deve ser maior que zero")
    @Max(value = 9999, message = "máximo de 9999")
    private Integer tempoMin;

    @NotNull(message = "obrigatório")
    @Min(value = 0, message = "risco deve estar entre 0 e 10")
    @Max(value = 10, message = "risco deve estar entre 0 e 10")
    private Integer risco;

    private Boolean acessivel;

    @DecimalMin(value = "-999.9", message = "mínimo de -999.9")
    @DecimalMax(value = "999.9", message = "máximo de 999.9")
    private Double declividadePct;

    @DecimalMin(value = "0", inclusive = false, message = "deve ser maior que zero")
    @DecimalMax(value = "99.99", message = "máximo de 99.99")
    private Double larguraCalcadaM;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdLocalOrigem() {
        return idLocalOrigem;
    }

    public void setIdLocalOrigem(Long idLocalOrigem) {
        this.idLocalOrigem = idLocalOrigem;
    }

    public Long getIdLocalDestino() {
        return idLocalDestino;
    }

    public void setIdLocalDestino(Long idLocalDestino) {
        this.idLocalDestino = idLocalDestino;
    }

    public Integer getTempoMin() {
        return tempoMin;
    }

    public void setTempoMin(Integer tempoMin) {
        this.tempoMin = tempoMin;
    }

    public Integer getRisco() {
        return risco;
    }

    public void setRisco(Integer risco) {
        this.risco = risco;
    }

    public Boolean getAcessivel() {
        return acessivel;
    }

    public void setAcessivel(Boolean acessivel) {
        this.acessivel = acessivel;
    }

    public Double getDeclividadePct() {
        return declividadePct;
    }

    public void setDeclividadePct(Double declividadePct) {
        this.declividadePct = declividadePct;
    }

    public Double getLarguraCalcadaM() {
        return larguraCalcadaM;
    }

    public void setLarguraCalcadaM(Double larguraCalcadaM) {
        this.larguraCalcadaM = larguraCalcadaM;
    }
}
