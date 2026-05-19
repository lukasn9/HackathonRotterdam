-- Run this in your Supabase SQL editor

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  access_code text not null unique,
  title text not null,
  current_line_index integer not null default -1,
  is_playing boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists attendees (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  institution text not null default '',
  field_of_study text not null,
  proficiency_level text not null,
  joined_at timestamptz not null default now()
);

-- One active reaction per attendee; cleared after 5s lock expires
create table if not exists current_reactions (
  attendee_id uuid primary key references attendees(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  emoji text not null,
  updated_at timestamptz not null default now()
);

-- Append-only log of every reaction click
create table if not exists reaction_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  attendee_id uuid not null references attendees(id) on delete cascade,
  attendee_name text not null,
  emoji text not null,
  line_index integer not null default -1,
  created_at timestamptz not null default now()
);

-- Enable Realtime on rooms so clients get live transcript updates
alter publication supabase_realtime add table rooms;
