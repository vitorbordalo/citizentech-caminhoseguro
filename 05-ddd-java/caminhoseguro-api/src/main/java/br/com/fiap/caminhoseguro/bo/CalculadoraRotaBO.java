package br.com.fiap.caminhoseguro.bo;

import br.com.fiap.caminhoseguro.model.Trecho;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Calcula o melhor caminho entre dois locais com o algoritmo de Dijkstra.
 * Não acessa o banco: recebe os trechos prontos, o que facilita explicar e testar.
 *
 * Os trechos são bidirecionais (dá para andar nos dois sentidos).
 * Pesos (CONTRATO_API.md):
 *  - RAPIDA:    tempoMin
 *  - SEGURA:    tempoMin + 2 x risco
 *  - ACESSIVEL: ignora trechos não acessíveis; tempoMin + risco
 *  - Trecho com ocorrência ABERTA grave (>= 4) soma +5 em SEGURA e ACESSIVEL.
 */
@Component
public class CalculadoraRotaBO {

    /** Resultado: locais na ordem do caminho e os trechos percorridos. */
    public record Caminho(List<Long> locais, List<Trecho> trechos) {
    }

    /** Uma aresta do grafo: de um local até o vizinho, passando por um trecho, com um peso. */
    private record Aresta(Long de, Long para, Trecho trecho, int peso) {
    }

    /** Item da fila de prioridade: local e a distância acumulada até ele. */
    private record ItemFila(Long local, int distancia) {
    }

    /**
     * @return o caminho, ou null se não existir caminho entre origem e destino.
     */
    public Caminho calcular(List<Trecho> trechos, Set<Long> trechosComOcorrenciaGrave,
                            String criterio, Long origem, Long destino) {
        // 1) Monta o grafo (lista de adjacência) com os trechos nos dois sentidos
        Map<Long, List<Aresta>> grafo = new HashMap<>();
        for (Trecho t : trechos) {
            if ("ACESSIVEL".equals(criterio) && !Boolean.TRUE.equals(t.getAcessivel())) {
                continue; // critério acessível ignora trechos não acessíveis
            }
            int peso = calcularPeso(t, criterio, trechosComOcorrenciaGrave.contains(t.getId()));
            grafo.computeIfAbsent(t.getIdLocalOrigem(), k -> new ArrayList<>())
                    .add(new Aresta(t.getIdLocalOrigem(), t.getIdLocalDestino(), t, peso));
            grafo.computeIfAbsent(t.getIdLocalDestino(), k -> new ArrayList<>())
                    .add(new Aresta(t.getIdLocalDestino(), t.getIdLocalOrigem(), t, peso));
        }

        // 2) Dijkstra: sempre expande o local com menor distância acumulada
        Map<Long, Integer> distancia = new HashMap<>();
        Map<Long, Aresta> chegouPor = new HashMap<>(); // para reconstruir o caminho no final
        PriorityQueue<ItemFila> fila = new PriorityQueue<>((a, b) -> Integer.compare(a.distancia(), b.distancia()));
        distancia.put(origem, 0);
        fila.add(new ItemFila(origem, 0));

        while (!fila.isEmpty()) {
            ItemFila atual = fila.poll();
            if (atual.distancia() > distancia.getOrDefault(atual.local(), Integer.MAX_VALUE)) {
                continue; // item antigo da fila, já achamos um caminho melhor
            }
            if (atual.local().equals(destino)) {
                break;
            }
            for (Aresta a : grafo.getOrDefault(atual.local(), List.of())) {
                int nova = atual.distancia() + a.peso();
                if (nova < distancia.getOrDefault(a.para(), Integer.MAX_VALUE)) {
                    distancia.put(a.para(), nova);
                    chegouPor.put(a.para(), a);
                    fila.add(new ItemFila(a.para(), nova));
                }
            }
        }

        if (!distancia.containsKey(destino)) {
            return null; // sem caminho
        }

        // 3) Reconstrói o caminho do destino até a origem e inverte
        List<Long> locais = new ArrayList<>();
        List<Trecho> percorridos = new ArrayList<>();
        Long no = destino;
        locais.add(no);
        while (!no.equals(origem)) {
            Aresta a = chegouPor.get(no);
            percorridos.add(a.trecho());
            no = a.de();
            locais.add(no);
        }
        Collections.reverse(locais);
        Collections.reverse(percorridos);
        return new Caminho(locais, percorridos);
    }

    /** Peso de um trecho conforme o critério. */
    int calcularPeso(Trecho t, String criterio, boolean temOcorrenciaGrave) {
        int peso;
        switch (criterio) {
            case "RAPIDA" -> peso = t.getTempoMin();
            case "SEGURA" -> peso = t.getTempoMin() + 2 * t.getRisco();
            default -> peso = t.getTempoMin() + t.getRisco(); // ACESSIVEL
        }
        if (temOcorrenciaGrave && !"RAPIDA".equals(criterio)) {
            peso += 5; // a comunidade influencia a rota
        }
        return peso;
    }
}
