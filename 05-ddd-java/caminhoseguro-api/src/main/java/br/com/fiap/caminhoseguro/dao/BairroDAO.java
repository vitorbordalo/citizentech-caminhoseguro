package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.model.Bairro;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

/** Acesso à tabela T_CS_BAIRRO (só leitura: usada para validar a chave estrangeira do local). */
@Repository
public class BairroDAO extends BaseDAO {

    public BairroDAO(DataSource dataSource) {
        super(dataSource);
    }

    public Bairro buscarPorId(Long id) {
        String sql = "SELECT id_bairro, nm_bairro, nm_cidade, sg_uf FROM T_CS_BAIRRO WHERE id_bairro = ?";
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                Bairro b = new Bairro();
                b.setId(rs.getLong("id_bairro"));
                b.setNome(rs.getString("nm_bairro"));
                b.setCidade(rs.getString("nm_cidade"));
                b.setUf(rs.getString("sg_uf"));
                return b;
            }
        } catch (SQLException e) {
            throw erro("buscar bairro", e);
        }
    }
}
