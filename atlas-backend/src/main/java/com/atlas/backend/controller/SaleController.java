package com.atlas.backend.controller;

import com.atlas.backend.dto.sale.SaleRequest;
import com.atlas.backend.dto.sale.SaleResponse;
import com.atlas.backend.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable Long id,
            Authentication authentication
    ) {

        saleService.cancel(id, authentication);

        return ResponseEntity.noContent().build();

    }

}