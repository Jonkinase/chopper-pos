-- Actualización de esquema para Prompt 3

-- Agregar columnas a branches
ALTER TABLE branches ADD COLUMN phone VARCHAR(50);
ALTER TABLE branches ADD COLUMN logo_url TEXT;
ALTER TABLE branches ADD COLUMN razon_social VARCHAR(255);
ALTER TABLE branches ADD COLUMN cuit VARCHAR(50);

-- Agregar columnas a products
ALTER TABLE products ADD COLUMN unidad_display VARCHAR(50);
ALTER TABLE products ADD COLUMN active BOOLEAN DEFAULT TRUE;

-- Agregar columnas a inventory
ALTER TABLE inventory ADD COLUMN stock_minimo DECIMAL(10, 3) DEFAULT 0;

-- Crear tabla de movimientos de inventario
CREATE TYPE inventory_movement_type AS ENUM ('ajuste_manual', 'entrada', 'salida', 'devolucion', 'venta');

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES inventory(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type inventory_movement_type NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL, -- Positivo o negativo
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
