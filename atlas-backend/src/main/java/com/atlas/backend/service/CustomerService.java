package com.atlas.backend.service;

import com.atlas.backend.dto.customer.CustomerRequest;
import com.atlas.backend.dto.customer.CustomerResponse;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerResponse create(CustomerRequest request) {

        if (customerRepository.existsByDocument(request.document())) {
            throw new BusinessException("Já existe um cliente com este documento.");
        }

        Customer customer = Customer.builder()
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .document(request.document())
                .build();

        customer = customerRepository.save(customer);

        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> findAll() {

        return customerRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {

        Customer customer = findCustomer(id);

        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {

        Customer customer = findCustomer(id);

        if (!customer.getDocument().equals(request.document())
                && customerRepository.existsByDocument(request.document())) {

            throw new BusinessException("Já existe um cliente com este documento.");
        }

        customer.setName(request.name());
        customer.setEmail(request.email());
        customer.setPhone(request.phone());
        customer.setDocument(request.document());

        customer = customerRepository.save(customer);

        return toResponse(customer);
    }

    @Transactional
    public void delete(Long id) {

        Customer customer = findCustomer(id);

        customer.setActive(false);

        customerRepository.save(customer);
    }

    private Customer findCustomer(Long id) {

        return customerRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado."));
    }

    private CustomerResponse toResponse(Customer customer) {

        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getDocument(),
                customer.getActive(),
                customer.getCreatedAt()
        );
    }

}