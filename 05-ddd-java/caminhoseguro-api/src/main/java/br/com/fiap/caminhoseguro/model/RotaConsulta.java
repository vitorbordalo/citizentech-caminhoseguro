package br.com.fiap.caminhoseguro.model;

import java.time.LocalDate;

/**
 * Representa a tabela T_CS_ROTA_CONSULTA: histórico de rotas pedidas (indicador de impacto).
 */
public class RotaConsulta {

    private Long id;

    private Long idUsuario;

    private Long idLocalOrigem;

    private Long idLocalDestino;

    private String criterio;

    private Integer tempoTotal;

    private LocalDate dataConsulta;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
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

    public String getCriterio() {
        return criterio;
    }

    public void setCriterio(String criterio) {
        this.criterio = criterio;
    }

    public Integer getTempoTotal() {
        return tempoTotal;
    }

    public void setTempoTotal(Integer tempoTotal) {
        this.tempoTotal = tempoTotal;
    }

    public LocalDate getDataConsulta() {
        return dataConsulta;
    }

    public void setDataConsulta(LocalDate dataConsulta) {
        this.dataConsulta = dataConsulta;
    }
}
