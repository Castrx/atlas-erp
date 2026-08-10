CREATE TABLE sale (

                      id BIGSERIAL PRIMARY KEY,

                      customer_id BIGINT NOT NULL,

                      total DECIMAL(12,2) NOT NULL,

                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                      created_by VARCHAR(100) NOT NULL,

                      CONSTRAINT fk_sale_customer
                          FOREIGN KEY (customer_id)
                              REFERENCES customer(id)

);