-- Luna Bar Database Schema
-- Copy-paste този файл в pgAdmin или DBeaver и run-нете

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name_bg TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_de TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name_bg TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_de TEXT NOT NULL,
    description_bg TEXT,
    description_en TEXT,
    description_de TEXT,
    price_bgn DECIMAL(10,2) NOT NULL,
    price_eur DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    allergens TEXT[],
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title_bg TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_de TEXT NOT NULL,
    description_bg TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_de TEXT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    location TEXT NOT NULL,
    is_external BOOLEAN DEFAULT false,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bar Tables table
CREATE TABLE IF NOT EXISTS bar_tables (
    id TEXT PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    table_name TEXT,
    capacity INTEGER DEFAULT 4,
    location TEXT DEFAULT 'indoor',
    qr_code_url TEXT,
    qr_code_data TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    table_id TEXT REFERENCES bar_tables(id),
    table_number INTEGER NOT NULL,
    order_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    total_bgn DECIMAL(10,2) NOT NULL,
    total_eur DECIMAL(10,2) NOT NULL,
    notes TEXT,
    customer_name TEXT,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price_bgn DECIMAL(10,2) NOT NULL,
    price_eur DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waiter Calls table
CREATE TABLE IF NOT EXISTS waiter_calls (
    id TEXT PRIMARY KEY,
    table_id TEXT REFERENCES bar_tables(id),
    table_number INTEGER NOT NULL,
    call_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hype Sync Log table
CREATE TABLE IF NOT EXISTS hype_sync_log (
    id TEXT PRIMARY KEY,
    sync_type TEXT NOT NULL,
    status TEXT NOT NULL,
    data JSONB,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status ON waiter_calls(status);

-- Insert initial categories
INSERT INTO categories (id, name_bg, name_en, name_de, slug, "order") VALUES
('1', 'Алкохол', 'Alcohol', 'Alkohol', 'alcohol', 1),
('2', 'Кафе Costa', 'Costa Coffee', 'Costa Kaffee', 'costa-coffee', 2),
('3', 'Кафе Richard', 'Richard Coffee', 'Richard Kaffee', 'richard-coffee', 3),
('4', 'Топли Напитки', 'Hot Drinks', 'Heiße Getränke', 'hot-drinks', 4),
('5', 'Студени Напитки', 'Cold Drinks', 'Kalte Getränke', 'cold-drinks', 5),
('6', 'Фреш', 'Fresh Juices', 'Frische Säfte', 'fresh-juices', 6),
('7', 'Безалкохолни', 'Soft Drinks', 'Erfrischungsgetränke', 'soft-drinks', 7),
('8', 'Лимонади', 'Lemonades', 'Limonaden', 'lemonades', 8)
ON CONFLICT (id) DO NOTHING;

-- Insert 30 tables
INSERT INTO bar_tables (id, table_number, table_name, capacity, location, qr_code_url) VALUES
('1', 1, 'Маса 1', 4, 'indoor', 'http://localhost:3000/order?table=1'),
('2', 2, 'Маса 2', 4, 'indoor', 'http://localhost:3000/order?table=2'),
('3', 3, 'Маса 3', 4, 'indoor', 'http://localhost:3000/order?table=3'),
('4', 4, 'Маса 4', 4, 'indoor', 'http://localhost:3000/order?table=4'),
('5', 5, 'Маса 5', 4, 'indoor', 'http://localhost:3000/order?table=5'),
('6', 6, 'Маса 6', 4, 'indoor', 'http://localhost:3000/order?table=6'),
('7', 7, 'Маса 7', 4, 'indoor', 'http://localhost:3000/order?table=7'),
('8', 8, 'Маса 8', 4, 'indoor', 'http://localhost:3000/order?table=8'),
('9', 9, 'Маса 9', 4, 'indoor', 'http://localhost:3000/order?table=9'),
('10', 10, 'Маса 10', 4, 'indoor', 'http://localhost:3000/order?table=10'),
('11', 11, 'Маса 11', 4, 'indoor', 'http://localhost:3000/order?table=11'),
('12', 12, 'Маса 12', 4, 'indoor', 'http://localhost:3000/order?table=12'),
('13', 13, 'Маса 13', 4, 'indoor', 'http://localhost:3000/order?table=13'),
('14', 14, 'Маса 14', 4, 'indoor', 'http://localhost:3000/order?table=14'),
('15', 15, 'Маса 15', 4, 'indoor', 'http://localhost:3000/order?table=15'),
('16', 16, 'Маса 16', 4, 'indoor', 'http://localhost:3000/order?table=16'),
('17', 17, 'Маса 17', 4, 'indoor', 'http://localhost:3000/order?table=17'),
('18', 18, 'Маса 18', 4, 'indoor', 'http://localhost:3000/order?table=18'),
('19', 19, 'Маса 19', 4, 'indoor', 'http://localhost:3000/order?table=19'),
('20', 20, 'Маса 20', 4, 'indoor', 'http://localhost:3000/order?table=20'),
('21', 21, 'Маса 21', 4, 'terrace', 'http://localhost:3000/order?table=21'),
('22', 22, 'Маса 22', 4, 'terrace', 'http://localhost:3000/order?table=22'),
('23', 23, 'Маса 23', 4, 'terrace', 'http://localhost:3000/order?table=23'),
('24', 24, 'Маса 24', 4, 'terrace', 'http://localhost:3000/order?table=24'),
('25', 25, 'Маса 25', 4, 'terrace', 'http://localhost:3000/order?table=25'),
('26', 26, 'Маса 26', 2, 'bar', 'http://localhost:3000/order?table=26'),
('27', 27, 'Маса 27', 2, 'bar', 'http://localhost:3000/order?table=27'),
('28', 28, 'Маса 28', 2, 'bar', 'http://localhost:3000/order?table=28'),
('29', 29, 'Маса 29', 2, 'bar', 'http://localhost:3000/order?table=29'),
('30', 30, 'Маса 30', 2, 'bar', 'http://localhost:3000/order?table=30')
ON CONFLICT (table_number) DO NOTHING;

-- Success message
SELECT '✅ Database setup complete!' as message;
SELECT '📊 Created:' as message;
SELECT '   - 9 tables' as message;
SELECT '   - 8 categories' as message;
SELECT '   - 30 bar tables' as message;


