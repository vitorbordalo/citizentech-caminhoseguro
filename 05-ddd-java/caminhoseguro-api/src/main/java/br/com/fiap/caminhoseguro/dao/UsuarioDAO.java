package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.model.Usuario;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

/** Acesso à tabela T_CS_USUARIO com JDBC puro (PreparedStatement). */
@Repository
public class UsuarioDAO extends BaseDAO {

    private static final String COLUNAS = "id_usuario, nm_usuario, ds_email, tp_perfil, dt_cadastro";

    public UsuarioDAO(DataSource dataSource) {
        super(dataSource);
    }

    public List<Usuario> listar() {
        String sql = "SELECT " + COLUNAS + " FROM T_CS_USUARIO ORDER BY id_usuario";
        List<Usuario> lista = new ArrayList<>();
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(converter(rs));
            }
            return lista;
        } catch (SQLException e) {
            throw erro("listar usuários", e);
        }
    }

    public Usuario buscarPorId(Long id) {
        return buscarUm("SELECT " + COLUNAS + " FROM T_CS_USUARIO WHERE id_usuario = ?", id);
    }

    public Usuario buscarPorEmail(String email) {
        return buscarUm("SELECT " + COLUNAS + " FROM T_CS_USUARIO WHERE LOWER(ds_email) = LOWER(?)", email);
    }

    /** Insere e devolve o usuário com o id gerado pelo banco (IDENTITY). */
    public Usuario inserir(Usuario u) {
        String sql = "INSERT INTO T_CS_USUARIO (nm_usuario, ds_email, tp_perfil, dt_cadastro) VALUES (?, ?, ?, ?)";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql, new String[]{"ID_USUARIO"})) {
            ps.setString(1, u.getNome());
            ps.setString(2, u.getEmail());
            ps.setString(3, u.getPerfil());
            gravarData(ps, 4, u.getDataCadastro());
            ps.executeUpdate();
            try (ResultSet chaves = ps.getGeneratedKeys()) {
                if (chaves.next()) {
                    u.setId(chaves.getLong(1));
                }
            }
            return u;
        } catch (SQLException e) {
            throw erro("inserir usuário", e);
        }
    }

    public void atualizar(Usuario u) {
        String sql = "UPDATE T_CS_USUARIO SET nm_usuario = ?, ds_email = ?, tp_perfil = ? WHERE id_usuario = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, u.getNome());
            ps.setString(2, u.getEmail());
            ps.setString(3, u.getPerfil());
            ps.setLong(4, u.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw erro("atualizar usuário", e);
        }
    }

    public void excluir(Long id) {
        String sql = "DELETE FROM T_CS_USUARIO WHERE id_usuario = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw erro("excluir usuário", e);
        }
    }

    public boolean existe(Long id) {
        return existe("SELECT COUNT(*) FROM T_CS_USUARIO WHERE id_usuario = ?", id);
    }

    private Usuario buscarUm(String sql, Object parametro) {
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setObject(1, parametro);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? converter(rs) : null;
            }
        } catch (SQLException e) {
            throw erro("buscar usuário", e);
        }
    }

    /** Converte uma linha do ResultSet em objeto do model. */
    private Usuario converter(ResultSet rs) throws SQLException {
        Usuario u = new Usuario();
        u.setId(rs.getLong("id_usuario"));
        u.setNome(rs.getString("nm_usuario"));
        u.setEmail(rs.getString("ds_email"));
        u.setPerfil(rs.getString("tp_perfil"));
        u.setDataCadastro(lerData(rs, "dt_cadastro"));
        return u;
    }
}
