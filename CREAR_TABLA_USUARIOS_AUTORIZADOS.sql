-- =========================================================================
-- CREACIONES SCARLET — GESTIÓN DINÁMICA DE USUARIOS AUTORIZADOS
-- Ejecuta este script en Supabase > SQL Editor para poder agregar o quitar
-- correos de tu equipo directamente desde Supabase sin tocar código.
-- =========================================================================

CREATE TABLE IF NOT EXISTS authorized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'team', -- 'admin' o 'team'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de los correos autorizados para el login
CREATE POLICY "Public read authorized_users" ON authorized_users
    FOR SELECT USING (true);

-- Permitir gestión a usuarios autenticados
CREATE POLICY "Auth manage authorized_users" ON authorized_users
    FOR ALL TO authenticated USING (true);

-- Insertar el correo inicial si no existe
INSERT INTO authorized_users (email, role)
VALUES ('analistadedatosnova@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =========================================================================
-- EJEMPLO PARA AGREGAR NUEVOS MIEMBROS DE TU EQUIPO DESDE SQL:
--
-- INSERT INTO authorized_users (email, role) 
-- VALUES ('tucorreo@gmail.com', 'team');
-- =========================================================================
