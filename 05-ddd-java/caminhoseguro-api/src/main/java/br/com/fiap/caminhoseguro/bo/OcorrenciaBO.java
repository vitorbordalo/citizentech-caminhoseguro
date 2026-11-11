package br.com.fiap.caminhoseguro.bo;

import br.com.fiap.caminhoseguro.dao.OcorrenciaDAO;
import br.com.fiap.caminhoseguro.dao.TipoOcorrenciaDAO;
import br.com.fiap.caminhoseguro.dao.TrechoDAO;
import br.com.fiap.caminhoseguro.dao.UsuarioDAO;
import br.com.fiap.caminhoseguro.exception.RecursoNaoEncontradoException;
import br.com.fiap.caminhoseguro.exception.RegraNegocioException;
import br.com.fiap.caminhoseguro.exception.RequisicaoInvalidaException;
import br.com.fiap.caminhoseguro.model.Ocorrencia;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

/** Regras de negócio de Ocorrência (problema de calçada registrado pela comunidade). */
@Service
public class OcorrenciaBO {

    private static final Set<String> STATUS_VALIDOS = Set.of("ABERTA", "EM_ANALISE", "RESOLVIDA");

    private final OcorrenciaDAO ocorrenciaDAO;
    private final TrechoDAO trechoDAO;
    private final UsuarioDAO usuarioDAO;
    private final TipoOcorrenciaDAO tipoOcorrenciaDAO;

    public OcorrenciaBO(OcorrenciaDAO ocorrenciaDAO, TrechoDAO trechoDAO, UsuarioDAO usuarioDAO,
                        TipoOcorrenciaDAO tipoOcorrenciaDAO) {
        this.ocorrenciaDAO = ocorrenciaDAO;
        this.trechoDAO = trechoDAO;
        this.usuarioDAO = usuarioDAO;
        this.tipoOcorrenciaDAO = tipoOcorrenciaDAO;
    }

    /** Lista tudo ou só as ocorrências com o status informado. */
    public List<Ocorrencia> listar(String status) {
        if (status == null || status.isBlank()) {
            return ocorrenciaDAO.listar(null);
        }
        String s = status.trim().toUpperCase();
        if (!STATUS_VALIDOS.contains(s)) {
            throw new RequisicaoInvalidaException("Status inválido: " + status + " (use ABERTA, EM_ANALISE ou RESOLVIDA)");
        }
        return ocorrenciaDAO.listar(s);
    }

    public Ocorrencia buscar(Long id) {
        Ocorrencia o = ocorrenciaDAO.buscarPorId(id);
        if (o == null) {
            throw new RecursoNaoEncontradoException("Ocorrência " + id + " não encontrada");
        }
        return o;
    }

    public Ocorrencia criar(Ocorrencia o) {
        o.setId(null);
        validar(o);
        return ocorrenciaDAO.inserir(o);
    }

    public Ocorrencia atualizar(Long id, Ocorrencia o) {
        Ocorrencia atual = buscar(id); // 404 se não existir
        o.setId(id);
        if (o.getDataRegistro() == null) {
            o.setDataRegistro(atual.getDataRegistro()); // no PUT, se não vier, mantém a data original
        }
        validar(o);
        ocorrenciaDAO.atualizar(o);
        return o;
    }

    public void excluir(Long id) {
        buscar(id);
        ocorrenciaDAO.excluir(id);
    }

    /** Chaves estrangeiras (404), padrões de status/data e regras das datas (422). */
    private void validar(Ocorrencia o) {
        if (!trechoDAO.existe(o.getIdTrecho())) {
            throw new RecursoNaoEncontradoException("Trecho " + o.getIdTrecho() + " não encontrado");
        }
        if (!usuarioDAO.existe(o.getIdUsuario())) {
            throw new RecursoNaoEncontradoException("Usuário " + o.getIdUsuario() + " não encontrado");
        }
        if (!tipoOcorrenciaDAO.existe(o.getIdTipoOcorrencia())) {
            throw new RecursoNaoEncontradoException("Tipo de ocorrência " + o.getIdTipoOcorrencia() + " não encontrado");
        }
        // Padrões: status ABERTA e data de registro de hoje
        if (o.getStatus() == null || o.getStatus().isBlank()) {
            o.setStatus("ABERTA");
        }
        if (o.getDataRegistro() == null) {
            o.setDataRegistro(LocalDate.now());
        }
        // Status RESOLVIDA exige data de resolução: se não vier, usa hoje
        if ("RESOLVIDA".equals(o.getStatus()) && o.getDataResolucao() == null) {
            o.setDataResolucao(LocalDate.now());
        }
        // A resolução não pode ser anterior ao registro
        if (o.getDataResolucao() != null && o.getDataResolucao().isBefore(o.getDataRegistro())) {
            throw new RegraNegocioException("A data de resolução (" + o.getDataResolucao()
                    + ") não pode ser anterior à data de registro (" + o.getDataRegistro() + ")");
        }
    }
}
