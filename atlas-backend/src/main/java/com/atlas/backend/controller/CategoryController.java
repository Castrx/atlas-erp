package com.atlas.backend.controller;

import com.atlas.backend.dto.category.CategoryResponse;
import com.atlas.backend.dto.category.CreateCategoryRequest;
import com.atlas.backend.dto.category.UpdateCategoryRequest;
import com.atlas.backend.entity.Category;
import com.atlas.backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Categorias - leitura aberta a USER e ADMIN (usada no cadastro de
 * Produtos); escrita (estrutura do catálogo) é ADMIN-only (matriz de
 * permissões em docs/architecture.md).
 */
@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Category create(@RequestBody @Valid CreateCategoryRequest request) {
        return service.create(request);
    }

    @PreAuthorize("hasAnyAuthority('USER','ADMIN')")
    @GetMapping
    public List<CategoryResponse> findAll() {
        return service.findAll();
    }

    @PreAuthorize("hasAnyAuthority('USER','ADMIN')")
    @GetMapping("/{id}")
    public CategoryResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}")
    public CategoryResponse update(
            @PathVariable Long id,
            @RequestBody @Valid UpdateCategoryRequest request) {

        return service.update(id, request);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

}