package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.model.Trecho;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

/** Acesso à tabela T_CS_TRECHO com JDBC puro (PreparedStatement). */
@Repository
public class TrechoDAO extends BaseDAO {

    private static final String COLUNAS = "id_trecho, id_local_origem, id_local_destino, nr_tempo_min, "
            + "nr_risco, st_acessivel, nr_declividade_pct, nr_largura_calcada_m";

    public TrechoDAO(DataSource dataSource) {
        super(dataSource);
    }

    public List<Trecho> listar() {
        String sql = "SELECT " + COLUNAS + " FROM T_CS_TRECHO ORDER BY id_trecho";
        List<Trecho> lista = new ArrayList<>();
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(converter(rs));
            }
            return lista;
        } catch (SQLException e) {
            throw erro("listar trechos", e);
        }
    }

    public Trecho buscarPorId(Long id) {
        return buscarUm("SELECT " + COLUNAS + " FROM T_CS_TRECHO WHERE id_trecho = ?", id, null);
    }

    /** Procura um trecho exatamente com essa origem e destino (regra: par único). */
    public Trecho buscarPorPar(Long origem, Long destino) {
        return buscarUm("SELECT " + COLUNAS + " FROM T_CS_TRECHO WHERE id_local_origem = ? AND id_local_destino = ?",
                origem, destino);
    }

    public Trecho inserir(Trecho t) {
        String sql = "INSERT INTO T_CS_TRECHO (id_local_origem, id_local_destino, nr_tempo_min, nr_risco, "
                + "st_acessivel, nr_declividade_pct, nr_largura_calcada_m) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql, new String[]{"ID_TRECHO"})) {
            preencher(ps, t);
            ps.executeUpdate();
            try (ResultSet chaves = ps.getGeneratedKeys()) {
                if (chaves.next()) {
                    t.setId(chaves.getLong(1));
                }
            }
            return t;
        } catch (SQLException e) {
            throw erro("inserir trecho", e);
        }
    }

    public void atualizar(Trecho t) {
        String sql = "UPDATE T_CS_TRECHO SET id_local_origem = ?, id_local_destino = ?, nr_tempo_min = ?, nr_risco = ?, "
                + "st_acessivel = ?, nr_declividade_pct = ?, nr_largura_calcada_m = ? WHERE id_trecho = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            preencher(ps, t);
            ps.setLong(8, t.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw erro("atualizar trecho", e);
        }
    }

    public void excluir(Long id) {
        String sql = "DELETE FROM T_CS_TRECHO WHERE id_trecho = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw erro("excluir trecho", e);
        }
    }

    public boolean existe(Long id) {
        return existe("SELECT COUNT(*) FROM T_CS_TRECHO WHERE id_trecho = ?", id);
    }

    /** O trecho tem ocorrências registradas? (impede a exclusão) */
    public boolean temOcorrencias(Long id) {
        return existe("SELECT COUNT(*) FROM T_CS_OCORRENCIA WHERE id_trecho = ?", id);
    }

    private Trecho buscarUm(String sql, Long p1, Long p2) {
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, p1);
            if (p2 != null) {
                ps.setLong(2, p2);
            }
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? converter(rs) : null;
            }
        } catch (SQLException e) {
            throw erro("buscar trecho", e);
        }
    }

    private void preencher(PreparedStatement ps, Trecho t) throws SQLException {
        ps.setLong(1, t.getIdLocalOrigem());
        ps.setLong(2, t.getIdLocalDestino());
        ps.setInt(3, t.getTempoMin());
        ps.setInt(4, t.getRisco());
        ps.setString(5, simNao(t.getAcessivel()));
        gravarDouble(ps, 6, t.getDeclividadePct());
        gravarDouble(ps, 7, t.getLarguraCalcadaM());
    }

    private Trecho converter(ResultSet rs) throws SQLException {
        Trecho t = new Trecho();
        t.setId(rs.getLong("id_trecho"));
        t.setIdLocalOrigem(rs.getLong("id_local_origem"));
        t.setIdLocalDestino(rs.getLong("id_local_destino"));
        t.setTempoMin(rs.getInt("nr_tempo_min"));
        t.setRisco(rs.getInt("nr_risco"));
        t.setAcessivel(simNao(rs.getString("st_acessivel")));
        t.setDeclividadePct(lerDouble(rs, "nr_declividade_pct"));
        t.setLarguraCalcadaM(lerDouble(rs, "nr_largura_calcada_m"));
        return t;
    }
}
