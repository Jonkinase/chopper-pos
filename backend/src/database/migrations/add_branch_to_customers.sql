ALTER TABLE customers ADD COLUMN branch_id UUID REFERENCES branches(id);
CREATE INDEX idx_customers_branch_id ON customers(branch_id);
