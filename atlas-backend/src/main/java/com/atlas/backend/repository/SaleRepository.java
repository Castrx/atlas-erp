package com.atlas.backend.repository;

import com.atlas.backend.dto.dashboard.RecentSaleResponse;
import com.atlas.backend.entity.Sale;
import com.atlas.backend.entity.SaleStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByStatus(SaleStatus status);

    long countByStatus(SaleStatus status);

    @Query("""
            SELECT COALESCE(SUM(s.total), 0)
            FROM Sale s
            WHERE s.status = com.atlas.backend.entity.SaleStatus.ACTIVE
            AND s.createdAt >= :since
            """)
    BigDecimal getRevenueSince(@Param("since") LocalDateTime since);

    @Query("""
            SELECT new com.atlas.backend.dto.dashboard.RecentSaleResponse(
                s.id, s.customer.name, s.total, s.createdAt)
            FROM Sale s
            WHERE s.status = com.atlas.backend.entity.SaleStatus.ACTIVE
            ORDER BY s.createdAt DESC
            """)
    List<RecentSaleResponse> findRecentSales(Pageable pageable);

    /**
     * Agregação por dia (nativa: DATE/GROUP BY portável em JPQL é limitado,
     * e a query já é específica de Postgres via CAST). Resultado mapeado
     * para DailyRevenueResponse no Service.
     */
    @Query(value = """
            SELECT CAST(s.created_at AS DATE) AS day, COALESCE(SUM(s.total), 0) AS total
            FROM sale s
            WHERE s.status = 'ACTIVE'
            AND s.created_at >= :since
            GROUP BY CAST(s.created_at AS DATE)
            ORDER BY day
            """, nativeQuery = true)
    List<Object[]> getDailyRevenueSince(@Param("since") LocalDateTime since);

}
