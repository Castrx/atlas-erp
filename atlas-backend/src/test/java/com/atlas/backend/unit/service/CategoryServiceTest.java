package com.atlas.backend.unit.service;

import com.atlas.backend.entity.Category;
import com.atlas.backend.exception.ResourceNotFoundException;
import com.atlas.backend.repository.CategoryRepository;
import com.atlas.backend.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários com Mockito — repositório mockado, sem Spring context,
 * sem banco. Cobre a inativação de Categoria (delete = active=false,
 * preservando o registro e os produtos já vinculados a ele — mesmo padrão
 * de ProductServiceTest/CustomerService).
 */
@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository repository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void delete_deveInativarCategoria_semRemoverDoBanco() {
        Category existente = Category.builder()
                .id(1L).name("Categoria").active(true)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        when(repository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        categoryService.delete(1L);

        assertThat(existente.getActive()).isFalse();
        verify(repository).save(existente);
        verify(repository, never()).delete(any());
    }

    @Test
    void delete_deveLancarResourceNotFoundException_quandoCategoriaNaoExiste() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.delete(404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Categoria não encontrada.");

        verify(repository, never()).save(any());
    }
}
