CREATE TABLE product (

                         id BIGSERIAL PRIMARY KEY,

                         name VARCHAR(150) NOT NULL,
                         description VARCHAR(255),

                         sku VARCHAR(50) NOT NULL UNIQUE,
                         barcode VARCHAR(50),

                         cost_price NUMERIC(10,2) NOT NULL,
                         sale_price NUMERIC(10,2) NOT NULL,

                         stock INTEGER NOT NULL DEFAULT 0,
                         minimum_stock INTEGER NOT NULL DEFAULT 0,

                         active BOOLEAN NOT NULL DEFAULT TRUE,

                         category_id BIGINT NOT NULL,

                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                         CONSTRAINT fk_product_category
                             FOREIGN KEY (category_id)
                                 REFERENCES category(id)
);