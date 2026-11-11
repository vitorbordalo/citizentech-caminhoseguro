package br.com.fiap.caminhoseguro.model;

import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

/**
 * Representa a tabela T_CS_USUARIO (dados simulados).
 */
public class Usuario {

    private Long id;

    @NotBlank(message = "obrigatório")
    @Size(max = 80, message = "máximo de 80 caracteres")
    private String nome;

    @NotBlank(message = "obrigatório")
    @Size(max = 120, message = "máximo de 120 caracteres")
    @Pattern(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message = "e-mail inválido")
    private String email;

    @NotBlank(message = "obrigatório")
    @Pattern(regexp = "IDOSO|PCD|CUIDADOR|MORADOR|AGENTE", message = "perfil deve ser IDOSO, PCD, CUIDADOR, MORADOR ou AGENTE")
    private String perfil;

    private LocalDate dataCadastro;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPerfil() {
        return perfil;
    }

    public void setPerfil(String perfil) {
        this.perfil = perfil;
    }

    public LocalDate getDataCadastro() {
        return dataCadastro;
    }

    public void setDataCadastro(LocalDate dataCadastro) {
        this.dataCadastro = dataCadastro;
    }
}
