package br.com.fiap.caminhoseguro.dto;

import java.util.List;

/**
 * Resposta de GET /api/rotas: o caminho calculado, com totais e a lista de locais e trechos.
 */
public class RotaResposta {

    /** Resumo de um local no caminho. */
    public record LocalResumo(Long id, String nome, boolean pontoApoio) {
    }

    private String criterio;
    private int tempoTotalMin;
    private int riscoTotal;
    private boolean totalmenteAcessivel;
    private List<LocalResumo> locais;
    private List<Long> trechos;

    public String getCriterio() {
        return criterio;
    }

    public void setCriterio(String criterio) {
        this.criterio = criterio;
    }

    public int getTempoTotalMin() {
        return tempoTotalMin;
    }

    public void setTempoTotalMin(int tempoTotalMin) {
        this.tempoTotalMin = tempoTotalMin;
    }

    public int getRiscoTotal() {
        return riscoTotal;
    }

    public void setRiscoTotal(int riscoTotal) {
        this.riscoTotal = riscoTotal;
    }

    public boolean isTotalmenteAcessivel() {
        return totalmenteAcessivel;
    }

    public void setTotalmenteAcessivel(boolean totalmenteAcessivel) {
        this.totalmenteAcessivel = totalmenteAcessivel;
    }

    public List<LocalResumo> getLocais() {
        return locais;
    }

    public void setLocais(List<LocalResumo> locais) {
        this.locais = locais;
    }

    public List<Long> getTrechos() {
        return trechos;
    }

    public void setTrechos(List<Long> trechos) {
        this.trechos = trechos;
    }
}
