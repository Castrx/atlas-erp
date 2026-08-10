CREATE TABLE stock_movements (

                                 id BIGSERIAL PRIMARY KEY,

                                 product_id BIGINT NOT NULL,

                                 quantity INTEGER NOT NULL,

                                 type VARCHAR(20) NOT NULL,

                                 reason VARCHAR(255) NOT NULL,

                                 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 created_by VARCHAR(100) NOT NULL,

                                 CONSTRAINT fk_stock_product
                                     FOREIGN KEY (product_id)
                                         REFERENCES product(id)

);