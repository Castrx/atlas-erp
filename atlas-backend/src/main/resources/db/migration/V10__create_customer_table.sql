CREATE TABLE customer (

                          id BIGSERIAL PRIMARY KEY,

                          name VARCHAR(150) NOT NULL,

                          email VARCHAR(150),

                          phone VARCHAR(20),

                          document VARCHAR(20) NOT NULL UNIQUE,

                          active BOOLEAN NOT NULL DEFAULT TRUE,

                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

);