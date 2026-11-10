-- =========================================================
-- TABLAS QUE FALTAN EN SUPABASE
-- Pegalo en el SQL Editor de Supabase y apreta Run.
-- Es seguro ejecutarlo varias veces (usa IF NOT EXISTS).
-- =========================================================

-- Tabla que usa el codigo (models/authModel.js)
create table if not exists usuarios (
  id     uuid primary key references auth.users(id) on delete cascade,
  email  text not null unique,
  nombre text not null,
  creado timestamptz not null default now()
);

-- Tablas del esquema del TP (db/esquema.sql)
create table if not exists perfiles (
  id     uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol    text not null default 'cliente' check (rol in ('cliente', 'admin'))
);

create table if not exists pedidos (
  id         bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users(id),
  total      numeric(10,2) not null check (total >= 0),
  estado     text not null default 'pendiente'
             check (estado in ('pendiente', 'confirmado', 'cancelado')),
  creado     timestamptz not null default now()
);

create table if not exists pedido_items (
  id              bigint generated always as identity primary key,
  pedido_id       bigint not null references pedidos(id) on delete cascade,
  producto_id     bigint not null references productos(id),
  cantidad        int not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null check (precio_unitario >= 0)
);

-- Cerramos las tablas al publico (el backend entra con la clave secreta)
alter table usuarios     enable row level security;
alter table perfiles     enable row level security;
alter table pedidos      enable row level security;
alter table pedido_items enable row level security;
