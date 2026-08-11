package com.atlas.backend.controller;

import com.atlas.backend.dto.sale.SaleRequest;
import com.atlas.backend.dto.sale.SaleResponse;
import com.atlas.backend.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Vendas - registro e consulta são operação do dia a dia (USER e ADMIN).
 * Cancelamento é ADMIN-only por ser reversão financeira (matriz de
 * permissões em docs/architecture.md).
 */
@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('USER','ADMIN')")
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    public ResponseEntity<SaleResponse> create(
            @Valid @RequestBody SaleRequest request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                saleService.create(request, authentication)
        );

    }

    @GetMapping
    public ResponseEntity<List<SaleResponse>> findAll() {

        return ResponseEntity.ok(
                saleService.findAll()
        );

    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> findById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                saleService.findById(id)
        );

    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable Long id,
            Authentication authentication
    ) {

        saleService.cancel(id, authentication);

        return ResponseEntity.noContent().build();

    }

}