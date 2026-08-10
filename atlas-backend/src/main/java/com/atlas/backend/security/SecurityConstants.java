package com.atlas.backend.security;

public final class SecurityConstants {

    private SecurityConstants() {
    }

    public static final String SECRET_KEY =
            "atlas-erp-secret-key-2026-super-secure-change-in-production";

    public static final long JWT_EXPIRATION =
            1000 * 60 * 60 * 24;

    public static final String TOKEN_PREFIX = "Bearer ";

    public static final String HEADER = "Authorization";

}