package com.atlas.backend.integration;

import com.atlas.backend.dto.category.CreateCategoryRequest;
import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Product;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC (Sprint 7A): leitura de categorias é aberta a USER e ADMIN (usada
 * no cadastro de Produtos); escrita é ADMIN-only — matriz de permissões
 * em docs/architecture.md.
 */
class CategoryControllerIT extends AbstractIntegrationTest {

    @Test
    void findAll_deveRetornar200_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(get("/categories").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void create_deveRetornar403_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");
        CreateCategoryRequest request = TestDataFactory.createCategoryRequest("Categoria " + TestDataFactory.uniqueSku());

        mockMvc.perform(post("/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_deveRetornar201_paraADMIN() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        CreateCategoryRequest request = TestDataFactory.createCategoryRequest("Categoria " + TestDataFactory.uniqueSku());

        mockMvc.perform(post("/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void delete_deveRetornar403_paraUSER() throws Exception {
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(delete("/categories/" + category.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void delete_deveRetornar204_paraADMIN() throws Exception {
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");

        mockMvc.perform(delete("/categories/" + category.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    // --- Inativação (correção do hard delete: categoria em uso não pode quebrar por FK) ---

    @Test
    void delete_deveInativarCategoria_semQuebrarFK_quandoUsadaPorProduto() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 5);

        // product.category_id é FK não-nula sem CASCADE — antes da correção,
        // o DELETE físico da categoria em uso derrubava com 500.
        mockMvc.perform(delete("/categories/" + category.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        Category afterDelete = categoryRepository.findById(category.getId()).orElseThrow();
        assertThat(afterDelete.getActive()).isFalse();

        // O produto vinculado permanece intacto, com a mesma categoria.
        Product afterDeleteProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(afterDeleteProduct.getCategory().getId()).isEqualTo(category.getId());
    }

    @Test
    void delete_deveTornarCategoriaComActiveFalse_masGetPorIdContinuaAcessivel() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        Category category = persistCategory("Categoria " + TestDataFactory.uniqueSku());

        mockMvc.perform(delete("/categories/" + category.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/categories/" + category.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }
}
