-- Products Service DB tables (products, stocks) creation

-- Products table creation
DROP TABLE products
CREATE TABLE IF NOT EXISTS products (
    id uuid primary key default uuid_generate_v4(),
    title text not null,                 -- coffee items's name
    description text not null,           -- coffee items's description
    price integer not null,              -- coffee items's price
    img_url text not null                -- coffee items's image url
)

-- Stocks table creation
DROP TABLE stocks
CREATE TABLE IF NOT EXISTS stocks (
    id uuid primary key default uuid_generate_v4(),
    count integer not null,             -- coffee item's stock level
    product_id uuid,                    -- related coffee item's id
    foreign key ("product_id") references "products" ("id")
)
