-- EcoCycle database schema (Neon Postgres)
create extension if not exists pgcrypto;

create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  username       text not null unique,
  email          text not null unique,
  password_hash  text not null,
  avatar_url     text,
  bio            text,
  city           text default 'Jakarta',
  is_demo        boolean not null default false,
  points_balance integer not null default 0,
  lifetime_points integer not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists rides (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  title        text not null default 'Ride',
  note         text,
  status       text not null default 'active',           -- active | completed
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  duration_s   integer not null default 0,
  moving_s     integer not null default 0,
  distance_m   double precision not null default 0,
  avg_speed    double precision not null default 0,      -- km/h
  max_speed    double precision not null default 0,      -- km/h
  elev_gain    double precision not null default 0,      -- meter
  calories     integer not null default 0,
  co2_kg       double precision not null default 0,
  points       integer not null default 0,
  polyline     jsonb not null default '[]'::jsonb,       -- simplified [[lat,lng], ...]
  profile      jsonb not null default '[]'::jsonb,       -- sampel {d, alt, spd} untuk grafik
  track_url    text,                                     -- pathname track penuh (JSON) di Vercel Blob
  last_lat     double precision,
  last_lng     double precision,
  last_ping    timestamptz,
  created_at   timestamptz not null default now()
);
-- migrasi untuk database yang dibuat sebelum kolom profile ada
alter table rides add column if not exists profile jsonb not null default '[]'::jsonb;

create index if not exists rides_user_started_idx on rides (user_id, started_at desc);
create index if not exists rides_status_idx on rides (status, last_ping desc);

create table if not exists kudos (
  ride_id    uuid not null references rides(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ride_id, user_id)
);

create table if not exists rewards (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  brand       text not null,
  title       text not null,
  value_label text not null,
  points_cost integer not null,
  accent      text not null default '#22c55e',
  stock       integer not null default 100,
  active      boolean not null default true,
  sort_order  integer not null default 0
);

create table if not exists redemptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  reward_id    uuid not null references rewards(id) on delete cascade,
  points_spent integer not null,
  code         text not null,
  status       text not null default 'issued',
  created_at   timestamptz not null default now()
);
create index if not exists redemptions_user_idx on redemptions (user_id, created_at desc);

create table if not exists achievements (
  code        text primary key,
  name        text not null,
  description text not null,
  icon        text not null default 'award',
  metric      text not null,      -- distance_total | ride_count | co2_total | ride_distance | streak
  threshold   double precision not null,
  sort_order  integer not null default 0
);

create table if not exists user_achievements (
  user_id     uuid not null references users(id) on delete cascade,
  code        text not null references achievements(code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);
