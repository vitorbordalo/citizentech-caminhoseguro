package br.com.fiap.caminhoseguro.controller;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Health check usado pelo Render para saber se a aplicação está no ar. */
@RestController
public class StatusController {

    @GetMapping("/api/status")
    public Map<String, Object> status() {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("status", "ok");
        corpo.put("aplicacao", "CaminhoSeguro API");
        corpo.put("versao", "1.0.0");
        corpo.put("hora", LocalDateTime.now().toString());
        return corpo;
    }
}
