package br.com.fiap.caminhoseguro.bo;

import br.com.fiap.caminhoseguro.dao.LocalDAO;
import br.com.fiap.caminhoseguro.dao.TrechoDAO;
import br.com.fiap.caminhoseguro.exception.ConflitoException;
import br.com.fiap.caminhoseguro.exception.RecursoNaoEncontradoException;
import br.com.fiap.caminhoseguro.exception.RegraNegocioException;
import br.com.fiap.caminhoseguro.model.Trecho;
import java.util.List;
import org.springframework.stereotype.Service;

/** Regras de negócio de Trecho (ligação entre dois locais). */
@Service
public class TrechoBO {

    private final TrechoDAO trechoDAO;
    private final LocalDAO localDAO;

    public TrechoBO(TrechoDAO trechoDAO, LocalDAO localDAO) {
        this.trechoDAO = trechoDAO;
        this.localDAO = localDAO;
    }

    public List<Trecho> listar() {
        return trechoDAO.listar();
    }

    public Trecho buscar(Long id) {
        Trecho t = trechoDAO.buscarPorId(id);
        if (t == null) {
            throw new RecursoNaoEncontradoException("Trecho " + id + " não encontrado");
        }
        return t;
    }

    public Trecho criar(Trecho t) {
        t.setId(null);
        validar(t, null);
        return trechoDAO.inserir(t);
    }

    public Trecho atualizar(Long id, Trecho t) {
        buscar(id); // 404 se não existir
        t.setId(id);
        validar(t, id);
        trechoDAO.atualizar(t);
        return t;
    }

    public void excluir(Long id) {
        buscar(id);
        if (trechoDAO.temOcorrencias(id)) {
            throw new ConflitoException("Trecho " + id + " não pode ser excluído: possui ocorrências registradas");
        }
        trechoDAO.excluir(id);
    }

    /** Origem diferente do destino (422), locais existem (404), par único (409) e padrão de acessível. */
    private void validar(Trecho t, Long idAtual) {
        if (t.getIdLocalOrigem().equals(t.getIdLocalDestino())) {
            throw new RegraNegocioException("O local de origem deve ser diferente do local de destino");
        }
        if (!localDAO.existe(t.getIdLocalOrigem())) {
            throw new RecursoNaoEncontradoException("Local de origem " + t.getIdLocalOrigem() + " não encontrado");
        }
        if (!localDAO.existe(t.getIdLocalDestino())) {
            throw new RecursoNaoEncontradoException("Local de destino " + t.getIdLocalDestino() + " não encontrado");
        }
        Trecho mesmoPar = trechoDAO.buscarPorPar(t.getIdLocalOrigem(), t.getIdLocalDestino());
        if (mesmoPar != null && !mesmoPar.getId().equals(idAtual)) {
            throw new ConflitoException("Já existe um trecho de " + t.getIdLocalOrigem()
                    + " para " + t.getIdLocalDestino() + " (trecho " + mesmoPar.getId() + ")");
        }
        // Trechos são bidirecionais: o sentido inverso também conta como duplicado
        Trecho inverso = trechoDAO.buscarPorPar(t.getIdLocalDestino(), t.getIdLocalOrigem());
        if (inverso != null && !inverso.getId().equals(idAtual)) {
            throw new ConflitoException("Já existe o trecho " + inverso.getId()
                    + " no sentido inverso (os trechos valem nos dois sentidos)");
        }
        if (t.getAcessivel() == null) {
            t.setAcessivel(true); // padrão do banco: 'S'
        }
    }
}
