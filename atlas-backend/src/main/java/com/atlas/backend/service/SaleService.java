package com.atlas.backend.service;

import com.atlas.backend.dto.sale.SaleItemRequest;
import com.atlas.backend.dto.sale.SaleItemResponse;
import com.atlas.backend.dto.sale.SaleRequest;
import com.atlas.backend.dto.sale.SaleResponse;
import com.atlas.backend.entity.*;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;

    @Transactional
    public SaleResponse create(
            SaleRequest request,
            Authentication authentication
    ) {

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado."));

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new BusinessException("Usuário não encontrado."));

        Sale sale = Sale.builder()
                .customer(customer)
                .createdBy(user.getEmail())
                .createdAt(LocalDateTime.now())
                .total(BigDecimal.ZERO)
                .status(SaleStatus.ACTIVE)
                .build();

        sale = saleRepository.save(sale);

        BigDecimal total = BigDecimal.ZERO;

        List<SaleItemResponse> itemsResponse = new ArrayList<>();

        for (SaleItemRequest itemRequest : request.items()) {

            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() ->
                            new BusinessException("Produto não encontrado."));

            if (product.getStock() < itemRequest.quantity()) {
                throw new BusinessException(
                        "Estoque insuficiente para o produto: " + product.getName()
                );
            }

            BigDecimal subtotal = product.getSalePrice()
                    .multiply(BigDecimal.valueOf(itemRequest.quantity()));

            SaleItem saleItem = SaleItem.builder()
                    .sale(sale)
                    .product(product)
                    .quantity(itemRequest.quantity())
                    .unitPrice(product.getSalePrice())
                    .subtotal(subtotal)
                    .build();

            saleItemRepository.save(saleItem);

            product.setStock(product.getStock() - itemRequest.quantity());

            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .product(product)
                    .quantity(itemRequest.quantity())
                    .type(MovementType.EXIT)
                    .reason("Venda #" + sale.getId())
                    .createdBy(user.getEmail())
                    .build();

            stockMovementRepository.save(movement);

            total = total.add(subtotal);

            itemsResponse.add(
                    new SaleItemResponse(
                            product.getId(),
                            product.getName(),
                            itemRequest.quantity(),
                            product.getSalePrice(),
                            subtotal
                    )
            );
        }

        sale.setTotal(total);

        saleRepository.save(sale);

        return toResponse(sale);
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> findAll() {

        return saleRepository.findByStatus(SaleStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();

    }

    @Transactional(readOnly = true)
    public SaleResponse findById(Long id) {

        Sale sale = saleRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Venda não encontrada."));

        return toResponse(sale);

    }

    @Transactional
    public void cancel(Long id, Authentication authentication) {

        Sale sale = saleRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Venda não encontrada."));

        if (sale.getStatus() == SaleStatus.CANCELED) {
            throw new BusinessException("A venda já está cancelada.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new BusinessException("Usuário não encontrado."));

        List<SaleItem> items = saleItemRepository.findBySale(sale);

        for (SaleItem item : items) {

            Product product = item.getProduct();

            product.setStock(product.getStock() + item.getQuantity());

            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .product(product)
                    .quantity(item.getQuantity())
                    .type(MovementType.ENTRY)
                    .reason("Cancelamento da Venda #" + sale.getId())
                    .createdBy(user.getEmail())
                    .build();

            stockMovementRepository.save(movement);
        }

        sale.setStatus(SaleStatus.CANCELED);

        saleRepository.save(sale);
    }

    private SaleResponse toResponse(Sale sale) {

        List<SaleItemResponse> items = saleItemRepository.findBySale(sale)
                .stream()
                .map(item -> new SaleItemResponse(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                ))
                .toList();

        return new SaleResponse(
                sale.getId(),
                sale.getCustomer().getId(),
                sale.getCustomer().getName(),
                sale.getTotal(),
                sale.getCreatedBy(),
                sale.getCreatedAt(),
                items
        );

    }

}