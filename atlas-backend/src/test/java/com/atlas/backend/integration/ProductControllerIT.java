package com.atlas.backend.integration;

import com.atlas.backend.dto.product.CreateProductRequest;
import com.atlas.backend.dto.product.UpdateProductRequest;
import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Product;
import com.atlas.backend.repository.StockMovementRepository;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração de ponta a ponta: controller real, security real
 * (rota autenticada via JWT genuíno), banco real (Postgres efêmero via
 * Testcontainers). Cobre o fluxo de cadastro e listagem de Produtos e a
 * regra de negócio de SKU duplicado / categoria inexistente.
 */
class ProductControllerIT extends AbstractIntegrationTest {

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Test
    void findAll_deveRetornar401_semAutenticacao() throws Exception {
        mockMvc.perform(get("/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_deveRetornar201_comProdutoValido() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        CreateProductRequest request = TestDataFactory.createProductRequest(TestDataFactory.uniqueSku(), category.getId());

        mockMvc.perform(post("/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value(request.sku()))
                .andExpect(jsonPath("$.categoryId").value(category.getId()))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void create_deveRetornar409_quandoSkuDuplicado() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        CreateProductRequest request = TestDataFactory.createProductRequest(TestDataFactory.uniqueSku(), category.getId());

        mockMvc.perform(post("/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Já existe um produto com este SKU."));
    }

    @Test
    void create_deveRetornar409_quandoCategoriaNaoExiste() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        CreateProductRequest request = TestDataFactory.createProductRequest(TestDataFactory.uniqueSku(), 999_999L);

        mockMvc.perform(post("/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Categoria não encontrada."));
    }

    @Test
    void create_deveRetornar400_quandoNomeEmBranco() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());

        String payloadComNomeVazio = """
                {
                  "name": "",
                  "sku": "%s",
                  "costPrice": 10.00,
                  "salePrice": 20.00,
                  "categoryId": %d
                }
                """.formatted(TestDataFactory.uniqueSku(), category.getId());

        mockMvc.perform(post("/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadComNomeVazio))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findAll_deveListarProdutoRecemCriado() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        CreateProductRequest request = TestDataFactory.createProductRequest(TestDataFactory.uniqueSku(), category.getId());

        mockMvc.perform(post("/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/products")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(request.sku())));
    }

    // --- RBAC (Sprint 7A) ---

    @Test
    void create_deveRetornar201_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        CreateProductRequest request = TestDataFactory.createProductRequest(TestDataFactory.uniqueSku(), category.getId());

        mockMvc.perform(post("/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void delete_deveRetornar403_paraUSER() throws Exception {
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 5);
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(delete("/products/" + product.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void delete_deveRetornar204_paraADMIN() throws Exception {
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 5);
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");

        mockMvc.perform(delete("/products/" + product.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    // --- M4 (Sprint Security & Data Integrity): estoque imutável no PUT ---

    @Test
    void update_deveRetornar200_ePreservarEstoque_quandoClienteEnviaStock() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 5);

        // Simula um cliente antigo que ainda envia "stock" no PUT — o campo é
        // ignorado (Jackson ignora propriedades desconhecidas) e o estoque
        // permanece o anterior.
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Produto Atualizado");
        body.put("sku", product.getSku());
        body.put("costPrice", 15.0);
        body.put("salePrice", 30.0);
        body.put("minimumStock", 2);
        body.put("categoryId", category.getId());
        body.put("stock", 999);

        mockMvc.perform(put("/products/" + product.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(5));

        // M4: o update de produto não pode criar movimentação de estoque.
        assertThat(stockMovementRepository.findAll()).isEmpty();
    }

    @Test
    void update_deveRetornar200_ePreservarEstoque_semCampoStock() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 5);

        UpdateProductRequest request = new UpdateProductRequest(
                "Produto Atualizado", null, product.getSku(), null,
                new BigDecimal("15.00"), new BigDecimal("30.00"), 2, category.getId());

        mockMvc.perform(put("/products/" + product.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(5));
    }
}
