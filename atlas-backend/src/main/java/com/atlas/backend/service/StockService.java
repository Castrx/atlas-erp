package com.atlas.backend.service;

import com.atlas.backend.dto.stock.StockMovementRequest;
import com.atlas.backend.dto.stock.StockMovementResponse;
import com.atlas.backend.entity.MovementType;
import com.atlas.backend.entity.Product;
import com.atlas.backend.entity.StockMovement;
import com.atlas.backend.entity.User;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.StockMovementRepository;
import com.atlas.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StockService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;

    @Transactional
    public void entry(StockMovementRequest request, Authentication authentication) {

        Product product = findProduct(request.productId());

        User user = findUser(authentication);

        product.setStock(product.getStock() + request.quantity());

        productRepository.save(product);

        saveMovement(
                product,
                user,
                request.quantity(),
                MovementType.ENTRY,
                request.reason()
        );
    }

    @Transactional
    public void exit(StockMovementRequest request, Authentication authentication) {

        Product product = findProduct(request.productId());

        if (product.getStock() < request.quantity()) {
            throw new BusinessException("Estoque insuficiente.");
        }

        User user = findUser(authentication);

        product.setStock(product.getStock() - request.quantity());

        productRepository.save(product);

        saveMovement(
                product,
                user,
                request.quantity(),
                MovementType.EXIT,
                request.reason()
        );
    }

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> history(int page, int size) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return stockMovementRepository
                .findAll(pageable)
                .map(movement -> new StockMovementResponse(
                        movement.getId(),
                        movement.getProduct().getId(),
                        movement.getProduct().getName(),
                        movement.getType(),
                        movement.getQuantity(),
                        movement.getReason(),
                        movement.getCreatedBy(),
                        movement.getCreatedAt()
                ));
    }

    private Product findProduct(Long id) {

        return productRepository.findByIdForUpdate(id)
                .orElseThrow(() ->
                        new BusinessException("Produto não encontrado."));
    }

    private User findUser(Authentication authentication) {

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new BusinessException("Usuário não encontrado."));
    }

    private void saveMovement(
            Product product,
            User user,
            Integer quantity,
            MovementType type,
            String reason
    ) {

        StockMovement movement = StockMovement.builder()
                .product(product)
                .quantity(quantity)
                .type(type)
                .reason(reason)
                .createdBy(user.getEmail())
                .build();

        stockMovementRepository.save(movement);
    }
}