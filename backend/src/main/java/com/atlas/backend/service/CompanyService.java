package com.atlas.backend.service;

import com.atlas.backend.dto.company.CompanyResponse;
import com.atlas.backend.dto.company.CreateCompanyRequest;
import com.atlas.backend.entity.Company;
import com.atlas.backend.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository repository;

    public Company create(CreateCompanyRequest request) {

        if (repository.existsByCnpj(request.cnpj())) {
            throw new RuntimeException("CNPJ já cadastrado.");
        }

        Company company = Company.builder()
                .corporateName(request.corporateName())
                .tradeName(request.tradeName())
                .cnpj(request.cnpj())
                .email(request.email())
                .phone(request.phone())
                .build();

        return repository.save(company);
    }

    public List<CompanyResponse> findAll() {

        return repository.findAll()
                .stream()
                .map(company -> new CompanyResponse(
                        company.getId(),
                        company.getCorporateName(),
                        company.getTradeName(),
                        company.getCnpj(),
                        company.getEmail(),
                        company.getPhone(),
                        company.getActive()
                ))
                .toList();
    }

}