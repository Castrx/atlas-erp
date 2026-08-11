package com.atlas.backend.integration;

import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Product;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC (Sprint 7A): movimentação de estoque é operação do dia a dia,
 * aberta a USER e ADMIN — matriz de permissões em docs/architecture.md.
 */
class StockControllerIT extends AbstractIntegrationTest {

    @Test
    void history_deveRetornar401_semAutenticacao() throws Exception {
        mockMvc.perform(get("/stock/history"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void history_deveRetornar200_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(get("/stock/history").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void entry_deveRetornar200_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 5);

        String payload = """
                {"productId": %d, "quantity": 10, "reason": "Reposição de teste"}
                """.formatted(product.getId());

        mockMvc.perform(post("/stock/entry")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void exit_deveRetornar200_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 5);

        String payload = """
                {"productId": %d, "quantity": 2, "reason": "Saída de teste"}
                """.formatted(product.getId());

        mockMvc.perform(post("/stock/exit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());
    }
}
