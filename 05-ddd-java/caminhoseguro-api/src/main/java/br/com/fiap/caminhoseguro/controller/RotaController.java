package br.com.fiap.caminhoseguro.controller;

import br.com.fiap.caminhoseguro.bo.RotaBO;
import br.com.fiap.caminhoseguro.dto.RotaResposta;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint de /api/rotas: calcula a rota entre dois locais. */
@RestController
@RequestMapping("/api/rotas")
public class RotaController {

    private final RotaBO bo;

    public RotaController(RotaBO bo) {
        this.bo = bo;
    }

    /** Ex.: /api/rotas?origem=1&destino=3&criterio=ACESSIVEL&usuario=1 (usuario é opcional). */
    @GetMapping
    public RotaResposta calcular(@RequestParam Long origem,
                                 @RequestParam Long destino,
                                 @RequestParam String criterio,
                                 @RequestParam(required = false) Long usuario) {
        return bo.calcular(origem, destino, criterio, usuario);
    }
}
