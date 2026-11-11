package br.com.fiap.caminhoseguro.bo;

import br.com.fiap.caminhoseguro.dao.BairroDAO;
import br.com.fiap.caminhoseguro.dao.LocalDAO;
import br.com.fiap.caminhoseguro.dao.TipoLocalDAO;
import br.com.fiap.caminhoseguro.exception.ConflitoException;
import br.com.fiap.caminhoseguro.exception.RecursoNaoEncontradoException;
import br.com.fiap.caminhoseguro.model.Local;
import java.util.List;
import org.springframework.stereotype.Service;

/** Regras de negócio de Local (ponto do mapa). */
@Service
public class LocalBO {

    private final LocalDAO localDAO;
    private final BairroDAO bairroDAO;
    private final TipoLocalDAO tipoLocalDAO;

    public LocalBO(LocalDAO localDAO, BairroDAO bairroDAO, TipoLocalDAO tipoLocalDAO) {
        this.localDAO = localDAO;
        this.bairroDAO = bairroDAO;
        this.tipoLocalDAO = tipoLocalDAO;
    }

    public List<Local> listar(Boolean pontoApoio) {
        return localDAO.listar(pontoApoio);
    }

    public Local buscar(Long id) {
        Local l = localDAO.buscarPorId(id);
        if (l == null) {
            throw new RecursoNaoEncontradoException("Local " + id + " não encontrado");
        }
        return l;
    }

    public Local criar(Local l) {
        l.setId(null);
        validar(l, null);
        return localDAO.inserir(l);
    }

    public Local atualizar(Long id, Local l) {
        buscar(id); // 404 se não existir
        l.setId(id);
        validar(l, id);
        localDAO.atualizar(l);
        return l;
    }

    public void excluir(Long id) {
        buscar(id);
        if (localDAO.temTrechos(id)) {
            throw new ConflitoException("Local " + id + " não pode ser excluído: possui trechos ligados a ele");
        }
        if (localDAO.temConsultas(id)) {
            throw new ConflitoException("Local " + id + " não pode ser excluído: aparece no histórico de rotas");
        }
        localDAO.excluir(id);
    }

    /** Valida chaves estrangeiras (404), nome único no bairro (409) e aplica o padrão do ponto de apoio. */
    private void validar(Local l, Long idAtual) {
        if (bairroDAO.buscarPorId(l.getIdBairro()) == null) {
            throw new RecursoNaoEncontradoException("Bairro " + l.getIdBairro() + " não encontrado");
        }
        if (tipoLocalDAO.buscarPorId(l.getIdTipoLocal()) == null) {
            throw new RecursoNaoEncontradoException("Tipo de local " + l.getIdTipoLocal() + " não encontrado");
        }
        l.setNome(l.getNome().trim());
        Local mesmoNome = localDAO.buscarPorNome(l.getIdBairro(), l.getNome());
        if (mesmoNome != null && !mesmoNome.getId().equals(idAtual)) {
            throw new ConflitoException("Já existe um local chamado '" + l.getNome() + "' neste bairro");
        }
        if (l.getPontoApoio() == null) {
            l.setPontoApoio(false); // padrão do banco: 'N'
        }
    }
}
