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
import java.util.Map;
import java.util.stream.Collectors;

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

        // M5: cliente inativo não pode receber novas vendas. Vendas existentes
        // (histórico) e cancelamentos continuam funcionando — só o create rejeita.
        if (Boolean.FALSE.equals(customer.getActive())) {
            throw new BusinessException("Não é possível vender para um cliente inativo.");
        }

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

            Product product = productRepository.findByIdForUpdate(itemRequest.productId())
                    .orElseThrow(() ->
                            new BusinessException("Produto não encontrado."));

            // M5: produto inativo não pode ser vendido em novas vendas. O lock
            // pessimista é mantido — o cancelamento usa findByIdForUpdate sem
            // filtro e continua restaurando estoque de produto inativo.
            if (Boolean.FALSE.equals(product.getActive())) {
                throw new BusinessException("Não é possível vender para um produto inativo.");
            }

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

        List<Sale> sales = saleRepository.findByStatus(SaleStatus.ACTIVE);

        List<Long> saleIds = sales.stream().map(Sale::getId).toList();

        // Uma única consulta para os itens de TODAS as vendas (produto já
        // carregado via JOIN FETCH), em vez de uma consulta por venda —
        // corrige o N+1 que existia aqui. IN () vazio não é uma query
        // válida, então pula a consulta quando não há vendas.
        Map<Long, List<SaleItem>> itemsBySaleId = saleIds.isEmpty()
                ? Map.of()
                : saleItemRepository.findBySaleIdInWithProduct(saleIds)
                        .stream()
                        .collect(Collectors.groupingBy(item -> item.getSale().getId()));

        return sales.stream()
                .map(sale -> toResponse(sale, itemsBySaleId.getOrDefault(sale.getId(), List.of())))
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

            Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() ->
                            new BusinessException("Produto não encontrado."));

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

    /**
     * Usado por {@code create()}/{@code findById()} — sempre uma única
     * venda, então a consulta de itens aqui não é um N+1 (é feita uma vez).
     * {@code findAll()} usa a sobrecarga abaixo, com os itens já
     * pré-carregados em lote.
     */
    private SaleResponse toResponse(Sale sale) {
        return toResponse(sale, saleItemRepository.findBySale(sale));
    }

    private SaleResponse toResponse(Sale sale, List<SaleItem> saleItems) {

        List<SaleItemResponse> items = saleItems.stream()
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