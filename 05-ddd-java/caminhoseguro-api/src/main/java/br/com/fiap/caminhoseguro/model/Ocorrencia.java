package br.com.fiap.caminhoseguro.model;

import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;

/**
 * Representa a tabela T_CS_OCORRENCIA: problema registrado pela comunidade em um trecho.
 */
public class Ocorrencia {

    private Long id;

    @NotNull(message = "obrigatório")
    private Long idTrecho;

    @NotNull(message = "obrigatório")
    private Long idUsuario;

    @NotNull(message = "obrigatório")
    private Long idTipoOcorrencia;

    @Size(max = 400, message = "máximo de 400 caracteres")
    private String descricao;

    @NotNull(message = "obrigatório")
    @Min(value = 1, message = "gravidade deve estar entre 1 e 5")
    @Max(value = 5, message = "gravidade deve estar entre 1 e 5")
    private Integer gravidade;

    @Pattern(regexp = "ABERTA|EM_ANALISE|RESOLVIDA", message = "status deve ser ABERTA, EM_ANALISE ou RESOLVIDA")
    private String status;

    private LocalDate dataRegistro;

    private LocalDate dataResolucao;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdTrecho() {
        return idTrecho;
    }

    public void setIdTrecho(Long idTrecho) {
        this.idTrecho = idTrecho;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Long getIdTipoOcorrencia() {
        return idTipoOcorrencia;
    }

    public void setIdTipoOcorrencia(Long idTipoOcorrencia) {
        this.idTipoOcorrencia = idTipoOcorrencia;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Integer getGravidade() {
        return gravidade;
    }

    public void setGravidade(Integer gravidade) {
        this.gravidade = gravidade;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getDataRegistro() {
        return dataRegistro;
    }

    public void setDataRegistro(LocalDate dataRegistro) {
        this.dataRegistro = dataRegistro;
    }

    public LocalDate getDataResolucao() {
        return dataResolucao;
    }

    public void setDataResolucao(LocalDate dataResolucao) {
        this.dataResolucao = dataResolucao;
    }
}
