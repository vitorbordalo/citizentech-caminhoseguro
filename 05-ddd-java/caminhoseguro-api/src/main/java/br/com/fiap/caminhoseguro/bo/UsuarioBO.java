package br.com.fiap.caminhoseguro.bo;

import br.com.fiap.caminhoseguro.dao.OcorrenciaDAO;
import br.com.fiap.caminhoseguro.dao.RotaConsultaDAO;
import br.com.fiap.caminhoseguro.dao.UsuarioDAO;
import br.com.fiap.caminhoseguro.exception.ConflitoException;
import br.com.fiap.caminhoseguro.exception.RecursoNaoEncontradoException;
import br.com.fiap.caminhoseguro.model.Usuario;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Regras de negócio de Usuário. Os campos obrigatórios e o formato (e-mail, perfil)
 * já são validados pelo Bean Validation no controller; aqui ficam as regras que dependem do banco.
 */
@Service
public class UsuarioBO {

    private final UsuarioDAO usuarioDAO;
    private final OcorrenciaDAO ocorrenciaDAO;
    private final RotaConsultaDAO rotaConsultaDAO;

    public UsuarioBO(UsuarioDAO usuarioDAO, OcorrenciaDAO ocorrenciaDAO, RotaConsultaDAO rotaConsultaDAO) {
        this.usuarioDAO = usuarioDAO;
        this.ocorrenciaDAO = ocorrenciaDAO;
        this.rotaConsultaDAO = rotaConsultaDAO;
    }

    public List<Usuario> listar() {
        return usuarioDAO.listar();
    }

    public Usuario buscar(Long id) {
        Usuario u = usuarioDAO.buscarPorId(id);
        if (u == null) {
            throw new RecursoNaoEncontradoException("Usuário " + id + " não encontrado");
        }
        return u;
    }

    public Usuario criar(Usuario u) {
        u.setId(null);
        u.setNome(u.getNome().trim());
        u.setEmail(u.getEmail().trim());
        validarEmailUnico(u.getEmail(), null);
        u.setDataCadastro(LocalDate.now()); // a data de cadastro é sempre a de hoje
        return usuarioDAO.inserir(u);
    }

    public Usuario atualizar(Long id, Usuario novo) {
        Usuario atual = buscar(id); // 404 se não existir
        novo.setId(id);
        novo.setNome(novo.getNome().trim());
        novo.setEmail(novo.getEmail().trim());
        validarEmailUnico(novo.getEmail(), id);
        usuarioDAO.atualizar(novo);
        novo.setDataCadastro(atual.getDataCadastro());
        return novo;
    }

    public void excluir(Long id) {
        buscar(id);
        if (ocorrenciaDAO.existePorUsuario(id)) {
            throw new ConflitoException("Usuário " + id + " não pode ser excluído: tem ocorrências registradas");
        }
        if (rotaConsultaDAO.existePorUsuario(id)) {
            throw new ConflitoException("Usuário " + id + " não pode ser excluído: tem consultas de rota no histórico");
        }
        usuarioDAO.excluir(id);
    }

    /** Regra: e-mail único. idAtual é o usuário que está sendo editado (ou null no cadastro). */
    private void validarEmailUnico(String email, Long idAtual) {
        Usuario existente = usuarioDAO.buscarPorEmail(email);
        if (existente != null && !existente.getId().equals(idAtual)) {
            throw new ConflitoException("Já existe um usuário com o e-mail " + email);
        }
    }
}
