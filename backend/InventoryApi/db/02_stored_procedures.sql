-- =============================================
-- Stored Procedures y Functions - Inventario CCL
-- =============================================

-- 1. SP: Registrar entrada de inventario
CREATE OR REPLACE PROCEDURE sp_register_entry(
    p_product_id INT,
    p_quantity INT,
    p_user_id INT,
    p_note TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock INT;
BEGIN
    -- Validar cantidad positiva
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
    END IF;

    -- Obtener stock actual con bloqueo de fila
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto no encontrado o inactivo (id=%)', p_product_id;
    END IF;

    -- Insertar movimiento
    INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, note, user_id)
    VALUES (p_product_id, 'IN', p_quantity, v_current_stock, v_current_stock + p_quantity, p_note, p_user_id);

    -- Actualizar stock del producto
    UPDATE products
    SET stock = stock + p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
END;
$$;

-- 2. SP: Registrar salida de inventario
CREATE OR REPLACE PROCEDURE sp_register_exit(
    p_product_id INT,
    p_quantity INT,
    p_user_id INT,
    p_note TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock INT;
BEGIN
    -- Validar cantidad positiva
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
    END IF;

    -- Obtener stock actual con bloqueo de fila
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto no encontrado o inactivo (id=%)', p_product_id;
    END IF;

    -- Validar stock suficiente
    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponible: %, solicitado: %', v_current_stock, p_quantity;
    END IF;

    -- Insertar movimiento
    INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, note, user_id)
    VALUES (p_product_id, 'OUT', p_quantity, v_current_stock, v_current_stock - p_quantity, p_note, p_user_id);

    -- Actualizar stock del producto
    UPDATE products
    SET stock = stock - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
END;
$$;

-- 3. FUNCTION: Consultar inventario actual
CREATE OR REPLACE FUNCTION fn_current_inventory()
RETURNS TABLE (
    product_id INT,
    product_code VARCHAR,
    product_name VARCHAR,
    description TEXT,
    current_stock INT,
    min_stock INT,
    is_low_stock BOOLEAN,
    last_entry_date TIMESTAMP,
    last_exit_date TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.code,
        p.name,
        p.description,
        p.stock,
        p.min_stock,
        (p.stock <= p.min_stock) AS is_low_stock,
        (SELECT MAX(im.created_at) FROM inventory_movements im WHERE im.product_id = p.id AND im.movement_type = 'IN') AS last_entry_date,
        (SELECT MAX(im.created_at) FROM inventory_movements im WHERE im.product_id = p.id AND im.movement_type = 'OUT') AS last_exit_date
    FROM products p
    WHERE p.is_active = TRUE
    ORDER BY p.id;
END;
$$;

-- 4. FUNCTION: Historial de movimientos (con filtros)
-- NOTA: Usa TIMESTAMPTZ para compatibilidad con Npgsql/.NET
DROP FUNCTION IF EXISTS fn_movement_history(INT, VARCHAR, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS fn_movement_history(INT, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION fn_movement_history(
    p_product_id INT DEFAULT NULL,
    p_movement_type VARCHAR DEFAULT NULL,
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    movement_id INT,
    product_code VARCHAR,
    product_name VARCHAR,
    movement_type VARCHAR,
    quantity INT,
    previous_stock INT,
    new_stock INT,
    note TEXT,
    username VARCHAR,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        im.id,
        p.code,
        p.name,
        im.movement_type,
        im.quantity,
        im.previous_stock,
        im.new_stock,
        im.note,
        u.username,
        im.created_at
    FROM inventory_movements im
    JOIN products p ON p.id = im.product_id
    JOIN users u ON u.id = im.user_id
    WHERE (p_product_id IS NULL OR im.product_id = p_product_id)
      AND (p_movement_type IS NULL OR im.movement_type = p_movement_type)
      AND (p_date_from IS NULL OR im.created_at >= p_date_from)
      AND (p_date_to IS NULL OR im.created_at <= p_date_to)
    ORDER BY im.created_at DESC;
END;
$$;
