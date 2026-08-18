package com.atlas.backend.integration;

import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.entity.Product;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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

    // --- M5 (Sprint Security & Data Integrity): entidades inativas ---

    @Test
    void create_deveRetornar409_quandoClienteInativo() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 10);
        Customer customer = persistCustomer(TestDataFactory.uniqueDocument());
        customer.setActive(false);
        customerRepository.save(customer);

        mockMvc.perform(post("/sales")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaPayload(customer.getId(), product.getId(), 1)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Não é possível vender para um cliente inativo."));
    }

    @Test
    void create_deveRetornar409_quandoProdutoInativo() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 10);
        Customer customer = persistCustomer(TestDataFactory.uniqueDocument());
        product.setActive(false);
        productRepository.save(product);

        mockMvc.perform(post("/sales")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaPayload(customer.getId(), product.getId(), 1)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Não é possível vender para um produto inativo."));
    }

    @Test
    void cancel_deveRestaurarEstoque_quandoProdutoInativadoAposVenda() throws Exception {
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

        // M5: inativar o produto DEPOIS da venda não pode quebrar o
        // cancelamento — o estoque é restaurado normalmente.
        product.setActive(false);
        productRepository.save(product);

        mockMvc.perform(delete("/sales/" + saleId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock())
                .isEqualTo(10);
    }

    // --- findAll(): correção do N+1 (mesma resposta da API, itens corretos por venda) ---

    @Test
    void findAll_deveManterItensCorretosPorVenda_semMisturarEntreVendas() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product productA = persistProduct(TestDataFactory.uniqueSku(), category, 10);
        Product productB = persistProduct(TestDataFactory.uniqueSku(), category, 10);
        Customer customer = persistCustomer(TestDataFactory.uniqueDocument());

        String responseA = mockMvc.perform(post("/sales")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaPayload(customer.getId(), productA.getId(), 2)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String responseB = mockMvc.perform(post("/sales")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaPayload(customer.getId(), productB.getId(), 3)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long saleIdA = objectMapper.readTree(responseA).get("id").asLong();
        long saleIdB = objectMapper.readTree(responseB).get("id").asLong();

        String listBody = mockMvc.perform(get("/sales")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode sales = objectMapper.readTree(listBody);

        JsonNode saleANode = findSaleById(sales, saleIdA);
        JsonNode saleBNode = findSaleById(sales, saleIdB);

        // Mesmo shape de resposta de sempre (SaleResponse/SaleItemResponse),
        // e cada venda mantém só o seu próprio item — sem contaminação
        // cruzada entre vendas na listagem em lote.
        assertThat(saleANode.get("items")).hasSize(1);
        assertThat(saleANode.get("items").get(0).get("productId").asLong()).isEqualTo(productA.getId());
        assertThat(saleANode.get("items").get(0).get("quantity").asInt()).isEqualTo(2);

        assertThat(saleBNode.get("items")).hasSize(1);
        assertThat(saleBNode.get("items").get(0).get("productId").asLong()).isEqualTo(productB.getId());
        assertThat(saleBNode.get("items").get(0).get("quantity").asInt()).isEqualTo(3);
    }

    private JsonNode findSaleById(JsonNode sales, long id) {

        for (JsonNode sale : sales) {
            if (sale.get("id").asLong() == id) {
                return sale;
            }
        }

        throw new AssertionError("Venda #" + id + " não encontrada na listagem.");
    }
}
