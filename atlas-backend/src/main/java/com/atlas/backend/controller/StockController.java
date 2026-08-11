package com.atlas.backend.controller;

import com.atlas.backend.dto.stock.StockMovementRequest;
import com.atlas.backend.dto.stock.StockMovementResponse;
import com.atlas.backend.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Movimentação de estoque - operação do dia a dia, aberta a USER e ADMIN
 * (matriz de permissões em docs/architecture.md).
 */
@RestController
@RequestMapping("/stock")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('USER','ADMIN')")
public class StockController {

    private final StockService stockService;

    @PostMapping("/entry")
    public ResponseEntity<Void> entry(
            @Valid @RequestBody StockMovementRequest request,
            Authentication authentication
    ) {

        stockService.entry(request, authentication);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/exit")
    public ResponseEntity<Void> exit(
            @Valid @RequestBody StockMovementRequest request,
            Authentication authentication
    ) {

        stockService.exit(request, authentication);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/history")
    public ResponseEntity<Page<StockMovementResponse>> history(

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size

    ) {

        return ResponseEntity.ok(
                stockService.history(page, size)
        );

    }

}