CREATE INDEX idx_sale_status_created_at
    ON sale (status, created_at DESC);
