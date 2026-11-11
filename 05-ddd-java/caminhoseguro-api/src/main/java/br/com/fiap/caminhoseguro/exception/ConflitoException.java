package br.com.fiap.caminhoseguro.exception;

/**
 * Lançada em conflitos (ex.: e-mail repetido, excluir local que tem trechos). Vira HTTP 409.
 */
public class ConflitoException extends RuntimeException {

    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
