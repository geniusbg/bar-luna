-- Make qrmenu user the owner of all tables in qrmenu database
-- Run this as current owner (drborislavpetrov) or as postgres superuser

-- Option 1: Make qrmenu owner of the entire database
-- (This gives ownership of all current and future objects)
ALTER DATABASE qrmenu OWNER TO qrmenu;

-- Option 2: Make qrmenu owner of all tables in public schema
-- (Run this if Option 1 doesn't work or you want more granular control)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO qrmenu';
        RAISE NOTICE 'Changed owner of table: %', r.tablename;
    END LOOP;
END $$;

-- Option 3: Make qrmenu owner of all sequences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' OWNER TO qrmenu';
        RAISE NOTICE 'Changed owner of sequence: %', r.sequence_name;
    END LOOP;
END $$;

-- Verify ownership
SELECT 
    tablename,
    pg_get_userbyid(c.relowner) as owner
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

