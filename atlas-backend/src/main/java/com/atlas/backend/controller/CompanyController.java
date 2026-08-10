package com.atlas.backend.controller;

import com.atlas.backend.dto.company.CompanyResponse;
import com.atlas.backend.dto.company.CreateCompanyRequest;
import com.atlas.backend.dto.company.UpdateCompanyRequest;
import com.atlas.backend.entity.Company;
import com.atlas.backend.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Company create(@RequestBody @Valid CreateCompanyRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<CompanyResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public CompanyResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public CompanyResponse update(
            @PathVariable Long id,
            @RequestBody @Valid UpdateCompanyRequest request) {

        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

}