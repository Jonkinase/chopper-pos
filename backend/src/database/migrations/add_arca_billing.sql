ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cuit VARCHAR(32);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS iva_condition VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fiscal_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_billing_status') THEN
    CREATE TYPE sale_billing_status AS ENUM ('pending', 'approved', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sale_billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL UNIQUE REFERENCES sales(id) ON DELETE CASCADE,
  billing_status sale_billing_status NOT NULL DEFAULT 'pending',
  invoice_type VARCHAR(1) NOT NULL,
  condicion_venta VARCHAR(100),
  request_payload JSONB,
  response_payload JSONB,
  last_error TEXT,
  cae VARCHAR(64),
  cae_vto DATE,
  comprobante_nro BIGINT,
  punto_venta INTEGER,
  tipo_comprobante INTEGER,
  fecha_emision DATE,
  periodo_desde DATE,
  periodo_hasta DATE,
  approved_net_amount DECIMAL(12, 2),
  approved_vat_amount DECIMAL(12, 2),
  approved_total_amount DECIMAL(12, 2),
  receiver_name VARCHAR(255),
  receiver_business_name VARCHAR(255),
  receiver_cuit VARCHAR(32),
  receiver_iva_condition VARCHAR(100),
  receiver_fiscal_address TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_sale_billing_modtime'
  ) THEN
    CREATE TRIGGER update_sale_billing_modtime
    BEFORE UPDATE ON sale_billing
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;
END $$;
