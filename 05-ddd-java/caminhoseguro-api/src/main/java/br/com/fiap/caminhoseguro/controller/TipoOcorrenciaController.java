package br.com.fiap.caminhoseguro.controller;

import br.com.fiap.caminhoseguro.bo.TipoOcorrenciaBO;
import br.com.fiap.caminhoseguro.model.TipoOcorrencia;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint de /api/tipos-ocorrencia (só GET: é uma tabela de domínio). */
@RestController
@RequestMapping("/api/tipos-ocorrencia")
public class TipoOcorrenciaController {

    private final TipoOcorrenciaBO bo;

    public TipoOcorrenciaController(TipoOcorrenciaBO bo) {
        this.bo = bo;
    }

    @GetMapping
    public List<TipoOcorrencia> listar() {
        return bo.listar();
    }
}
