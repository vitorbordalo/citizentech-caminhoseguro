package br.com.fiap.caminhoseguro.exception;

/**
 * Lançada pelos DAOs quando o JDBC falha (SQLException). Vira HTTP 500 sem detalhes para o cliente.
 * É RuntimeException para o BO e o Controller não precisarem de try/catch de SQLException.
 */
public class ErroBancoException extends RuntimeException {

    public ErroBancoException(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }
}
