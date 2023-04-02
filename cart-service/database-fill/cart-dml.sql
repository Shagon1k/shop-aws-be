-- Cart Service DB tables (carts, cart_items) manipulation

-- Carts table filling
insert into carts (user_id, created_at, updated_at, status) values
('paste_random_user_uuid', '2023-03-30', '2023-03-31', 'ORDERED'),
('paste_random_user_uuid', '2023-03-31', '2023-04-01', 'OPEN'),
('paste_random_user_uuid', '2023-04-01', '2023-04-01', 'OPEN');

-- Cart items table filling
-- Note: product_id should be taken on existing DB: DynamoDB or PostgreSQL depending on which in use right now.
insert into cart_items (cart_id, product_id, count) values
('paste_cart_id_when_created', 'paste_product_id_when_created', 1),
('paste_cart_id_when_created', 'paste_product_id_when_created', 10),
('paste_cart_id_when_created', 'paste_product_id_when_created', 2),
('paste_cart_id_when_created', 'paste_product_id_when_created', 3);



-- All Carts selection
SELECT * FROM carts

-- All Cart items selection
SELECT * FROM cart_items

-- All Users selection
SELECT * FROM users

-- All Orders selection
SELECT * FROM orders
