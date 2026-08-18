package com.atlas.backend.repository;

import com.atlas.backend.entity.Sale;
import com.atlas.backend.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findBySale(Sale sale);

    /**
     * Busca os itens de várias vendas em uma única consulta (com o produto
     * já carregado via {@code JOIN FETCH}), em vez de uma consulta por
     * venda — usado por {@code SaleService.findAll()} para não repetir o
     * N+1 que existia ali (uma {@link #findBySale} por venda). {@code
     * findBySale} continua existindo e em uso por
     * {@code SaleService.cancel()}, que trata sempre uma única venda.
     */
    @Query("""
            SELECT si FROM SaleItem si
            JOIN FETCH si.product
            WHERE si.sale.id IN :saleIds
            ORDER BY si.id
            """)
    List<SaleItem> findBySaleIdInWithProduct(@Param("saleIds") List<Long> saleIds);

}