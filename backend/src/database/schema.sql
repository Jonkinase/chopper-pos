CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------
-- SUCURSALES (Branches)
-- ------------------------------------------------------------------------
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    logo_url TEXT,
    razon_social VARCHAR(255),
    cuit VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------
-- USUARIOS (Users)
-- ------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'encargado', 'cajero');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id), -- Nullable para admins (acceso global)
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------
-- PRODUCTOS GLOBALES (Products)
-- ------------------------------------------------------------------------
CREATE TYPE product_type AS ENUM ('liquido', 'seco', 'alimento');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type product_type NOT NULL,
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Costo global para cálculo de márgenes
    description TEXT,
    unidad_display VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------
-- INVENTARIO POR SUCURSAL (Inventory)
-- ------------------------------------------------------------------------
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id),
    product_id UUID NOT NULL REFERENCES products(id),
    retail_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    wholesale_price DECIMAL(12, 2),
    wholesale_min_qty DECIMAL(10, 3), -- Cantidad mínima para activar mayoreo
    stock_actual DECIMAL(10, 3) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10, 3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(branch_id, product_id)
);

-- ------------------------------------------------------------------------
-- CLIENTES (Customers)
-- ------------------------------------------------------------------------
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------
-- CUENTAS CORRIENTES (Customer Accounts)
-- ------------------------------------------------------------------------
CREATE TABLE customer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id),
    current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------
-- VENTAS (Sales)
-- ------------------------------------------------------------------------
CREATE TYPE sale_status AS ENUM ('completada', 'anulada');
CREATE TYPE payment_method AS ENUM ('contado', 'cuenta_corriente', 'tarjeta', 'transferencia');

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id),
    user_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    quote_id UUID REFERENCES quotes(id),
    status sale_status NOT NULL DEFAULT 'completada',
    payment_method payment_method NOT NULL,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------
-- ITEMS DE VENTA (Sale Items)
-- ------------------------------------------------------------------------
CREATE TYPE price_type AS ENUM ('menudeo', 'mayoreo');
CREATE TYPE unit_type AS ENUM ('litros', 'unidades', 'kilogramos');

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id),
    product_id UUID NOT NULL REFERENCES products(id),
    unit_type unit_type NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price_applied DECIMAL(12, 2) NOT NULL,
    price_type price_type NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------
-- MOVIMIENTOS DE CUENTA (Account Movements)
-- ------------------------------------------------------------------------
CREATE TYPE movement_type AS ENUM ('cargo', 'abono');

CREATE TABLE account_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES customer_accounts(id),
    sale_id UUID REFERENCES sales(id), -- En caso de que el cargo provenga de una venta
    type movement_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------
-- PRESUPUESTOS (Quotes)
-- ------------------------------------------------------------------------
CREATE TYPE quote_status AS ENUM ('borrador', 'enviado', 'aprobado', 'rechazado', 'convertido_a_venta');

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id),
    user_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    status quote_status NOT NULL DEFAULT 'borrador',
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id),
    product_id UUID NOT NULL REFERENCES products(id),
    unit_type unit_type NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price_applied DECIMAL(12, 2) NOT NULL,
    price_type price_type NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------
-- MOVIMIENTOS DE INVENTARIO (Inventory Movements)
-- ------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------
-- TRIGGERS PARA UPDATED_AT
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_branches_modtime BEFORE UPDATE ON branches FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_modtime BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_customer_accounts_modtime BEFORE UPDATE ON customer_accounts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_sales_modtime BEFORE UPDATE ON sales FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_quotes_modtime BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
