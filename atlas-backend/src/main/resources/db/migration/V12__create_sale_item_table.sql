CREATE TABLE sale_item (

                           id BIGSERIAL PRIMARY KEY,

                           sale_id BIGINT NOT NULL,

                           product_id BIGINT NOT NULL,

                           quantity INTEGER NOT NULL,

                           unit_price DECIMAL(12,2) NOT NULL,

                           subtotal DECIMAL(12,2) NOT NULL,

                           CONSTRAINT fk_sale_item_sale
                               FOREIGN KEY (sale_id)
                                   REFERENCES sale(id),

                           CONSTRAINT fk_sale_item_product
                               FOREIGN KEY (product_id)
                                   REFERENCES product(id)

);