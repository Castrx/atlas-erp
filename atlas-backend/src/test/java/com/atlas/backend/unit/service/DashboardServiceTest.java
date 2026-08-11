package com.atlas.backend.unit.service;

import com.atlas.backend.dto.dashboard.DashboardResponse;
import com.atlas.backend.entity.SaleStatus;
import com.atlas.backend.repository.CompanyRepository;
import com.atlas.backend.repository.CustomerRepository;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.SaleRepository;
import com.atlas.backend.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Testes unitários com Mockito — repositórios mockados, sem Spring context,
 * sem banco. Foco nas duas áreas do DashboardService que já tiveram bugs
 * reais na Sprint 3A (registrados em ROADMAP.md): faturamento nulo tratado
 * como zero, e preenchimento dos dias sem venda no gráfico de 7 dias.
 */
@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private SaleRepository saleRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private void mockAgregadosBasicos() {
        when(productRepository.countByActiveTrue()).thenReturn(0L);
        when(productRepository.countLowStockProducts()).thenReturn(0L);
        when(customerRepository.countByActiveTrue()).thenReturn(0L);
        when(companyRepository.countByActiveTrue()).thenReturn(0L);
        when(saleRepository.countByStatus(SaleStatus.ACTIVE)).thenReturn(0L);
        when(productRepository.findLowStockProducts(any())).thenReturn(List.of());
        when(saleRepository.findRecentSales(any())).thenReturn(List.of());
    }

    @Test
    void getDashboard_deveTratarFaturamentoNulo_comoZero() {
        mockAgregadosBasicos();
        when(saleRepository.getRevenueSince(any())).thenReturn(null);
        when(saleRepository.getDailyRevenueSince(any())).thenReturn(List.of());

        DashboardResponse response = dashboardService.getDashboard();

        assertThat(response.todayRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.monthRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getDashboard_devePreencherDiasSemVenda_comZeroNoGraficoDe7Dias() {
        mockAgregadosBasicos();
        when(saleRepository.getRevenueSince(any())).thenReturn(BigDecimal.ZERO);

        LocalDate hoje = LocalDate.now();
        Object[] unicaLinhaComVenda = new Object[]{Date.valueOf(hoje), new BigDecimal("150.00")};
        when(saleRepository.getDailyRevenueSince(any()))
                .thenReturn(java.util.Collections.singletonList(unicaLinhaComVenda));

        DashboardResponse response = dashboardService.getDashboard();

        assertThat(response.salesLast7Days()).hasSize(7);

        assertThat(response.salesLast7Days())
                .filteredOn(dia -> dia.date().equals(hoje))
                .extracting(dia -> dia.total())
                .containsExactly(new BigDecimal("150.00"));

        long diasSemVendaComZero = response.salesLast7Days().stream()
                .filter(dia -> !dia.date().equals(hoje))
                .filter(dia -> dia.total().compareTo(BigDecimal.ZERO) == 0)
                .count();

        assertThat(diasSemVendaComZero).isEqualTo(6);
    }

    @Test
    void getDashboard_deveRepassarContadoresAgregados_semAlteraLos() {
        when(productRepository.countByActiveTrue()).thenReturn(42L);
        when(productRepository.countLowStockProducts()).thenReturn(3L);
        when(customerRepository.countByActiveTrue()).thenReturn(7L);
        when(companyRepository.countByActiveTrue()).thenReturn(1L);
        when(saleRepository.countByStatus(SaleStatus.ACTIVE)).thenReturn(5L);
        when(saleRepository.getRevenueSince(any())).thenReturn(BigDecimal.TEN);
        when(productRepository.findLowStockProducts(any())).thenReturn(List.of());
        when(saleRepository.findRecentSales(any())).thenReturn(List.of());
        when(saleRepository.getDailyRevenueSince(any())).thenReturn(List.of());

        DashboardResponse response = dashboardService.getDashboard();

        assertThat(response.totalProducts()).isEqualTo(42L);
        assertThat(response.lowStockCount()).isEqualTo(3L);
        assertThat(response.totalActiveCustomers()).isEqualTo(7L);
        assertThat(response.totalActiveCompanies()).isEqualTo(1L);
        assertThat(response.totalActiveSales()).isEqualTo(5L);
    }
}
