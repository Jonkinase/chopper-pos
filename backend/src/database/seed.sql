-- ------------------------------------------------------------------------
-- DATOS SEMILLA INICIALES (Seed Data)
-- ------------------------------------------------------------------------

-- 1. Insertar Sucursal de Ejemplo
INSERT INTO branches (id, name, address) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Sucursal Central', 'Avenida Principal 123');

-- 2. Insertar Usuario Administrador
-- Password: admin123 (hasheado con bcryptjs - salt de 10)
INSERT INTO users (id, branch_id, role, name, email, password_hash)
VALUES ('22222222-2222-2222-2222-222222222222', NULL, 'admin', 'Administrador Principal', 'admin@chopper.com', '$2b$10$TF01RJxoAEayxdSIStethuqLDhsmVrGnZr4.xBJNRlw1S84q.YC8W');

-- 3. Insertar Productos de Ejemplo
INSERT INTO products (id, name, type, cost, description) VALUES
('33333333-3333-3333-3333-333333333331', 'Cloro Concentrado', 'liquido', 10.00, 'Cloro para limpieza general a granel'),
('33333333-3333-3333-3333-333333333332', 'Jabón en Polvo Ropa Color', 'seco', 22.00, 'Jabón para ropa en polvo premium'),
('33333333-3333-3333-3333-333333333333', 'Alimento para Perro Adulto', 'alimento', 35.00, 'Alimento balanceado a granel');

-- 4. Insertar Inventario para la Sucursal Central
INSERT INTO inventory (branch_id, product_id, retail_price, wholesale_price, wholesale_min_qty, stock_actual) VALUES
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 18.00, 15.00, 5.000, 200.000), -- 200 litros
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', 35.00, 30.00, 10.000, 50.000), -- 50 unidades
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 55.00, 48.00, 20.000, 150.000); -- 150 kg
