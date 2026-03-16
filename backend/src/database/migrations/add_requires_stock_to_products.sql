-- Migration: Add requires_stock to products
ALTER TABLE products ADD COLUMN requires_stock BOOLEAN DEFAULT TRUE;
