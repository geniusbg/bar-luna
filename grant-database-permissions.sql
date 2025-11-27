-- Grant all permissions on qrmenu database to application user
-- Run this as database owner/admin

-- Replace 'your_app_user' with the actual database user from DATABASE_URL
-- You can find it in your .env file: DATABASE_URL="postgresql://USERNAME:password@host:port/qrmenu"

-- Option 1: Grant all privileges on database (recommended)
GRANT ALL PRIVILEGES ON DATABASE qrmenu TO your_app_user;

-- Option 2: Grant all privileges on all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Option 3: Grant privileges on future tables too (so new tables get permissions automatically)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO your_app_user;

-- If you want to allow the user to create tables too:
GRANT CREATE ON SCHEMA public TO your_app_user;

