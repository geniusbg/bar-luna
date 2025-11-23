-- Performance indexes for statistics queries
-- These indexes significantly speed up date range queries and aggregations

-- Index for revenue statistics: date range queries with status filter
-- Used by: /api/stats/revenue
CREATE INDEX IF NOT EXISTS idx_orders_created_status 
ON orders(created_at, status) 
WHERE status = 'completed';

-- Index for table statistics: group by table with date range
-- Used by: /api/stats/tables
CREATE INDEX IF NOT EXISTS idx_orders_table_status_created 
ON orders(table_number, status, created_at) 
WHERE status = 'completed';

-- Index for order items join performance
-- Used by: /api/stats/products (joins order_items -> orders)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Composite index for order items with order status filtering
-- This helps when filtering order_items by order status and date
CREATE INDEX IF NOT EXISTS idx_orders_id_status_created 
ON orders(id, status, created_at) 
WHERE status = 'completed';

-- Index for date-only queries (when grouping by DATE(created_at))
-- PostgreSQL can use this for DATE() function in GROUP BY
CREATE INDEX IF NOT EXISTS idx_orders_created_date 
ON orders((DATE(created_at)), status) 
WHERE status = 'completed';

