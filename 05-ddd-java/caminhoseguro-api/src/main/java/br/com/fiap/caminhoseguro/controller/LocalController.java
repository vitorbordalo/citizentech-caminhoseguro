package br.com.fiap.caminhoseguro.controller;

import br.com.fiap.caminhoseguro.bo.LocalBO;
import br.com.fiap.caminhoseguro.model.Local;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/** Endpoints de /api/locais. */
@RestController
@RequestMapping("/api/locais")
public class LocalController {

    private final LocalBO bo;

    public LocalController(LocalBO bo) {
        this.bo = bo;
    }

    /** Filtro opcional: /api/locais?pontoApoio=true */
    @GetMapping
    public List<Local> listar(@RequestParam(required = false) Boolean pontoApoio) {
        return bo.listar(pontoApoio);
    }

    @GetMapping("/{id}")
    public Local buscar(@PathVariable Long id) {
        return bo.buscar(id);
    }

    @PostMapping
    public ResponseEntity<Local> criar(@Valid @RequestBody Local local) {
        Local criado = bo.criar(local);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(criado.getId()).toUri();
        return ResponseEntity.created(uri).body(criado);
    }

    @PutMapping("/{id}")
    public Local atualizar(@PathVariable Long id, @Valid @RequestBody Local local) {
        return bo.atualizar(id, local);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        bo.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
