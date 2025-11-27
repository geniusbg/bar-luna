-- Simple version: Make qrmenu owner of qrmenu database
-- This automatically makes qrmenu owner of all objects in the database
-- Run this as postgres superuser or current owner (drborislavpetrov)

ALTER DATABASE qrmenu OWNER TO qrmenu;

-- Verify
SELECT datname, pg_get_userbyid(datdba) as owner 
FROM pg_database 
WHERE datname = 'qrmenu';

