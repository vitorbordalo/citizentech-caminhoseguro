package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.model.TipoOcorrencia;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

/** Acesso à tabela T_CS_TIPO_OCORRENCIA (só leitura). */
@Repository
public class TipoOcorrenciaDAO extends BaseDAO {

    public TipoOcorrenciaDAO(DataSource dataSource) {
        super(dataSource);
    }

    public List<TipoOcorrencia> listar() {
        String sql = "SELECT id_tipo_ocorrencia, ds_tipo_ocorrencia, nr_gravidade_padrao "
                + "FROM T_CS_TIPO_OCORRENCIA ORDER BY id_tipo_ocorrencia";
        List<TipoOcorrencia> lista = new ArrayList<>();
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                TipoOcorrencia t = new TipoOcorrencia();
                t.setId(rs.getLong("id_tipo_ocorrencia"));
                t.setDescricao(rs.getString("ds_tipo_ocorrencia"));
                t.setGravidadePadrao(rs.getInt("nr_gravidade_padrao"));
                lista.add(t);
            }
            return lista;
        } catch (SQLException e) {
            throw erro("listar tipos de ocorrência", e);
        }
    }

    public boolean existe(Long id) {
        return existe("SELECT COUNT(*) FROM T_CS_TIPO_OCORRENCIA WHERE id_tipo_ocorrencia = ?", id);
    }
}
