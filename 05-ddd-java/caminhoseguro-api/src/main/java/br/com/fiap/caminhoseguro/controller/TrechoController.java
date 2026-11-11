package br.com.fiap.caminhoseguro.controller;

import br.com.fiap.caminhoseguro.bo.TrechoBO;
import br.com.fiap.caminhoseguro.model.Trecho;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/** Endpoints de /api/trechos. */
@RestController
@RequestMapping("/api/trechos")
public class TrechoController {

    private final TrechoBO bo;

    public TrechoController(TrechoBO bo) {
        this.bo = bo;
    }

    @GetMapping
    public List<Trecho> listar() {
        return bo.listar();
    }

    @GetMapping("/{id}")
    public Trecho buscar(@PathVariable Long id) {
        return bo.buscar(id);
    }

    @PostMapping
    public ResponseEntity<Trecho> criar(@Valid @RequestBody Trecho trecho) {
        Trecho criado = bo.criar(trecho);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(criado.getId()).toUri();
        return ResponseEntity.created(uri).body(criado);
    }

    @PutMapping("/{id}")
    public Trecho atualizar(@PathVariable Long id, @Valid @RequestBody Trecho trecho) {
        return bo.atualizar(id, trecho);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        bo.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
