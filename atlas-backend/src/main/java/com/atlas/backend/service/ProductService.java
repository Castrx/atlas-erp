package com.atlas.backend.service;

import com.atlas.backend.dto.product.CreateProductRequest;
import com.atlas.backend.dto.product.ProductResponse;
import com.atlas.backend.dto.product.UpdateProductRequest;
import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Product;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.repository.CategoryRepository;
import com.atlas.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductResponse create(CreateProductRequest request) {

        if (productRepository.existsBySku(request.sku())) {
            throw new BusinessException("Já existe um produto com este SKU.");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessException("Categoria não encontrada."));

        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .sku(request.sku())
                .barcode(request.barcode())
                .costPrice(request.costPrice())
                .salePrice(request.salePrice())
                .stock(request.stock() == null ? 0 : request.stock())
                .minimumStock(request.minimumStock() == null ? 0 : request.minimumStock())
                .category(category)
                .build();

        productRepository.save(product);

        return toResponse(product);
    }

    public List<ProductResponse> findAll() {
        return productRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse findById(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Produto não encontrado."));

        return toResponse(product);
    }

    public ProductResponse update(Long id, UpdateProductRequest request) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Produto não encontrado."));

        if (!product.getSku().equals(request.sku())
                && productRepository.existsBySku(request.sku())) {
            throw new BusinessException("Já existe um produto com este SKU.");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessException("Categoria não encontrada."));

        product.setName(request.name());
        product.setDescription(request.description());
        product.setSku(request.sku());
        product.setBarcode(request.barcode());
        product.setCostPrice(request.costPrice());
        product.setSalePrice(request.salePrice());
        // M4: NÃO chamar setStock() aqui — estoque é imutável no update de
        // produto e só muda pelos fluxos de estoque (StockService, venda,
        // cancelamento), que mantêm o StockMovement como trilha.
        product.setMinimumStock(request.minimumStock());
        product.setCategory(category);

        productRepository.save(product);

        return toResponse(product);
    }

    public void delete(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Produto não encontrado."));

        productRepository.delete(product);
    }

    private ProductResponse toResponse(Product product) {

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getSku(),
                product.getBarcode(),
                product.getCostPrice(),
                product.getSalePrice(),
                product.getStock(),
                product.getMinimumStock(),
                product.getActive(),
                product.getCategory().getId(),
                product.getCategory().getName()
        );
    }
}