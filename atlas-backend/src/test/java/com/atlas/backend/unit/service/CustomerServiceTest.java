package com.atlas.backend.unit.service;

import com.atlas.backend.dto.customer.CustomerRequest;
import com.atlas.backend.dto.customer.CustomerResponse;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.repository.CustomerRepository;
import com.atlas.backend.service.CustomerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários com Mockito — repositório mockado, sem Spring context,
 * sem banco. Cobre as regras de negócio reais de Cliente: documento
 * duplicado, o cuidado de não disparar duplicidade quando o documento não
 * muda no update, e o comportamento de exclusão lógica (soft delete).
 */
@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerService customerService;

    @Test
    void create_deveLancarBusinessException_quandoDocumentoJaExiste() {
        CustomerRequest request = new CustomerRequest("Cliente", "c@teste.local", "51999999999", "12345678900");

        when(customerRepository.existsByDocument("12345678900")).thenReturn(true);

        assertThatThrownBy(() -> customerService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Já existe um cliente com este documento.");

        verify(customerRepository, never()).save(any());
    }

    @Test
    void create_devePersistirCliente_quandoDocumentoNovo() {
        CustomerRequest request = new CustomerRequest("Cliente Novo", "novo@teste.local", "51988887777", "98765432100");

        when(customerRepository.existsByDocument("98765432100")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerResponse response = customerService.create(request);

        assertThat(response.name()).isEqualTo("Cliente Novo");
        assertThat(response.document()).isEqualTo("98765432100");
    }

    @Test
    void update_naoDeveVerificarDuplicidade_quandoDocumentoPermaneceOMesmo() {
        Customer existente = Customer.builder()
                .id(1L).name("Antigo").document("12345678900").active(true).build();

        CustomerRequest request = new CustomerRequest("Atualizado", "e@teste.local", "51999999999", "12345678900");

        when(customerRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerResponse response = customerService.update(1L, request);

        assertThat(response.name()).isEqualTo("Atualizado");
        verify(customerRepository, never()).existsByDocument(anyString());
    }

    @Test
    void update_deveLancarBusinessException_quandoNovoDocumentoJaPertenceAOutroCliente() {
        Customer existente = Customer.builder().id(1L).document("12345678900").active(true).build();
        CustomerRequest request = new CustomerRequest("Nome", "e@teste.local", "51999999999", "99999999999");

        when(customerRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(customerRepository.existsByDocument("99999999999")).thenReturn(true);

        assertThatThrownBy(() -> customerService.update(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Já existe um cliente com este documento.");

        verify(customerRepository, never()).save(any());
    }

    @Test
    void delete_deveDesativarCliente_emVezDeExcluirFisicamente() {
        Customer existente = Customer.builder().id(1L).document("12345678900").active(true).build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        customerService.delete(1L);

        assertThat(existente.getActive()).isFalse();
        verify(customerRepository).save(existente);
        verify(customerRepository, never()).deleteById(anyLong());
    }

    @Test
    void findById_deveLancarBusinessException_quandoClienteNaoExiste() {
        when(customerRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.findById(404L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Cliente não encontrado.");
    }

    @Test
    void findAll_deveRetornarApenasClientesAtivos_consultandoFindByActiveTrue() {
        Customer ativo = Customer.builder()
                .id(1L).name("Ativo").document("11111111111").active(true).build();

        when(customerRepository.findByActiveTrue()).thenReturn(List.of(ativo));

        List<CustomerResponse> response = customerService.findAll();

        assertThat(response).hasSize(1);
        assertThat(response.get(0).name()).isEqualTo("Ativo");
        assertThat(response.get(0).active()).isTrue();

        // A listagem não deve mais depender de findAll() (que traria
        // inativos também) — só findByActiveTrue().
        verify(customerRepository, never()).findAll();
    }
}
