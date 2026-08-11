package com.atlas.backend.support;

import com.atlas.backend.dto.auth.LoginRequest;
import com.atlas.backend.dto.auth.RegisterRequest;
import com.atlas.backend.dto.customer.CustomerRequest;
import com.atlas.backend.dto.product.CreateProductRequest;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Fábrica de dados de teste, reutilizável por testes unitários e de
 * integração. Gera identificadores únicos (e-mail, SKU, documento) por
 * padrão — nenhum teste depende de um valor fixo compartilhado, então
 * rodar em qualquer ordem, várias vezes seguidas, ou em paralelo, nunca
 * colide.
 */
public final class TestDataFactory {

    public static final String DEFAULT_PASSWORD = "Senha@123";

    private TestDataFactory() {
    }

    public static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@teste.local";
    }

    public static String uniqueSku() {
        return "SKU-" + UUID.randomUUID();
    }

    /**
     * Documento (CPF/CNPJ) de teste com exatamente 11 dígitos numéricos,
     * únicos o bastante para não colidir entre execuções.
     */
    public static String uniqueDocument() {
        String digits = UUID.randomUUID().toString().replaceAll("\\D", "");
        return (digits + "00000000000").substring(0, 11);
    }

    public static RegisterRequest registerRequest(String email, String role) {
        return new RegisterRequest("Usuário de Teste", email, DEFAULT_PASSWORD, role);
    }

    public static LoginRequest loginRequest(String email, String password) {
        return new LoginRequest(email, password);
    }

    public static CreateProductRequest createProductRequest(String sku, Long categoryId) {
        return new CreateProductRequest(
                "Produto de Teste",
                "Descrição de teste",
                sku,
                null,
                new BigDecimal("10.00"),
                new BigDecimal("20.00"),
                5,
                1,
                categoryId
        );
    }

    public static CustomerRequest customerRequest(String document) {
        return new CustomerRequest(
                "Cliente de Teste",
                "cliente-" + UUID.randomUUID() + "@teste.local",
                "51999999999",
                document
        );
    }
}
