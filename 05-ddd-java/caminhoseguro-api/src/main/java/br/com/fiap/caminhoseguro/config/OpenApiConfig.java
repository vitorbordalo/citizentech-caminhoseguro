package br.com.fiap.caminhoseguro.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Título e descrição que aparecem no Swagger (/swagger-ui.html).
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI().info(new Info()
                .title("CaminhoSeguro API")
                .version("1.0.0")
                .description("Rotas acessíveis para idosos e pessoas com mobilidade reduzida no bairro Bela Vista (SP). "
                        + "Global Solution FIAP 2026.2 - CitizenTech."));
    }
}
