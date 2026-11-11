package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.model.Ocorrencia;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

/** Acesso à tabela T_CS_OCORRENCIA com JDBC puro (PreparedStatement). */
@Repository
public class OcorrenciaDAO extends BaseDAO {

    private static final String COLUNAS = "id_ocorrencia, id_trecho, id_usuario, id_tipo_ocorrencia, "
            + "ds_ocorrencia, nr_gravidade, st_ocorrencia, dt_registro, dt_resolucao";

    public OcorrenciaDAO(DataSource dataSource) {
        super(dataSource);
    }

    /** Lista todas as ocorrências; se status não for nulo, filtra por ele. */
    public List<Ocorrencia> listar(String status) {
        String sql = "SELECT " + COLUNAS + " FROM T_CS_OCORRENCIA"
                + (status != null ? " WHERE st_ocorrencia = ?" : "") + " ORDER BY id_ocorrencia";
        List<Ocorrencia> lista = new ArrayList<>();
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            if (status != null) {
                ps.setString(1, status);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(converter(rs));
                }
            }
            return lista;
        } catch (SQLException e) {
            throw erro("listar ocorrências", e);
        }
    }

    public Ocorrencia buscarPorId(Long id) {
        String sql = "SELECT " + COLUNAS + " FROM T_CS_OCORRENCIA WHERE id_ocorrencia = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? converter(rs) : null;
            }
        } catch (SQLException e) {
            throw erro("buscar ocorrência", e);
        }
    }

    public Ocorrencia inserir(Ocorrencia o) {
        String sql = "INSERT INTO T_CS_OCORRENCIA (id_trecho, id_usuario, id_tipo_ocorrencia, ds_ocorrencia, "
                + "nr_gravidade, st_ocorrencia, dt_registro, dt_resolucao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql, new String[]{"ID_OCORRENCIA"})) {
            preencher(ps, o);
            ps.executeUpdate();
            try (ResultSet chaves = ps.getGeneratedKeys()) {
                if (chaves.next()) {
                    o.setId(chaves.getLong(1));
                }
            }
            return o;
        } catch (SQLException e) {
            throw erro("inserir ocorrência", e);
        }
    }

    public void atualizar(Ocorrencia o) {
        String sql = "UPDATE T_CS_OCORRENCIA SET id_trecho = ?, id_usuario = ?, id_tipo_ocorrencia = ?, "
                + "ds_ocorrencia = ?, nr_gravidade = ?, st_ocorrencia = ?, dt_registro = ?, dt_resolucao = ? "
                + "WHERE id_ocorrencia = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            preencher(ps, o);
            ps.setLong(9, o.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw erro("atualizar ocorrência", e);
        }
    }

    public void excluir(Long id) {
        String sql = "DELETE FROM T_CS_OCORRENCIA WHERE id_ocorrencia = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw erro("excluir ocorrência", e);
        }
    }

    /** O usuário registrou alguma ocorrência? (impede a exclusão do usuário) */
    public boolean existePorUsuario(Long idUsuario) {
        return existe("SELECT COUNT(*) FROM T_CS_OCORRENCIA WHERE id_usuario = ?", idUsuario);
    }

    /**
     * Ids dos trechos que têm ocorrência ABERTA com gravidade 4 ou 5.
     * A rota (critérios SEGURA e ACESSIVEL) soma +5 no peso desses trechos.
     */
    public Set<Long> trechosComOcorrenciaGrave() {
        String sql = "SELECT DISTINCT id_trecho FROM T_CS_OCORRENCIA WHERE st_ocorrencia = 'ABERTA' AND nr_gravidade >= 4";
        Set<Long> ids = new HashSet<>();
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                ids.add(rs.getLong(1));
            }
            return ids;
        } catch (SQLException e) {
            throw erro("buscar ocorrências graves", e);
        }
    }

    private void preencher(PreparedStatement ps, Ocorrencia o) throws SQLException {
        ps.setLong(1, o.getIdTrecho());
        ps.setLong(2, o.getIdUsuario());
        ps.setLong(3, o.getIdTipoOcorrencia());
        ps.setString(4, o.getDescricao());
        ps.setInt(5, o.getGravidade());
        ps.setString(6, o.getStatus());
        gravarData(ps, 7, o.getDataRegistro());
        gravarData(ps, 8, o.getDataResolucao());
    }

    private Ocorrencia converter(ResultSet rs) throws SQLException {
        Ocorrencia o = new Ocorrencia();
        o.setId(rs.getLong("id_ocorrencia"));
        o.setIdTrecho(rs.getLong("id_trecho"));
        o.setIdUsuario(rs.getLong("id_usuario"));
        o.setIdTipoOcorrencia(rs.getLong("id_tipo_ocorrencia"));
        o.setDescricao(rs.getString("ds_ocorrencia"));
        o.setGravidade(rs.getInt("nr_gravidade"));
        o.setStatus(rs.getString("st_ocorrencia"));
        o.setDataRegistro(lerData(rs, "dt_registro"));
        o.setDataResolucao(lerData(rs, "dt_resolucao"));
        return o;
    }
}
