package com.atlas.backend.repository;

import com.atlas.backend.entity.Sale;
import com.atlas.backend.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findBySale(Sale sale);

}