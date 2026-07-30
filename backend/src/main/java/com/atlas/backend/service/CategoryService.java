package com.atlas.backend.service;

import com.atlas.backend.dto.category.CategoryResponse;
import com.atlas.backend.dto.category.CreateCategoryRequest;
import com.atlas.backend.dto.category.UpdateCategoryRequest;
import com.atlas.backend.entity.Category;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.exception.ResourceNotFoundException;
import com.atlas.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;

    public Category create(CreateCategoryRequest request) {

        if (repository.existsByNameIgnoreCase(request.name())) {
            throw new BusinessException("Já existe uma categoria com este nome.");
        }

        Category category = Category.builder()
                .name(request.name())
                .description(request.description())
                .build();

        return repository.save(category);
    }

    public List<CategoryResponse> findAll() {

        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse findById(Long id) {

        Category category = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Categoria não encontrada."));

        return toResponse(category);
    }

    public CategoryResponse update(Long id, UpdateCategoryRequest request) {

        Category category = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Categoria não encontrada."));

        if (!category.getName().equalsIgnoreCase(request.name())
                && repository.existsByNameIgnoreCase(request.name())) {
            throw new BusinessException("Já existe uma categoria com este nome.");
        }

        category.setName(request.name());
        category.setDescription(request.description());

        return toResponse(repository.save(category));
    }

    public void delete(Long id) {

        Category category = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Categoria não encontrada."));

        repository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getActive()
        );
    }

}