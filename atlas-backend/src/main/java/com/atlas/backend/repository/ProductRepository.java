package com.atlas.backend.repository;

import com.atlas.backend.dto.dashboard.LowStockProductResponse;
import com.atlas.backend.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySku(String sku);

    long countByActiveTrue();

    @Query("""
            SELECT COUNT(p)
            FROM Product p
            WHERE p.active = true
            AND p.stock <= p.minimumStock
            """)
    long countLowStockProducts();

    @Query("""
            SELECT new com.atlas.backend.dto.dashboard.LowStockProductResponse(
                p.id, p.name, p.sku, p.stock, p.minimumStock)
            FROM Product p
            WHERE p.active = true
            AND p.stock <= p.minimumStock
            ORDER BY (p.stock - p.minimumStock) ASC
            """)
    List<LowStockProductResponse> findLowStockProducts(Pageable pageable);

    /**
     * Busca um produto com lock pessimista de escrita ({@code SELECT ... FOR
     * UPDATE}). Usado pelos fluxos que leem e gravam o estoque (venda,
     * cancelamento, entrada/saída de estoque): serializa a leitura-modificação-
     * escrita do estoque entre transações concorrentes, impedindo overselling e
     * lost update. Só tem efeito dentro de uma transação — os chamadores
     * (SaleService, StockService) já são {@code @Transactional}.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

}
