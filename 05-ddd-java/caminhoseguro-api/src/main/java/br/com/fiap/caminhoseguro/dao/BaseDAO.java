package br.com.fiap.caminhoseguro.dao;

import br.com.fiap.caminhoseguro.exception.ErroBancoException;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import javax.sql.DataSource;

/**
 * Classe base dos DAOs: guarda o DataSource (injetado pelo Spring) e tem métodos
 * auxiliares de JDBC puro (conexão, conversão de datas e de S/N para boolean).
 */
public abstract class BaseDAO {

    protected final DataSource dataSource;

    protected BaseDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** Abre uma conexão do pool. Quem chama fecha com try-with-resources. */
    protected Connection abrir() throws SQLException {
        return dataSource.getConnection();
    }

    /** Traduz SQLException (checked) para uma exceção própria (unchecked). */
    protected ErroBancoException erro(String acao, SQLException e) {
        return new ErroBancoException("Falha ao " + acao + " no banco de dados", e);
    }

    /** Executa um SELECT COUNT(*) e diz se o resultado é maior que zero. */
    protected boolean existe(String sqlContagem, Object... parametros) {
        try (Connection con = abrir(); PreparedStatement ps = con.prepareStatement(sqlContagem)) {
            for (int i = 0; i < parametros.length; i++) {
                ps.setObject(i + 1, parametros[i]);
            }
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getLong(1) > 0;
            }
        } catch (SQLException e) {
            throw erro("consultar", e);
        }
    }

    /** Lê uma coluna DATE como LocalDate (aceita nulo). */
    protected static LocalDate lerData(ResultSet rs, String coluna) throws SQLException {
        Date data = rs.getDate(coluna);
        return data == null ? null : data.toLocalDate();
    }

    /** Grava um LocalDate (ou NULL) em uma coluna DATE. */
    protected static void gravarData(PreparedStatement ps, int posicao, LocalDate data) throws SQLException {
        if (data == null) {
            ps.setNull(posicao, Types.DATE);
        } else {
            ps.setDate(posicao, Date.valueOf(data));
        }
    }

    /** Lê uma coluna NUMBER decimal que pode ser nula. */
    protected static Double lerDouble(ResultSet rs, String coluna) throws SQLException {
        double valor = rs.getDouble(coluna);
        return rs.wasNull() ? null : valor;
    }

    /** Grava um Double (ou NULL) em uma coluna NUMBER. */
    protected static void gravarDouble(PreparedStatement ps, int posicao, Double valor) throws SQLException {
        if (valor == null) {
            ps.setNull(posicao, Types.NUMERIC);
        } else {
            ps.setDouble(posicao, valor);
        }
    }

    /** No banco o booleano é CHAR(1) com S ou N. */
    protected static boolean simNao(String valor) {
        return "S".equals(valor);
    }

    protected static String simNao(Boolean valor) {
        return Boolean.TRUE.equals(valor) ? "S" : "N";
    }
}
