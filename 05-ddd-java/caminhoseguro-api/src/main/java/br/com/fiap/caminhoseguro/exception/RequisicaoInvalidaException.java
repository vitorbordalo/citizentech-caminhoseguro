package br.com.fiap.caminhoseguro.exception;

/**
 * Lançada quando um parâmetro da requisição é inválido (ex.: critério desconhecido). Vira HTTP 400.
 */
public class RequisicaoInvalidaException extends RuntimeException {

    public RequisicaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
