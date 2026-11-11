package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.model.TipoLocal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

/** Acesso à tabela T_CS_TIPO_LOCAL (só leitura: usada para validar a chave estrangeira do local). */
@Repository
public class TipoLocalDAO extends BaseDAO {

    public TipoLocalDAO(DataSource dataSource) {
        super(dataSource);
    }

    public TipoLocal buscarPorId(Long id) {
        String sql = "SELECT id_tipo_local, ds_tipo_local FROM T_CS_TIPO_LOCAL WHERE id_tipo_local = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                TipoLocal t = new TipoLocal();
                t.setId(rs.getLong("id_tipo_local"));
                t.setDescricao(rs.getString("ds_tipo_local"));
                return t;
            }
        } catch (SQLException e) {
            throw erro("buscar tipo de local", e);
        }
    }
}
