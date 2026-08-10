package com.atlas.backend.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;

/**
 * Contrato agregado do dashboard. Plano por convenção do projeto (ver demais
 * DTOs de resposta), pensado para evoluir por adição de campos — novos
 * indicadores entram como novos campos no fim do record, nunca alterando ou
 * removendo os existentes, para não quebrar o consumidor atual (frontend).
 */
public record DashboardResponse(

        long totalProducts,
        long lowStockCount,
        long totalActiveCustomers,
        long totalActiveCompanies,
        long totalActiveSales,

        BigDecimal todayRevenue,
        BigDecimal monthRevenue,

        List<LowStockProductResponse> lowStockProducts,
        List<RecentSaleResponse> recentSales,
        List<DailyRevenueResponse> salesLast7Days

) {
}
