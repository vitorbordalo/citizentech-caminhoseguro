package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.model.Local;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

/** Acesso à tabela T_CS_LOCAL com JDBC puro (PreparedStatement). */
@Repository
public class LocalDAO extends BaseDAO {

    private static final String COLUNAS = "id_local, id_bairro, id_tipo_local, nm_local, ds_endereco, "
            + "nr_latitude, nr_longitude, st_ponto_apoio";

    public LocalDAO(DataSource dataSource) {
        super(dataSource);
    }

    /** Lista todos os locais; se pontoApoio não for nulo, filtra por S/N. */
    public List<Local> listar(Boolean pontoApoio) {
        String sql = "SELECT " + COLUNAS + " FROM T_CS_LOCAL"
                + (pontoApoio != null ? " WHERE st_ponto_apoio = ?" : "") + " ORDER BY id_local";
        List<Local> lista = new ArrayList<>();
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            if (pontoApoio != null) {
                ps.setString(1, simNao(pontoApoio));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(converter(rs));
                }
            }
            return lista;
        } catch (SQLException e) {
            throw erro("listar locais", e);
        }
    }

    public Local buscarPorId(Long id) {
        String sql = "SELECT " + COLUNAS + " FROM T_CS_LOCAL WHERE id_local = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? converter(rs) : null;
            }
        } catch (SQLException e) {
            throw erro("buscar local", e);
        }
    }

    /** Usado para a regra "nome único dentro do bairro". */
    public Local buscarPorNome(Long idBairro, String nome) {
        String sql = "SELECT " + COLUNAS + " FROM T_CS_LOCAL WHERE id_bairro = ? AND LOWER(nm_local) = LOWER(?)";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, idBairro);
            ps.setString(2, nome);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? converter(rs) : null;
            }
        } catch (SQLException e) {
            throw erro("buscar local por nome", e);
        }
    }

    public Local inserir(Local l) {
        String sql = "INSERT INTO T_CS_LOCAL (id_bairro, id_tipo_local, nm_local, ds_endereco, "
                + "nr_latitude, nr_longitude, st_ponto_apoio) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql, new String[]{"ID_LOCAL"})) {
            preencher(ps, l);
            ps.executeUpdate();
            try (ResultSet chaves = ps.getGeneratedKeys()) {
                if (chaves.next()) {
                    l.setId(chaves.getLong(1));
                }
            }
            return l;
        } catch (SQLException e) {
            throw erro("inserir local", e);
        }
    }

    public void atualizar(Local l) {
        String sql = "UPDATE T_CS_LOCAL SET id_bairro = ?, id_tipo_local = ?, nm_local = ?, ds_endereco = ?, "
                + "nr_latitude = ?, nr_longitude = ?, st_ponto_apoio = ? WHERE id_local = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            preencher(ps, l);
            ps.setLong(8, l.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw erro("atualizar local", e);
        }
    }

    public void excluir(Long id) {
        String sql = "DELETE FROM T_CS_LOCAL WHERE id_local = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw erro("excluir local", e);
        }
    }

    public boolean existe(Long id) {
        return existe("SELECT COUNT(*) FROM T_CS_LOCAL WHERE id_local = ?", id);
    }

    /** O local aparece como origem ou destino de algum trecho? (impede a exclusão) */
    public boolean temTrechos(Long id) {
        return existe("SELECT COUNT(*) FROM T_CS_TRECHO WHERE id_local_origem = ? OR id_local_destino = ?", id, id);
    }

    /** O local aparece em alguma consulta de rota do histórico? (impede a exclusão) */
    public boolean temConsultas(Long id) {
        return existe("SELECT COUNT(*) FROM T_CS_ROTA_CONSULTA WHERE id_local_origem = ? OR id_local_destino = ?", id, id);
    }

    /** Preenche os 7 primeiros parâmetros (iguais no INSERT e no UPDATE). */
    private void preencher(PreparedStatement ps, Local l) throws SQLException {
        ps.setLong(1, l.getIdBairro());
        ps.setLong(2, l.getIdTipoLocal());
        ps.setString(3, l.getNome());
        ps.setString(4, l.getEndereco());
        gravarDouble(ps, 5, l.getLatitude());
        gravarDouble(ps, 6, l.getLongitude());
        ps.setString(7, simNao(l.getPontoApoio()));
    }

    private Local converter(ResultSet rs) throws SQLException {
        Local l = new Local();
        l.setId(rs.getLong("id_local"));
        l.setIdBairro(rs.getLong("id_bairro"));
        l.setIdTipoLocal(rs.getLong("id_tipo_local"));
        l.setNome(rs.getString("nm_local"));
        l.setEndereco(rs.getString("ds_endereco"));
        l.setLatitude(lerDouble(rs, "nr_latitude"));
        l.setLongitude(lerDouble(rs, "nr_longitude"));
        l.setPontoApoio(simNao(rs.getString("st_ponto_apoio")));
        return l;
    }
}
