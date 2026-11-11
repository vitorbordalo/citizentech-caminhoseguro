package br.com.fiap.caminhoseguro.exception;

/**
 * Lançada quando uma regra de negócio é violada (ex.: origem igual ao destino). Vira HTTP 422.
 */
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
