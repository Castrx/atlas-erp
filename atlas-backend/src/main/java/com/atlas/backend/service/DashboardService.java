package com.atlas.backend.service;

import com.atlas.backend.dto.dashboard.DailyRevenueResponse;
import com.atlas.backend.dto.dashboard.DashboardResponse;
import com.atlas.backend.dto.dashboard.LowStockProductResponse;
import com.atlas.backend.dto.dashboard.RecentSaleResponse;
import com.atlas.backend.entity.SaleStatus;
import com.atlas.backend.repository.CompanyRepository;
import com.atlas.backend.repository.CustomerRepository;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Toda a regra de negócio do dashboard vive aqui — o controller apenas
 * delega. Limites (itens por lista, período do gráfico) são fixos por
 * decisão da Sprint 3A; se precisarem virar parâmetros de request no
 * futuro, isso é aditivo ao contrato (DashboardResponse), não uma quebra.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int RECENT_SALES_LIMIT = 5;
    private static final int LOW_STOCK_LIMIT = 5;
    private static final int SALES_CHART_DAYS = 7;

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final CompanyRepository companyRepository;
    private final SaleRepository saleRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        long totalProducts = productRepository.countByActiveTrue();
        long lowStockCount = productRepository.countLowStockProducts();
        long totalActiveCustomers = customerRepository.countByActiveTrue();
        long totalActiveCompanies = companyRepository.countByActiveTrue();
        long totalActiveSales = saleRepository.countByStatus(SaleStatus.ACTIVE);

        BigDecimal todayRevenue = saleRepository.getRevenueSince(startOfToday);
        BigDecimal monthRevenue = saleRepository.getRevenueSince(startOfMonth);

        List<LowStockProductResponse> lowStockProducts =
                productRepository.findLowStockProducts(Pageable.ofSize(LOW_STOCK_LIMIT));

        List<RecentSaleResponse> recentSales =
                saleRepository.findRecentSales(Pageable.ofSize(RECENT_SALES_LIMIT));

        List<DailyRevenueResponse> salesLast7Days = buildDailyRevenue();

        return new DashboardResponse(
                totalProducts,
                lowStockCount,
                totalActiveCustomers,
                totalActiveCompanies,
                totalActiveSales,
                nullToZero(todayRevenue),
                nullToZero(monthRevenue),
                lowStockProducts,
                recentSales,
                salesLast7Days
        );
    }

    /**
     * Preenche os dias sem venda com zero, para o gráfico não ter buracos —
     * a query só retorna linhas para dias com pelo menos uma venda.
     */
    private List<DailyRevenueResponse> buildDailyRevenue() {

        LocalDate firstDay = LocalDate.now().minusDays(SALES_CHART_DAYS - 1L);
        LocalDateTime since = firstDay.atTime(LocalTime.MIDNIGHT);

        Map<LocalDate, BigDecimal> revenueByDay = new HashMap<>();

        for (Object[] row : saleRepository.getDailyRevenueSince(since)) {
            LocalDate day = ((java.sql.Date) row[0]).toLocalDate();
            BigDecimal total = (BigDecimal) row[1];
            revenueByDay.put(day, total);
        }

        List<DailyRevenueResponse> result = new ArrayList<>();

        for (int i = 0; i < SALES_CHART_DAYS; i++) {
            LocalDate day = firstDay.plusDays(i);
            BigDecimal total = revenueByDay.getOrDefault(day, BigDecimal.ZERO);
            result.add(new DailyRevenueResponse(day, total));
        }

        return result;
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

}
