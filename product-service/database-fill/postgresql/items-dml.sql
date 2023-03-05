-- Products Service DB tables (products, stocks) manipulation

-- Products table filling
INSERT INTO products (title, description, price, img_url) VALUES
('Mocha Italia Signature', 'Costa Coffee Mocha Italia Signature Blend Lungo Nespresso', 10, 'https://i.ibb.co/HHGMQXY/Costa-Coffee-Mocha-Italia-Signature-Blend-Lungo-Nespresso-Capsules-x3-48057-1630089333-386-513.jpg'),
('Signature Blend Lungo', 'Costa Coffee Nespresso Pods Signature Blend Lungo', 11, 'https://i.ibb.co/nzV4dWG/signature-blend-lungo.jpg'),
('Adirondack Blueberry', 'Made from 100% of the finest, hand-selected Arabica coffee with natural and artificial flavor.', 10, 'https://i.ibb.co/NZB9PKm/adirondack-blueberry.webp'),
('Starbucks Caffe Mocha', 'Starbucks Caffe Mocha Premium Instant Rich and Chocolatey', 11, 'https://i.ibb.co/J2rYzTt/starbucks-caffe-mocha.jpg'),
('Columbian Roast', 'Costa Coffee Nespresso Pods Columbian Roast Espresso', 10, 'https://i.ibb.co/x5cjY3b/columbian-roast.jpg'),
('The Lively Blend', 'Costa Coffee Nespresso Pods Ristretto The Lively Blend', 11, 'https://i.ibb.co/F7Jzpgz/the-lively-blend.jpg'),
('Signature Blend', 'Costa Coffee Nespresso Pods Signature Blend Espresso', 10, 'https://i.ibb.co/MMHRpQ2/signature-blend.jpg');

-- Stocks table filling
INSERT INTO stocks (count, product_id) VALUES
(12, 'paste_coffee-item_id_when_created'),
(13, 'paste_coffee-item_id_when_created'),
(12, 'paste_coffee-item_id_when_created'),
(13, 'paste_coffee-item_id_when_created'),
(12, 'paste_coffee-item_id_when_created'),
(13, 'paste_coffee-item_id_when_created'),
(12, 'paste_coffee-item_id_when_created');


-- All products selection
SELECT * FROM products

-- All stocks selection
SELECT * FROM stocks

-- All products with stocks selection
SELECT p.id, p.title, p.description, p.price, p.img_url, s.count FROM products p INNER JOIN stocks s ON (s.product_id = p.id)

-- Product with stock by ID
SELECT p.id, p.title, p.description, p.price, p.img_url, s.count FROM products p INNER JOIN stocks s ON (s.product_id = p.id) WHERE (p.id = 'paste_coffee-item_id')
