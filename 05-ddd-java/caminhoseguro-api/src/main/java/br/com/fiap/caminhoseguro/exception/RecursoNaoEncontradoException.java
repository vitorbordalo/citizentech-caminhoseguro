package br.com.fiap.caminhoseguro.exception;

/**
 * Lançada quando um registro (ou chave estrangeira) não existe. Vira HTTP 404.
 */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
