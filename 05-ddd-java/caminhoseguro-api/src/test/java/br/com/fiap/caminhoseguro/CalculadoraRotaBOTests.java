package br.com.fiap.caminhoseguro;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import br.com.fiap.caminhoseguro.bo.CalculadoraRotaBO;
import br.com.fiap.caminhoseguro.model.Trecho;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** Testes unitários do Dijkstra (sem banco): bidirecional, pesos e penalidade +5. */
class CalculadoraRotaBOTests {

    private final CalculadoraRotaBO calc = new CalculadoraRotaBO();

    private static Trecho t(long id, long o, long d, int tempo, int risco, boolean acessivel) {
        Trecho x = new Trecho();
        x.setId(id);
        x.setIdLocalOrigem(o);
        x.setIdLocalDestino(d);
        x.setTempoMin(tempo);
        x.setRisco(risco);
        x.setAcessivel(acessivel);
        return x;
    }

    // 1-2 (curto e arriscado) ; 1-3-2 (longo e seguro)
    private final List<Trecho> grafo = List.of(
            t(1, 1, 2, 5, 8, true), t(2, 1, 3, 4, 0, true), t(3, 3, 2, 4, 0, true));

    @Test
    void rapidaUsaSoOTempo() {
        assertEquals(List.of(1L), ids(calc.calcular(grafo, Set.of(), "RAPIDA", 1L, 2L)));
    }

    @Test
    void seguraPenalizaRisco() {
        assertEquals(List.of(2L, 3L), ids(calc.calcular(grafo, Set.of(), "SEGURA", 1L, 2L)));
    }

    @Test
    void trechosSaoBidirecionais() {
        CalculadoraRotaBO.Caminho c = calc.calcular(grafo, Set.of(), "RAPIDA", 2L, 1L);
        assertEquals(List.of(2L, 1L), c.locais());
    }

    @Test
    void ocorrenciaGraveSoma5NaSeguraMasNaRapida() {
        // trecho 1: peso SEGURA 5+2*1=7 (+5 = 12) contra 4+4=8 pelo desvio
        List<Trecho> g = List.of(t(1, 1, 2, 5, 1, true), t(2, 1, 3, 4, 0, true), t(3, 3, 2, 4, 0, true));
        assertEquals(List.of(1L), ids(calc.calcular(g, Set.of(), "SEGURA", 1L, 2L)));
        assertEquals(List.of(2L, 3L), ids(calc.calcular(g, Set.of(1L), "SEGURA", 1L, 2L)));
        assertEquals(List.of(1L), ids(calc.calcular(g, Set.of(1L), "RAPIDA", 1L, 2L)));
    }

    @Test
    void acessivelIgnoraTrechoNaoAcessivelESemCaminhoRetornaNull() {
        List<Trecho> g = List.of(t(1, 1, 2, 5, 0, false));
        assertNull(calc.calcular(g, Set.of(), "ACESSIVEL", 1L, 2L));
        assertEquals(List.of(1L), ids(calc.calcular(g, Set.of(), "RAPIDA", 1L, 2L)));
    }

    private static List<Long> ids(CalculadoraRotaBO.Caminho c) {
        return c.trechos().stream().map(Trecho::getId).toList();
    }
}
