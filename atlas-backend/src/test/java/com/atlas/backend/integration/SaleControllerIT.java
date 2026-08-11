package com.atlas.backend.integration;

import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.entity.Product;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC (Sprint 7A): registrar e consultar vendas é operação do dia a dia
 * (USER e ADMIN); cancelar é ADMIN-only, por ser reversão financeira —
 * matriz de permissões em docs/architecture.md.
 */
class SaleControllerIT extends AbstractIntegrationTest {

    private String vendaPayload(Long customerId, Long productId, int quantity) {
        return """
                {"customerId": %d, "items": [{"productId": %d, "quantity": %d}]}
                """.formatted(customerId, productId, quantity);
    }

    @Test
    void findAll_deveRetornar401_semAutenticacao() throws Exception {
        mockMvc.perform(get("/sales"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_deveRetornar200_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 10);
        Customer customer = persistCustomer(TestDataFactory.uniqueDocument());

        mockMvc.perform(post("/sales")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaPayload(customer.getId(), product.getId(), 2)))
                .andExpect(status().isOk());
    }

    @Test
    void cancel_deveRetornar403_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 10);
        Customer customer = persistCustomer(TestDataFactory.uniqueDocument());

        String responseBody = mockMvc.perform(post("/sales")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaPayload(customer.getId(), product.getId(), 1)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long saleId = objectMapper.readTree(responseBody).get("id").asLong();

        mockMvc.perform(delete("/sales/" + saleId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void cancel_deveRetornar204_paraADMIN() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 10);
        Customer customer = persistCustomer(TestDataFactory.uniqueDocument());

        String responseBody = mockMvc.perform(post("/sales")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaPayload(customer.getId(), product.getId(), 1)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long saleId = objectMapper.readTree(responseBody).get("id").asLong();

        mockMvc.perform(delete("/sales/" + saleId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }
}
