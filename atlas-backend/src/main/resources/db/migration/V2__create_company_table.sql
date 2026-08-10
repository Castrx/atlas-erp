CREATE TABLE company (
                         id BIGSERIAL PRIMARY KEY,
                         corporate_name VARCHAR(255) NOT NULL,
                         trade_name VARCHAR(255) NOT NULL,
                         cnpj VARCHAR(14) NOT NULL UNIQUE,
                         email VARCHAR(255) NOT NULL,
                         phone VARCHAR(20),
                         active BOOLEAN NOT NULL DEFAULT TRUE,
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);