package com.atlas.backend.repository;

import com.atlas.backend.dto.dashboard.LowStockProductResponse;
import com.atlas.backend.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

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

}
