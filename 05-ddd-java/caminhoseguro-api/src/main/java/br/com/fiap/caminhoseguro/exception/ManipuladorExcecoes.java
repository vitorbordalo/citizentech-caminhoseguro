package br.com.fiap.caminhoseguro.exception;

import br.com.fiap.caminhoseguro.dto.ErroResposta;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Camada de tratamento de exceções: transforma cada exceção em uma resposta JSON
 * no formato do contrato, com o status HTTP correto.
 */
@RestControllerAdvice
public class ManipuladorExcecoes {

    private static final Logger log = LoggerFactory.getLogger(ManipuladorExcecoes.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResposta> naoEncontrado(RecursoNaoEncontradoException e, HttpServletRequest req) {
        return montar(HttpStatus.NOT_FOUND, "Não encontrado", e.getMessage(), req, null);
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ErroResposta> regraNegocio(RegraNegocioException e, HttpServletRequest req) {
        return montar(HttpStatus.UNPROCESSABLE_ENTITY, "Regra de negócio violada", e.getMessage(), req, null);
    }

    @ExceptionHandler(ConflitoException.class)
    public ResponseEntity<ErroResposta> conflito(ConflitoException e, HttpServletRequest req) {
        return montar(HttpStatus.CONFLICT, "Conflito", e.getMessage(), req, null);
    }

    @ExceptionHandler(RequisicaoInvalidaException.class)
    public ResponseEntity<ErroResposta> requisicaoInvalida(RequisicaoInvalidaException e, HttpServletRequest req) {
        return montar(HttpStatus.BAD_REQUEST, "Requisição inválida", e.getMessage(), req, null);
    }

    /** Bean Validation (@Valid no controller): devolve o mapa campo -> mensagem. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResposta> validacao(MethodArgumentNotValidException e, HttpServletRequest req) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> campos.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return montar(HttpStatus.BAD_REQUEST, "Requisição inválida", "Dados inválidos", req, campos);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResposta> jsonInvalido(HttpMessageNotReadableException e, HttpServletRequest req) {
        return montar(HttpStatus.BAD_REQUEST, "Requisição inválida",
                "Corpo da requisição inválido (JSON malformado, tipo ou data incorretos; datas usam yyyy-MM-dd)", req, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroResposta> tipoParametro(MethodArgumentTypeMismatchException e, HttpServletRequest req) {
        return montar(HttpStatus.BAD_REQUEST, "Requisição inválida",
                "Parâmetro '" + e.getName() + "' com valor inválido: " + e.getValue(), req, null);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErroResposta> parametroFaltando(MissingServletRequestParameterException e, HttpServletRequest req) {
        Map<String, String> campos = Map.of(e.getParameterName(), "obrigatório");
        return montar(HttpStatus.BAD_REQUEST, "Requisição inválida", "Parâmetro obrigatório ausente", req, campos);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErroResposta> metodoNaoSuportado(HttpRequestMethodNotSupportedException e, HttpServletRequest req) {
        return montar(HttpStatus.METHOD_NOT_ALLOWED, "Método não permitido", e.getMessage(), req, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErroResposta> rotaInexistente(NoResourceFoundException e, HttpServletRequest req) {
        return montar(HttpStatus.NOT_FOUND, "Não encontrado", "Recurso não encontrado: " + req.getRequestURI(), req, null);
    }

    /** Qualquer outro erro: 500 com mensagem genérica (a causa vai só para o log, nunca para o cliente). */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResposta> erroGenerico(Exception e, HttpServletRequest req) {
        log.error("Erro inesperado em {}", req.getRequestURI(), e);
        return montar(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno",
                "Ocorreu um erro inesperado. Tente novamente mais tarde.", req, null);
    }

    private ResponseEntity<ErroResposta> montar(HttpStatus status, String erro, String mensagem,
                                               HttpServletRequest req, Map<String, String> campos) {
        ErroResposta corpo = new ErroResposta(status.value(), erro, mensagem, req.getRequestURI(), campos);
        return ResponseEntity.status(status).body(corpo);
    }
}
