package com.atlas.backend.controller;

import com.atlas.backend.dto.company.CompanyResponse;
import com.atlas.backend.dto.company.CreateCompanyRequest;
import com.atlas.backend.entity.Company;
import com.atlas.backend.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService service;

    @PostMapping
    public Company create(@RequestBody @Valid CreateCompanyRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<CompanyResponse> findAll() {
        return service.findAll();
    }

}