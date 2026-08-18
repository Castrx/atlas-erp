package com.atlas.backend.repository;

import com.atlas.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository
        extends JpaRepository<Customer, Long> {

    Optional<Customer> findByDocument(String document);

    boolean existsByDocument(String document);

    long countByActiveTrue();

    List<Customer> findByActiveTrue();

}
