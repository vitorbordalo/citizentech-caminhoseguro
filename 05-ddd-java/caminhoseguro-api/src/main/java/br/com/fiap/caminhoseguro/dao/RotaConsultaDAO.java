package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.model.RotaConsulta;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

/** Acesso à tabela T_CS_ROTA_CONSULTA (histórico das rotas pedidas). */
@Repository
public class RotaConsultaDAO extends BaseDAO {

    public RotaConsultaDAO(DataSource dataSource) {
        super(dataSource);
    }

    public RotaConsulta inserir(RotaConsulta c) {
        String sql = "INSERT INTO T_CS_ROTA_CONSULTA (id_usuario, id_local_origem, id_local_destino, "
                + "tp_criterio, nr_tempo_total, dt_consulta) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql, new String[]{"ID_CONSULTA"})) {
            ps.setLong(1, c.getIdUsuario());
            ps.setLong(2, c.getIdLocalOrigem());
            ps.setLong(3, c.getIdLocalDestino());
            ps.setString(4, c.getCriterio());
            ps.setInt(5, c.getTempoTotal());
            gravarData(ps, 6, c.getDataConsulta());
            ps.executeUpdate();
            try (ResultSet chaves = ps.getGeneratedKeys()) {
                if (chaves.next()) {
                    c.setId(chaves.getLong(1));
                }
            }
            return c;
        } catch (SQLException e) {
            throw erro("gravar consulta de rota", e);
        }
    }

    /** O usuário já consultou alguma rota? (impede a exclusão do usuário) */
    public boolean existePorUsuario(Long idUsuario) {
        return existe("SELECT COUNT(*) FROM T_CS_ROTA_CONSULTA WHERE id_usuario = ?", idUsuario);
    }
}
