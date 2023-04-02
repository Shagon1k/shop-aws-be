-- Cart Service DB tables (carts, cart_items) creation

-- Carts table creation
DROP TABLE if exists carts
create type status_enum as enum ('OPEN', 'ORDERED')
create table if not exists carts (
   id uuid primary key default uuid_generate_v4(),
   user_id uuid default uuid_generate_v4(), 			-- not foreign key as no user entity in db
   created_at date not null,							-- user's cart creation date
   updated_at date not null,							-- user's cart update date
   status status_enum									-- user's cart status - open or ordered
)

-- Cart items table creation
DROP TABLE if exists cart_items
create table if not exists cart_items (
   cart_id uuid,										-- user's cart id reference
   foreign key ("cart_id") references "carts" ("id"),
   product_id uuid, 									-- product item id
   count integer not null default 1             		-- product item's count
)

-- Users table creation
DROP TABLE if exists users
create table if not exists users (
   id uuid primary key default uuid_generate_v4(),
   name text not null,           -- user's name
   password text not null		  -- user's password
);
