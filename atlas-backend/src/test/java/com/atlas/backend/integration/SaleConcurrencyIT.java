package com.atlas.backend.integration;

import com.atlas.backend.dto.sale.SaleItemRequest;
import com.atlas.backend.dto.sale.SaleRequest;
import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.entity.Product;
import com.atlas.backend.entity.Role;
import com.atlas.backend.entity.User;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.service.SaleService;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prova de integração contra o PostgreSQL real (Testcontainers) de que o lock
 * pessimista de escrita em {@code ProductRepository#findByIdForUpdate}
 * impede overselling: duas vendas concorrentes tentando vender a mesma
 * unidade de um produto com estoque 1 resultam em exatamente uma venda
 * aceita e uma recusada com {@code BusinessException}, e o estoque final é
 * 0 — nunca negativo.
 *
 * <p>Este teste roda sem a transação padrão da base ({@code NOT_SUPPORTED}):
 * as threads precisam de transações próprias e reais no banco, e o setup é
 * commitado de verdade. Sem o lock, as duas vendas tenderiam a passar na
 * checagem simultaneamente (lost update) e o teste falharia — é exatamente
 * o cenário que a correção impede.
 */
class SaleConcurrencyIT extends AbstractIntegrationTest {

    @Autowired
    private SaleService saleService;

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void vendasConcorrentes_naoPodemVenderAlemDoEstoque() throws Exception {

        Category category = persistCategory("Categoria Concorrência " + TestDataFactory.uniqueSku());
        Product product = persistProduct(TestDataFactory.uniqueSku(), category, 1);
        Customer customerA = persistCustomer(TestDataFactory.uniqueDocument());
        Customer customerB = persistCustomer(TestDataFactory.uniqueDocument());

        String email = TestDataFactory.uniqueEmail();
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new IllegalStateException(
                        "Role USER não encontrada — migration V8 não rodou?"));
        User user = User.builder()
                .name("Vendedor de Teste")
                .email(email)
                .password(passwordEncoder.encode(TestDataFactory.DEFAULT_PASSWORD))
                .roles(Set.of(userRole))
                .build();
        userRepository.save(user);

        Authentication auth = new UsernamePasswordAuthenticationToken(email, null);

        SaleRequest saleA = new SaleRequest(
                customerA.getId(),
                List.of(new SaleItemRequest(product.getId(), 1)));
        SaleRequest saleB = new SaleRequest(
                customerB.getId(),
                List.of(new SaleItemRequest(product.getId(), 1)));

        CyclicBarrier barrier = new CyclicBarrier(2);
        AtomicInteger successCount = new AtomicInteger();
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());

        Thread t1 = new Thread(() -> runSale(saleA, auth, barrier, successCount, errors), "venda-A");
        Thread t2 = new Thread(() -> runSale(saleB, auth, barrier, successCount, errors), "venda-B");

        t1.start();
        t2.start();
        t1.join(30_000);
        t2.join(30_000);

        assertThat(t1.isAlive() || t2.isAlive())
                .as("as duas vendas deveriam ter terminado (lock não pode travar)")
                .isFalse();

        // Exatamente uma venda passou; a outra foi recusada por estoque insuficiente.
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(errors).hasSize(1);
        assertThat(errors.get(0))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Estoque insuficiente");

        // O estoque final é 0 — nunca negativo, nunca acima do disponível.
        Product reloaded = productRepository.findById(product.getId()).orElseThrow();
        assertThat(reloaded.getStock()).isZero();
    }

    private void runSale(SaleRequest request, Authentication auth, CyclicBarrier barrier,
                         AtomicInteger successCount, List<Throwable> errors) {
        try {
            barrier.await();
            saleService.create(request, auth);
            successCount.incrementAndGet();
        } catch (Throwable e) {
            errors.add(e);
        }
    }
}
