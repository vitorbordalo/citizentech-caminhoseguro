package br.com.fiap.caminhoseguro.bo;

import br.com.fiap.caminhoseguro.dao.LocalDAO;
import br.com.fiap.caminhoseguro.dao.OcorrenciaDAO;
import br.com.fiap.caminhoseguro.dao.RotaConsultaDAO;
import br.com.fiap.caminhoseguro.dao.TrechoDAO;
import br.com.fiap.caminhoseguro.dao.UsuarioDAO;
import br.com.fiap.caminhoseguro.dto.RotaResposta;
import br.com.fiap.caminhoseguro.exception.RecursoNaoEncontradoException;
import br.com.fiap.caminhoseguro.exception.RegraNegocioException;
import br.com.fiap.caminhoseguro.exception.RequisicaoInvalidaException;
import br.com.fiap.caminhoseguro.model.Local;
import br.com.fiap.caminhoseguro.model.RotaConsulta;
import br.com.fiap.caminhoseguro.model.Trecho;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Caso de uso "pedir uma rota": valida os parâmetros, busca os dados nos DAOs,
 * chama a CalculadoraRotaBO (Dijkstra) e, se vier usuário, grava o histórico.
 */
@Service
public class RotaBO {

    private static final Set<String> CRITERIOS = Set.of("RAPIDA", "SEGURA", "ACESSIVEL");

    private final LocalDAO localDAO;
    private final TrechoDAO trechoDAO;
    private final UsuarioDAO usuarioDAO;
    private final OcorrenciaDAO ocorrenciaDAO;
    private final RotaConsultaDAO rotaConsultaDAO;
    private final CalculadoraRotaBO calculadora;

    public RotaBO(LocalDAO localDAO, TrechoDAO trechoDAO, UsuarioDAO usuarioDAO, OcorrenciaDAO ocorrenciaDAO,
                  RotaConsultaDAO rotaConsultaDAO, CalculadoraRotaBO calculadora) {
        this.localDAO = localDAO;
        this.trechoDAO = trechoDAO;
        this.usuarioDAO = usuarioDAO;
        this.ocorrenciaDAO = ocorrenciaDAO;
        this.rotaConsultaDAO = rotaConsultaDAO;
        this.calculadora = calculadora;
    }

    public RotaResposta calcular(Long idOrigem, Long idDestino, String criterioInformado, Long idUsuario) {
        // Critério válido (400)
        String criterio = criterioInformado == null ? "" : criterioInformado.trim().toUpperCase();
        if (!CRITERIOS.contains(criterio)) {
            throw new RequisicaoInvalidaException("Critério inválido: " + criterioInformado
                    + " (use RAPIDA, SEGURA ou ACESSIVEL)");
        }
        // Origem diferente do destino (422)
        if (idOrigem.equals(idDestino)) {
            throw new RegraNegocioException("A origem deve ser diferente do destino");
        }
        // Locais e usuário existem (404)
        Local origem = localDAO.buscarPorId(idOrigem);
        if (origem == null) {
            throw new RecursoNaoEncontradoException("Local de origem " + idOrigem + " não encontrado");
        }
        Local destino = localDAO.buscarPorId(idDestino);
        if (destino == null) {
            throw new RecursoNaoEncontradoException("Local de destino " + idDestino + " não encontrado");
        }
        if (idUsuario != null && !usuarioDAO.existe(idUsuario)) {
            throw new RecursoNaoEncontradoException("Usuário " + idUsuario + " não encontrado");
        }

        // Dijkstra
        List<Trecho> trechos = trechoDAO.listar();
        Set<Long> graves = ocorrenciaDAO.trechosComOcorrenciaGrave();
        CalculadoraRotaBO.Caminho caminho = calculadora.calcular(trechos, graves, criterio, idOrigem, idDestino);
        if (caminho == null) {
            String tipo = "ACESSIVEL".equals(criterio) ? "rota acessível" : "rota";
            throw new RecursoNaoEncontradoException("Não há " + tipo + " entre " + origem.getNome()
                    + " e " + destino.getNome());
        }

        // Monta a resposta
        RotaResposta resposta = new RotaResposta();
        resposta.setCriterio(criterio);
        int tempo = 0;
        int risco = 0;
        boolean acessivel = true;
        List<Long> idsTrechos = new ArrayList<>();
        for (Trecho t : caminho.trechos()) {
            tempo += t.getTempoMin();
            risco += t.getRisco();
            acessivel = acessivel && Boolean.TRUE.equals(t.getAcessivel());
            idsTrechos.add(t.getId());
        }
        resposta.setTempoTotalMin(tempo);
        resposta.setRiscoTotal(risco);
        resposta.setTotalmenteAcessivel(acessivel);
        resposta.setTrechos(idsTrechos);

        List<RotaResposta.LocalResumo> locais = new ArrayList<>();
        for (Long idLocal : caminho.locais()) {
            Local l = localDAO.buscarPorId(idLocal);
            locais.add(new RotaResposta.LocalResumo(l.getId(), l.getNome(), Boolean.TRUE.equals(l.getPontoApoio())));
        }
        resposta.setLocais(locais);

        // Histórico (indicador de impacto): só grava se vier o usuário
        if (idUsuario != null) {
            RotaConsulta consulta = new RotaConsulta();
            consulta.setIdUsuario(idUsuario);
            consulta.setIdLocalOrigem(idOrigem);
            consulta.setIdLocalDestino(idDestino);
            consulta.setCriterio(criterio);
            consulta.setTempoTotal(tempo);
            consulta.setDataConsulta(LocalDate.now());
            rotaConsultaDAO.inserir(consulta);
        }
        return resposta;
    }
}
