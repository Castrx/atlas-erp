package com.atlas.backend.controller;

import com.atlas.backend.dto.auth.LoginRequest;
import com.atlas.backend.dto.auth.LoginResponse;
import com.atlas.backend.dto.auth.RegisterRequest;
import com.atlas.backend.dto.user.UserResponse;
import com.atlas.backend.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {

        return authenticationService.register(request);

    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {

        return authenticationService.login(request);

    }

}