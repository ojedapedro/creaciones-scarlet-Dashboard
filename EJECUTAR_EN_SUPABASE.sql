-- =========================================================================
-- CREACIONES SCARLET — MÓDULO DE INVENTARIO
-- Ejecuta este SQL en el Editor SQL de Supabase antes de usar el dashboard
-- =========================================================================

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact TEXT,
    phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Movimientos de Inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('compra', 'produccion_taller', 'ajuste')),
    quantity INT NOT NULL,
    unit_cost_usd NUMERIC(10, 2),
    total_cost_usd NUMERIC(10, 2),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    notes TEXT,
    registered_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas: solo usuarios autenticados
CREATE POLICY "auth_select_suppliers" ON suppliers
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_suppliers" ON suppliers
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_suppliers" ON suppliers
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_select_movements" ON inventory_movements
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_movements" ON inventory_movements
    FOR INSERT TO authenticated WITH CHECK (true);

-- Permitir a usuarios autenticados actualizar el stock de productos
CREATE POLICY "auth_update_products_stock" ON products
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert_products" ON products
    FOR INSERT TO authenticated WITH CHECK (true);

-- =========================================================================
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en supabase.com
-- 2. Abre el Editor SQL (ícono de base de datos)
-- 3. Pega y ejecuta este script completo
-- 4. Verifica que las tablas aparezcan en Table Editor
-- =========================================================================
