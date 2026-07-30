package com.atlas.backend.service;

import com.atlas.backend.dto.company.CompanyResponse;
import com.atlas.backend.dto.company.CreateCompanyRequest;
import com.atlas.backend.dto.company.UpdateCompanyRequest;
import com.atlas.backend.entity.Company;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.exception.ResourceNotFoundException;
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
            throw new BusinessException("Já existe uma empresa cadastrada com este CNPJ.");
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
                .map(this::toResponse)
                .toList();
    }

    public CompanyResponse findById(Long id) {

        Company company = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Empresa não encontrada."));

        return toResponse(company);
    }

    public CompanyResponse update(Long id, UpdateCompanyRequest request) {

        Company company = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Empresa não encontrada."));

        if (!company.getCnpj().equals(request.cnpj())
                && repository.existsByCnpj(request.cnpj())) {
            throw new BusinessException("Já existe uma empresa cadastrada com este CNPJ.");
        }

        company.setCorporateName(request.corporateName());
        company.setTradeName(request.tradeName());
        company.setCnpj(request.cnpj());
        company.setEmail(request.email());
        company.setPhone(request.phone());

        Company updatedCompany = repository.save(company);

        return toResponse(updatedCompany);
    }

    public void delete(Long id) {

        Company company = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Empresa não encontrada."));

        repository.delete(company);
    }

    private CompanyResponse toResponse(Company company) {

        return new CompanyResponse(
                company.getId(),
                company.getCorporateName(),
                company.getTradeName(),
                company.getCnpj(),
                company.getEmail(),
                company.getPhone(),
                company.getActive()
        );
    }

}